"""Content analysis API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from schemas.content_schemas import (
    AnalyzeContentRequest,
    AnalyzeContentResponse,
    UpdateSkillsRequest,
    UpdateSkillsResponse,
)
from services.analysis_service import analyze_single_content, update_user_skills
from tools.db_tools import update_last_active

router = APIRouter()


@router.post('/analyze-content')
async def api_analyze_content(
    request: AnalyzeContentRequest,
    db: AsyncSession = Depends(get_db),
):
    """Analyze a single content URL (YouTube, Instagram, article)."""
    result = await analyze_single_content(
        db=db,
        user_id=request.user_id,
        content_url=request.content_url,
        platform=request.platform,
    )
    
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    
    await update_last_active(db, request.user_id)
    await db.commit()
    
    return result


@router.post('/update-skills')
async def api_update_skills(
    request: UpdateSkillsRequest,
    db: AsyncSession = Depends(get_db),
):
    """Bulk analyze consumed content and update skill levels.
    
    This is the 'Update Your Skills' button endpoint.
    """
    result = await update_user_skills(
        db=db,
        user_id=request.user_id,
        content_urls=request.content_urls,
    )
    
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    
    await update_last_active(db, request.user_id)
    await db.commit()
    
    return result
