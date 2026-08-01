import re
import hashlib
import random
from typing import Dict, List, Optional, Any
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

# Assuming config.py is in the parent directory or reachable in the Python path
try:
    from config import YOUTUBE_DATA_API_KEY
except ImportError:
    YOUTUBE_DATA_API_KEY = ""

def get_youtube_video_metadata(video_id: str) -> Dict[str, Any]:
    """Fetch full metadata for a YouTube video using Data API v3.
    Returns: title, description, tags, categoryId, duration, channelTitle, 
    publishedAt, viewCount, likeCount, thumbnail_url
    """
    if not YOUTUBE_DATA_API_KEY:
        return {"error": "YouTube Data API key is missing."}

    try:
        youtube = build("youtube", "v3", developerKey=YOUTUBE_DATA_API_KEY)
        request = youtube.videos().list(
            part="snippet,contentDetails,statistics",
            id=video_id
        )
        response = request.execute()

        if not response.get("items"):
            return {"error": f"No video found with id {video_id}"}

        item = response["items"][0]
        snippet = item.get("snippet", {})
        content_details = item.get("contentDetails", {})
        statistics = item.get("statistics", {})

        # Get best available thumbnail
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = thumbnails.get("maxres", thumbnails.get("high", thumbnails.get("default", {}))).get("url", "")

        return {
            "title": snippet.get("title"),
            "description": snippet.get("description"),
            "tags": snippet.get("tags", []),
            "categoryId": snippet.get("categoryId"),
            "duration": content_details.get("duration"),
            "channelTitle": snippet.get("channelTitle"),
            "publishedAt": snippet.get("publishedAt"),
            "viewCount": statistics.get("viewCount"),
            "likeCount": statistics.get("likeCount"),
            "thumbnail_url": thumbnail_url,
        }
    except HttpError as e:
        return {"error": f"YouTube API error: {e}"}
    except Exception as e:
        return {"error": f"An unexpected error occurred: {e}"}

def get_mock_youtube_videos(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    # Seed Python's random generator using a hash of the query
    # to make the generated videos unique per skill but stable across reloads
    query_hash = hashlib.sha256(query.encode('utf-8')).hexdigest()
    seed = int(query_hash[:8], 16)
    
    # Store old state of random to avoid side effects
    state = random.getstate()
    random.seed(seed)
    
    channels = [
        "Tech Academy", "DevTips", "CodeCraft", "ByteSize", "DesignLife",
        "The Coding Train", "Traversy Media", "Academind", "Programming with Mosh",
        "FreeCodeCamp", "Fireship", "The Net Ninja", "Web Dev Simplified"
    ]
    
    verbs = ["Mastering", "Understanding", "Deep Dive into", "Getting Started with", "Advanced Techniques in", "The Art of"]
    adjectives = ["Comprehensive", "Essential", "Practical", "Modern", "Advanced", "Professional", "Complete"]
    nouns = ["Concepts", "Workflows", "Foundations", "Best Practices", "Secrets", "Patterns", "Fundamentals"]
    
    # Diverse set of high-resolution Unsplash thumbnails
    unsplash_pool = [
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1516116211223-5c359a36298a?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=60",
    ]
    
    # Generate unique-looking YouTube-like IDs (11 chars)
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
    
    clean_title = re.sub(
        r'\b(introduction to|basics of|advanced|expert|masterclass|tutorials?|videos?|guides?|courses?)\b',
        '',
        query,
        flags=re.IGNORECASE
    ).strip().title()
    if not clean_title:
        clean_title = query.title()

    results = []
    for i in range(max_results):
        # Generate a unique video ID per video based on query and index
        vid_seed_str = f"{query}_{i}"
        vid_hash = hashlib.sha256(vid_seed_str.encode('utf-8')).hexdigest()
        vid_seed = int(vid_hash[:8], 16)
        
        # Temporary seed for ID generation
        random.seed(vid_seed)
        v_id = "".join(random.choices(alphabet, k=11))
        
        # Title templates
        title_templates = [
            f"{random.choice(verbs)} {clean_title}: A {random.choice(adjectives)} Guide",
            f"{random.choice(adjectives)} {clean_title} {random.choice(nouns)} for Beginners",
            f"{clean_title} Masterclass - {random.choice(verbs)} the {random.choice(nouns)}",
            f"How to build real-world skills in {clean_title}",
            f"{clean_title}: {random.choice(verbs)} Advanced {random.choice(nouns)}"
        ]
        title = title_templates[i % len(title_templates)]
        
        desc = f"In this video, we explore {clean_title} {random.choice(nouns).lower()}. Learn the {random.choice(adjectives).lower()} techniques required to excel, with practical guidance and examples."
        channel = random.choice(channels)
        
        # Pick a unique thumbnail from the unsplash pool deterministically for this specific video
        thumb_index = (vid_seed + i) % len(unsplash_pool)
        thumb = unsplash_pool[thumb_index]
        
        results.append({
            "video_id": v_id,
            "title": title,
            "description": desc,
            "channelTitle": channel,
            "thumbnail_url": thumb,
            "publishedAt": f"2026-08-{random.randint(1, 28):02d}T12:00:00Z",
        })
        
    # Restore the original random state
    random.setstate(state)
    return results

def search_youtube_videos(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """Search YouTube for videos matching a query.
    Returns list of: video_id, title, description, channelTitle, thumbnail_url, publishedAt
    Falls back to high-quality mock data if API key is missing or call fails.
    """
    if not YOUTUBE_DATA_API_KEY:
        print("YOUTUBE_DATA_API_KEY is missing, returning mock videos")
        return get_mock_youtube_videos(query, max_results)

    try:
        youtube = build("youtube", "v3", developerKey=YOUTUBE_DATA_API_KEY)
        request = youtube.search().list(
            part="snippet",
            q=query,
            type="video",
            maxResults=max_results
        )
        response = request.execute()
        
        results = []
        for item in response.get("items", []):
            snippet = item.get("snippet", {})
            thumbnails = snippet.get("thumbnails", {})
            thumbnail_url = thumbnails.get("high", thumbnails.get("default", {})).get("url", "")
            
            results.append({
                "video_id": item.get("id", {}).get("videoId"),
                "title": snippet.get("title"),
                "description": snippet.get("description"),
                "channelTitle": snippet.get("channelTitle"),
                "thumbnail_url": thumbnail_url,
                "publishedAt": snippet.get("publishedAt"),
            })
        
        # If the API returned empty results, use mock fallback
        if not results:
            return get_mock_youtube_videos(query, max_results)
            
        return results
    except Exception as e:
        print(f"YouTube Search failed ({e}), falling back to mock results")
        return get_mock_youtube_videos(query, max_results)

def get_youtube_transcript(video_id: str) -> Optional[str]:
    """Get the transcript/captions for a YouTube video.
    Returns full transcript text or None if unavailable.
    """
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        # Join all text segments into one string
        transcript = " ".join([segment["text"] for segment in transcript_list])
        return transcript
    except TranscriptsDisabled:
        print(f"Transcripts are disabled for video {video_id}")
        return None
    except NoTranscriptFound:
        print(f"No transcript found for video {video_id}")
        return None
    except Exception as e:
        print(f"Error fetching transcript for {video_id}: {e}")
        return None

def get_youtube_video_category(category_id: str) -> str:
    """Map YouTube category ID to human-readable name."""
    CATEGORY_MAP = {
        "1": "Film & Animation",
        "2": "Autos & Vehicles",
        "10": "Music",
        "15": "Pets & Animals",
        "17": "Sports",
        "18": "Short Movies",
        "19": "Travel & Events",
        "20": "Gaming",
        "21": "Videoblogging",
        "22": "People & Blogs",
        "23": "Comedy",
        "24": "Entertainment",
        "25": "News & Politics",
        "26": "Howto & Style",
        "27": "Education",
        "28": "Science & Technology",
        "29": "Nonprofits & Activism",
        "30": "Movies",
        "31": "Anime/Animation",
        "32": "Action/Adventure",
        "33": "Classics",
        "34": "Comedy",
        "35": "Documentary",
        "36": "Drama",
        "37": "Family",
        "38": "Foreign",
        "39": "Horror",
        "40": "Sci-Fi/Fantasy",
        "41": "Thriller",
        "42": "Shorts",
        "43": "Shows",
        "44": "Trailers"
    }
    return CATEGORY_MAP.get(str(category_id), "Unknown")

def extract_video_id(url: str) -> Optional[str]:
    """Extract video ID from various YouTube URL formats.
    Handles: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, etc.
    """
    pattern = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
    match = re.search(pattern, url)
    if match:
        return match.group(1)
    return None

def get_youtube_watch_history_oauth(access_token: str) -> List[Dict[str, Any]]:
    """Fetch user's YouTube watch history using OAuth token.
    Returns list of recently watched video IDs and titles.
    NOTE: YouTube API has limited watch history access. 
    We use the 'playlistItems' endpoint with the 'HL' (history) playlist.
    """
    from google.oauth2.credentials import Credentials
    try:
        credentials = Credentials(token=access_token)
        youtube = build("youtube", "v3", credentials=credentials)
        
        request = youtube.playlistItems().list(
            part="snippet",
            playlistId="HL", # History playlist
            maxResults=50
        )
        response = request.execute()
        
        history = []
        for item in response.get("items", []):
            snippet = item.get("snippet", {})
            history.append({
                "video_id": snippet.get("resourceId", {}).get("videoId"),
                "title": snippet.get("title"),
                "publishedAt": snippet.get("publishedAt")
            })
        return history
    except HttpError as e:
        return [{"error": f"YouTube API error (OAuth): {e}"}]
    except Exception as e:
        return [{"error": f"An unexpected error occurred: {e}"}]
