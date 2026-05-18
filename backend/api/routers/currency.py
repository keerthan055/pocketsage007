from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from models.models import User, UserCurrencyPreference
from schemas.schemas import UserCurrency as UserCurrencySchema, UserCurrencyUpdate

router = APIRouter(tags=["currency"])

@router.get("/", response_model=UserCurrencySchema)
def get_currency_preference(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = db.query(UserCurrencyPreference).filter(UserCurrencyPreference.user_id == current_user.id).first()
    if not pref:
        # Default to USD
        pref = UserCurrencyPreference(user_id=current_user.id, currency_code="USD", country_name="USA", symbol="$")
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref

@router.put("/update", response_model=UserCurrencySchema)
def update_currency_preference(pref_in: UserCurrencyUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = db.query(UserCurrencyPreference).filter(UserCurrencyPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserCurrencyPreference(user_id=current_user.id)
        db.add(pref)
    
    pref.currency_code = pref_in.currency_code
    pref.country_name = pref_in.country_name
    pref.symbol = pref_in.symbol
    
    db.commit()
    db.refresh(pref)
    return pref
