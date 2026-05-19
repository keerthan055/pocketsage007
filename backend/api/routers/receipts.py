import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from models.models import User, ReceiptScan, Transaction, TransactionType
from datetime import datetime
import uuid

router = APIRouter(tags=["receipts"])

# Ensure upload directory exists
UPLOAD_DIR = "uploads/receipts"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Securely upload a receipt image for OCR processing."""
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Store archival record
    db_scan = ReceiptScan(
        user_id=current_user.id,
        image_url=file_path,
        created_at=datetime.utcnow()
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    
    return {"scan_id": db_scan.id, "image_url": file_path}

@router.post("/confirm")
async def confirm_receipt_transaction(
    scan_id: int = Form(...),
    merchant_name: str = Form(...),
    amount: float = Form(...),
    category: str = Form(...),
    transaction_date: str = Form(...),
    ocr_text: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm and commit the OCR-extracted data into the production ledger."""
    db_scan = db.query(ReceiptScan).filter(ReceiptScan.id == scan_id, ReceiptScan.user_id == current_user.id).first()
    if not db_scan:
        raise HTTPException(status_code=404, detail="Scan record not found")
    
    # Update archival record with OCR data
    db_scan.merchant_name = merchant_name
    db_scan.amount = amount
    db_scan.category = category
    db_scan.transaction_date = datetime.fromisoformat(transaction_date)
    db_scan.ocr_text = ocr_text
    
    # Create production transaction
    new_transaction = Transaction(
        user_id=current_user.id,
        amount=amount,
        category=category,
        type=TransactionType.EXPENSE,
        description=f"AI Scan: {merchant_name}",
        date=datetime.fromisoformat(transaction_date)
    )
    
    db.add(new_transaction)
    db.commit()
    
    # Trigger FDS recalculation
    try:
        from core.fds_engine import calculate_and_save_fds
        calculate_and_save_fds(db, current_user.id)
    except Exception as fds_err:
        print(f"FDS calc error: {fds_err}")
        
    return {"status": "success", "transaction_id": new_transaction.id}
