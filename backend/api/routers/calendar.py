from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from models.models import User, FinancialCalendarEvent, Alert
from schemas.schemas import CalendarEventCreate, CalendarEventUpdate, CalendarEventOut
from typing import List
from datetime import datetime

router = APIRouter(tags=["calendar"])

@router.get("/", response_model=List[CalendarEventOut])
def get_calendar(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    events = db.query(FinancialCalendarEvent).filter(FinancialCalendarEvent.user_id == current_user.id).all()
    
    # Automatic Seeding if no events exist
    if not events:
        current_year = datetime.now().year
        current_month = f"{datetime.now().month:02d}"
        
        seed_data = [
            {
                "title": "HDFC EMI",
                "event_type": "EMI",
                "amount": 24500.0,
                "event_date": f"{current_year}-{current_month}-05",
                "event_time": "10:00",
                "repeat_type": "Monthly",
                "priority": "High",
                "notes": "HDFC Personal Loan EMI"
            },
            {
                "title": "Salary",
                "event_type": "Salary",
                "amount": 150000.0,
                "event_date": f"{current_year}-{current_month}-10",
                "event_time": "09:00",
                "repeat_type": "Monthly",
                "priority": "High",
                "notes": "Monthly payroll credit"
            },
            {
                "title": "Netflix",
                "event_type": "Subscription",
                "amount": 649.0,
                "event_date": f"{current_year}-{current_month}-22",
                "event_time": "00:00",
                "repeat_type": "Monthly",
                "priority": "Low",
                "notes": "Netflix Premium Plan renewal"
            }
        ]
        
        for item in seed_data:
            new_event = FinancialCalendarEvent(
                user_id=current_user.id,
                **item
            )
            db.add(new_event)
        
        db.commit()
        events = db.query(FinancialCalendarEvent).filter(FinancialCalendarEvent.user_id == current_user.id).all()
        
    return events

@router.post("/", response_model=CalendarEventOut)
def create_event(
    event_in: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_event = FinancialCalendarEvent(
        user_id=current_user.id,
        **event_in.model_dump()
    )
    db.add(new_event)
    
    # Automatically generate an alert in Alert Center if priority is High
    if event_in.priority == "High":
        alert_severity = "Warning"
        if event_in.event_type.lower() in ["emi", "bill"]:
            alert_severity = "Critical"
        elif event_in.event_type.lower() == "salary":
            alert_severity = "Success"
            
        new_alert = Alert(
            user_id=current_user.id,
            title=f"Calendar: {event_in.title}",
            message=f"Upcoming {event_in.event_type} of ₹{event_in.amount:,.2f} scheduled on {event_in.event_date} at {event_in.event_time}.",
            severity=alert_severity,
            is_read=False
        )
        db.add(new_alert)
        
    db.commit()
    db.refresh(new_event)
    return new_event

@router.put("/{event_id}", response_model=CalendarEventOut)
def update_event(
    event_id: int,
    event_in: CalendarEventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(FinancialCalendarEvent).filter(
        FinancialCalendarEvent.id == event_id,
        FinancialCalendarEvent.user_id == current_user.id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    update_data = event_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)
        
    db.commit()
    db.refresh(event)
    return event

@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(FinancialCalendarEvent).filter(
        FinancialCalendarEvent.id == event_id,
        FinancialCalendarEvent.user_id == current_user.id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    db.delete(event)
    db.commit()
    return {"status": "success", "message": "Event deleted successfully"}
