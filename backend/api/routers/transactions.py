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
        
        for _, row in df.iterrows():
            txn = Transaction(
                user_id=current_user.id,
                category=row.get('Category', 'Other'),
                amount=float(row.get('Amount', 0)),
                type=row.get('Type', 'Expense'),
                date=datetime.utcnow()
            )
            db.add(txn)
        
        db.commit()
        
        # Trigger FDS recalculation
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
