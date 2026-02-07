/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/lib/use-toast'
import { api, Course, Lesson } from '@/lib/api'
import { getCurrentUser, getToken } from '@/lib/auth'
import axios from 'axios'
import { useRouter } from 'next/navigation'

interface EnrollmentWithProgress {
  course: Course
  lessons: Lesson[]
  completedLessons: number[]
  totalLessons: number
  completionPercentage: number
}

export default function LearnerProgressPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const token = getToken()
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

      // Get enrollments
      const enrollmentsResponse = await axios.get(`${API_URL}/enrollments/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Get progress
      const progressResponse = await axios.get(`${API_URL}/progress/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const progressData = progressResponse.data

      // Load course data for each enrollment
      const enrollmentData = await Promise.all(
        enrollmentsResponse.data.map(async (enrollment: { course_id: number }) => {
          try {
            const course = await api.getCourse(enrollment.course_id)
            const lessons = await api.getLessons(enrollment.course_id)
            
            const completedLessons = lessons
              .filter(lesson => 
                progressData.some((p: { lesson_id: number; completed: boolean }) => p.lesson_id === lesson.id && p.completed)
              )
              .map(l => l.id)

            const completionPercentage = lessons.length > 0 
              ? Math.round((completedLessons.length / lessons.length) * 100)
              : 0

            return {
              course,
              lessons: lessons.sort((a, b) => a.order - b.order),
              completedLessons,
              totalLessons: lessons.length,
              completionPercentage
            }
          } catch (error) {
            console.error(`Failed to load course ${enrollment.course_id}:`, error)
            return null
          }
        })
      )

      setEnrollments(enrollmentData.filter(Boolean) as EnrollmentWithProgress[])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load progress',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const isLessonCompleted = (lessonId: number, completedLessons: number[]) => {
    return completedLessons.includes(lessonId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Learning Progress</h1>
        <p className="text-gray-600 mt-2">Track your progress across all enrolled courses</p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t enrolled in any courses yet.</p>
            <a
              href="/learner/courses"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Browse Courses
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Enrolled Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{enrollments.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {enrollments.reduce((sum, e) => sum + e.totalLessons, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Completed Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {enrollments.reduce((sum, e) => sum + e.completedLessons.length, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Progress */}
          {enrollments.map((enrollment) => (
            <Card key={enrollment.course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{enrollment.course.title}</CardTitle>
                    <p className="text-sm text-gray-600">{enrollment.course.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {enrollment.completionPercentage}%
                    </div>
                    <p className="text-sm text-gray-600">
                      {enrollment.completedLessons.length} / {enrollment.totalLessons} lessons
                    </p>
                  </div>
                </div>
                {enrollment.totalLessons > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${enrollment.completionPercentage}%` }}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-3">Lesson Progress</h4>
                <div className="space-y-2">
                  {enrollment.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        isLessonCompleted(lesson.id, enrollment.completedLessons)
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">#{lesson.order}</span>
                        <span className="font-medium">{lesson.title}</span>
                        {isLessonCompleted(lesson.id, enrollment.completedLessons) && (
                          <Badge className="bg-green-600">Completed</Badge>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/learner/lessons/${lesson.id}`)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {isLessonCompleted(lesson.id, enrollment.completedLessons) ? 'Review' : 'Continue'}
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
