# Orchestrator UI - Architecture Diagrams

**Version**: 1.0.0
**Date**: 2025-10-01
**Status**: Reference Documentation

---

## Table of Contents

1. [System Context Diagram](#system-context-diagram)
2. [Container Diagram](#container-diagram)
3. [Component Diagram](#component-diagram)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Deployment Diagram](#deployment-diagram)
6. [Sequence Diagrams](#sequence-diagrams)

---

## System Context Diagram

Shows the Aladdin platform and its external dependencies.

```
                              ┌─────────────────────┐
                              │                     │
                              │   Movie Director    │
                              │   (User)            │
                              │                     │
                              └──────────┬──────────┘
                                         │
                                         │ Uses
                                         │
                    ┌────────────────────▼────────────────────┐
                    │                                          │
                    │      Aladdin Movie Production           │
                    │      Platform                           │
                    │                                          │
                    │  - Create characters                     │
                    │  - Design scenes                         │
                    │  - Generate episodes                     │
                    │  - Manage production                     │
                    │                                          │
                    └──┬───────┬───────┬───────┬──────────┬───┘
                       │       │       │       │          │
            ┌──────────┘       │       │       │          └──────────┐
            │                  │       │       │                     │
            │                  │       │       │                     │
      ┌─────▼─────┐   ┌────────▼──┐  │  ┌────▼─────┐   ┌──────────▼────┐
      │           │   │           │  │  │          │   │               │
      │ Codebuff  │   │  OpenAI   │  │  │  Brain   │   │  Payload CMS  │
      │ Agent     │   │  API      │  │  │ Service  │   │  (Database)   │
      │ Platform  │   │           │  │  │          │   │               │
      │           │   │ (GPT-4)   │  │  │ (RAG)    │   │ (PostgreSQL)  │
      └───────────┘   └───────────┘  │  └──────────┘   └───────────────┘
                                     │
                            ┌────────▼────────┐
                            │                 │
                            │  Redis Cache    │
                            │                 │
                            └─────────────────┘
```

---

## Container Diagram

Shows the major containers (applications/services) that make up the system.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Aladdin Platform                                │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Web Browser (React)                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │    │
│  │  │   UI         │  │   Zustand    │  │   React Query        │  │    │
│  │  │ Components   │  │   Stores     │  │   Cache              │  │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────┘  │    │
│  │         │                 │                  │                   │    │
│  │         └─────────────────┴──────────────────┘                   │    │
│  │                           │                                      │    │
│  └───────────────────────────┼──────────────────────────────────────┘    │
│                              │                                           │
│                   ┌──────────┼──────────┐                                │
│                   │          │          │                                │
│      ┌────────────▼───┐  ┌──▼──────────▼─────┐                          │
│      │                │  │                    │                          │
│      │  Next.js App   │  │  WebSocket Server  │                          │
│      │  (Vercel)      │  │  (Railway)         │                          │
│      │                │  │                    │                          │
│      │  - API Routes  │  │  - Socket.io       │                          │
│      │  - SSR Pages   │  │  - Event Pub/Sub   │                          │
│      │  - SSE Stream  │  │  - Redis Adapter   │                          │
│      │                │  │                    │                          │
│      └────┬───────────┘  └──┬─────────────────┘                          │
│           │                 │                                            │
│           │                 │                                            │
│  ┌────────┼─────────────────┼─────────────────────────────────────┐     │
│  │        │                 │                                      │     │
│  │   ┌────▼────┐     ┌──────▼─────┐     ┌──────────────────┐     │     │
│  │   │         │     │            │     │                  │     │     │
│  │   │ Payload │     │   Redis    │     │  Agent System    │     │     │
│  │   │  CMS    │     │   Cache    │     │  (Codebuff)      │     │     │
│  │   │         │     │            │     │                  │     │     │
│  │   │ (DB)    │     │ (Pub/Sub)  │     │  - Orchestrator  │     │     │
│  │   │         │     │            │     │  - 7 Departments │     │     │
│  │   │         │     │            │     │  - Specialists   │     │     │
│  │   └─────────┘     └────────────┘     └────────┬─────────┘     │     │
│  │                                                │               │     │
│  │                                       ┌────────▼────────┐      │     │
│  │                                       │                 │      │     │
│  │                                       │  Brain Service  │      │     │
│  │                                       │  (FastAPI)      │      │     │
│  │                                       │                 │      │     │
│  │                                       │  - RAG          │      │     │
│  │                                       │  - Graph DB     │      │     │
│  │                                       │  - Validation   │      │     │
│  │                                       │                 │      │     │
│  │                                       └─────────────────┘      │     │
│  │                                                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Diagram

Detailed view of the React application components.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     React Application                                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  app/(frontend)/dashboard/project/[id]/layout.tsx            │    │
│  │                                                               │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │  AppProviders                                        │    │    │
│  │  │  ┌────────────────────────────────────────────┐     │    │    │
│  │  │  │  QueryProvider (React Query)               │     │    │    │
│  │  │  │  - Query client                            │     │    │    │
│  │  │  │  - Dev tools                               │     │    │    │
│  │  │  └────────────────────────────────────────────┘     │    │    │
│  │  │  ┌────────────────────────────────────────────┐     │    │    │
│  │  │  │  WebSocketProvider                         │     │    │    │
│  │  │  │  - Socket.io connection                    │     │    │    │
│  │  │  │  - Event subscriptions                     │     │    │    │
│  │  │  └────────────────────────────────────────────┘     │    │    │
│  │  │  ┌────────────────────────────────────────────┐     │    │    │
│  │  │  │  ProjectProvider                           │     │    │    │
│  │  │  │  - Project context                         │     │    │    │
│  │  │  │  - Auto-fetch project                      │     │    │    │
│  │  │  └────────────────────────────────────────────┘     │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  │                                                               │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │  AppLayout                                           │    │    │
│  │  │                                                       │    │    │
│  │  │  ┌─────────────────────────────────────────────┐    │    │    │
│  │  │  │  TopMenuBar                                  │    │    │    │
│  │  │  │  - ProjectSelector                           │    │    │    │
│  │  │  │  - Breadcrumbs                               │    │    │    │
│  │  │  │  - GlobalSearch                              │    │    │    │
│  │  │  │  - Notifications                             │    │    │    │
│  │  │  │  - UserMenu                                  │    │    │    │
│  │  │  └─────────────────────────────────────────────┘    │    │    │
│  │  │                                                       │    │    │
│  │  │  ┌─────────────────────────────────────────────┐    │    │    │
│  │  │  │  LeftSidebar                                 │    │    │    │
│  │  │  │  - Navigation (Episodes, Characters, etc)    │    │    │    │
│  │  │  │  - QuickActions                              │    │    │    │
│  │  │  │  - RecentItems                               │    │    │    │
│  │  │  │  - ProjectTools                              │    │    │    │
│  │  │  └─────────────────────────────────────────────┘    │    │    │
│  │  │                                                       │    │    │
│  │  │  ┌─────────────────────────────────────────────┐    │    │    │
│  │  │  │  MainContent                                 │    │    │    │
│  │  │  │  {children} - Dynamic route content          │    │    │    │
│  │  │  └─────────────────────────────────────────────┘    │    │    │
│  │  │                                                       │    │    │
│  │  │  ┌─────────────────────────────────────────────┐    │    │    │
│  │  │  │  RightOrchestrator                           │    │    │    │
│  │  │  │                                               │    │    │    │
│  │  │  │  ┌─────────────────────────────────────┐    │    │    │    │
│  │  │  │  │  ModeSelector                        │    │    │    │    │
│  │  │  │  │  - Query, Data, Task, Chat tabs      │    │    │    │    │
│  │  │  │  └─────────────────────────────────────┘    │    │    │    │
│  │  │  │                                               │    │    │    │
│  │  │  │  ┌─────────────────────────────────────┐    │    │    │    │
│  │  │  │  │  ChatArea                            │    │    │    │    │
│  │  │  │  │                                       │    │    │    │    │
│  │  │  │  │  ┌─────────────────────────────┐    │    │    │    │    │
│  │  │  │  │  │  MessageList                 │    │    │    │    │    │
│  │  │  │  │  │  - Message (user/assistant)  │    │    │    │    │    │
│  │  │  │  │  │  - StreamingMessage          │    │    │    │    │    │
│  │  │  │  │  │  - CodeBlock                 │    │    │    │    │    │
│  │  │  │  │  │  - DataPreview               │    │    │    │    │    │
│  │  │  │  │  │  - TaskProgress              │    │    │    │    │    │
│  │  │  │  │  │  - QueryResults              │    │    │    │    │    │
│  │  │  │  │  └─────────────────────────────┘    │    │    │    │    │
│  │  │  │  │                                       │    │    │    │    │
│  │  │  │  │  StreamingIndicator                  │    │    │    │    │
│  │  │  │  └─────────────────────────────────────┘    │    │    │    │
│  │  │  │                                               │    │    │    │
│  │  │  │  ┌─────────────────────────────────────┐    │    │    │    │
│  │  │  │  │  MessageInput                        │    │    │    │    │
│  │  │  │  │  - Textarea                          │    │    │    │    │
│  │  │  │  │  - Send button                       │    │    │    │    │
│  │  │  │  │  - Attachment button                 │    │    │    │    │
│  │  │  │  └─────────────────────────────────────┘    │    │    │    │
│  │  │  │                                               │    │    │    │
│  │  │  │  ┌─────────────────────────────────────┐    │    │    │    │
│  │  │  │  │  Mode Components                     │    │    │    │    │
│  │  │  │  │  - QueryMode                         │    │    │    │    │
│  │  │  │  │  - DataMode                          │    │    │    │    │
│  │  │  │  │  - TaskMode                          │    │    │    │    │
│  │  │  │  │  - ChatMode                          │    │    │    │    │
│  │  │  │  └─────────────────────────────────────┘    │    │    │    │
│  │  │  └─────────────────────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  State Stores (Zustand)                                      │    │
│  │  - layoutStore (sidebar state)                               │    │
│  │  - orchestratorStore (mode, messages, streaming)             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Custom Hooks                                                │    │
│  │  - useLayout                                                 │    │
│  │  - useOrchestrator                                           │    │
│  │  - useWebSocket                                              │    │
│  │  - useStreaming                                              │    │
│  │  - useKeyboardShortcuts                                      │    │
│  │  - useProject (queries)                                      │    │
│  │  - useEpisodes (queries)                                     │    │
│  │  - useCharacters (queries)                                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Query Mode Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        Query Mode Flow                            │
└──────────────────────────────────────────────────────────────────┘

User
 │
 │ 1. Types query
 │ "Show all scenes with Aladdin"
 │
 ▼
MessageInput
 │
 │ 2. Send query
 │ POST /api/v1/orchestrator/query
 │
 ▼
API Route
 │
 │ 3. Route to Brain service
 │
 ▼
Brain Service (FastAPI)
 │
 │ 4. Vector search + Knowledge graph
 │
 ├──▶ Vector DB: Find similar content
 ├──▶ Graph DB: Traverse relationships
 └──▶ RAG: Generate contextual response
 │
 │ 5. Return results
 │
 ▼
API Route
 │
 │ 6. Format response
 │
 ▼
React Query
 │
 │ 7. Update cache
 │
 ▼
QueryResults Component
 │
 │ 8. Render results
 │ - Entity cards
 │ - Relevance scores
 │ - Quick actions
 │
 ▼
User sees results
```

### Data Ingestion Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Data Ingestion Flow                            │
└──────────────────────────────────────────────────────────────────┘

User
 │
 │ 1. Enters data
 │ "Add character: Jafar, evil vizier..."
 │
 ▼
MessageInput
 │
 │ 2. Send for ingestion
 │ POST /api/v1/orchestrator/ingest
 │
 ▼
API Route
 │
 │ 3. Invoke DataPreparationAgent
 │
 ▼
DataPreparationAgent
 │
 ├──▶ 4a. ContextGatherer
 │    └─▶ Fetch project context
 │    └─▶ Get related entities
 │
 ├──▶ 4b. DataEnricher (LLM)
 │    └─▶ Parse entity type
 │    └─▶ Extract attributes
 │    └─▶ Generate metadata
 │
 ├──▶ 4c. RelationshipDiscoverer
 │    └─▶ Find connections
 │    └─▶ Suggest relationships
 │
 └──▶ 4d. BrainDocumentValidator
      └─▶ Validate consistency
      └─▶ Calculate quality scores
 │
 │ 5. Generate preview
 │
 ▼
API Route
 │
 │ 6. Return preview to user
 │ {
 │   preview: { parsed data },
 │   validation: { errors, warnings },
 │   qualityScores: { completeness, consistency },
 │   recommendation: 'ingest' | 'modify' | 'discard'
 │ }
 │
 ▼
DataPreview Component
 │
 │ 7. Show preview UI
 │ - Parsed fields
 │ - Suggested relationships
 │ - Quality scores
 │ - [Confirm] [Modify] [Discard] buttons
 │
 ▼
User reviews
 │
 │ 8a. If confirmed
 │     POST /api/v1/characters (Payload)
 │     POST /brain/ingest (Brain service)
 │     WebSocket: entity:created event
 │
 │ 8b. If modify
 │     Show edit form with suggestions
 │
 │ 8c. If discard
 │     Clear preview
 │
 ▼
Entity created & synced
```

### Task Execution Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Task Execution Flow                            │
└──────────────────────────────────────────────────────────────────┘

User
 │
 │ 1. Request task
 │ "Generate 5 scene variations for opening"
 │
 ▼
MessageInput
 │
 │ 2. Send task
 │ POST /api/v1/orchestrator/task
 │
 ▼
API Route
 │
 │ 3. Invoke Master Orchestrator
 │
 ▼
Master Orchestrator
 │
 ├──▶ 4a. DepartmentRouter
 │    └─▶ Calculate relevance for all departments
 │    └─▶ Primary: STORY (0.95)
 │    └─▶ Supporting: CHARACTER (0.7), VISUAL (0.6)
 │
 ├──▶ 4b. DependencyResolver
 │    └─▶ Build execution graph
 │    └─▶ STORY depends on CHARACTER context
 │
 └──▶ 4c. ParallelExecutor
      └─▶ Execute departments
 │
 │ ┌──────────────────────────────────────┐
 │ │  Parallel Execution                  │
 │ │                                      │
 │ │  CHARACTER Dept                      │
 │ │   │                                  │
 │ │   ├─▶ Gather character context       │
 │ │   └─▶ WebSocket: agent:progress      │
 │ │                                      │
 │ │  STORY Dept (waits for CHARACTER)    │
 │ │   │                                  │
 │ │   ├─▶ Story Architect                │
 │ │   ├─▶ Scene Designer                 │
 │ │   ├─▶ Dialogue Writer                │
 │ │   └─▶ WebSocket: agent:progress      │
 │ │                                      │
 │ │  VISUAL Dept (parallel)              │
 │ │   │                                  │
 │ │   ├─▶ Concept Artist                 │
 │ │   └─▶ WebSocket: agent:progress      │
 │ │                                      │
 │ └──────────────────────────────────────┘
 │
 │ 5. WebSocket events stream to UI
 │
 ▼
TaskProgress Component
 │
 │ 6. Real-time progress display
 │ [CHARACTER] ████████████████████ 100% ✓
 │ [STORY]     ████████████░░░░░░░░  65% ⏳
 │ [VISUAL]    ████████░░░░░░░░░░░░  45% ⏳
 │
 ▼
Orchestrator completes
 │
 ├──▶ 7a. ResultAggregator
 │    └─▶ Compile department outputs
 │    └─▶ Calculate quality scores
 │
 └──▶ 7b. Brain validation
      └─▶ Validate consistency
      └─▶ Check quality gates (0.75 threshold)
 │
 │ 8. Return results
 │
 ▼
TaskResults Component
 │
 │ 9. Display results
 │ - 5 scene variations
 │ - Quality scores per variation
 │ - Department contributions
 │ - [Ingest] [Modify] [Discard] buttons
 │
 ▼
User reviews results
```

### Real-time Streaming Flow (SSE)

```
┌──────────────────────────────────────────────────────────────────┐
│                  Streaming Response Flow (SSE)                    │
└──────────────────────────────────────────────────────────────────┘

User sends message
 │
 ▼
POST /api/v1/orchestrator/chat
 │
 │ Returns immediately with:
 │ { conversationId, messageId }
 │
 ▼
Client opens SSE connection
 │
 │ GET /api/v1/orchestrator/stream?conversationId=xyz
 │
 ▼
Server starts streaming
 │
 │ ┌─────────────────────────────────────┐
 │ │  LLM generates response             │
 │ │                                     │
 │ │  event: message                     │
 │ │  data: {"type":"start"}             │
 │ │                                     │
 │ │  event: message                     │
 │ │  data: {"type":"chunk","content":"I"} │
 │ │                                     │
 │ │  event: message                     │
 │ │  data: {"type":"chunk","content":" found"} │
 │ │                                     │
 │ │  ... (many chunks)                  │
 │ │                                     │
 │ │  event: message                     │
 │ │  data: {"type":"complete","content":"..."} │
 │ │                                     │
 │ └─────────────────────────────────────┘
 │
 ▼
useStreaming hook
 │
 ├──▶ On 'start': setIsStreaming(true)
 ├──▶ On 'chunk': updateStreamingMessage(content)
 └──▶ On 'complete': addMessage(), setIsStreaming(false)
 │
 ▼
StreamingMessage Component
 │
 │ Renders content character-by-character
 │ with typing cursor animation
 │
 ▼
User sees live streaming response
```

---

## Deployment Diagram

Physical deployment of the system in production.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Cloud Infrastructure                         │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Vercel (Global Edge Network)                                   │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Next.js App (Serverless Functions)                       │  │ │
│  │  │  - API Routes (/api/v1/*)                                 │  │ │
│  │  │  - SSR Pages                                              │  │ │
│  │  │  - Static Assets (CDN)                                    │  │ │
│  │  │                                                            │  │ │
│  │  │  Regions: us-east-1, us-west-1, eu-west-1, ap-northeast-1│  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────┬───────────────────────────────────────────┘ │
│                       │                                              │
│                       │ HTTP/HTTPS                                   │
│                       │                                              │
│  ┌────────────────────▼───────────────────────────────────────────┐ │
│  │  Railway (Container Platform)                                   │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  WebSocket Server (Docker Container)                      │  │ │
│  │  │  - Node.js + Socket.io                                    │  │ │
│  │  │  - Auto-scaling: 2-10 instances                           │  │ │
│  │  │  - Health checks: /health                                 │  │ │
│  │  │  - Redis adapter for multi-instance                       │  │ │
│  │  │                                                            │  │ │
│  │  │  Resources: 512MB RAM, 0.5 vCPU per instance              │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Brain Service (FastAPI Container)                        │  │ │
│  │  │  - Python + FastAPI                                       │  │ │
│  │  │  - Vector search (Qdrant)                                 │  │ │
│  │  │  - Graph database (Neo4j)                                 │  │ │
│  │  │  - LLM integration                                        │  │ │
│  │  │                                                            │  │ │
│  │  │  Resources: 2GB RAM, 1 vCPU                               │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Supabase (Database Platform)                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  PostgreSQL 15                                            │  │ │
│  │  │  - Primary: us-east-1                                     │  │ │
│  │  │  - Read replicas: us-west-1, eu-west-1                    │  │ │
│  │  │  - Connection pooling (PgBouncer)                         │  │ │
│  │  │  - Automated backups (daily, 7-day retention)             │  │ │
│  │  │                                                            │  │ │
│  │  │  Resources: 4GB RAM, 2 vCPU, 100GB SSD                    │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Storage (S3-compatible)                                  │  │ │
│  │  │  - Media files (images, videos, audio)                    │  │ │
│  │  │  - CDN integration                                        │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Upstash (Serverless Redis)                                    │ │
│  │  - Global replication                                          │ │
│  │  - Primary: us-east-1                                          │ │
│  │  - Read replicas: Global edge                                  │ │
│  │  - Pub/Sub for WebSocket coordination                          │ │
│  │  - Cache for React Query & server-side                         │ │
│  │                                                                 │ │
│  │  Resources: 1GB memory, 10K req/sec                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  External Services                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │ │
│  │  │  Codebuff    │  │  OpenAI      │  │  Sentry           │   │ │
│  │  │  API         │  │  API         │  │  (Error tracking)  │   │ │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Monitoring & Observability                                     │ │
│  │  - Vercel Analytics (Core Web Vitals)                           │ │
│  │  - Sentry (Error tracking)                                      │ │
│  │  - Railway Metrics (Container health, resource usage)           │ │
│  │  - Uptime monitoring (Better Uptime)                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Network Configuration:
- TLS 1.3 for all connections
- WebSocket: WSS (TLS-encrypted)
- Database: SSL required
- API: HTTPS only (HTTP → HTTPS redirect)
- Rate limiting: Cloudflare (10K req/min)
```

---

## Sequence Diagrams

### User Query Sequence

```
User   UI      API     Brain    DB      Cache
 │      │       │       │       │        │
 │──1──▶│       │       │       │        │  Type query
 │      │──2───▶│       │       │        │  POST /query
 │      │       │──3───▶│       │        │  Check cache
 │      │       │       │       │◀───4───┤  Cache miss
 │      │       │───────────5──▶│        │  Query Brain
 │      │       │       │       │        │
 │      │       │       │──6───▶│        │  Vector search
 │      │       │       │       │        │  Graph traversal
 │      │       │       │◀──7───┤        │  Return results
 │      │       │       │       │        │
 │      │       │◀──────────8───┤        │  Format response
 │      │       │──────────────────9────▶│  Cache results
 │      │◀──10──┤       │       │        │  Return to UI
 │◀─11──┤       │       │       │        │  Display results
 │      │       │       │       │        │
```

### Task Execution with Real-time Updates

```
User   UI      API     Orchestrator  WS Server  Agents
 │      │       │          │            │         │
 │──1──▶│       │          │            │         │  Request task
 │      │──2───▶│          │            │         │  POST /task
 │      │       │──3──────▶│            │         │  Start orchestration
 │      │       │          │            │         │
 │      │       │          │───4───────▶│         │  Subscribe execution
 │      │       │          │            │         │
 │      │       │          │────────────────5────▶│  Spawn departments
 │      │       │          │            │         │
 │      │       │          │            │◀───6────┤  agent:started
 │      │       │          │            │         │
 │      │◀─────────────────────────7────┤         │  WS: agent:started
 │      │       │          │            │         │
 │◀─8───┤       │          │            │         │  Show progress UI
 │      │       │          │            │         │
 │      │       │          │            │◀───9────┤  agent:progress (×N)
 │      │◀─────────────────────────10───┤         │  WS: progress events
 │◀─11──┤       │          │            │         │  Update progress bars
 │      │       │          │            │         │
 │      │       │          │            │◀───12───┤  agent:complete
 │      │◀─────────────────────────13───┤         │  WS: complete event
 │      │       │          │            │         │
 │      │       │          │◀───────────14─────────┤  All agents done
 │      │       │◀─────15──┤            │         │  Aggregate results
 │      │◀──16──┤          │            │         │  Return results
 │◀─17──┤       │          │            │         │  Display results
 │      │       │          │            │         │
```

### Authentication & Authorization Flow

```
User   UI      Auth    API     DB
 │      │       │       │       │
 │──1──▶│       │       │       │  Enter credentials
 │      │──2───▶│       │       │  POST /auth/login
 │      │       │──3───▶│       │  Verify credentials
 │      │       │       │       │
 │      │       │───────────4──▶│  Check user
 │      │       │◀──────────5───┤  User valid
 │      │       │       │       │
 │      │       │──6───▶│       │  Create session
 │      │◀──7───┤       │       │  Return JWT
 │◀─8───┤       │       │       │  Store token
 │      │       │       │       │
 │      │       │       │       │  === Subsequent Requests ===
 │      │       │       │       │
 │──9──▶│       │       │       │  Request resource
 │      │──10──▶│       │       │  GET /api/v1/characters
 │      │       │       │       │  (Bearer: JWT token)
 │      │       │       │──11──▶│  Middleware: Verify token
 │      │       │◀──────────12──┤  Token valid
 │      │       │       │       │
 │      │       │       │──13──▶│  Check project access
 │      │       │◀──────────14──┤  Access granted
 │      │       │       │       │
 │      │       │───────────15─▶│  Fetch data
 │      │       │◀──────────16──┤  Return data
 │      │◀──17──┤       │       │
 │◀─18──┤       │       │       │  Display data
 │      │       │       │       │
```

---

## Summary

These diagrams provide visual representations of the Orchestrator UI architecture at various levels of abstraction:

1. **System Context**: High-level view of external dependencies
2. **Container**: Major services and their interactions
3. **Component**: Detailed React component structure
4. **Data Flow**: How data moves through different modes
5. **Deployment**: Physical infrastructure and resources
6. **Sequence**: Temporal flow of key operations

Use these diagrams as reference during implementation to maintain architectural consistency.

---

**Document Status**: ✅ Complete
**Last Updated**: 2025-10-01
**Related Documents**: TECHNICAL_ARCHITECTURE.md, ARCHITECTURE_REVIEW_SUMMARY.md
