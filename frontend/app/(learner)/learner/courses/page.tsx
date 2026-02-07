/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/lib/use-toast'
import { api, Course } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { getToken } from '@/lib/auth'

interface Enrollment {
  id: number
  user_id: number
  course_id: number
}

export default function LearnerCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadCourses()
    loadEnrollments()
  }, [])

  const loadCourses = async () => {
    try {
      const data = await api.getCourses()
      setCourses(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadEnrollments = async () => {
    try {
      const token = getToken()
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const response = await axios.get(`${API_URL}/enrollments/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEnrollments(response.data)
    } catch (error) {
      console.error('Failed to load enrollments:', error)
    }
  }

  const handleEnroll = async (courseId: number) => {
    try {
      const token = getToken()
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      await axios.post(
        `${API_URL}/courses/${courseId}/enroll`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      toast({
        title: 'Success',
        description: 'Enrolled in course successfully'
      })
      loadEnrollments()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to enroll in course',
        variant: 'destructive'
      })
    }
  }

  const isEnrolled = (courseId: number) => {
    return enrollments.some(e => e.course_id === courseId)
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const enrolledCourses = filteredCourses.filter(c => isEnrolled(c.id))
  const availableCourses = filteredCourses.filter(c => !isEnrolled(c.id))

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
        <h1 className="text-3xl font-bold">Course Catalog</h1>
        <p className="text-gray-600 mt-2">Browse and enroll in available courses</p>
      </div>

      <div>
        <Input
          type="search"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {enrolledCourses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">My Enrolled Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((course) => (
              <Card key={course.id} className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {course.description || 'No description'}
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/learner/courses/${course.id}`)}
                  >
                    View Course
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {availableCourses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {course.description || 'No description'}
                  </p>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleEnroll(course.id)}
                  >
                    Enroll Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No courses available at the moment.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
