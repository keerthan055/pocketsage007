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
    def get_type_str(t):
        if hasattr(t.type, 'name'):
            return t.type.name.upper()
        return str(t.type).upper()

    total_income = 0.0
    total_expense = 0.0
    total_savings = 0.0
    total_investments = 0.0
    total_emi = 0.0

    for t in transactions:
        t_type = get_type_str(t)
        cat_lower = (t.category or "").lower()
        desc_lower = (t.description or "").lower()
        
        # Check if it is an EMI transaction
        is_emi = any(kw in cat_lower or kw in desc_lower for kw in ["emi", "loan", "debt", "mortgage", "interest", "credit card payment", "cc payment"])
        
        # Check if it is a savings transfer
        is_savings = any(kw in cat_lower or kw in desc_lower for kw in ["savings", "emergency", "reserve", "fund sweep", "transfer to"])
        
        # Check if it is an investment
        is_invest = any(kw in cat_lower or kw in desc_lower for kw in ["investment", "sip", "etf", "mutual fund", "stocks", "equity"])

        if t_type == 'INCOME' or any(kw in cat_lower or kw in desc_lower for kw in ["salary", "freelance", "bonus"]):
            total_income += t.amount
        elif t_type == 'TRANSFER' or is_savings:
            total_savings += t.amount
        elif t_type == 'INVESTMENT' or is_invest:
            total_investments += t.amount
        elif t_type == 'EXPENSE':
            if is_emi:
                total_emi += t.amount
            else:
                total_expense += t.amount
        else:
            # Fallback based on category keywords
            if is_emi:
                total_emi += t.amount
            elif is_savings:
                total_savings += t.amount
            elif is_invest:
                total_investments += t.amount
            else:
                total_expense += t.amount
                
    # Calculate months span of transactions
    dates = [t.date for t in transactions if t.date is not None]
    if dates:
        min_date = min(dates)
        max_date = max(dates)
        days_span = (max_date - min_date).days
        months = max(1.0, days_span / 30.0)
    else:
        months = 1.0

    # Retrieve savings from goals and portfolio summary
    from models.models import FinancialGoal, BankConnection, Investment
    goal_savings = db.query(func.sum(FinancialGoal.current_amount)).filter(FinancialGoal.user_id == user_id).scalar() or 0.0
    bank_balance = db.query(func.sum(BankConnection.balance)).filter(BankConnection.user_id == user_id).scalar() or 0.0
    net_savings = total_savings + goal_savings + bank_balance
    
    # Retrieve investments
    db_investments = db.query(Investment).filter(Investment.user_id == user_id).all()
    db_invest_val = sum(i.quantity * i.current_price for i in db_investments) if db_investments else 0.0
    net_investments = total_investments + db_invest_val

    # Retrieve EMI calendar events
    calendar_events = db.query(FinancialCalendarEvent).filter(FinancialCalendarEvent.user_id == user_id).all()
    calendar_emi = sum(e.amount for e in calendar_events if e.event_type == 'EMI')
    net_emi = total_emi + calendar_emi

    monthly_income = total_income / months
    monthly_expense = total_expense / months
    monthly_savings = net_savings / months
    monthly_emi = net_emi / months
    monthly_investments = net_investments / months
    
    net_cashflow = monthly_income - monthly_expense - monthly_emi
    
    # --- Pillar 1: Transactions/Cash Flow (40%) ---
    if monthly_income > 0:
        cf_ratio = net_cashflow / monthly_income
        if cf_ratio >= 0.3:
            cashflow_score = 100.0
        elif cf_ratio >= 0.0:
            cashflow_score = 75.0 + (cf_ratio / 0.3) * 25.0
        elif cf_ratio >= -0.2:
            cashflow_score = 45.0 + ((cf_ratio + 0.2) / 0.2) * 30.0
        else:
            cashflow_score = max(10.0, 45.0 + (cf_ratio + 0.2) * 50.0)
    else:
        cashflow_score = 0.0

    # --- Pillar 2: Savings Health (25%) ---
    if monthly_income > 0:
        savings_ratio = monthly_savings / monthly_income
        if savings_ratio >= 0.2:
            savings_score = 100.0
        elif savings_ratio >= 0.0:
            savings_score = (savings_ratio / 0.2) * 100.0
        else:
            savings_score = 0.0
            
        if net_cashflow > 0:
            savings_score = min(100.0, savings_score + (net_cashflow / monthly_income) * 60.0)
    else:
        savings_score = 0.0

    # --- Pillar 3: Debt Ratio (20%) ---
    if monthly_income > 0:
        dti = monthly_emi / monthly_income
        if dti == 0:
            debt_score = 100.0
        elif dti <= 0.20:
            debt_score = 100.0 - (dti / 0.20) * 30.0
        elif dti <= 0.45:
            debt_score = 70.0 - ((dti - 0.20) / 0.25) * 45.0
        else:
            debt_score = max(10.0, 25.0 - ((dti - 0.45) / 0.25) * 20.0)
    else:
        debt_score = 50.0 if monthly_emi == 0 else 0.0

    # --- Pillar 4: Investments (10% optional) ---
    if monthly_income > 0:
        inv_ratio = monthly_investments / monthly_income
        if inv_ratio >= 0.10:
            investment_score = 100.0
        else:
            investment_score = (inv_ratio / 0.10) * 100.0
    else:
        investment_score = 50.0 if monthly_investments > 0 else 0.0

    # --- Pillar 5: Behavioral Analysis (5%) ---
    expense_txns = [t for t in transactions if get_type_str(t) == 'EXPENSE']
    avg_txn_amount = monthly_expense / len(expense_txns) if len(expense_txns) > 0 else 1.0
    spike_count = sum(1 for t in expense_txns if t.amount > 3.0 * avg_txn_amount)
    
    weekend_expense = sum(t.amount for t in expense_txns if t.date and t.date.weekday() in [5, 6])
    weekend_ratio = weekend_expense / (total_expense + 1.0)
    
    base_behavioral = 100.0
    spike_deductions = min(40.0, spike_count * 10.0)
    anomaly_deductions = min(30.0, sum(1 for t in transactions if t.is_anomaly) * 15.0)
    weekend_deductions = min(20.0, (weekend_ratio - 0.40) * 50.0 if weekend_ratio > 0.40 else 0.0)
    
    behavioral_score = max(0.0, base_behavioral - spike_deductions - anomaly_deductions - weekend_deductions)

    # Calculate goal and calendar scores for metadata/UI compatibility
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

    # Weighted Score calculation
    weighted_score = (
        cashflow_score * 0.40 +
        savings_score * 0.25 +
        debt_score * 0.20 +
        investment_score * 0.10 +
        behavioral_score * 0.05
    )
    fds_score = int(round(weighted_score))
    fds_score = max(1, min(100, fds_score))

    # Output debugging console logs
    print(f"[DEBUG FDS ENGINE] --- User ID: {user_id} ---")
    print(f"[DEBUG FDS ENGINE] Months span: {months:.2f}")
    print(f"[DEBUG FDS ENGINE] Detected income: {monthly_income:.2f} (Total: {total_income:.2f})")
    print(f"[DEBUG FDS ENGINE] Detected expenses: {monthly_expense:.2f} (Total: {total_expense:.2f})")
    print(f"[DEBUG FDS ENGINE] Detected savings: {monthly_savings:.2f} (Total: {net_savings:.2f})")
    print(f"[DEBUG FDS ENGINE] Detected investments: {monthly_investments:.2f} (Total: {net_investments:.2f})")
    print(f"[DEBUG FDS ENGINE] Detected EMI/Debt: {monthly_emi:.2f} (Total: {net_emi:.2f})")
    print(f"[DEBUG FDS ENGINE] Cash flow: {net_cashflow:.2f}")
    print(f"[DEBUG FDS ENGINE] Cashflow Score: {cashflow_score:.2f}")
    print(f"[DEBUG FDS ENGINE] Savings Score: {savings_score:.2f}")
    print(f"[DEBUG FDS ENGINE] Debt Score: {debt_score:.2f}")
    print(f"[DEBUG FDS ENGINE] Investment Score: {investment_score:.2f}")
    print(f"[DEBUG FDS ENGINE] Behavioral Score: {behavioral_score:.2f}")
    print(f"[DEBUG FDS ENGINE] Debt ratio (DTI): {monthly_emi / monthly_income if monthly_income > 0 else 0.0:.4f}")
    print(f"[DEBUG FDS ENGINE] Final weighted score: {weighted_score:.2f}")
    print(f"[DEBUG FDS ENGINE] Final normalized FDS: {fds_score}")

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
    fds.debt_ratio = debt_score
    fds.savings_ratio = savings_score
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
