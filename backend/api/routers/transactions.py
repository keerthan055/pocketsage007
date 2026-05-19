from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import User, Transaction, BankConnection, TransactionType
from core.security import get_current_user
from datetime import datetime
import pandas as pd
import io
from typing import List, Optional
from pydantic import BaseModel

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

class BulkTransactionItem(BaseModel):
    category: str
    amount: float
    type: str
    date: str
    description: Optional[str] = ""

@router.post("/bulk")
def create_transactions_bulk(
    items: List[BulkTransactionItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        print(f"[DEBUG] Bulk insertion request received: {len(items)} items")
        inserted_txns = []
        for item in items:
            try:
                dt_val = datetime.fromisoformat(item.date.replace('Z', ''))
            except Exception:
                try:
                    dt_val = datetime.strptime(item.date, "%Y-%m-%d")
                except Exception:
                    dt_val = datetime.utcnow()
                    
            # Safely resolve to TransactionType enum member
            type_str = (item.type or "").strip().upper()
            try:
                resolved_type = TransactionType[type_str]
            except KeyError:
                # fallback by scanning values or default to EXPENSE
                type_val_lower = type_str.lower()
                if "inc" in type_val_lower or "credit" in type_val_lower:
                    resolved_type = TransactionType.INCOME
                elif "trans" in type_val_lower:
                    resolved_type = TransactionType.TRANSFER
                elif "invest" in type_val_lower:
                    resolved_type = TransactionType.INVESTMENT
                else:
                    resolved_type = TransactionType.EXPENSE

            txn = Transaction(
                user_id=current_user.id,
                amount=item.amount,
                category=item.category,
                type=resolved_type,
                description=item.description or "",
                date=dt_val
            )
            db.add(txn)
            inserted_txns.append(txn)
            print(f"[DEBUG] Bulk parsed transaction: amount={txn.amount}, category={txn.category}, type={txn.type}, date={txn.date}, description={txn.description}")

        db.commit()
        print(f"[DEBUG] Bulk commit success: {len(inserted_txns)} transactions inserted.")
        
        # Trigger FDS recalculation
        try:
            from core.fds_engine import calculate_and_save_fds
            calculate_and_save_fds(db, current_user.id)
            print("[DEBUG] FDS score engine updated successfully.")
        except Exception as fds_err:
            print(f"[DEBUG] FDS calc error: {fds_err}")
            
        return {"message": f"Successfully imported {len(inserted_txns)} transactions."}
    except Exception as e:
        db.rollback()
        print(f"[DEBUG] Bulk upload error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        contents = await file.read()
        filename_lower = file.filename.lower()
        
        print(f"[DEBUG] Upload received: {file.filename}")
        
        # Load DataFrame using pandas
        if filename_lower.endswith(('.xlsx', '.xls')):
            try:
                df = pd.read_excel(io.BytesIO(contents))
            except Exception as excel_err:
                print(f"[DEBUG] Excel load error: {excel_err}")
                raise HTTPException(status_code=400, detail="Invalid transaction format")
        else:
            try:
                df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
            except Exception as dec_err:
                print(f"[DEBUG] UTF-8 decode failed: {dec_err}. Trying Latin-1.")
                try:
                    df = pd.read_csv(io.StringIO(contents.decode('latin-1')))
                except Exception as lat_err:
                    print(f"[DEBUG] Latin-1 decode failed: {lat_err}")
                    raise HTTPException(status_code=400, detail="Invalid transaction format")
                    
        print(f"[DEBUG] Loaded DataFrame columns: {list(df.columns)}")
        print(f"[DEBUG] Raw shape: {df.shape}")
        
        original_cols = list(df.columns)
        clean_cols = [str(c).lower().strip().replace('_', ' ').replace('-', ' ') for c in df.columns]
        
        def find_col_idx(keywords):
            for i, col in enumerate(clean_cols):
                if any(kw in col for kw in keywords):
                    return original_cols[i]
            return None

        # Look for headers
        cat_key = find_col_idx(["category", "merchant", "item", "index"])
        amt_key = find_col_idx(["amount", "volume", "value", "price", "cost", "sum", "total"])
        type_key = find_col_idx(["type", "vector", "transaction type", "dir", "direction"])
        date_key = find_col_idx(["date", "time", "temporal", "timestamp", "day"])
        desc_key = find_col_idx(["desc", "operation", "title", "notes", "memo"])
        
        print(f"[DEBUG] Detected headers -> cat_key: {cat_key}, amt_key: {amt_key}, type_key: {type_key}, date_key: {date_key}, desc_key: {desc_key}")

        # Check if we should fall back to positional mapping
        use_positional = False
        valid_keys_count = sum(1 for k in [cat_key, amt_key, type_key, date_key] if k is not None)
        if valid_keys_count < 3:
            if df.shape[1] >= 4:
                print("[DEBUG] Insufficient header matches. Falling back to positional mapping: Col 0=Date, Col 1=Amount, Col 2=Category, Col 3=Type, Col 4=Description")
                use_positional = True
            else:
                print("[DEBUG] Format validation failed: Too few columns and header matches.")
                raise HTTPException(status_code=400, detail="Invalid transaction format")

        def parse_amount(val):
            if pd.isna(val):
                return None
            val_str = str(val).replace('$', '').replace('₹', '').replace(',', '').strip()
            try:
                return float(val_str)
            except ValueError as e:
                print(f"[DEBUG] Amount parsing error for value '{val}': {e}")
                return None

        def parse_date(val):
            if pd.isna(val):
                return None
            val_str = str(val).strip()
            try:
                return datetime.fromisoformat(val_str)
            except ValueError:
                for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S", "%d-%m-%Y"):
                    try:
                        return datetime.strptime(val_str, fmt)
                    except ValueError:
                        continue
                print(f"[DEBUG] Date parsing failed for value '{val}'")
                return None

        def parse_type(val):
            if pd.isna(val):
                return "Expense"
            val_str = str(val).strip().title() # Capitalize like "Income", "Expense", "Transfer", "Investment"
            if "Inc" in val_str:
                return "Income"
            if "Exp" in val_str:
                return "Expense"
            if "Trans" in val_str:
                return "Transfer"
            if "Invest" in val_str:
                return "Investment"
            return val_str

        parsed_rows = []
        failed_rows = []
        
        for idx, row in df.iterrows():
            if use_positional:
                date_val = parse_date(row.iloc[0])
                amt_val = parse_amount(row.iloc[1])
                cat_val = str(row.iloc[2]).strip() if not pd.isna(row.iloc[2]) else None
                type_val = parse_type(row.iloc[3])
                desc_val = str(row.iloc[4]).strip() if (df.shape[1] > 4 and not pd.isna(row.iloc[4])) else ""
            else:
                date_val = parse_date(row.get(date_key)) if date_key else datetime.utcnow()
                amt_val = parse_amount(row.get(amt_key)) if amt_key else None
                cat_val = str(row.get(cat_key)).strip() if (cat_key and not pd.isna(row.get(cat_key))) else None
                type_val = parse_type(row.get(type_key)) if type_key else "Expense"
                desc_val = str(row.get(desc_key)).strip() if (desc_key and not pd.isna(row.get(desc_key))) else ""

            if date_val is None or amt_val is None or not cat_val:
                reason = []
                if date_val is None: reason.append("date invalid/missing")
                if amt_val is None: reason.append("amount invalid/missing")
                if not cat_val: reason.append("category missing")
                failed_rows.append({"index": idx, "row_data": dict(row), "reason": ", ".join(reason)})
                continue
                
            txn = Transaction(
                user_id=current_user.id,
                amount=amt_val,
                category=cat_val,
                type=type_val,
                description=desc_val,
                date=date_val
            )
            db.add(txn)
            parsed_rows.append(txn)
            print(f"[DEBUG] Parsed transaction object: amount={txn.amount}, category={txn.category}, type={txn.type}, date={txn.date}, description={txn.description}")

        # If zero transactions parsed successfully, reject with error
        if not parsed_rows:
            print(f"[DEBUG] Upload failed: 0 rows parsed. Failed rows: {failed_rows}")
            raise HTTPException(status_code=400, detail="Invalid transaction format")
            
        db.commit()
        print(f"[DEBUG] Successfully committed {len(parsed_rows)} transactions. Failed count: {len(failed_rows)}")
        
        # Trigger FDS recalculation
        try:
            from core.fds_engine import calculate_and_save_fds
            calculate_and_save_fds(db, current_user.id)
            print("[DEBUG] FDS score engine updated successfully.")
        except Exception as fds_err:
            print(f"[DEBUG] FDS calc error: {fds_err}")
            
        return {"message": f"Successfully imported {len(parsed_rows)} transactions."}
        
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        print(f"[DEBUG] General upload error: {e}")
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
