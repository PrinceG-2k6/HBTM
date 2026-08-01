"""Content curation API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from db.database import get_db
from services.curation_service import get_curated_feed
from tools.db_tools import update_last_active

router = APIRouter()


class CurateRequest(BaseModel):
    user_id: str
    content_types: Optional[list[str]] = None  # ['youtube', 'books', 'articles', 'events']
    max_per_skill: int = 3


@router.post('/curate')
async def api_curate(request: CurateRequest, db: AsyncSession = Depends(get_db)):
    """Get a personalized curated content feed for the user."""
    result = await get_curated_feed(
        db=db,
        user_id=request.user_id,
        content_types=request.content_types,
        max_per_skill=request.max_per_skill,
    )
    
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    
    await update_last_active(db, request.user_id)
    await db.commit()
    
    return result


from api.routes_auth import get_current_user
from db.models import User

from sqlalchemy import select
from fastapi import BackgroundTasks
from services.analysis_service import update_user_skills

@router.get('/feed')
async def api_get_feed(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """GET feed for frontend"""
    result = await get_curated_feed(
        db=db,
        user_id=current_user.id,
        content_types=['youtube'],
        max_per_skill=3,
    )
    
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
        
    # Get previously completed urls
    stmt = select(ContentHistory.content_url).where(ContentHistory.user_id == current_user.id)
    completed_res = await db.execute(stmt)
    completed_urls = [r[0] for r in completed_res.fetchall()]
    
    result['completed_urls'] = completed_urls
        
    await update_last_active(db, current_user.id)
    await db.commit()
    
    return result

class CompleteContentRequest(BaseModel):
    url: str
    title: str
    content_type: str
    platform: str
    skill_name: Optional[str] = None

from db.models import ContentHistory
from tools.db_tools import utcnow, get_user_skills, update_skill_level
from tools.skill_tools import get_level_label
from db.database import async_session_maker

async def background_skill_update(user_id: str, url: str, skill_name: Optional[str] = None):
    async with async_session_maker() as db:
        try:
            skills_updated = await update_user_skills(db, user_id, [url])
            print(f"Ran background_skill_update for {user_id}: {skills_updated}")
            
            # If the LLM ran but found NO skill matches, force the bump!
            if not skills_updated and skill_name:
                raise Exception("No skills were updated by analysis, forcing fallback bump")
        except Exception as e:
            print(f"background_skill_update error: {e}")
            if skill_name:
                print(f"Fallback direct skill bump for {skill_name}")
                skills = await get_user_skills(db, user_id)
                target = next((s for s in skills if s.skill_name == skill_name), None)
                if target:
                    new_level = target.current_level + 0.2
                    new_label = get_level_label(new_level)
                    await update_skill_level(db, target.id, new_level, new_label)
                    print(f"Direct skill bump successful for {skill_name}")

@router.post('/complete')
async def api_complete_content(
    request: CompleteContentRequest, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Mark a curated feed item as completed and synchronously update skill progress."""
    history = ContentHistory(
        user_id=current_user.id,
        content_url=request.url,
        title=request.title,
        content_type=request.content_type,
        platform=request.platform,
        matched_skills=request.skill_name,
        consumed_at=utcnow()
    )
    db.add(history)
    
    # Synchronously bump target skill level by +0.2
    updated_skill_info = None
    user_skills = await get_user_skills(db, current_user.id)
    
    target_skill = None
    if request.skill_name:
        target_skill = next((s for s in user_skills if s.skill_name.lower() == request.skill_name.lower()), None)
    
    if not target_skill and user_skills:
        target_skill = user_skills[0]
        
    if target_skill:
        new_level = round(min(10.0, target_skill.current_level + 0.2), 2)
        new_label = get_level_label(new_level)
        await update_skill_level(db, target_skill.id, new_level, new_label)
        updated_skill_info = {
            "skill_name": target_skill.skill_name,
            "new_level": new_level,
            "level_label": new_label
        }
        print(f"Instantly bumped skill '{target_skill.skill_name}' for user {current_user.id} to level {new_level}")

    await db.commit()
    
    from services.curation_service import _feed_cache
    if current_user.id in _feed_cache:
        del _feed_cache[current_user.id]
    
    return {
        "status": "success", 
        "message": "Content marked as completed and skill level updated!",
        "updated_skill": updated_skill_info
    }

