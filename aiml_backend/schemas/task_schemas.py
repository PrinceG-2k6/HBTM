from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date

class DailyTaskResponse(BaseModel):
    id: int
    skill_name: str
    task_description: str
    task_type: str
    difficulty: str
    resource_url: Optional[str] = None
    status: str
    due_date: date
    
    model_config = ConfigDict(from_attributes=True)

class TaskListResponse(BaseModel):
    tasks: List[DailyTaskResponse]
    total_pending: int
    streak_days: int
    
    model_config = ConfigDict(from_attributes=True)

class CompleteTaskRequest(BaseModel):
    task_id: int
    
    model_config = ConfigDict(from_attributes=True)
