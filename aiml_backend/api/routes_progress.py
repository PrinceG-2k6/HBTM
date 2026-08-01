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


from api.routes_auth import get_current_user
from db.models import User

@router.get('')
async def api_get_dashboard(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return frontend-compatible dashboard struct"""
    progress = await get_progress_dashboard(db, current_user.id)
    
    # Calculate some dynamic values based on progress data
    human_potential = progress.get('overall_score', 0) * 10 # Scale 10 to 100
    next_ms = progress.get('next_milestone', 'Keep learning!')
    
    skills_matrix = []
    for s in progress.get('skills', []):
        skills_matrix.append({
            "skill": s['skill_name'],
            "score": s['current_level'] * 10,
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
        "weeklyFocusHours": 5.2,
        "dopamineTrapsBlocked": 42,
        "activeStreakDays": progress.get('streak_days', 0),
        "currentMilestone": next_ms,
        "curatorStatus": "Active Curation",
        "overallRoadmapProgress": 35
      },
      "intervention": intervention,
      "resources": [],
      "metrics": {
        "growthVelocity": 12,
        "attentionToIntentRatio": 85,
        "retentionRate": 78,
        "fatigueIndex": 22,
        "dailyFocusLogs": [],
        "skillMatrix": skills_matrix,
        "topicProgress": []
      },
      "roadmapStages": [],
      "todayMission": {
        "taskTitle": "Daily Check-in",
        "taskType": "Reflection",
        "estimatedMinutes": 5,
        "reward": "+10 XP",
        "nextMilestone": next_ms,
        "progressPercent": 100,
        "route": "/sandbox"
      },
      "aiCoach": {
        "message": "I noticed you're progressing well! Let's tackle a new challenge today.",
        "focusTopic": "Skill Development",
        "tip": "Consistency is key.",
        "energyLevel": "High"
      },
      "learningConsistency": {
        "currentStreak": progress.get('streak_days', 0),
        "weeklyHours": 0,
        "weeklyConsistencyPercent": 0,
        "bestStreak": progress.get('streak_days', 0),
        "dailyGoalMet": [False, False, False, False, False, False, False]
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
