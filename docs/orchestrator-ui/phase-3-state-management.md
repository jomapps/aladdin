# Orchestrator UI - Phase 3: State Management & Real-time

## Overview

Phase 3 implements comprehensive state management with React Query and real-time WebSocket connections for the Aladdin Orchestrator UI.

## Architecture

### 1. React Query (TanStack Query v5)

#### Configuration (`/src/lib/react-query/`)

**Client Configuration:**
- Stale time: 5 minutes
- Cache time: 10 minutes
- Automatic retries with exponential backoff
- Refetch on window focus
- Optimistic updates support

**Query Keys Factory:**
```typescript
import { queryKeys } from '@/lib/react-query'

// Projects
queryKeys.projects.all
queryKeys.projects.detail(id)
queryKeys.projects.activity(id)

// Episodes
queryKeys.episodes.list(projectId)
queryKeys.episodes.detail(id)

// Characters
queryKeys.characters.list(projectId)

// Orchestrator
queryKeys.conversations.list(projectId)
queryKeys.executions.detail(id)
```

#### Queries

**Projects:**
```typescript
import { useProjects, useProject, useProjectActivity } from '@/lib/react-query'

function ProjectList() {
  const { data, isLoading } = useProjects({ status: 'active' })
  return <div>...</div>
}
```

**Episodes:**
```typescript
import { useEpisodes, useEpisode } from '@/lib/react-query'

function EpisodeList({ projectId }) {
  const { data } = useEpisodes(projectId)
  return <div>...</div>
}
```

**Orchestrator:**
```typescript
import { useConversations, useExecution } from '@/lib/react-query'

function OrchestratorPanel() {
  const { data: conversations } = useConversations(projectId)
  const { data: execution } = useExecution(executionId)
  return <div>...</div>
}
```

#### Mutations

**Send Message:**
```typescript
import { useSendMessage } from '@/lib/react-query'

function ChatInput() {
  const { mutate, isLoading } = useSendMessage({
    onSuccess: (data) => {
      console.log('Message sent:', data)
    }
  })

  const handleSend = () => {
    mutate({
      projectId: 'proj-123',
      message: 'Generate a new character',
      conversationId: 'conv-456'
    })
  }
}
```

**Create Conversation:**
```typescript
import { useCreateConversation } from '@/lib/react-query'

const { mutate } = useCreateConversation({
  onSuccess: (data) => {
    console.log('Created:', data.conversation)
  }
})

mutate({ projectId: 'proj-123', title: 'New Chat' })
```

### 2. WebSocket Provider

#### Setup (`/src/providers/WebSocketProvider.tsx`)

**Features:**
- Automatic connection management
- Reconnection with exponential backoff
- Heartbeat/ping-pong
- Subscription management
- Type-safe event handlers

**Usage:**
```typescript
import { WebSocketProvider } from '@/providers'

function App() {
  return (
    <WebSocketProvider
      url="ws://localhost:3001"
      autoConnect={true}
      reconnectInterval={3000}
      maxReconnectAttempts={5}
    >
      {children}
    </WebSocketProvider>
  )
}
```

#### Hooks

**useWebSocket:**
```typescript
import { useWebSocket } from '@/providers'

function ConnectionStatus() {
  const { isConnected, connectionState, reconnect } = useWebSocket()

  return (
    <div>
      Status: {connectionState}
      {!isConnected && <button onClick={reconnect}>Reconnect</button>}
    </div>
  )
}
```

**useRealtimeUpdates:**
```typescript
import { useRealtimeUpdates } from '@/providers'

function ExecutionMonitor({ executionId }) {
  const { isConnected } = useRealtimeUpdates({
    executionId,
    onEvent: (event) => {
      console.log('Event:', event.type)
    }
  })

  return <div>Connected: {isConnected}</div>
}
```

**useOrchestratorEvents:**
```typescript
import { useOrchestratorEvents } from '@/providers'

function EventLog({ executionId }) {
  const { events, lastEvent, eventCounts } = useOrchestratorEvents({
    executionId,
    eventTypes: ['agent-complete', 'department-complete']
  })

  return (
    <div>
      <p>Total events: {events.length}</p>
      <p>Last: {lastEvent?.type}</p>
    </div>
  )
}
```

**useOrchestratorEvent (specific event):**
```typescript
import { useOrchestratorEvent } from '@/providers'

function QualityMonitor({ executionId }) {
  useOrchestratorEvent(
    'quality-check',
    (event) => {
      console.log('Quality:', event.scores.overall)
    },
    { executionId }
  )
}
```

### 3. Project Context

#### Setup (`/src/contexts/ProjectContext.tsx`)

**Features:**
- Current project state
- Auto-fetch related data
- LocalStorage persistence
- Computed values

**Usage:**
```typescript
import { ProjectProvider, useProject } from '@/contexts'

function App() {
  return (
    <ProjectProvider initialProjectId="proj-123">
      {children}
    </ProjectProvider>
  )
}

function ProjectDashboard() {
  const {
    currentProject,
    episodes,
    characters,
    setCurrentProjectId,
    refreshProject
  } = useProject()

  return <div>...</div>
}
```

**useProjectData (with computed values):**
```typescript
import { useProjectData } from '@/contexts'

function ProjectStats() {
  const {
    totalEpisodes,
    totalCharacters,
    episodeStats,
    averageEpisodeQuality,
    overallProgress,
    projectHealth
  } = useProjectData()

  return (
    <div>
      <p>Episodes: {totalEpisodes}</p>
      <p>Quality: {averageEpisodeQuality.toFixed(2)}</p>
      <p>Progress: {overallProgress}%</p>
    </div>
  )
}
```

### 4. Custom Hooks

#### useOptimisticUpdate
```typescript
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate'

const { mutate } = useOptimisticUpdate({
  queryKey: ['projects', 'detail', projectId],
  updater: (old, variables) => ({
    ...old,
    name: variables.name
  }),
  onError: (error) => console.error(error)
})

mutate({ name: 'New Name' }, updateProjectAPI)
```

#### useDebounce
```typescript
import { useDebounce } from '@/hooks/useDebounce'

function SearchInput() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  // Use debouncedSearch for API calls
  useEffect(() => {
    fetchResults(debouncedSearch)
  }, [debouncedSearch])
}
```

#### useInfiniteScroll
```typescript
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

function InfiniteList() {
  const { observerTarget } = useInfiniteScroll({
    hasNextPage: true,
    isLoading: false,
    onLoadMore: () => fetchNextPage()
  })

  return (
    <div>
      {items.map(item => <Item key={item.id} />)}
      <div ref={observerTarget} />
    </div>
  )
}
```

#### useKeyboardShortcut
```typescript
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

function Editor() {
  useKeyboardShortcut(
    () => handleSave(),
    { key: 's', modifiers: { ctrl: true } }
  )

  useKeyboardShortcut(
    () => handleUndo(),
    { key: 'z', modifiers: { ctrl: true } }
  )
}
```

#### useLocalStorage
```typescript
import { useLocalStorage } from '@/hooks/useLocalStorage'

function Settings() {
  const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light')

  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark
    </button>
  )
}
```

### 5. Error Boundaries

#### ErrorBoundary
```typescript
import { ErrorBoundary } from '@/components/errors'

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to Sentry
        console.error(error, errorInfo)
      }}
      resetKeys={[projectId]}
    >
      <YourComponent />
    </ErrorBoundary>
  )
}
```

#### Custom Fallback
```typescript
import { ErrorBoundary, MinimalErrorFallback } from '@/components/errors'

<ErrorBoundary
  fallback={
    <MinimalErrorFallback
      error={error}
      onReset={() => refetch()}
    />
  }
>
  <Component />
</ErrorBoundary>
```

#### NotFound
```typescript
import { NotFound, ResourceNotFound } from '@/components/errors'

function ProjectPage() {
  if (!project) {
    return (
      <ResourceNotFound
        resourceType="Project"
        resourceId={projectId}
      />
    )
  }
}
```

## Complete Setup Example

```typescript
// app/layout.tsx or app/providers.tsx
'use client'

import { QueryProvider } from '@/lib/react-query'
import { WebSocketProvider } from '@/providers'
import { ProjectProvider } from '@/contexts'
import { ErrorBoundary } from '@/components/errors'

export function Providers({ children }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <WebSocketProvider
          url={`ws://localhost:${process.env.NEXT_PUBLIC_WS_PORT || '3001'}`}
          autoConnect={true}
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

## WebSocket Events

### Event Types

**Orchestration Events:**
- `orchestration-start` - Master orchestrator begins
- `orchestration-complete` - All departments finished

**Department Events:**
- `department-start` - Department head begins
- `department-complete` - Department finished

**Agent Events:**
- `agent-start` - Agent begins execution
- `agent-thinking` - Agent processing
- `agent-complete` - Agent finished

**Quality Events:**
- `quality-check` - Quality validation
- `review-status` - Department review

**Tool Events:**
- `tool-call` - Agent invokes tool
- `tool-result` - Tool execution complete

**Error Events:**
- `error` - Error occurred

### Subscription Protocol

**Subscribe to execution:**
```typescript
ws.send(JSON.stringify({
  type: 'subscribe',
  executionId: 'exec-123'
}))
```

**Subscribe to conversation:**
```typescript
ws.send(JSON.stringify({
  type: 'subscribe',
  conversationId: 'conv-456'
}))
```

**Unsubscribe:**
```typescript
ws.send(JSON.stringify({
  type: 'unsubscribe',
  executionId: 'exec-123'
}))
```

## API Endpoints

### Projects
- `GET /api/v1/projects` - List projects
- `GET /api/v1/projects/:id` - Get project
- `GET /api/v1/projects/:id/activity` - Get activity
- `GET /api/v1/projects/:id/team` - Get team

### Episodes
- `GET /api/v1/episodes?where[project][equals]=:id` - List by project
- `GET /api/v1/episodes/:id` - Get episode

### Conversations
- `POST /api/v1/chat/conversation` - Create conversation
- `GET /api/v1/chat/:id` - Get conversation
- `POST /api/v1/chat/:id` - Send message
- `DELETE /api/v1/chat/:id` - Delete conversation

### Executions
- `GET /api/v1/executions?where[conversation][equals]=:id` - List by conversation
- `GET /api/v1/executions/:id` - Get execution
- `GET /api/v1/executions/:id/events` - Get events

## Performance Optimizations

### Query Configuration
- Stale time: 5 minutes (data considered fresh)
- Cache time: 10 minutes (keep in cache)
- Auto-retry with exponential backoff
- Refetch on window focus

### WebSocket
- Automatic reconnection
- Heartbeat every 30 seconds
- Client timeout: 60 seconds
- Exponential backoff for reconnection

### Optimistic Updates
- Instant UI feedback
- Automatic rollback on error
- Query invalidation after success

## Next Steps

1. **Install Dependencies:**
   ```bash
   pnpm add @tanstack/react-query @tanstack/react-query-devtools socket.io-client
   ```

2. **Update Root Layout:**
   Add providers to `app/layout.tsx`

3. **Environment Variables:**
   ```env
   NEXT_PUBLIC_WS_PORT=3001
   ```

4. **Start WebSocket Server:**
   The WebSocket server starts automatically at `/api/ws`

## Testing

### Query Testing
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProjects } from '@/lib/react-query'

test('fetches projects', async () => {
  const queryClient = new QueryClient()
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  const { result } = renderHook(() => useProjects(), { wrapper })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data?.docs).toHaveLength(5)
})
```

### WebSocket Testing
```typescript
import { renderHook } from '@testing-library/react'
import { WebSocketProvider, useWebSocket } from '@/providers'

test('connects to WebSocket', async () => {
  const wrapper = ({ children }) => (
    <WebSocketProvider url="ws://localhost:3001">
      {children}
    </WebSocketProvider>
  )

  const { result } = renderHook(() => useWebSocket(), { wrapper })

  await waitFor(() => expect(result.current.isConnected).toBe(true))
})
```

## Troubleshooting

### React Query Not Updating
- Check query keys are unique
- Verify invalidation logic
- Check stale/cache time settings

### WebSocket Not Connecting
- Verify WS_PORT environment variable
- Check WebSocket server is running
- Verify firewall settings

### Events Not Received
- Verify subscription is active
- Check executionId/conversationId
- Verify event types match

## Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
