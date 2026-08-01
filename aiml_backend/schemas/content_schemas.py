from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict

class AnalyzeContentRequest(BaseModel):
    user_id: str
    content_url: str
    platform: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class AnalyzeContentResponse(BaseModel):
    content_url: str
    platform: Optional[str] = None
    detected_topics: List[str]
    primary_skill_match: Optional[str] = None
    relevance_score: float
    difficulty_level: Optional[str] = None
    key_takeaways: List[str]
    summary: str
    
    model_config = ConfigDict(from_attributes=True)

class UpdateSkillsRequest(BaseModel):
    user_id: str
    content_urls: List[str]
    
    model_config = ConfigDict(from_attributes=True)

class SkillUpdateInfo(BaseModel):
    old_level: float
    new_level: float
    delta: float

class UpdateSkillsResponse(BaseModel):
    skills_updated: Dict[str, SkillUpdateInfo]
    content_analyzed: int
    top_insight: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class ContentItem(BaseModel):
    platform: Optional[str] = None
    content_type: Optional[str] = None
    title: str
    url: str
    relevance_score: float
    matched_skill: Optional[str] = None
    thumbnail_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
