from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import User, Transaction, FinancialMetrics as MetricsModel, Alert, Recommendation
from schemas.schemas import DashboardData
from .auth import get_current_user
from .ml import predict_risk, get_forecast

router = APIRouter(tags=["dashboard"])

@router.get("/")
def get_dashboard(current_user: User = Depends(get_current_user)):
    return {
        "financial_score": 730,
        "recent_transactions": [],
        "risk_status": "Low"
    }

@router.get("/daily-briefing")
def get_daily_briefing(current_user: User = Depends(get_current_user)):
    return {
        "summary": "You spent ₹1,850 yesterday mainly on dining and shopping.",
        "top_category": "Food & Beverage",
        "total_spent": 1850.40,
        "budget_remaining": 42500,
        "ai_tip": "Reducing entertainment spending this weekend could boost your score by +5 points."
    }

@router.get("/score-breakdown")
def get_score_breakdown(current_user: User = Depends(get_current_user)):
    return {
        "debt_risk": 84,
        "savings_health": 42,
        "spending_discipline": 68,
        "stability": 75,
        "history": [680, 695, 712, 730]
    }

@router.get("/summary", response_model=DashboardData)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get recent transactions
    recent = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.desc()).limit(5).all()
    
    # Get metrics (trigger prediction if missing)
    metrics_db = db.query(MetricsModel).filter(MetricsModel.user_id == current_user.id).first()
    if not metrics_db:
        metrics_data = predict_risk(db, current_user)
    else:
        # We'd usually re-calculate or return cached
        metrics_data = {
            "health_score": metrics_db.health_score,
            "debt_to_income_ratio": metrics_db.debt_to_income_ratio,
            "savings_ratio": metrics_db.savings_ratio,
            "risk_level": "Low", # Mock or join
            "risk_score": 0.1
        }
    
    # Get forecast
    forecast = get_forecast(db, current_user)
    
    # Get alerts
    alerts = db.query(Alert).filter(Alert.user_id == current_user.id, Alert.is_read == False).limit(5).all()
    
    # Get recommendations (Mock for now)
    recommendations = [
        {"category": "Savings", "content": "You could save $50 more by reducing 'Entertainment' spending."},
        {"category": "Debt", "content": "Consider paying off your high-interest EMI first."}
    ]
    
    # Process alerts to remove SQLAlchemy state
    alerts_data = []
    for a in alerts:
        a_dict = {k: v for k, v in a.__dict__.items() if not k.startswith('_')}
        alerts_data.append(a_dict)

    return {
        "metrics": metrics_data,
        "recent_transactions": recent,
        "forecast": forecast,
        "alerts": alerts_data,
        "recommendations": recommendations
    }
