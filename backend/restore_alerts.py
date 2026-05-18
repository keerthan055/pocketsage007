from core.database import SessionLocal
from models.models import Alert, User
from datetime import datetime, timedelta

def populate_legacy_alerts():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("User not found")
            return

        legacy_alerts = [
            {
                "title": "Critical Overspending",
                "message": 'You have exceeded your "Dining" budget by 45%. This may impact your rent payment.',
                "severity": "Critical",
                "offset_hours": 1
            },
            {
                "title": "EMI Reminder",
                "message": "HDFC Personal Loan EMI of ₹24,500 is due in 3 days. Ensure sufficient balance.",
                "severity": "Warning",
                "offset_hours": 3
            },
            {
                "title": "Smart Insight",
                "message": "We detected a 15% drop in utility costs this month. Great job on savings!",
                "severity": "Success",
                "offset_hours": 12
            },
            {
                "title": "Subscription Alert",
                "message": "Netflix Premium renewal (₹649) processed successfully.",
                "severity": "Info",
                "offset_hours": 24
            }
        ]

        for data in legacy_alerts:
            # Check if alert already exists to avoid duplicates
            exists = db.query(Alert).filter(
                Alert.user_id == user.id,
                Alert.title == data["title"],
                Alert.message == data["message"]
            ).first()
            
            if not exists:
                alert = Alert(
                    user_id=user.id,
                    title=data["title"],
                    message=data["message"],
                    severity=data["severity"],
                    is_read=True, # Mark legacy ones as read by default
                    created_at=datetime.utcnow() - timedelta(hours=data["offset_hours"])
                )
                db.add(alert)
        
        db.commit()
        print("Legacy alerts restored to database.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_legacy_alerts()
