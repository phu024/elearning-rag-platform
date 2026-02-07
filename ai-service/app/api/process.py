from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from pydantic import BaseModel
from app.core.embeddings import chunk_text, generate_embeddings
from app.core.vector_store import store_embeddings, delete_embeddings_by_file
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/process", tags=["process"])


class ProcessRequest(BaseModel):
    file_id: int
    text_content: str
    user_id: Optional[int] = None
    course_id: Optional[int] = None
    module_id: Optional[int] = None
    metadata: Optional[dict] = None


class ProcessResponse(BaseModel):
    success: bool
    file_id: int
    chunks_processed: int
    message: str


class DeleteRequest(BaseModel):
    file_id: int


@router.post("/text", response_model=ProcessResponse)
async def process_text(request: ProcessRequest):
    """
    Process text content: chunk it and store embeddings
    """
    try:
        # Chunk the text
        chunks = chunk_text(request.text_content)
        
        # Store embeddings
        count = await store_embeddings(
            file_id=request.file_id,
            chunks=chunks,
            user_id=request.user_id,
            course_id=request.course_id,
            module_id=request.module_id,
            metadata=request.metadata
        )
        
        return ProcessResponse(
            success=True,
            file_id=request.file_id,
            chunks_processed=count,
            message=f"Successfully processed {count} chunks"
        )
    except Exception as e:
        logger.error(f"Error processing text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/embeddings", response_model=dict)
async def delete_embeddings(request: DeleteRequest):
    """
    Delete all embeddings for a specific file
    """
    try:
        count = await delete_embeddings_by_file(request.file_id)
        
        return {
            'success': True,
            'file_id': request.file_id,
            'embeddings_deleted': count,
            'message': f"Successfully deleted {count} embeddings"
        }
    except Exception as e:
        logger.error(f"Error deleting embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def process_health():
    """Health check for processing service"""
    return {'status': 'healthy', 'service': 'process'}
