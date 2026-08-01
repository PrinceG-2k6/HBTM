"""
HBTM — Content Analyzer Agent

The deep analysis engine. Handles multi-modal content understanding:
- YouTube videos: metadata + transcript + optional vision
- YouTube shorts: audio transcription + frame analysis
- Instagram reels: yt-dlp + Whisper audio + Gemini Vision frames
- Articles/books: text extraction + summarization

Produces structured output: detected_topics, matched_skills, difficulty, takeaways.
"""

from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext

from config import GEMINI_MODEL


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Tools for Content Analyzer Agent
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def analyze_youtube_video(video_url: str, tool_context: ToolContext) -> dict:
    """Perform deep analysis of a YouTube video.

    Pipeline:
    1. Extract video ID from URL
    2. Fetch metadata via YouTube Data API (title, description, tags, category)
    3. Fetch transcript via youtube-transcript-api
    4. If no transcript, attempt audio download + Whisper transcription
    5. Optionally analyze thumbnail/frames via Gemini Vision
    6. Combine all signals for topic/skill extraction

    Args:
        video_url: Full YouTube video URL.
        tool_context: ADK tool context.

    Returns:
        Dict with: platform, content_type, title, description, tags, category,
        transcript (first 3000 chars), visual_description, raw_metadata
    """
    from tools.youtube_tools import (
        extract_video_id,
        get_youtube_video_metadata,
        get_youtube_transcript,
        get_youtube_video_category,
    )
    from tools.vision_tools import analyze_thumbnail

    video_id = extract_video_id(video_url)
    if not video_id:
        return {"error": f"Could not extract video ID from URL: {video_url}"}

    # Step 1: Get metadata
    metadata = get_youtube_video_metadata(video_id)
    if "error" in metadata:
        return {"error": f"Failed to fetch metadata: {metadata['error']}"}

    # Step 2: Get transcript
    transcript = get_youtube_transcript(video_id)

    # Step 3: Determine content type (video vs short)
    duration_str = metadata.get("duration", "")
    is_short = _is_youtube_short(duration_str, video_url)
    content_type = "youtube_short" if is_short else "youtube_video"

    # Step 4: If no transcript and it's a short, try audio transcription
    if not transcript and is_short:
        transcript = _attempt_audio_transcription(video_url)

    # Step 5: Analyze thumbnail for visual context
    visual_description = ""
    thumbnail_url = metadata.get("thumbnail_url", "")
    if thumbnail_url:
        try:
            visual_description = analyze_thumbnail(thumbnail_url)
        except Exception:
            visual_description = ""

    # Step 6: Resolve category name
    category_id = metadata.get("categoryId", "")
    category_name = get_youtube_video_category(category_id) if category_id else ""

    # Store intermediate data in session state
    tool_context.state["current_content_data"] = {
        "platform": "youtube",
        "content_type": content_type,
        "content_url": video_url,
        "title": metadata.get("title", ""),
        "description": metadata.get("description", "")[:1000],
        "tags": metadata.get("tags", []),
        "category": category_name,
        "transcript": (transcript or "")[:3000],  # Truncate for LLM context
        "visual_description": visual_description,
        "channel": metadata.get("channelTitle", ""),
        "view_count": metadata.get("viewCount", 0),
        "duration": duration_str,
    }

    return tool_context.state["current_content_data"]


def analyze_instagram_reel(reel_url: str, tool_context: ToolContext) -> dict:
    """Perform deep analysis of an Instagram reel.

    Pipeline:
    1. Extract metadata via yt-dlp (caption, uploader, views)
    2. Attempt to download and transcribe audio via Whisper
    3. If no meaningful audio, download video and extract frames
    4. Analyze frames via Gemini Vision
    5. Combine all signals

    Args:
        reel_url: Full Instagram reel URL.
        tool_context: ADK tool context.

    Returns:
        Dict with: platform, content_type, title, transcript, visual_description, metadata
    """
    from tools.instagram_tools import (
        get_instagram_reel_metadata,
        download_instagram_reel_audio,
        download_instagram_reel_video,
        extract_video_frames,
    )
    from tools.audio_tools import transcribe_audio
    from tools.vision_tools import analyze_video_frames
    from config import DATA_DIR
    import os

    temp_dir = str(DATA_DIR / "temp_media")
    os.makedirs(temp_dir, exist_ok=True)

    # Step 1: Get metadata
    metadata = get_instagram_reel_metadata(reel_url)
    if "error" in metadata:
        return {"error": f"Failed to fetch Instagram metadata: {metadata['error']}"}

    caption = metadata.get("title", "") or metadata.get("description", "")
    transcript = ""
    visual_description = ""

    # Step 2: Try audio transcription
    audio_path = download_instagram_reel_audio(reel_url, temp_dir)
    if audio_path:
        try:
            transcription_result = transcribe_audio(audio_path)
            transcript = transcription_result.get("text", "")
        except Exception:
            transcript = ""
        finally:
            # Clean up audio file
            try:
                os.remove(audio_path)
            except OSError:
                pass

    # Step 3: If no meaningful transcript, analyze visual content
    has_meaningful_audio = len(transcript.strip()) > 20
    if not has_meaningful_audio:
        video_path = download_instagram_reel_video(reel_url, temp_dir)
        if video_path:
            try:
                frame_paths = extract_video_frames(video_path, num_frames=4, output_dir=temp_dir)
                if frame_paths:
                    visual_description = analyze_video_frames(
                        frame_paths,
                        context=f"Instagram reel caption: {caption}"
                    )
                # Clean up frames and video
                for fp in frame_paths:
                    try:
                        os.remove(fp)
                    except OSError:
                        pass
                try:
                    os.remove(video_path)
                except OSError:
                    pass
            except Exception as e:
                visual_description = f"Vision analysis failed: {str(e)}"

    tool_context.state["current_content_data"] = {
        "platform": "instagram",
        "content_type": "instagram_reel",
        "content_url": reel_url,
        "title": caption[:500],
        "description": caption,
        "tags": [],
        "category": "",
        "transcript": transcript[:3000],
        "visual_description": visual_description,
        "channel": metadata.get("uploader", ""),
        "view_count": metadata.get("view_count", 0),
        "duration": str(metadata.get("duration", "")),
    }

    return tool_context.state["current_content_data"]


def analyze_article_or_book(
    url_or_title: str,
    content_type: str,
    tool_context: ToolContext,
) -> dict:
    """Analyze a web article or book for skill matching.

    For articles: scrapes the URL and extracts text content.
    For books: searches Google Books API for metadata and preview text.

    Args:
        url_or_title: URL for articles, title for books.
        content_type: Either 'article' or 'book'.
        tool_context: ADK tool context.

    Returns:
        Dict with extracted content data.
    """
    if content_type == "book":
        from tools.search_tools import search_books
        results = search_books(url_or_title, max_results=1)
        if results:
            book = results[0]
            tool_context.state["current_content_data"] = {
                "platform": "book",
                "content_type": "book",
                "content_url": book.get("info_link", ""),
                "title": book.get("title", ""),
                "description": book.get("description", "")[:2000],
                "tags": book.get("categories", []),
                "category": ", ".join(book.get("categories", [])),
                "transcript": "",
                "visual_description": "",
                "channel": ", ".join(book.get("authors", [])),
                "view_count": 0,
                "duration": f"{book.get('page_count', 0)} pages",
            }
            return tool_context.state["current_content_data"]
        return {"error": f"Book not found: {url_or_title}"}

    else:  # article
        try:
            import trafilatura
            downloaded = trafilatura.fetch_url(url_or_title)
            if downloaded:
                text = trafilatura.extract(downloaded) or ""
            else:
                text = ""
        except Exception:
            text = ""

        tool_context.state["current_content_data"] = {
            "platform": "article",
            "content_type": "article",
            "content_url": url_or_title,
            "title": "",  # Will be extracted by LLM from text
            "description": text[:2000],
            "tags": [],
            "category": "",
            "transcript": text[:3000],
            "visual_description": "",
            "channel": "",
            "view_count": 0,
            "duration": f"{len(text.split())} words",
        }
        return tool_context.state["current_content_data"]


def synthesize_content_analysis(
    content_data: dict,
    user_skills: list[str],
    tool_context: ToolContext,
) -> dict:
    """Final synthesis step — this is called by the LLM after it has analyzed
    the content data. The LLM generates the structured analysis output.

    The LLM should fill in detected_topics, primary_skill_match,
    relevance scores, difficulty, and key takeaways based on all the raw
    content signals (metadata + transcript + visual description).

    Args:
        content_data: The raw content data from the analysis tools.
        user_skills: The user's current skill list for matching.
        tool_context: ADK tool context.

    Returns:
        Structured analysis result stored in session state.
    """
    # This tool primarily serves to store the LLM's structured analysis output
    tool_context.state["analysis_result"] = content_data
    return {
        "status": "synthesis_complete",
        "instruction": (
            "Based on the content_data provided, generate a JSON analysis with: "
            "detected_topics (list of 3-7 topic strings), "
            "primary_skill_match (best matching skill from user_skills), "
            "matched_skills (list of {skill_name, relevance_score} for all matching skills), "
            "difficulty_level (beginner/intermediate/advanced), "
            "key_takeaways (list of 3-5 actionable insights), "
            "summary (2-3 sentence summary of the content). "
            f"User's skills to match against: {user_skills}"
        ),
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Helper Functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def _is_youtube_short(duration_str: str, url: str) -> bool:
    """Determine if a YouTube video is a Short based on duration and URL."""
    if "/shorts/" in url:
        return True
    # Parse ISO 8601 duration (e.g., "PT1M30S")
    try:
        import re
        match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration_str)
        if match:
            hours = int(match.group(1) or 0)
            minutes = int(match.group(2) or 0)
            seconds = int(match.group(3) or 0)
            total_seconds = hours * 3600 + minutes * 60 + seconds
            return total_seconds <= 60
    except Exception:
        pass
    return False


def _attempt_audio_transcription(video_url: str) -> str:
    """Attempt to download audio and transcribe for videos without captions."""
    try:
        from tools.instagram_tools import download_instagram_reel_audio
        from tools.audio_tools import transcribe_audio
        from config import DATA_DIR
        import os

        temp_dir = str(DATA_DIR / "temp_media")
        os.makedirs(temp_dir, exist_ok=True)

        # yt-dlp works for YouTube too
        audio_path = download_instagram_reel_audio(video_url, temp_dir)
        if audio_path:
            result = transcribe_audio(audio_path)
            try:
                os.remove(audio_path)
            except OSError:
                pass
            return result.get("text", "")
    except Exception:
        pass
    return ""


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Agent Definition
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTENT_ANALYZER_INSTRUCTION = """You are the HBTM Content Analyzer Agent — the deep analysis engine.

Your job is to deeply understand any piece of content a user has consumed and extract
structured information about what skills, topics, and knowledge it contains.

## Your Analysis Pipeline:

1. **Determine content type** from the URL:
   - youtube.com or youtu.be → use analyze_youtube_video
   - instagram.com/reel → use analyze_instagram_reel
   - Other URL → use analyze_article_or_book with content_type='article'
   - Book title (no URL) → use analyze_article_or_book with content_type='book'

2. **After getting raw content data**, synthesize your analysis:
   - Read the title, description, tags, transcript, and visual description
   - Identify 3-7 specific topics covered (be specific, not generic)
   - Match topics to the user's skill list
   - Assess difficulty level based on language complexity and depth
   - Extract 3-5 key actionable takeaways

3. **Output Format** — Always return valid JSON:
```json
{
    "content_url": "...",
    "platform": "youtube|instagram|article|book",
    "content_type": "youtube_video|youtube_short|instagram_reel|article|book",
    "title": "...",
    "detected_topics": ["topic1", "topic2", ...],
    "primary_skill_match": "Communication",
    "matched_skills": [
        {"skill_name": "Communication", "relevance_score": 0.9},
        {"skill_name": "Public Speaking", "relevance_score": 0.7}
    ],
    "difficulty_level": "beginner|intermediate|advanced",
    "key_takeaways": ["takeaway1", "takeaway2", ...],
    "summary": "2-3 sentence summary"
}
```

## Important Rules:
- Always use the analysis tools first to get raw data, then synthesize
- Be specific with topics (not "communication" but "active listening techniques")
- Relevance scores should reflect genuine semantic similarity (0.0 = unrelated, 1.0 = perfect match)
- If content doesn't match ANY user skills, still analyze it and assign the closest match with a low score
- For Instagram reels with no audio AND no meaningful visual content, mark as "unanalyzable"
"""

content_analyzer_agent = LlmAgent(
    name="content_analyzer_agent",
    model=GEMINI_MODEL,
    instruction=CONTENT_ANALYZER_INSTRUCTION,
    tools=[
        analyze_youtube_video,
        analyze_instagram_reel,
        analyze_article_or_book,
        synthesize_content_analysis,
    ],
)
