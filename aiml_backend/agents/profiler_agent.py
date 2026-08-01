"""
HBTM — Profiler Agent

Owns the user's identity model. Handles:
- Onboarding: mapping aspirations to structured skill tags
- Skill level tracking and updates
- Mood/energy state tracking
- Inactivity/behavior pattern detection
- "Update Your Skills" bulk analysis orchestration
"""

from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext

from config import (
    GEMINI_MODEL,
    PREDEFINED_SKILLS,
    SKILL_LEVEL_THRESHOLDS,
    INACTIVITY_THRESHOLDS,
    TASK_COMPLETION_THRESHOLDS,
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Tools for Profiler Agent
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def get_predefined_skills(tool_context: ToolContext) -> dict:
    """Get the list of all predefined skills available for selection during onboarding.
    Returns the full skill taxonomy organized by category."""
    return {
        "skills": PREDEFINED_SKILLS,
        "total": len(PREDEFINED_SKILLS),
        "note": "Users can also add custom skills via free text.",
    }


def process_onboarding(
    user_name: str,
    user_email: str,
    aspiration_text: str,
    selected_skills: list[str],
    custom_skill_text: str,
    tool_context: ToolContext,
) -> dict:
    """Process a new user's onboarding data.

    Takes the user's name, email, aspiration text (free-form description of who
    they want to become), their selected skills from the predefined list, and any
    custom skill text they entered.

    Stores the user profile and skill selections in session state for the
    orchestrator to persist to the database.

    Args:
        user_name: The user's display name.
        user_email: The user's email address.
        aspiration_text: Free-form text describing the user's growth aspirations.
        selected_skills: List of skill names chosen from the predefined taxonomy.
        custom_skill_text: Free-form text from which to extract additional skills.
        tool_context: ADK tool context for session state access.
    """
    # Store in session state for downstream processing
    tool_context.state["onboarding_data"] = {
        "user_name": user_name,
        "user_email": user_email,
        "aspiration_text": aspiration_text,
        "selected_skills": selected_skills,
        "custom_skill_text": custom_skill_text,
    }

    # Validate selected skills against predefined list
    valid_skills = [s for s in selected_skills if s in PREDEFINED_SKILLS]
    unknown_skills = [s for s in selected_skills if s not in PREDEFINED_SKILLS]

    return {
        "status": "onboarding_processed",
        "valid_skills": valid_skills,
        "unknown_skills": unknown_skills,
        "custom_text_provided": bool(custom_skill_text.strip()),
        "instruction": (
            "Now extract additional skills from the aspiration_text and "
            "custom_skill_text using your language understanding. Map them to "
            "predefined skills where possible. Return the final combined skill list."
        ),
    }


def save_user_skills(
    user_id: str,
    final_skills: list[str],
    tool_context: ToolContext,
) -> dict:
    """Save the final resolved skill list for a user after onboarding analysis.

    This stores the skills in session state. The service layer will persist them
    to the database.

    Args:
        user_id: The user's unique identifier.
        final_skills: The finalized list of skill names (predefined + extracted custom).
        tool_context: ADK tool context for session state access.
    """
    skills_with_levels = [
        {
            "skill_name": skill,
            "current_level": 0.0,
            "level_label": "beginner",
            "is_predefined": skill in PREDEFINED_SKILLS,
        }
        for skill in final_skills
    ]

    tool_context.state["resolved_skills"] = skills_with_levels
    tool_context.state["user_id"] = user_id

    return {
        "status": "skills_saved_to_state",
        "user_id": user_id,
        "skills_count": len(final_skills),
        "skills": skills_with_levels,
    }


def analyze_skill_progress(
    user_id: str,
    content_analyses: list[dict],
    current_skills: list[dict],
    tool_context: ToolContext,
) -> dict:
    """Analyze consumed content and calculate updated skill levels.

    This is the core of the "Update Your Skills" feature. It takes a list of
    content analysis results (from Content Analyzer Agent) and the user's current
    skill levels, then computes new levels.

    Args:
        user_id: The user's unique identifier.
        content_analyses: List of dicts, each containing:
            - matched_skills: list of {skill_name, relevance_score}
            - content_type: 'youtube_video', 'youtube_short', 'instagram_reel', etc.
        current_skills: List of dicts with: skill_name, current_level, level_label
        tool_context: ADK tool context for session state access.

    Returns:
        Dict with skill updates including old/new levels and deltas.
    """
    from tools.skill_tools import calculate_skill_progress, get_level_label
    from config import CONTENT_WEIGHT

    # Build a lookup of current skill levels
    skill_levels = {s["skill_name"]: s["current_level"] for s in current_skills}
    skill_updates = {}

    # Aggregate content matches per skill
    skill_content_map: dict[str, list[dict]] = {}
    for analysis in content_analyses:
        for match in analysis.get("matched_skills", []):
            skill_name = match["skill_name"]
            if skill_name not in skill_content_map:
                skill_content_map[skill_name] = []
            skill_content_map[skill_name].append({
                "relevance_score": match["relevance_score"],
                "content_type": analysis.get("content_type", "article"),
            })

    # Calculate new levels
    for skill_name, matches in skill_content_map.items():
        old_level = skill_levels.get(skill_name, 0.0)
        new_level = calculate_skill_progress(old_level, matches)
        new_label = get_level_label(new_level)

        skill_updates[skill_name] = {
            "old_level": round(old_level, 2),
            "new_level": round(new_level, 2),
            "delta": round(new_level - old_level, 2),
            "new_label": new_label,
            "content_count": len(matches),
        }

    # Store in session state
    tool_context.state["skill_updates"] = skill_updates
    tool_context.state["content_analyzed_count"] = len(content_analyses)

    return {
        "status": "progress_calculated",
        "user_id": user_id,
        "skills_updated": skill_updates,
        "content_analyzed": len(content_analyses),
    }


def detect_user_behavior(
    user_id: str,
    days_since_last_active: int,
    task_completion_rate_7d: float,
    content_consumed_7d: int,
    tool_context: ToolContext,
) -> dict:
    """Detect the user's current engagement/behavior pattern.

    Uses inactivity thresholds and task completion rates to classify the user's
    engagement state. This drives adaptive task difficulty and nudge strategies.

    Args:
        user_id: The user's unique identifier.
        days_since_last_active: Number of days since last login/activity.
        task_completion_rate_7d: Task completion rate (0.0-1.0) over last 7 days.
        content_consumed_7d: Number of content pieces analyzed in last 7 days.
        tool_context: ADK tool context for session state access.

    Returns:
        Dict with behavior_pattern and recommended_action.
    """
    if days_since_last_active >= INACTIVITY_THRESHOLDS["dormant"]:
        pattern = "dormant"
        action = (
            "Send a warm 'we miss you' nudge. Prepare a single ultra-easy, "
            "fun micro-task (under 2 minutes). Ask if their goals have changed."
        )
    elif days_since_last_active >= INACTIVITY_THRESHOLDS["disengaging"]:
        pattern = "disengaging"
        action = (
            "Reduce task count to 1 per day. Make it very easy and engaging. "
            "Proactively ask: 'Is this still your goal, or would you like to pivot?'"
        )
    elif task_completion_rate_7d < TASK_COMPLETION_THRESHOLDS["struggling"]:
        pattern = "struggling"
        action = (
            "Lower task difficulty significantly. Switch content format "
            "(e.g., short video instead of long article). Offer encouragement."
        )
    elif (
        task_completion_rate_7d < TASK_COMPLETION_THRESHOLDS["passive"]
        and content_consumed_7d < 3
    ):
        pattern = "passive"
        action = (
            "Introduce gamification: 'You're X tasks away from leveling up!' "
            "Show progress visualization. Suggest bite-sized content."
        )
    else:
        pattern = "active"
        action = (
            "Normal flow. Gradually increase challenge level. "
            "Suggest intermediate/advanced content. Celebrate milestones."
        )

    tool_context.state["behavior_pattern"] = pattern
    tool_context.state["recommended_action"] = action

    return {
        "user_id": user_id,
        "behavior_pattern": pattern,
        "recommended_action": action,
        "metrics": {
            "days_since_last_active": days_since_last_active,
            "task_completion_rate_7d": task_completion_rate_7d,
            "content_consumed_7d": content_consumed_7d,
        },
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Agent Definition
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROFILER_INSTRUCTION = f"""You are the HBTM Profiler Agent — the identity expert.

Your responsibilities:
1. **Onboarding**: When a new user signs up, process their data:
   - Accept their selected skills from the predefined list
   - Analyze their free-text aspirations and custom skill text
   - Extract additional skill tags from the text (map to predefined skills: {', '.join(PREDEFINED_SKILLS[:10])}... etc.)
   - Return the final consolidated skill list

2. **Skill Updates ("Update Your Skills")**: When the user clicks "Update Skills":
   - Receive content analysis results from Content Analyzer Agent
   - Calculate updated skill levels using analyze_skill_progress
   - Return the skill deltas (what changed and by how much)
   - Generate a top insight about their learning patterns

3. **Behavior Detection**: Monitor user engagement:
   - Use detect_user_behavior to classify engagement patterns
   - Return recommendations for how TaskMaster should adapt

When extracting skills from free text:
- Always try to map to predefined skills first
- Only create custom skills for truly unique topics not covered
- Be generous in mapping (e.g., "I want to talk better" → "Communication", "Public Speaking")
- A single aspiration can map to multiple skills

Always respond with structured data that the service layer can process."""

profiler_agent = LlmAgent(
    name="profiler_agent",
    model=GEMINI_MODEL,
    instruction=PROFILER_INSTRUCTION,
    tools=[
        get_predefined_skills,
        process_onboarding,
        save_user_skills,
        analyze_skill_progress,
        detect_user_behavior,
    ],
)
