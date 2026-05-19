from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import User, FinancialDistressScore, FDSHistory
from core.security import get_current_user
from datetime import datetime, timedelta

router = APIRouter(tags=["fds"])

@router.get("/current")
def get_current_fds(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from core.fds_engine import calculate_and_save_fds
    fds = calculate_and_save_fds(db, current_user.id)
    
    # Map category & color
    if fds.fds_score == 0:
        category = "Insufficient Financial Data"
        color = "yellow"
    elif fds.fds_score >= 80:
        category = "Stable"
        color = "green"
    elif fds.fds_score >= 50:
        category = "Moderate Risk"
        color = "yellow"
    else:
        category = "High Risk"
        color = "red"
        
    return {
        "score": fds.fds_score,
        "category": category,
        "color": color,
        "last_updated": fds.created_at.isoformat(),
        "breakdown": {
            "debt_risk": int(fds.debt_ratio),
            "savings_health": int(fds.savings_ratio),
            "spending_discipline": int(fds.behavioral_score),
            "stability": int(fds.cashflow_score),
            "cash_flow": int(fds.cashflow_score)
        }
    }

@router.get("/history")
def get_fds_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from core.fds_engine import calculate_and_save_fds
    calculate_and_save_fds(db, current_user.id)
    
    history_records = db.query(FDSHistory).filter(FDSHistory.user_id == current_user.id).order_by(FDSHistory.recorded_at.asc()).all()
    if not history_records:
        return [{"date": datetime.utcnow().strftime("%Y-%m"), "score": 0}]
        
    results = []
    for h in history_records:
        date_str = h.recorded_at.strftime("%Y-%m-%d")
        results.append({"date": date_str, "score": h.score})
    return results

@router.get("/prediction")
def get_fds_prediction(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from core.fds_engine import calculate_and_save_fds
    fds = calculate_and_save_fds(db, current_user.id)
    
    if fds.fds_score == 0:
        predicted_score = 0
        insight = "Add transactions to generate future risk forecasts."
    else:
        trend = 2 if fds.cashflow_score > 60 else -3
        predicted_score = max(1, min(100, fds.fds_score + trend))
        insight = "Reducing discretionary outflows by 10% will stabilize your score in the 'Stable' zone."
        
    return {
        "predicted_score": predicted_score,
        "date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "confidence": 0.90 if fds.fds_score > 0 else 0.0,
        "insight": insight
    }

@router.get("/recommendations")
def get_fds_recommendations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from core.fds_engine import calculate_and_save_fds
    fds = calculate_and_save_fds(db, current_user.id)
    
    recs = []
    if fds.fds_score == 0:
        recs.append({"action": "Add Manual or Synced Transactions", "impact": "+50 FDS Points", "priority": "Critical"})
        recs.append({"action": "Set a savings target goal", "impact": "+10 FDS Points", "priority": "High"})
    else:
        if fds.cashflow_score < 70:
            recs.append({"action": "Reduce Entertainment & Shopping spending", "impact": "+8 FDS Points", "priority": "High"})
        if fds.savings_ratio < 60:
            recs.append({"action": "Build a 3-month emergency cash buffer", "impact": "+12 FDS Points", "priority": "Critical"})
        if fds.debt_ratio < 70:
            recs.append({"action": "Settle outstanding high-interest EMI streams", "impact": "+15 FDS Points", "priority": "Critical"})
        if fds.investment_score < 50:
            recs.append({"action": "Diversify portfolio with mutual funds / SIPs", "impact": "+6 FDS Points", "priority": "Medium"})
        if fds.behavioral_score < 75:
            recs.append({"action": "Curtail high weekend impulse purchases", "impact": "+5 FDS Points", "priority": "Medium"})
            
    if not recs:
        recs.append({"action": "Maintain current healthy financial habits", "impact": "Keep score stable", "priority": "Low"})
        
    return recs
