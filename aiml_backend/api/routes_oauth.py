"""OAuth API routes for YouTube integration."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import json
from datetime import datetime, timedelta

from db.database import get_db
from tools.db_tools import get_user
from services.analysis_service import update_user_skills
from tools.youtube_tools import get_youtube_watch_history_oauth

router = APIRouter(prefix="/api/auth/youtube", tags=["oauth"])

# OAuth configuration
from config import (
    YOUTUBE_OAUTH_CLIENT_ID as GOOGLE_CLIENT_ID,
    YOUTUBE_OAUTH_CLIENT_SECRET as GOOGLE_CLIENT_SECRET,
    YOUTUBE_OAUTH_REDIRECT_URI as REDIRECT_URI
)
YOUTUBE_READONLY_SCOPE = "https://www.googleapis.com/auth/youtube.readonly"


@router.get("/login")
async def youtube_login(user_id: str):
    """
    Generate Google OAuth URL to request YouTube read-only access.
    Pass user_id in the state parameter to track who is authenticating.
    """
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={REDIRECT_URI}&"
        f"response_type=code&"
        f"scope={YOUTUBE_READONLY_SCOPE}&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state={user_id}"
    )
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def youtube_callback(
    request: Request,
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Handle the Google OAuth callback, exchange code for token, 
    fetch watch history, and sync skills.
    """
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth Error: {error}")
    
    if not code or not state or state == 'undefined':
        return RedirectResponse(url="http://localhost:5173/dashboard?error=Missing+user_id")
        
    user_id = state
    user = await get_user(db, user_id)
    if not user:
        return RedirectResponse(url="http://localhost:5173/dashboard?error=User+not+found")

    import httpx
    # Exchange authorization code for access token
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(token_url, data=payload)
            resp_data = resp.json()
            
            if "error" in resp_data:
                raise HTTPException(status_code=400, detail=f"Token exchange failed: {resp_data['error']}")
                
            access_token = resp_data.get("access_token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HTTP Error during token exchange: {str(e)}")

    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to retrieve access token")

    # Fetch watch history using the exact OAuth logic
    history_items = get_youtube_watch_history_oauth(access_token)
    
    if history_items and "error" in history_items[0]:
        raise HTTPException(status_code=500, detail=history_items[0]["error"])
        
    # Extract YouTube URLs from the history
    content_urls = []
    for item in history_items:
        video_id = item.get("video_id")
        if video_id:
            content_urls.append(f"https://www.youtube.com/watch?v={video_id}")
            
    # If no URLs found (or history is empty due to API limitations)
    if not content_urls:
        return {
            "status": "success",
            "message": "Authentication successful, but no watch history was returned (See YouTube API v3 limitations on the HL playlist).",
            "synced_videos": 0
        }
        
    # Trigger bulk skill update using the fetched URLs
    # Limit to top 5 for performance during sync
    urls_to_sync = content_urls[:5]
    
    # We will trigger this in background or await it
    await update_user_skills(db, user_id, urls_to_sync)
    
    return RedirectResponse(url="http://localhost:5173/dashboard?youtube=success")
