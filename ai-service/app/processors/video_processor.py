"""Video processing with audio extraction and transcription"""
import logging
from typing import List, Dict, Any
from pathlib import Path
import ffmpeg
import os
import tempfile
from app.core.config import settings
from app.core.whisper import get_whisper_model

logger = logging.getLogger(__name__)


async def extract_audio_from_video(video_path: str, output_audio_path: str = None) -> str:
    """
    Extract audio from video file using ffmpeg
    
    Args:
        video_path: Path to video file
        output_audio_path: Optional output path for audio file
        
    Returns:
        Path to extracted audio file
    """
    try:
        if output_audio_path is None:
            # Create temporary file for audio
            temp_dir = tempfile.gettempdir()
            output_audio_path = os.path.join(temp_dir, f"audio_{Path(video_path).stem}.wav")
        
        logger.info(f"Extracting audio from video: {video_path}")
        
        # Extract audio using ffmpeg
        stream = ffmpeg.input(video_path)
        stream = ffmpeg.output(stream, output_audio_path, acodec='pcm_s16le', ac=1, ar='16k')
        ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)
        
        logger.info(f"Audio extracted to: {output_audio_path}")
        return output_audio_path
        
    except ffmpeg.Error as e:
        error_msg = e.stderr.decode() if e.stderr else str(e)
        logger.error(f"FFmpeg error extracting audio: {error_msg}")
        raise Exception(f"Failed to extract audio: {error_msg}")
    except Exception as e:
        logger.error(f"Error extracting audio from video {video_path}: {str(e)}")
        raise Exception(f"Failed to extract audio: {str(e)}")


async def transcribe_audio_with_timestamps(
    audio_path: str,
    model_name: str = None,
    word_timestamps: bool = True
) -> List[Dict[str, Any]]:
    """
    Transcribe audio file with timestamps using Whisper
    
    Args:
        audio_path: Path to audio file
        model_name: Whisper model name (tiny, base, small, medium, large)
        word_timestamps: Whether to include word-level timestamps
        
    Returns:
        List of segments with {text, start_time, end_time}
    """
    if model_name is None:
        model_name = settings.WHISPER_MODEL
        
    try:
        logger.info(f"Transcribing audio: {audio_path}")
        
        model = get_whisper_model(model_name)
        
        # Transcribe with word timestamps
        result = model.transcribe(
            audio_path,
            word_timestamps=word_timestamps,
            verbose=False
        )
        
        segments_data = []
        
        # Extract segments with timestamps
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


async def process_video(
    video_path: str,
    model_name: str = None,
    cleanup_audio: bool = True
) -> List[Dict[str, Any]]:
    """
    Complete video processing pipeline: extract audio + transcribe
    
    Args:
        video_path: Path to video file
        model_name: Whisper model name
        cleanup_audio: Whether to delete temporary audio file
        
    Returns:
        List of transcription segments with timestamps
    """
    if model_name is None:
        model_name = settings.WHISPER_MODEL
        
    try:
        logger.info(f"Processing video: {video_path}")
        
        # Step 1: Extract audio
        audio_path = await extract_audio_from_video(video_path)
        
        try:
            # Step 2: Transcribe audio
            segments = await transcribe_audio_with_timestamps(audio_path, model_name)
            
            return segments
        finally:
            # Cleanup temporary audio file
            if cleanup_audio and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                    logger.debug(f"Cleaned up temporary audio file: {audio_path}")
                except Exception as e:
                    logger.warning(f"Failed to cleanup audio file: {str(e)}")
        
    except Exception as e:
        logger.error(f"Error processing video {video_path}: {str(e)}")
        raise Exception(f"Failed to process video: {str(e)}")
