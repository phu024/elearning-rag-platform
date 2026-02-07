from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database - support DATABASE_URL or individual components
    DATABASE_URL: Optional[str] = None
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres123"
    POSTGRES_DB: str = "elearning"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    
    # MinIO
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET: str = "elearning-files"
    MINIO_USE_SSL: bool = False
    
    # Ollama - support both formats: "http://ollama:11434" or "ollama"
    OLLAMA_HOST: str = "http://ollama:11434"
    OLLAMA_MODEL: str = "llama3"
    
    # AI Service
    AI_SERVICE_HOST: str = "0.0.0.0"
    AI_SERVICE_PORT: int = 8000
    
    # Embeddings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50
    
    # Whisper (audio/video transcription)
    WHISPER_MODEL: str = "base"  # tiny, base, small, medium, large
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:4000", "http://localhost:8000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def database_url(self) -> str:
        """Get database URL from DATABASE_URL env var or construct from components"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def ollama_base_url(self) -> str:
        """Get Ollama base URL, handling both full URL and hostname formats"""
        if self.OLLAMA_HOST.startswith('http://') or self.OLLAMA_HOST.startswith('https://'):
            return self.OLLAMA_HOST
        return f"http://{self.OLLAMA_HOST}:11434"


settings = Settings()
