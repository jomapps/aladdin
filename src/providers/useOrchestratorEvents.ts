/**
 * useOrchestratorEvents Hook
 *
 * Hook for listening to specific orchestrator event types
 */

'use client'

import { useEffect, useState } from 'react'
import { useWebSocketContext } from './WebSocketProvider'
import type { AgentEvent } from '@/lib/agents/events/types'

interface UseOrchestratorEventsOptions {
  executionId?: string
  conversationId?: string
  eventTypes?: AgentEvent['type'][]
  enabled?: boolean
  onEvent?: (event: AgentEvent) => void
}

interface OrchestratorEventsState {
  events: AgentEvent[]
  lastEvent: AgentEvent | null
  isConnected: boolean
  eventCounts: Record<string, number>
}

export function useOrchestratorEvents({
  executionId,
  conversationId,
  eventTypes,
  enabled = true,
  onEvent,
}: UseOrchestratorEventsOptions = {}) {
  const ws = useWebSocketContext()
  const [state, setState] = useState<OrchestratorEventsState>({
    events: [],
    lastEvent: null,
    isConnected: false,
    eventCounts: {},
  })

  useEffect(() => {
    if (!enabled || !ws.isConnected) {
      setState((prev) => ({ ...prev, isConnected: false }))
      return
    }

    setState((prev) => ({ ...prev, isConnected: true }))

    // Subscribe to execution or conversation
    const unsubscribe = ws.subscribe({
      executionId,
      conversationId,
    })

    // Add event listener
    const removeListener = ws.addEventListener('*', (event) => {
      // Filter by event types if specified
      if (eventTypes && !eventTypes.includes(event.type)) {
        return
      }

      // Filter by executionId if specified
      if (executionId && event.executionId !== executionId) {
        return
      }

      // Filter by conversationId if specified
      if (conversationId && event.conversationId !== conversationId) {
        return
      }

      // Update state
      setState((prev) => ({
        events: [...prev.events, event],
        lastEvent: event,
        isConnected: true,
        eventCounts: {
          ...prev.eventCounts,
          [event.type]: (prev.eventCounts[event.type] || 0) + 1,
        },
      }))

      // Call custom handler
      if (onEvent) {
        onEvent(event)
      }
    })

    return () => {
      unsubscribe()
      removeListener()
    }
  }, [ws, executionId, conversationId, eventTypes, enabled, onEvent])

  return {
    ...state,
    clearEvents: () =>
      setState({
        events: [],
        lastEvent: null,
        isConnected: ws.isConnected,
        eventCounts: {},
      }),
  }
}

/**
 * Hook for listening to specific event types
 */
export function useOrchestratorEvent(
  eventType: AgentEvent['type'],
  handler: (event: AgentEvent) => void,
  options?: {
    executionId?: string
    conversationId?: string
    enabled?: boolean
  }
) {
  const ws = useWebSocketContext()

  useEffect(() => {
    if (!options?.enabled && options?.enabled !== undefined) return
    if (!ws.isConnected) return

    // Subscribe if IDs provided
    let unsubscribe: (() => void) | undefined
    if (options?.executionId || options?.conversationId) {
      unsubscribe = ws.subscribe({
        executionId: options.executionId,
        conversationId: options.conversationId,
      })
    }

    // Add event listener for specific type
    const removeListener = ws.addEventListener(eventType, handler)

    return () => {
      if (unsubscribe) unsubscribe()
      removeListener()
    }
  }, [ws, eventType, handler, options])
}
