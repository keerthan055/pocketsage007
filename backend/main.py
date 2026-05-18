from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from core.database import engine, Base
from api.routers import (
    auth, transactions, ml, dashboard, profile, settings, 
    currency, alerts, goals, copilot, insights, investments, 
    calendar, fds, receipts
)
from models import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PocketSage AI - Advanced Financial Intelligence")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix="/auth")
app.include_router(transactions.router, prefix="/transactions")
app.include_router(ml.router, prefix="/ml")
app.include_router(dashboard.router, prefix="/dashboard")
app.include_router(profile.router, prefix="/profile")
app.include_router(settings.router, prefix="/settings")
app.include_router(currency.router, prefix="/currency")
app.include_router(alerts.router, prefix="/alerts")
app.include_router(goals.router, prefix="/goals")
app.include_router(copilot.router, prefix="/copilot")
app.include_router(insights.router, prefix="/insights")
app.include_router(investments.router, prefix="/investments")
app.include_router(calendar.router, prefix="/calendar")
app.include_router(fds.router, prefix="/fds")
app.include_router(receipts.router, prefix="/receipts")

@app.get("/")
async def root():
    return {"message": "Welcome to PocketSage AI - Adaptive Personal Financial Distress Early-Warning System"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
