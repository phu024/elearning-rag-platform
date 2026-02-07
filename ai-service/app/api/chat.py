from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from app.core.vector_store import search_similar
from app.core.llm import query_ollama_with_context, generate_summary, generate_quiz_questions
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    query: str
    user_id: Optional[int] = None
    course_id: Optional[int] = None
    module_id: Optional[int] = None
    file_ids: Optional[List[int]] = None
    limit: int = 5
    temperature: float = 0.7


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]
    context_used: int


class SummaryRequest(BaseModel):
    text: str


class SummaryResponse(BaseModel):
    summary: str


class QuizRequest(BaseModel):
    text: str
    num_questions: int = 5


class QuizResponse(BaseModel):
    questions: List[dict]


@router.post("/query", response_model=ChatResponse)
async def chat_query(request: ChatRequest):
    """
    Process a chat query with RAG (Retrieval-Augmented Generation)
    """
    try:
        # Search for similar content
        context_chunks = await search_similar(
            query=request.query,
            limit=request.limit,
            user_id=request.user_id,
            course_id=request.course_id,
            module_id=request.module_id,
            file_ids=request.file_ids
        )
        
        if not context_chunks:
            return ChatResponse(
                answer="I couldn't find any relevant information in the course materials to answer your question.",
                sources=[],
                context_used=0
            )
        
        # Generate answer with context
        result = await query_ollama_with_context(
            query=request.query,
            context_chunks=context_chunks,
            temperature=request.temperature
        )
        
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"Error processing chat query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summary", response_model=SummaryResponse)
async def create_summary(request: SummaryRequest):
    """
    Generate a summary of the provided text
    """
    try:
        summary = await generate_summary(request.text)
        return SummaryResponse(summary=summary)
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quiz", response_model=QuizResponse)
async def create_quiz(request: QuizRequest):
    """
    Generate quiz questions from the provided text
    """
    try:
        questions = await generate_quiz_questions(
            text=request.text,
            num_questions=request.num_questions
        )
        return QuizResponse(questions=questions)
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def chat_health():
    """Health check for chat service"""
    return {'status': 'healthy', 'service': 'chat'}
