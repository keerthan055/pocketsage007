from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import User, FinancialDistressScore, FDSHistory
from core.security import get_current_user
from datetime import datetime, timedelta

router = APIRouter(tags=["fds"])

@router.get("/current")
def get_current_fds(current_user: User = Depends(get_current_user)):
    # Mock intelligent scoring logic
    return {
        "score": 78,
        "category": "Stable / Moderate Risk",
        "color": "yellow",
        "last_updated": datetime.utcnow().isoformat(),
        "breakdown": {
            "debt_risk": 82,
            "savings_health": 45,
            "spending_discipline": 68,
            "stability": 75,
            "cash_flow": 88
        }
    }

@router.get("/history")
def get_fds_history(current_user: User = Depends(get_current_user)):
    return [
        {"date": "2024-01", "score": 65},
        {"date": "2024-02", "score": 68},
        {"date": "2024-03", "score": 72},
        {"date": "2024-04", "score": 75},
        {"date": "2024-05", "score": 78},
    ]

@router.get("/prediction")
def get_fds_prediction(current_user: User = Depends(get_current_user)):
    return {
        "predicted_score": 82,
        "date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "confidence": 0.94,
        "insight": "Reducing luxury dining by 15% will likely push your FDS into the 'Excellent' zone next month."
    }

@router.get("/recommendations")
def get_fds_recommendations(current_user: User = Depends(get_current_user)):
    return [
        {"action": "Reduce Subscription Burden", "impact": "+4 FDS Points", "priority": "High"},
        {"action": "Boost Emergency Fund", "impact": "+12 FDS Points", "priority": "Medium"},
        {"action": "Consolidate High-Interest Debt", "impact": "+15 FDS Points", "priority": "Critical"}
    ]
