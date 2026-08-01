import os
import uuid
import subprocess
from typing import Dict, List, Optional, Any
import yt_dlp

try:
    from config import DATA_DIR
except ImportError:
    from pathlib import Path
    DATA_DIR = Path("/tmp")

TEMP_MEDIA_DIR = DATA_DIR / 'temp_media'
os.makedirs(TEMP_MEDIA_DIR, exist_ok=True)

def is_instagram_url(url: str) -> bool:
    """Check if a URL is an Instagram URL."""
    return "instagram.com" in url

def get_instagram_reel_metadata(url: str) -> Dict[str, Any]:
    """Extract metadata from an Instagram reel URL using yt-dlp.
    Returns: title/caption, uploader, view_count, like_count, duration, thumbnail_url
    """
    ydl_opts = {
        'skip_download': True,
        'quiet': True,
    }

    # Attempt with cookies from browser first
    try:
        opts_with_cookies = ydl_opts.copy()
        opts_with_cookies['cookiesfrombrowser'] = ('chrome',)
        with yt_dlp.YoutubeDL(opts_with_cookies) as ydl:
            info = ydl.extract_info(url, download=False)
            return _parse_yt_dlp_info(info)
    except Exception as e_cookie:
        print(f"Failed with cookies, falling back to without. Error: {e_cookie}")
        # Fallback to no cookies
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return _parse_yt_dlp_info(info)
        except Exception as e:
            return {"error": f"Failed to extract metadata: {e}"}

def _parse_yt_dlp_info(info: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "title": info.get("title") or info.get("description"),
        "uploader": info.get("uploader"),
        "view_count": info.get("view_count"),
        "like_count": info.get("like_count"),
        "duration": info.get("duration"),
        "thumbnail_url": info.get("thumbnail"),
    }

def download_instagram_reel_audio(url: str, output_dir: str = str(TEMP_MEDIA_DIR)) -> Optional[str]:
    """Download just the audio track from an Instagram reel.
    Returns path to the downloaded audio file, or None if extraction fails.
    """
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}_audio"
    output_template = os.path.join(output_dir, f"{filename}.%(ext)s")
    
    ydl_opts = {
        'format': 'bestaudio',
        'outtmpl': output_template,
        'quiet': True,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }
    
    # Try without cookies first for download, or try cookies if needed.
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            # The postprocessor appends .mp3
            expected_file = os.path.join(output_dir, f"{filename}.mp3")
            if os.path.exists(expected_file):
                return expected_file
            return None
    except Exception as e:
        print(f"Error downloading audio: {e}")
        return None

def download_instagram_reel_video(url: str, output_dir: str = str(TEMP_MEDIA_DIR)) -> Optional[str]:
    """Download the full video from an Instagram reel for frame extraction.
    Returns path to the downloaded video file.
    """
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}_video.mp4"
    output_path = os.path.join(output_dir, filename)
    
    ydl_opts = {
        'format': 'bestvideo+bestaudio/best',
        'outtmpl': output_path,
        'quiet': True,
        'merge_output_format': 'mp4'
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            if os.path.exists(output_path):
                return output_path
            return None
    except Exception as e:
        print(f"Error downloading video: {e}")
        return None

def extract_video_frames(video_path: str, num_frames: int = 5, output_dir: Optional[str] = None) -> List[str]:
    """Extract evenly-spaced frames from a video file.
    Returns list of paths to saved frame images (JPEG).
    """
    if output_dir is None:
        output_dir = str(TEMP_MEDIA_DIR)
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Get video duration using ffprobe
        duration_cmd = [
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', video_path
        ]
        duration_str = subprocess.check_output(duration_cmd).decode('utf-8').strip()
        duration = float(duration_str)
        
        if duration <= 0:
            return []
            
        interval = duration / (num_frames + 1)
        frame_paths = []
        
        base_name = os.path.basename(video_path).split('.')[0]
        
        for i in range(1, num_frames + 1):
            timestamp = i * interval
            frame_path = os.path.join(output_dir, f"{base_name}_frame_{i}.jpg")
            
            # Extract frame using ffmpeg
            ffmpeg_cmd = [
                'ffmpeg', '-y', '-ss', str(timestamp), '-i', video_path,
                '-vframes', '1', '-q:v', '2', frame_path
            ]
            subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            
            if os.path.exists(frame_path):
                frame_paths.append(frame_path)
                
        return frame_paths
    except Exception as e:
        print(f"Error extracting frames: {e}")
        return []
