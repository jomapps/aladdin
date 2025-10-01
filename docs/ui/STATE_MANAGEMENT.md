# State Management Guide

## Table of Contents

- [Overview](#overview)
- [Local State](#local-state)
- [Custom Hooks](#custom-hooks)
- [WebSocket State](#websocket-state)
- [Server State](#server-state)
- [Caching Strategies](#caching-strategies)
- [Optimistic Updates](#optimistic-updates)
- [State Synchronization](#state-synchronization)
- [Best Practices](#best-practices)

## Overview

Aladdin uses a hybrid state management approach combining React hooks, custom hooks, and WebSocket connections for real-time updates.

### State Management Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Application State                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Local State  │  │ Server State │  │ WebSocket    │ │
│  │ (useState)   │  │ (fetch/API)  │  │ (real-time)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                           │                             │
│                  ┌────────▼─────────┐                   │
│                  │  Custom Hooks    │                   │
│                  │  (useAgent...)   │                   │
│                  └──────────────────┘                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Local state for UI**: Component-specific state (modals, forms, toggles)
2. **Custom hooks for shared logic**: Reusable state management
3. **WebSocket for real-time**: Live updates for agent execution
4. **Server state for persistence**: Database-backed data
5. **Optimistic updates**: Immediate UI feedback

## Local State

### Component State with useState

For component-specific state that doesn't need to be shared:

```typescript
import { useState } from 'react'

function AgentCard() {
  // Simple boolean state
  const [isExpanded, setIsExpanded] = useState(false)

  // Object state
  const [filters, setFilters] = useState({
    status: 'all',
    department: null
  })

  // Array state
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])

  return (
    <div>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>

      {/* Update object state */}
      <select
        value={filters.status}
        onChange={(e) => setFilters({
          ...filters,
          status: e.target.value
        })}
      >
        <option value="all">All</option>
        <option value="running">Running</option>
        <option value="completed">Completed</option>
      </select>

      {/* Update array state */}
      <button onClick={() => setSelectedAgents([...selectedAgents, 'agent-1'])}>
        Add Agent
      </button>
    </div>
  )
}
```

### Derived State

Compute state from existing state:

```typescript
function DepartmentDashboard({ agents }) {
  const [statusFilter, setStatusFilter] = useState('all')

  // Derived state - computed from props and state
  const filteredAgents = useMemo(() => {
    if (statusFilter === 'all') return agents
    return agents.filter(agent => agent.status === statusFilter)
  }, [agents, statusFilter])

  const activeCount = useMemo(
    () => filteredAgents.filter(a => a.isActive).length,
    [filteredAgents]
  )

  return (
    <div>
      <p>Active: {activeCount} / {filteredAgents.length}</p>
      {filteredAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
    </div>
  )
}
```

### Form State

Managing form inputs:

```typescript
function AgentForm() {
  const [formData, setFormData] = useState({
    name: '',
    agentId: '',
    department: '',
    isDepartmentHead: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: Record<string, string> = {}

    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.agentId) newErrors.agentId = 'Agent ID is required'
    if (!formData.department) newErrors.department = 'Department is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit
    try {
      await createAgent(formData)
      // Reset form
      setFormData({ name: '', agentId: '', department: '', isDepartmentHead: false })
    } catch (error) {
      setErrors({ submit: error.message })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      {errors.name && <span className="error">{errors.name}</span>}

      <button type="submit">Create Agent</button>
      {errors.submit && <span className="error">{errors.submit}</span>}
    </form>
  )
}
```

## Custom Hooks

### useAgentExecution Hook

Manages agent execution state with WebSocket:

```typescript
// /src/hooks/useAgentExecution.ts
import { useState, useEffect, useCallback, useRef } from 'react'

interface AgentExecution {
  id: string
  executionId: string
  agent: {...}
  department: {...}
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  prompt: string
  output?: any
  qualityScore?: number
  startedAt?: Date
  completedAt?: Date
  executionTime?: number
  tokenUsage?: {...}
}

export function useAgentExecution(executionId: string) {
  // State
  const [execution, setExecution] = useState<AgentExecution | null>(null)
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Refs for cleanup
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  // Fetch initial data
  const fetchExecution = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/audit?executionId=${executionId}&limit=1`)
      const data = await response.json()

      if (data.success && data.data.executions.length > 0) {
        setExecution(data.data.executions[0])

        if (data.data.executions[0].events) {
          setEvents(data.data.executions[0].events.map(e => e.event))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'))
    } finally {
      setIsLoading(false)
    }
  }, [executionId])

  // WebSocket connection
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

        // Subscribe to execution
        ws.send(JSON.stringify({
          type: 'subscribe',
          executionId
        }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'event' && message.event) {
            const agentEvent: AgentEvent = message.event

            // Add event
            setEvents(prev => [...prev, agentEvent])

            // Update execution based on event
            if (agentEvent.type === 'agent-start') {
              setExecution(prev => prev ? { ...prev, status: 'running' } : null)
            } else if (agentEvent.type === 'agent-complete') {
              setExecution(prev => prev ? {
                ...prev,
                status: 'completed',
                output: agentEvent.output,
                qualityScore: agentEvent.qualityScore,
                completedAt: new Date(agentEvent.timestamp),
                executionTime: agentEvent.executionTime
              } : null)
            } else if (agentEvent.type === 'error') {
              setExecution(prev => prev ? { ...prev, status: 'failed' } : null)
            }
          }
        } catch (err) {
          console.error('Failed to parse message:', err)
        }
      }

      ws.onerror = (err) => {
        console.error('WebSocket error:', err)
        setError(new Error('WebSocket error'))
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null

        // Reconnect with exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
          reconnectAttemptsRef.current++

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting (attempt ${reconnectAttemptsRef.current})`)
            connect()
          }, delay)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect'))
    }
  }, [executionId])

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (wsRef.current) wsRef.current.close()
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  // Initialize
  useEffect(() => {
    fetchExecution()
    connect()

    // Cleanup
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
    reconnect
  }
}
```

**Usage**:

```typescript
function AgentStatusDashboard({ executionId }) {
  const {
    execution,
    events,
    isConnected,
    isLoading,
    error,
    reconnect
  } = useAgentExecution(executionId)

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorState error={error} retry={reconnect} />

  return (
    <div>
      {!isConnected && <ConnectionWarning onReconnect={reconnect} />}
      <AgentCard execution={execution} />
      <Timeline events={events} />
    </div>
  )
}
```

### useAuditTrail Hook

Fetch and manage audit trail data:

```typescript
// /src/hooks/useAuditTrail.ts
import { useState, useEffect } from 'react'

interface AuditTrailFilters {
  departmentId?: string
  agentId?: string
  status?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  page?: number
}

export function useAuditTrail(filters: AuditTrailFilters = {}) {
  const [executions, setExecutions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [pagination, setPagination] = useState({
    totalDocs: 0,
    page: 1,
    totalPages: 1
  })

  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Build query params
        const params = new URLSearchParams()

        if (filters.departmentId) params.append('departmentId', filters.departmentId)
        if (filters.agentId) params.append('agentId', filters.agentId)
        if (filters.status) params.append('status', filters.status)
        if (filters.limit) params.append('limit', filters.limit.toString())
        if (filters.page) params.append('page', filters.page.toString())

        const response = await fetch(`/api/audit?${params}`)
        const data = await response.json()

        if (data.success) {
          setExecutions(data.data.executions)
          setPagination({
            totalDocs: data.data.totalDocs,
            page: data.data.page,
            totalPages: data.data.totalPages
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuditTrail()
  }, [
    filters.departmentId,
    filters.agentId,
    filters.status,
    filters.limit,
    filters.page
  ])

  return {
    executions,
    isLoading,
    error,
    pagination
  }
}
```

## WebSocket State

### Connection Management

```typescript
// WebSocket connection hook
function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setIsConnected(true)
    ws.onmessage = (e) => setLastMessage(JSON.parse(e.data))
    ws.onclose = () => setIsConnected(false)
  }, [url])

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { isConnected, lastMessage, send, reconnect: connect }
}
```

### Event Handling

```typescript
// Handle different event types
useEffect(() => {
  if (lastMessage?.type === 'event') {
    const event = lastMessage.event

    switch (event.type) {
      case 'agent-start':
        setStatus('running')
        break

      case 'tool-call':
        setToolCalls(prev => [...prev, event.data])
        break

      case 'output':
        setOutput(prev => prev + event.data.text)
        break

      case 'agent-complete':
        setStatus('completed')
        setQualityScore(event.qualityScore)
        break

      case 'error':
        setStatus('failed')
        setError(event.message)
        break
    }
  }
}, [lastMessage])
```

## Server State

### Fetching Data

```typescript
// Fetch with error handling
async function fetchData<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Request failed')
    }

    return data.data
  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}

// Usage in component
function DepartmentList() {
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchData('/api/departments')
      .then(data => {
        setDepartments(data.docs)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err)
        setIsLoading(false)
      })
  }, [])

  if (isLoading) return <Spinner />
  if (error) return <Error error={error} />

  return <DepartmentGrid departments={departments} />
}
```

### Mutations

```typescript
// Update data on server
async function updateAgent(agentId: string, updates: Partial<Agent>) {
  const response = await fetch(`/api/agents/${agentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error)
  }

  return data.data
}

// Usage with optimistic update
function AgentCard({ agent }) {
  const [localAgent, setLocalAgent] = useState(agent)
  const [isSaving, setIsSaving] = useState(false)

  const handleToggleActive = async () => {
    // Optimistic update
    setLocalAgent(prev => ({ ...prev, isActive: !prev.isActive }))
    setIsSaving(true)

    try {
      const updated = await updateAgent(agent.id, {
        isActive: !localAgent.isActive
      })

      setLocalAgent(updated)
    } catch (error) {
      // Revert on error
      setLocalAgent(prev => ({ ...prev, isActive: !prev.isActive }))
      console.error('Failed to update:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <span>{localAgent.name}</span>
      <button onClick={handleToggleActive} disabled={isSaving}>
        {localAgent.isActive ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  )
}
```

## Caching Strategies

### In-Memory Cache

```typescript
// Simple cache with TTL
class Cache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private ttl: number

  constructor(ttlSeconds: number = 60) {
    this.ttl = ttlSeconds * 1000
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

// Usage
const agentCache = new Cache<Agent>(300) // 5 minutes

async function getAgent(id: string): Promise<Agent> {
  // Check cache first
  const cached = agentCache.get(id)
  if (cached) return cached

  // Fetch from API
  const agent = await fetchData(`/api/agents/${id}`)

  // Store in cache
  agentCache.set(id, agent)

  return agent
}
```

### LocalStorage Cache

```typescript
// Persist cache to localStorage
class PersistentCache<T> {
  private key: string
  private ttl: number

  constructor(key: string, ttlSeconds: number = 3600) {
    this.key = key
    this.ttl = ttlSeconds * 1000
  }

  get(): T | null {
    try {
      const item = localStorage.getItem(this.key)
      if (!item) return null

      const { data, timestamp } = JSON.parse(item)

      if (Date.now() - timestamp > this.ttl) {
        this.clear()
        return null
      }

      return data
    } catch {
      return null
    }
  }

  set(data: T): void {
    try {
      localStorage.setItem(this.key, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to cache:', error)
    }
  }

  clear(): void {
    localStorage.removeItem(this.key)
  }
}
```

## Optimistic Updates

Update UI immediately, then sync with server:

```typescript
function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [data, setData] = useState(initialData)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = async (optimisticData: T) => {
    // Store current data for rollback
    const previousData = data

    // Optimistic update
    setData(optimisticData)
    setIsUpdating(true)
    setError(null)

    try {
      // Update server
      const serverData = await updateFn(optimisticData)

      // Use server response as source of truth
      setData(serverData)
    } catch (err) {
      // Rollback on error
      setData(previousData)
      setError(err instanceof Error ? err : new Error('Update failed'))
    } finally {
      setIsUpdating(false)
    }
  }

  return { data, isUpdating, error, update }
}

// Usage
function AgentStatus({ agent }) {
  const {
    data: localAgent,
    isUpdating,
    error,
    update
  } = useOptimisticUpdate(agent, (updated) =>
    updateAgent(agent.id, updated)
  )

  const handleToggle = () => {
    update({ ...localAgent, isActive: !localAgent.isActive })
  }

  return (
    <div>
      <button onClick={handleToggle} disabled={isUpdating}>
        {localAgent.isActive ? 'Active' : 'Inactive'}
      </button>
      {error && <span className="error">{error.message}</span>}
    </div>
  )
}
```

## State Synchronization

### Synchronize Local and Server State

```typescript
function useSyncedState<T>(
  key: string,
  fetchFn: () => Promise<T>,
  interval: number = 30000 // 30 seconds
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const sync = useCallback(async () => {
    try {
      const serverData = await fetchFn()
      setData(serverData)
      setLastSync(new Date())
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn])

  // Initial sync
  useEffect(() => {
    sync()
  }, [sync])

  // Periodic sync
  useEffect(() => {
    const timer = setInterval(sync, interval)
    return () => clearInterval(timer)
  }, [sync, interval])

  return { data, isLoading, lastSync, sync }
}
```

## Best Practices

### 1. Separate Concerns

```typescript
// ✅ Good - Separate data fetching from presentation
function useAgents() {
  const [agents, setAgents] = useState([])
  // ... fetch logic
  return { agents }
}

function AgentList() {
  const { agents } = useAgents()
  return agents.map(agent => <AgentCard agent={agent} />)
}

// ❌ Bad - Mixed concerns
function AgentList() {
  const [agents, setAgents] = useState([])
  // fetch logic here
  return agents.map(agent => <AgentCard agent={agent} />)
}
```

### 2. Use Memoization

```typescript
// ✅ Good - Memoize expensive computations
const sortedAgents = useMemo(
  () => agents.sort((a, b) => a.name.localeCompare(b.name)),
  [agents]
)

// ❌ Bad - Recompute every render
const sortedAgents = agents.sort((a, b) => a.name.localeCompare(b.name))
```

### 3. Cleanup Effects

```typescript
// ✅ Good - Cleanup on unmount
useEffect(() => {
  const ws = new WebSocket(url)

  return () => {
    ws.close() // Cleanup
  }
}, [url])

// ❌ Bad - No cleanup, memory leak
useEffect(() => {
  const ws = new WebSocket(url)
  // ws never closes
}, [url])
```

### 4. Handle Loading States

```typescript
// ✅ Good - Show loading indicator
if (isLoading) return <Spinner />
if (error) return <Error error={error} />
return <Content data={data} />

// ❌ Bad - No loading feedback
return <Content data={data} />
```

### 5. Error Boundaries

```typescript
// ✅ Good - Wrap with error boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <AgentDashboard />
</ErrorBoundary>

// ❌ Bad - No error handling
<AgentDashboard />
```

## Next Steps

- Review [Developer Guide](/mnt/d/Projects/aladdin/docs/ui/DEVELOPER_GUIDE.md) for architecture
- Check [API Reference](/mnt/d/Projects/aladdin/docs/ui/API_REFERENCE.md) for endpoints
- See [Examples](/mnt/d/Projects/aladdin/docs/ui/examples/) for implementation patterns
