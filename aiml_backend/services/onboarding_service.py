"""Onboarding Service — bridges FastAPI routes with Profiler Agent."""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types

from agents.root_agent import root_agent
from tools.skill_tools import extract_skills_from_text
from tools.db_tools import create_user, create_user_skill, log_engagement
from tools.embedding_tools import generate_embedding
from db.vector_store import add_skill_embedding, get_skill_collection
from config import PREDEFINED_SKILLS


async def onboard_user(
    db: AsyncSession,
    name: str,
    email: str,
    aspiration_text: str,
    selected_skills: list[str],
    custom_skill_text: str = '',
) -> dict:
    """Process a new user's onboarding.
    
    1. Create user in DB
    2. Extract additional skills from free text using Gemini
    3. Combine with selected skills, deduplicate
    4. Create skill records in DB
    5. Generate and store skill embeddings in ChromaDB
    6. Log engagement event
    7. Return onboarding result
    """
    # Generate user ID
    user_id = str(uuid.uuid4())
    
    # Create user record
    user = await create_user(db, user_id, name, email, aspiration_text)
    
    # Extract skills from free text
    all_skills = list(set(selected_skills))
    
    # If custom text provided, extract additional skills
    if custom_skill_text.strip():
        extracted = extract_skills_from_text(custom_skill_text)
        for skill in extracted:
            if skill not in all_skills:
                all_skills.append(skill)
    
    # Also extract from aspiration text
    if aspiration_text.strip():
        extracted = extract_skills_from_text(aspiration_text)
        for skill in extracted:
            if skill not in all_skills:
                all_skills.append(skill)
    
    # Create skill records
    skills_result = []
    for skill_name in all_skills:
        skill = await create_user_skill(db, user_id, skill_name)
        skills_result.append({
            'skill_name': skill.skill_name,
            'current_level': skill.current_level,
            'level_label': skill.level_label,
        })
        
        # Generate and store skill embedding
        try:
            embedding = generate_embedding(f"Personal growth skill: {skill_name}. Topics include: {skill_name} techniques, {skill_name} improvement, {skill_name} mastery.")
            add_skill_embedding(skill_name, embedding)
        except Exception:
            pass  # Non-critical, continue
    
    # Mark onboarding complete
    user.onboarding_completed = True
    await db.commit()
    
    # Log engagement
    await log_engagement(db, user_id, 'onboarding_completed', {'skills_count': len(all_skills)})
    
    return {
        'user_id': user_id,
        'name': name,
        'skills_registered': skills_result,
    }
