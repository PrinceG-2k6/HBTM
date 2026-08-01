"""
HBTM — TaskMaster Agent

Generates daily growth tasks, tracks completion, detects inactivity,
and adapts task difficulty and style based on user behavior patterns.
"""

from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext

from config import GEMINI_MODEL, CONTENT_WEIGHT


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Tools for TaskMaster Agent
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def generate_daily_tasks(
    user_id: str,
    user_skills: list[dict],
    behavior_pattern: str,
    recent_content: list[dict],
    tool_context: ToolContext,
) -> dict:
    """Generate personalized daily tasks based on user's skills and behavior.

    The LLM uses this tool to store task parameters, then generates the actual
    task descriptions using its language capabilities.

    Args:
        user_id: The user's unique identifier.
        user_skills: List of dicts: [{skill_name, current_level, level_label}].
        behavior_pattern: Current behavior pattern from Profiler (active/passive/struggling/disengaging/dormant).
        recent_content: Recently consumed content for context.
        tool_context: ADK tool context.

    Returns:
        Task generation parameters and instructions for the LLM.
    """
    # Determine task count and difficulty based on behavior
    task_config = _get_task_config(behavior_pattern)

    # Prepare skill-task mapping
    skill_tasks = []
    for skill in user_skills[:task_config["max_skills"]]:
        skill_tasks.append({
            "skill_name": skill["skill_name"],
            "current_level": skill.get("current_level", 0),
            "level_label": skill.get("level_label", "beginner"),
            "task_difficulty": task_config["difficulty"],
        })

    tool_context.state["task_generation"] = {
        "user_id": user_id,
        "behavior_pattern": behavior_pattern,
        "task_config": task_config,
        "skill_tasks": skill_tasks,
        "recent_content_topics": [
            c.get("title", "") for c in (recent_content or [])[:5]
        ],
    }

    return {
        "status": "task_params_ready",
        "behavior_pattern": behavior_pattern,
        "max_tasks": task_config["max_tasks"],
        "difficulty": task_config["difficulty"],
        "skills_to_cover": [s["skill_name"] for s in skill_tasks],
        "instruction": (
            "Now generate specific, actionable daily tasks. For each task provide: "
            "skill_name, task_description (specific and actionable), "
            "task_type (watch/read/practice/attend/reflect), "
            "difficulty (easy/medium/hard), resource_url (if applicable). "
            f"Generate {task_config['max_tasks']} tasks total. "
            f"Difficulty should be '{task_config['difficulty']}'. "
            f"Behavior pattern is '{behavior_pattern}' — adapt tone accordingly. "
            f"Task types to prefer: {task_config['preferred_types']}"
        ),
    }


def save_generated_tasks(
    user_id: str,
    tasks: list[dict],
    tool_context: ToolContext,
) -> dict:
    """Save the LLM-generated tasks to session state for persistence.

    The service layer will read these from session state and write to DB.

    Args:
        user_id: The user's unique identifier.
        tasks: List of task dicts, each containing:
            - skill_name, task_description, task_type, difficulty, resource_url (optional)
        tool_context: ADK tool context.

    Returns:
        Confirmation with saved task count.
    """
    tool_context.state["generated_tasks"] = tasks
    tool_context.state["tasks_user_id"] = user_id

    return {
        "status": "tasks_saved_to_state",
        "user_id": user_id,
        "task_count": len(tasks),
        "tasks": tasks,
    }


def generate_nudge_message(
    user_id: str,
    behavior_pattern: str,
    user_name: str,
    days_inactive: int,
    skill_names: list[str],
    tool_context: ToolContext,
) -> dict:
    """Generate a personalized nudge/motivation message based on behavior pattern.

    Used when the user is disengaging, struggling, or dormant.

    Args:
        user_id: The user's unique identifier.
        behavior_pattern: Current engagement pattern.
        user_name: User's display name for personalization.
        days_inactive: Number of days since last activity.
        skill_names: User's skill names for context.
        tool_context: ADK tool context.

    Returns:
        Nudge configuration for the LLM to generate a message.
    """
    nudge_templates = {
        "dormant": {
            "tone": "warm, understanding, no pressure",
            "style": "We miss you! Life gets busy, and that's okay.",
            "cta": "Here's a 2-minute micro-task to ease back in:",
        },
        "disengaging": {
            "tone": "encouraging, curious",
            "style": "We noticed you've been away. Is everything alright?",
            "cta": "Want to try a different approach to your goals?",
        },
        "struggling": {
            "tone": "supportive, empathetic",
            "style": "Growth isn't linear. Let's make things easier.",
            "cta": "Here's a simpler path forward:",
        },
        "passive": {
            "tone": "motivating, gamified",
            "style": "You're closer than you think!",
            "cta": "Just X more tasks to level up!",
        },
    }

    template = nudge_templates.get(behavior_pattern, nudge_templates["passive"])

    tool_context.state["nudge_config"] = {
        "user_id": user_id,
        "behavior_pattern": behavior_pattern,
        "template": template,
    }

    return {
        "status": "nudge_params_ready",
        "behavior_pattern": behavior_pattern,
        "template": template,
        "instruction": (
            f"Generate a personalized nudge message for {user_name}. "
            f"They've been inactive for {days_inactive} days. "
            f"Their goals are: {', '.join(skill_names)}. "
            f"Tone: {template['tone']}. "
            f"Include the CTA: {template['cta']}. "
            "Keep it short, warm, and IABTM-branded ('become the self you imagine')."
        ),
    }


def evaluate_task_completion(
    user_id: str,
    completed_tasks: list[dict],
    total_tasks: int,
    streak_days: int,
    tool_context: ToolContext,
) -> dict:
    """Evaluate the user's task completion and provide feedback/adjustments.

    Args:
        user_id: The user's unique identifier.
        completed_tasks: List of completed task details.
        total_tasks: Total tasks assigned in the period.
        streak_days: Current streak in days.
        tool_context: ADK tool context.

    Returns:
        Evaluation result with recommendations.
    """
    completion_rate = len(completed_tasks) / max(total_tasks, 1)

    # Determine adjustment
    if completion_rate >= 0.8:
        adjustment = "increase_difficulty"
        feedback_tone = "celebratory"
    elif completion_rate >= 0.5:
        adjustment = "maintain"
        feedback_tone = "encouraging"
    elif completion_rate >= 0.2:
        adjustment = "decrease_difficulty"
        feedback_tone = "supportive"
    else:
        adjustment = "major_decrease"
        feedback_tone = "understanding"

    result = {
        "user_id": user_id,
        "completion_rate": round(completion_rate, 2),
        "streak_days": streak_days,
        "adjustment": adjustment,
        "feedback_tone": feedback_tone,
        "completed_count": len(completed_tasks),
        "total_count": total_tasks,
    }

    tool_context.state["task_evaluation"] = result
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Helpers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def _get_task_config(behavior_pattern: str) -> dict:
    """Get task generation configuration based on behavior pattern."""
    configs = {
        "active": {
            "max_tasks": 4,
            "max_skills": 3,
            "difficulty": "medium",
            "preferred_types": ["practice", "watch", "read", "attend"],
        },
        "passive": {
            "max_tasks": 3,
            "max_skills": 2,
            "difficulty": "easy",
            "preferred_types": ["watch", "read", "reflect"],
        },
        "struggling": {
            "max_tasks": 2,
            "max_skills": 1,
            "difficulty": "easy",
            "preferred_types": ["watch", "reflect"],
        },
        "disengaging": {
            "max_tasks": 1,
            "max_skills": 1,
            "difficulty": "easy",
            "preferred_types": ["watch", "reflect"],
        },
        "dormant": {
            "max_tasks": 1,
            "max_skills": 1,
            "difficulty": "easy",
            "preferred_types": ["watch"],
        },
    }
    return configs.get(behavior_pattern, configs["active"])


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Agent Definition
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASKMASTER_INSTRUCTION = """You are the HBTM TaskMaster Agent — the daily task engine.

Your responsibilities:
1. **Generate Daily Tasks**: Create specific, actionable growth tasks tailored to the user's
   skills, current level, and engagement pattern.
2. **Adapt to Behavior**: Adjust task difficulty and count based on the user's behavior pattern.
3. **Generate Nudges**: Create warm, personalized nudge messages for inactive users.
4. **Evaluate Progress**: Assess task completion and recommend adjustments.

## Task Types and Examples:

### Watch (video/short content)
- "Watch this 5-minute TED talk on body language and note 3 techniques"
- "Watch a YouTube Short on active listening"

### Read (articles/chapters)
- "Read this article on negotiation tactics and summarize the key points"
- "Read Chapter 3 of 'How to Win Friends' on handling criticism"

### Practice (hands-on exercises)
- "Record yourself giving a 2-minute elevator pitch about your work"
- "Start a conversation with a stranger today and practice active listening"
- "Sketch a logo design for a fictional coffee brand"

### Attend (events/workshops)
- "Join this free webinar on leadership skills this Thursday"
- "Attend a local Toastmasters meeting this week"

### Reflect (journaling/thinking)
- "Write 3 things you learned this week about communication"
- "Journal about a recent conversation where you felt heard"
- "Rate your confidence in public speaking on 1-10 and explain why"

## Behavior-Adaptive Rules:
- **Active users**: 3-4 tasks, mix of types, medium difficulty, stretch goals
- **Passive users**: 2-3 tasks, easy/fun content, gamification elements
- **Struggling users**: 1-2 tasks, very easy, switch formats, encouragement
- **Disengaging users**: 1 task only, ultra-easy, curiosity-driven
- **Dormant users**: 1 micro-task, 2 minutes max, "welcome back" energy

Always be specific — NOT "learn about communication" but "Watch this 5-minute video on the STAR method for answering interview questions."
Always use the IABTM brand voice: warm, aspirational, empowering.
Sign off with "Become the self you imagine. 🚀"
"""

taskmaster_agent = LlmAgent(
    name="taskmaster_agent",
    model=GEMINI_MODEL,
    instruction=TASKMASTER_INSTRUCTION,
    tools=[
        generate_daily_tasks,
        save_generated_tasks,
        generate_nudge_message,
        evaluate_task_completion,
    ],
)
