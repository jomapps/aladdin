/**
 * useStreamingResponse Hook
 * Manages Server-Sent Events (SSE) for real-time streaming responses
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useOrchestratorStore } from '@/stores/orchestratorStore'

export function useStreamingResponse(conversationId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const streamingMessageRef = useRef<string>('')

  const {
    updateStreamingMessage,
    setIsStreaming,
    addMessage,
    currentMode,
  } = useOrchestratorStore()

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!conversationId) return

    console.log('🔌 Setting up SSE connection for:', conversationId)

    // Close existing connection
    cleanup()

    // Setup SSE connection with mode parameter
    const url = `/api/orchestrator/stream?conversationId=${conversationId}&mode=${currentMode}`
    const eventSource = new EventSource(url)

    eventSource.onopen = () => {
      console.log('✅ Streaming connection opened')
      setIsStreaming(true)
      streamingMessageRef.current = ''
      updateStreamingMessage('')
    }

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        switch (message.type) {
          case 'token':
            // Append token to streaming message
            streamingMessageRef.current += message.data.token
            updateStreamingMessage(streamingMessageRef.current)
            break

          case 'complete':
            // Add complete message to store
            setIsStreaming(false)
            addMessage({
              id: `msg-${Date.now()}-assistant`,
              role: 'assistant',
              content: message.data.message,
              timestamp: new Date(),
              mode: currentMode,
              metadata: message.data.metadata,
            })

            // Reset streaming message
            streamingMessageRef.current = ''
            updateStreamingMessage('')
            eventSource.close()
            break

          case 'error':
            // Handle error
            console.error('[SSE] Error:', message.data.message)
            setIsStreaming(false)
            addMessage({
              id: `msg-${Date.now()}-error`,
              role: 'assistant',
              content: `Error: ${message.data.message}`,
              timestamp: new Date(),
              mode: currentMode,
            })

            // Reset streaming message
            streamingMessageRef.current = ''
            updateStreamingMessage('')
            eventSource.close()
            break

          case 'progress':
            // Update task progress (for Task mode)
            if (message.data.progress) {
              // TODO: Update task progress in store
              console.log('[SSE] Task progress:', message.data.progress)
            }
            break

          default:
            console.warn('[SSE] Unknown message type:', message.type)
        }
      } catch (error) {
        console.error('[SSE] Parse error:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error)
      setIsStreaming(false)
      eventSource.close()

      // Auto-reconnect after 2 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[SSE] Attempting to reconnect...')
        connect()
      }, 2000)
    }

    eventSourceRef.current = eventSource
  }, [conversationId, currentMode, addMessage, setIsStreaming, updateStreamingMessage, cleanup])

  useEffect(() => {
    if (!conversationId) {
      cleanup()
      return
    }

    connect()

    // Cleanup on unmount
    return () => {
      cleanup()
    }
  }, [conversationId, connect, cleanup])

  return {
    isConnected: !!eventSourceRef.current,
    reconnect: connect,
  }
}
