/**
 * useOrchestratorChat Hook
 * Handles sending messages and managing chat state
 */

'use client'

import { useState, useCallback } from 'react'
import { useOrchestratorStore, Message, OrchestratorMode } from '@/stores/orchestratorStore'

export interface SendMessageOptions {
  projectId: string
  mode?: OrchestratorMode
}

export function useOrchestratorChat(options: SendMessageOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const {
    currentMode,
    conversationId,
    setConversationId,
    addMessage,
    setIsStreaming,
  } = useOrchestratorStore()

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const mode = options.mode || currentMode
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Add user message immediately
    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content,
      timestamp: new Date(),
      mode,
    }

    addMessage(userMessage)
    setIsLoading(true)
    setError(null)
    setIsStreaming(true)

    try {
      // Route to appropriate endpoint based on mode
      const endpoint = `/api/v1/orchestrator/${mode}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          projectId: options.projectId,
          conversationId,
          mode,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      const data = await response.json()

      // Update conversation ID if new
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      // Add assistant message with metadata from API response
      if (data.message) {
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          mode,
          metadata: {
            suggestions: data.suggestions,
            queryResults: data.results,
            taskProgress: data.progress,
            dataPreview: data.duplicates ? {
              fields: [],
              status: 'valid' as const,
              errors: [],
              warnings: data.duplicates.length > 0 ? [`Found ${data.duplicates.length} potential duplicates`] : [],
            } : undefined,
          },
        }

        addMessage(assistantMessage)
      }

      setIsStreaming(false)

    } catch (err) {
      console.error('Failed to send message:', err)
      setError(err instanceof Error ? err : new Error('Failed to send message'))
      setIsStreaming(false)

      // Add error message
      addMessage({
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        mode,
      })
    } finally {
      setIsLoading(false)
    }
  }, [
    currentMode,
    options.projectId,
    options.mode,
    conversationId,
    addMessage,
    setConversationId,
    setIsStreaming,
  ])

  return {
    sendMessage,
    isLoading,
    error,
  }
}
