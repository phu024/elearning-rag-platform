# E-Learning AI Service

FastAPI-based AI service for the RAG (Retrieval-Augmented Generation) e-learning platform.

## Features

- **Document Processing**: Extract and chunk text from various file formats
- **Vector Embeddings**: Generate embeddings using sentence-transformers
- **Vector Search**: Similarity search using PostgreSQL with pgvector
- **RAG Chat**: Context-aware question answering using Ollama LLMs
- **Content Generation**: Summaries and quiz questions

## Tech Stack

- **FastAPI**: Web framework
- **PostgreSQL + pgvector**: Vector database
- **sentence-transformers**: Embedding generation
- **Ollama**: LLM inference
- **MinIO**: Object storage

## Installation

### Using Docker (Recommended)

```bash
docker-compose up ai-service
```

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run the service:
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Process API
- `POST /api/process/text` - Process and store text embeddings
- `DELETE /api/process/embeddings` - Delete embeddings by file_id

### Chat API
- `POST /api/chat/query` - RAG-based question answering
- `POST /api/chat/summary` - Generate text summaries
- `POST /api/chat/quiz` - Generate quiz questions

## Usage Examples

### Process Text
```python
import requests

response = requests.post("http://localhost:8000/api/process/text", json={
    "file_id": 1,
    "text_content": "Your course content here...",
    "user_id": 1,
    "course_id": 1
})
```

### Query with RAG
```python
response = requests.post("http://localhost:8000/api/chat/query", json={
    "query": "What is machine learning?",
    "course_id": 1,
    "limit": 5
})
print(response.json()["answer"])
```

## Configuration

See `.env.example` for all configuration options.

Key settings:
- `EMBEDDING_MODEL`: sentence-transformers model name
- `CHUNK_SIZE`: Text chunk size in tokens
- `OLLAMA_MODEL`: Ollama model for generation

## Development

### Project Structure
```
ai-service/
├── app/
│   ├── main.py              # FastAPI application
│   ├── api/                 # API routes
│   │   ├── process.py       # Document processing
│   │   └── chat.py          # Chat/RAG endpoints
│   ├── core/                # Core functionality
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Database setup
│   │   ├── embeddings.py    # Embedding generation
│   │   ├── vector_store.py  # Vector operations
│   │   └── llm.py           # LLM integration
│   └── processors/          # File processors
├── requirements.txt
└── Dockerfile
```

## License

MIT
