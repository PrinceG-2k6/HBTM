"""
HBTM Backend — Configuration Module

Loads environment variables and defines application constants.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# ============================================================
# Paths
# ============================================================
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# ============================================================
# Google / Gemini
# ============================================================
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "text-embedding-004")

# ============================================================
# YouTube
# ============================================================
YOUTUBE_DATA_API_KEY = os.getenv("YOUTUBE_DATA_API_KEY", "")
YOUTUBE_OAUTH_CLIENT_ID = os.getenv("YOUTUBE_OAUTH_CLIENT_ID", "")
YOUTUBE_OAUTH_CLIENT_SECRET = os.getenv("YOUTUBE_OAUTH_CLIENT_SECRET", "")
YOUTUBE_OAUTH_REDIRECT_URI = os.getenv(
    "YOUTUBE_OAUTH_REDIRECT_URI",
    "http://localhost:8000/api/auth/youtube/callback"
)
YOUTUBE_OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
]

# ============================================================
# Database
# ============================================================
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR / 'hbtm.db'}")
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", str(BASE_DIR / "chroma_data"))

# ============================================================
# Whisper
# ============================================================
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")

# ============================================================
# App
# ============================================================
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
APP_DEBUG = os.getenv("APP_DEBUG", "true").lower() == "true"

# ============================================================
# Skill Taxonomy — Predefined Skills
# ============================================================
PREDEFINED_SKILLS = [
    # Personal Development
    "Communication",
    "Public Speaking",
    "Leadership",
    "Emotional Intelligence",
    "Time Management",
    "Confidence Building",
    "Critical Thinking",
    "Decision Making",
    "Negotiation",
    "Networking",

    # Health & Wellness
    "Fitness",
    "Nutrition",
    "Mental Health",
    "Meditation & Mindfulness",
    "Sleep Optimization",

    # Creative
    "Design",
    "Photography",
    "Writing",
    "Music",
    "Content Creation",
    "Filmmaking",

    # Professional
    "Entrepreneurship",
    "Marketing",
    "Sales",
    "Financial Literacy",
    "Productivity",
    "Career Development",

    # Technical
    "Programming",
    "Data Science",
    "AI & Machine Learning",

    # Lifestyle
    "Fashion & Style",
    "Cooking",
    "Travel",
    "Relationships",
    "Parenting",
]

# Skill level thresholds (0-10 scale)
SKILL_LEVEL_THRESHOLDS = {
    "beginner": (0.0, 3.0),
    "intermediate": (3.0, 6.0),
    "advanced": (6.0, 9.0),
    "expert": (9.0, 10.0),
}

# Sandbox Milestones - user must pass a sandbox challenge to cross these levels
SKILL_MILESTONES = [3.0, 6.0, 9.0]

# Content weight multipliers for skill progress calculation
CONTENT_WEIGHT = {
    "youtube_video": 1.0,
    "youtube_short": 0.4,
    "instagram_reel": 0.3,
    "article": 0.8,
    "book": 1.5,
    "event": 2.0,
}

# Inactivity thresholds (in days)
INACTIVITY_THRESHOLDS = {
    "dormant": 5,       # User has ghosted
    "disengaging": 3,   # Losing interest
}

# Task completion rate thresholds
TASK_COMPLETION_THRESHOLDS = {
    "struggling": 0.2,  # < 20% completion
    "passive": 0.5,     # < 50% completion
}
