"""Scheduler Service — background task scheduling for daily tasks and inactivity checks."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import async_session_maker


scheduler = AsyncIOScheduler()


async def daily_task_generation_job():
    """Run daily to generate tasks for all active users."""
    from tools.db_tools import get_all_user_ids  # We'll need this
    from services.task_service import generate_tasks_for_user
    
    # This would iterate over all users and generate tasks
    # For the hackathon, this is triggered manually via API
    pass


async def inactivity_check_job():
    """Run daily to check for inactive users and send nudges."""
    # For the hackathon, this is triggered manually via API
    pass


def start_scheduler():
    """Start the background scheduler."""
    # Daily task generation at 6 AM
    scheduler.add_job(daily_task_generation_job, 'cron', hour=6, minute=0)
    
    # Inactivity check at 10 AM
    scheduler.add_job(inactivity_check_job, 'cron', hour=10, minute=0)
    
    scheduler.start()


def stop_scheduler():
    """Stop the background scheduler."""
    if scheduler.running:
        scheduler.shutdown()
