from core.database import SessionLocal
from models.models import FinancialGoal, Alert, User
from sqlalchemy import func

def finalize_bali():
    db = SessionLocal()
    try:
        # 1. Find the user (assuming Keerthan)
        user = db.query(User).first()
        if not user:
            print("User not found")
            return

        # 2. Find Bali Goal
        goal = db.query(FinancialGoal).filter(
            FinancialGoal.user_id == user.id,
            FinancialGoal.name.ilike('%bali%')
        ).first()

        if goal:
            goal.is_completed = True
            goal.current_amount = goal.target_amount
            print(f"Goal '{goal.name}' marked as completed.")
        else:
            print("Bali goal not found in database.")

        # 3. Inject achievement alert
        new_alert = Alert(
            user_id=user.id,
            title="Intelligence Update",
            message="we are ready for bali trip",
            severity="Info",
            is_read=False
        )
        db.add(new_alert)
        db.commit()
        print("Achievement alert injected successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    finalize_bali()
