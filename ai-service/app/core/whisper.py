"""Shared Whisper model management"""
import logging
import threading
import whisper
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Whisper model instance
_whisper_model = None
_model_lock = threading.Lock()


def get_whisper_model(model_name: str = None):
    """
    Get or load Whisper model (thread-safe)
    
    Args:
        model_name: Whisper model name (tiny, base, small, medium, large)
        
    Returns:
        Loaded Whisper model
    """
    global _whisper_model
    
    if model_name is None:
        model_name = settings.WHISPER_MODEL
    
    with _model_lock:
        if _whisper_model is None:
            logger.info(f"Loading Whisper model: {model_name}")
            _whisper_model = whisper.load_model(model_name)
            logger.info("Whisper model loaded successfully")
        return _whisper_model
