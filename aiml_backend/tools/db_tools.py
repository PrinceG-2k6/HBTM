from sqlalchemy import select, update, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import User, UserSkill, ContentHistory, DailyTask, EngagementLog
from datetime import datetime, timedelta, timezone
import json

def utcnow():
    return datetime.utcnow()

# === User Operations ===
async def get_user(db: AsyncSession, user_id: str) -> User | None:
    """Get user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Get user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_id: str, name: str, email: str, aspiration_text: str = '') -> User:
    """Create a new user."""
    new_user = User(
        id=user_id,
        name=name,
        email=email,
        aspiration_text=aspiration_text,
        created_at=utcnow(),
        last_active_at=utcnow()
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def update_last_active(db: AsyncSession, user_id: str) -> None:
    """Update user's last_active_at timestamp."""
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(last_active_at=utcnow())
    )
    await db.commit()

# === Skill Operations ===
async def get_user_skills(db: AsyncSession, user_id: str) -> list[UserSkill]:
    """Get all skills for a user."""
    result = await db.execute(select(UserSkill).where(UserSkill.user_id == user_id))
    return list(result.scalars().all())

async def create_user_skill(db: AsyncSession, user_id: str, skill_name: str, initial_level: float = 0.0) -> UserSkill:
    """Create a new skill for a user."""
    skill = UserSkill(
        user_id=user_id,
        skill_name=skill_name,
        current_level=initial_level,
        created_at=utcnow(),
        updated_at=utcnow()
    )
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return skill

async def update_skill_level(db: AsyncSession, skill_id: int, new_level: float, new_label: str, sandbox_unlocked_level: float = None) -> None:
    """Update a skill's level and label."""
    await db.execute(
        update(UserSkill)
        .where(UserSkill.id == skill_id)
        .values(
            current_level=new_level, 
            level_label=new_label, 
            sandbox_unlocked_level=sandbox_unlocked_level,
            updated_at=utcnow()
        )
    )
    await db.commit()

async def bulk_update_skills(db: AsyncSession, updates: list[dict]) -> None:
    """Bulk update multiple skill levels. Each dict: { 'skill_id': int, 'new_level': float, 'new_label': str, 'sandbox_unlocked_level': float }"""
    for update_data in updates:
        await db.execute(
            update(UserSkill)
            .where(UserSkill.id == update_data['skill_id'])
            .values(
                current_level=update_data['new_level'],
                level_label=update_data.get('new_label', ''),
                sandbox_unlocked_level=update_data.get('sandbox_unlocked_level'),
                updated_at=utcnow()
            )
        )
    await db.commit()

# === Content History Operations ===
async def save_content_analysis(db: AsyncSession, user_id: str, analysis: dict) -> ContentHistory:
    """Save analyzed content to history."""
    content = ContentHistory(
        user_id=user_id,
        content_url=analysis.get('content_url', ''),
        content_type=analysis.get('content_type', 'article'),
        title=analysis.get('title', ''),
        detected_topics=json.dumps(analysis.get('topics', [])),
        description=analysis.get('summary', ''),
        analyzed_at=utcnow()
    )
    db.add(content)
    await db.commit()
    await db.refresh(content)
    return content

async def get_user_content_history(db: AsyncSession, user_id: str, days: int = 7, limit: int = 50) -> list[ContentHistory]:
    """Get user's content consumption history."""
    cutoff = utcnow() - timedelta(days=days)
    result = await db.execute(
        select(ContentHistory)
        .where(ContentHistory.user_id == user_id, ContentHistory.analyzed_at >= cutoff)
        .order_by(ContentHistory.analyzed_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())

async def get_content_count(db: AsyncSession, user_id: str, days: int = 7) -> int:
    """Count content analyzed in last N days."""
    cutoff = utcnow() - timedelta(days=days)
    result = await db.execute(
        select(func.count(ContentHistory.id))
        .where(ContentHistory.user_id == user_id, ContentHistory.analyzed_at >= cutoff)
    )
    return result.scalar_one()

# === Task Operations ===
async def create_daily_task(
    db: AsyncSession, 
    user_id: str, 
    skill_name: str, 
    description: str, 
    task_type: str, 
    difficulty: str, 
    resource_url: str = None, 
    due_date=None
) -> DailyTask:
    """Create a new daily task."""
    if due_date is None:
        due_date = utcnow() + timedelta(days=1)
        
    task = DailyTask(
        user_id=user_id,
        skill_name=skill_name,
        description=description,
        task_type=task_type,
        difficulty=difficulty,
        resource_url=resource_url,
        due_date=due_date,
        created_at=utcnow(),
        status="pending"
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

async def get_pending_tasks(db: AsyncSession, user_id: str) -> list[DailyTask]:
    """Get all pending tasks for today."""
    result = await db.execute(
        select(DailyTask)
        .where(DailyTask.user_id == user_id, DailyTask.status == "pending")
    )
    return list(result.scalars().all())

async def complete_task(db: AsyncSession, task_id: int) -> DailyTask | None:
    """Mark a task as completed."""
    await db.execute(
        update(DailyTask)
        .where(DailyTask.id == task_id)
        .values(status="completed", completed_at=utcnow())
    )
    await db.commit()
    result = await db.execute(select(DailyTask).where(DailyTask.id == task_id))
    return result.scalar_one_or_none()

async def get_task_completion_rate(db: AsyncSession, user_id: str, days: int = 7) -> float:
    """Calculate task completion rate over last N days."""
    cutoff = utcnow() - timedelta(days=days)
    
    total_result = await db.execute(
        select(func.count(DailyTask.id))
        .where(DailyTask.user_id == user_id, DailyTask.assigned_at >= cutoff)
    )
    total_tasks = total_result.scalar_one()
    
    if total_tasks == 0:
        return 0.0
        
    completed_result = await db.execute(
        select(func.count(DailyTask.id))
        .where(DailyTask.user_id == user_id, DailyTask.assigned_at >= cutoff, DailyTask.status == "completed")
    )
    completed_tasks = completed_result.scalar_one()
    
    return float(completed_tasks) / total_tasks

async def expire_old_tasks(db: AsyncSession, user_id: str) -> int:
    """Mark overdue pending tasks as expired. Returns count of expired tasks."""
    now = utcnow()
    result = await db.execute(
        update(DailyTask)
        .where(DailyTask.user_id == user_id, DailyTask.status == "pending", DailyTask.due_date < now)
        .values(status="expired")
    )
    await db.commit()
    return result.rowcount

# === Engagement Operations ===
async def log_engagement(db: AsyncSession, user_id: str, event_type: str, metadata: dict = None) -> None:
    """Log an engagement event."""
    log = EngagementLog(
        user_id=user_id,
        event_type=event_type,
        metadata_json=json.dumps(metadata) if metadata else "{}",
        created_at=utcnow()
    )
    db.add(log)
    await db.commit()

async def get_days_since_last_active(db: AsyncSession, user_id: str) -> int:
    """Calculate days since user was last active."""
    user = await get_user(db, user_id)
    if not user or not user.last_active_at:
        return 0
    delta = utcnow() - user.last_active_at
    return delta.days

async def get_streak_days(db: AsyncSession, user_id: str) -> int:
    """Calculate the user's current streak (consecutive days with at least one task completed)."""
    result = await db.execute(
        select(DailyTask.completed_at)
        .where(DailyTask.user_id == user_id, DailyTask.status == "completed")
        .order_by(DailyTask.completed_at.desc())
    )
    completed_dates = [row[0].date() for row in result.all() if row[0]]
    if not completed_dates:
        return 0
        
    unique_dates = sorted(list(set(completed_dates)), reverse=True)
    today = utcnow().date()
    
    streak = 0
    current_check_date = today
    
    if unique_dates and unique_dates[0] != today:
        if unique_dates[0] == today - timedelta(days=1):
            current_check_date = today - timedelta(days=1)
        else:
            return 0
            
    for d in unique_dates:
        if d == current_check_date:
            streak += 1
            current_check_date -= timedelta(days=1)
        elif d > current_check_date:
            continue
        else:
            break
            
    return streak
