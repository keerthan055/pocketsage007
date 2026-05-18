from fastapi import APIRouter, Depends
from core.security import get_current_user
from models.models import User

router = APIRouter(tags=["insights"])

@router.get("/")
def get_insights(current_user: User = Depends(get_current_user)):
    return []

@router.get("/spending-behavior")
def get_spending_behavior(current_user: User = Depends(get_current_user)):
    return [
        {"type": "weekend_spike", "intensity": 0.85, "description": "High spending detected on Saturdays between 8 PM - 11 PM."},
        {"type": "late_night", "intensity": 0.42, "description": "Occasional food delivery orders detected after midnight."},
        {"type": "emotional", "intensity": 0.65, "description": "Spending increases significanty on days with high work-related stress alerts."},
        {"type": "impulse", "intensity": 0.31, "description": "Quick, unplanned Amazon purchases detected via credit cards."}
    ]

@router.get("/financial-timeline")
def get_financial_timeline(current_user: User = Depends(get_current_user)):
    return [
        {"month": "Jan 2026", "score": 680, "savings": 45000, "debt": 120000},
        {"month": "Feb 2026", "score": 695, "savings": 52000, "debt": 110000},
        {"month": "Mar 2026", "score": 712, "savings": 68000, "debt": 95000},
        {"month": "Apr 2026", "score": 730, "savings": 85000, "debt": 82000},
    ]

@router.get("/growth-metrics")
def get_growth_metrics(current_user: User = Depends(get_current_user)):
    return {
        "monthly_score_change": "+18",
        "savings_growth": "+32%",
        "debt_reduction": "-15%",
        "overall_health": "Exponential Growth"
    }
