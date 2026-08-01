"""Progress tracking API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from services.progress_service import get_progress_dashboard
from tools.db_tools import update_last_active

router = APIRouter()


@router.get('/progress/{user_id}')
async def api_get_progress(user_id: str, db: AsyncSession = Depends(get_db)):
    """Get full progress dashboard data for a user."""
    result = await get_progress_dashboard(db, user_id)
    
    if 'error' in result:
        raise HTTPException(status_code=404, detail=result['error'])
    
    await update_last_active(db, user_id)
    await db.commit()
    
    return result


import uuid

def generate_daily_tasks(skills, aspiration_text):
    if not skills:
        return []
        
    tasks = []
    templates = [
        "Watch a 10-min video on {skill}",
        "Read an article about {skill}",
        "Practice {skill} for 15 minutes",
        "Reflect on your progress in {skill}",
        "Journal about how {skill} connects to your aspiration"
    ]
    
    for i in range(len(skills)):
        skill_name = skills[i]['skill_name']
        template = templates[i % len(templates)]
        title = template.format(skill=skill_name)
        
        tasks.append({
            "id": str(uuid.uuid4()),
            "title": title,
            "tag": skill_name,
            "estimated_minutes": 15,
            "done": False
        })
        
    return tasks

from api.routes_auth import get_current_user
from db.models import User

@router.get('')
async def api_get_dashboard(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return frontend-compatible dashboard struct"""
    progress = await get_progress_dashboard(db, current_user.id)
    
    # Calculate some dynamic values based on progress data
    human_potential = round(progress.get('overall_score', 0) * 10, 1) # Scale 10 to 100
    next_ms = progress.get('next_milestone', 'Keep learning!')
    
    skills_matrix = []
    for s in progress.get('skills', []):
        skills_matrix.append({
            "skill": s['skill_name'],
            "score": round(s['current_level'] * 10, 1),
            "target": 100,
            "category": "Core"
        })
        
    growth_nudge = progress.get('growth_nudge')
    intervention = {
        "id": "int-1",
        "type": "gap_detected",
        "title": "Skill Imbalance Detected",
        "topic": growth_nudge['dominant_skill'] if growth_nudge else "General",
        "problemSummary": "You are focusing heavily on one area.",
        "curatorActionTaken": "Rebalanced your curation feed.",
        "suggestedActionText": growth_nudge['nudge_message'] if growth_nudge else "Keep up the great work!",
        "actionRoute": "/curation",
        "severity": "medium"
    } if growth_nudge else {
        "id": "int-1",
        "type": "breakthrough_opportunity",
        "title": "Consistent Growth",
        "topic": "All Skills",
        "problemSummary": "You are growing consistently.",
        "curatorActionTaken": "None needed.",
        "suggestedActionText": "Check out your next roadmap milestone.",
        "actionRoute": "/roadmap",
        "severity": "low"
    }

    # ── Real Dynamic Activity Tracking ──
    from datetime import timedelta
    from sqlalchemy import select, func
    from db.models import ContentHistory
    from tools.db_tools import utcnow

    today = utcnow().date()
    start_of_week = today - timedelta(days=today.weekday())

    history_res = await db.execute(
        select(ContentHistory.consumed_at)
        .where(ContentHistory.user_id == current_user.id)
    )
    history_rows = history_res.scalars().all()
    active_dates = set(dt.date() for dt in history_rows if dt)

    if current_user.created_at:
        active_dates.add(current_user.created_at.date())
    active_dates.add(today)

    short_day_names = ["M", "T", "W", "T", "F", "S", "S"]
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    weekly_presence = []
    daily_focus_logs = []
    total_weekly_hours = 0.0

    for i in range(7):
        day_date = start_of_week + timedelta(days=i)
        is_active = (day_date in active_dates)
        
        items_on_day = sum(1 for dt in history_rows if dt and dt.date() == day_date)
        hours = round(items_on_day * 0.5, 1) if items_on_day > 0 else (0.5 if (is_active and day_date == today) else 0.0)
        total_weekly_hours += hours
        
        weekly_presence.append({
            "day": short_day_names[i],
            "active": is_active
        })
        
        daily_focus_logs.append({
            "day": day_names[i],
            "mindfulHours": hours,
            "intentionality": 85 if is_active else 0
        })

    active_count = sum(1 for p in weekly_presence if p["active"])

    response = {
      "profile": {
        "name": current_user.name,
        "avatarUrl": current_user.avatar_url or "https://api.dicebear.com/7.x/avataaars/svg?seed=" + current_user.name,
        "currentRole": current_user.role,
        "aspirationalIdentity": current_user.aspiration_text or "Growth Mindset Aspirant",
        "humanPotentialScore": human_potential,
        "humanPotentialBreakdown": {
          "taskCompletion": 80,
          "consistency": 85,
          "appliedPractice": 75,
          "reflectionQuality": 80,
          "balancedGrowth": 70,
          "noveltyLearning": 80,
          "passivePenalty": 5,
          "total": human_potential
        },
        "mindfulConsumptionRate": 88,
        "weeklyFocusHours": round(total_weekly_hours, 1),
        "dopamineTrapsBlocked": 42,
        "activeStreakDays": progress.get('streak_days', 1),
        "currentMilestone": next_ms,
        "curatorStatus": "Active Curation",
        "overallRoadmapProgress": 35
      },
      "weeklyPresence": weekly_presence,
      "activeDaysCount": active_count,
      "intervention": intervention,
      "resources": [],
      "metrics": {
        "growthVelocity": 12,
        "attentionToIntentRatio": 85,
        "retentionRate": 78,
        "fatigueIndex": 22,
        "dailyFocusLogs": daily_focus_logs,
        "skillMatrix": skills_matrix,
        "topicProgress": []
      },
      "roadmapStages": [],
      "daily_tasks": generate_daily_tasks(progress.get('skills', []), current_user.aspiration_text),
      "aiCoach": {
        "message": "I noticed you're progressing well! Let's tackle a new challenge today.",
        "focusTopic": "Skill Development",
        "tip": "Consistency is key.",
        "energyLevel": "High"
      },
      "learningConsistency": {
        "currentStreak": progress.get('streak_days', 1),
        "weeklyHours": round(total_weekly_hours, 1),
        "weeklyConsistencyPercent": round((active_count / 7.0) * 100),
        "bestStreak": progress.get('streak_days', 1),
        "dailyGoalMet": [p["active"] for p in weekly_presence]
      },
      "goalPlanner": {
        "careerGoal": current_user.aspiration_text or "General Growth",
        "targetDate": "2027-01-01",
        "weeklyStudyHours": 10,
        "progressPercent": 35,
        "milestones": [
          { "label": "Start Journey", "done": True },
          { "label": next_ms, "done": False }
        ]
      }
    }
    return response
