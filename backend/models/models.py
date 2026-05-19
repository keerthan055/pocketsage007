from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from core.database import Base

class RiskLevel(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class TransactionType(str, enum.Enum):
    INCOME = "Income"
    EXPENSE = "Expense"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    transactions = relationship("Transaction", back_populates="owner")
    predictions = relationship("Prediction", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    receipt_scans = relationship("ReceiptScan", back_populates="user")
    calendar_events = relationship("FinancialCalendarEvent", back_populates="user")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False) # food, rent, etc.
    type = Column(Enum(TransactionType), nullable=False)
    description = Column(String)
    date = Column(DateTime(timezone=True), server_default=func.now())
    is_anomaly = Column(Boolean, default=False)

    owner = relationship("User", back_populates="transactions")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    risk_score = Column(Float) # 0-1
    risk_level = Column(Enum(RiskLevel))
    prediction_date = Column(DateTime(timezone=True), server_default=func.now())
    forecast_data = Column(JSON) # Future balances for LSTM

    user = relationship("User", back_populates="predictions")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    message = Column(String)
    severity = Column(String) # Info, Warning, Critical
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="alerts")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String) # Budgeting, Savings, Debt
    content = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FinancialMetrics(Base):
    __tablename__ = "financial_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    health_score = Column(Integer) # 0-100
    debt_to_income_ratio = Column(Float)
    savings_ratio = Column(Float)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    phone_number = Column(String)
    avatar_url = Column(String)
    account_details = Column(String)
    bio = Column(String)

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    dark_mode = Column(Boolean, default=True)
    currency = Column(String, default="USD")
    graph_preference = Column(String, default="Area")

class NotificationPreferences(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    enable_alerts = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=True)
    threshold_alerts = Column(Float, default=1000.0)
    high_risk_warnings = Column(Boolean, default=True)

class FinancialPreferences(Base):
    __tablename__ = "financial_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    monthly_budget = Column(Float, default=0.0)
    savings_target = Column(Float, default=0.0)
    goal_setup = Column(JSON) # Future goal lists

class UserActivityLog(Base):
    __tablename__ = "user_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    activity_type = Column(String) # Login, Update, Prediction, Alert
    description = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class UserCurrencyPreference(Base):
    __tablename__ = "user_currency_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    currency_code = Column(String, default="USD") # USD, INR, EUR, etc.
    country_name = Column(String, default="USA")
    symbol = Column(String, default="$")
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())

# --- NEW ADVANCED MODULES ---

class GamificationProfile(Base):
    __tablename__ = "gamification_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    rank = Column(String, default="Beginner")
    total_goals_completed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserAchievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_id = Column(String)  # e.g., 'smart_saver'
    title = Column(String)
    icon = Column(String)
    condition = Column(String)
    unlocked_at = Column(DateTime, default=datetime.utcnow)

class FinancialScoreHistory(Base):
    __tablename__ = "financial_score_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)
    month = Column(String)  # e.g., 'Jan 2026'
    recorded_at = Column(DateTime, default=datetime.utcnow)

class SpendingBehavior(Base):
    __tablename__ = "spending_behavior"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    pattern_type = Column(String)  # 'weekend_spike', 'late_night', 'emotional'
    intensity = Column(Float)  # 0 to 1
    description = Column(String)
    detected_at = Column(DateTime, default=datetime.utcnow)

class BankConnection(Base):
    __tablename__ = "bank_connections"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    bank_name = Column(String)
    account_type = Column(String)
    balance = Column(Float)
    last_synced = Column(DateTime, default=datetime.utcnow)
    access_token_enc = Column(String)

class SyncedTransaction(Base):
    __tablename__ = "synced_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    bank_id = Column(Integer, ForeignKey("bank_connections.id"))
    merchant_name = Column(String)
    amount = Column(Float)
    category = Column(String)
    is_recurring = Column(Boolean, default=False)
    date = Column(DateTime, default=datetime.utcnow)

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    amount = Column(Float)
    billing_cycle = Column(String)
    next_billing_date = Column(DateTime)
    category = Column(String)
    is_active = Column(Boolean, default=True)
    usage_frequency = Column(String)

class FinancialDistressScore(Base):
    __tablename__ = "financial_distress_scores"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    fds_score = Column(Integer, default=0)
    health_score = Column(Integer, default=0)
    debt_ratio = Column(Float, default=0.0)
    savings_ratio = Column(Float, default=0.0)
    cashflow_score = Column(Float, default=0.0)
    investment_score = Column(Float, default=0.0)
    behavioral_score = Column(Float, default=0.0)
    goal_score = Column(Float, default=0.0)
    calendar_score = Column(Float, default=0.0)
    risk_level = Column(String, default="Insufficient Financial Data")
    created_at = Column(DateTime, default=datetime.utcnow)

class FDSHistory(Base):
    __tablename__ = "fds_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)
    recorded_at = Column(DateTime, default=datetime.utcnow)

class DistressPrediction(Base):
    __tablename__ = "distress_predictions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    predicted_score = Column(Integer)
    predicted_risk_date = Column(DateTime)
    ai_confidence = Column(Float)

class FinancialSimulation(Base):
    __tablename__ = "financial_simulations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    simulation_name = Column(String)
    dining_change = Column(Float, default=0)
    salary_change = Column(Float, default=0)
    emi_addition = Column(Float, default=0)
    savings_boost = Column(Float, default=0)
    projected_score_impact = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class FuturePrediction(Base):
    __tablename__ = "future_predictions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    month = Column(String)
    predicted_balance = Column(Float)
    predicted_risk_level = Column(String)
    ai_confidence = Column(Float)

class DailyBriefing(Base):
    __tablename__ = "daily_briefings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    summary = Column(String)
    top_category = Column(String)
    total_spent = Column(Float)
    budget_remaining = Column(Float)
    ai_tip = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ScoreBreakdown(Base):
    __tablename__ = "score_breakdowns"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    debt_risk = Column(Float)
    savings_health = Column(Float)
    spending_discipline = Column(Float)
    stability = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow)

class FinancialGoal(Base):
    __tablename__ = "financial_goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    target_amount = Column(Float)
    current_amount = Column(Float, default=0.0)
    deadline = Column(DateTime)
    category = Column(String) # Savings, Debt Payoff, Emergency Fund
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Investment(Base):
    __tablename__ = "investments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    asset_name = Column(String) # Apple, BTC, etc.
    asset_type = Column(String) # Stock, Crypto, Mutual Fund
    quantity = Column(Float)
    buy_price = Column(Float)
    current_price = Column(Float)
    purchase_date = Column(DateTime)
    risk_level = Column(String, default="Medium")
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class PortfolioSummary(Base):
    __tablename__ = "portfolio_summary"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_investment_value = Column(Float, default=0.0)
    total_savings = Column(Float, default=0.0)
    cash_balance = Column(Float, default=0.0)
    debt = Column(Float, default=0.0)
    net_worth = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FamilyAccount(Base):
    __tablename__ = "family_accounts"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    family_name = Column(String)
    invite_code = Column(String, unique=True)

class FamilyMember(Base):
    __tablename__ = "family_members"
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("family_accounts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String) # Parent, Child

class AIChatHistory(Base):
    __tablename__ = "ai_chat_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String) # user, assistant
    content = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class FinancialEvent(Base):
    __tablename__ = "financial_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    event_type = Column(String) # Bill, EMI, Salary
    amount = Column(Float)
    event_date = Column(DateTime)
    is_recurring = Column(Boolean, default=False)
    status = Column(String) # Pending, Paid

class ReceiptScan(Base):
    __tablename__ = "receipt_scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String)
    merchant_name = Column(String)
    amount = Column(Float)
    category = Column(String)
    transaction_date = Column(DateTime)
    ocr_text = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="receipt_scans")

class FinancialCalendarEvent(Base):
    __tablename__ = "financial_calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    event_type = Column(String) # Salary / EMI / Bill / Subscription / Investment / Goal / Reminder
    amount = Column(Float)
    event_date = Column(String) # YYYY-MM-DD
    event_time = Column(String) # HH:MM
    repeat_type = Column(String, default="None") # None / Daily / Weekly / Monthly
    priority = Column(String, default="Medium") # Low / Medium / High
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="calendar_events")
