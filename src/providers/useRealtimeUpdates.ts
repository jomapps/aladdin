/**
 * useRealtimeUpdates Hook
 *
 * Hook for subscribing to real-time entity updates via WebSocket
 */

'use client'

import { useEffect } from 'react'
import { useWebSocketContext } from './WebSocketProvider'
import { queryClient } from '@/lib/react-query/client'
import type { AgentEvent } from '@/lib/agents/events/types'

interface UseRealtimeUpdatesOptions {
  executionId?: string
  conversationId?: string
  enabled?: boolean
  onEvent?: (event: AgentEvent) => void
}

export function useRealtimeUpdates({
  executionId,
  conversationId,
  enabled = true,
  onEvent,
}: UseRealtimeUpdatesOptions = {}) {
  const ws = useWebSocketContext()

  useEffect(() => {
    if (!enabled || !ws.isConnected) return

    // Subscribe to execution or conversation
    const unsubscribe = ws.subscribe({
      executionId,
      conversationId,
    })

    // Add event listener for all events
    const removeListener = ws.addEventListener('*', (event) => {
      // Call custom handler if provided
      if (onEvent) {
        onEvent(event)
      }

      // Auto-invalidate relevant queries based on event type
      switch (event.type) {
        case 'orchestration-complete':
          if (executionId) {
            queryClient.invalidateQueries({
              queryKey: ['executions', 'detail', executionId],
            })
          }
          break

        case 'department-complete':
        case 'agent-complete':
          if (executionId) {
            queryClient.invalidateQueries({
              queryKey: ['executions', 'events', executionId],
            })
          }
          break

        case 'quality-check':
        case 'review-status':
          // Invalidate project/episode queries if they're affected
          if (event.executionId) {
            queryClient.invalidateQueries({
              queryKey: ['executions', 'detail', event.executionId],
            })
          }
          break
      }
    })

    return () => {
      unsubscribe()
      removeListener()
    }
  }, [ws, executionId, conversationId, enabled, onEvent])

  return {
    isConnected: ws.isConnected,
    connectionState: ws.connectionState,
  }
}
