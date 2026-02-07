/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/lib/use-toast'
import { api, Lesson, File as FileType } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { getCurrentUser, getToken } from '@/lib/auth'
import ChatInterface from '@/components/chat/ChatInterface'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

export default function LearnerLessonViewerPage() {
  const params = useParams()
  // const router = useRouter()
  const lessonId = parseInt(params.lessonId as string)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [files, setFiles] = useState<FileType[]>([])
  const [loading, setLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [markingComplete, setMarkingComplete] = useState(false)
  const { toast } = useToast()
  // const currentUser = getCurrentUser()

  useEffect(() => {
    loadLesson()
    loadFiles()
    checkProgress()
  }, [lessonId])

  const loadLesson = async () => {
    try {
      const data = await api.getLesson(lessonId)
      setLesson(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load lesson',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = async () => {
    try {
      const data = await api.getFiles(lessonId)
      setFiles(data)
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }

  const checkProgress = async () => {
    try {
      const token = getToken()
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      const response = await axios.get(`${API_URL}/progress/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const lessonProgress = response.data.find((p: any) => p.lesson_id === lessonId)
      setIsCompleted(lessonProgress?.completed || false)
    } catch (error) {
      console.error('Failed to check progress:', error)
    }
  }

  const handleMarkComplete = async () => {
    setMarkingComplete(true)
    try {
      const token = getToken()
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      await axios.post(
        `${API_URL}/progress/lessons/${lessonId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      toast({
        title: 'Success',
        description: 'Lesson marked as complete'
      })
      setIsCompleted(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark lesson as complete',
        variant: 'destructive'
      })
    } finally {
      setMarkingComplete(false)
    }
  }

  const getFileUrl = (fileId: number) => {
    const token = getToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    return `${API_URL}/files/${fileId}/download?token=${token}`
  }

  const renderFileViewer = (file: FileType) => {
    const fileUrl = getFileUrl(file.id)
    const fileType = file.file_type.toLowerCase()

    if (fileType.includes('pdf')) {
      return (
        <div className="w-full h-[600px] border rounded-md">
          <iframe src={fileUrl} className="w-full h-full" title={file.filename} />
        </div>
      )
    } else if (fileType.includes('video') || fileType.includes('mp4') || fileType.includes('webm')) {
      return (
        <video controls className="w-full rounded-md">
          <source src={fileUrl} type={file.file_type} />
          Your browser does not support the video tag.
        </video>
      )
    } else if (fileType.includes('audio') || fileType.includes('mp3') || fileType.includes('wav')) {
      return (
        <audio controls className="w-full">
          <source src={fileUrl} type={file.file_type} />
          Your browser does not support the audio tag.
        </audio>
      )
    } else if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('gif')) {
      return (
        <img src={fileUrl} alt={file.filename} className="w-full rounded-md" />
      )
    } else if (fileType.includes('text') || fileType.includes('txt')) {
      return (
        <div className="w-full p-4 border rounded-md bg-gray-50">
          <iframe src={fileUrl} className="w-full h-96" title={file.filename} />
        </div>
      )
    } else {
      return (
        <div className="p-4 border rounded-md bg-gray-50 text-center">
          <p className="text-gray-600 mb-3">Preview not available for this file type</p>
          <Button asChild variant="outline">
            <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
              Download File
            </a>
          </Button>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Lesson not found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{lesson.title}</CardTitle>
                  {isCompleted && (
                    <Badge className="bg-green-600">Completed</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">Lesson #{lesson.order}</p>
              </div>
              {!isCompleted && (
                <Button
                  onClick={handleMarkComplete}
                  disabled={markingComplete}
                >
                  {markingComplete ? 'Marking...' : 'Mark as Complete'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <ReactMarkdown>{lesson.content || 'No content available'}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Lesson Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {files.map((file) => (
                <div key={file.id}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{file.filename}</h4>
                      <p className="text-sm text-gray-500">
                        {file.file_type} • {(file.file_size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a href={getFileUrl(file.id)} download target="_blank" rel="noopener noreferrer">
                        Download
                      </a>
                    </Button>
                  </div>
                  {renderFileViewer(file)}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 h-[calc(100vh-120px)]">
          <ChatInterface lessonId={lessonId} courseId={lesson.course_id} />
        </div>
      </div>
    </div>
  )
}
