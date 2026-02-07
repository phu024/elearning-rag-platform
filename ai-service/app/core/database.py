from sqlalchemy import create_engine, text, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.database_url,
    poolclass=NullPool,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    """Initialize database with pgvector extension and embeddings table"""
    try:
        with engine.connect() as conn:
            # Enable pgvector extension
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
            
            # Create embeddings table
            conn.execute(text(f"""
                CREATE TABLE IF NOT EXISTS embeddings (
                    id SERIAL PRIMARY KEY,
                    file_id INTEGER NOT NULL,
                    user_id INTEGER,
                    course_id INTEGER,
                    module_id INTEGER,
                    chunk_text TEXT NOT NULL,
                    embedding vector({settings.EMBEDDING_DIMENSION}) NOT NULL,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            
            # Create index for vector similarity search
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS embeddings_vector_idx 
                ON embeddings USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100)
            """))
            conn.commit()
            
            # Create indexes for filtering
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS embeddings_file_id_idx ON embeddings(file_id)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS embeddings_user_id_idx ON embeddings(user_id)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS embeddings_course_id_idx ON embeddings(course_id)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS embeddings_module_id_idx ON embeddings(module_id)
            """))
            conn.commit()
            
            logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
