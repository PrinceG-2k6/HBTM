"""Profile management API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import Optional

from db.database import get_db
from db.models import User, UserSkill
from api.routes_auth import get_current_user
from tools.db_tools import utcnow
from tools.skill_tools import get_level_label

router = APIRouter()


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    aspiration_text: Optional[str] = None
    avatar_url: Optional[str] = None


class AddSkillRequest(BaseModel):
    skill_name: str


@router.get('/profile')
async def get_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user profile with skills."""
    result = await db.execute(select(UserSkill).where(UserSkill.user_id == current_user.id))
    skills = result.scalars().all()
    
    import json
    onboarding = json.loads(current_user.onboarding_data) if current_user.onboarding_data else None
    
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "avatar_url": current_user.avatar_url,
            "aspiration_text": current_user.aspiration_text,
            "onboarding": onboarding,
            "created_at": str(current_user.created_at) if current_user.created_at else None,
        },
        "skills": [
            {
                "id": s.id,
                "skill_name": s.skill_name,
                "current_level": round(s.current_level, 2),
                "level_label": s.level_label,
                "updated_at": str(s.updated_at) if s.updated_at else None,
            }
            for s in skills
        ]
    }


@router.put('/profile')
async def update_profile(req: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Update user profile fields."""
    if req.name is not None:
        current_user.name = req.name
    if req.aspiration_text is not None:
        current_user.aspiration_text = req.aspiration_text
    if req.avatar_url is not None:
        current_user.avatar_url = req.avatar_url
    
    await db.commit()
    await db.refresh(current_user)
    
    return {"status": "success", "message": "Profile updated"}


@router.post('/profile/skills')
async def add_skill(req: AddSkillRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Add a new skill to the user's profile."""
    # Check if skill already exists
    result = await db.execute(
        select(UserSkill).where(
            UserSkill.user_id == current_user.id,
            UserSkill.skill_name == req.skill_name
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Skill already exists")
    
    new_skill = UserSkill(
        user_id=current_user.id,
        skill_name=req.skill_name,
        current_level=0.0,
        level_label=get_level_label(0.0),
        sandbox_unlocked_level=0.0,
        created_at=utcnow(),
        updated_at=utcnow(),
    )
    db.add(new_skill)
    await db.commit()
    await db.refresh(new_skill)
    
    return {
        "status": "success",
        "skill": {
            "id": new_skill.id,
            "skill_name": new_skill.skill_name,
            "current_level": 0.0,
            "level_label": new_skill.level_label,
        }
    }


@router.delete('/profile/skills/{skill_id}')
async def remove_skill(skill_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Remove a skill from the user's profile."""
    result = await db.execute(
        select(UserSkill).where(
            UserSkill.id == skill_id,
            UserSkill.user_id == current_user.id
        )
    )
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    await db.delete(skill)
    await db.commit()
    
    return {"status": "success", "message": f"Skill '{skill.skill_name}' removed"}
