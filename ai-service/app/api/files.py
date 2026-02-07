"""File processing API endpoints"""
import logging
import os
import tempfile
from typing import Optional
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from minio import Minio
from minio.error import S3Error

from app.core.config import settings
from app.core.embeddings import chunk_text
from app.core.vector_store import store_embeddings
from app.processors import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_pptx,
    extract_text_from_txt,
    extract_text_from_xlsx,
    process_video,
    transcribe_audio,
    extract_text_from_image,
)
import aiohttp

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["files"])


# Request/Response models
class ProcessFileRequest(BaseModel):
    file_id: int
    file_name: str
    minio_path: str
    file_type: str
    user_id: Optional[int] = None
    course_id: Optional[int] = None
    module_id: Optional[int] = None
    callback_url: Optional[str] = None


class ProcessFileResponse(BaseModel):
    success: bool
    message: str
    file_id: int
    chunks_processed: int
    embeddings_created: int


# MinIO client
def get_minio_client() -> Minio:
    """Get MinIO client instance"""
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_USE_SSL
    )


async def download_file_from_minio(minio_path: str, local_path: str) -> None:
    """
    Download file from MinIO to local path
    
    Args:
        minio_path: Path in MinIO bucket
        local_path: Local file path to save
    """
    try:
        client = get_minio_client()
        client.fget_object(settings.MINIO_BUCKET, minio_path, local_path)
        logger.info(f"Downloaded file from MinIO: {minio_path} -> {local_path}")
    except S3Error as e:
        logger.error(f"MinIO error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download file from storage: {str(e)}")
    except Exception as e:
        logger.error(f"Error downloading file from MinIO: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")


async def update_file_status(callback_url: str, file_id: int, status: str, error: Optional[str] = None) -> None:
    """
    Send callback to update file processing status
    
    Args:
        callback_url: Backend callback URL
        file_id: File ID
        status: Processing status
        error: Optional error message
    """
    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "file_id": file_id,
                "status": status,
                "error": error
            }
            async with session.post(callback_url, json=payload) as response:
                if response.status == 200:
                    logger.info(f"Successfully updated file status for file_id={file_id}")
                else:
                    logger.warning(f"Failed to update file status: {response.status}")
    except Exception as e:
        logger.error(f"Error sending callback to {callback_url}: {str(e)}")


async def process_file_content(file_path: str, file_type: str) -> list:
    """
    Route file to appropriate processor based on file type
    
    Args:
        file_path: Local file path
        file_type: File extension/type
        
    Returns:
        List of extracted content dicts
    """
    file_type = file_type.lower().lstrip('.')
    
    # Document processors
    if file_type == 'pdf':
        return await extract_text_from_pdf(file_path)
    elif file_type in ['doc', 'docx']:
        return await extract_text_from_docx(file_path)
    elif file_type in ['ppt', 'pptx']:
        return await extract_text_from_pptx(file_path)
    elif file_type == 'txt':
        return await extract_text_from_txt(file_path)
    elif file_type in ['xls', 'xlsx']:
        return await extract_text_from_xlsx(file_path)
    
    # Video processors
    elif file_type in ['mp4', 'avi', 'mov', 'mkv', 'webm']:
        return await process_video(file_path)
    
    # Audio processors
    elif file_type in ['mp3', 'wav', 'm4a', 'flac', 'ogg']:
        return await transcribe_audio(file_path)
    
    # Image processors
    elif file_type in ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif']:
        return await extract_text_from_image(file_path)
    
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_type}")


@router.post("/process-file", response_model=ProcessFileResponse)
async def process_file(request: ProcessFileRequest):
    """
    Process uploaded file: download from MinIO, extract text, generate embeddings
    
    Args:
        request: File processing request
        
    Returns:
        Processing result with success status and metrics
    """
    logger.info(f"Processing file request: file_id={request.file_id}, type={request.file_type}")
    
    temp_file_path = None
    
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{request.file_type}") as tmp_file:
            temp_file_path = tmp_file.name
        
        # Download file from MinIO
        await download_file_from_minio(request.minio_path, temp_file_path)
        
        # Update status to processing
        if request.callback_url:
            await update_file_status(request.callback_url, request.file_id, "processing")
        
        # Process file content based on type
        extracted_data = await process_file_content(temp_file_path, request.file_type)
        
        if not extracted_data:
            raise HTTPException(status_code=400, detail="No content extracted from file")
        
        # Combine all text from extracted data
        all_text = []
        for item in extracted_data:
            text = item.get('text', '')
            if text:
                # Add metadata to text for better context
                metadata_str = ""
                if 'page_number' in item:
                    metadata_str = f"[Page {item['page_number']}] "
                elif 'slide_number' in item:
                    metadata_str = f"[Slide {item['slide_number']}] "
                elif 'start_time' in item:
                    metadata_str = f"[{item['start_time']:.1f}s - {item['end_time']:.1f}s] "
                
                all_text.append(metadata_str + text)
        
        combined_text = '\n\n'.join(all_text)
        
        # Chunk text for embeddings
        chunks = chunk_text(combined_text)
        logger.info(f"Created {len(chunks)} chunks from extracted text")
        
        # Generate and store embeddings
        embeddings_count = await store_embeddings(
            file_id=request.file_id,
            chunks=chunks,
            user_id=request.user_id,
            course_id=request.course_id,
            module_id=request.module_id,
            metadata={
                'file_name': request.file_name,
                'file_type': request.file_type,
                'total_segments': len(extracted_data)
            }
        )
        
        # Update status to completed
        if request.callback_url:
            await update_file_status(request.callback_url, request.file_id, "completed")
        
        logger.info(f"Successfully processed file_id={request.file_id}: {len(chunks)} chunks, {embeddings_count} embeddings")
        
        return ProcessFileResponse(
            success=True,
            message="File processed successfully",
            file_id=request.file_id,
            chunks_processed=len(chunks),
            embeddings_created=embeddings_count
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        if request.callback_url:
            await update_file_status(request.callback_url, request.file_id, "failed", "Processing failed")
        raise
    except Exception as e:
        logger.error(f"Error processing file {request.file_id}: {str(e)}", exc_info=True)
        if request.callback_url:
            await update_file_status(request.callback_url, request.file_id, "failed", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
    finally:
        # Cleanup temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.debug(f"Cleaned up temporary file: {temp_file_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temporary file: {str(e)}")


@router.get("/health")
async def files_health_check():
    """Health check for file processing service"""
    return {
        "status": "healthy",
        "service": "file-processor",
        "supported_types": [
            "pdf", "docx", "pptx", "xlsx", "txt",
            "mp4", "mp3", "jpg", "png"
        ]
    }
