# 📚 API Documentation

Complete API reference for the E-Learning Platform backend.

**Base URL:** `http://localhost:4000/api`

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

Get token from login endpoint.

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "fullName": "John Doe"
}

Response: { token, user }
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}

Response: { token, user }
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>

Response: { user }
```

### Courses

#### List All Courses
```http
GET /courses
Response: { courses: [...] }
```

#### Get Course by ID
```http
GET /courses/:id
Response: { course }
```

#### Create Course (Admin)
```http
POST /courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Course Title",
  "description": "Description",
  "thumbnailUrl": "optional",
  "isPublished": true
}

Response: { course }
```

#### Enroll in Course
```http
POST /courses/:id/enroll
Authorization: Bearer <token>

Response: { enrollment }
```

### Lessons

#### Get Lessons by Course
```http
GET /courses/:courseId/lessons
Response: { lessons: [...] }
```

#### Get Lesson by ID
```http
GET /lessons/:id
Response: { lesson }
```

#### Create Lesson (Admin)
```http
POST /lessons
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1,
  "title": "Lesson Title",
  "description": "Description",
  "order": 1,
  "contentText": "Markdown content"
}

Response: { lesson }
```

### Files

#### Upload File (Admin)
```http
POST /lessons/:lessonId/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>

Response: { file }
```

#### Get File Info
```http
GET /files/:id
Response: { file }
```

#### Download File
```http
GET /files/:id/download
Response: <file binary>
```

### Progress

#### Get My Progress
```http
GET /progress/me
Authorization: Bearer <token>

Response: { progress: [...] }
```

#### Mark Lesson Complete
```http
POST /progress/lessons/:lessonId/complete
Authorization: Bearer <token>

Response: { progress }
```

### Chat (AI)

#### Query AI Chatbot
```http
POST /chat/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "What is a decorator?",
  "scope": "lesson",  // "lesson" | "course" | "global"
  "lessonId": 1,
  "courseId": 1
}

Response: {
  "answer": "A decorator is...",
  "sources": [
    {
      "file_id": 123,
      "filename": "notes.pdf",
      "page_number": 5,
      "content": "excerpt..."
    }
  ]
}
```

### Users (Admin)

#### List All Users
```http
GET /users
Authorization: Bearer <token>

Response: { users: [...] }
```

#### Create User (Admin)
```http
POST /users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "fullName": "John Doe",
  "role": "LEARNER"  // "ADMIN" | "LEARNER"
}

Response: { user }
```

## Error Responses

All endpoints return errors in format:
```json
{
  "error": "Error message",
  "details": "Optional details"
}
```

Common status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Applies to all endpoints

## File Types Supported

- Documents: PDF, DOCX, TXT, MD, PPTX, XLSX
- Videos: MP4, AVI, MKV, MOV, WebM
- Audio: MP3, WAV, M4A, OGG
- Images: JPG, PNG, WebP, GIF
