"""Task Service — manages daily task generation and completion."""

from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime

from tools.db_tools import (
    get_user,
    get_user_skills,
    get_pending_tasks,
    create_daily_task,
    complete_task as db_complete_task,
    get_task_completion_rate,
    get_days_since_last_active,
    get_content_count,
    get_streak_days,
    expire_old_tasks,
    log_engagement,
    get_user_content_history,
)
from config import INACTIVITY_THRESHOLDS, TASK_COMPLETION_THRESHOLDS


def _detect_behavior(days_inactive: int, completion_rate: float, content_count: int) -> str:
    """Detect user behavior pattern."""
    if days_inactive >= INACTIVITY_THRESHOLDS['dormant']:
        return 'dormant'
    elif days_inactive >= INACTIVITY_THRESHOLDS['disengaging']:
        return 'disengaging'
    elif completion_rate < TASK_COMPLETION_THRESHOLDS['struggling']:
        return 'struggling'
    elif completion_rate < TASK_COMPLETION_THRESHOLDS['passive'] and content_count < 3:
        return 'passive'
    else:
        return 'active'


async def get_daily_tasks(db: AsyncSession, user_id: str) -> dict:
    """Get today's tasks for a user. Generate new ones if none exist."""
    # Expire old tasks
    await expire_old_tasks(db, user_id)
    
    # Get existing pending tasks
    tasks = await get_pending_tasks(db, user_id)
    streak = await get_streak_days(db, user_id)
    
    task_list = []
    for t in tasks:
        task_list.append({
            'id': t.id,
            'skill_name': t.skill_name,
            'task_description': t.task_description,
            'task_type': t.task_type,
            'difficulty': t.difficulty,
            'resource_url': t.resource_url,
            'status': t.status,
            'due_date': str(t.due_date) if t.due_date else str(date.today()),
        })
    
    return {
        'tasks': task_list,
        'total_pending': len(task_list),
        'streak_days': streak,
    }


async def generate_tasks_for_user(db: AsyncSession, user_id: str) -> dict:
    """Generate new daily tasks for a user based on their profile and behavior."""
    user = await get_user(db, user_id)
    if not user:
        return {'error': 'User not found'}
    
    skills = await get_user_skills(db, user_id)
    if not skills:
        return {'error': 'No skills found. Complete onboarding first.'}
    
    # Detect behavior
    days_inactive = await get_days_since_last_active(db, user_id)
    completion_rate = await get_task_completion_rate(db, user_id)
    content_count = await get_content_count(db, user_id)
    behavior = _detect_behavior(days_inactive, completion_rate, content_count)
    
    # Determine task count and difficulty
    task_configs = {
        'active': {'count': 4, 'difficulty': 'medium', 'skills_count': 3},
        'passive': {'count': 3, 'difficulty': 'easy', 'skills_count': 2},
        'struggling': {'count': 2, 'difficulty': 'easy', 'skills_count': 1},
        'disengaging': {'count': 1, 'difficulty': 'easy', 'skills_count': 1},
        'dormant': {'count': 1, 'difficulty': 'easy', 'skills_count': 1},
    }
    config = task_configs.get(behavior, task_configs['active'])
    
    # Generate tasks using the agent system
    # For standalone mode, we generate simple template-based tasks
    generated = []
    selected_skills = skills[:config['skills_count']]
    
    task_templates = {
        'beginner': [
            {'type': 'watch', 'template': 'Watch a 5-10 minute introductory video about {skill}'},
            {'type': 'read', 'template': 'Read a beginner\'s guide article about {skill}'},
            {'type': 'reflect', 'template': 'Write 3 things you want to learn about {skill} this week'},
        ],
        'intermediate': [
            {'type': 'practice', 'template': 'Practice {skill} for 15 minutes using a specific technique'},
            {'type': 'watch', 'template': 'Watch an intermediate tutorial on advanced {skill} techniques'},
            {'type': 'read', 'template': 'Read a case study about successful {skill} application'},
        ],
        'advanced': [
            {'type': 'practice', 'template': 'Create a {skill} project or exercise for 30 minutes'},
            {'type': 'attend', 'template': 'Find and attend a {skill} workshop or webinar'},
            {'type': 'reflect', 'template': 'Write a reflection on your {skill} journey and set next milestones'},
        ],
    }
    
    task_count = 0
    for skill in selected_skills:
        if task_count >= config['count']:
            break
        
        level = skill.level_label or 'beginner'
        templates = task_templates.get(level, task_templates['beginner'])
        
        for tmpl in templates:
            if task_count >= config['count']:
                break
            
            description = tmpl['template'].format(skill=skill.skill_name)
            task = await create_daily_task(
                db, user_id, skill.skill_name,
                description, tmpl['type'],
                config['difficulty'],
                due_date=date.today(),
            )
            generated.append({
                'id': task.id,
                'skill_name': task.skill_name,
                'task_description': task.task_description,
                'task_type': task.task_type,
                'difficulty': task.difficulty,
                'status': 'pending',
            })
            task_count += 1
    
    await db.commit()
    
    return {
        'tasks': generated,
        'behavior_pattern': behavior,
        'total_generated': len(generated),
    }


async def complete_user_task(db: AsyncSession, user_id: str, task_id: int) -> dict:
    """Mark a task as completed and log engagement."""
    task = await db_complete_task(db, task_id)
    if not task:
        return {'error': 'Task not found'}
    
    await log_engagement(db, user_id, 'task_completed', {
        'task_id': task_id,
        'skill_name': task.skill_name,
        'task_type': task.task_type,
    })
    await db.commit()
    
    streak = await get_streak_days(db, user_id)
    
    return {
        'status': 'completed',
        'task_id': task_id,
        'skill_name': task.skill_name,
        'streak_days': streak,
        'message': f'Great job! You\'re on a {streak}-day streak. Become the self you imagine! 🚀',
    }
