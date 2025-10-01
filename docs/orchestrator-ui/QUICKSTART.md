# Orchestrator UI - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools socket.io-client
```

### Step 2: Set Up Providers

Create `/src/app/providers.tsx`:

```typescript
'use client'

import { QueryProvider } from '@/lib/react-query'
import { WebSocketProvider } from '@/providers'
import { ProjectProvider } from '@/contexts'
import { ErrorBoundary } from '@/components/errors'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <WebSocketProvider
          url={`ws://localhost:${process.env.NEXT_PUBLIC_WS_PORT || '3001'}`}
          autoConnect={true}
          reconnectInterval={3000}
          maxReconnectAttempts={5}
        >
          <ProjectProvider>
            {children}
          </ProjectProvider>
        </WebSocketProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
```

### Step 3: Update Root Layout

Update `/src/app/layout.tsx`:

```typescript
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### Step 4: Add Environment Variables

Create or update `.env.local`:

```env
NEXT_PUBLIC_WS_PORT=3001
```

### Step 5: Use in Components

#### Fetch Data
```typescript
'use client'

import { useProjects, useProject } from '@/lib/react-query'

export function ProjectList() {
  const { data, isLoading } = useProjects()

  if (isLoading) return <div>Loading...</div>

  return (
    <ul>
      {data?.docs.map(project => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  )
}

export function ProjectDetail({ id }: { id: string }) {
  const { data: project } = useProject(id)

  return (
    <div>
      <h1>{project?.name}</h1>
      <p>{project?.synopsis}</p>
    </div>
  )
}
```

#### Send Messages
```typescript
'use client'

import { useState } from 'react'
import { useSendMessage } from '@/lib/react-query'

export function ChatInput({ projectId }: { projectId: string }) {
  const [message, setMessage] = useState('')
  const { mutate, isLoading } = useSendMessage({
    onSuccess: () => setMessage('')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate({ projectId, message })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        Send
      </button>
    </form>
  )
}
```

#### Real-time Updates
```typescript
'use client'

import { useOrchestratorEvents } from '@/providers'

export function ExecutionMonitor({ executionId }: { executionId: string }) {
  const { events, lastEvent, isConnected } = useOrchestratorEvents({
    executionId,
    eventTypes: ['agent-complete', 'department-complete']
  })

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Events: {events.length}</p>
      {lastEvent && (
        <div>
          <p>Last event: {lastEvent.type}</p>
        </div>
      )}
    </div>
  )
}
```

## 📚 Common Patterns

### Loading States
```typescript
function Component() {
  const { data, isLoading, error } = useProject(id)

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <NotFound />

  return <div>{data.name}</div>
}
```

### Optimistic Updates
```typescript
const { mutate } = useSendMessage({
  onMutate: async (newMessage) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['conversation', id] })

    // Snapshot previous value
    const previous = queryClient.getQueryData(['conversation', id])

    // Optimistically update
    queryClient.setQueryData(['conversation', id], (old) => ({
      ...old,
      messages: [...old.messages, newMessage]
    }))

    return { previous }
  },
  onError: (err, newMessage, context) => {
    // Rollback on error
    queryClient.setQueryData(['conversation', id], context.previous)
  }
})
```

### Debounced Search
```typescript
import { useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useProjects } from '@/lib/react-query'

function SearchProjects() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const { data } = useProjects({ search: debouncedSearch })

  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      {data?.docs.map(project => <div key={project.id}>{project.name}</div>)}
    </>
  )
}
```

### Keyboard Shortcuts
```typescript
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

function Editor() {
  useKeyboardShortcut(handleSave, {
    key: 's',
    modifiers: { ctrl: true },
    preventDefault: true
  })

  useKeyboardShortcut(handleUndo, {
    key: 'z',
    modifiers: { ctrl: true }
  })

  return <div>...</div>
}
```

### Project Context
```typescript
import { useProject } from '@/contexts'

function ProjectDashboard() {
  const {
    currentProject,
    episodes,
    characters,
    setCurrentProjectId,
    refreshProject
  } = useProject()

  return (
    <div>
      <h1>{currentProject?.name}</h1>
      <p>Episodes: {episodes.length}</p>
      <p>Characters: {characters.length}</p>
      <button onClick={refreshProject}>Refresh</button>
    </div>
  )
}
```

### Error Boundaries
```typescript
import { ErrorBoundary } from '@/components/errors'

function Page() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Error:', error, errorInfo)
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  )
}
```

## 🎯 API Reference

### Queries

**Projects:**
- `useProjects(filters?)` - List projects
- `useProject(id)` - Get project detail
- `useProjectActivity(projectId)` - Get activity log
- `useProjectTeam(projectId)` - Get team members

**Episodes:**
- `useEpisodes(projectId?)` - List episodes
- `useEpisode(id)` - Get episode detail

**Characters:**
- `useCharacters(projectId?)` - List characters
- `useCharacter(id)` - Get character detail

**Orchestrator:**
- `useConversations(projectId?)` - List conversations
- `useConversation(id)` - Get conversation detail
- `useExecutions(conversationId?)` - List executions
- `useExecution(id)` - Get execution detail
- `useExecutionEvents(executionId)` - Get execution events

### Mutations

**Orchestrator:**
- `useSendMessage()` - Send message to orchestrator
- `useCreateConversation()` - Create new conversation
- `useDeleteConversation()` - Delete conversation
- `useUpdateExecution()` - Update execution status

### WebSocket Hooks

**Connection:**
- `useWebSocket()` - Access WebSocket connection state
- `useRealtimeUpdates({ executionId, conversationId })` - Subscribe to updates
- `useOrchestratorEvents({ executionId, eventTypes })` - Listen to specific events
- `useOrchestratorEvent(eventType, handler)` - Listen to single event type

### Utility Hooks

**State:**
- `useOptimisticUpdate({ queryKey, updater })` - Optimistic UI updates
- `useLocalStorage(key, initialValue)` - Persistent local storage

**UI:**
- `useDebounce(value, delay)` - Debounced values
- `useInfiniteScroll({ hasNextPage, onLoadMore })` - Infinite scroll
- `useKeyboardShortcut(handler, { key, modifiers })` - Keyboard shortcuts

### Context Hooks

**Project:**
- `useProject()` - Access project context
- `useProjectData()` - Access project data with computed values

## 🐛 Debugging

### React Query DevTools

DevTools are automatically available in development:
- Open: Bottom-right corner
- View: Cached queries, mutations, status

### WebSocket Status

Check connection status:
```typescript
const { connectionState, isConnected } = useWebSocket()
console.log('WS Status:', connectionState)
```

### Query Cache Inspection

```typescript
import { queryClient } from '@/lib/react-query'

// Get cached data
const data = queryClient.getQueryData(['projects', 'detail', id])

// Invalidate cache
queryClient.invalidateQueries({ queryKey: ['projects'] })

// Clear cache
queryClient.clear()
```

## 🔍 Troubleshooting

### "useQuery must be used within QueryClientProvider"
✅ Make sure `Providers` wrapper is in root layout

### WebSocket not connecting
✅ Check `NEXT_PUBLIC_WS_PORT` environment variable
✅ Verify WebSocket server is running at `/api/ws`
✅ Check browser console for connection errors

### Queries not updating
✅ Check query keys are unique
✅ Verify `invalidateQueries` is called after mutations
✅ Check stale time settings

### Real-time events not received
✅ Verify subscription is active with correct IDs
✅ Check WebSocket connection is established
✅ Verify event types match expected types

## 📖 Next Steps

1. **Read Full Documentation:** `/docs/orchestrator-ui/phase-3-state-management.md`
2. **Explore Examples:** Check component patterns above
3. **Review API Endpoints:** Test with REST client
4. **Set Up Testing:** Write tests for queries and mutations
5. **Build UI Components:** Use hooks in your components

## 🆘 Support

- **Documentation:** `/docs/orchestrator-ui/`
- **API Reference:** Phase 3 documentation
- **WebSocket Protocol:** Check `/api/ws` endpoint
- **React Query Docs:** https://tanstack.com/query/latest

---

**Ready to build!** Start with a simple component and add features progressively.
