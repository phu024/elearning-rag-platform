# 🔧 Setup Guide - E-Learning Platform with RAG AI

Complete guide for setting up and configuring the E-Learning Platform.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 4 cores
- RAM: 16GB
- Storage: 50GB free space
- OS: Linux, macOS, or Windows with WSL2

**Recommended:**
- CPU: 8+ cores  
- RAM: 32GB
- Storage: 100GB+ SSD
- GPU: Optional (improves AI performance)

### Software Requirements

1. **Docker** (20.10 or later)
2. **Docker Compose** (included with Docker Desktop)
3. **Git**

## Quick Start

### 1. Clone and Start

```bash
git clone https://github.com/phu024/elearning-rag-platform.git
cd elearning-rag-platform
docker compose up -d
```

### 2. Wait for Setup (3-5 minutes)

Monitor progress:
```bash
docker compose ps
docker compose logs -f
```

### 3. Access the Platform

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- MinIO Console: http://localhost:9001

**Default Credentials:**
- Admin: `admin@example.com` / `Admin@123`
- Learner: `learner@example.com` / `Learner@123`

## Configuration

### Change JWT Secret (Production)

```bash
# Generate secure secret
openssl rand -base64 32

# Update in docker-compose.yml
JWT_SECRET: <generated-secret>
```

### Change Ollama Model

Edit `docker-compose.yml`:
```yaml
OLLAMA_MODEL: mistral  # or llama2, codellama
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose logs backend
docker compose logs ai-service

# Restart specific service
docker compose restart backend
```

### Database Reset

```bash
docker compose down
docker volume rm elearning-rag-platform_postgres_data
docker compose up -d
```

### Out of Memory

- Reduce Ollama model size (use llama2 instead of llama3)
- Increase Docker memory limit in Docker Desktop settings

## Advanced Configuration

See [full documentation](../README.md) for:
- External database configuration
- HTTPS/SSL setup
- Production deployment
- Performance tuning

## Getting Help

- [GitHub Issues](https://github.com/phu024/elearning-rag-platform/issues)
- [Documentation](../README.md)
