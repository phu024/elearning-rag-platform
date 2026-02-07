'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LearnerDashboard() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/learner/courses')
  }, [router])

  return null
}
