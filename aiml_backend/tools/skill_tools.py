import google.genai as genai
from config import PREDEFINED_SKILLS, SKILL_LEVEL_THRESHOLDS, CONTENT_WEIGHT, GOOGLE_API_KEY, GEMINI_MODEL
import json
from .embedding_tools import cosine_similarity

def _get_client() -> genai.Client:
    return genai.Client(api_key=GOOGLE_API_KEY)

def extract_skills_from_text(text: str) -> list[str]:
    """Use Gemini to extract skill tags from free-text user input."""
    client = _get_client()
    prompt = f"""
    Given the following text, extract the specific skills the person wants to improve.
    Match against these predefined skills if possible: {', '.join(PREDEFINED_SKILLS)}.
    You may add custom skills if they don't fit the predefined ones.
    Return ONLY a JSON list of strings representing the skills.
    
    Text: {text}
    """
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        
        res_text = response.text.strip()
        if res_text.startswith("```json"):
            res_text = res_text[7:]
        if res_text.endswith("```"):
            res_text = res_text[:-3]
            
        skills = json.loads(res_text.strip())
        if isinstance(skills, list):
            return skills
        return []
    except Exception as e:
        print(f"Error extracting skills: {e}")
        return []

def match_content_to_skills(
    content_topics: list[str],
    content_embedding: list[float],
    user_skills: list[dict],
    skill_embeddings: dict[str, list[float]]
) -> list[dict]:
    """Match analyzed content topics to user's skills.
    
    Returns: list of { 'skill_name': str, 'relevance_score': float (0-1) }
    """
    matches = []
    
    for skill in user_skills:
        skill_name = skill.get('skill_name')
        if not skill_name:
            continue
            
        # 1. Keyword match
        keyword_score = 1.0 if any(t.lower() in skill_name.lower() or skill_name.lower() in t.lower() for t in content_topics) else 0.0
        
        # 2. Semantic match
        semantic_score = 0.0
        if content_embedding and skill_name in skill_embeddings:
            semantic_score = cosine_similarity(content_embedding, skill_embeddings[skill_name])
            
        # 3. Combine scores
        relevance_score = (0.4 * keyword_score) + (0.6 * max(0, semantic_score))
        
        # 4. Filter
        if relevance_score > 0.3:
            matches.append({
                'skill_name': skill_name,
                'relevance_score': relevance_score
            })
            
    matches.sort(key=lambda x: x['relevance_score'], reverse=True)
    return matches

def calculate_skill_progress(
    current_level: float,
    content_matches: list[dict],
    sandbox_unlocked_level: float = None
) -> tuple[float, float | None]:
    """Calculate new skill level after consuming matched content.
    Returns: (new_level, sandbox_triggered_level)
    """
    if sandbox_unlocked_level is not None:
        # User is hard-capped until they pass the sandbox challenge
        return (sandbox_unlocked_level, sandbox_unlocked_level)
        
    new_level = current_level
    # Base increment is much smaller for a 0-10 scale than a 0-100 scale
    base_increment = 0.2
    
    for match in content_matches:
        relevance_score = match.get('relevance_score', 0.0)
        content_type = match.get('content_type', 'article')
        
        weight = CONTENT_WEIGHT.get(content_type, 1.0)
        # Diminishing returns: harder to level up as you get closer to 10
        diminishing_factor = max(0.1, 1.0 - (new_level / 15.0))
        
        increment = relevance_score * weight * diminishing_factor * base_increment
        new_level += increment
        
    from config import SKILL_MILESTONES
    
    # Check if we crossed any milestone
    for milestone in SKILL_MILESTONES:
        if current_level < milestone and new_level >= milestone:
            # Hard cap at the milestone, require sandbox challenge
            return (milestone, milestone)
            
    return (min(10.0, new_level), None)

def get_level_label(level: float) -> str:
    """Get human-readable level label from numeric level."""
    for label, (min_val, max_val) in SKILL_LEVEL_THRESHOLDS.items():
        if min_val <= level <= max_val:
            return label
    return "expert"

def get_skill_recommendations(skill_name: str, current_level: float) -> dict:
    """Generate search query recommendations for a skill at a given level."""
    if current_level < 30:
        difficulty = "Beginner"
        search_queries = [f"introduction to {skill_name}", f"basics of {skill_name}", f"{skill_name} for beginners"]
        content_types = ["tutorial", "crash course", "article"]
    elif current_level < 70:
        difficulty = "Intermediate"
        search_queries = [f"advanced {skill_name} techniques", f"{skill_name} tips and tricks", f"{skill_name} masterclass"]
        content_types = ["course", "book", "project"]
    else:
        difficulty = "Advanced"
        search_queries = [f"expert {skill_name} strategies", f"{skill_name} case studies", f"{skill_name} deep dive"]
        content_types = ["research paper", "conference talk", "advanced book"]
        
    return {
        'search_queries': search_queries,
        'content_types': content_types,
        'difficulty': difficulty
    }
