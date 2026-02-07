import { useState, useEffect } from 'react'
import { api, User } from './api'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'current_user'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      const cachedUser = getCurrentUser()
      if (cachedUser) {
        setUser(cachedUser)
        setLoading(false)
        return
      }

      try {
        const currentUser = await api.getCurrentUser()
        setCurrentUser(currentUser)
        setUser(currentUser)
        setError(null)
      } catch (err) {
        console.error('Failed to load user:', err)
        setError('Failed to load user')
        removeToken()
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.login({ username, password })
      setToken(response.access_token)
      setCurrentUser(response.user)
      setUser(response.user)
      return response.user
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Login failed'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string, fullName?: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.register({ 
        username, 
        email, 
        password, 
        full_name: fullName 
      })
      setToken(response.access_token)
      setCurrentUser(response.user)
      setUser(response.user)
      return response.user
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Registration failed'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    removeToken()
    setUser(null)
    setError(null)
  }

  const refreshUser = async () => {
    try {
      const currentUser = await api.getCurrentUser()
      setCurrentUser(currentUser)
      setUser(currentUser)
      return currentUser
    } catch (err) {
      console.error('Failed to refresh user:', err)
      logout()
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  }
}
