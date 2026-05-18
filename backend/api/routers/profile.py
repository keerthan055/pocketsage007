from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.security import get_current_user
from models.models import User, UserProfile, UserActivityLog, FinancialMetrics
from schemas.schemas import UserProfile as UserProfileSchema, UserProfileUpdate, UserActivity

router = APIRouter()

@router.get("/", response_model=UserProfileSchema)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/update", response_model=UserProfileSchema)
def update_profile(profile_in: UserProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    update_data = profile_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    
    # Log activity
    log = UserActivityLog(user_id=current_user.id, activity_type="Update", description="Updated profile information")
    db.add(log)
    
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/activity", response_model=List[UserActivity])
def get_activity(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activities = db.query(UserActivityLog).filter(UserActivityLog.user_id == current_user.id).order_by(UserActivityLog.timestamp.desc()).limit(20).all()
    return activities

@router.get("/financial-summary")
def get_financial_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    metrics = db.query(FinancialMetrics).filter(FinancialMetrics.user_id == current_user.id).first()
    if not metrics:
        return {
            "health_score": 0,
            "monthly_income": 0,
            "savings": 0,
            "debt": 0,
            "risk_level": "N/A"
        }
    
    # Normally we'd calculate these from transactions, but for summary we return metrics
    return {
        "health_score": metrics.health_score or 0,
        "monthly_income": 5000, # Placeholder or calc from transactions
        "savings": 15000, # Placeholder
        "debt": 2000, # Placeholder
        "risk_level": "Low" # Placeholder
    }
