import os
import uuid
from typing import Dict, Any, Optional

import whisper
import requests

try:
    from config import WHISPER_MODEL, DATA_DIR
except ImportError:
    WHISPER_MODEL = "base"
    from pathlib import Path
    DATA_DIR = Path("/tmp")

# Load model once at module level (lazy loading)
_whisper_model = None

def get_whisper_model():
    """Lazy load the Whisper model."""
    global _whisper_model
    if _whisper_model is None:
        print(f"Loading Whisper model '{WHISPER_MODEL}'...")
        _whisper_model = whisper.load_model(WHISPER_MODEL)
    return _whisper_model

def transcribe_audio(audio_path: str) -> Dict[str, Any]:
    """Transcribe an audio file using Whisper.
    Returns: { 'text': full transcript, 'language': detected language, 'segments': [...] }
    """
    if not os.path.exists(audio_path):
        return {"error": f"Audio file not found at {audio_path}"}
        
    try:
        model = get_whisper_model()
        result = model.transcribe(audio_path)
        return {
            "text": result.get("text", "").strip(),
            "language": result.get("language", ""),
            "segments": result.get("segments", [])
        }
    except Exception as e:
        return {"error": f"Transcription failed: {e}"}

def transcribe_audio_from_url(url: str) -> Dict[str, Any]:
    """Download audio from URL and transcribe it."""
    temp_dir = DATA_DIR / 'temp_media'
    os.makedirs(temp_dir, exist_ok=True)
    temp_file = os.path.join(temp_dir, f"{uuid.uuid4().hex}_download.mp3")
    
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(temp_file, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                
        # Transcribe
        result = transcribe_audio(temp_file)
        
        # Cleanup
        if os.path.exists(temp_file):
            os.remove(temp_file)
            
        return result
    except requests.exceptions.RequestException as e:
        return {"error": f"Failed to download audio from URL: {e}"}
    except Exception as e:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        return {"error": f"An unexpected error occurred: {e}"}
