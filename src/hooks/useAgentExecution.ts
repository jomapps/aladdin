'use client'

/**
 * useAgentExecution Hook
 *
 * Custom hook for real-time agent execution monitoring via WebSocket.
 * Subscribes to execution events and provides live updates.
 *
 * @example
 * ```tsx
 * const { execution, events, isConnected, error } = useAgentExecution('exec-123')
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { AgentEvent } from '@/lib/agents/events'

interface AgentExecution {
  id: string
  executionId: string
  agent: {
    id: string
    agentId: string
    name: string
    isDepartmentHead: boolean
  }
  department: {
    id: string
    name: string
    color: string
    icon: string
  }
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  prompt: string
  output?: any
  qualityScore?: number
  startedAt?: Date
  completedAt?: Date
  executionTime?: number
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

interface UseAgentExecutionReturn {
  execution: AgentExecution | null
  events: AgentEvent[]
  isConnected: boolean
  isLoading: boolean
  error: Error | null
  reconnect: () => void
}

export function useAgentExecution(executionId: string): UseAgentExecutionReturn {
  const [execution, setExecution] = useState<AgentExecution | null>(null)
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  // Fetch initial execution data
  const fetchExecution = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/audit?executionId=${executionId}&limit=1`)
      const data = await response.json()

      if (data.success && data.data.executions.length > 0) {
        const exec = data.data.executions[0]
        setExecution({
          id: exec.id,
          executionId: exec.executionId,
          agent: exec.agent,
          department: exec.department,
          status: exec.status,
          prompt: exec.prompt,
          output: exec.output,
          qualityScore: exec.qualityScore,
          startedAt: exec.startedAt ? new Date(exec.startedAt) : undefined,
          completedAt: exec.completedAt ? new Date(exec.completedAt) : undefined,
          executionTime: exec.executionTime,
          tokenUsage: exec.tokenUsage,
        })

        // Set events from execution history
        if (exec.events && Array.isArray(exec.events)) {
          setEvents(exec.events.map((e: any) => e.event))
        }
      }
    } catch (err) {
      console.error('Failed to fetch execution:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch execution'))
    } finally {
      setIsLoading(false)
    }
  }, [executionId])

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws`

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0

        // Subscribe to execution events
        ws.send(JSON.stringify({
          type: 'subscribe',
          executionId,
        }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'event' && message.event) {
            const agentEvent: AgentEvent = message.event

            // Add event to list
            setEvents((prev) => [...prev, agentEvent])

            // Update execution state based on event
            if (agentEvent.type === 'agent-start') {
              setExecution((prev) => prev ? { ...prev, status: 'running' } : null)
            } else if (agentEvent.type === 'agent-complete') {
              setExecution((prev) => prev ? {
                ...prev,
                status: 'completed',
                output: agentEvent.output,
                qualityScore: agentEvent.qualityScore,
                completedAt: new Date(agentEvent.timestamp),
                executionTime: agentEvent.executionTime,
              } : null)
            } else if (agentEvent.type === 'error') {
              setExecution((prev) => prev ? { ...prev, status: 'failed' } : null)
            }
          } else if (message.type === 'pong') {
            // Handle ping/pong for connection health
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = (err) => {
        console.error('WebSocket error:', err)
        setError(new Error('WebSocket connection error'))
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
          reconnectAttemptsRef.current++

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`)
            connect()
          }, delay)
        }
      }
    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      setError(err instanceof Error ? err : new Error('Failed to create WebSocket'))
    }
  }, [executionId])

  // Reconnect manually
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  // Initialize
  useEffect(() => {
    fetchExecution()
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [fetchExecution, connect])

  return {
    execution,
    events,
    isConnected,
    isLoading,
    error,
    reconnect,
  }
}
