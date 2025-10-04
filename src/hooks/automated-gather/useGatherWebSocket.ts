/**
 * Gather WebSocket Hook
 * Real-time updates for automated gather progress via WebSocket
 */

import { useEffect, useRef, useCallback } from 'react'
import { useAutomatedGatherStore } from '@/stores/automatedGatherStore'
import type { DepartmentProgress } from '@/stores/automatedGatherStore'

interface AutomatedGatherEvent {
  type: 'automated-gather-start' | 'automated-gather-progress' | 'automated-gather-complete' | 'automated-gather-error'
  taskId: string
  data?: {
    department?: string
    departmentName?: string
    status?: 'pending' | 'processing' | 'completed' | 'failed'
    progress?: number
    currentStep?: string
    qualityScore?: number
    error?: string
    timestamp?: string
  }
}

interface UseGatherWebSocketOptions {
  enabled?: boolean
  onEvent?: (event: AutomatedGatherEvent) => void
  onError?: (error: Error) => void
}

/**
 * Hook for WebSocket-based real-time updates during automated gather
 */
export function useGatherWebSocket(
  taskId: string | null,
  options: UseGatherWebSocketOptions = {}
): void {
  const { enabled = true, onEvent, onError } = options

  const store = useAutomatedGatherStore()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const maxReconnectAttempts = 5
  const reconnectDelay = 2000

  /**
   * Handle WebSocket message
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)

        // Only process automated-gather events for our task
        if (
          !message.type?.startsWith('automated-gather-') ||
          message.taskId !== taskId
        ) {
          return
        }

        const gatherEvent = message as AutomatedGatherEvent

        // Call external handler
        onEvent?.(gatherEvent)

        // Update store based on event type
        switch (gatherEvent.type) {
          case 'automated-gather-start':
            store.setStatus('processing')
            break

          case 'automated-gather-progress':
            if (gatherEvent.data?.department) {
              const departmentProgress: DepartmentProgress = {
                departmentSlug: gatherEvent.data.department,
                departmentName: gatherEvent.data.departmentName || gatherEvent.data.department,
                status: gatherEvent.data.status || 'processing',
                progress: gatherEvent.data.progress || 0,
                currentStep: gatherEvent.data.currentStep,
                qualityScore: gatherEvent.data.qualityScore,
                startedAt: gatherEvent.data.timestamp,
                error: gatherEvent.data.error,
              }
              store.updateDepartmentProgress(departmentProgress)
            }
            break

          case 'automated-gather-complete':
            store.setStatus('completed')
            break

          case 'automated-gather-error':
            store.setStatus('failed')
            break
        }
      } catch (err) {
        console.error('[useGatherWebSocket] Error parsing message:', err)
        onError?.(err instanceof Error ? err : new Error('Failed to parse WebSocket message'))
      }
    },
    [taskId, store, onEvent, onError]
  )

  /**
   * Handle WebSocket error
   */
  const handleError = useCallback(
    (event: Event) => {
      console.error('[useGatherWebSocket] WebSocket error:', event)
      onError?.(new Error('WebSocket connection error'))
    },
    [onError]
  )

  /**
   * Handle WebSocket close with reconnection logic
   */
  const handleClose = useCallback(() => {
    console.log('[useGatherWebSocket] WebSocket closed')

    // Attempt reconnection if not intentionally closed
    if (
      enabled &&
      taskId &&
      reconnectAttemptsRef.current < maxReconnectAttempts
    ) {
      reconnectAttemptsRef.current += 1
      console.log(
        `[useGatherWebSocket] Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
      )

      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, reconnectDelay * reconnectAttemptsRef.current) // Exponential backoff
    }
  }, [enabled, taskId])

  /**
   * Connect to WebSocket
   */
  const connectWebSocket = useCallback(() => {
    if (!taskId || !enabled) {
      return
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws`

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[useGatherWebSocket] Connected')
        reconnectAttemptsRef.current = 0

        // Subscribe to automated-gather events for this task
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            channel: 'automated-gather',
            taskId,
          })
        )
      }

      ws.onmessage = handleMessage
      ws.onerror = handleError
      ws.onclose = handleClose

      wsRef.current = ws
    } catch (err) {
      console.error('[useGatherWebSocket] Error creating WebSocket:', err)
      onError?.(err instanceof Error ? err : new Error('Failed to create WebSocket'))
    }
  }, [taskId, enabled, handleMessage, handleError, handleClose, onError])

  /**
   * Connect on mount and when taskId/enabled changes
   */
  useEffect(() => {
    if (enabled && taskId) {
      connectWebSocket()
    }

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      reconnectAttemptsRef.current = 0
    }
  }, [taskId, enabled, connectWebSocket])
}
