from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from core.database import get_db
from models.models import User, Transaction, TransactionType, Prediction, FinancialMetrics as MetricsModel
from schemas.schemas import FinancialMetrics, DashboardData
from .auth import get_current_user

router = APIRouter(tags=["machine learning"])

@router.get("/predict-risk", response_model=FinancialMetrics)
def predict_risk(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ml.xgboost_model import risk_predictor
    # Calculate features from transactions
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    
    # Mock feature engineering
    income = sum(t.amount for t in transactions if t.type == TransactionType.INCOME)
    expenses = sum(t.amount for t in transactions if t.type == TransactionType.EXPENSE)
    
    savings_ratio = (income - expenses) / income if income > 0 else 0
    debt_to_income = 0.2 # Placeholder
    
    features = {
        'savings_ratio': savings_ratio,
        'debt_to_income': debt_to_income,
        'expense_volatility': 0.1,
        'income_stability': 0.9
    }
    
    prob, level = risk_predictor.predict(features)
    health_score = int((1 - prob) * 100)
    
    # Save metrics
    metrics = db.query(MetricsModel).filter(MetricsModel.user_id == current_user.id).first()
    if not metrics:
        metrics = MetricsModel(user_id=current_user.id)
        db.add(metrics)
    
    metrics.health_score = health_score
    metrics.debt_to_income_ratio = debt_to_income
    metrics.savings_ratio = savings_ratio
    db.commit()
    
    return {
        "health_score": health_score,
        "debt_to_income_ratio": debt_to_income,
        "savings_ratio": savings_ratio,
        "risk_level": level,
        "risk_score": prob
    }

@router.post("/forecast")
def get_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ml.lstm_model import forecast_service
    # Get daily cumulative balances
    # Simplified mock for MVP:
    history = [1000, 1050, 980, 1100, 1150, 1200, 1180] 
    
    predictions = forecast_service.predict_next_30_days(history)
    
    forecast_results = []
    start_date = datetime.now()
    for i, val in enumerate(predictions):
        date_str = (start_date).strftime("%Y-%m-%d") # Should increment, keeping simple
        forecast_results.append({"date": f"Day {i+1}", "predicted_balance": round(val, 2)})
        
    return forecast_results

@router.post("/simulate")
def simulate_impact(scenario: dict, current_user: User = Depends(get_current_user)):
    # Calculate impact based on input changes
    dining_reduction = scenario.get('dining_reduction', 0)
    salary_change = scenario.get('salary_change', 0)
    new_emi = scenario.get('new_emi', 0)
    
    # Impact on score
    score_delta = (dining_reduction / 1000) * 1.5
    score_delta += (salary_change / 5000) * 3
    score_delta -= (new_emi / 5000) * 4
    
    # Simple projection for 6 months
    monthly_impact = dining_reduction + salary_change - new_emi
    future_savings = monthly_impact * 6
    
    return {
        "score_impact": round(score_delta, 1),
        "savings_impact": future_savings,
        "new_risk_level": "High" if new_emi > 20000 else "Low",
        "advice": f"By reducing dining by ₹{dining_reduction}, you'll build ₹{dining_reduction * 12} in extra wealth this year."
    }
