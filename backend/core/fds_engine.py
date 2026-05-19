from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from models.models import (
    User, Transaction, TransactionType, FinancialDistressScore, FDSHistory,
    Investment, PortfolioSummary, FinancialGoal, FinancialCalendarEvent,
    DailyBriefing, Alert
)

def calculate_and_save_fds(db: Session, user_id: int) -> FinancialDistressScore:
    # 1. Fetch transactions
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    
    # Check if there are any transactions
    if not transactions:
        # Initialize as 0
        fds = db.query(FinancialDistressScore).filter(FinancialDistressScore.user_id == user_id).first()
        if not fds:
            fds = FinancialDistressScore(user_id=user_id)
            db.add(fds)
        fds.fds_score = 0
        fds.health_score = 0
        fds.debt_ratio = 0.0
        fds.savings_ratio = 0.0
        fds.cashflow_score = 0.0
        fds.investment_score = 0.0
        fds.behavioral_score = 0.0
        fds.goal_score = 0.0
        fds.calendar_score = 0.0
        fds.risk_level = "Insufficient Financial Data"
        fds.created_at = datetime.utcnow()
        db.commit()
        db.refresh(fds)
        
        # Save historic record if not already recorded today
        log_fds_history(db, user_id, 0)
        
        # Generate custom briefing/recommendations
        generate_dynamic_briefing_and_recommendations(db, user_id, fds)
        return fds

    # 2. Extract transaction features
    # Total sums
    total_income = sum(t.amount for t in transactions if t.type == TransactionType.INCOME or t.type == 'Income')
    total_expense = sum(t.amount for t in transactions if t.type == TransactionType.EXPENSE or t.type == 'Expense')
    
    # Calculate months span of transactions
    dates = [t.date for t in transactions if t.date is not None]
    if dates:
        min_date = min(dates)
        max_date = max(dates)
        days_span = (max_date - min_date).days
        months = max(1.0, days_span / 30.0)
    else:
        months = 1.0
        
    monthly_income = total_income / months
    monthly_expense = total_expense / months
    
    # --- Pillar 1: Transactions/Cash Flow (40%) ---
    if monthly_income == 0:
        cashflow_score = 10.0
    else:
        expense_ratio = monthly_expense / monthly_income
        if expense_ratio <= 0.3:
            cashflow_score = 100.0
        elif expense_ratio <= 0.8:
            cashflow_score = 100.0 - (expense_ratio - 0.3) * 120.0
        elif expense_ratio <= 1.2:
            cashflow_score = 40.0 - (expense_ratio - 0.8) * 75.0
        else:
            cashflow_score = max(5.0, 10.0 - (expense_ratio - 1.2) * 10.0)

    # --- Pillar 2: Savings Health (25%) ---
    # Retrieve savings from goals and portfolio summary
    total_savings = db.query(func.sum(FinancialGoal.current_amount)).filter(FinancialGoal.user_id == user_id).scalar() or 0.0
    # Bank balances
    from models.models import BankConnection
    bank_balance = db.query(func.sum(BankConnection.balance)).filter(BankConnection.user_id == user_id).scalar() or 0.0
    cash_balance = max(0.0, total_income - total_expense)
    net_savings = total_savings + bank_balance + cash_balance
    
    # Emergency fund ratio (months of expenses covered)
    reserve_ratio = net_savings / (monthly_expense + 1.0)
    if reserve_ratio >= 6.0:
        reserve_score = 100.0
    else:
        reserve_score = (reserve_ratio / 6.0) * 100.0
        
    # Savings ratio
    savings_ratio = (monthly_income - monthly_expense) / monthly_income if monthly_income > 0 else 0.0
    if savings_ratio >= 0.3:
        savings_ratio_score = 100.0
    elif savings_ratio > 0.0:
        savings_ratio_score = (savings_ratio / 0.3) * 100.0
    else:
        savings_ratio_score = 0.0
        
    savings_health = 0.5 * reserve_score + 0.5 * savings_ratio_score

    # --- Pillar 3: Debt Ratio (20%) ---
    # Find EMI/loan/debt in transactions or calendar events
    monthly_emi = sum(t.amount for t in transactions if (t.type == TransactionType.EXPENSE or t.type == 'Expense') and any(keyword in t.category.lower() or keyword in (t.description or "").lower() for keyword in ["emi", "loan", "debt", "mortgage", "interest"]))
    
    calendar_events = db.query(FinancialCalendarEvent).filter(FinancialCalendarEvent.user_id == user_id).all()
    monthly_emi += sum(e.amount for e in calendar_events if e.event_type == 'EMI')
    
    dti = monthly_emi / monthly_income if monthly_income > 0 else (1.0 if monthly_emi > 0 else 0.0)
    if dti == 0:
        debt_ratio_score = 100.0
    else:
        if dti <= 0.2:
            debt_ratio_score = 100.0 - dti * 150.0
        elif dti <= 0.5:
            debt_ratio_score = 70.0 - (dti - 0.2) * 150.0
        else:
            debt_ratio_score = max(0.0, 25.0 - (dti - 0.5) * 50.0)

    # --- Pillar 4: Investments (10% optional) ---
    investments = db.query(Investment).filter(Investment.user_id == user_id).all()
    has_investments = len(investments) > 0
    if has_investments:
        total_investment_value = sum(i.quantity * i.current_price for i in investments)
        unique_types = len(set(i.asset_type for i in investments))
        diversification_score = min(100.0, unique_types * 25.0)
        
        total_cost = sum(i.quantity * i.buy_price for i in investments)
        performance_ratio = (total_investment_value - total_cost) / total_cost if total_cost > 0 else 0.0
        performance_score = max(0.0, min(100.0, 50.0 + performance_ratio * 100.0))
        
        investment_score = 0.6 * diversification_score + 0.4 * performance_score
    else:
        investment_score = 0.0

    # --- Pillar 5: Behavioral Analysis (3%) ---
    # Detect spikes and weekend overspending
    avg_txn_amount = total_expense / len(transactions) if len(transactions) > 0 else 1.0
    spike_count = sum(1 for t in transactions if (t.type == TransactionType.EXPENSE or t.type == 'Expense') and t.amount > 5.0 * avg_txn_amount)
    
    weekend_expense = sum(t.amount for t in transactions if (t.type == TransactionType.EXPENSE or t.type == 'Expense') and t.date and t.date.weekday() in [5, 6])
    weekend_ratio = weekend_expense / total_expense if total_expense > 0 else 0.0
    
    base_behavioral = 100.0
    deductions = min(30.0, spike_count * 10.0)
    if weekend_ratio > 0.3:
        deductions += min(20.0, (weekend_ratio - 0.3) * 50.0)
    deductions += min(20.0, sum(1 for t in transactions if t.is_anomaly) * 10.0)
    behavioral_score = max(0.0, base_behavioral - deductions)

    # --- Pillar 6: Goals & Calendar (2%) ---
    goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == user_id).all()
    if goals:
        completed_goals = sum(1 for g in goals if g.is_completed)
        goals_progress = sum(g.current_amount / g.target_amount for g in goals if g.target_amount > 0)
        goal_score = (completed_goals * 10.0 + goals_progress * 90.0) / len(goals)
        goal_score = min(100.0, goal_score)
    else:
        goal_score = 50.0
        
    if calendar_events:
        calendar_score = min(100.0, 50.0 + len(calendar_events) * 10.0)
    else:
        calendar_score = 50.0
        
    goals_calendar_score = 0.5 * goal_score + 0.5 * calendar_score

    # --- Weight assembly and scaling ---
    weights = {
        'cashflow': 0.40,
        'savings': 0.25,
        'debt': 0.20,
        'behavioral': 0.03,
        'goals_calendar': 0.02
    }
    if has_investments:
        weights['investment'] = 0.10
        total_w = 1.0
    else:
        total_w = sum(weights.values())

    weighted_score = (
        cashflow_score * weights['cashflow'] +
        savings_health * weights['savings'] +
        debt_ratio_score * weights['debt'] +
        behavioral_score * weights['behavioral'] +
        goals_calendar_score * weights['goals_calendar']
    )
    if has_investments:
        weighted_score += investment_score * weights['investment']

    fds_score = int(round(weighted_score / total_w))
    fds_score = max(1, min(100, fds_score))

    # Save to financial_distress_scores
    fds = db.query(FinancialDistressScore).filter(FinancialDistressScore.user_id == user_id).first()
    if not fds:
        fds = FinancialDistressScore(user_id=user_id)
        db.add(fds)
        
    if fds_score >= 80:
        risk_level = "Stable"
    elif fds_score >= 50:
        risk_level = "Moderate Risk"
    else:
        risk_level = "High Risk"
        
    fds.fds_score = fds_score
    fds.health_score = fds_score
    fds.debt_ratio = debt_ratio_score
    fds.savings_ratio = savings_health
    fds.cashflow_score = cashflow_score
    fds.investment_score = investment_score
    fds.behavioral_score = behavioral_score
    fds.goal_score = goal_score
    fds.calendar_score = calendar_score
    fds.risk_level = risk_level
    fds.created_at = datetime.utcnow()
    db.commit()
    db.refresh(fds)

    # Log/update historical record for today
    log_fds_history(db, user_id, fds_score)
    
    # Generate daily briefing / tip
    generate_dynamic_briefing_and_recommendations(db, user_id, fds)
    
    return fds

def log_fds_history(db: Session, user_id: int, score: int):
    today = datetime.utcnow().date()
    # Check if history entry exists for today
    hist = db.query(FDSHistory).filter(
        FDSHistory.user_id == user_id,
        func.date(FDSHistory.recorded_at) == today
    ).first()
    
    if hist:
        hist.score = score
        hist.recorded_at = datetime.utcnow()
    else:
        hist = FDSHistory(user_id=user_id, score=score, recorded_at=datetime.utcnow())
        db.add(hist)
    db.commit()

def generate_dynamic_briefing_and_recommendations(db: Session, user_id: int, fds: FinancialDistressScore):
    # Determine the weakest pillar
    pillars = {
        'Transactions': fds.cashflow_score,
        'Savings': fds.savings_ratio,
        'Debt': fds.debt_ratio,
        'Behavioral': fds.behavioral_score,
        'Goals & Calendar': (fds.goal_score + fds.calendar_score) / 2.0
    }
    if fds.investment_score > 0:
        pillars['Investments'] = fds.investment_score
        
    weakest_pillar = min(pillars, key=pillars.get)
    weakest_score = pillars[weakest_pillar]
    
    # Find top spending category in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    txns = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date >= thirty_days_ago,
        Transaction.type == TransactionType.EXPENSE
    ).all()
    
    cat_spend = {}
    total_spent = 0.0
    for t in txns:
        cat_spend[t.category] = cat_spend.get(t.category, 0.0) + t.amount
        total_spent += t.amount
        
    top_category = max(cat_spend, key=cat_spend.get) if cat_spend else "Discretionary"
    top_spent = cat_spend.get(top_category, 0.0)
    
    # Create AI tip
    if fds.fds_score == 0:
        ai_tip = "Add transactions to generate your first Financial Distress Score."
        summary = "No active cash flow streams detected. Feed the intelligence lattice with transaction nodes to begin forecasting."
    else:
        if weakest_pillar == 'Transactions':
            ai_tip = f"Reduce spending in {top_category} this week to improve your cash flow score."
            summary = f"Your cash flow is under pressure. {top_category} outflows totaled {top_spent:.0f} over the last 30 days, pushing your expense-to-income ratio higher."
        elif weakest_pillar == 'Savings':
            ai_tip = "Boost your emergency reserve fund to cover at least 3 months of expenses."
            summary = f"Low liquid reserves detected relative to your monthly overhead. Emergency reserves are currently below safety margins."
        elif weakest_pillar == 'Debt':
            ai_tip = "Prioritize paying off high-interest EMI liabilities to raise your stability rating."
            summary = "High debt-to-income leverage detected. Recurring debt obligations are capturing a significant portion of your monthly income lattice."
        elif weakest_pillar == 'Investments':
            ai_tip = "Diversify your wealth by initiating a recurring SIP or mutual fund allocation."
            summary = "Your investment portfolio lacks asset class diversification. Consider moving cash surpluses into stable index ETFs or bonds."
        elif weakest_pillar == 'Behavioral':
            ai_tip = "Watch out for impulse spending weekend spikes to gain +5 score points."
            summary = "Our algorithms detected intense weekend discretionary outflows. Stabilizing week-to-week consistency will improve your behavioral rating."
        else:
            ai_tip = "Complete one of your active savings goals to receive an immediate FDS boost."
            summary = "Increasing structural progress toward your savings targets will secure future net worth indicators."

    # Update or create DailyBriefing
    briefing = db.query(DailyBriefing).filter(DailyBriefing.user_id == user_id).first()
    if not briefing:
        briefing = DailyBriefing(user_id=user_id)
        db.add(briefing)
    briefing.summary = summary
    briefing.top_category = top_category
    briefing.total_spent = total_spent
    briefing.budget_remaining = max(0.0, (total_spent * 1.5) - total_spent)
    briefing.ai_tip = ai_tip
    briefing.created_at = datetime.utcnow()
    db.commit()
