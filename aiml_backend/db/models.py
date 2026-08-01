import uuid
from datetime import datetime, date
from typing import List, Optional

from sqlalchemy import String, Boolean, Float, Text, Integer, ForeignKey, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.database import Base


class User(Base):
    """
    User model representing the user in the system.
    """
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, default="Personal Growth Aspirant")
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Store full onboarding JSON
    aspiration_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_active_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    skills: Mapped[List["UserSkill"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    content_history: Mapped[List["ContentHistory"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    daily_tasks: Mapped[List["DailyTask"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    engagement_logs: Mapped[List["EngagementLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserSkill(Base):
    """
    UserSkill model representing the user's progress in specific skills.
    """
    __tablename__ = "user_skills"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    skill_name: Mapped[str] = mapped_column(String, nullable=False)
    current_level: Mapped[float] = mapped_column(Float, default=0.0)
    level_label: Mapped[str] = mapped_column(String, default="beginner")
    sandbox_unlocked_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # If stuck at a milestone, the level
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user: Mapped["User"] = relationship(back_populates="skills")


class ContentHistory(Base):
    """
    ContentHistory model representing content analyzed or consumed by the user.
    """
    __tablename__ = "content_history"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    platform: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    content_url: Mapped[str] = mapped_column(String, nullable=False)
    content_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Stored as JSON string
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    visual_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    detected_topics: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Stored as JSON string
    matched_skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Stored as JSON string
    difficulty_level: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    key_takeaways: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Stored as JSON string
    embedding_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    consumed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    user: Mapped["User"] = relationship(back_populates="content_history")


class DailyTask(Base):
    """
    DailyTask model representing generated tasks for the user to improve skills.
    """
    __tablename__ = "daily_tasks"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    skill_name: Mapped[str] = mapped_column(String, nullable=False)
    task_description: Mapped[str] = mapped_column(Text, nullable=False)
    task_type: Mapped[str] = mapped_column(String, nullable=False)
    difficulty: Mapped[str] = mapped_column(String, nullable=False)
    resource_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    user: Mapped["User"] = relationship(back_populates="daily_tasks")


class EngagementLog(Base):
    """
    EngagementLog model tracking user events and interactions in the app.
    """
    __tablename__ = "engagement_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    metadata_json: Mapped[Optional[str]] = mapped_column("metadata", Text, nullable=True) # Named metadata_json to avoid SQLAlchemy reserved word issues
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user: Mapped["User"] = relationship(back_populates="engagement_logs")


class SandboxSubmission(Base):
    """
    SandboxSubmission model representing a user's attempt at a milestone challenge.
    """
    __tablename__ = "sandbox_submissions"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    skill_name: Mapped[str] = mapped_column(String, nullable=False)
    target_level: Mapped[float] = mapped_column(Float, nullable=False)
    scenario_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    media_url: Mapped[str] = mapped_column(String, nullable=False) # Local path or S3 url
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending") # pending, grading, passed, failed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user: Mapped["User"] = relationship()


class HITLReview(Base):
    """
    HITLReview model representing peer grading for a sandbox submission.
    """
    __tablename__ = "hitl_reviews"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    submission_id: Mapped[str] = mapped_column(ForeignKey("sandbox_submissions.id"), nullable=False)
    reviewer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    submission: Mapped["SandboxSubmission"] = relationship()
    reviewer: Mapped["User"] = relationship()
