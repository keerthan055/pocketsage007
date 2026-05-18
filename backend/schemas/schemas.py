from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class TransactionType(str, Enum):
    INCOME = "Income"
    EXPENSE = "Expense"

class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Transaction Schemas
class TransactionBase(BaseModel):
    amount: float
    category: str
    type: TransactionType
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    user_id: int
    is_anomaly: bool

    class Config:
        from_attributes = True

# Dashboard/ML Schemas
class FinancialMetrics(BaseModel):
    health_score: int
    debt_to_income_ratio: float
    savings_ratio: float
    risk_level: RiskLevel
    risk_score: float

class ForecastItem(BaseModel):
    date: str
    predicted_balance: float

class DashboardData(BaseModel):
    metrics: FinancialMetrics
    recent_transactions: List[Transaction]
    forecast: List[ForecastItem]
    alerts: List[Dict]
    recommendations: List[Dict]

# Profile & Settings Schemas
class UserProfileBase(BaseModel):
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    account_details: Optional[str] = None
    bio: Optional[str] = None

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfile(UserProfileBase):
    user_id: int

    class Config:
        from_attributes = True

class UserSettingsBase(BaseModel):
    dark_mode: bool = True
    currency: str = "USD"
    graph_preference: str = "Area"

class UserSettingsUpdate(UserSettingsBase):
    pass

class NotificationPrefsBase(BaseModel):
    enable_alerts: bool = True
    email_notifications: bool = True
    threshold_alerts: float = 1000.0
    high_risk_warnings: bool = True

class NotificationPrefsUpdate(NotificationPrefsBase):
    pass

class FinancialPrefsBase(BaseModel):
    monthly_budget: float = 0.0
    savings_target: float = 0.0
    goal_setup: Optional[Dict] = None

class FinancialPrefsUpdate(FinancialPrefsBase):
    pass

class UserActivity(BaseModel):
    id: int
    activity_type: str
    description: str
    timestamp: datetime

    class Config:
        from_attributes = True

class UserCurrencyBase(BaseModel):
    currency_code: str
    country_name: str
    symbol: str

class UserCurrencyUpdate(UserCurrencyBase):
    pass

class UserCurrency(UserCurrencyBase):
    user_id: int
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True


# Investment Schemas
class InvestmentBase(BaseModel):
    asset_name: str
    asset_type: str
    quantity: float
    buy_price: float
    current_price: float
    purchase_date: datetime
    risk_level: Optional[str] = 'Medium'
    notes: Optional[str] = None

class InvestmentCreate(InvestmentBase):
    pass

class InvestmentOut(InvestmentBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PortfolioSummaryOut(BaseModel):
    total_investment_value: float
    total_savings: float
    cash_balance: float
    debt: float
    net_worth: float
    monthly_growth: float
    monthly_growth_percent: float

class AssetAllocationItem(BaseModel):
    type: str
    percentage: float
    color: str

class InvestmentDashboardData(BaseModel):
    summary: PortfolioSummaryOut
    allocation: List[AssetAllocationItem]
    portfolio: List[InvestmentOut]

class CalendarEventBase(BaseModel):
    title: str
    event_type: str  # Salary / EMI / Bill / Subscription / Investment / Goal / Reminder
    amount: float
    event_date: str  # YYYY-MM-DD
    event_time: str  # HH:MM
    repeat_type: Optional[str] = "None"  # None / Daily / Weekly / Monthly
    priority: Optional[str] = "Medium"  # Low / Medium / High
    notes: Optional[str] = None

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventUpdate(CalendarEventBase):
    pass

class CalendarEventOut(CalendarEventBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

