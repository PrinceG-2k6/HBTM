"""Content ingestion API routes for YouTube and Instagram."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from db.database import get_db
from services.analysis_service import analyze_single_content
from tools.db_tools import update_last_active

router = APIRouter()


class IngestYouTubeRequest(BaseModel):
    user_id: str
    video_url: str


class IngestInstagramRequest(BaseModel):
    user_id: str
    reel_url: str


class BulkIngestRequest(BaseModel):
    user_id: str
    urls: list[str]


@router.post('/ingest/youtube')
async def api_ingest_youtube(
    request: IngestYouTubeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Ingest and analyze a YouTube video."""
    result = await analyze_single_content(
        db=db,
        user_id=request.user_id,
        content_url=request.video_url,
        platform='youtube',
    )
    
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    
    await update_last_active(db, request.user_id)
    await db.commit()
    return result


@router.post('/ingest/instagram')
async def api_ingest_instagram(
    request: IngestInstagramRequest,
    db: AsyncSession = Depends(get_db),
):
    """Ingest and analyze an Instagram reel."""
    result = await analyze_single_content(
        db=db,
        user_id=request.user_id,
        content_url=request.reel_url,
        platform='instagram',
    )
    
    if 'error' in result:
        raise HTTPException(status_code=400, detail=result['error'])
    
    await update_last_active(db, request.user_id)
    await db.commit()
    return result


@router.post('/ingest/bulk')
async def api_ingest_bulk(
    request: BulkIngestRequest,
    db: AsyncSession = Depends(get_db),
):
    """Bulk ingest and analyze multiple content URLs."""
    results = []
    errors = []
    
    for url in request.urls:
        try:
            result = await analyze_single_content(
                db=db,
                user_id=request.user_id,
                content_url=url,
            )
            if 'error' in result:
                errors.append({'url': url, 'error': result['error']})
            else:
                results.append(result)
        except Exception as e:
            errors.append({'url': url, 'error': str(e)})
    
    await update_last_active(db, request.user_id)
    await db.commit()
    
    return {
        'analyzed': results,
        'errors': errors,
        'total_success': len(results),
        'total_errors': len(errors),
    }
