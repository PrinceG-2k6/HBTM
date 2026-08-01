import os
import uuid
import requests
from typing import List, Optional
from PIL import Image

import google.genai as genai

try:
    from config import GOOGLE_API_KEY, DATA_DIR, GEMINI_MODEL
except ImportError:
    GOOGLE_API_KEY = ""
    GEMINI_MODEL = "gemini-3.5-flash-lite"
    from pathlib import Path
    DATA_DIR = Path("/tmp")

def _get_genai_client() -> Optional[genai.Client]:
    if not GOOGLE_API_KEY:
        print("GOOGLE_API_KEY is not set.")
        return None
    return genai.Client(api_key=GOOGLE_API_KEY)

def analyze_image(image_path: str, prompt: Optional[str] = None) -> str:
    """Analyze a single image using Gemini Vision.
    Returns text description of the image content.
    """
    client = _get_genai_client()
    if not client:
        return "Error: Gemini API key missing."
        
    if not os.path.exists(image_path):
        return f"Error: Image not found at {image_path}"
        
    if not prompt:
        prompt = "Describe what is shown in this image. What topics, skills, or subjects does it relate to?"
        
    try:
        image = Image.open(image_path)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[image, prompt]
        )
        return response.text
    except Exception as e:
        return f"Error analyzing image: {e}"

def analyze_video_frames(frame_paths: List[str], context: str = '') -> str:
    """Analyze multiple video frames to understand video content.
    Returns combined description of visual content.
    """
    client = _get_genai_client()
    if not client:
        return "Error: Gemini API key missing."
        
    valid_frames = []
    for path in frame_paths:
        if os.path.exists(path):
            try:
                valid_frames.append(Image.open(path))
            except Exception:
                pass
                
    if not valid_frames:
        return "Error: No valid frames provided or found."

    prompt = f"These are frames from a video. {context}. Describe the content, topics, and skills being shown or taught."
    
    try:
        contents = valid_frames + [prompt]
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents
        )
        return response.text
    except Exception as e:
        return f"Error analyzing video frames: {e}"

def analyze_thumbnail(thumbnail_url: str) -> str:
    """Download and analyze a video thumbnail."""
    if not thumbnail_url:
        return "Error: Empty thumbnail URL provided."
        
    temp_dir = DATA_DIR / 'temp_media'
    os.makedirs(temp_dir, exist_ok=True)
    temp_file = os.path.join(temp_dir, f"{uuid.uuid4().hex}_thumb.jpg")
    
    try:
        response = requests.get(thumbnail_url, stream=True)
        response.raise_for_status()
        
        with open(temp_file, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                
        result = analyze_image(temp_file, prompt="This is a video thumbnail. Describe it and what the video might be about.")
        
        if os.path.exists(temp_file):
            os.remove(temp_file)
            
        return result
    except requests.exceptions.RequestException as e:
        return f"Error downloading thumbnail: {e}"
    except Exception as e:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        return f"An unexpected error occurred: {e}"
