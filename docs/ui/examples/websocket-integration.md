# WebSocket Integration Example

This example shows how to integrate WebSocket for real-time agent execution monitoring.

## Basic WebSocket Hook

```typescript
// hooks/useWebSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react'

interface UseWebSocketOptions {
  onOpen?: () => void
  onMessage?: (data: any) => void
  onClose?: () => void
  onError?: (error: Error) => void
  reconnect?: boolean
  reconnectInterval?: number
  reconnectAttempts?: number
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 1000,
    reconnectAttempts = 5
  } = options

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        onOpen?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          onMessage?.(data)
        } catch (err) {
          console.error('Failed to parse message:', err)
        }
      }

      ws.onerror = (event) => {
        const err = new Error('WebSocket error')
        console.error('WebSocket error:', event)
        setError(err)
        onError?.(err)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null
        onClose?.()

        // Auto-reconnect
        if (
          reconnect &&
          reconnectAttemptsRef.current < reconnectAttempts
        ) {
          const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current)
          reconnectAttemptsRef.current++

          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect')
      setError(error)
      onError?.(error)
    }
  }, [url, onOpen, onMessage, onClose, onError, reconnect, reconnectInterval, reconnectAttempts])

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket not connected')
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
    }
  }, [])

  const reconnectManually = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect, disconnect])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    lastMessage,
    error,
    send,
    reconnect: reconnectManually,
    disconnect
  }
}
```

## Agent Execution Monitoring

```typescript
// hooks/useAgentExecution.ts
import { useState, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'

interface AgentExecution {
  id: string
  executionId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  agent: any
  department: any
  events: AgentEvent[]
}

interface AgentEvent {
  id: string
  type: string
  timestamp: Date
  data?: any
}

export function useAgentExecution(executionId: string) {
  const [execution, setExecution] = useState<AgentExecution | null>(null)
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    fetchExecution(executionId)
      .then(data => {
        setExecution(data)
        setEvents(data.events || [])
      })
      .catch(error => {
        console.error('Failed to fetch execution:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [executionId])

  // WebSocket connection
  const {
    isConnected,
    send,
    reconnect,
    error: wsError
  } = useWebSocket('ws://localhost:3000/api/ws', {
    onOpen: () => {
      // Subscribe to execution updates
      send({
        type: 'subscribe',
        executionId
      })
    },
    onMessage: (message) => {
      if (message.type === 'event') {
        const event: AgentEvent = message.event

        // Add new event
        setEvents(prev => [...prev, event])

        // Update execution status
        if (event.type === 'agent-start') {
          setExecution(prev => prev ? { ...prev, status: 'running' } : null)
        } else if (event.type === 'agent-complete') {
          setExecution(prev => prev ? {
            ...prev,
            status: 'completed',
            ...event.data
          } : null)
        } else if (event.type === 'error') {
          setExecution(prev => prev ? { ...prev, status: 'failed' } : null)
        }
      }
    },
    reconnect: true,
    reconnectAttempts: 5
  })

  return {
    execution,
    events,
    isConnected,
    isLoading,
    error: wsError,
    reconnect
  }
}
```

## Component Usage

```typescript
// components/AgentStatusDashboard.tsx
import { useAgentExecution } from '@/hooks/useAgentExecution'

export function AgentStatusDashboard({ executionId }: { executionId: string }) {
  const {
    execution,
    events,
    isConnected,
    isLoading,
    error,
    reconnect
  } = useAgentExecution(executionId)

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={reconnect}
      />
    )
  }

  return (
    <div>
      {/* Connection status */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 p-4">
          <p>WebSocket disconnected</p>
          <button onClick={reconnect}>Reconnect</button>
        </div>
      )}

      {isConnected && execution?.status === 'running' && (
        <div className="bg-blue-50 border border-blue-200 p-4">
          <p>Live updates active</p>
        </div>
      )}

      {/* Agent information */}
      <AgentCard
        agent={execution.agent}
        department={execution.department}
        status={execution.status}
      />

      {/* Real-time timeline */}
      <Timeline events={events} />

      {/* Real-time output */}
      <OutputStream events={events} />
    </div>
  )
}
```

## Server-Side WebSocket Handler

```typescript
// app/api/ws/route.ts
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ noServer: true })

export function GET(request: Request) {
  return new Response('WebSocket endpoint', { status: 426 })
}

// Handle WebSocket upgrade
export function upgrade(request: Request, socket: any, head: any) {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected')

  let subscriptions: Set<string> = new Set()

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())

      if (message.type === 'subscribe') {
        // Subscribe to execution updates
        subscriptions.add(message.executionId)
        console.log(`Subscribed to ${message.executionId}`)
      } else if (message.type === 'unsubscribe') {
        // Unsubscribe
        subscriptions.delete(message.executionId)
        console.log(`Unsubscribed from ${message.executionId}`)
      } else if (message.type === 'ping') {
        // Respond to ping
        ws.send(JSON.stringify({ type: 'pong' }))
      }
    } catch (error) {
      console.error('Failed to parse message:', error)
    }
  })

  ws.on('close', () => {
    console.log('Client disconnected')
    subscriptions.clear()
  })

  // Send events to subscribed clients
  function sendEvent(executionId: string, event: any) {
    if (subscriptions.has(executionId)) {
      ws.send(JSON.stringify({
        type: 'event',
        executionId,
        event
      }))
    }
  }

  // Store connection for broadcasting
  clients.add({ ws, sendEvent })
})

// Broadcast event to all subscribed clients
export function broadcastEvent(executionId: string, event: any) {
  clients.forEach(client => {
    client.sendEvent(executionId, event)
  })
}
```

## Best Practices

1. **Always clean up WebSocket connections**
2. **Implement auto-reconnect with exponential backoff**
3. **Handle connection errors gracefully**
4. **Batch updates for performance**
5. **Show connection status to users**
6. **Validate messages before processing**
7. **Use ping/pong to detect dead connections**
8. **Throttle high-frequency updates**

## Next Steps

- Review [State Management Guide](/mnt/d/Projects/aladdin/docs/ui/STATE_MANAGEMENT.md)
- Check [Performance Guide](/mnt/d/Projects/aladdin/docs/ui/PERFORMANCE.md) for optimization
- See [API Reference](/mnt/d/Projects/aladdin/docs/ui/API_REFERENCE.md) for WebSocket API
