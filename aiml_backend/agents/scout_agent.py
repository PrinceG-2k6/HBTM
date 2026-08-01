"""
HBTM — Scout Agent

Content discovery and curation engine. Searches multiple platforms
to find the best content matched to a user's skills and current level.
Sources: YouTube, Google Books, web articles, physical/virtual events.
"""

from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext, google_search

from config import GEMINI_MODEL


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Tools for Scout Agent
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def discover_youtube_content(
    skill_name: str,
    difficulty: str,
    num_results: int,
    tool_context: ToolContext,
) -> dict:
    """Search YouTube for educational content matching a skill and difficulty level.

    Constructs smart search queries based on skill + level and fetches results
    with full metadata and transcripts for better matching.

    Args:
        skill_name: The skill to search content for (e.g., 'Communication').
        difficulty: Current difficulty level ('beginner', 'intermediate', 'advanced').
        num_results: Number of results to return (max 10).
        tool_context: ADK tool context.

    Returns:
        List of YouTube video results with metadata.
    """
    from tools.youtube_tools import search_youtube_videos, get_youtube_video_metadata
    from tools.skill_tools import get_skill_recommendations

    # Generate smart search queries based on skill + level
    recs = get_skill_recommendations(skill_name, _difficulty_to_level(difficulty))
    search_queries = recs.get("search_queries", [f"{skill_name} tutorial"])

    all_results = []
    seen_ids = set()

    for query in search_queries[:2]:  # Use top 2 queries to diversify
        results = search_youtube_videos(query, max_results=min(num_results, 5))
        for r in results:
            vid = r.get("video_id", "")
            if vid and vid not in seen_ids:
                seen_ids.add(vid)
                all_results.append(r)

    # Enrich top results with full metadata
    enriched = []
    for result in all_results[:num_results]:
        video_id = result.get("video_id", "")
        if video_id:
            full_meta = get_youtube_video_metadata(video_id)
            result.update({
                "tags": full_meta.get("tags", []),
                "categoryId": full_meta.get("categoryId", ""),
                "duration": full_meta.get("duration", ""),
                "viewCount": full_meta.get("viewCount", 0),
                "likeCount": full_meta.get("likeCount", 0),
            })
        enriched.append(result)

    tool_context.state["youtube_discoveries"] = enriched
    return {
        "source": "youtube",
        "skill": skill_name,
        "difficulty": difficulty,
        "results_count": len(enriched),
        "results": enriched,
    }


def discover_books(
    skill_name: str,
    difficulty: str,
    num_results: int,
    tool_context: ToolContext,
) -> dict:
    """Search for books related to a skill using Google Books API.

    Args:
        skill_name: The skill to search books for.
        difficulty: Current difficulty level.
        num_results: Number of results to return (max 5).
        tool_context: ADK tool context.

    Returns:
        List of book results with metadata.
    """
    from tools.search_tools import search_books

    # Construct query based on difficulty
    level_qualifiers = {
        "beginner": "introduction beginner guide",
        "intermediate": "practical techniques strategies",
        "advanced": "mastery expert advanced",
    }
    qualifier = level_qualifiers.get(difficulty, "")
    query = f"{skill_name} {qualifier}".strip()

    results = search_books(query, max_results=num_results)
    tool_context.state["book_discoveries"] = results

    return {
        "source": "books",
        "skill": skill_name,
        "difficulty": difficulty,
        "results_count": len(results),
        "results": results,
    }


def discover_events(
    skill_name: str,
    location: str,
    num_results: int,
    tool_context: ToolContext,
) -> dict:
    """Search for physical or virtual events related to a skill.

    Uses Google Search to find workshops, meetups, conferences, and webinars.

    Args:
        skill_name: The skill to search events for.
        location: User's location for local event search (can be empty for virtual).
        num_results: Number of results to return (max 5).
        tool_context: ADK tool context.

    Returns:
        List of event results.
    """
    from tools.search_tools import search_events

    results = search_events(skill_name, location=location, max_results=num_results)
    tool_context.state["event_discoveries"] = results

    return {
        "source": "events",
        "skill": skill_name,
        "location": location or "virtual",
        "results_count": len(results),
        "results": results,
    }


def discover_articles(
    skill_name: str,
    difficulty: str,
    num_results: int,
    tool_context: ToolContext,
) -> dict:
    """Search for articles, guides, and tutorials related to a skill.

    Args:
        skill_name: The skill to search articles for.
        difficulty: Current difficulty level.
        num_results: Number of results to return.
        tool_context: ADK tool context.

    Returns:
        List of article results.
    """
    from tools.search_tools import search_articles

    level_qualifiers = {
        "beginner": "beginner guide how to start",
        "intermediate": "tips techniques deep dive",
        "advanced": "advanced strategies case study",
    }
    qualifier = level_qualifiers.get(difficulty, "guide")
    query = f"{skill_name} {qualifier}"

    results = search_articles(query, max_results=num_results)
    tool_context.state["article_discoveries"] = results

    return {
        "source": "articles",
        "skill": skill_name,
        "difficulty": difficulty,
        "results_count": len(results),
        "results": results,
    }


def compile_curated_feed(
    user_skills: list[dict],
    content_per_skill: int,
    tool_context: ToolContext,
) -> dict:
    """Compile a curated feed from all discovered content.

    Takes the user's skills with levels and the accumulated discoveries
    from session state to produce a ranked, personalized feed.

    Args:
        user_skills: List of dicts: [{skill_name, current_level, level_label}]
        content_per_skill: Number of content items to include per skill.
        tool_context: ADK tool context.

    Returns:
        The final curated feed.
    """
    feed = {
        "youtube": tool_context.state.get("youtube_discoveries", []),
        "books": tool_context.state.get("book_discoveries", []),
        "events": tool_context.state.get("event_discoveries", []),
        "articles": tool_context.state.get("article_discoveries", []),
    }

    return {
        "status": "feed_compiled",
        "total_items": sum(len(v) for v in feed.values()),
        "feed": feed,
        "instruction": (
            "Rank and present these results to the user. For each item, explain "
            "WHY it was chosen based on their skill level and growth goals. "
            "Prioritize diverse content types (mix of video, reading, events)."
        ),
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Helpers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def _difficulty_to_level(difficulty: str) -> float:
    """Convert difficulty label to approximate numeric level for search."""
    return {"beginner": 10.0, "intermediate": 40.0, "advanced": 75.0}.get(difficulty, 10.0)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Agent Definition
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCOUT_INSTRUCTION = """You are the HBTM Scout Agent — the content discovery specialist.

Your job is to find the BEST content for a user's growth journey across multiple platforms.

## Curation Strategy:

1. **Receive user's skills with levels** from the Orchestrator
2. **For each skill**, search multiple sources:
   - YouTube (primary — 3-5 results per skill)
   - Books (1-2 recommendations per skill)
   - Articles (2-3 per skill)
   - Events (1-2 if location provided)
3. **Prioritize quality over quantity**:
   - Prefer content from verified/popular creators
   - Match difficulty to user's current level
   - Diversify content types (don't just return all YouTube videos)
4. **Compile the feed** using compile_curated_feed

## Content Selection Rules:
- For beginners: short, engaging, easy-to-digest content (< 10 min videos, listicle articles)
- For intermediate: deeper dives, practical exercises, case studies
- For advanced: expert talks, research papers, masterclasses, live events

## Important:
- Always call discover_youtube_content FIRST (richest source)
- Then call other discovery tools based on what's needed
- Use the google_search tool for general web discoveries when specific tools don't cover a topic
- Present results with a brief explanation of WHY each piece was curated
"""

scout_agent = LlmAgent(
    name="scout_agent",
    model=GEMINI_MODEL,
    instruction=SCOUT_INSTRUCTION,
    tools=[
        google_search,
        discover_youtube_content,
        discover_books,
        discover_events,
        discover_articles,
        compile_curated_feed,
    ],
)
