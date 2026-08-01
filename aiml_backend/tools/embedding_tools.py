import google.genai as genai
from config import GOOGLE_API_KEY, GEMINI_EMBEDDING_MODEL
import numpy as np

# Cache client globally to avoid re-initializing
_client = None

def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=GOOGLE_API_KEY)
    return _client

def generate_embedding(text: str) -> list[float]:
    """Generate an embedding vector for the given text using Gemini Embedding API.
    Returns a list of floats representing the embedding."""
    try:
        client = _get_client()
        result = client.models.embed_content(
            model=GEMINI_EMBEDDING_MODEL,
            contents=text
        )
        return result.embeddings[0].values
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []

def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts in a batch."""
    if not texts:
        return []
    try:
        client = _get_client()
        result = client.models.embed_content(
            model=GEMINI_EMBEDDING_MODEL,
            contents=texts
        )
        return [emb.values for emb in result.embeddings]
    except Exception as e:
        print(f"Error generating embeddings batch: {e}")
        return [[] for _ in texts]

def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    if not vec_a or not vec_b:
        return 0.0
    a = np.array(vec_a)
    b = np.array(vec_b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def find_most_similar(query_embedding: list[float], candidate_embeddings: dict[str, list[float]], top_k: int = 5) -> list[tuple[str, float]]:
    """Find the top-k most similar items to the query embedding.
    candidate_embeddings: dict mapping label -> embedding vector
    Returns list of (label, similarity_score) sorted by score descending."""
    if not query_embedding or not candidate_embeddings:
        return []
    
    similarities = []
    for label, emb in candidate_embeddings.items():
        sim = cosine_similarity(query_embedding, emb)
        similarities.append((label, sim))
    
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:top_k]
