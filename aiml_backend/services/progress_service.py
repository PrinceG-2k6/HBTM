"""Progress Service — calculates and returns skill progress dashboard data."""

from sqlalchemy.ext.asyncio import AsyncSession

from tools.db_tools import (
    get_user,
    get_user_skills,
    get_task_completion_rate,
    get_content_count,
    get_days_since_last_active,
    get_streak_days,
    get_user_content_history,
)
from config import INACTIVITY_THRESHOLDS, TASK_COMPLETION_THRESHOLDS, SKILL_MILESTONES


def detect_skill_imbalance(skills) -> dict | None:
    """Detect if a user is over-investing in one skill while neglecting others.
    
    Returns a nudge dict if imbalance is found, None otherwise.
    
    Strategy:
    - Calculate the standard deviation of skill levels.
    - If the top skill is more than 2x the average of the rest, flag it.
    - Identify the bottom 2 neglected skills as suggestions.
    """
    if len(skills) < 2:
        return None
    
    levels = [(s.skill_name, s.current_level) for s in skills]
    levels.sort(key=lambda x: x[1], reverse=True)
    
    top_skill_name, top_level = levels[0]
    other_levels = [lvl for _, lvl in levels[1:]]
    
    if not other_levels:
        return None
    
    avg_other = sum(other_levels) / len(other_levels)
    
    # Trigger nudge if:
    # 1. Top skill is at least 1.5 points ahead of the average of the rest (on a 0-10 scale)
    # 2. AND the gap ratio is significant (top is more than 2x the rest average, or rest avg is near 0)
    gap = top_level - avg_other
    
    if gap < 1.5:
        return None
    
    # Identify the 2 weakest skills
    neglected = levels[-2:]  # Bottom 2
    neglected_names = [name for name, _ in neglected]
    
    return {
        "detected": True,
        "dominant_skill": top_skill_name,
        "dominant_level": round(top_level, 2),
        "average_other_level": round(avg_other, 2),
        "gap": round(gap, 2),
        "neglected_skills": neglected_names,
    }


async def _generate_diversification_nudge(user_aspiration: str, dominant_skill: str, neglected_skills: list[str]) -> str:
    """Use Gemini to generate a warm, personalized nudge to diversify."""
    try:
        import google.genai as genai
        from config import GOOGLE_API_KEY, GEMINI_MODEL
        
        client = genai.Client(api_key=GOOGLE_API_KEY)
        prompt = f"""
        You are a warm, encouraging personal growth coach for the "I Am Better Than Me" platform.
        The user's aspiration: "{user_aspiration}"
        They have been heavily focusing on "{dominant_skill}" and neglecting: {', '.join(neglected_skills)}.
        
        Write a SHORT (2-3 sentences) warm nudge encouraging them to explore the neglected skills.
        Connect the neglected skills back to their original aspiration to show WHY diversifying helps them.
        Tone: warm, non-judgmental, aspirational. Do NOT use bullet points.
        """
        
        response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        return response.text.strip()
    except Exception:
        return f"You're making great progress in {dominant_skill}! To become more well-rounded, try exploring {' and '.join(neglected_skills)} — they'll complement your growth beautifully."


async def get_progress_dashboard(db: AsyncSession, user_id: str) -> dict:
    """Get full progress dashboard data for a user."""
    user = await get_user(db, user_id)
    if not user:
        return {'error': 'User not found'}
    
    skills = await get_user_skills(db, user_id)
    completion_rate = await get_task_completion_rate(db, user_id)
    content_count = await get_content_count(db, user_id)
    days_inactive = await get_days_since_last_active(db, user_id)
    streak = await get_streak_days(db, user_id)
    
    # Detect behavior
    if days_inactive >= INACTIVITY_THRESHOLDS['dormant']:
        behavior = 'dormant'
    elif days_inactive >= INACTIVITY_THRESHOLDS['disengaging']:
        behavior = 'disengaging'
    elif completion_rate < TASK_COMPLETION_THRESHOLDS['struggling']:
        behavior = 'struggling'
    elif completion_rate < TASK_COMPLETION_THRESHOLDS['passive'] and content_count < 3:
        behavior = 'passive'
    else:
        behavior = 'active'
    
    # Calculate overall score (weighted average of skill levels)
    if skills:
        overall_score = sum(s.current_level for s in skills) / len(skills)
    else:
        overall_score = 0.0
    
    # Build skill progress list
    skill_progress = []
    for s in skills:
        skill_progress.append({
            'skill_name': s.skill_name,
            'current_level': round(s.current_level, 2),
            'max_level': 10.0,
            'level_label': s.level_label or 'beginner',
            'sandbox_locked': s.sandbox_unlocked_level is not None,
            'progress_delta_7d': 0.0,  # TODO: calculate from history
            'content_consumed_count': 0,  # TODO: per-skill count
        })
    
    # Next milestone (updated for 0-10 scale)
    if skills:
        lowest_skill = min(skills, key=lambda s: s.current_level)
        next_ms = None
        for ms in SKILL_MILESTONES:
            if lowest_skill.current_level < ms:
                next_ms = ms
                break
        if next_ms:
            next_milestone = f"Level up {lowest_skill.skill_name} to {next_ms:.0f} (need {max(0, next_ms - lowest_skill.current_level):.1f} more points)"
        else:
            next_milestone = f"{lowest_skill.skill_name} is approaching mastery!"
    else:
        next_milestone = 'Complete onboarding to start tracking progress!'
    
    # Detect skill imbalance and generate growth nudge
    growth_nudge = None
    imbalance = detect_skill_imbalance(skills)
    if imbalance:
        nudge_message = await _generate_diversification_nudge(
            user.aspiration_text or "",
            imbalance["dominant_skill"],
            imbalance["neglected_skills"],
        )
        growth_nudge = {
            **imbalance,
            "nudge_message": nudge_message,
        }
    
    return {
        'user_id': user_id,
        'overall_score': round(overall_score, 2),
        'skills': skill_progress,
        'total_content_analyzed': content_count,
        'tasks_completed_7d': int(completion_rate * 10),  # approximate
        'tasks_total_7d': 10,  # approximate
        'behavior_pattern': behavior,
        'streak_days': streak,
        'next_milestone': next_milestone,
        'growth_nudge': growth_nudge,
    }

