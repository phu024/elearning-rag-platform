import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export interface User {
  id: number
  username: string
  email: string
  role: 'student' | 'instructor' | 'admin'
  full_name?: string
  created_at: string
}

export interface Course {
  id: number
  title: string
  description: string
  instructor_id: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: number
  course_id: number
  title: string
  content: string
  order: number
  created_at: string
}

export interface File {
  id: number
  lesson_id: number
  filename: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_at: string
}

export interface ChatMessage {
  id: number
  user_id: number
  course_id: number
  message: string
  response: string
  created_at: string
}

export interface Progress {
  id: number
  user_id: number
  lesson_id: number
  completed: boolean
  completed_at?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  full_name?: string
  role?: 'student' | 'instructor'
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ChatRequest {
  message: string
  course_id: number
}

export interface ChatResponse {
  response: string
  sources?: Array<{
    lesson_title: string
    content: string
    relevance_score: number
  }>
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('current_user')
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<AuthResponse> {
    const formData = new URLSearchParams()
    formData.append('username', data.username)
    formData.append('password', data.password)
    
    const response = await this.client.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data)
    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me')
    return response.data
  }

  // User endpoints
  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users')
    return response.data
  }

  async getUser(id: number): Promise<User> {
    const response = await this.client.get<User>(`/users/${id}`)
    return response.data
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await this.client.put<User>(`/users/${id}`, data)
    return response.data
  }

  async deleteUser(id: number): Promise<void> {
    await this.client.delete(`/users/${id}`)
  }

  // Course endpoints
  async getCourses(): Promise<Course[]> {
    const response = await this.client.get<Course[]>('/courses')
    return response.data
  }

  async getCourse(id: number): Promise<Course> {
    const response = await this.client.get<Course>(`/courses/${id}`)
    return response.data
  }

  async createCourse(data: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    const response = await this.client.post<Course>('/courses', data)
    return response.data
  }

  async updateCourse(id: number, data: Partial<Course>): Promise<Course> {
    const response = await this.client.put<Course>(`/courses/${id}`, data)
    return response.data
  }

  async deleteCourse(id: number): Promise<void> {
    await this.client.delete(`/courses/${id}`)
  }

  // Lesson endpoints
  async getLessons(courseId: number): Promise<Lesson[]> {
    const response = await this.client.get<Lesson[]>(`/courses/${courseId}/lessons`)
    return response.data
  }

  async getLesson(id: number): Promise<Lesson> {
    const response = await this.client.get<Lesson>(`/lessons/${id}`)
    return response.data
  }

  async createLesson(data: Omit<Lesson, 'id' | 'created_at'>): Promise<Lesson> {
    const response = await this.client.post<Lesson>('/lessons', data)
    return response.data
  }

  async updateLesson(id: number, data: Partial<Lesson>): Promise<Lesson> {
    const response = await this.client.put<Lesson>(`/lessons/${id}`, data)
    return response.data
  }

  async deleteLesson(id: number): Promise<void> {
    await this.client.delete(`/lessons/${id}`)
  }

  // File endpoints
  async getFiles(lessonId: number): Promise<File[]> {
    const response = await this.client.get<File[]>(`/lessons/${lessonId}/files`)
    return response.data
  }

  async uploadFile(lessonId: number, file: globalThis.File): Promise<File> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await this.client.post<File>(`/lessons/${lessonId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async deleteFile(id: number): Promise<void> {
    await this.client.delete(`/files/${id}`)
  }

  // Chat endpoints
  async sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.post<ChatResponse>('/chat', data)
    return response.data
  }

  async getChatHistory(courseId: number): Promise<ChatMessage[]> {
    const response = await this.client.get<ChatMessage[]>(`/chat/history/${courseId}`)
    return response.data
  }

  // Progress endpoints
  async getProgress(userId: number, courseId: number): Promise<Progress[]> {
    const response = await this.client.get<Progress[]>(`/progress/${userId}/${courseId}`)
    return response.data
  }

  async markLessonComplete(lessonId: number): Promise<Progress> {
    const response = await this.client.post<Progress>(`/progress/${lessonId}/complete`)
    return response.data
  }

  async markLessonIncomplete(lessonId: number): Promise<void> {
    await this.client.delete(`/progress/${lessonId}`)
  }
}

export const api = new ApiClient()
