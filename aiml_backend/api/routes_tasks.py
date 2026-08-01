"""Daily task API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from services.task_service import get_daily_tasks, generate_tasks_for_user, complete_user_task
from tools.db_tools import update_last_active

router = APIRouter()


@router.get('/daily-tasks/{user_id}')
async def api_get_daily_tasks(user_id: str, db: AsyncSession = Depends(get_db)):
    """Get today's daily tasks for a user."""
    result = await get_daily_tasks(db, user_id)
    await update_last_active(db, user_id)
    await db.commit()
    return result


@router.post('/daily-tasks/{user_id}/generate')
async def api_generate_tasks(user_id: str, db: AsyncSession = Depends(get_db)):
    """Generate new daily tasks for a user."""
    result = await generate_tasks_for_user(db, user_id)
    
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    
    await update_last_active(db, user_id)
    await db.commit()
    return result


@router.post('/daily-tasks/{task_id}/complete')
async def api_complete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Mark a daily task as completed."""
    # We need user_id for engagement logging
    from pydantic import BaseModel
    from fastapi import Body
    
    # For simplicity, get user_id from the task itself
    from tools.db_tools import complete_task as db_complete_task_raw
    from sqlalchemy import select
    from db.models import DailyTask
    
    stmt = select(DailyTask).where(DailyTask.id == task_id)
    result = await db.execute(stmt)
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail='Task not found')
    
    completion_result = await complete_user_task(db, task.user_id, task_id)
    
    if 'error' in completion_result:
        raise HTTPException(status_code=400, detail=completion_result['error'])
    
    return completion_result
