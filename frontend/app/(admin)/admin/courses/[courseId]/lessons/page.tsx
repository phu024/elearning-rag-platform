/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/lib/use-toast'
import { api, Lesson, File as FileType, Course } from '@/lib/api'
import { useParams } from 'next/navigation'

export default function AdminCourseLessonsPage() {
  const params = useParams()
  const courseId = parseInt(params.courseId as string)
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showFilesDialog, setShowFilesDialog] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [lessonFiles, setLessonFiles] = useState<FileType[]>([])
  const [formData, setFormData] = useState({ title: '', content: '', order: 0 })
  const [uploadingFile, setUploadingFile] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadCourse()
    loadLessons()
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

  const loadLessonFiles = async (lessonId: number) => {
    try {
      const data = await api.getFiles(lessonId)
      setLessonFiles(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load files',
        variant: 'destructive'
      })
    }
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Lesson title is required',
        variant: 'destructive'
      })
      return
    }

    try {
      await api.createLesson({
        course_id: courseId,
        title: formData.title,
        content: formData.content,
        order: formData.order || lessons.length + 1
      })
      toast({
        title: 'Success',
        description: 'Lesson created successfully'
      })
      setShowCreateDialog(false)
      setFormData({ title: '', content: '', order: 0 })
      loadLessons()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create lesson',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = async () => {
    if (!editingLesson || !formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Lesson title is required',
        variant: 'destructive'
      })
      return
    }

    try {
      await api.updateLesson(editingLesson.id, {
        title: formData.title,
        content: formData.content,
        order: formData.order
      })
      toast({
        title: 'Success',
        description: 'Lesson updated successfully'
      })
      setShowEditDialog(false)
      setEditingLesson(null)
      setFormData({ title: '', content: '', order: 0 })
      loadLessons()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lesson',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    try {
      await api.deleteLesson(id)
      toast({
        title: 'Success',
        description: 'Lesson deleted successfully'
      })
      loadLessons()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete lesson',
        variant: 'destructive'
      })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedLesson || !e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    setUploadingFile(true)

    try {
      await api.uploadFile(selectedLesson.id, file)
      toast({
        title: 'Success',
        description: 'File uploaded successfully'
      })
      loadLessonFiles(selectedLesson.id)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive'
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      await api.deleteFile(fileId)
      toast({
        title: 'Success',
        description: 'File deleted successfully'
      })
      if (selectedLesson) {
        loadLessonFiles(selectedLesson.id)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive'
      })
    }
  }

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setFormData({ title: lesson.title, content: lesson.content, order: lesson.order })
    setShowEditDialog(true)
  }

  const openFilesDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    loadLessonFiles(lesson.id)
    setShowFilesDialog(true)
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
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{course?.title || 'Course'} - Lessons</h1>
          <Button onClick={() => setShowCreateDialog(true)}>
            Create Lesson
          </Button>
        </div>
        <p className="text-gray-600">{course?.description}</p>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson) => (
          <Card key={lesson.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">#{lesson.order}</span>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {lesson.content || 'No content'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openFilesDialog(lesson)}
              >
                Files
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditDialog(lesson)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(lesson.id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {lessons.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No lessons yet. Create your first lesson to get started.
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content (Markdown)</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter lesson content in markdown format"
                rows={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Order</label>
              <Input
                type="number"
                value={formData.order || lessons.length + 1}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="Lesson order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content (Markdown)</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter lesson content in markdown format"
                rows={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Order</label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="Lesson order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Files Dialog */}
      <Dialog open={showFilesDialog} onOpenChange={setShowFilesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Files for {selectedLesson?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload New File</label>
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
              {uploadingFile && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Existing Files</h4>
              {lessonFiles.length === 0 ? (
                <p className="text-sm text-gray-500">No files uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {lessonFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{file.filename}</p>
                        <p className="text-sm text-gray-500">
                          {file.file_type} • {(file.file_size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowFilesDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
