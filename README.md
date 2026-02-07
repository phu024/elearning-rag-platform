# 🎓 E-Learning Platform with RAG AI

A complete, production-ready self-hosted e-learning platform with advanced RAG (Retrieval-Augmented Generation) AI capabilities. Deploy with a single command!

## 🚀 Quick Start

Get started in 3 simple steps:

```bash
# 1. Clone the repository
git clone https://github.com/phu024/elearning-rag-platform.git
cd elearning-rag-platform

# 2. Start all services with Docker Compose
docker compose up -d

# 3. Wait 3-5 minutes for setup, then access:
```

**Access the Platform:**
- 🌐 **Frontend:** http://localhost:3000
- 🔧 **Backend API:** http://localhost:4000
- 🤖 **AI Service:** http://localhost:8000
- 📦 **MinIO Console:** http://localhost:9001

**Default Credentials:**
- **Admin:** `admin@example.com` / `Admin@123`
- **Learner:** `learner@example.com` / `Learner@123`

## ✨ Features

### 🎓 Complete Learning Management System
- **Course Management:** Create, edit, and publish courses
- **Lesson Management:** Organize content with multiple lessons per course
- **User Management:** Admin panel for managing users and roles
- **Progress Tracking:** Track learner progress and completion status
- **Enrollment System:** Easy course enrollment for learners

### 🤖 AI-Powered Learning Assistant
- **RAG-based Chatbot:** Intelligent question answering from course content
- **3 Scope Levels:**
  - 🎯 **Lesson Scope:** Ask questions about current lesson only
  - 📚 **Course Scope:** Search across entire course
  - 🌐 **Global Scope:** Query all enrolled courses
- **Source Citations:** View exact sources with page numbers and timestamps
- **Real-time Responses:** Powered by Ollama (Llama 3)

### 📚 Multi-Format Content Support
- **Documents:** PDF, DOCX, TXT, MD, PPTX, XLSX
- **Videos:** MP4, AVI, MKV, MOV, WebM (with AI transcription)
- **Audio:** MP3, WAV, M4A, OGG (with AI transcription)
- **Images:** JPG, PNG, WebP, GIF (with OCR)

### 🔍 Advanced Features
- **Vector Search:** Semantic search using PGVector
- **File Processing:** Automatic text extraction and embedding generation
- **Whisper Integration:** Speech-to-text for video/audio
- **Multi-format Viewers:** Built-in PDF, video, audio, and image viewers

## 🏗️ Technology Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- JWT Authentication
- MinIO for file storage

### AI Service
- Python + FastAPI
- LangChain
- Ollama (Llama 3)
- OpenAI Whisper
- Sentence Transformers
- Tesseract OCR

### Infrastructure
- PostgreSQL 16 + PGVector
- Redis (caching)
- MinIO (S3-compatible storage)
- Docker Compose

## 📖 Documentation

- **[SETUP.md](docs/SETUP.md)** - Detailed setup and configuration guide
- **[API.md](docs/API.md)** - Complete API documentation
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design

## 🔧 System Requirements

### Minimum Requirements
- **CPU:** 4 cores
- **RAM:** 16GB (for Ollama models)
- **Storage:** 50GB free space
- **Docker:** 20.10+ with Docker Compose
- **OS:** Linux, macOS, or Windows with WSL2

### Recommended Requirements
- **CPU:** 8+ cores
- **RAM:** 32GB
- **Storage:** 100GB+ SSD
- **GPU:** Optional but improves AI performance

## 🐳 Docker Services

The platform runs 8 services:
1. **frontend** - Next.js application (Port 3000)
2. **backend** - Express API (Port 4000)
3. **ai-service** - FastAPI AI service (Port 8000)
4. **postgres** - PostgreSQL + PGVector (Port 5432)
5. **minio** - Object storage (Ports 9000, 9001)
6. **ollama** - LLM service (Port 11434)
7. **redis** - Cache (Port 6379)
8. **Setup services** - Auto-configure MinIO bucket and Ollama model

## 🛠️ Development

### Running in Development Mode

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# AI Service
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Environment Variables

Copy `.env.example` to `.env` and configure:
- Database credentials
- JWT secret
- MinIO credentials
- Ollama configuration

## 🔒 Security Notes

⚠️ **Important:** The default configuration uses development credentials. For production:

1. Change `JWT_SECRET` to a strong random value
2. Update MinIO credentials
3. Change PostgreSQL password
4. Enable HTTPS/TLS
5. Configure firewall rules

Generate secure JWT secret:
```bash
openssl rand -base64 32
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 💬 Support

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/phu024/elearning-rag-platform/issues)
- 💡 [Feature Requests](https://github.com/phu024/elearning-rag-platform/issues/new)

## ⭐ Star History

If you find this project useful, please consider giving it a star!

---

**Made with ❤️ for education and open-source AI**

*Last Updated: February 7, 2026*