from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from models.models import User, UserSettings, NotificationPreferences, FinancialPreferences
from schemas.schemas import UserSettingsUpdate, NotificationPrefsUpdate, FinancialPrefsUpdate

router = APIRouter()

@router.get("/")
def get_all_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    notifications = db.query(NotificationPreferences).filter(NotificationPreferences.user_id == current_user.id).first()
    financial = db.query(FinancialPreferences).filter(FinancialPreferences.user_id == current_user.id).first()
    
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
    if not notifications:
        notifications = NotificationPreferences(user_id=current_user.id)
        db.add(notifications)
    if not financial:
        financial = FinancialPreferences(user_id=current_user.id)
        db.add(financial)
        
    db.commit()
    db.refresh(settings)
    db.refresh(notifications)
    db.refresh(financial)
    
    return {
        "appearance": settings,
        "notifications": notifications,
        "financial": financial
    }

@router.put("/update", response_model=UserSettingsUpdate)
def update_appearance(settings_in: UserSettingsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    update_data = settings_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings

@router.put("/notifications", response_model=NotificationPrefsUpdate)
def update_notifications(prefs_in: NotificationPrefsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prefs = db.query(NotificationPreferences).filter(NotificationPreferences.user_id == current_user.id).first()
    update_data = prefs_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(prefs, key, value)
    db.commit()
    db.refresh(prefs)
    return prefs

@router.put("/financial", response_model=FinancialPrefsUpdate)
def update_financial_prefs(prefs_in: FinancialPrefsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prefs = db.query(FinancialPreferences).filter(FinancialPreferences.user_id == current_user.id).first()
    update_data = prefs_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(prefs, key, value)
    db.commit()
    db.refresh(prefs)
    return prefs

@router.delete("/account")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # In a real app, we'd delete all related data or mark as deleted
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}
