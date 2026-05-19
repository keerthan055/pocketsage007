from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from core.database import get_db
from models import models
from core.security import get_current_user
from datetime import datetime
from typing import List

router = APIRouter(tags=["goals"])

@router.get("/")
def get_goals(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.FinancialGoal).filter(models.FinancialGoal.user_id == current_user.id).all()

@router.post("/")
def create_goal(
    name: str = Form(...),
    target_amount: float = Form(...),
    category: str = Form(...),
    deadline: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_goal = models.FinancialGoal(
        user_id=current_user.id,
        name=name,
        target_amount=target_amount,
        current_amount=0,
        category=category,
        deadline=datetime.fromisoformat(deadline)
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    
    try:
        from core.fds_engine import calculate_and_save_fds
        calculate_and_save_fds(db, current_user.id)
    except Exception as fds_err:
        print(f"FDS calc error: {fds_err}")

    try:
        from core import gamification
        gamification.add_xp(db, current_user.id, 50)
        gamification.log_activity(db, current_user.id, "Goal", f"Deployed strategic goal: {name}")
    except Exception as gem_err:
        print(f"Gamification XP error: {gem_err}")
        
    return new_goal

@router.get("/gamification")
def get_gamification_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    from core import gamification
    try:
        gamification.update_streak(db, current_user.id)
        gamification.log_activity(db, current_user.id, "View", "Viewed gamification dashboard")
    except Exception as e:
        print(f"Error updating streak/logging: {e}")
    
    profile = gamification.get_or_create_profile(db, current_user.id)
    next_xp = gamification.get_next_level_xp(profile.level)
    return {
        "xp": profile.xp,
        "level": profile.level,
        "rank": profile.rank,
        "streak": profile.streak,
        "next_level_xp": next_xp,
        "daily_limit_reached": False
    }

@router.post("/{goal_id}/contribute")
def add_contribution(
    goal_id: int,
    amount: float = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    goal = db.query(models.FinancialGoal).filter(
        models.FinancialGoal.id == goal_id,
        models.FinancialGoal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    goal.current_amount += amount
    
    # Check completion
    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True
    
    db.commit()
    db.refresh(goal)
    
    try:
        from core.fds_engine import calculate_and_save_fds
        calculate_and_save_fds(db, current_user.id)
    except Exception as fds_err:
        print(f"FDS calc error: {fds_err}")

    try:
        from core import gamification
        gamification.add_xp(db, current_user.id, 100)
        gamification.log_activity(db, current_user.id, "Contribution", f"Contributed {amount} to goal: {goal.name}")
    except Exception as gem_err:
        print(f"Gamification XP error: {gem_err}")
        
    return {
        "status": "success",
        "new_amount": goal.current_amount,
        "is_completed": goal.current_amount >= goal.target_amount,
        "xp_gained": 100
    }

@router.get("/achievements")
def get_achievements(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    from core import gamification
    return gamification.check_and_update_badges(db, current_user.id)
