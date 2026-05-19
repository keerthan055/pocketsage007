from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import User, Transaction, BankConnection
from core.security import get_current_user
from datetime import datetime
import pandas as pd
import io
from typing import List

router = APIRouter(tags=["transactions"])

@router.get("/")
def get_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.desc()).all()

@router.post("/")
def create_transaction(
    category: str = Form(...),
    amount: float = Form(...),
    type: str = Form(...),
    date: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        new_txn = Transaction(
            user_id=current_user.id,
            category=category,
            amount=amount,
            type=type,
            date=datetime.fromisoformat(date)
        )
        db.add(new_txn)
        db.commit()
        db.refresh(new_txn)
        
        # Trigger FDS recalculation
        try:
            from core.fds_engine import calculate_and_save_fds
            calculate_and_save_fds(db, current_user.id)
        except Exception as fds_err:
            print(f"FDS calc error: {fds_err}")
            
        return new_txn
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Clean column names for matching
        original_cols = list(df.columns)
        clean_cols = [str(c).lower().strip().replace('_', ' ').replace('-', ' ') for c in df.columns]
        df.columns = clean_cols
        
        def find_col_idx(keywords):
            for i, col in enumerate(clean_cols):
                if any(kw in col for kw in keywords):
                    return original_cols[i]
            return None

        cat_key = find_col_idx(["category", "desc", "operation", "title", "merchant", "item", "index"])
        amt_key = find_col_idx(["amount", "volume", "value", "price", "cost", "sum", "total"])
        type_key = find_col_idx(["type", "vector", "transaction type", "dir", "direction"])
        date_key = find_col_idx(["date", "time", "temporal", "timestamp", "day"])
        
        # Restore original column casing for lookups
        df.columns = original_cols
        
        def parse_amount(val):
            if pd.isna(val):
                return 0.0
            val_str = str(val).replace('$', '').replace('₹', '').replace(',', '').strip()
            try:
                return float(val_str)
            except ValueError:
                return 0.0

        def parse_date(val):
            if pd.isna(val):
                return datetime.utcnow()
            val_str = str(val).strip()
            try:
                return datetime.fromisoformat(val_str)
            except ValueError:
                for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S"):
                    try:
                        return datetime.strptime(val_str, fmt)
                    except ValueError:
                        continue
                return datetime.utcnow()

        def parse_type(val):
            if pd.isna(val):
                return "Expense"
            val_str = str(val).strip().lower()
            if any(kw in val_str for kw in ["inc", "credit", "in"]):
                return "Income"
            return "Expense"

        for _, row in df.iterrows():
            cat_val = row.get(cat_key, "Other") if cat_key else "Other"
            amt_val = parse_amount(row.get(amt_key, 0.0)) if amt_key else 0.0
            type_val = parse_type(row.get(type_key, "Expense")) if type_key else "Expense"
            date_val = parse_date(row.get(date_key, None)) if date_key else datetime.utcnow()
            
            if isinstance(cat_val, str):
                cat_val = cat_val.strip()
            else:
                cat_val = str(cat_val)
                
            txn = Transaction(
                user_id=current_user.id,
                category=cat_val,
                amount=amt_val,
                type=type_val,
                date=date_val
            )
            db.add(txn)
        
        db.commit()
        
        try:
            from core.fds_engine import calculate_and_save_fds
            calculate_and_save_fds(db, current_user.id)
        except Exception as fds_err:
            print(f"FDS calc error: {fds_err}")
            
        return {"message": f"Successfully imported {len(df)} transactions."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"CSV Error: {str(e)}")

@router.post("/bank/sync")
def sync_bank(
    bank_name: str = Form(...),
    account_type: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_conn = BankConnection(
        user_id=current_user.id,
        bank_name=bank_name,
        account_type=account_type,
        balance=50000.0,
        last_synced=datetime.utcnow()
    )
    db.add(new_conn)
    db.commit()
    
    # Trigger FDS recalculation
    try:
        from core.fds_engine import calculate_and_save_fds
        calculate_and_save_fds(db, current_user.id)
    except Exception as fds_err:
        print(f"FDS calc error: {fds_err}")
        
    return {"status": "success", "message": f"Linked {bank_name} successfully."}

@router.get("/subscriptions")
def get_subscriptions(current_user: User = Depends(get_current_user)):
    return [
        {"name": "Netflix", "amount": 19.99, "status": "Frequent Usage", "risk": "Low"},
        {"name": "Gym Membership", "amount": 45.00, "status": "Zero Usage", "risk": "High"},
        {"name": "Adobe CC", "amount": 52.99, "status": "Medium Usage", "risk": "Medium"}
    ]
