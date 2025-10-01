# Phase 3: State Management & Real-time - Detailed Plan

**Duration**: 1 week  
**Priority**: High  
**Status**: 📋 Ready to Start  
**Depends On**: Phase 1 & 2 Complete

---

## Overview

Implement comprehensive state management, WebSocket connections for real-time updates, optimistic UI updates, and context management across the application.

---

## Goals

1. ✅ Setup React Query for server state
2. ✅ Implement WebSocket connections
3. ✅ Add optimistic UI updates
4. ✅ Create context providers
5. ✅ Implement real-time notifications
6. ✅ Add offline support
7. ✅ Setup error boundaries

---

## Architecture

```
Client State (Zustand)
├── Layout State (sidebars, view)
├── Orchestrator State (mode, messages)
└── UI State (modals, toasts)

Server State (React Query)
├── Project Data
├── Episodes, Characters, Scenes
├── Conversations
└── Agent Executions

Real-time (WebSocket)
├── Agent Events
├── Task Progress
├── Collaboration Updates
└── Notifications
```

---

## File Structure

```
src/
├── providers/
│   ├── AppProviders.tsx             # Root provider wrapper
│   ├── QueryProvider.tsx            # React Query provider
│   ├── WebSocketProvider.tsx        # WebSocket provider
│   └── ProjectProvider.tsx          # Project context provider
│
├── hooks/
│   ├── queries/
│   │   ├── useProject.ts            # Project queries
│   │   ├── useEpisodes.ts           # Episodes queries
│   │   ├── useCharacters.ts         # Characters queries
│   │   └── useConversations.ts      # Conversations queries
│   ├── mutations/
│   │   ├── useCreateEpisode.ts      # Create episode mutation
│   │   ├── useUpdateCharacter.ts    # Update character mutation
│   │   └── useDeleteScene.ts        # Delete scene mutation
│   ├── realtime/
│   │   ├── useWebSocket.ts          # WebSocket hook
│   │   ├── useAgentEvents.ts        # Agent events subscription
│   │   └── useTaskProgress.ts       # Task progress updates
│   └── useOptimistic.ts             # Optimistic updates helper
│
├── lib/
│   ├── queryClient.ts               # React Query config
│   ├── websocket.ts                 # WebSocket client
│   └── errorHandler.ts              # Global error handler
│
└── components/
    ├── ErrorBoundary.tsx            # Error boundary component
    ├── OfflineIndicator.tsx         # Offline status indicator
    └── NotificationCenter.tsx       # Notification center
```

---

## Implementation Details

### 1. React Query Setup

```typescript
// src/lib/queryClient.ts

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error)
        // Show toast notification
      },
    },
  },
})
```

```typescript
// src/providers/QueryProvider.tsx

'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

### 2. WebSocket Provider

```typescript
// src/lib/websocket.ts

import { io, Socket } from 'socket.io-client'

export class WebSocketClient {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  connect(url: string, options?: any) {
    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      ...options,
    })
    
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected')
      this.reconnectAttempts = 0
    })
    
    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
    })
    
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
    
    return this.socket
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
  
  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data)
    }
  }
  
  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }
  
  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }
}

export const wsClient = new WebSocketClient()
```

```typescript
// src/providers/WebSocketProvider.tsx

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { wsClient } from '@/lib/websocket'
import type { Socket } from 'socket.io-client'

interface WebSocketContextValue {
  socket: Socket | null
  isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextValue>({
  socket: null,
  isConnected: false,
})

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    const ws = wsClient.connect(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001')
    
    ws.on('connect', () => setIsConnected(true))
    ws.on('disconnect', () => setIsConnected(false))
    
    setSocket(ws)
    
    return () => {
      wsClient.disconnect()
    }
  }, [])
  
  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => useContext(WebSocketContext)
```

### 3. Project Context Provider

```typescript
// src/providers/ProjectProvider.tsx

'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'

interface ProjectContextValue {
  project: Project | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({
  projectId,
  children,
}: {
  projectId: string
  children: ReactNode
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  })
  
  return (
    <ProjectContext.Provider
      value={{
        project: data || null,
        isLoading,
        error: error as Error | null,
        refetch,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider')
  }
  return context
}
```

### 4. Query Hooks

```typescript
// src/hooks/queries/useEpisodes.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useEpisodes(projectId: string) {
  return useQuery({
    queryKey: ['episodes', projectId],
    queryFn: () => fetchEpisodes(projectId),
    enabled: !!projectId,
  })
}

export function useEpisode(episodeId: string) {
  return useQuery({
    queryKey: ['episode', episodeId],
    queryFn: () => fetchEpisode(episodeId),
    enabled: !!episodeId,
  })
}

export function useCreateEpisode() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateEpisodeInput) => createEpisode(data),
    onMutate: async (newEpisode) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['episodes', newEpisode.projectId] })
      
      const previousEpisodes = queryClient.getQueryData(['episodes', newEpisode.projectId])
      
      queryClient.setQueryData(['episodes', newEpisode.projectId], (old: any) => ({
        ...old,
        docs: [...(old?.docs || []), { ...newEpisode, id: 'temp-' + Date.now() }],
      }))
      
      return { previousEpisodes }
    },
    onError: (err, newEpisode, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['episodes', newEpisode.projectId],
        context?.previousEpisodes
      )
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['episodes', variables.projectId] })
    },
  })
}
```

### 5. Real-time Hooks

```typescript
// src/hooks/realtime/useAgentEvents.ts

import { useEffect } from 'react'
import { useWebSocket } from '@/providers/WebSocketProvider'
import { useQueryClient } from '@tanstack/react-query'

export function useAgentEvents(executionId: string) {
  const { socket, isConnected } = useWebSocket()
  const queryClient = useQueryClient()
  
  useEffect(() => {
    if (!socket || !isConnected || !executionId) return
    
    // Subscribe to agent events
    socket.emit('subscribe', { executionId })
    
    // Handle agent events
    socket.on('agent-event', (event) => {
      console.log('Agent event:', event)
      
      // Update query cache
      queryClient.setQueryData(['execution', executionId], (old: any) => ({
        ...old,
        events: [...(old?.events || []), event],
      }))
    })
    
    socket.on('agent-complete', (result) => {
      console.log('Agent complete:', result)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['execution', executionId] })
    })
    
    return () => {
      socket.emit('unsubscribe', { executionId })
      socket.off('agent-event')
      socket.off('agent-complete')
    }
  }, [socket, isConnected, executionId, queryClient])
}
```

### 6. Error Boundary

```typescript
// src/components/ErrorBoundary.tsx

'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo)
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

### 7. Root Providers

```typescript
// src/providers/AppProviders.tsx

'use client'

import { QueryProvider } from './QueryProvider'
import { WebSocketProvider } from './WebSocketProvider'
import { ProjectProvider } from './ProjectProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from 'sonner'

export function AppProviders({
  children,
  projectId,
}: {
  children: React.ReactNode
  projectId?: string
}) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <WebSocketProvider>
          {projectId ? (
            <ProjectProvider projectId={projectId}>
              {children}
            </ProjectProvider>
          ) : (
            children
          )}
          <Toaster position="top-right" />
        </WebSocketProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
```

---

## Tasks Breakdown

### Day 1: React Query Setup
- [ ] Install dependencies
- [ ] Configure query client
- [ ] Create QueryProvider
- [ ] Setup devtools

### Day 2: Query Hooks
- [ ] Create project queries
- [ ] Add episode queries
- [ ] Implement character queries
- [ ] Add mutation hooks

### Day 3: WebSocket Integration
- [ ] Setup WebSocket client
- [ ] Create WebSocketProvider
- [ ] Implement connection handling
- [ ] Add reconnection logic

### Day 4: Real-time Hooks
- [ ] Create agent events hook
- [ ] Add task progress hook
- [ ] Implement notification system
- [ ] Test real-time updates

### Day 5: Error Handling & Polish
- [ ] Add error boundary
- [ ] Implement offline indicator
- [ ] Add optimistic updates
- [ ] Test error scenarios
- [ ] Performance optimization

---

## Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-query-devtools": "^5.17.0",
    "socket.io-client": "^4.6.1",
    "sonner": "^1.3.1"
  }
}
```

---

## Success Criteria

- ✅ React Query operational
- ✅ WebSocket connections stable
- ✅ Real-time updates working
- ✅ Optimistic UI functional
- ✅ Error handling robust
- ✅ Offline support working
- ✅ No memory leaks
- ✅ Performance optimized

---

**Next**: Phase 4 - Polish & Testing

