# Orchestrator UI - Technical Architecture Specification

**Version**: 1.0.0
**Date**: 2025-10-01
**Status**: 🎯 Architecture Review Complete
**Author**: System Architect Agent

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Hierarchy](#component-hierarchy)
3. [State Management Architecture](#state-management-architecture)
4. [API Contracts](#api-contracts)
5. [WebSocket Event Specifications](#websocket-event-specifications)
6. [Real-time Data Flow](#real-time-data-flow)
7. [Integration Points](#integration-points)
8. [Performance Optimization](#performance-optimization)
9. [Security Considerations](#security-considerations)
10. [Deployment Architecture](#deployment-architecture)

---

## Architecture Overview

### System Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Aladdin Platform                             │
│                                                                       │
│  ┌─────────────────┐     ┌──────────────────┐    ┌───────────────┐ │
│  │  Next.js 15     │────▶│  Orchestrator    │───▶│  Agent System │ │
│  │  Frontend       │     │  API Layer       │    │  (7 Depts)    │ │
│  │  (React 19)     │◀────│  (REST + SSE)    │◀───│  + Codebuff   │ │
│  └─────────────────┘     └──────────────────┘    └───────────────┘ │
│         │                         │                        │         │
│         │                         │                        │         │
│  ┌─────▼──────┐          ┌───────▼────────┐      ┌───────▼──────┐  │
│  │ WebSocket  │          │  Payload CMS   │      │ Brain Service│  │
│  │ Events     │          │  (PostgreSQL)  │      │ (RAG + Graph)│  │
│  └────────────┘          └────────────────┘      └──────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 15 (App Router) | SSR, routing, API routes |
| **UI Library** | React 19 | Component rendering |
| **Styling** | Tailwind CSS | Utility-first styling |
| **UI Components** | shadcn/ui + @kokonutui | Pre-built components |
| **Client State** | Zustand | Layout & orchestrator state |
| **Server State** | React Query (TanStack) | API data caching |
| **Real-time** | Socket.io + EventSource | WebSocket + SSE streaming |
| **Animations** | Framer Motion | Smooth transitions |
| **Backend** | Payload CMS 3.0 | Data persistence |
| **Database** | PostgreSQL | Relational data |
| **Agent System** | Codebuff SDK | LLM orchestration |
| **Brain Service** | Custom FastAPI | RAG + knowledge graph |

---

## Component Hierarchy

### Complete Component Tree

```
app/
└── (frontend)/
    └── dashboard/
        └── project/
            └── [id]/
                └── layout.tsx ─────────────────── AppProviders wrapper
                    │
                    ├── AppLayout.tsx ───────────── Main layout orchestrator
                    │   │
                    │   ├── TopMenuBar/
                    │   │   ├── ProjectSelector.tsx
                    │   │   ├── Breadcrumbs.tsx
                    │   │   ├── GlobalSearch.tsx
                    │   │   ├── Notifications.tsx
                    │   │   └── UserMenu.tsx
                    │   │
                    │   ├── LeftSidebar/
                    │   │   ├── Navigation.tsx
                    │   │   ├── QuickActions.tsx
                    │   │   ├── RecentItems.tsx
                    │   │   └── ProjectTools.tsx
                    │   │
                    │   ├── MainContent/
                    │   │   └── {children} ──────── Dynamic route content
                    │   │
                    │   └── RightOrchestrator/
                    │       ├── ModeSelector.tsx
                    │       ├── ChatArea.tsx
                    │       │   ├── MessageList.tsx
                    │       │   │   ├── Message.tsx
                    │       │   │   ├── StreamingMessage.tsx
                    │       │   │   ├── CodeBlock.tsx
                    │       │   │   ├── DataPreview.tsx
                    │       │   │   ├── TaskProgress.tsx
                    │       │   │   └── QueryResults.tsx
                    │       │   └── StreamingIndicator.tsx
                    │       ├── MessageInput.tsx
                    │       └── modes/
                    │           ├── QueryMode.tsx
                    │           ├── DataMode.tsx
                    │           ├── TaskMode.tsx
                    │           └── ChatMode.tsx
                    │
                    └── providers/
                        ├── QueryProvider.tsx ────── React Query
                        ├── WebSocketProvider.tsx ── Socket.io
                        └── ProjectProvider.tsx ──── Project context
```

### Component Responsibility Matrix

| Component | Responsibility | State Access | External APIs |
|-----------|---------------|--------------|---------------|
| `AppLayout` | Layout orchestration | Zustand (layout) | None |
| `TopMenuBar` | Global navigation | Zustand (layout, user) | Search API |
| `LeftSidebar` | Primary navigation | Zustand (layout) | None |
| `RightOrchestrator` | Chat interface | Zustand (orchestrator) | Orchestrator API |
| `ModeSelector` | Mode switching | Zustand (orchestrator) | None |
| `ChatArea` | Message display | Zustand (orchestrator) | None |
| `MessageInput` | User input | Zustand (orchestrator) | Orchestrator API |
| `QueryMode` | Query-specific UI | React Query | Query API |
| `DataMode` | Data ingestion UI | React Query | Ingest API |
| `TaskMode` | Task execution UI | React Query + WS | Task API + Events |
| `ChatMode` | General chat UI | Zustand | Chat API |

---

## State Management Architecture

### 1. Client State (Zustand)

```typescript
// src/stores/layoutStore.ts
interface LayoutState {
  // Sidebar states
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean

  // View state
  currentView: string

  // Actions
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setCurrentView: (view: string) => void
}

// Persistence: localStorage
// TTL: Never expires
// Keys: 'layout-storage'
```

```typescript
// src/stores/orchestratorStore.ts
interface OrchestratorState {
  // Mode state
  currentMode: 'query' | 'data' | 'task' | 'chat'

  // Conversation state
  conversationId: string | null
  messages: Message[]
  isStreaming: boolean
  currentStreamingMessage: string

  // Task state
  currentTask: TaskProgress | null

  // Actions
  setMode: (mode: OrchestratorMode) => void
  addMessage: (message: Message) => void
  updateStreamingMessage: (content: string) => void
  setIsStreaming: (streaming: boolean) => void
  clearMessages: () => void
}

// Persistence: localStorage (last 50 messages)
// TTL: Never expires
// Keys: 'orchestrator-storage'
```

### 2. Server State (React Query)

```typescript
// Query Keys Structure
const queryKeys = {
  // Projects
  project: (id: string) => ['project', id],
  projects: () => ['projects'],

  // Episodes
  episodes: (projectId: string) => ['episodes', projectId],
  episode: (id: string) => ['episode', id],

  // Characters
  characters: (projectId: string) => ['characters', projectId],
  character: (id: string) => ['character', id],

  // Scenes
  scenes: (episodeId: string) => ['scenes', episodeId],
  scene: (id: string) => ['scene', id],

  // Locations
  locations: (projectId: string) => ['locations', projectId],
  location: (id: string) => ['location', id],

  // Conversations (Orchestrator)
  conversations: (projectId: string) => ['conversations', projectId],
  conversation: (id: string) => ['conversation', id],

  // Agent Executions
  executions: (projectId: string) => ['executions', projectId],
  execution: (id: string) => ['execution', id],
}

// Cache Configuration
const queryConfig = {
  staleTime: 5 * 60 * 1000,      // 5 minutes
  gcTime: 30 * 60 * 1000,        // 30 minutes
  retry: 3,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
}
```

### 3. Context Providers

```typescript
// src/providers/ProjectProvider.tsx
interface ProjectContextValue {
  project: Project | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

// Provides project context to all components within project route
// Automatically fetches project data based on URL param
```

### State Management Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     State Management Layers                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  UI Layer (React Components)                              │  │
│  └────┬─────────────────────┬──────────────────────┬────────┘  │
│       │                     │                      │            │
│       │                     │                      │            │
│  ┌────▼─────────┐   ┌──────▼──────┐   ┌──────────▼─────────┐  │
│  │   Zustand    │   │ React Query │   │  WebSocket Events  │  │
│  │  (Client)    │   │  (Server)   │   │   (Real-time)      │  │
│  └────┬─────────┘   └──────┬──────┘   └──────────┬─────────┘  │
│       │                     │                      │            │
│       │                     │                      │            │
│  ┌────▼─────────────────────▼──────────────────────▼─────────┐ │
│  │             localStorage / SessionStorage                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Contracts

### Base URL Structure

```
Production:  https://aladdin.app/api/v1
Development: http://localhost:3000/api/v1
```

### 1. Chat Endpoint (All Modes)

**Endpoint**: `POST /api/v1/orchestrator/chat`

**Request Body**:
```typescript
interface ChatRequest {
  content: string              // User message
  mode: OrchestratorMode       // 'query' | 'data' | 'task' | 'chat'
  projectId: string            // Current project ID
  conversationId?: string      // Optional conversation ID for history
  metadata?: {
    contextEntities?: string[] // IDs of related entities
    suggestedDepartments?: string[]
  }
}
```

**Response**:
```typescript
interface ChatResponse {
  messageId: string
  conversationId: string
  content: string
  mode: OrchestratorMode
  metadata?: {
    departments?: string[]     // Departments involved
    entities?: any[]           // Created/modified entities
    qualityScore?: number      // Overall quality (0-1)
    recommendation?: 'ingest' | 'modify' | 'discard'
  }
  timestamp: string
}
```

**Error Response**:
```typescript
interface ErrorResponse {
  error: string
  code: 'INVALID_MODE' | 'MISSING_PROJECT' | 'AGENT_ERROR' | 'VALIDATION_ERROR'
  details?: any
}
```

### 2. Query Mode Endpoint

**Endpoint**: `POST /api/v1/orchestrator/query`

**Request Body**:
```typescript
interface QueryRequest {
  query: string                // Natural language query
  projectId: string
  filters?: {
    entityTypes?: string[]     // ['character', 'scene', etc.]
    dateRange?: { start: string; end: string }
    tags?: string[]
  }
  limit?: number               // Max results (default: 20)
}
```

**Response**:
```typescript
interface QueryResponse {
  results: QueryResult[]
  total: number
  queryAnalysis: {
    intent: string
    entities: string[]
    confidence: number
  }
}

interface QueryResult {
  id: string
  type: string                 // Entity type
  title: string
  excerpt: string
  relevanceScore: number       // 0-1
  metadata: Record<string, any>
  relationships: {
    type: string
    target: string
    targetType: string
  }[]
}
```

### 3. Data Ingestion Endpoint

**Endpoint**: `POST /api/v1/orchestrator/ingest`

**Request Body**:
```typescript
interface IngestRequest {
  content: string              // Data description or raw data
  projectId: string
  suggestedType?: string       // 'character', 'scene', etc.
  autoIngest?: boolean         // Skip confirmation if quality > 0.75
  enrichmentLevel?: 'minimal' | 'standard' | 'comprehensive'
}
```

**Response**:
```typescript
interface IngestResponse {
  preview: {
    entityType: string
    parsedData: Record<string, any>
    suggestedRelationships: {
      type: string
      target: string
      confidence: number
    }[]
  }
  validation: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
  qualityScores: {
    dataCompleteness: number
    brainConsistency: number
    relationshipQuality: number
    overall: number
  }
  recommendation: 'ingest' | 'modify' | 'discard'
  reasoning: string
  departmentsInvolved: string[]
}
```

### 4. Task Execution Endpoint

**Endpoint**: `POST /api/v1/orchestrator/task`

**Request Body**:
```typescript
interface TaskRequest {
  task: string                 // Task description
  projectId: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  async?: boolean              // Execute asynchronously
  departments?: string[]       // Suggested departments
}
```

**Response**:
```typescript
interface TaskResponse {
  taskId: string
  status: 'queued' | 'running' | 'complete' | 'failed'
  progress: {
    currentStep: number
    totalSteps: number
    percentage: number
    description: string
  }
  departments: {
    name: string
    status: 'pending' | 'running' | 'complete' | 'failed'
    relevance: number
    outputs: any[]
  }[]
  estimatedCompletion?: string  // ISO timestamp
  websocketChannel: string      // For real-time updates
}
```

### 5. Streaming Endpoint (SSE)

**Endpoint**: `GET /api/v1/orchestrator/stream?conversationId={id}`

**SSE Event Types**:
```typescript
// Event: message
interface StreamStartEvent {
  type: 'start'
  messageId: string
  mode: OrchestratorMode
}

interface StreamChunkEvent {
  type: 'chunk'
  content: string              // Incremental content
  delta: string                // New characters only
}

interface StreamCompleteEvent {
  type: 'complete'
  messageId: string
  content: string              // Full message
  mode: OrchestratorMode
  metadata?: any
}

interface StreamErrorEvent {
  type: 'error'
  error: string
  code: string
}
```

### 6. Project Data Endpoints (React Query)

```typescript
// GET /api/v1/projects/{id}
interface ProjectResponse {
  id: string
  name: string
  slug: string
  type: 'movie' | 'series'
  status: 'active' | 'paused' | 'archived'
  metadata: ProjectMetadata
  stats: {
    episodes: number
    characters: number
    scenes: number
    locations: number
  }
}

// GET /api/v1/projects/{id}/episodes
interface EpisodesResponse {
  docs: Episode[]
  totalDocs: number
  limit: number
  page: number
  hasNextPage: boolean
}

// POST /api/v1/projects/{id}/characters
interface CreateCharacterRequest {
  name: string
  description?: string
  metadata?: CharacterMetadata
}

interface CreateCharacterResponse {
  id: string
  name: string
  slug: string
  createdAt: string
}
```

---

## WebSocket Event Specifications

### Connection Setup

```typescript
// Client connection
const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
  transports: ['websocket'],
  auth: {
    token: sessionToken,
    projectId: currentProjectId,
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
})
```

### Event Categories

#### 1. Agent Events

```typescript
// Client → Server: Subscribe to agent execution
socket.emit('subscribe:execution', {
  executionId: string
  departments?: string[]       // Filter by departments
})

// Server → Client: Agent started
interface AgentStartedEvent {
  type: 'agent:started'
  agentId: string
  department: string
  timestamp: string
}

// Server → Client: Agent progress
interface AgentProgressEvent {
  type: 'agent:progress'
  agentId: string
  step: {
    number: number
    total: number
    description: string
    status: 'pending' | 'running' | 'complete'
  }
  timestamp: string
}

// Server → Client: Agent tool call
interface AgentToolCallEvent {
  type: 'agent:tool_call'
  agentId: string
  tool: string
  input: any
  timestamp: string
}

// Server → Client: Agent complete
interface AgentCompleteEvent {
  type: 'agent:complete'
  agentId: string
  department: string
  result: any
  qualityScore: number
  timestamp: string
}

// Server → Client: Agent error
interface AgentErrorEvent {
  type: 'agent:error'
  agentId: string
  error: string
  recoverable: boolean
  timestamp: string
}
```

#### 2. Task Events

```typescript
// Server → Client: Task status update
interface TaskUpdateEvent {
  type: 'task:update'
  taskId: string
  status: 'queued' | 'running' | 'complete' | 'failed'
  progress: number             // 0-100
  currentDepartment?: string
  timestamp: string
}

// Server → Client: Department complete
interface DepartmentCompleteEvent {
  type: 'department:complete'
  taskId: string
  department: string
  outputs: any[]
  qualityScore: number
  timestamp: string
}
```

#### 3. Collaboration Events

```typescript
// Server → Client: User joined
interface UserJoinedEvent {
  type: 'user:joined'
  userId: string
  userName: string
  projectId: string
}

// Server → Client: Entity updated
interface EntityUpdatedEvent {
  type: 'entity:updated'
  entityType: string
  entityId: string
  changes: any
  userId: string
  timestamp: string
}
```

#### 4. Notification Events

```typescript
// Server → Client: System notification
interface NotificationEvent {
  type: 'notification'
  level: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  action?: {
    label: string
    url: string
  }
  timestamp: string
}
```

### Event Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     WebSocket Event Flow                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client                          Server                         │
│    │                                │                           │
│    │ connect()                      │                           │
│    ├───────────────────────────────▶│                           │
│    │                                │ Authenticate              │
│    │ connected                      │                           │
│    │◀───────────────────────────────┤                           │
│    │                                │                           │
│    │ subscribe:execution            │                           │
│    ├───────────────────────────────▶│                           │
│    │                                │ Register listener         │
│    │                                │                           │
│    │ agent:started                  │                           │
│    │◀───────────────────────────────┤                           │
│    │                                │                           │
│    │ agent:progress (multiple)      │                           │
│    │◀───────────────────────────────┤                           │
│    │                                │                           │
│    │ agent:tool_call (multiple)     │                           │
│    │◀───────────────────────────────┤                           │
│    │                                │                           │
│    │ agent:complete                 │                           │
│    │◀───────────────────────────────┤                           │
│    │                                │                           │
│    │ task:update                    │                           │
│    │◀───────────────────────────────┤                           │
│    │                                │                           │
│    │ unsubscribe:execution          │                           │
│    ├───────────────────────────────▶│                           │
│    │                                │ Remove listener           │
│    │                                │                           │
└────────────────────────────────────────────────────────────────┘
```

---

## Real-time Data Flow

### Data Flow Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                      Data Flow Layers                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  UI Components (React)                                       │ │
│  │  - Display streaming messages                                │ │
│  │  - Show task progress                                        │ │
│  │  - Update entity data                                        │ │
│  └────┬──────────────────────────────────────────────┬──────────┘ │
│       │                                              │             │
│       │ Read                                    Write│             │
│       │                                              │             │
│  ┌────▼────────────────┐                  ┌─────────▼──────────┐  │
│  │  Zustand Stores     │                  │  React Query       │  │
│  │  - Layout state     │                  │  - Mutations       │  │
│  │  - Orchestrator UI  │                  │  - Cache updates   │  │
│  └────┬────────────────┘                  └─────────┬──────────┘  │
│       │                                              │             │
│       │ Subscribe                              Fetch/Mutate       │
│       │                                              │             │
│  ┌────▼──────────────────────────────────────────────▼─────────┐  │
│  │  Data Sources                                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │  │
│  │  │  WebSocket   │  │  SSE Stream  │  │  REST API        │ │  │
│  │  │  Events      │  │  (Streaming) │  │  (CRUD)          │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

### Query Mode Data Flow

```
User Query → Query API → Master Orchestrator → Brain Service
                            ↓
            Department Router (calculate relevance)
                            ↓
            ParallelExecutor (execute relevant departments)
                            ↓
            ResultAggregator (compile results)
                            ↓
            Response with QueryResults → UI Display
```

### Data Ingestion Data Flow

```
User Input → Ingest API → DataPreparationAgent
                              ↓
              ContextGatherer (fetch project context)
                              ↓
              DataEnricher (LLM enrichment)
                              ↓
              RelationshipDiscoverer (find connections)
                              ↓
              BrainDocumentValidator (quality gates)
                              ↓
              Preview Response → User Confirmation
                              ↓
         (if confirmed) → Save to Payload + Brain
                              ↓
         WebSocket Event → Real-time UI Update
```

### Task Execution Data Flow

```
Task Request → Task API → Master Orchestrator
                              ↓
              DependencyResolver (build execution graph)
                              ↓
              ParallelExecutor (spawn departments)
                              ↓
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
   Department 1                              Department 2
   (Specialists)                             (Specialists)
         │                                         │
         │ WebSocket: agent:progress               │
         │◀───────────────────────────────────────▶│
         │                                         │
         └────────────────────┬────────────────────┘
                              ▼
              ResultAggregator (compile outputs)
                              ▼
              Quality Validation (Brain service)
                              ▼
              Final Response → UI Display
```

### Optimistic Update Pattern

```typescript
// Example: Creating a new character with optimistic update

// 1. User submits form
const { mutate } = useCreateCharacter()

mutate(newCharacter, {
  // 2. Optimistically add to cache
  onMutate: async (data) => {
    await queryClient.cancelQueries(['characters', projectId])

    const previous = queryClient.getQueryData(['characters', projectId])

    queryClient.setQueryData(['characters', projectId], (old) => ({
      ...old,
      docs: [...old.docs, { ...data, id: 'temp-' + Date.now() }]
    }))

    return { previous }
  },

  // 3. On error, rollback
  onError: (err, data, context) => {
    queryClient.setQueryData(['characters', projectId], context.previous)
    toast.error('Failed to create character')
  },

  // 4. On success, invalidate and refetch
  onSuccess: (result) => {
    queryClient.invalidateQueries(['characters', projectId])
    toast.success('Character created!')
  }
})
```

---

## Integration Points

### 1. Existing Agent System Integration

**Location**: `/src/lib/agents/orchestrator.ts`

```typescript
// UI calls orchestrator through API route
// API route uses existing orchestrator.ts functions

// src/app/api/v1/orchestrator/chat/route.ts
import { handleUserRequest } from '@/lib/agents/orchestrator'

export async function POST(request: NextRequest) {
  const { content, mode, projectId } = await request.json()

  // Route based on mode
  if (mode === 'query') {
    // Use Brain service for queries
    return queryBrainService(content, projectId)
  }

  if (mode === 'data') {
    // Use DataPreparationAgent for ingestion
    return handleDataIngestion(content, projectId)
  }

  if (mode === 'task') {
    // Use existing orchestrator for task execution
    const result = await handleUserRequest({
      projectSlug: project.slug,
      userPrompt: content,
    })
    return NextResponse.json(result)
  }

  if (mode === 'chat') {
    // Use general LLM for non-project chat
    return handleGeneralChat(content)
  }
}
```

### 2. Data Preparation Agent Integration

**Location**: `/src/lib/agents/data-preparation/`

```typescript
// Data Mode uses DataPreparationAgent for intelligent ingestion

import { getDataPreparationAgent } from '@/lib/agents/data-preparation'

async function handleDataIngestion(content: string, projectId: string) {
  const agent = getDataPreparationAgent()

  // Parse and enrich data
  const result = await agent.prepare({
    projectId,
    entityType: 'auto-detect',  // Agent determines entity type
    sourceData: content,
    enrichmentLevel: 'standard',
  })

  // Return preview for user confirmation
  return {
    preview: result.enrichedData,
    validation: result.validation,
    qualityScores: result.qualityScores,
    recommendation: result.recommendation,
  }
}
```

### 3. Brain Service Integration

**Location**: Brain service API (FastAPI)

```typescript
// Query Mode integrates with Brain service

async function queryBrainService(query: string, projectId: string) {
  const response = await fetch(`${BRAIN_API_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BRAIN_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      project_id: projectId,
      filters: {
        include_relationships: true,
        max_results: 20,
      },
    }),
  })

  const data = await response.json()

  return {
    results: data.results.map(formatResult),
    queryAnalysis: data.analysis,
  }
}
```

### 4. Payload CMS Integration

**React Query hooks for Payload collections**:

```typescript
// src/hooks/queries/useCharacters.ts
export function useCharacters(projectId: string) {
  return useQuery({
    queryKey: ['characters', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/characters?project=${projectId}`)
      return res.json()
    },
  })
}

export function useCreateCharacter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCharacterInput) => {
      const res = await fetch('/api/v1/characters', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['characters', variables.projectId])
    },
  })
}
```

### 5. WebSocket Server Integration

**WebSocket server setup** (runs alongside Next.js):

```typescript
// server/websocket.ts
import { Server } from 'socket.io'
import { createServer } from 'http'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
  },
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Subscribe to agent execution events
  socket.on('subscribe:execution', ({ executionId }) => {
    socket.join(`execution:${executionId}`)
  })

  // Emit agent events from orchestrator
  emitter.on('agent:progress', (data) => {
    io.to(`execution:${data.executionId}`).emit('agent:progress', data)
  })
})

httpServer.listen(process.env.WS_PORT || 3001)
```

### Integration Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    Integration Architecture                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  UI Components (React)                                            │
│       │                                                           │
│       ├─────────────────┬─────────────────┬─────────────────┐    │
│       │                 │                 │                 │    │
│       ▼                 ▼                 ▼                 ▼    │
│  React Query    Zustand Stores    WebSocket Client    SSE       │
│       │                 │                 │                 │    │
│       ├─────────────────┴─────────────────┴─────────────────┤    │
│       │                                                     │    │
│       ▼                                                     ▼    │
│  REST API Routes                               WebSocket Server  │
│  /api/v1/orchestrator/*                        (Port 3001)       │
│       │                                                     │    │
│       ├─────────┬──────────┬──────────┬────────────────────┘    │
│       │         │          │          │                          │
│       ▼         ▼          ▼          ▼                          │
│  Orchestrator  Data     Brain     Payload CMS                    │
│  Agent System  Prep     Service   (PostgreSQL)                   │
│  (Codebuff)    Agent    (FastAPI)                                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization

### 1. Code Splitting Strategy

```typescript
// Lazy load heavy components
const RightOrchestrator = lazy(() => import('./RightOrchestrator'))
const CodeEditor = lazy(() => import('./CodeEditor'))
const ImageGallery = lazy(() => import('./ImageGallery'))

// Route-based code splitting (automatic with Next.js App Router)
// Each route in app/ directory is a separate chunk
```

**Bundle Size Targets**:
- Initial JS bundle: < 200KB (gzipped)
- Per-route chunks: < 100KB each
- Total app bundle: < 500KB (gzipped)

### 2. React Query Optimization

```typescript
// Prefetch on hover
function EpisodeListItem({ episode }) {
  const queryClient = useQueryClient()

  return (
    <div
      onMouseEnter={() => {
        queryClient.prefetchQuery({
          queryKey: ['episode', episode.id],
          queryFn: () => fetchEpisode(episode.id),
        })
      }}
    >
      {episode.title}
    </div>
  )
}

// Selective refetch based on visibility
useQuery({
  queryKey: ['episodes', projectId],
  queryFn: fetchEpisodes,
  refetchInterval: (data) => {
    // Only refetch if tab is visible
    return document.visibilityState === 'visible' ? 30000 : false
  },
})
```

### 3. Virtual Scrolling for Large Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function MessageList({ messages }) {
  const parentRef = useRef(null)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,  // Estimated message height
    overscan: 5,              // Render 5 extra items
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <Message message={messages[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 4. Memoization Strategy

```typescript
// Memoize expensive computations
const filteredMessages = useMemo(
  () => messages.filter(m => m.mode === currentMode),
  [messages, currentMode]
)

// Memoize callbacks to prevent re-renders
const handleSend = useCallback(
  async (content: string) => {
    await sendMessage(content)
  },
  [sendMessage]
)

// Memoize components
const MemoizedMessage = memo(Message, (prev, next) => {
  return prev.message.id === next.message.id &&
         prev.message.content === next.message.content
})
```

### 5. Debouncing and Throttling

```typescript
import { useDebouncedCallback } from 'use-debounce'

// Debounce search input
const debouncedSearch = useDebouncedCallback(
  (query: string) => {
    performSearch(query)
  },
  500  // 500ms delay
)

// Throttle scroll events
const throttledScroll = useThrottle(
  () => {
    handleScroll()
  },
  100  // Max once per 100ms
)
```

### 6. Image Optimization

```typescript
// Use Next.js Image component for automatic optimization
import Image from 'next/image'

<Image
  src={characterAvatar}
  alt={characterName}
  width={64}
  height={64}
  loading="lazy"
  quality={75}
/>

// Progressive image loading
<Image
  src={conceptArt}
  placeholder="blur"
  blurDataURL={blurHash}
/>
```

### Performance Monitoring

```typescript
// src/lib/performance.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals'

export function reportWebVitals() {
  onCLS(console.log)  // Cumulative Layout Shift
  onFID(console.log)  // First Input Delay
  onLCP(console.log)  // Largest Contentful Paint
  onFCP(console.log)  // First Contentful Paint
  onTTFB(console.log) // Time to First Byte
}

// Performance budgets
const budgets = {
  FCP: 1500,   // 1.5s
  LCP: 2500,   // 2.5s
  FID: 100,    // 100ms
  CLS: 0.1,    // 0.1 score
  TTFB: 600,   // 600ms
}
```

---

## Security Considerations

### 1. Authentication & Authorization

```typescript
// Middleware for API routes
export async function middleware(request: NextRequest) {
  const session = await getSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify project access
  const projectId = request.nextUrl.searchParams.get('projectId')
  if (projectId) {
    const hasAccess = await verifyProjectAccess(session.userId, projectId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.next()
}
```

### 2. WebSocket Authentication

```typescript
// Authenticate WebSocket connections
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token

  try {
    const user = await verifyToken(token)
    socket.data.user = user
    next()
  } catch (error) {
    next(new Error('Authentication failed'))
  }
})

// Authorize subscription to execution events
socket.on('subscribe:execution', async ({ executionId }) => {
  const execution = await getExecution(executionId)

  if (execution.userId !== socket.data.user.id) {
    socket.emit('error', { message: 'Unauthorized' })
    return
  }

  socket.join(`execution:${executionId}`)
})
```

### 3. Input Sanitization

```typescript
// Sanitize user input before processing
import DOMPurify from 'isomorphic-dompurify'

function sanitizeInput(input: string): string {
  // Remove potentially dangerous HTML
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],  // Strip all HTML
    ALLOWED_ATTR: [],
  })

  // Limit length
  return clean.slice(0, 10000)
}

// Validate input format
function validateChatInput(content: string): ValidationResult {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Content is required' }
  }

  if (content.length > 10000) {
    return { valid: false, error: 'Content too long (max 10000 chars)' }
  }

  return { valid: true }
}
```

### 4. Rate Limiting

```typescript
// src/lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 requests per minute
})

// Apply to API routes
export async function POST(request: NextRequest) {
  const session = await getSession(request)

  const { success } = await ratelimit.limit(session.userId)

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Process request...
}
```

### 5. Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} ${process.env.NEXT_PUBLIC_WS_URL};
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

### 6. Secure Data Transmission

```typescript
// Encrypt sensitive data before sending
import { encrypt, decrypt } from '@/lib/crypto'

// Client-side encryption for sensitive fields
async function sendSensitiveData(data: any) {
  const encrypted = await encrypt(JSON.stringify(data), publicKey)

  return fetch('/api/v1/sensitive', {
    method: 'POST',
    body: JSON.stringify({ data: encrypted }),
  })
}

// Server-side decryption
async function handleSensitiveData(encrypted: string) {
  const decrypted = await decrypt(encrypted, privateKey)
  return JSON.parse(decrypted)
}
```

---

## Deployment Architecture

### Infrastructure Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     Production Infrastructure                   │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │   Vercel     │         │  Railway /   │                     │
│  │  (Next.js)   │────────▶│  Render      │                     │
│  │              │         │  (WS Server) │                     │
│  └──────┬───────┘         └──────────────┘                     │
│         │                                                       │
│         │                                                       │
│  ┌──────▼─────────────────────────────────────────────────┐    │
│  │                    Supabase / Railway                   │    │
│  │  ┌──────────────┐  ┌───────────┐  ┌─────────────────┐ │    │
│  │  │ PostgreSQL   │  │   Redis   │  │  Storage        │ │    │
│  │  │ (Payload)    │  │  (Cache)  │  │  (Media Files)  │ │    │
│  │  └──────────────┘  └───────────┘  └─────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    External Services                      │  │
│  │  ┌───────────┐  ┌────────────┐  ┌──────────────────────┐│  │
│  │  │ Codebuff  │  │ OpenAI API │  │ Brain Service        ││  │
│  │  │   API     │  │   (LLM)    │  │ (FastAPI - Railway)  ││  │
│  │  └───────────┘  └────────────┘  └──────────────────────┘│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Environment Variables

```bash
# .env.production

# App
NEXT_PUBLIC_APP_URL=https://aladdin.app
NEXT_PUBLIC_API_URL=https://aladdin.app/api/v1
NEXT_PUBLIC_WS_URL=wss://ws.aladdin.app

# Database
DATABASE_URL=postgresql://user:pass@host:5432/aladdin_production

# Redis
REDIS_URL=redis://user:pass@host:6379

# Storage
STORAGE_BUCKET=aladdin-production
STORAGE_REGION=us-east-1

# Authentication
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://aladdin.app

# External Services
CODEBUFF_API_KEY=<key>
OPENAI_API_KEY=<key>
BRAIN_API_URL=https://brain.aladdin.app
BRAIN_API_KEY=<key>

# Feature Flags
ENABLE_WEBSOCKET=true
ENABLE_STREAMING=true
ENABLE_ANALYTICS=true

# Monitoring
SENTRY_DSN=<sentry-url>
VERCEL_ANALYTICS_ID=<id>
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis cache warmed
- [ ] WebSocket server deployed
- [ ] SSL certificates valid
- [ ] CDN configured for static assets
- [ ] Monitoring dashboards setup
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring enabled
- [ ] Rate limiting configured
- [ ] Backup strategy implemented
- [ ] Rollback plan documented
- [ ] Load testing completed
- [ ] Security audit passed

### Scaling Strategy

**Horizontal Scaling**:
- Next.js app: Auto-scale on Vercel (serverless)
- WebSocket server: Manual scaling on Railway (2-10 instances)
- PostgreSQL: Managed scaling with read replicas
- Redis: Cluster mode for high availability

**Vertical Scaling**:
- Database: Increase instance size as needed
- WebSocket: Increase memory for concurrent connections

**Caching Strategy**:
- React Query: Client-side caching (5-30 min TTL)
- Redis: Server-side caching (1-60 min TTL)
- CDN: Static asset caching (immutable)

---

## Appendix

### A. Technology Decision Matrix

| Decision | Options Considered | Selected | Rationale |
|----------|-------------------|----------|-----------|
| State Management | Redux, Zustand, Jotai | Zustand | Simpler API, smaller bundle |
| Server State | SWR, React Query | React Query | Better dev tools, more features |
| Real-time | Socket.io, Ably, Pusher | Socket.io | Self-hosted, flexible |
| Styling | Tailwind, CSS Modules | Tailwind | Rapid development, consistency |
| Animations | Framer Motion, React Spring | Framer Motion | Better DX, layout animations |
| Testing | Jest, Vitest | Jest | Ecosystem maturity |

### B. Architecture Decision Records

**ADR-001: Use Zustand for Client State**
- **Context**: Need simple state management for UI state
- **Decision**: Use Zustand instead of Redux
- **Consequences**: Smaller bundle, simpler API, less boilerplate

**ADR-002: Separate WebSocket Server**
- **Context**: Next.js doesn't support long-lived WebSocket connections
- **Decision**: Deploy separate WebSocket server on Railway
- **Consequences**: Additional deployment, but better scalability

**ADR-003: Mode-Based Orchestrator Design**
- **Context**: Different use cases (query, data, task, chat)
- **Decision**: Implement 4 distinct modes with mode-specific UI
- **Consequences**: Clear UX, easier to extend, mode-specific optimizations

### C. Performance Benchmarks

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| FCP | < 1.5s | TBD | 🔄 In Progress |
| LCP | < 2.5s | TBD | 🔄 In Progress |
| TTI | < 3.5s | TBD | 🔄 In Progress |
| Bundle Size | < 500KB | TBD | 🔄 In Progress |
| Lighthouse Score | > 90 | TBD | 🔄 In Progress |

### D. API Versioning Strategy

```
v1: Current version (production)
v2: Beta features (opt-in)
v3: Future version (development)

Deprecation policy: 6 months notice
Migration path: Automatic upgrades with warnings
```

### E. Error Handling Strategy

```typescript
// Error hierarchy
class AladdinError extends Error {
  code: string
  statusCode: number
}

class ValidationError extends AladdinError {
  code = 'VALIDATION_ERROR'
  statusCode = 400
}

class AuthenticationError extends AladdinError {
  code = 'AUTH_ERROR'
  statusCode = 401
}

class OrchestrationError extends AladdinError {
  code = 'ORCHESTRATION_ERROR'
  statusCode = 500
}

// Global error handler
function handleError(error: Error) {
  if (error instanceof AladdinError) {
    // Log to Sentry
    Sentry.captureException(error)

    // Show user-friendly message
    toast.error(error.message)

    return {
      error: error.message,
      code: error.code,
    }
  }

  // Unknown error
  Sentry.captureException(error)
  toast.error('An unexpected error occurred')

  return {
    error: 'Internal server error',
    code: 'UNKNOWN_ERROR',
  }
}
```

---

## Summary

This technical architecture specification provides a comprehensive blueprint for implementing the Orchestrator UI. Key highlights:

1. **4-Section Layout**: Top menu, left sidebar, main content, right orchestrator
2. **4 Orchestrator Modes**: Query, Data, Task, Chat with mode-specific UI
3. **Dual State Management**: Zustand (client) + React Query (server)
4. **Real-time Architecture**: WebSocket (events) + SSE (streaming)
5. **Tight Integration**: Existing agent system, data preparation, brain service
6. **Performance Optimized**: Code splitting, virtual scrolling, memoization
7. **Production Ready**: Security, monitoring, deployment strategy

**Next Steps**:
1. Review and approve architecture
2. Begin Phase 1: Layout Foundation
3. Implement state stores and providers
4. Build API endpoints
5. Setup WebSocket server
6. Integrate with existing agents

**Estimated Timeline**: 3-4 weeks for full implementation

---

**Document Status**: ✅ Complete and ready for implementation
**Last Updated**: 2025-10-01
**Approved By**: Awaiting review
