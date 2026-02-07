'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { User } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'instructor' | 'student'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getCurrentUser()
      
      if (!currentUser) {
        router.push('/login')
        return
      }

      if (requiredRole && currentUser.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (currentUser.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/learner')
        }
        return
      }

      setUser(currentUser)
      setLoading(false)
    }

    checkAuth()
  }, [router, requiredRole])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
