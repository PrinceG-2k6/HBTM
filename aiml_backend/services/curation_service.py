"""Curation Service — orchestrates content discovery for the user's feed."""

from sqlalchemy.ext.asyncio import AsyncSession

from tools.db_tools import get_user_skills, log_engagement
from tools.youtube_tools import search_youtube_videos
from tools.search_tools import search_books_async, search_articles, search_events
from tools.skill_tools import get_skill_recommendations
from services.progress_service import detect_skill_imbalance
import time

_feed_cache = {}

async def get_curated_feed(
    db: AsyncSession,
    user_id: str,
    content_types: list[str] = None,
    max_per_skill: int = 3,
) -> dict:
    """Get a curated content feed for the user.
    
    Searches multiple platforms for content matching user's skills and level.
    When skill imbalance is detected, neglected skills are prioritized in the feed.
    """
    skills = await get_user_skills(db, user_id)
    if not skills:
        return {'error': 'No skills found. Complete onboarding first.', 'feed': []}
        
    # Check cache
    if user_id in _feed_cache:
        # Simple cache for hackathon: return if it exists and hasn't been too long
        cached = _feed_cache[user_id]
        if time.time() - cached.get('timestamp', 0) < 3600 * 24: # 24 hours
            return cached['result']
    
    if content_types is None:
        content_types = ['youtube', 'books', 'articles']
    
    # Detect imbalance and reorder skills to prioritize neglected ones
    imbalance = detect_skill_imbalance(skills)
    diversification_applied = False
    
    if imbalance:
        neglected_names = set(imbalance["neglected_skills"])
        # Sort: neglected skills first, then the rest
        skills_ordered = sorted(
            skills, 
            key=lambda s: (0 if s.skill_name in neglected_names else 1, s.current_level)
        )
        diversification_applied = True
    else:
        skills_ordered = list(skills)
    
    feed = []
    
    for skill in skills_ordered[:5]:  # Top 5 skills
        recs = get_skill_recommendations(skill.skill_name, skill.current_level)
        queries = recs.get('search_queries', [f"{skill.skill_name} tutorial"])
        
        # Give neglected skills MORE results
        skill_max = max_per_skill + 2 if (imbalance and skill.skill_name in neglected_names) else max_per_skill
        
        for query in queries[:1]:  # Use top query
            # YouTube
            if 'youtube' in content_types:
                try:
                    yt_results = search_youtube_videos(query, max_results=skill_max)
                    for r in yt_results:
                        feed.append({
                            'platform': 'youtube',
                            'content_type': 'video',
                            'title': r.get('title', ''),
                            'url': f"https://youtube.com/watch?v={r.get('video_id', '')}",
                            'thumbnail_url': r.get('thumbnail_url', ''),
                            'matched_skill': skill.skill_name,
                            'is_diversification_pick': diversification_applied and skill.skill_name in neglected_names,
                            'relevance_score': 0.8,  # Approximate
                        })
                except Exception:
                    pass
            
            # Books
            if 'books' in content_types:
                try:
                    book_results = await search_books_async(query, max_results=1)
                    for b in book_results:
                        feed.append({
                            'platform': 'book',
                            'content_type': 'book',
                            'title': b.get('title', ''),
                            'url': b.get('info_link', ''),
                            'thumbnail_url': b.get('thumbnail', ''),
                            'matched_skill': skill.skill_name,
                            'is_diversification_pick': diversification_applied and skill.skill_name in neglected_names,
                            'relevance_score': 0.7,
                        })
                except Exception:
                    pass
            
            # Articles
            if 'articles' in content_types:
                try:
                    article_results = search_articles(query, max_results=2)
                    for a in article_results:
                        feed.append({
                            'platform': 'article',
                            'content_type': 'article',
                            'title': a.get('title', ''),
                            'url': a.get('url', ''),
                            'thumbnail_url': '',
                            'matched_skill': skill.skill_name,
                            'is_diversification_pick': diversification_applied and skill.skill_name in neglected_names,
                            'relevance_score': 0.6,
                        })
                except Exception:
                    pass
    
    # Log engagement
    await log_engagement(db, user_id, 'feed_viewed', {'items_count': len(feed), 'diversification_applied': diversification_applied})
    
    result = {
        'feed': feed,
        'total_items': len(feed),
        'skills_covered': list(set(item['matched_skill'] for item in feed)),
        'diversification_applied': diversification_applied,
    }
    
    if diversification_applied:
        result['diversification_reason'] = (
            f"We noticed you've been focusing heavily on {imbalance['dominant_skill']}. "
            f"We've boosted content for {', '.join(imbalance['neglected_skills'])} to help your overall growth!"
        )
        
    _feed_cache[user_id] = {'result': result, 'timestamp': time.time()}
    
    return result

