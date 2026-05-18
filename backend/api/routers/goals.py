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
    return new_goal

@router.get("/gamification")
def get_gamification_stats(current_user: models.User = Depends(get_current_user)):
    return {
        "xp": 1250,
        "level": 4,
        "rank": "Budget Pro",
        "streak": 14,
        "next_level_xp": 2000,
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
    
    # Reward XP for contribution
    # (In a real app, we'd update a user_stats table)
    
    db.commit()
    db.refresh(goal)
    return {
        "status": "success",
        "new_amount": goal.current_amount,
        "is_completed": goal.current_amount >= goal.target_amount,
        "xp_gained": 100
    }

@router.get("/achievements")
def get_achievements(current_user: models.User = Depends(get_current_user)):
    return [
        {"id": "smart_saver", "title": "Smart Saver", "icon": "🛡️", "unlocked": True, "date": "2026-05-10"},
        {"id": "debt_crusher", "title": "Debt Crusher", "icon": "⚔️", "unlocked": True, "date": "2026-05-12"},
        {"id": "mil_mind", "title": "Millionaire Mind", "icon": "💎", "unlocked": False},
        {"id": "sub_slayer", "title": "Sub Slayer", "icon": "🗡️", "unlocked": False},
    ]
