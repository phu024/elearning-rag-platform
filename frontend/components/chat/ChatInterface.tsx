/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { useToast } from '@/lib/use-toast'
import axios from 'axios'
import { getToken, getCurrentUser } from '@/lib/auth'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{
    filename?: string
    lesson_title?: string
    page_number?: number
    timestamp?: string
    relevance_score?: number
    content?: string
  }>
}

interface ChatInterfaceProps {
  lessonId?: number
  courseId?: number
}

export default function ChatInterface({ lessonId, courseId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [scope, setScope] = useState<'lesson' | 'course' | 'global'>('lesson')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const currentUser = getCurrentUser()

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const token = getToken()
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
      
      const response = await axios.post(
        `${API_URL}/chat/query`,
        {
          query: input,
          scope: scope,
          lessonId: scope === 'lesson' ? lessonId : undefined,
          courseId: scope === 'course' ? courseId : undefined,
          userId: currentUser?.id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.response || response.data.answer || 'No response received',
        sources: response.data.sources || []
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: unknown) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      })
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: 'Copied',
      description: 'Response copied to clipboard'
    })
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI Assistant</CardTitle>
          <Button size="sm" variant="outline" onClick={handleClear}>
            Clear Chat
          </Button>
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium mb-2">Scope</label>
          <Select value={scope} onValueChange={(value: string) => setScope(value as 'lesson' | 'course' | 'global')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lesson">Lesson Only</SelectItem>
              <SelectItem value="course">Entire Course</SelectItem>
              <SelectItem value="global">All My Courses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Ask me anything about your course materials!</p>
            <p className="text-sm mt-2">Select a scope and type your question below.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs font-semibold mb-2">Sources:</p>
                    <div className="space-y-1">
                      {message.sources.map((source, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-medium">
                            {source.filename || source.lesson_title || 'Unknown source'}
                          </span>
                          {source.page_number && <span> (Page {source.page_number})</span>}
                          {source.relevance_score && (
                            <span className="ml-2 text-gray-600">
                              ({Math.round(source.relevance_score * 100)}% relevant)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {message.role === 'assistant' && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => handleCopy(message.content)}
                      className="text-xs underline hover:no-underline"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="text-left">
            <div className="inline-block bg-gray-100 p-3 rounded-lg">
              <p className="text-gray-500">Thinking...</p>
            </div>
          </div>
        )}
      </CardContent>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
            placeholder="Ask a question..."
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </Card>
  )
}
