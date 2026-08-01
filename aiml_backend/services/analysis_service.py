"""Analysis Service — bridges FastAPI with Content Analyzer Agent."""

from sqlalchemy.ext.asyncio import AsyncSession
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types
import json

from agents.root_agent import root_agent
from tools.db_tools import (
    save_content_analysis,
    get_user_skills,
    log_engagement,
    update_skill_level,
)
from tools.embedding_tools import generate_embedding
from tools.skill_tools import match_content_to_skills, calculate_skill_progress, get_level_label
from db.vector_store import add_content_embedding, get_skill_collection
from config import CONTENT_WEIGHT


# Create a module-level session service and runner
_session_service = InMemorySessionService()
_runner = Runner(
    agent=root_agent,
    app_name='hbtm',
    session_service=_session_service,
)


def _detect_platform(url: str) -> str:
    """Auto-detect platform from URL."""
    url_lower = url.lower()
    if 'youtube.com' in url_lower or 'youtu.be' in url_lower:
        return 'youtube'
    elif 'instagram.com' in url_lower:
        return 'instagram'
    else:
        return 'article'


async def analyze_single_content(
    db: AsyncSession,
    user_id: str,
    content_url: str,
    platform: str = None,
) -> dict:
    """Analyze a single content URL using the agent system.
    
    1. Detect platform if not provided
    2. Run Content Analyzer Agent via the orchestrator
    3. Generate embedding for the content
    4. Match to user's skills using semantic similarity
    5. Save to DB and vector store
    6. Return analysis result
    """
    if not platform:
        platform = _detect_platform(content_url)
    
    # Get user's skills for matching
    user_skills = await get_user_skills(db, user_id)
    skill_names = [s.skill_name for s in user_skills]
    
    # Run agent for deep analysis
    # For the standalone service, we can call the tools directly
    analysis = await _run_content_analysis(content_url, platform, skill_names)
    
    # Generate embedding for the content
    content_text = f"{analysis.get('title', '')} {analysis.get('summary', '')} {' '.join(analysis.get('detected_topics', []))}"
    try:
        content_embedding = generate_embedding(content_text)
    except Exception:
        content_embedding = []
    
    # Semantic skill matching
    if content_embedding:
        try:
            # Get skill embeddings from ChromaDB
            skill_collection = get_skill_collection()
            skill_embeds = {}
            for sn in skill_names:
                try:
                    result = skill_collection.get(ids=[sn], include=['embeddings'])
                    if result and result['embeddings']:
                        skill_embeds[sn] = result['embeddings'][0]
                except Exception:
                    pass
            
            if skill_embeds:
                semantic_matches = match_content_to_skills(
                    analysis.get('detected_topics', []),
                    content_embedding,
                    [{'skill_name': s.skill_name, 'current_level': s.current_level} for s in user_skills],
                    skill_embeds,
                )
                analysis['matched_skills'] = semantic_matches
        except Exception:
            pass
    
    # Save to DB
    content_record = await save_content_analysis(db, user_id, {
        'platform': platform,
        'content_url': content_url,
        'content_type': analysis.get('content_type', platform),
        'title': analysis.get('title', ''),
        'description': analysis.get('summary', ''),
        'tags': json.dumps(analysis.get('detected_topics', [])),
        'category': analysis.get('category', ''),
        'transcript': analysis.get('transcript', '')[:5000],
        'visual_description': analysis.get('visual_description', ''),
        'detected_topics': json.dumps(analysis.get('detected_topics', [])),
        'matched_skills': json.dumps(analysis.get('matched_skills', [])),
        'difficulty_level': analysis.get('difficulty_level', 'beginner'),
        'key_takeaways': json.dumps(analysis.get('key_takeaways', [])),
    })
    
    # Save embedding to vector store
    if content_embedding:
        try:
            add_content_embedding(
                str(content_record.id),
                content_embedding,
                {
                    'user_id': user_id,
                    'platform': platform,
                    'title': analysis.get('title', '')[:200],
                }
            )
        except Exception:
            pass
    
    # Log engagement
    await log_engagement(db, user_id, 'content_analyzed', {'url': content_url, 'platform': platform})
    
    return analysis


async def _run_content_analysis(url: str, platform: str, skill_names: list[str]) -> dict:
    """Run content analysis using the appropriate tools directly.
    
    For standalone operation, we call the analysis tools directly instead
    of going through the full agent conversation loop.
    """
    try:
        # Step 1: Manually extract content based on platform
        analysis_data = {}
        
        if platform == 'youtube':
            from tools.youtube_tools import extract_video_id, get_youtube_video_metadata, get_youtube_transcript, get_youtube_video_category
            
            video_id = extract_video_id(url)
            if not video_id:
                return {'error': 'Invalid YouTube URL', 'content_url': url}
            
            metadata = get_youtube_video_metadata(video_id)
            transcript = get_youtube_transcript(video_id)
            
            category_name = ''
            if metadata.get('categoryId'):
                category_name = get_youtube_video_category(metadata['categoryId'])
            
            is_short = '/shorts/' in url
            content_type = 'youtube_short' if is_short else 'youtube_video'
            
            analysis_data = {
                'content_url': url,
                'platform': 'youtube',
                'content_type': content_type,
                'title': metadata.get('title', ''),
                'description': metadata.get('description', '')[:500],
                'tags': metadata.get('tags', []),
                'category': category_name,
                'transcript': (transcript or '')[:3000],
                'visual_description': '',
                'summary': metadata.get('description', '')[:200],
            }
            
        elif platform == 'instagram':
            from tools.instagram_tools import get_instagram_reel_metadata
            metadata = get_instagram_reel_metadata(url)
            analysis_data = {
                'content_url': url,
                'platform': 'instagram',
                'content_type': 'instagram_reel',
                'title': metadata.get('title', ''),
                'description': metadata.get('description', '')[:500],
                'tags': [],
                'category': '',
                'transcript': '',
                'visual_description': '',
                'summary': metadata.get('title', '')[:200],
            }
            
        else:  # article
            try:
                import trafilatura
                downloaded = trafilatura.fetch_url(url)
                text = trafilatura.extract(downloaded) if downloaded else ''
            except Exception:
                text = ''
            
            analysis_data = {
                'content_url': url,
                'platform': 'article',
                'content_type': 'article',
                'title': '',
                'description': (text or '')[:500],
                'tags': [],
                'category': '',
                'transcript': (text or '')[:3000],
                'visual_description': '',
                'summary': (text or '')[:200],
            }
            
        # Step 2: Use genai.Client to synthesize the extracted content
        import google.genai as genai
        from config import GOOGLE_API_KEY, GEMINI_MODEL
        
        client = genai.Client(api_key=GOOGLE_API_KEY)
        prompt = f"""
        You are an expert AI content analyzer. Analyze the following content and return a JSON object.
        User's target skills: {skill_names}
        
        Content Title: {analysis_data.get('title')}
        Description: {analysis_data.get('description')}
        Transcript: {analysis_data.get('transcript')}
        
        Return exactly this JSON format:
        {{
            "detected_topics": ["topic1", "topic2", "topic3"],
            "primary_skill_match": "string (best match from user skills or empty)",
            "difficulty_level": "beginner|intermediate|advanced",
            "key_takeaways": ["takeaway1", "takeaway2"],
            "summary": "2 sentence summary"
        }}
        """
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        
        res_text = response.text.strip()
        if res_text.startswith("```json"):
            res_text = res_text[7:]
        elif res_text.startswith("```"):
            res_text = res_text[3:]
        if res_text.endswith("```"):
            res_text = res_text[:-3]
            
        llm_output = json.loads(res_text.strip())
        
        # Merge LLM output into analysis_data
        analysis_data['detected_topics'] = llm_output.get('detected_topics', [])
        analysis_data['matched_skills'] = [] # Handled later by embeddings
        analysis_data['difficulty_level'] = llm_output.get('difficulty_level', 'beginner')
        analysis_data['key_takeaways'] = llm_output.get('key_takeaways', [])
        analysis_data['summary'] = llm_output.get('summary', analysis_data.get('summary'))
        
        return analysis_data
        
    except Exception as e:
        print(f"Error during manual analysis pipeline: {e}")
        return {
            'content_url': url,
            'platform': platform,
            'content_type': f'{platform}_content',
            'title': 'Analysis Failed - ' + url,
            'description': f'Error: {str(e)}',
            'tags': [],
            'category': '',
            'transcript': '',
            'visual_description': '',
            'detected_topics': [],
            'matched_skills': [],
            'difficulty_level': 'beginner',
            'key_takeaways': [],
            'summary': 'Could not complete LLM analysis.',
        }


async def update_user_skills(
    db: AsyncSession,
    user_id: str,
    content_urls: list[str],
) -> dict:
    """Bulk analyze content and update skill levels.
    
    This is the 'Update Your Skills' feature.
    
    1. Analyze each content URL
    2. Aggregate matches per skill
    3. Calculate new skill levels
    4. Update DB
    5. Return progress delta
    """
    # Analyze all content
    analyses = []
    for url in content_urls:
        try:
            analysis = await analyze_single_content(db, user_id, url)
            if 'error' not in analysis:
                analyses.append(analysis)
        except Exception:
            continue
    
    if not analyses:
        return {'error': 'No content could be analyzed', 'content_analyzed': 0}
    
    # Get current skills
    user_skills = await get_user_skills(db, user_id)
    skill_levels = {
        s.skill_name: {
            'id': s.id, 
            'level': s.current_level, 
            'sandbox_unlocked_level': s.sandbox_unlocked_level
        } 
        for s in user_skills
    }
    
    # Aggregate matches per skill
    skill_content_map = {}
    for analysis in analyses:
        for match in analysis.get('matched_skills', []):
            skill_name = match.get('skill_name', '') if isinstance(match, dict) else match
            score = match.get('relevance_score', 0.5) if isinstance(match, dict) else 0.5
            if skill_name not in skill_content_map:
                skill_content_map[skill_name] = []
            skill_content_map[skill_name].append({
                'relevance_score': score,
                'content_type': analysis.get('content_type', 'article'),
            })
    
    # Calculate and update
    skills_updated = {}
    for skill_name, matches in skill_content_map.items():
        if skill_name in skill_levels:
            old_level = skill_levels[skill_name]['level']
            sandbox_unlocked_level = skill_levels[skill_name]['sandbox_unlocked_level']
            
            new_level, sandbox_triggered_level = calculate_skill_progress(
                old_level, 
                matches, 
                sandbox_unlocked_level
            )
            new_label = get_level_label(new_level)
            
            await update_skill_level(
                db,
                skill_levels[skill_name]['id'],
                new_level,
                new_label,
                sandbox_triggered_level
            )
            
            skills_updated[skill_name] = {
                'old_level': round(old_level, 2),
                'new_level': round(new_level, 2),
                'delta': round(new_level - old_level, 2),
                'new_label': new_label,
                'sandbox_triggered_level': sandbox_triggered_level
            }
    
    await db.commit()
    await log_engagement(db, user_id, 'skill_updated', {'skills': list(skills_updated.keys())})
    
    return {
        'skills_updated': skills_updated,
        'content_analyzed': len(analyses),
        'top_insight': _generate_insight(skills_updated),
    }


def _generate_insight(skills_updated: dict) -> str:
    """Generate a top insight message from skill updates."""
    if not skills_updated:
        return 'Keep consuming content to see progress!'
    
    top_skill = max(skills_updated.items(), key=lambda x: x[1]['delta'])
    return f"You've made the most progress in {top_skill[0]} (+{top_skill[1]['delta']} points). Keep it up!"
