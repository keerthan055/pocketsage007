from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from models.models import User, Alert

router = APIRouter(tags=["alerts"])

@router.get("/")
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Alert).filter(Alert.user_id == current_user.id).order_by(Alert.created_at.desc()).all()

@router.post("/{alert_id}/read")
def mark_alert_as_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if alert:
        alert.is_read = True
        db.commit()
        return {"status": "success"}
    return {"status": "failed", "message": "Alert not found"}

@router.post("/read-all")
def mark_all_alerts_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Alert).filter(Alert.user_id == current_user.id, Alert.is_read == False).update({Alert.is_read: True}, synchronize_session=False)
    db.commit()
    return {"status": "success"}
