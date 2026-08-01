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

@router.get('/feed')
async def api_get_feed(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """GET feed for frontend"""
    result = await get_curated_feed(
        db=db,
        user_id=current_user.id,
        content_types=['youtube', 'books', 'articles'],
        max_per_skill=3,
    )
    
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
        
    await update_last_active(db, current_user.id)
    await db.commit()
    
    return result
