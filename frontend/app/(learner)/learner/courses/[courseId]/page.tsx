/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/lib/use-toast'
import { api, Course, Lesson, Progress } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import axios from 'axios'
import { getToken } from '@/lib/auth'

export default function LearnerCourseViewPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = parseInt(params.courseId as string)
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const currentUser = getCurrentUser()

  useEffect(() => {
    loadCourse()
    loadLessons()
    loadProgress()
  }, [courseId])

  const loadCourse = async () => {
    try {
      const data = await api.getCourse(courseId)
      setCourse(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load course',
        variant: 'destructive'
      })
    }
  }

  const loadLessons = async () => {
    try {
      const data = await api.getLessons(courseId)
      setLessons(data.sort((a, b) => a.order - b.order))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load lessons',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    if (!currentUser) return
    try {
      const token = getToken()
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const response = await axios.get(`${API_URL}/progress/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProgress(response.data)
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  const isLessonCompleted = (lessonId: number) => {
    return progress.some(p => p.lesson_id === lessonId && p.completed)
  }

  const completedCount = lessons.filter(l => isLessonCompleted(l.id)).length
  const totalLessons = lessons.length
  const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{course?.title}</CardTitle>
              <p className="text-gray-600">{course?.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm text-gray-600">Progress: </span>
              <span className="font-bold">{completionPercentage}%</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Completed: </span>
              <span className="font-bold">{completedCount} / {totalLessons}</span>
            </div>
          </div>
          {totalLessons > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Course Lessons</h2>
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className={isLessonCompleted(lesson.id) ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">
                        Lesson {lesson.order}
                      </span>
                      <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      {isLessonCompleted(lesson.id) && (
                        <Badge className="bg-green-600">Completed</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {lesson.content || 'No preview available'}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(`/learner/lessons/${lesson.id}`)}
                  >
                    {isLessonCompleted(lesson.id) ? 'Review' : 'Start Lesson'}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {lessons.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No lessons available in this course yet.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
