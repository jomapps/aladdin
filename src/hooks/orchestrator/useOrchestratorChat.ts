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

  const { currentMode, conversationId, setConversationId, addMessage, setIsStreaming } =
    useOrchestratorStore()

  const sendMessage = useCallback(
    async (content: string) => {
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
        // Validate conversationId format (MongoDB ObjectId is 24 hex chars)
        const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id)
        const validConversationId =
          conversationId && isValidObjectId(conversationId) ? conversationId : undefined

        // Clear invalid conversationId from store
        if (conversationId && !validConversationId) {
          console.warn('[useOrchestratorChat] Clearing invalid conversationId:', conversationId)
          setConversationId('')
        }

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
            conversationId: validConversationId,
            mode,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.statusText}`)
        }

        const data = await response.json()

        console.log('[useOrchestratorChat] Response received:', {
          mode,
          hasMessage: !!data.message,
          hasConversationId: !!data.conversationId,
          dataKeys: Object.keys(data),
        })

        // Update conversation ID if new
        if (data.conversationId && !conversationId) {
          console.log('[useOrchestratorChat] Setting new conversationId:', data.conversationId)
          setConversationId(data.conversationId)
        }

        // Add assistant message for all modes (including chat)
        // Note: Chat mode now returns JSON response, not SSE streaming
        if (data.message) {
          console.log('[useOrchestratorChat] Adding assistant message for mode:', mode)
          console.log('[useOrchestratorChat] Message content:', data.message)

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
              dataPreview: data.duplicates
                ? {
                    fields: [],
                    status: 'valid' as const,
                    errors: [],
                    warnings:
                      data.duplicates.length > 0
                        ? [`Found ${data.duplicates.length} potential duplicates`]
                        : [],
                  }
                : undefined,
            },
          }

          addMessage(assistantMessage)
          console.log('[useOrchestratorChat] Assistant message added:', {
            id: assistantMessage.id,
            contentLength: assistantMessage.content.length,
            mode: assistantMessage.mode,
          })
        } else {
          console.warn('[useOrchestratorChat] No message in response:', data)
        }

        // Clear streaming flag for all modes
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
    },
    [
      currentMode,
      options.projectId,
      options.mode,
      conversationId,
      addMessage,
      setConversationId,
      setIsStreaming,
    ],
  )

  return {
    sendMessage,
    isLoading,
    error,
  }
}
