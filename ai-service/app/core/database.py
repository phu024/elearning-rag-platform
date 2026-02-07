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
            # The pgvector extension and embeddings table should already be created
            # by init-db.sql, but we'll check and create if needed
            
            # Enable pgvector extension (idempotent)
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
            
            # Check if embeddings table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'embeddings'
                );
            """))
            table_exists = result.scalar()
            
            if not table_exists:
                # Create embeddings table matching init-db.sql schema
                conn.execute(text(f"""
                    CREATE TABLE embeddings (
                        id SERIAL PRIMARY KEY,
                        vector vector({settings.EMBEDDING_DIMENSION}),
                        content TEXT NOT NULL,
                        course_id INTEGER,
                        lesson_id INTEGER,
                        file_id INTEGER,
                        file_type VARCHAR(50),
                        page_number INTEGER,
                        timestamp_seconds FLOAT,
                        metadata JSONB,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                """))
                conn.commit()
                
                # Create indexes
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS embeddings_vector_idx 
                    ON embeddings USING ivfflat (vector vector_cosine_ops)
                    WITH (lists = 100)
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS embeddings_course_id_idx ON embeddings(course_id)
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS embeddings_lesson_id_idx ON embeddings(lesson_id)
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS embeddings_file_id_idx ON embeddings(file_id)
                """))
                conn.commit()
                logger.info("Embeddings table created successfully")
            else:
                logger.info("Embeddings table already exists")
            
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
