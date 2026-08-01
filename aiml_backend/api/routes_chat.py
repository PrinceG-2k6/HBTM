"""AI Coach Chat API routes."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import google.genai as genai
from db.database import get_db
from api.routes_auth import get_current_user
from db.models import User
from config import GOOGLE_API_KEY, GEMINI_MODEL

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str
    hasImage: bool = False
    imageBase64: Optional[str] = None

@router.post('/chat')
async def api_chat(request: ChatRequest, current_user: User = Depends(get_current_user)):
    """Handle chat message with AI coach."""
    client = genai.Client(api_key=GOOGLE_API_KEY)
    
    # Simple context setup
    context = f"You are PACER AI Curator. User Name: {current_user.name}. Goal: {current_user.aspiration_text}. Be concise, helpful, and action-oriented."
    
    prompt_text = f"{context}\n\nUser Message: {request.prompt}"
    
    # For now, just generate text response (image handling can be added later if needed)
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt_text
        )
        reply_text = response.text.strip()
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    return {
        "id": f"ai-{import_uuid().uuid4()}",
        "text": reply_text,
    }

import uuid
def import_uuid():
    return uuid
