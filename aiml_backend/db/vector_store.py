try:
    import chromadb
except ImportError:
    chromadb = None
    
from typing import List, Dict, Optional, Any

from config import CHROMA_PERSIST_DIR


def get_chroma_client() -> Any:
    """
    Get a persistent ChromaDB client.
    """
    return chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)


def get_content_collection() -> Any:
    """
    Get or create the collection for content embeddings.
    """
    client = get_chroma_client()
    return client.get_or_create_collection(
        name="content_embeddings",
        metadata={"hnsw:space": "cosine"}
    )


def get_skill_collection() -> Any:
    """
    Get or create the collection for skill embeddings.
    """
    client = get_chroma_client()
    return client.get_or_create_collection(
        name="skill_embeddings",
        metadata={"hnsw:space": "cosine"}
    )


def add_content_embedding(content_id: str, embedding: List[float], metadata: Optional[Dict[str, Any]] = None):
    """
    Add a new content embedding to ChromaDB.
    """
    collection = get_content_collection()
    collection.add(
        ids=[content_id],
        embeddings=[embedding],
        metadatas=[metadata] if metadata else None
    )


def search_similar_content(query_embedding: List[float], n_results: int = 10, where_filter: Optional[Dict[str, Any]] = None):
    """
    Search for similar content embeddings in ChromaDB.
    """
    collection = get_content_collection()
    return collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=where_filter
    )


def add_skill_embedding(skill_name: str, embedding: List[float]):
    """
    Add a new skill embedding to ChromaDB.
    """
    collection = get_skill_collection()
    collection.add(
        ids=[skill_name],
        embeddings=[embedding]
    )


def init_skill_embeddings(skill_embeddings_dict: Dict[str, List[float]]):
    """
    Bulk initialize skill embeddings.
    """
    collection = get_skill_collection()
    ids = list(skill_embeddings_dict.keys())
    embeddings = list(skill_embeddings_dict.values())
    
    if ids and embeddings:
        collection.add(
            ids=ids,
            embeddings=embeddings
        )


async def init_vector_store():
    """
    Initialize ChromaDB collections at application startup.
    Called by main.py during the lifespan startup event.
    Ensures both content and skill collections exist.
    """
    try:
        get_content_collection()
        get_skill_collection()
    except Exception as e:
        print(f"⚠️ Warning: ChromaDB initialization failed: {e}")
        print("  The application will continue, but vector search may not work.")
