from sentence_transformers import SentenceTransformer
from typing import List, Tuple
from app.core.config import settings
import logging
import torch

logger = logging.getLogger(__name__)

# Global model instance
_model = None


def get_embedding_model() -> SentenceTransformer:
    """Get or initialize the embedding model"""
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        if torch.cuda.is_available():
            _model = _model.to('cuda')
            logger.info("Using CUDA for embeddings")
        else:
            logger.info("Using CPU for embeddings")
    return _model


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of texts
    
    Args:
        texts: List of text strings to embed
        
    Returns:
        List of embedding vectors
    """
    try:
        model = get_embedding_model()
        embeddings = model.encode(texts, convert_to_tensor=False, show_progress_bar=False)
        return embeddings.tolist()
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}")
        raise


def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> List[str]:
    """
    Split text into chunks with overlap
    
    Args:
        text: Text to chunk
        chunk_size: Maximum tokens per chunk (default from settings)
        overlap: Number of overlapping tokens (default from settings)
        
    Returns:
        List of text chunks
    """
    if chunk_size is None:
        chunk_size = settings.CHUNK_SIZE
    if overlap is None:
        overlap = settings.CHUNK_OVERLAP
    
    # Simple word-based chunking (approximate tokens)
    words = text.split()
    chunks = []
    
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunks.append(' '.join(chunk_words))
        i += chunk_size - overlap
        
        if i >= len(words):
            break
    
    return chunks if chunks else [text]


def chunk_text_with_metadata(
    text: str, 
    chunk_size: int = None, 
    overlap: int = None
) -> List[Tuple[str, dict]]:
    """
    Split text into chunks with position metadata
    
    Args:
        text: Text to chunk
        chunk_size: Maximum tokens per chunk
        overlap: Number of overlapping tokens
        
    Returns:
        List of tuples (chunk_text, metadata)
    """
    chunks = chunk_text(text, chunk_size, overlap)
    
    result = []
    for idx, chunk in enumerate(chunks):
        metadata = {
            'chunk_index': idx,
            'total_chunks': len(chunks),
            'chunk_size': len(chunk.split())
        }
        result.append((chunk, metadata))
    
    return result
