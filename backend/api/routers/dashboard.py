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
def get_daily_briefing(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from core.fds_engine import calculate_and_save_fds
    from models.models import DailyBriefing
    
    calculate_and_save_fds(db, current_user.id)
    
    briefing = db.query(DailyBriefing).filter(DailyBriefing.user_id == current_user.id).first()
    if briefing:
        return {
            "summary": briefing.summary,
            "top_category": briefing.top_category,
            "total_spent": float(briefing.total_spent),
            "budget_remaining": float(briefing.budget_remaining),
            "ai_tip": briefing.ai_tip
        }
    return {
        "summary": "No financial history loaded into the lattice.",
        "top_category": "None",
        "total_spent": 0.0,
        "budget_remaining": 0.0,
        "ai_tip": "Add transactions to generate your daily intelligence briefing."
    }

@router.get("/score-breakdown")
def get_score_breakdown(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from core.fds_engine import calculate_and_save_fds
    from models.models import FDSHistory
    fds = calculate_and_save_fds(db, current_user.id)
    
    history_records = db.query(FDSHistory).filter(FDSHistory.user_id == current_user.id).order_by(FDSHistory.recorded_at.desc()).limit(4).all()
    history_scores = [h.score for h in reversed(history_records)] if history_records else [0, 0, 0, fds.fds_score]
    
    return {
        "debt_risk": int(fds.debt_ratio),
        "savings_health": int(fds.savings_ratio),
        "spending_discipline": int(fds.behavioral_score),
        "stability": int(fds.cashflow_score),
        "history": history_scores
    }

@router.get("/summary", response_model=DashboardData)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from core.fds_engine import calculate_and_save_fds
    fds = calculate_and_save_fds(db, current_user.id)
    
    recent = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.desc()).limit(5).all()
    
    debt_to_income_ratio = (100.0 - fds.debt_ratio) / 100.0
    savings_ratio = fds.savings_ratio / 100.0
    
    metrics_data = {
        "health_score": int(fds.fds_score),
        "debt_to_income_ratio": float(debt_to_income_ratio),
        "savings_ratio": float(savings_ratio),
        "risk_level": "Low" if fds.fds_score >= 80 else ("Medium" if fds.fds_score >= 50 else "High"),
        "risk_score": float((100 - fds.fds_score) / 100.0)
    }
    
    forecast = get_forecast(db, current_user)
    
    alerts = db.query(Alert).filter(Alert.user_id == current_user.id, Alert.is_read == False).limit(5).all()
    
    recommendations = []
    if fds.fds_score == 0:
        recommendations.append({"category": "Transactions", "content": "Add transactions to kick off FDS calculation."})
    else:
        if fds.cashflow_score < 70:
            recommendations.append({"category": "Savings", "content": "You could save more by reducing entertainment spend."})
        if fds.debt_ratio < 70:
            recommendations.append({"category": "Debt", "content": "Consider paying off your high-interest EMI first."})
    if not recommendations:
        recommendations.append({"category": "General", "content": "Your financial state is stable! Keep up the good work."})
        
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
