# 🏗️ Architecture - E-Learning Platform with RAG AI

System architecture and design documentation for the E-Learning Platform.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
┌────────────────────▼────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
│  - Server-Side Rendering (SSR)                               │
│  - Client-Side Routing                                       │
│  - shadcn/ui Components                                      │
│  - Port: 3000                                                │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API (JWT Auth)
┌────────────────────▼────────────────────────────────────────┐
│                Backend (Node.js + Express)                   │
│  - Authentication & Authorization                            │
│  - Course/Lesson/User Management                             │
│  - File Upload Orchestration                                 │
│  - Progress Tracking                                         │
│  - Port: 4000                                                │
└─────┬──────────┬──────────┬──────────┬──────────────────────┘
      │          │          │          │
      │          │          │          └─────────────┐
      │          │          │                        │
┌─────▼──────┐ ┌─▼────────┐ ┌─▼────────────────┐ ┌──▼─────────┐
│ PostgreSQL │ │  MinIO   │ │      Redis       │ │ AI Service │
│ + PGVector │ │ (S3-like)│ │    (Cache)       │ │ (FastAPI)  │
│ Port: 5432 │ │Port: 9000│ │   Port: 6379     │ │ Port: 8000 │
└────────────┘ └──────────┘ └──────────────────┘ └──────┬─────┘
                                                          │
                                   ┌──────────────────────┼──────┐
                                   │                      │      │
                              ┌────▼──────┐         ┌────▼──────▼────┐
                              │  Ollama   │         │   PostgreSQL    │
                              │  (LLM)    │         │   (PGVector)    │
                              │Port: 11434│         │  Vector Search  │
                              └───────────┘         └─────────────────┘
```

## Component Details

### Frontend (Next.js 14)

**Technology Stack:**
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui component library
- Axios for API calls

**Key Features:**
- Server-Side Rendering (SSR) for better SEO
- Client-side routing for SPA experience
- JWT token management in localStorage
- Responsive design for mobile/desktop
- Protected routes with authentication

**Pages:**
- Public: Home, Login, Register
- Admin: Dashboard, Courses, Lessons, Users
- Learner: Course Catalog, Course View, Lesson Viewer, Progress

**State Management:**
- React Hooks (useState, useEffect)
- Local storage for auth tokens
- API client with axios

### Backend (Node.js + Express)

**Technology Stack:**
- Node.js 18
- Express.js
- TypeScript
- Prisma ORM
- JWT for authentication
- bcrypt for password hashing
- Multer for file uploads

**Architecture Pattern:**
- MVC (Model-View-Controller) pattern
- Controllers handle business logic
- Routes define API endpoints
- Middleware for auth, validation, error handling

**Key Services:**
```
src/
├── auth/          # Authentication (JWT, bcrypt)
├── users/         # User management
├── courses/       # Course CRUD
├── lessons/       # Lesson CRUD
├── files/         # File upload/download
├── progress/      # Progress tracking
├── chat/          # AI chat proxy
├── middleware/    # Auth, error handling, rate limiting
└── utils/         # Prisma, MinIO, Redis clients
```

**Security:**
- JWT token authentication
- bcrypt password hashing (10 rounds)
- Rate limiting (100 req/15min per IP)
- Input validation with express-validator
- CORS protection

### AI Service (Python + FastAPI)

**Technology Stack:**
- Python 3.11
- FastAPI
- LangChain
- Sentence Transformers
- OpenAI Whisper
- PyPDF2, python-docx, python-pptx
- Tesseract OCR
- FFmpeg

**Architecture:**
```
app/
├── main.py           # FastAPI app entry
├── api/              # API routes
│   ├── chat.py       # RAG chat endpoint
│   ├── process.py    # File processing
│   └── files.py      # File management
├── core/             # Core services
│   ├── embeddings.py # Embedding generation
│   ├── llm.py        # Ollama integration
│   ├── vector_store.py # PGVector storage
│   └── whisper.py    # Speech-to-text
└── processors/       # File processors
    ├── pdf_processor.py
    ├── video_processor.py
    ├── audio_processor.py
    └── image_processor.py
```

**RAG Pipeline:**
1. File uploaded → Download from MinIO
2. Extract text (PDF/DOCX/Video/Audio/Image)
3. Split into chunks (512 tokens, 50 overlap)
4. Generate embeddings (all-MiniLM-L6-v2)
5. Store in PGVector with metadata
6. Query: Generate query embedding
7. Vector similarity search (top-5, cosine similarity)
8. Build context prompt
9. Query Ollama LLM
10. Return answer with source citations

### Database Layer

**PostgreSQL Schema:**
```sql
Users ──┬── Enrollments ──── Courses ──── Lessons ──── Files
        │                                     │
        └─── Progress ────────────────────────┘
        └─── ChatHistory ─────────────────────┘
```

**PGVector Schema:**
```sql
embeddings (
  id, vector(384), content,
  course_id, lesson_id, file_id,
  page_number, timestamp_seconds,
  metadata JSONB
)
```

**Indexes:**
- IVFFlat for vector similarity (cosine)
- B-tree for filtering (course_id, lesson_id, file_id)

### Storage & Caching

**MinIO (S3-compatible):**
- Stores uploaded files
- Bucket: `elearning-files`
- Presigned URLs for secure access
- Public download policy

**Redis:**
- Session caching (future)
- API response caching (future)
- Rate limiting data

### AI/ML Components

**Ollama (LLM):**
- Model: Llama 3
- Temperature: 0.3 (factual responses)
- Max tokens: 500
- Context: RAG-retrieved chunks

**Whisper (Speech-to-Text):**
- Model: base (1GB)
- Transcribes audio/video to text
- Generates timestamps

**Sentence Transformers:**
- Model: all-MiniLM-L6-v2
- Embedding dimension: 384
- Fast, accurate for semantic search

## Data Flow

### 1. User Registration & Login

```
User → Frontend → POST /api/auth/register
                  ├─ Hash password (bcrypt)
                  ├─ Create user in DB
                  └─ Return JWT token

User → Frontend → POST /api/auth/login
                  ├─ Verify password
                  ├─ Generate JWT token
                  └─ Return token + user data
```

### 2. Course Creation (Admin)

```
Admin → Frontend → POST /api/courses
                   ├─ Validate JWT (admin role)
                   ├─ Create course in DB
                   └─ Return course object
```

### 3. File Upload & Processing

```
Admin → Frontend → POST /api/lessons/:id/files/upload
                   ├─ Upload to MinIO
                   ├─ Create file record in DB
                   └─ Trigger AI processing

Backend → AI Service → POST /api/process
                       ├─ Download from MinIO
                       ├─ Extract text
                       ├─ Generate embeddings
                       ├─ Store in PGVector
                       └─ Update status in DB
```

### 4. AI Chat Query

```
Learner → Frontend → POST /api/chat/query
                     ├─ Get user's enrolled courses
                     └─ Forward to AI Service

Backend → AI Service → POST /api/chat
                       ├─ Generate query embedding
                       ├─ Vector similarity search
                       │  └─ Filter by scope (lesson/course/global)
                       ├─ Build context from top-5 chunks
                       ├─ Query Ollama with context
                       └─ Return answer + sources

AI Service → Ollama → POST /api/generate
                      └─ Generate response

Response → Learner (with sources: filename, page, timestamp)
```

### 5. Progress Tracking

```
Learner → Frontend → POST /api/progress/lessons/:id/complete
                     ├─ Validate enrollment
                     ├─ Mark lesson complete
                     ├─ Update timestamp
                     └─ Return progress data
```

## Deployment Architecture

### Docker Compose Services

**Service Dependencies:**
```
postgres (base)
  ↓
minio, redis, ollama (infrastructure)
  ↓
minio-setup, ollama-setup (one-time setup)
  ↓
backend (depends on: postgres, redis, minio, minio-setup)
  ↓
ai-service (depends on: postgres, ollama, ollama-setup)
  ↓
frontend (depends on: backend)
```

**Health Checks:**
- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- MinIO: HTTP health endpoint
- Ollama: API tags endpoint
- Backend: HTTP `/health`
- AI Service: HTTP `/health`
- Frontend: HTTP root

**Startup Sequence:**
1. Infrastructure services start (postgres, redis, minio, ollama)
2. Wait for all to become healthy
3. Setup services run (create bucket, download model)
4. Application services start (backend, ai-service)
5. Backend runs migrations & seed
6. Frontend starts last

## Security Architecture

### Authentication & Authorization

**JWT Token Flow:**
```
Login → Generate JWT (HS256, secret)
       ├─ Payload: { userId, email, role }
       ├─ Expiry: 7 days
       └─ Signed with JWT_SECRET

Protected Request → Verify JWT
                   ├─ Check signature
                   ├─ Check expiry
                   ├─ Extract user info
                   └─ Authorize based on role
```

**Role-Based Access Control (RBAC):**
- ADMIN: Full access to all endpoints
- LEARNER: Access to enrolled courses only

### Data Security

**Passwords:**
- bcrypt hashing (10 rounds)
- Salt per password
- Never stored in plaintext

**File Access:**
- MinIO presigned URLs (24h expiry)
- Per-request authorization
- Bucket-level access control

**Database:**
- Prepared statements (Prisma)
- No raw SQL injection risk
- Connection pooling

**API Security:**
- Rate limiting (100 req/15min)
- CORS protection
- Input validation
- Error message sanitization

## Scalability Considerations

### Horizontal Scaling

**Frontend:**
- Stateless, can scale infinitely
- Load balancer → Multiple instances

**Backend:**
- Stateless (JWT, no sessions)
- Multiple instances behind load balancer
- Shared Redis for rate limiting

**AI Service:**
- CPU/GPU intensive
- Scale based on processing load
- Queue system for async processing (future)

**Database:**
- Read replicas for scaling reads
- PgBouncer for connection pooling
- Partition large tables

### Performance Optimization

**Caching Strategy:**
- Redis for API responses
- Browser caching for static assets
- CDN for media files (future)

**Database Optimization:**
- Indexes on all foreign keys
- IVFFlat for vector search
- Query optimization with Prisma

**File Processing:**
- Async processing (webhooks)
- Batch processing for multiple files
- GPU acceleration for Whisper

## Monitoring & Observability

**Logging:**
- Structured logs (JSON)
- Log levels: DEBUG, INFO, WARN, ERROR
- Centralized logging (future: ELK stack)

**Metrics:**
- API response times
- Database query performance
- File processing duration
- Ollama inference time

**Health Checks:**
- All services expose `/health` endpoint
- Docker health checks
- Monitoring with Prometheus (future)

## Disaster Recovery

**Backup Strategy:**
- Daily PostgreSQL backups
- MinIO bucket versioning
- Ollama model volume backup
- Configuration backup

**Recovery Process:**
1. Restore PostgreSQL from backup
2. Restore MinIO data
3. Restore Ollama models
4. Restart services

## Future Enhancements

**Planned Features:**
- Real-time collaboration
- Video streaming (HLS)
- Multi-language support
- Quiz/Assignment system
- Certificate generation
- Analytics dashboard
- Mobile app (React Native)

**Technical Improvements:**
- Message queue (RabbitMQ/Redis)
- Kubernetes deployment
- CI/CD pipeline
- Automated testing
- Performance monitoring
- A/B testing framework

---

For more details, see:
- [Setup Guide](SETUP.md)
- [API Documentation](API.md)
- [README](../README.md)
