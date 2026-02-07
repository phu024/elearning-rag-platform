"""Audio processing and transcription"""
import logging
from typing import List, Dict, Any
import whisper
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Whisper model instance
_whisper_model = None


def get_whisper_model(model_name: str = "base"):
    """Get or load Whisper model"""
    global _whisper_model
    if _whisper_model is None:
        logger.info(f"Loading Whisper model: {model_name}")
        _whisper_model = whisper.load_model(model_name)
    return _whisper_model


async def transcribe_audio(
    audio_path: str,
    model_name: str = None,
    include_timestamps: bool = True
) -> List[Dict[str, Any]]:
    """
    Transcribe audio file with timestamps
    
    Args:
        audio_path: Path to audio file
        model_name: Whisper model name (tiny, base, small, medium, large)
        include_timestamps: Whether to include segment timestamps
        
    Returns:
        List of segments with {text, start_time, end_time}
    """
    if model_name is None:
        model_name = settings.WHISPER_MODEL
        
    try:
        logger.info(f"Transcribing audio file: {audio_path}")
        
        model = get_whisper_model(model_name)
        
        # Transcribe audio
        result = model.transcribe(
            audio_path,
            word_timestamps=include_timestamps,
            verbose=False
        )
        
        if not include_timestamps:
            # Return full text as single segment
            return [{
                'text': result['text'].strip(),
                'metadata': {
                    'source_type': 'audio_transcription',
                    'language': result.get('language', 'unknown'),
                    'full_transcription': True
                }
            }]
        
        # Extract segments with timestamps
        segments_data = []
        for segment in result.get('segments', []):
            segments_data.append({
                'text': segment['text'].strip(),
                'start_time': segment['start'],
                'end_time': segment['end'],
                'metadata': {
                    'source_type': 'audio_transcription',
                    'duration': segment['end'] - segment['start'],
                    'language': result.get('language', 'unknown')
                }
            })
        
        logger.info(f"Transcribed {len(segments_data)} segments from audio")
        return segments_data
        
    except Exception as e:
        logger.error(f"Error transcribing audio {audio_path}: {str(e)}")
        raise Exception(f"Failed to transcribe audio: {str(e)}")
