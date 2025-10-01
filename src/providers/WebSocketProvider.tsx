/**
 * WebSocket Provider for Real-time Updates
 *
 * Provides WebSocket connection management and real-time event streaming
 * for the Aladdin orchestrator UI.
 */

'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { AgentEvent, WebSocketMessage } from '@/lib/agents/events/types'

// WebSocket connection state
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

// WebSocket context type
interface WebSocketContextType {
  // Connection state
  connectionState: ConnectionState
  isConnected: boolean
  error: Error | null

  // Connection management
  connect: () => void
  disconnect: () => void
  reconnect: () => void

  // Subscription management
  subscribe: (params: SubscribeParams) => () => void
  unsubscribe: (params: SubscribeParams) => void

  // Event listeners
  addEventListener: (type: string, handler: EventHandler) => () => void
  removeEventListener: (type: string, handler: EventHandler) => void

  // Send messages
  sendMessage: (message: WebSocketMessage) => void
}

interface SubscribeParams {
  executionId?: string
  conversationId?: string
}

type EventHandler = (event: AgentEvent) => void

// Create context
const WebSocketContext = createContext<WebSocketContextType | null>(null)

// Provider props
interface WebSocketProviderProps {
  children: React.ReactNode
  url?: string
  autoConnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function WebSocketProvider({
  children,
  url = typeof window !== 'undefined' ? `ws://localhost:${process.env.NEXT_PUBLIC_WS_PORT || '3001'}` : '',
  autoConnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: WebSocketProviderProps) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const eventHandlersRef = useRef<Map<string, Set<EventHandler>>>(new Map())
  const mountedRef = useRef(true)

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [error, setError] = useState<Error | null>(null)

  // Connect to WebSocket
  const connect = React.useCallback(() => {
    if (typeof window === 'undefined') return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      setConnectionState('connecting')
      setError(null)

      const ws = new WebSocket(url)

      ws.onopen = () => {
        if (!mountedRef.current) return
        console.log('[WebSocket] Connected')
        setConnectionState('connected')
        reconnectAttemptsRef.current = 0

        // Send initial ping
        ws.send(JSON.stringify({ type: 'ping', timestamp: new Date() }))
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return

        try {
          const message: WebSocketMessage = JSON.parse(event.data)

          // Handle different message types
          switch (message.type) {
            case 'event':
              if (message.event) {
                // Dispatch event to all registered handlers
                const handlers = eventHandlersRef.current.get(message.event.type)
                if (handlers) {
                  handlers.forEach((handler) => handler(message.event!))
                }
                // Also dispatch to wildcard handlers
                const wildcardHandlers = eventHandlersRef.current.get('*')
                if (wildcardHandlers) {
                  wildcardHandlers.forEach((handler) => handler(message.event!))
                }
              }
              break

            case 'pong':
              // Heartbeat response
              break

            default:
              console.log('[WebSocket] Unknown message type:', message.type)
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err)
        }
      }

      ws.onerror = (event) => {
        if (!mountedRef.current) return
        console.error('[WebSocket] Error:', event)
        setError(new Error('WebSocket connection error'))
        setConnectionState('error')
      }

      ws.onclose = (event) => {
        if (!mountedRef.current) return
        console.log('[WebSocket] Disconnected:', event.code, event.reason)
        setConnectionState('disconnected')

        // Attempt to reconnect
        if (
          autoConnect &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++
          console.log(
            `[WebSocket] Reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          )
          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect()
            }
          }, reconnectInterval)
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error('[WebSocket] Failed to connect:', err)
      setError(err as Error)
      setConnectionState('error')
    }
  }, [url, autoConnect, reconnectInterval, maxReconnectAttempts])

  // Disconnect from WebSocket
  const disconnect = React.useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setConnectionState('disconnected')
  }, [])

  // Reconnect
  const reconnect = React.useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect, disconnect])

  // Subscribe to execution or conversation
  const subscribe = React.useCallback(
    (params: SubscribeParams) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const message: WebSocketMessage = {
          type: 'subscribe',
          ...params,
        }
        wsRef.current.send(JSON.stringify(message))
      }

      // Return unsubscribe function
      return () => {
        unsubscribe(params)
      }
    },
    []
  )

  // Unsubscribe
  const unsubscribe = React.useCallback((params: SubscribeParams) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'unsubscribe',
        ...params,
      }
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  // Add event listener
  const addEventListener = React.useCallback((type: string, handler: EventHandler) => {
    if (!eventHandlersRef.current.has(type)) {
      eventHandlersRef.current.set(type, new Set())
    }
    eventHandlersRef.current.get(type)!.add(handler)

    // Return cleanup function
    return () => {
      removeEventListener(type, handler)
    }
  }, [])

  // Remove event listener
  const removeEventListener = React.useCallback((type: string, handler: EventHandler) => {
    const handlers = eventHandlersRef.current.get(type)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        eventHandlersRef.current.delete(type)
      }
    }
  }, [])

  // Send message
  const sendMessage = React.useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  // Heartbeat interval
  useEffect(() => {
    if (connectionState !== 'connected') return

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: new Date() }))
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [connectionState])

  const value: WebSocketContextType = {
    connectionState,
    isConnected: connectionState === 'connected',
    error,
    connect,
    disconnect,
    reconnect,
    subscribe,
    unsubscribe,
    addEventListener,
    removeEventListener,
    sendMessage,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

// Hook to use WebSocket context
export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }
  return context
}
