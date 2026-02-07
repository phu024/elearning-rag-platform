from sqlalchemy import text
from typing import List, Dict, Optional
from app.core.database import engine
from app.core.embeddings import generate_embeddings
import logging
import json

logger = logging.getLogger(__name__)


async def store_embeddings(
    file_id: int,
    chunks: List[str],
    user_id: Optional[int] = None,
    course_id: Optional[int] = None,
    module_id: Optional[int] = None,
    metadata: Optional[Dict] = None
) -> int:
    """
    Store text chunks and their embeddings in the database
    
    Args:
        file_id: ID of the file
        chunks: List of text chunks
        user_id: Optional user ID for scoping
        course_id: Optional course ID for scoping
        module_id: Optional module ID for scoping
        metadata: Optional metadata dictionary
        
    Returns:
        Number of embeddings stored
    """
    try:
        # Generate embeddings for all chunks
        embeddings = generate_embeddings(chunks)
        
        # Insert into database
        with engine.connect() as conn:
            for chunk, embedding in zip(chunks, embeddings):
                embedding_str = '[' + ','.join(map(str, embedding)) + ']'
                metadata_json = json.dumps(metadata) if metadata else None
                
                conn.execute(
                    text("""
                        INSERT INTO embeddings 
                        (file_id, user_id, course_id, module_id, chunk_text, embedding, metadata)
                        VALUES (:file_id, :user_id, :course_id, :module_id, :chunk_text, :embedding::vector, :metadata::jsonb)
                    """),
                    {
                        'file_id': file_id,
                        'user_id': user_id,
                        'course_id': course_id,
                        'module_id': module_id,
                        'chunk_text': chunk,
                        'embedding': embedding_str,
                        'metadata': metadata_json
                    }
                )
            conn.commit()
        
        logger.info(f"Stored {len(chunks)} embeddings for file_id={file_id}")
        return len(chunks)
    except Exception as e:
        logger.error(f"Error storing embeddings: {str(e)}")
        raise


async def search_similar(
    query: str,
    limit: int = 5,
    user_id: Optional[int] = None,
    course_id: Optional[int] = None,
    module_id: Optional[int] = None,
    file_ids: Optional[List[int]] = None
) -> List[Dict]:
    """
    Search for similar text chunks using vector similarity
    
    Args:
        query: Query text
        limit: Maximum number of results
        user_id: Optional filter by user_id
        course_id: Optional filter by course_id
        module_id: Optional filter by module_id
        file_ids: Optional filter by list of file_ids
        
    Returns:
        List of matching chunks with metadata
    """
    try:
        # Generate query embedding
        query_embeddings = generate_embeddings([query])
        query_embedding = query_embeddings[0]
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        
        # Build WHERE clause for filtering
        where_clauses = []
        params = {
            'query_embedding': embedding_str,
            'limit': limit
        }
        
        if user_id is not None:
            where_clauses.append("user_id = :user_id")
            params['user_id'] = user_id
        
        if course_id is not None:
            where_clauses.append("course_id = :course_id")
            params['course_id'] = course_id
        
        if module_id is not None:
            where_clauses.append("module_id = :module_id")
            params['module_id'] = module_id
        
        if file_ids:
            where_clauses.append("file_id = ANY(:file_ids)")
            params['file_ids'] = file_ids
        
        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)
        
        # Execute similarity search
        with engine.connect() as conn:
            result = conn.execute(
                text(f"""
                    SELECT 
                        id,
                        file_id,
                        user_id,
                        course_id,
                        module_id,
                        chunk_text,
                        metadata,
                        1 - (embedding <=> :query_embedding::vector) as similarity
                    FROM embeddings
                    {where_sql}
                    ORDER BY embedding <=> :query_embedding::vector
                    LIMIT :limit
                """),
                params
            )
            
            results = []
            for row in result:
                results.append({
                    'id': row[0],
                    'file_id': row[1],
                    'user_id': row[2],
                    'course_id': row[3],
                    'module_id': row[4],
                    'chunk_text': row[5],
                    'metadata': row[6],
                    'similarity': float(row[7])
                })
        
        logger.info(f"Found {len(results)} similar chunks for query")
        return results
    except Exception as e:
        logger.error(f"Error searching similar embeddings: {str(e)}")
        raise


async def delete_embeddings_by_file(file_id: int) -> int:
    """
    Delete all embeddings for a specific file
    
    Args:
        file_id: ID of the file
        
    Returns:
        Number of embeddings deleted
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("DELETE FROM embeddings WHERE file_id = :file_id"),
                {'file_id': file_id}
            )
            conn.commit()
            deleted_count = result.rowcount
        
        logger.info(f"Deleted {deleted_count} embeddings for file_id={file_id}")
        return deleted_count
    except Exception as e:
        logger.error(f"Error deleting embeddings: {str(e)}")
        raise


async def delete_embeddings_by_user(user_id: int) -> int:
    """
    Delete all embeddings for a specific user
    
    Args:
        user_id: ID of the user
        
    Returns:
        Number of embeddings deleted
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("DELETE FROM embeddings WHERE user_id = :user_id"),
                {'user_id': user_id}
            )
            conn.commit()
            deleted_count = result.rowcount
        
        logger.info(f"Deleted {deleted_count} embeddings for user_id={user_id}")
        return deleted_count
    except Exception as e:
        logger.error(f"Error deleting user embeddings: {str(e)}")
        raise
