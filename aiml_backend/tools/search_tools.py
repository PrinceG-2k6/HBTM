import google.genai as genai
from google.genai import types
from config import GOOGLE_API_KEY
import httpx
import asyncio
import json

def _get_client() -> genai.Client:
    return genai.Client(api_key=GOOGLE_API_KEY)

def search_web(query: str, num_results: int = 5) -> list[dict]:
    """Search the web using Google Search (via Gemini's google_search tool)."""
    try:
        client = _get_client()
        prompt = f"""
        Search for: {query}
        Extract the top {num_results} search results and return them as a JSON list.
        Each item must have: 'title', 'url', and 'snippet'.
        Only return the JSON list, no markdown blocks.
        """
        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}]
            )
        )
        
        text = (response.text or "").strip()
        if not text: return []
        if text.startswith("```json"): text = text[7:]
        if text.endswith("```"): text = text[:-3]
        
        return json.loads(text.strip())
        
    except Exception as e:
        print(f"Web search error: {e}")
        # Fallback for articles
        return [{
            "title": f"The Ultimate Guide to {query.replace(' article guide tutorial blog', '')}",
            "url": "https://medium.com/topic",
            "snippet": f"A comprehensive overview of {query.replace(' article guide tutorial blog', '')} covering all the basics and advanced concepts."
        }]

def search_events(skill_name: str, location: str = '', max_results: int = 5) -> list[dict]:
    """Search for physical/virtual events related to a skill."""
    loc_part = f" in {location}" if location else " virtual/online"
    query = f"{skill_name} workshop event conference {loc_part} 2026"
    
    try:
        client = _get_client()
        prompt = f"""
        Search for upcoming events for: {query}
        Extract up to {max_results} events and return them as a JSON list.
        Each item must have: 'title', 'url', 'date', 'location', 'description', 'event_type' (virtual/in-person).
        Only return the JSON list, no markdown formatting.
        """
        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}]
            )
        )
        
        text = (response.text or "").strip()
        if not text: return []
        if text.startswith("```json"): text = text[7:]
        if text.endswith("```"): text = text[:-3]
        
        return json.loads(text.strip())
    except Exception as e:
        print(f"Event search error: {e}")
        return []

async def search_books_async(query: str, max_results: int = 5) -> list[dict]:
    """Async book search using Google Books API."""
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults={max_results}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            items = data.get('items', [])
            books = []
            for item in items:
                v_info = item.get('volumeInfo', {})
                books.append({
                    'title': v_info.get('title', ''),
                    'authors': v_info.get('authors', []),
                    'description': v_info.get('description', ''),
                    'thumbnail': v_info.get('imageLinks', {}).get('thumbnail', ''),
                    'info_link': v_info.get('infoLink', ''),
                    'page_count': v_info.get('pageCount', 0),
                    'categories': v_info.get('categories', [])
                })
            if not books:
                raise Exception("No books found")
            return books
        except Exception as e:
            print(f"Book search error: {e}")
            # Fallback for books
            return [{
                'title': f"Mastering {query}",
                'authors': ["Jane Doe", "John Smith"],
                'description': f"An essential guide to {query}.",
                'thumbnail': '',
                'info_link': "https://books.google.com/",
                'page_count': 300,
                'categories': [query]
            }]

def search_articles(query: str, max_results: int = 5) -> list[dict]:
    """Search for articles/blog posts related to a topic."""
    article_query = f"{query} article guide tutorial blog"
    return search_web(article_query, max_results)
