'use client'

/**
 * Chat Interface - Main Client Component
 * Handles real-time messaging with AI agents
 */

import { useState, useEffect, useRef } from 'react'
import MessageList from './MessageList'
import SendMessageForm from './SendMessageForm'
import GatherButtons from './GatherButtons'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agentId?: string
}

export interface ChatInterfaceProps {
  projectId: string
  projectSlug: string
  userId: string
}

export default function ChatInterface({ projectId, projectSlug, userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Initialize conversation on mount
  useEffect(() => {
    initializeConversation()
  }, [projectId])

  // Setup SSE connection for streaming
  useEffect(() => {
    if (!conversationId) return

    const eventSource = new EventSource(`/api/v1/chat/${conversationId}/stream`)

    eventSource.onopen = () => {
      console.log('✅ SSE connection opened')
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleStreamEvent(data)
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    }

    eventSource.onerror = () => {
      console.error('❌ SSE connection error')
      setIsConnected(false)
      eventSource.close()
    }

    eventSourceRef.current = eventSource

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [conversationId])

  async function initializeConversation() {
    try {
      // Create or get existing conversation
      const response = await fetch(`/api/v1/chat/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to initialize conversation')
      }

      const data = await response.json()
      setConversationId(data.conversationId)

      // Load existing messages
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error)
    }
  }

  function handleStreamEvent(data: any) {
    switch (data.type) {
      case 'thinking':
        // Agent is thinking
        console.log('🤔 Agent thinking:', data.content)
        break

      case 'action':
        // Agent is performing an action
        console.log('🔧 Agent action:', data.content)
        addSystemMessage(data.content)
        break

      case 'message':
        // New message from agent
        addMessage({
          id: data.messageId || Date.now().toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(data.timestamp),
          agentId: data.agentId,
        })
        break

      case 'error':
        console.error('❌ Agent error:', data.error)
        addSystemMessage(`Error: ${data.error}`)
        break
    }
  }

  function addMessage(message: Message) {
    setMessages((prev) => [...prev, message])
  }

  function addSystemMessage(content: string) {
    addMessage({
      id: Date.now().toString(),
      role: 'system',
      content,
      timestamp: new Date(),
    })
  }

  async function handleSendMessage(content: string) {
    if (!conversationId || !content.trim()) return

    setIsLoading(true)

    try {
      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      }
      addMessage(userMessage)

      // Send to API
      const response = await fetch(`/api/v1/chat/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          projectSlug,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Response will come through SSE stream
    } catch (error) {
      console.error('Failed to send message:', error)
      addSystemMessage('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Connection Status */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-gray-600">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {isLoading && <span className="text-gray-500">AI is processing...</span>}
        </div>
      </div>

      {/* Gather Buttons - Conditional on route */}
      <GatherButtons projectId={projectId} messages={messages} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 bg-white">
        <SendMessageForm onSend={handleSendMessage} disabled={isLoading || !conversationId} />
      </div>
    </div>
  )
}
