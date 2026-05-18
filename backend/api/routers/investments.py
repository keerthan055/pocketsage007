from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from core.database import get_db
from models.models import User, Investment, PortfolioSummary, FinancialGoal, BankConnection, Transaction, TransactionType
from schemas.schemas import InvestmentCreate, InvestmentOut, InvestmentDashboardData, PortfolioSummaryOut, AssetAllocationItem
from core.security import get_current_user

router = APIRouter(tags=["investments"])

def get_cash_balance(db: Session, user_id: int) -> float:
    income = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.INCOME).scalar() or 0.0
    expense = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.EXPENSE).scalar() or 0.0
    return max(0.0, income - expense)

def calculate_portfolio(db: Session, user_id: int):
    # Fetch all investments
    investments = db.query(Investment).filter(Investment.user_id == user_id).all()
    
    total_investment_value = sum(i.quantity * i.current_price for i in investments)
    
    # Calculate savings from Financial Goals
    total_savings = db.query(func.sum(FinancialGoal.current_amount)).filter(FinancialGoal.user_id == user_id).scalar() or 0.0
    
    # Bank Balances
    bank_balance = db.query(func.sum(BankConnection.balance)).filter(BankConnection.user_id == user_id).scalar() or 0.0
    
    # Cash Balance
    cash_balance = get_cash_balance(db, user_id)
    
    # Debt (Simple assumption: use some placeholder or fixed value, or query specific debt goals)
    debt = 0.0 

    # Net Worth = Savings + Bank + Investments + Cash - Debt
    net_worth = total_savings + bank_balance + total_investment_value + cash_balance - debt

    # Update or create PortfolioSummary
    summary = db.query(PortfolioSummary).filter(PortfolioSummary.user_id == user_id).first()
    if not summary:
        summary = PortfolioSummary(user_id=user_id)
        db.add(summary)
        
    summary.total_investment_value = total_investment_value
    summary.total_savings = total_savings
    summary.cash_balance = cash_balance + bank_balance
    summary.debt = debt
    summary.net_worth = net_worth
    db.commit()
    db.refresh(summary)

    # Calculate Allocation
    alloc_map = {}
    for inv in investments:
        val = inv.quantity * inv.current_price
        alloc_map[inv.asset_type] = alloc_map.get(inv.asset_type, 0.0) + val
    
    alloc_list = []
    colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
    color_idx = 0
    for a_type, v in alloc_map.items():
        if total_investment_value > 0:
            pct = (v / total_investment_value) * 100
        else:
            pct = 0
        alloc_list.append(AssetAllocationItem(type=a_type, percentage=round(pct, 1), color=colors[color_idx % len(colors)]))
        color_idx += 1

    # Fake growth logic for UI
    monthly_growth = 31200.0 if net_worth > 0 else 0.0
    monthly_growth_percent = 7.4 if net_worth > 0 else 0.0

    return InvestmentDashboardData(
        summary=PortfolioSummaryOut(
            total_investment_value=summary.total_investment_value,
            total_savings=summary.total_savings,
            cash_balance=summary.cash_balance,
            debt=summary.debt,
            net_worth=summary.net_worth,
            monthly_growth=monthly_growth,
            monthly_growth_percent=monthly_growth_percent
        ),
        allocation=alloc_list,
        portfolio=investments
    )

@router.get("/portfolio", response_model=InvestmentDashboardData)
def get_portfolio(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return calculate_portfolio(db, current_user.id)

@router.post("/add", response_model=InvestmentDashboardData)
def add_investment(asset: InvestmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_inv = Investment(**asset.model_dump(), user_id=current_user.id)
    db.add(new_inv)
    db.commit()
    # Recalculate portfolio after adding
    return calculate_portfolio(db, current_user.id)
