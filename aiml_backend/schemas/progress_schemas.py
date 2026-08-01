from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class SkillProgressItem(BaseModel):
    skill_name: str
    current_level: float
    level_label: str
    progress_delta_7d: float
    content_consumed_count: int
    
    model_config = ConfigDict(from_attributes=True)

class ProgressDashboard(BaseModel):
    user_id: str
    overall_score: float
    skills: List[SkillProgressItem]
    total_content_analyzed: int
    tasks_completed_7d: int
    tasks_total_7d: int
    behavior_pattern: Optional[str] = None
    streak_days: int
    next_milestone: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
