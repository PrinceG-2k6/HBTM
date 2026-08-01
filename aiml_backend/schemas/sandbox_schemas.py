from pydantic import BaseModel
from typing import List, Optional

class SandboxGenerateRequest(BaseModel):
    user_id: str
    target_skill: str

class SandboxGenerateResponse(BaseModel):
    scenario_id: str
    prompt: str
    time_limit_seconds: int
    required_keywords: List[str]
    
class HitlGradeRequest(BaseModel):
    submission_id: str
    reviewer_id: str
    score: float
    feedback: str
    approved_for_milestone: bool

class PendingReviewResponse(BaseModel):
    submission_id: str
    skill_name: str
    target_level: float
    scenario_prompt: str
    media_url: str
    transcript: Optional[str]
    ai_score: Optional[float]
    created_at: str
