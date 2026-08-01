from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

class SkillInfo(BaseModel):
    skill_name: str
    current_level: float
    level_label: str
    
    model_config = ConfigDict(from_attributes=True)

class OnboardRequest(BaseModel):
    name: str
    email: str
    aspiration_text: str
    selected_skills: List[str]
    custom_skills: Optional[List[str]] = None
    
    model_config = ConfigDict(from_attributes=True)

class OnboardResponse(BaseModel):
    user_id: str
    skills_registered: List[SkillInfo]
    
    model_config = ConfigDict(from_attributes=True)

class UserProfileResponse(BaseModel):
    user_id: str
    name: str
    email: str
    skills: List[SkillInfo]
    aspiration_text: Optional[str] = None
    last_active_at: datetime
    behavior_pattern: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
