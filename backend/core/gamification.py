from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import models

RANKS = {
    1: "ROOKIE",
    2: "SCOUT",
    3: "RANGER",
    4: "SENTINEL",
    5: "TITAN",
    6: "OVERLORD",
    7: "NEXUS PRIME",
    8: "QUANTUM ELITE",
    9: "VOID COMMANDER",
    10: "FINANCIAL LEGEND"
}

XP_THRESHOLDS = {
    1: 1000,
    2: 2500,
    3: 5000,
    4: 8500,
    5: 12000,
    6: 16000,
    7: 21000,
    8: 27000,
    9: 34000,
    10: 9999999
}

def get_or_create_profile(db: Session, user_id: int) -> models.GamificationProfile:
    profile = db.query(models.GamificationProfile).filter(models.GamificationProfile.user_id == user_id).first()
    if not profile:
        profile = models.GamificationProfile(
            user_id=user_id,
            xp=0,
            level=1,
            rank="ROOKIE",
            streak=1,
            last_level_up_at=None,
            total_goals_completed=0
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

def get_level_for_xp(xp: int) -> int:
    for lvl in range(1, 10):
        if xp < XP_THRESHOLDS[lvl]:
            return lvl
    return 10

def add_xp(db: Session, user_id: int, amount: int) -> models.GamificationProfile:
    profile = get_or_create_profile(db, user_id)
    profile.xp += amount
    
    # Check if they can level up
    target_level = get_level_for_xp(profile.xp)
    if target_level > profile.level:
        # User is eligible for level up based on XP
        # Check time restriction: max 1 level per month (30 days)
        now = datetime.utcnow()
        can_level_up = False
        if profile.last_level_up_at is None:
            can_level_up = True
        else:
            time_diff = now - profile.last_level_up_at
            if time_diff >= timedelta(days=30):
                can_level_up = True
                
        if can_level_up:
            # We level up by EXACTLY 1 level (maximum level increase = 1 level per month)
            # This prevents instantly jumping multiple levels
            profile.level += 1
            profile.rank = RANKS.get(profile.level, "ROOKIE")
            profile.last_level_up_at = now
            
    db.commit()
    db.refresh(profile)
    return profile

def update_streak(db: Session, user_id: int) -> int:
    profile = get_or_create_profile(db, user_id)
    
    # Find last activity log that is not login/view related to gamification itself to avoid recursive loops,
    # or just look at any user activity log
    last_log = db.query(models.UserActivityLog).filter(
        models.UserActivityLog.user_id == user_id
    ).order_by(models.UserActivityLog.timestamp.desc()).first()
    
    now = datetime.utcnow()
    if last_log:
        last_date = last_log.timestamp.date()
        today = now.date()
        diff = (today - last_date).days
        if diff == 1:
            profile.streak += 1
        elif diff > 1:
            profile.streak = 1
    else:
        profile.streak = 1
        
    db.commit()
    db.refresh(profile)
    return profile.streak

def log_activity(db: Session, user_id: int, activity_type: str, description: str):
    # Log activity in DB
    new_log = models.UserActivityLog(
        user_id=user_id,
        activity_type=activity_type,
        description=description,
        timestamp=datetime.utcnow()
    )
    db.add(new_log)
    db.commit()

def check_and_update_badges(db: Session, user_id: int):
    profile = get_or_create_profile(db, user_id)
    
    # Define the 5 badges with their details
    badges_def = [
        {
            "id": "smart_saver",
            "title": "Smart Saver",
            "icon": "🛡️",
            "condition": "3 months consistent savings",
            "unlock_level": 3
        },
        {
            "id": "debt_crusher",
            "title": "Debt Crusher",
            "icon": "⚔️",
            "condition": "reducing EMI ratio",
            "unlock_level": 5
        },
        {
            "id": "discipline_master",
            "title": "Discipline Master",
            "icon": "👑",
            "condition": "low discretionary spending",
            "unlock_level": 4
        },
        {
            "id": "investment_warrior",
            "title": "Investment Warrior",
            "icon": "🏹",
            "condition": "consistent investments",
            "unlock_level": 4
        },
        {
            "id": "streak_guardian",
            "title": "Streak Guardian",
            "icon": "🔮",
            "condition": "30-day financial streak",
            "unlock_level": 2
        }
    ]
    
    # Load already unlocked badges from DB
    unlocked_badges = {a.badge_id: a for a in db.query(models.UserAchievement).filter(models.UserAchievement.user_id == user_id).all()}
    
    # 1. Smart Saver
    user = db.query(models.User).filter(models.User.id == user_id).first()
    is_smart_saver = False
    if user:
        days_registered = (datetime.utcnow() - user.created_at).days
        if days_registered >= 90:
            is_smart_saver = True
            
    # 2. Debt Crusher
    metrics = db.query(models.FinancialMetrics).filter(models.FinancialMetrics.user_id == user_id).first()
    fds = db.query(models.FinancialDistressScore).filter(models.FinancialDistressScore.user_id == user_id).first()
    is_debt_crusher = False
    if metrics and metrics.debt_to_income_ratio is not None and metrics.debt_to_income_ratio < 0.25:
        is_debt_crusher = True
    elif fds and fds.debt_ratio is not None and fds.debt_ratio < 0.25:
        is_debt_crusher = True
        
    # 3. Discipline Master
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    txs = db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id,
        models.Transaction.date >= thirty_days_ago
    ).all()
    discretionary_categories = {"dining", "shopping", "entertainment", "food", "travel"}
    total_spent = sum(t.amount for t in txs if t.type == models.TransactionType.EXPENSE)
    discretionary_spent = sum(t.amount for t in txs if t.type == models.TransactionType.EXPENSE and t.category.lower() in discretionary_categories)
    is_discipline_master = False
    if total_spent > 0 and (discretionary_spent / total_spent) < 0.3:
        is_discipline_master = True
        
    # 4. Investment Warrior
    investments_count = db.query(models.Investment).filter(models.Investment.user_id == user_id).count()
    is_investment_warrior = investments_count >= 3
    
    # 5. Streak Guardian
    is_streak_guardian = profile.streak >= 30
    
    checks = {
        "smart_saver": is_smart_saver,
        "debt_crusher": is_debt_crusher,
        "discipline_master": is_discipline_master,
        "investment_warrior": is_investment_warrior,
        "streak_guardian": is_streak_guardian
    }
    
    for badge in badges_def:
        bid = badge["id"]
        should_unlock = checks[bid]
        # Also check level requirements
        if profile.level < badge["unlock_level"]:
            should_unlock = False
            
        if should_unlock and bid not in unlocked_badges:
            new_ach = models.UserAchievement(
                user_id=user_id,
                badge_id=bid,
                title=badge["title"],
                icon=badge["icon"],
                condition=badge["condition"],
                unlocked_at=datetime.utcnow()
            )
            db.add(new_ach)
            db.commit()
            unlocked_badges[bid] = new_ach
            
    # Return list of badges with unlocked status
    result = []
    for badge in badges_def:
        bid = badge["id"]
        is_unlocked = bid in unlocked_badges
        dt_str = unlocked_badges[bid].unlocked_at.strftime("%Y-%m-%d") if is_unlocked else None
        result.append({
            "id": bid,
            "title": badge["title"],
            "icon": badge["icon"],
            "unlocked": is_unlocked,
            "unlockLevel": badge["unlock_level"],
            "condition": badge["condition"],
            "date": dt_str
        })
    return result
