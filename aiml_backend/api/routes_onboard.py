"""Onboarding API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json

from db.database import get_db
from schemas.user_schemas import OnboardRequest, OnboardResponse, UserProfileResponse
from services.onboarding_service import onboard_user
from tools.db_tools import get_user, get_user_by_email, get_user_skills, update_last_active
from config import PREDEFINED_SKILLS
from api.routes_auth import get_current_user
from db.models import User
from sqlalchemy import update

router = APIRouter(prefix="/onboarding")

currentSelfTags = [
  "Unrelaxed", "Don't Believe In Myself", "Tired", "Lazy", "Absent-minded", "Small Faith", "Depressed", "In Debt", "Isolated", "Disconnected", "Dreamer", "Time Management", "Busy", "Exhausted", "Perfectionist", "Fitness Inconsistency", "Self-conscious", "Out Of Shape", "Burnt Out", "Creatively Stuck", "Procrastination", "Skilled", "Easily Distracted", "Stressed", "Analytical", "Afraid Of Failure", "Impatient", "Comfortable", "Introvert", "Sluggish", "Ashamed Of Past", "Misunderstood", "Burdened", "I Want It Now Without Work", "Struggle To Execute Ideas", "Undisciplined", "Creator", "Directionless", "Frustrated", "Not Social", "Fearful", "Lonely", "Self-critical", "Self-doubt", "Inconsistent", "Overstimulated", "Overwhelmed", "Unproductive", "Defensive", "Distracted", "Outcome-obsessed", "Stuck", "Anxious", "Inactive", "Unstructured", "Impulsive", "Nervous", "Restless", "Shy", "Unbalanced", "Extrovert", "Financially Impulsive", "Joker", "Dehydrated", "Doubtful", "Frazzled", "Hesitant", "Insecure", "Discouraged", "Fixed Mindset", "Fatigued", "Jealous", "Tense", "Unconfident", "Unfulfilled", "Unsettled", "Disorganized", "Irritable", "Motivation", "Over-consuming", "Running Late", "Sleep-deprived", "Striving", "Uncertain", "Unfit", "Unmotivated", "Excuse-making", "Low-mood", "Negative", "Panicked", "Worrisome", "Artist", "Foggy", "Hidden", "Indecisive", "Masked", "Numb", "Afraid", "Avoidant", "Controlling", "Guarded", "Lacks Expertise", "Rigid", "Skeptical", "Uninformed", "Uninspired", "Blocked", "Chaotic", "Dependent", "Reactive", "Risk-averse", "Self-centered", "Unfocused", "Ashamed", "Mindless", "Overworks", "Pessimistic", "Short-sighted", "Short-term", "Stagnant", "Uncreative", "Unimaginative", "Withdrawn", "Argumentative", "Arrogant", "Bitter", "Consumed", "Depleted", "Detached", "Limited", "Passive", "Scarcity-minded", "Sedentary", "Stop-start", "Disengaged", "Frozen", "Imitative", "Scattered", "Timid", "Apathetic", "Complacent"
]

imagineSelfTags = [
  "System Architecture",
  "Deep Focus & Flow",
  "Stoicism",
  "Public Speaking",
  "Financial Literacy",
  "Personal Brand",
  "Communication"
]

class OnboardingSubmitRequest(BaseModel):
    currentSelf: List[str] = []
    imagineSelf: List[str] = []
    learningStyles: List[str] = []
    aspirationFocus: List[str] = []
    mediaPreferences: List[str] = []
    dailyCommitmentMinutes: int = 30


@router.post('/onboard', response_model=OnboardResponse)
async def api_onboard(request: OnboardRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with their skills and aspirations."""
    existing_user = await get_user_by_email(db, request.email)
    if existing_user:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="User with this email already exists. Please use a different email or log in.")
        
    result = await onboard_user(
        db=db,
        name=request.name,
        email=request.email,
        aspiration_text=request.aspiration_text,
        selected_skills=request.selected_skills,
        custom_skill_text=', '.join(request.custom_skills) if request.custom_skills else '',
    )
    return result


@router.get('/profile/{user_id}', response_model=UserProfileResponse)
async def api_get_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    """Get user profile with skill levels."""
    user = await get_user(db, user_id)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail='User not found')
    
    skills = await get_user_skills(db, user_id)
    await update_last_active(db, user_id)
    await db.commit()
    
    return {
        'user_id': user.id,
        'name': user.name,
        'email': user.email,
        'aspiration_text': user.aspiration_text or '',
        'last_active_at': str(user.last_active_at) if user.last_active_at else None,
        'skills': [
            {
                'skill_name': s.skill_name,
                'current_level': round(s.current_level, 2),
                'level_label': s.level_label or 'beginner',
            }
            for s in skills
        ],
        'behavior_pattern': 'active',  # Simplified for now
    }


@router.get('/attributes')
async def get_attributes(search: str = None, type: str = None):
    cur = [{"name": n, "type": "current", "popular": True} for n in currentSelfTags]
    img = [{"name": n, "type": "imagine", "popular": True} for n in imagineSelfTags]
    
    if search:
        s = search.lower()
        cur = [x for x in cur if s in x["name"].lower()]
        img = [x for x in img if s in x["name"].lower()]
        
    return {"total": len(cur) + len(img), "currentSelf": cur, "imagineSelf": img}


@router.get('/questions')
async def get_questions():
    return {
    "questions": [
      {
        "id": "step-1",
        "stepNumber": 1,
        "title": "Select characteristics of your current self (\"Me\")",
        "type": "multi-node",
        "required": True,
        "options": [{"name": n, "type": "current", "popular": True} for n in currentSelfTags]
      },
      {
        "id": "step-2",
        "stepNumber": 2,
        "title": "Select features of the self you imagine (\"I Am\")",
        "type": "multi-node",
        "required": True,
        "options": [{"name": n, "type": "imagine", "popular": True} for n in imagineSelfTags]
      },
      {
        "id": "step-3",
        "stepNumber": 3,
        "title": "How do you learn best?",
        "type": "multi-node",
        "required": True,
        "options": [
          { "name": "Verbal", "desc": "Reading & written articles" },
          { "name": "Aural", "desc": "Podcasts & audio guides" },
          { "name": "Kinesthetic", "desc": "Interactive exercises & practice" },
          { "name": "Logical", "desc": "Systems & analytics" },
        ],
      },
      {
        "id": "step-4",
        "stepNumber": 4,
        "title": "Which dimensions of your life need focus?",
        "type": "multi-node",
        "required": True,
        "options": [
          { "name": "Career & Wealth" },
          { "name": "Mindset & Peace" },
          { "name": "Health & Vitality" },
          { "name": "Creative Expression" },
          { "name": "Relationships & Social" },
        ],
      },
      {
        "id": "step-5",
        "stepNumber": 5,
        "title": "How much time can you commit daily?",
        "type": "single-node",
        "required": True,
        "options": [
          { "minutes": 15, "label": "15 Minutes / Day" },
          { "minutes": 30, "label": "30 Minutes / Day" },
          { "minutes": 45, "label": "45 Minutes / Day" },
          { "minutes": 60, "label": "60+ Minutes / Day" },
        ],
      },
    ]
  }

@router.post('/submit')
async def submit_onboarding(req: OnboardingSubmitRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    updated = req.dict()
    updated["isOnboarded"] = True
    
    # Use selected future skills from imagineSelf to create actual skill nodes for the user!
    skills_to_add = req.imagineSelf if req.imagineSelf else ["System Architecture", "Stoicism", "Deep Focus & Flow"]
    
    # Save onboarding json
    await db.execute(
        update(User)
        .where(User.id == current_user.id)
        .values(
            onboarding_data=json.dumps(updated), 
            onboarding_completed=True,
            aspiration_text=", ".join(req.imagineSelf)
        )
    )
    
    # Generate skills if they don't have them
    existing_skills = await get_user_skills(db, current_user.id)
    if not existing_skills:
        from tools.db_tools import create_user_skill
        for skill_name in skills_to_add:
            await create_user_skill(db, current_user.id, skill_name, 0.0)
            
    await db.commit()
    
    return {"message": "Onboarding profile saved successfully", "onboarding": updated}
