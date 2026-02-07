import aiohttp
from typing import List, Dict, Optional
from app.core.config import settings
import logging
import json

logger = logging.getLogger(__name__)


async def query_ollama(
    prompt: str,
    model: str = None,
    system_prompt: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 2000
) -> str:
    """
    Send a prompt to Ollama API and get a response
    
    Args:
        prompt: User prompt
        model: Model name (default from settings)
        system_prompt: Optional system prompt
        temperature: Sampling temperature
        max_tokens: Maximum tokens to generate
        
    Returns:
        Generated text response
    """
    if model is None:
        model = settings.OLLAMA_MODEL
    
    try:
        url = f"{settings.ollama_base_url}/api/generate"
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Ollama API error: {error_text}")
                
                result = await response.json()
                return result.get('response', '')
    except Exception as e:
        logger.error(f"Error querying Ollama: {str(e)}")
        raise


async def query_ollama_with_context(
    query: str,
    context_chunks: List[Dict],
    model: str = None,
    temperature: float = 0.7
) -> Dict[str, any]:
    """
    Query Ollama with retrieved context from vector search
    
    Args:
        query: User query
        context_chunks: List of relevant chunks from vector search
        model: Model name
        temperature: Sampling temperature
        
    Returns:
        Dict with answer and sources
    """
    try:
        # Format context with sources
        context_text = format_context_with_sources(context_chunks)
        
        # Build prompt
        system_prompt = """You are a helpful AI assistant for an e-learning platform. 
Your task is to answer questions based on the provided context from course materials.
Always cite your sources by mentioning the file_id when referencing information.
If the context doesn't contain enough information to answer the question, say so clearly."""
        
        prompt = f"""Context from course materials:
{context_text}

Question: {query}

Please provide a comprehensive answer based on the context above. Include citations to the source materials (file_id) when relevant."""
        
        # Query Ollama
        answer = await query_ollama(
            prompt=prompt,
            model=model,
            system_prompt=system_prompt,
            temperature=temperature
        )
        
        # Extract unique sources
        sources = extract_sources(context_chunks)
        
        return {
            'answer': answer,
            'sources': sources,
            'context_used': len(context_chunks)
        }
    except Exception as e:
        logger.error(f"Error in query_ollama_with_context: {str(e)}")
        raise


def format_context_with_sources(chunks: List[Dict]) -> str:
    """
    Format context chunks with source information
    
    Args:
        chunks: List of context chunks with metadata
        
    Returns:
        Formatted context string
    """
    formatted = []
    for idx, chunk in enumerate(chunks, 1):
        file_id = chunk.get('file_id', 'unknown')
        text = chunk.get('chunk_text', '')
        similarity = chunk.get('similarity', 0)
        
        formatted.append(f"[Source {idx} - file_id: {file_id}, relevance: {similarity:.2f}]\n{text}\n")
    
    return "\n".join(formatted)


def extract_sources(chunks: List[Dict]) -> List[Dict]:
    """
    Extract unique sources from context chunks
    
    Args:
        chunks: List of context chunks
        
    Returns:
        List of unique source metadata
    """
    sources = {}
    for chunk in chunks:
        file_id = chunk.get('file_id')
        if file_id and file_id not in sources:
            sources[file_id] = {
                'file_id': file_id,
                'user_id': chunk.get('user_id'),
                'course_id': chunk.get('course_id'),
                'module_id': chunk.get('module_id')
            }
    
    return list(sources.values())


async def generate_summary(text: str, model: str = None) -> str:
    """
    Generate a summary of the given text
    
    Args:
        text: Text to summarize
        model: Model name
        
    Returns:
        Summary text
    """
    system_prompt = "You are a helpful assistant that creates concise summaries of educational content."
    
    prompt = f"""Please provide a comprehensive summary of the following text. 
Focus on the key concepts, main ideas, and important details.

Text to summarize:
{text}

Summary:"""
    
    return await query_ollama(
        prompt=prompt,
        model=model,
        system_prompt=system_prompt,
        temperature=0.5
    )


async def generate_quiz_questions(
    text: str,
    num_questions: int = 5,
    model: str = None
) -> List[Dict]:
    """
    Generate quiz questions from text content
    
    Args:
        text: Source text
        num_questions: Number of questions to generate
        model: Model name
        
    Returns:
        List of quiz questions with options and answers
    """
    system_prompt = "You are an expert educator creating quiz questions from educational content."
    
    prompt = f"""Based on the following educational content, generate {num_questions} multiple-choice quiz questions.
For each question, provide:
1. The question text
2. Four possible answers (A, B, C, D)
3. The correct answer
4. A brief explanation

Format your response as JSON with this structure:
[
  {{
    "question": "Question text?",
    "options": {{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}},
    "correct_answer": "A",
    "explanation": "Explanation text"
  }}
]

Content:
{text}

Quiz Questions (JSON format):"""
    
    response = await query_ollama(
        prompt=prompt,
        model=model,
        system_prompt=system_prompt,
        temperature=0.7
    )
    
    try:
        # Try to parse JSON response
        questions = json.loads(response)
        return questions
    except json.JSONDecodeError:
        logger.warning("Failed to parse quiz questions as JSON")
        return []
