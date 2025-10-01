/**
 * useStreamingResponse Hook
 * Manages Server-Sent Events (SSE) for real-time streaming responses
 */

'use client'

import { useEffect, useRef } from 'react'
import { useOrchestratorStore } from '@/stores/orchestratorStore'

export function useStreamingResponse(conversationId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null)

  const {
    updateStreamingMessage,
    setIsStreaming,
    addMessage,
    currentMode,
  } = useOrchestratorStore()

  useEffect(() => {
    if (!conversationId) return

    console.log('🔌 Setting up SSE connection for:', conversationId)

    // Setup SSE connection
    const eventSource = new EventSource(
      `/api/v1/orchestrator/stream?conversationId=${conversationId}`
    )

    eventSource.onopen = () => {
      console.log('✅ Streaming connection opened')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'start') {
          setIsStreaming(true)
          updateStreamingMessage('')
        } else if (data.type === 'chunk') {
          // Append to streaming message
          updateStreamingMessage(data.content)
        } else if (data.type === 'complete') {
          setIsStreaming(false)

          // Add complete message
          addMessage({
            id: data.messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: data.content,
            timestamp: new Date(data.timestamp || Date.now()),
            mode: data.mode || currentMode,
            metadata: data.metadata,
          })
        } else if (data.type === 'error') {
          setIsStreaming(false)

          // Add error message
          addMessage({
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: data.error || 'An error occurred while processing your request.',
            timestamp: new Date(),
            mode: currentMode,
          })
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    }

    eventSource.onerror = (err) => {
      console.error('❌ Streaming connection error:', err)
      setIsStreaming(false)
      eventSource.close()
    }

    eventSourceRef.current = eventSource

    return () => {
      console.log('🔌 Closing SSE connection')
      eventSource.close()
    }
  }, [conversationId, addMessage, setIsStreaming, updateStreamingMessage, currentMode])

  return {
    isConnected: !!eventSourceRef.current,
  }
}
