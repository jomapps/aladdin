# Dynamic Agents System Architecture

**Version**: 2.0.0
**Last Updated**: October 1, 2025
**Status**: Implementation Ready
**Document Type**: System Architecture & Design

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Database Schema & ERD](#database-schema--erd)
5. [Real-time Event Streaming](#real-time-event-streaming)
6. [Quality Scoring System](#quality-scoring-system)
7. [Token Usage Optimization](#token-usage-optimization)
8. [Error Handling & Retry Mechanisms](#error-handling--retry-mechanisms)
9. [Scalability & Performance](#scalability--performance)
10. [Security Architecture](#security-architecture)
11. [API Specifications](#api-specifications)
12. [Performance Benchmarks](#performance-benchmarks)
13. [Integration Patterns](#integration-patterns)

---

## 1. Executive Summary

The Aladdin Dynamic Agents System is a hierarchical AI orchestration platform designed for movie production workflows. It combines:

- **Hierarchical Agent Architecture**: Master Orchestrator → Department Heads → Specialists
- **Real-time Coordination**: WebSocket-based event streaming for live monitoring
- **Intelligent Quality Control**: Multi-stage validation with configurable thresholds
- **Data Enrichment Pipeline**: Automatic context gathering and relationship discovery
- **Scalable Execution**: Parallel agent execution with resource management
- **Comprehensive Audit Trail**: Complete tracking of all agent operations

### Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Agent Execution | @codebuff/sdk | Claude AI agent orchestration |
| CMS Backend | PayloadCMS 3.57 | Agent configuration & storage |
| Database | MongoDB 6.20 | Primary data store |
| Graph Database | Neo4j 5.28 | Relationship mapping |
| Cache Layer | Redis (ioredis 5.4) | Context caching & sessions |
| Message Queue | Redis Pub/Sub | Event streaming |
| LLM Gateway | OpenRouter | Claude Sonnet 4.5 access |
| Real-time | WebSocket (ws 8.18) | Live updates |

---

## 2. System Architecture Overview

### 2.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Project  │  │  Agent   │  │ Execution│  │  Audit   │       │
│  │Dashboard │  │  Config  │  │ Monitor  │  │  Trail   │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
        │             │             │             │
┌───────▼─────────────▼─────────────▼─────────────▼──────────────┐
│                      API GATEWAY LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ REST API     │  │ GraphQL API  │  │ WebSocket    │         │
│  │ (Next.js)    │  │ (PayloadCMS) │  │ Server       │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼────────────────┐
│                   ORCHESTRATION LAYER                           │
│  ┌──────────────────────────────────────────────────────┐      │
│  │            Master Orchestrator                       │      │
│  │  - Request analysis & routing                        │      │
│  │  - Department coordination                           │      │
│  │  - Result aggregation                                │      │
│  │  - Quality validation                                │      │
│  └───────┬────────────────────────────────┬─────────────┘      │
│          │                                │                     │
│  ┌───────▼──────┐  ┌──────────┐  ┌──────▼───────┐            │
│  │ Department   │  │Department│  │ Department   │            │
│  │ Head: Story  │  │   Head:  │  │ Head: Video  │  + 3 more  │
│  │              │  │Character │  │              │            │
│  └───────┬──────┘  └────┬─────┘  └──────┬───────┘            │
│          │              │                │                     │
│  ┌───────▼──────────────▼────────────────▼─────────┐          │
│  │         Specialist Agent Pool                    │          │
│  │  - Dynamic spawning                              │          │
│  │  - Parallel execution                            │          │
│  │  - Result validation                             │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼────────────────┐
│                     SERVICES LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   Data   │  │  Brain   │  │ Quality  │  │  Agent   │      │
│  │  Prep    │  │ Service  │  │  Gates   │  │   Pool   │      │
│  │  Agent   │  │ (Neo4j)  │  │          │  │  Manager │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
        │             │             │             │
┌───────▼─────────────▼─────────────▼─────────────▼──────────────┐
│                   PERSISTENCE LAYER                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ MongoDB  │  │  Neo4j   │  │  Redis   │  │   S3     │      │
│  │(Primary) │  │ (Graph)  │  │ (Cache)  │  │(Storage) │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────────┘
          │             │             │             │
          │             │             │             │
┌─────────▼─────────────▼─────────────▼─────────────▼─────────────┐
│                   EXTERNAL SERVICES                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │OpenRouter│  │   Fal.ai │  │ElevenLabs│  │  FFmpeg  │       │
│  │(LLM API) │  │(Images)  │  │  (TTS)   │  │  (Video) │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Agent Hierarchy Structure

```
Master Orchestrator (orchestrator.ts)
    │
    ├─── Story Department Head (storyHead.ts)
    │    ├─── Story Architect Specialist
    │    ├─── Dialogue Writer Specialist
    │    ├─── World Builder Specialist
    │    ├─── Theme Analyzer Specialist
    │    └─── Episode Planner Specialist
    │
    ├─── Character Department Head (characterHead.ts)
    │    ├─── Character Creator Specialist
    │    ├─── Psychology Specialist
    │    ├─── Relationship Specialist
    │    └─── Arc Development Specialist
    │
    ├─── Visual Department Head (visualHead.ts)
    │    ├─── Art Director Specialist
    │    ├─── Style Designer Specialist
    │    └─── Color Theory Specialist
    │
    ├─── Video Department Head (videoHead.ts)
    │    ├─── Scene Assembler Specialist
    │    ├─── Quality Verifier Specialist
    │    └─── Audio Integrator Specialist
    │
    ├─── Audio Department Head (audioHead.ts)
    │    ├─── Music Composer Specialist
    │    ├─── Sound Designer Specialist
    │    ├─── Foley Artist Specialist
    │    ├─── Audio Mixer Specialist
    │    └─── Voice Creator Specialist
    │
    └─── Production Department Head (productionHead.ts)
         ├─── Production Manager Specialist
         ├─── Quality Controller Specialist
         ├─── Budget Coordinator Specialist
         └─── Scheduler Specialist
```

---

## 3. Data Flow Architecture

### 3.1 End-to-End Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: REQUEST INTAKE & ANALYSIS                             │
└─────────────────────────────────────────────────────────────────┘

User Request
    │
    ├─→ [API Gateway] Validate & Authenticate
    │       ├─→ Check user permissions
    │       ├─→ Validate project access
    │       └─→ Create conversation ID
    │
    ├─→ [Data Prep Agent] Gather Context (50-200ms)
    │       ├─→ Query PayloadCMS for project data
    │       ├─→ Query Brain Service for relationships
    │       ├─→ Check Redis cache for recent context
    │       └─→ Build comprehensive context object
    │
    └─→ [Master Orchestrator] Analyze Request (1-3s)
            ├─→ Parse user intent
            ├─→ Identify required departments
            ├─→ Determine complexity score
            ├─→ Create execution plan
            └─→ Emit "orchestration-start" event

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: DEPARTMENT COORDINATION                               │
└─────────────────────────────────────────────────────────────────┘

Master Orchestrator
    │
    └─→ Parallel Department Execution
            │
            ├─→ [Department Head 1] (2-5s)
            │       ├─→ Assess relevance (0.5s)
            │       ├─→ Select specialists (0.3s)
            │       ├─→ Spawn specialists in parallel (1-3s)
            │       │   ├─→ Specialist A executes
            │       │   ├─→ Specialist B executes
            │       │   └─→ Specialist C executes
            │       ├─→ Review all outputs (0.5s)
            │       ├─→ Grade quality (0.3s)
            │       └─→ Synthesize department result (0.4s)
            │
            ├─→ [Department Head 2] (parallel)
            │       └─→ [Same workflow]
            │
            └─→ [Department Head N] (parallel)
                    └─→ [Same workflow]

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: QUALITY VALIDATION & AGGREGATION                      │
└─────────────────────────────────────────────────────────────────┘

All Department Results
    │
    ├─→ [Quality Gates] Multi-Stage Validation (0.5-1s)
    │       ├─→ Check individual quality scores
    │       ├─→ Validate cross-department consistency
    │       ├─→ Assess completeness
    │       └─→ Calculate overall quality score
    │
    ├─→ [Brain Service] Store Results (0.3-0.8s)
    │       ├─→ Create/update entities in Neo4j
    │       ├─→ Establish relationships
    │       ├─→ Update embeddings
    │       └─→ Validate data integrity
    │
    └─→ [Master Orchestrator] Final Aggregation (1-2s)
            ├─→ Synthesize all department outputs
            ├─→ Generate final recommendations
            ├─→ Create audit trail entry
            ├─→ Update execution metrics
            └─→ Emit "orchestration-complete" event

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: RESPONSE DELIVERY                                     │
└─────────────────────────────────────────────────────────────────┘

Final Result
    │
    ├─→ [Cache Layer] Store Result (Redis)
    │       └─→ TTL: 1 hour
    │
    ├─→ [Database] Persist Execution Record (MongoDB)
    │       ├─→ Save complete execution trace
    │       ├─→ Store all intermediate outputs
    │       └─→ Link to conversation
    │
    └─→ [WebSocket] Send to Client
            ├─→ Structured result object
            ├─→ Quality metrics
            ├─→ Recommendations
            └─→ Execution timeline

Total Time: 5-15 seconds (depending on complexity)
```

### 3.2 Data Preparation Pipeline

```
Input Data (Character, Scene, Episode, etc.)
    │
    ▼
┌────────────────────────────────────────┐
│  1. CONTEXT GATHERING (50-200ms)      │
│  ───────────────────────────────       │
│  Sources:                              │
│  • PayloadCMS Collections              │
│    - Characters                        │
│    - Scenes                            │
│    - Episodes                          │
│    - Projects                          │
│  • Brain Service (Neo4j)               │
│    - Related entities                  │
│    - Relationships                     │
│    - Historical data                   │
│  • Redis Cache                         │
│    - Recent context                    │
│    - Project metadata                  │
└──────────────┬─────────────────────────┘
               ▼
┌────────────────────────────────────────┐
│  2. METADATA GENERATION (500-1500ms)   │
│  ──────────────────────────────        │
│  LLM-Powered Analysis:                 │
│  • Summary generation                  │
│  • Key themes extraction               │
│  • Tone analysis                       │
│  • Importance scoring                  │
│  • Categorization                      │
│  • Tags generation                     │
└──────────────┬─────────────────────────┘
               ▼
┌────────────────────────────────────────┐
│  3. DATA ENRICHMENT (200-500ms)        │
│  ─────────────────────────             │
│  Enhancements:                         │
│  • Related entity linking              │
│  • Missing field inference             │
│  • Consistency validation              │
│  • Format standardization              │
│  • Embedding generation                │
└──────────────┬─────────────────────────┘
               ▼
┌────────────────────────────────────────┐
│  4. RELATIONSHIP DISCOVERY (800-2000ms)│
│  ─────────────────────────────────     │
│  LLM Analysis:                         │
│  • Detect character relationships      │
│  • Identify story connections          │
│  • Map dependencies                    │
│  • Infer implicit links                │
│  • Calculate relationship strength     │
└──────────────┬─────────────────────────┘
               ▼
┌────────────────────────────────────────┐
│  5. DOCUMENT VALIDATION (50-100ms)     │
│  ────────────────────────────          │
│  Checks:                               │
│  • Required fields present             │
│  • Data types correct                  │
│  • Relationships valid                 │
│  • No circular dependencies            │
│  • Meets quality thresholds            │
└──────────────┬─────────────────────────┘
               ▼
┌────────────────────────────────────────┐
│  6. BRAIN DOCUMENT CREATION (10ms)     │
│  ─────────────────────────────         │
│  Final Structure:                      │
│  {                                     │
│    id: string                          │
│    type: string                        │
│    project_id: string                  │
│    text: string (searchable)           │
│    metadata: {...}                     │
│    relationships: [...]                │
│  }                                     │
└──────────────┬─────────────────────────┘
               ▼
       Brain Service Ready
```

### 3.3 Event Flow Diagram

```
User Action → WebSocket Connection → Server
    │                                   │
    │  ┌────────────────────────────────┘
    │  │
    ▼  ▼
┌──────────────────────────────────────────┐
│         Event Emitter                    │
│  (orchestrator, departments, agents)     │
└───────┬──────────────────────────────────┘
        │
        ├─→ orchestration-start
        │   └─→ Broadcast to WebSocket clients
        │
        ├─→ department-assigned
        │   └─→ Update UI: Department cards
        │
        ├─→ department-head-start
        │   └─→ Show "analyzing..." status
        │
        ├─→ specialist-spawned
        │   └─→ Add specialist to UI
        │
        ├─→ specialist-executing
        │   └─→ Show progress indicator
        │
        ├─→ specialist-complete
        │   └─→ Display result preview
        │
        ├─→ department-review
        │   └─→ Show quality scores
        │
        ├─→ department-complete
        │   └─→ Mark department as done
        │
        ├─→ quality-validation
        │   └─→ Display validation results
        │
        ├─→ brain-storage
        │   └─→ Show storage confirmation
        │
        └─→ orchestration-complete
            └─→ Show final results & metrics

All events stored in:
  • MongoDB: agent-executions collection
  • Redis: Event stream (7-day retention)
```

---

## 4. Database Schema & ERD

### 4.1 PayloadCMS Collections Schema

#### Departments Collection

```typescript
{
  slug: string (unique, indexed)              // "story", "character", etc.
  name: string                                // "Story Department"
  description: text                           // Department purpose
  icon: string                                // Emoji/icon
  color: string                               // Hex color for UI
  priority: number (1-10)                     // Execution order
  isActive: boolean (default: true)           // Enable/disable

  // @codebuff/sdk Integration
  defaultModel: string                        // "anthropic/claude-3.5-sonnet"
  maxAgentSteps: number (default: 20)         // Max steps per execution

  // Performance
  averageExecutionTime: number                // milliseconds
  totalExecutions: number                     // counter
  successRate: number                         // percentage

  // Metadata
  createdAt: date (auto)
  updatedAt: date (auto)
}

Indexes:
  - slug (unique)
  - isActive + priority
  - successRate (desc)
```

#### Agents Collection

```typescript
{
  agentId: string (unique, indexed)           // "story-head-001"
  name: string                                // "Story Department Head"
  description: text                           // Agent purpose

  // Department Relationship
  department: relationship (Departments)      // Foreign key
  isDepartmentHead: boolean (default: false)  // One per department

  // @codebuff/sdk Configuration
  model: string                               // "anthropic/claude-3.5-sonnet"
  instructionsPrompt: text (large)            // Core system prompt
  toolNames: array<string>                    // Custom tools
  maxAgentSteps: number (default: 20)         // Execution limit

  // Capabilities
  specialization: string                      // "dialogue", "plot-structure"
  skills: array<string>                       // ["character-development"]
  requiredContext: array<string>              // ["project", "characters"]

  // Performance Metrics
  isActive: boolean (default: true)
  successRate: number (0-100)                 // Calculated
  averageExecutionTime: number                // milliseconds
  totalExecutions: number (default: 0)        // Counter
  averageQualityScore: number (0-100)         // Calculated

  // Quality Control
  requiresReview: boolean (default: true)     // Dept heads = false
  qualityThreshold: number (default: 80)      // Minimum score
  maxRetries: number (default: 3)             // On failure

  // Cost Management
  estimatedTokensPerRun: number               // Average tokens
  totalTokensUsed: number (default: 0)        // Counter

  // Metadata
  createdAt: date (auto)
  updatedAt: date (auto)
  lastExecutedAt: date (nullable)             // Last run timestamp

  // Versioning
  version: string (default: "1.0.0")          // Agent version
  changelog: array<{
    version: string
    changes: string
    date: date
  }>
}

Indexes:
  - agentId (unique)
  - department + isDepartmentHead
  - isActive + successRate (desc)
  - specialization
  - lastExecutedAt (desc)

Validation Rules:
  - Only ONE agent per department with isDepartmentHead = true
  - Department heads MUST have requiresReview = false
  - Specialists MUST have requiresReview = true
```

#### Agent Executions Collection

```typescript
{
  executionId: string (unique, auto)          // UUID

  // Agent Info
  agent: relationship (Agents)                // Foreign key
  department: relationship (Departments)      // Foreign key

  // Execution Context
  project: relationship (Projects)            // Foreign key
  episode: relationship (Episodes, optional)  // Foreign key
  conversationId: string (indexed)            // Link to conversation
  parentExecutionId: string (nullable)        // If spawned by another agent

  // Input/Output
  prompt: text (large)                        // User/system prompt
  params: json                                // Additional parameters
  output: json (large)                        // Agent output

  // @codebuff/sdk State
  runState: json (large)                      // Complete RunState from SDK
  events: array<json>                         // All events during execution
  toolCalls: array<{
    toolName: string
    input: json
    output: json
    timestamp: date
    duration: number
  }>

  // Performance Metrics
  status: enum [                              // Execution status
    "pending",
    "running",
    "completed",
    "failed",
    "cancelled",
    "retry"
  ]
  startedAt: date (indexed)                   // Start timestamp
  completedAt: date (nullable)                // End timestamp
  executionTime: number                       // milliseconds
  tokenUsage: {
    input: number
    output: number
    total: number
    cost: number                              // USD
  }

  // Quality Metrics
  qualityScore: number (0-100, nullable)      // AI-assessed quality
  relevanceScore: number (0-100, nullable)    // Relevance to task
  consistencyScore: number (0-100, nullable)  // Cross-department consistency
  overallScore: number (0-100, nullable)      // Weighted average

  // Review Status
  reviewStatus: enum [
    "pending",
    "approved",
    "rejected",
    "revision-needed"
  ]
  reviewedBy: relationship (Agents, optional) // Department head
  reviewedAt: date (nullable)
  reviewNotes: text (nullable)

  // Error Handling
  error: json (nullable)                      // Error details if failed
  retryCount: number (default: 0)             // Number of retries
  retryReason: text (nullable)                // Why retry occurred

  // Metadata
  createdAt: date (auto, indexed)
  updatedAt: date (auto)
}

Indexes:
  - executionId (unique)
  - agent + status
  - department + status
  - project + conversationId
  - startedAt (desc)
  - status + createdAt (desc)
  - qualityScore (desc)

TTL Index:
  - createdAt (90 days retention for completed executions)
```

#### Custom Tools Collection

```typescript
{
  toolName: string (unique, indexed)          // "gradeOutput"
  displayName: string                         // "Grade Output Tool"
  description: text                           // Tool purpose

  // Tool Configuration
  inputSchema: json                           // Zod schema as JSON
  exampleInputs: array<json>                  // Example usage
  outputSchema: json (nullable)               // Expected output structure

  // Implementation
  executeFunction: text (large)               // JavaScript function code
  dependencies: array<string>                 // NPM packages required

  // Availability
  departments: array<relationship>            // Which departments can use
  isGlobal: boolean (default: false)          // Available to all agents
  requiresAuth: boolean (default: false)      // Needs authentication

  // Rate Limiting
  rateLimit: {
    maxCalls: number                          // Max calls per window
    windowMs: number                          // Time window (ms)
  }

  // Performance
  averageExecutionTime: number                // milliseconds
  totalExecutions: number (default: 0)        // Counter
  errorRate: number (0-100)                   // Percentage

  // Status
  isActive: boolean (default: true)
  version: string (default: "1.0.0")

  // Metadata
  createdAt: date (auto)
  updatedAt: date (auto)
  createdBy: relationship (Users)
}

Indexes:
  - toolName (unique)
  - isActive + isGlobal
  - departments
```

### 4.2 Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│   Projects      │
│─────────────────│
│ id              │──┐
│ slug            │  │
│ name            │  │
│ settings        │  │
└─────────────────┘  │
                     │
        ┌────────────┘
        │
        │  ┌─────────────────┐
        │  │   Episodes      │
        │  │─────────────────│
        │  │ id              │
        └──│ projectId       │──┐
           │ episodeNumber   │  │
           │ title           │  │
           └─────────────────┘  │
                                │
           ┌────────────────────┘
           │
           │  ┌─────────────────┐
           │  │   Scenes        │
           │  │─────────────────│
           │  │ id              │
           └──│ episodeId       │
              │ sceneNumber     │
              │ content         │
              └─────────────────┘

┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Departments    │──────│     Agents      │──────│ Agent Executions│
│─────────────────│ 1:N  │─────────────────│ 1:N  │─────────────────│
│ id              │      │ id              │      │ id              │
│ slug (PK)       │◄─────│ department (FK) │◄─────│ agent (FK)      │
│ name            │      │ agentId (PK)    │      │ department (FK) │
│ priority        │      │ isDepartmentHead│      │ executionId (PK)│
│ defaultModel    │      │ model           │      │ status          │
│ isActive        │      │ instructionsPrompt│    │ output          │
└─────────────────┘      │ toolNames       │      │ qualityScore    │
                         │ specialization  │      │ tokenUsage      │
                         │ isActive        │      │ reviewStatus    │
                         │ qualityThreshold│      │ startedAt       │
                         └─────────────────┘      │ completedAt     │
                                                  └─────────────────┘
                                │                          │
                                │                          │
                         ┌──────▼──────────┐      ┌───────▼────────┐
                         │  Custom Tools   │      │ Conversations  │
                         │─────────────────│      │────────────────│
                         │ id              │      │ id             │
                         │ toolName (PK)   │      │ conversationId │
                         │ description     │      │ projectId      │
                         │ executeFunction │      │ messages       │
                         │ inputSchema     │      │ status         │
                         │ departments []  │      └────────────────┘
                         │ isGlobal        │
                         │ isActive        │
                         └─────────────────┘

Relationships:
  • Projects 1:N Episodes
  • Episodes 1:N Scenes
  • Departments 1:N Agents
  • Agents 1:N Agent Executions
  • Projects 1:N Agent Executions
  • Episodes 1:N Agent Executions
  • Conversations 1:N Agent Executions
  • Agents N:M Custom Tools (via departments)
```

### 4.3 Neo4j Graph Schema (Brain Service)

```cypher
// Node Types
(:Character {
  id: string,
  name: string,
  projectId: string,
  type: "character"
})

(:Scene {
  id: string,
  sceneNumber: number,
  episodeId: string,
  projectId: string,
  type: "scene"
})

(:Episode {
  id: string,
  episodeNumber: number,
  projectId: string,
  type: "episode"
})

(:Project {
  id: string,
  slug: string,
  name: string,
  type: "project"
})

// Relationship Types
(:Character)-[:APPEARS_IN {role: string}]->(:Scene)
(:Character)-[:RELATED_TO {type: string, strength: number}]->(:Character)
(:Scene)-[:BELONGS_TO]->(:Episode)
(:Episode)-[:PART_OF]->(:Project)
(:Character)-[:CREATED_IN]->(:Project)

// Example Graph Structure
(Project {slug: "movie-xyz"})
    ├─ [:PART_OF]─ (Episode {number: 1})
    │   └─ [:BELONGS_TO]─ (Scene {number: 1})
    │       ├─ [:APPEARS_IN]─ (Character {name: "Hero"})
    │       └─ [:APPEARS_IN]─ (Character {name: "Villain"})
    │
    └─ [:CREATED_IN]─ (Character {name: "Hero"})
        └─ [:RELATED_TO {type: "enemy", strength: 0.9}]─ (Character {name: "Villain"})
```

---

## 5. Real-time Event Streaming

### 5.1 WebSocket Architecture

```typescript
// WebSocket Server Implementation
import { WebSocketServer, WebSocket } from 'ws'
import { EventEmitter } from 'events'

class AgentEventStreamer extends EventEmitter {
  private wss: WebSocketServer
  private clients: Map<string, Set<WebSocket>>

  constructor(port: number) {
    super()
    this.wss = new WebSocketServer({ port })
    this.clients = new Map()

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req)
    })
  }

  // Subscribe client to execution events
  subscribe(executionId: string, ws: WebSocket) {
    if (!this.clients.has(executionId)) {
      this.clients.set(executionId, new Set())
    }
    this.clients.get(executionId)!.add(ws)
  }

  // Broadcast event to subscribed clients
  broadcast(executionId: string, event: AgentEvent) {
    const subscribers = this.clients.get(executionId)
    if (!subscribers) return

    const message = JSON.stringify(event)
    subscribers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message)
      }
    })
  }

  // Clean up closed connections
  cleanup(executionId: string, ws: WebSocket) {
    this.clients.get(executionId)?.delete(ws)
  }
}

// Event Types
type AgentEvent =
  | { type: 'orchestration-start', timestamp: Date, executionId: string }
  | { type: 'department-assigned', department: string, relevance: number }
  | { type: 'department-head-start', department: string, agentId: string }
  | { type: 'specialist-spawned', specialistId: string, task: string }
  | { type: 'specialist-executing', specialistId: string, progress: number }
  | { type: 'specialist-complete', specialistId: string, output: any, qualityScore: number }
  | { type: 'department-review', department: string, score: number, decision: string }
  | { type: 'department-complete', department: string, outputs: any[] }
  | { type: 'quality-validation', overallScore: number, consistency: number }
  | { type: 'brain-storage', success: boolean, entities: number }
  | { type: 'orchestration-complete', result: any, metrics: any }
  | { type: 'error', error: string, context: any }

// Client-side subscription
const ws = new WebSocket('ws://localhost:3001')

ws.on('open', () => {
  ws.send(JSON.stringify({
    action: 'subscribe',
    executionId: 'exec-123'
  }))
})

ws.on('message', (data) => {
  const event = JSON.parse(data.toString())
  handleAgentEvent(event)
})
```

### 5.2 Event Flow Patterns

```typescript
// Pattern 1: Orchestration Start
{
  type: 'orchestration-start',
  executionId: 'exec-123',
  timestamp: '2025-10-01T10:00:00Z',
  context: {
    projectId: 'proj-abc',
    userPrompt: 'Create a new character...',
    complexity: 'medium'
  }
}

// Pattern 2: Department Processing
{
  type: 'department-assigned',
  executionId: 'exec-123',
  department: 'character',
  relevance: 0.95,
  estimatedTime: 5000 // ms
}

{
  type: 'department-head-start',
  executionId: 'exec-123',
  department: 'character',
  agentId: 'character-head-001',
  instructions: '...'
}

// Pattern 3: Specialist Execution
{
  type: 'specialist-spawned',
  executionId: 'exec-123',
  department: 'character',
  specialistId: 'character-creator-001',
  task: 'Create character profile',
  estimatedTime: 2000
}

{
  type: 'specialist-executing',
  executionId: 'exec-123',
  specialistId: 'character-creator-001',
  progress: 0.45, // 0-1
  currentStep: 'Analyzing traits'
}

{
  type: 'specialist-complete',
  executionId: 'exec-123',
  specialistId: 'character-creator-001',
  output: { name: 'Hero', traits: [...] },
  qualityScore: 0.87,
  executionTime: 2340
}

// Pattern 4: Quality Review
{
  type: 'department-review',
  executionId: 'exec-123',
  department: 'character',
  reviewedBy: 'character-head-001',
  scores: {
    quality: 0.87,
    relevance: 0.92,
    consistency: 0.85,
    overall: 0.88
  },
  decision: 'approved',
  issues: [],
  suggestions: ['Consider adding more backstory']
}

// Pattern 5: Final Results
{
  type: 'orchestration-complete',
  executionId: 'exec-123',
  result: {
    departments: [...],
    overallQuality: 0.88,
    consistency: 0.85,
    recommendation: 'ingest'
  },
  metrics: {
    totalTime: 8234,
    tokensUsed: 4521,
    agentsSpawned: 7
  }
}
```

### 5.3 Redis Pub/Sub for Event Distribution

```typescript
// Publisher (Agent Execution)
import Redis from 'ioredis'

const publisher = new Redis(process.env.REDIS_URL)

async function publishEvent(executionId: string, event: AgentEvent) {
  await publisher.publish(`execution:${executionId}`, JSON.stringify(event))

  // Also publish to global channel for monitoring
  await publisher.publish('execution:all', JSON.stringify({
    executionId,
    ...event
  }))
}

// Subscriber (WebSocket Server)
const subscriber = new Redis(process.env.REDIS_URL)

subscriber.on('message', (channel, message) => {
  if (channel.startsWith('execution:')) {
    const executionId = channel.split(':')[1]
    const event = JSON.parse(message)

    // Broadcast to WebSocket clients
    streamer.broadcast(executionId, event)
  }
})

// Subscribe to all execution channels
subscriber.psubscribe('execution:*')
```

---

## 6. Quality Scoring System

### 6.1 Multi-Dimensional Quality Assessment

```typescript
interface QualityScores {
  // Individual Dimensions (0-100)
  qualityScore: number        // Content quality
  relevanceScore: number      // Task relevance
  consistencyScore: number    // Cross-department consistency
  completenessScore: number   // Task completion
  creativityScore: number     // Creative merit (for story/character)
  technicalScore: number      // Technical accuracy (for video/audio)

  // Weighted Overall (0-100)
  overallScore: number

  // Confidence (0-1)
  confidence: number
}

// Scoring Weights by Department
const DEPARTMENT_WEIGHTS = {
  story: {
    quality: 0.30,
    relevance: 0.25,
    consistency: 0.20,
    completeness: 0.15,
    creativity: 0.10
  },
  character: {
    quality: 0.30,
    relevance: 0.20,
    consistency: 0.25,
    completeness: 0.15,
    creativity: 0.10
  },
  visual: {
    quality: 0.35,
    relevance: 0.20,
    consistency: 0.20,
    completeness: 0.15,
    technical: 0.10
  },
  video: {
    quality: 0.30,
    relevance: 0.15,
    consistency: 0.15,
    completeness: 0.20,
    technical: 0.20
  },
  audio: {
    quality: 0.35,
    relevance: 0.15,
    consistency: 0.15,
    completeness: 0.15,
    technical: 0.20
  },
  production: {
    quality: 0.25,
    relevance: 0.25,
    consistency: 0.20,
    completeness: 0.30
  }
}

// Calculate weighted overall score
function calculateOverallScore(
  scores: Partial<QualityScores>,
  department: string
): number {
  const weights = DEPARTMENT_WEIGHTS[department]
  let total = 0
  let weightSum = 0

  for (const [dimension, weight] of Object.entries(weights)) {
    if (scores[dimension] !== undefined) {
      total += scores[dimension] * weight
      weightSum += weight
    }
  }

  return weightSum > 0 ? total / weightSum : 0
}
```

### 6.2 Quality Thresholds & Decision Matrix

```typescript
// Quality Thresholds
const QUALITY_THRESHOLDS = {
  // Individual Agent Outputs
  specialist: {
    minimum: 60,      // Below this = reject
    acceptable: 70,   // 70-79 = accept with warnings
    good: 80,         // 80-89 = accept
    excellent: 90     // 90+ = exemplary
  },

  // Department Level
  department: {
    minimum: 65,
    acceptable: 75,
    good: 85,
    excellent: 92
  },

  // Overall Project Level
  overall: {
    minimum: 70,
    acceptable: 80,
    good: 88,
    excellent: 95
  },

  // Consistency Thresholds
  consistency: {
    minimum: 60,      // Below this = flag inconsistencies
    acceptable: 75,   // 75-84 = minor inconsistencies
    good: 85,         // 85+ = consistent
  }
}

// Decision Matrix
type QualityDecision = 'reject' | 'retry' | 'accept-with-revision' | 'accept' | 'exemplary'

function getQualityDecision(
  overallScore: number,
  consistencyScore: number,
  level: 'specialist' | 'department' | 'overall'
): QualityDecision {
  const thresholds = QUALITY_THRESHOLDS[level]

  // Check consistency first
  if (consistencyScore < QUALITY_THRESHOLDS.consistency.minimum) {
    return 'retry'
  }

  // Then check overall quality
  if (overallScore < thresholds.minimum) {
    return 'reject'
  } else if (overallScore < thresholds.acceptable) {
    return 'retry'
  } else if (overallScore < thresholds.good) {
    return consistencyScore >= QUALITY_THRESHOLDS.consistency.good
      ? 'accept'
      : 'accept-with-revision'
  } else if (overallScore < thresholds.excellent) {
    return 'accept'
  } else {
    return 'exemplary'
  }
}
```

### 6.3 LLM-Based Quality Assessment Prompt

```typescript
const QUALITY_ASSESSMENT_PROMPT = `
You are a quality assessment expert for the ${department} department.

Evaluate the following output on these dimensions:

1. QUALITY (0-100): How well-crafted and professional is the output?
   - Grammar, clarity, structure
   - Attention to detail
   - Polish and refinement

2. RELEVANCE (0-100): How well does it address the task?
   - Directly answers the prompt
   - Stays on topic
   - Provides requested information

3. CONSISTENCY (0-100): How consistent is it with existing project data?
   - Matches established facts
   - Consistent with character traits
   - Aligns with story direction

4. COMPLETENESS (0-100): How thorough is the output?
   - All requested elements present
   - Sufficient detail
   - No major gaps

${department === 'story' || department === 'character' ? `
5. CREATIVITY (0-100): How creative and engaging is it?
   - Original ideas
   - Interesting concepts
   - Compelling narrative
` : ''}

${department === 'video' || department === 'audio' || department === 'visual' ? `
5. TECHNICAL (0-100): How technically sound is it?
   - Follows technical standards
   - Feasible to implement
   - Production-ready quality
` : ''}

TASK:
${task}

OUTPUT TO EVALUATE:
${output}

EXISTING PROJECT CONTEXT:
${context}

Provide your assessment as JSON:
{
  "qualityScore": number,
  "relevanceScore": number,
  "consistencyScore": number,
  "completenessScore": number,
  ${department === 'story' || department === 'character' ? '"creativityScore": number,' : ''}
  ${department === 'video' || department === 'audio' || department === 'visual' ? '"technicalScore": number,' : ''}
  "overallScore": number,
  "confidence": number (0-1),
  "issues": string[],
  "suggestions": string[],
  "decision": "reject" | "retry" | "accept-with-revision" | "accept" | "exemplary",
  "reasoning": string
}
`
```

---

## 7. Token Usage Optimization

### 7.1 Token Management Strategy

```typescript
// Token Budget Configuration
const TOKEN_BUDGETS = {
  // Per-Agent Token Limits
  specialist: {
    maxInput: 4000,
    maxOutput: 2000,
    maxTotal: 6000
  },
  departmentHead: {
    maxInput: 8000,
    maxOutput: 4000,
    maxTotal: 12000
  },
  orchestrator: {
    maxInput: 12000,
    maxOutput: 6000,
    maxTotal: 18000
  },

  // Per-Project Token Budgets
  project: {
    daily: 500000,      // 500K tokens per day
    perExecution: 50000 // 50K tokens per execution
  }
}

// Token Cost Tracking
interface TokenUsage {
  agentId: string
  executionId: string
  input: number
  output: number
  total: number
  cost: number      // USD
  timestamp: Date
}

class TokenManager {
  private usageLog: TokenUsage[] = []

  async trackUsage(usage: TokenUsage) {
    this.usageLog.push(usage)

    // Store in database
    await payload.create({
      collection: 'token-usage',
      data: usage
    })

    // Check if budget exceeded
    const dailyUsage = this.getDailyUsage(usage.timestamp)
    if (dailyUsage > TOKEN_BUDGETS.project.daily) {
      throw new Error('Daily token budget exceeded')
    }
  }

  getDailyUsage(date: Date): number {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    return this.usageLog
      .filter(u => u.timestamp >= startOfDay)
      .reduce((sum, u) => sum + u.total, 0)
  }

  estimateCost(tokens: number, model: string): number {
    // Pricing for Claude Sonnet 4.5 via OpenRouter
    const PRICING = {
      'anthropic/claude-sonnet-4.5': {
        input: 3.00 / 1_000_000,   // $3 per 1M input tokens
        output: 15.00 / 1_000_000   // $15 per 1M output tokens
      }
    }

    const rates = PRICING[model]
    if (!rates) return 0

    // Assume 70/30 split for input/output
    const inputTokens = tokens * 0.7
    const outputTokens = tokens * 0.3

    return (inputTokens * rates.input) + (outputTokens * rates.output)
  }
}
```

### 7.2 Context Optimization Strategies

```typescript
// 1. Intelligent Context Pruning
class ContextOptimizer {
  /**
   * Reduce context size while preserving relevance
   */
  pruneContext(fullContext: any, task: string, maxTokens: number): any {
    // Extract most relevant information
    const relevantCharacters = this.extractRelevantEntities(
      fullContext.characters,
      task,
      'character'
    )

    const relevantScenes = this.extractRelevantEntities(
      fullContext.scenes,
      task,
      'scene'
    )

    // Build optimized context
    return {
      project: {
        id: fullContext.project.id,
        name: fullContext.project.name,
        settings: this.summarizeSettings(fullContext.project.settings)
      },
      characters: relevantCharacters.slice(0, 10), // Top 10
      scenes: relevantScenes.slice(0, 5),          // Top 5
      summary: this.generateSummary(fullContext)
    }
  }

  /**
   * Use LLM to extract most relevant entities
   */
  async extractRelevantEntities(
    entities: any[],
    task: string,
    type: string
  ): Promise<any[]> {
    if (entities.length <= 5) return entities

    const prompt = `
      Task: ${task}

      ${type}s available: ${entities.map(e => e.name).join(', ')}

      Return the 5 most relevant ${type}s for this task as JSON array of names.
    `

    const relevant = await llm.completeJSON<string[]>(prompt)

    return entities.filter(e => relevant.includes(e.name))
  }
}

// 2. Caching Strategy
class ContextCache {
  private redis: Redis

  async getCachedContext(projectId: string): Promise<any | null> {
    const cached = await this.redis.get(`context:${projectId}`)
    return cached ? JSON.parse(cached) : null
  }

  async setCachedContext(projectId: string, context: any, ttl: number = 300) {
    await this.redis.setex(
      `context:${projectId}`,
      ttl,
      JSON.stringify(context)
    )
  }

  async invalidateCache(projectId: string) {
    await this.redis.del(`context:${projectId}`)
  }
}

// 3. Prompt Compression
function compressPrompt(prompt: string): string {
  return prompt
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove code comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    // Trim
    .trim()
}

// 4. Response Truncation
const RESPONSE_LIMITS = {
  specialist: {
    maxLength: 2000,
    summarizeIfExceeds: true
  },
  departmentHead: {
    maxLength: 4000,
    summarizeIfExceeds: true
  }
}

async function truncateResponse(
  response: string,
  limits: typeof RESPONSE_LIMITS.specialist
): Promise<string> {
  if (response.length <= limits.maxLength) {
    return response
  }

  if (limits.summarizeIfExceeds) {
    // Use LLM to summarize
    return await llm.complete(`
      Summarize the following in ${limits.maxLength} characters or less:

      ${response}
    `, {
      maxTokens: Math.floor(limits.maxLength / 4)
    })
  }

  return response.substring(0, limits.maxLength) + '...'
}
```

### 7.3 Model Selection Strategy

```typescript
// Dynamic model selection based on task complexity
function selectOptimalModel(task: string, context: any): string {
  const complexity = assessComplexity(task, context)

  if (complexity.score < 30) {
    // Simple tasks: Use cheaper model
    return 'anthropic/claude-haiku-3.5'  // $0.25/$1.25 per 1M tokens
  } else if (complexity.score < 70) {
    // Medium tasks: Use standard model
    return 'anthropic/claude-sonnet-4.5' // $3/$15 per 1M tokens
  } else {
    // Complex tasks: Use premium model
    return 'anthropic/claude-opus-4'     // $15/$75 per 1M tokens
  }
}

function assessComplexity(task: string, context: any): { score: number, factors: string[] } {
  let score = 0
  const factors: string[] = []

  // Check task length
  if (task.length > 500) {
    score += 20
    factors.push('Long task description')
  }

  // Check context size
  const contextSize = JSON.stringify(context).length
  if (contextSize > 10000) {
    score += 25
    factors.push('Large context')
  }

  // Check for complexity keywords
  const complexKeywords = ['analyze', 'synthesize', 'creative', 'comprehensive']
  const foundKeywords = complexKeywords.filter(kw =>
    task.toLowerCase().includes(kw)
  )
  score += foundKeywords.length * 10
  if (foundKeywords.length > 0) {
    factors.push(`Complex requirements: ${foundKeywords.join(', ')}`)
  }

  // Check for multi-step requirements
  const steps = task.split(/\n|;|and then|next|after that/i).length
  if (steps > 3) {
    score += 15
    factors.push('Multi-step task')
  }

  return { score: Math.min(score, 100), factors }
}
```

---

## 8. Error Handling & Retry Mechanisms

### 8.1 Error Classification

```typescript
enum ErrorType {
  // Transient Errors (retry)
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',

  // Permanent Errors (don't retry)
  INVALID_INPUT = 'invalid_input',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  VALIDATION_ERROR = 'validation_error',

  // Agent Errors
  AGENT_FAILURE = 'agent_failure',
  QUALITY_THRESHOLD_NOT_MET = 'quality_threshold_not_met',
  CONTEXT_TOO_LARGE = 'context_too_large',

  // System Errors
  DATABASE_ERROR = 'database_error',
  CACHE_ERROR = 'cache_error',
  UNKNOWN_ERROR = 'unknown_error'
}

interface ErrorContext {
  type: ErrorType
  message: string
  retryable: boolean
  retryStrategy?: RetryStrategy
  context: any
  timestamp: Date
}

function classifyError(error: any): ErrorContext {
  // Check error message/code
  if (error.message?.includes('rate limit')) {
    return {
      type: ErrorType.RATE_LIMIT,
      message: error.message,
      retryable: true,
      retryStrategy: 'exponential-backoff',
      context: error,
      timestamp: new Date()
    }
  }

  if (error.code === 'ETIMEDOUT') {
    return {
      type: ErrorType.TIMEOUT,
      message: 'Request timed out',
      retryable: true,
      retryStrategy: 'linear',
      context: error,
      timestamp: new Date()
    }
  }

  // Add more classification logic...

  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: error.message,
    retryable: false,
    context: error,
    timestamp: new Date()
  }
}
```

### 8.2 Retry Strategies

```typescript
type RetryStrategy = 'linear' | 'exponential-backoff' | 'fibonacci' | 'custom'

interface RetryConfig {
  maxAttempts: number
  strategy: RetryStrategy
  baseDelay: number        // milliseconds
  maxDelay: number         // milliseconds
  backoffMultiplier: number
  jitter: boolean          // Add randomness to prevent thundering herd
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  strategy: 'exponential-backoff',
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true
}

class RetryHandler {
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
    let lastError: any

    for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        const errorContext = classifyError(error)

        // Don't retry if error is not retryable
        if (!errorContext.retryable) {
          throw error
        }

        // Don't retry on last attempt
        if (attempt === retryConfig.maxAttempts - 1) {
          break
        }

        // Calculate delay
        const delay = this.calculateDelay(
          attempt,
          retryConfig.strategy,
          retryConfig.baseDelay,
          retryConfig.maxDelay,
          retryConfig.backoffMultiplier,
          retryConfig.jitter
        )

        console.log(`Retry attempt ${attempt + 1}/${retryConfig.maxAttempts} after ${delay}ms`)

        // Wait before retrying
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  private calculateDelay(
    attempt: number,
    strategy: RetryStrategy,
    baseDelay: number,
    maxDelay: number,
    multiplier: number,
    jitter: boolean
  ): number {
    let delay: number

    switch (strategy) {
      case 'linear':
        delay = baseDelay * (attempt + 1)
        break

      case 'exponential-backoff':
        delay = baseDelay * Math.pow(multiplier, attempt)
        break

      case 'fibonacci':
        delay = baseDelay * this.fibonacci(attempt + 1)
        break

      default:
        delay = baseDelay
    }

    // Cap at max delay
    delay = Math.min(delay, maxDelay)

    // Add jitter (±25% randomness)
    if (jitter) {
      const jitterAmount = delay * 0.25
      delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount)
    }

    return Math.floor(delay)
  }

  private fibonacci(n: number): number {
    if (n <= 1) return 1
    let a = 1, b = 1
    for (let i = 2; i < n; i++) {
      [a, b] = [b, a + b]
    }
    return b
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### 8.3 Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private failureCount = 0
  private successCount = 0
  private lastFailureTime?: Date

  constructor(
    private threshold: number = 5,           // Failures before opening
    private timeout: number = 60000,         // Time to wait before half-open (ms)
    private halfOpenSuccesses: number = 2    // Successes needed to close
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if we should transition to half-open
      if (this.shouldAttemptReset()) {
        this.state = 'half-open'
        console.log('Circuit breaker: Attempting reset (half-open)')
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    if (this.state === 'half-open') {
      this.successCount++
      if (this.successCount >= this.halfOpenSuccesses) {
        console.log('Circuit breaker: Closing (service recovered)')
        this.state = 'closed'
        this.failureCount = 0
        this.successCount = 0
      }
    } else {
      this.failureCount = 0
    }
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = new Date()
    this.successCount = 0

    if (this.failureCount >= this.threshold) {
      console.log('Circuit breaker: Opening (threshold reached)')
      this.state = 'open'
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false
    const timeSinceFailure = Date.now() - this.lastFailureTime.getTime()
    return timeSinceFailure >= this.timeout
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    }
  }
}

// Usage
const codebuffCircuitBreaker = new CircuitBreaker(5, 60000, 2)

async function executeAgent(config: any) {
  return await codebuffCircuitBreaker.execute(async () => {
    return await codebuff.run(config)
  })
}
```

---

## 9. Scalability & Performance

### 9.1 Horizontal Scaling Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Load Balancer (nginx)                    │
│                     Round-robin / Least-conn                  │
└────────────┬───────────────────────────┬─────────────────────┘
             │                           │
    ┌────────▼────────┐         ┌────────▼────────┐
    │  App Server 1   │         │  App Server 2   │
    │  (Next.js)      │         │  (Next.js)      │
    │                 │         │                 │
    │  - API Routes   │         │  - API Routes   │
    │  - Orchestrator │         │  - Orchestrator │
    │  - Agent Pool   │         │  - Agent Pool   │
    └────────┬────────┘         └────────┬────────┘
             │                           │
             └─────────────┬─────────────┘
                           │
    ┌──────────────────────▼─────────────────────┐
    │         Shared Redis Cluster               │
    │  - Session state                           │
    │  - Context cache                           │
    │  - Pub/Sub for events                      │
    │  - Rate limiting                           │
    └──────────────────────┬─────────────────────┘
                           │
    ┌──────────────────────▼─────────────────────┐
    │         MongoDB Replica Set                │
    │  - Primary: Writes                         │
    │  - Secondary: Reads                        │
    │  - Arbiter: Elections                      │
    └────────────────────────────────────────────┘

Scaling Strategies:
  • Auto-scaling based on CPU/memory usage
  • Vertical scaling for database (increase resources)
  • Read replicas for MongoDB (query distribution)
  • Redis Cluster for cache distribution
  • CDN for static assets
```

### 9.2 Performance Optimization Techniques

```typescript
// 1. Connection Pooling
import { MongoClient } from 'mongodb'
import Redis from 'ioredis'

const mongoClient = new MongoClient(process.env.MONGODB_URI!, {
  maxPoolSize: 50,      // Max connections
  minPoolSize: 10,      // Min connections
  maxIdleTimeMS: 30000  // Close idle connections
})

const redisPool = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 }
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3
  },
  clusterRetryStrategy: (times) => {
    return Math.min(times * 100, 2000)
  }
})

// 2. Query Optimization
class OptimizedQueries {
  // Use projections to fetch only needed fields
  async getCharacter(id: string) {
    return await db.collection('characters').findOne(
      { _id: id },
      {
        projection: {
          name: 1,
          traits: 1,
          relationships: 1,
          // Exclude large fields
          fullDescription: 0,
          history: 0
        }
      }
    )
  }

  // Use indexes for common queries
  async createIndexes() {
    await db.collection('agents').createIndex({
      department: 1,
      isDepartmentHead: 1,
      isActive: 1
    })

    await db.collection('agent-executions').createIndex({
      project: 1,
      status: 1,
      createdAt: -1
    })

    await db.collection('agent-executions').createIndex({
      conversationId: 1,
      status: 1
    })
  }

  // Use aggregation pipelines for complex queries
  async getDepartmentPerformance(departmentId: string, days: number = 30) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return await db.collection('agent-executions').aggregate([
      {
        $match: {
          department: departmentId,
          createdAt: { $gte: cutoff },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$agent',
          avgExecutionTime: { $avg: '$executionTime' },
          avgQualityScore: { $avg: '$qualityScore' },
          totalExecutions: { $sum: 1 },
          totalTokens: { $sum: '$tokenUsage.total' }
        }
      },
      {
        $sort: { avgQualityScore: -1 }
      }
    ]).toArray()
  }
}

// 3. Caching Strategy
class MultiLevelCache {
  private l1Cache = new Map<string, any>()  // In-memory
  private redis: Redis

  async get<T>(key: string): Promise<T | null> {
    // L1: In-memory cache (fastest)
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key)
    }

    // L2: Redis cache (fast)
    const cached = await this.redis.get(key)
    if (cached) {
      const value = JSON.parse(cached)
      this.l1Cache.set(key, value)  // Populate L1
      return value
    }

    return null
  }

  async set<T>(key: string, value: T, ttl: number = 300) {
    // Set in both layers
    this.l1Cache.set(key, value)
    await this.redis.setex(key, ttl, JSON.stringify(value))
  }

  async invalidate(key: string) {
    this.l1Cache.delete(key)
    await this.redis.del(key)
  }
}

// 4. Parallel Execution
class ParallelExecutor {
  async executeInParallel<T>(
    tasks: (() => Promise<T>)[],
    concurrency: number = 5
  ): Promise<T[]> {
    const results: T[] = []
    const executing: Promise<void>[] = []

    for (const task of tasks) {
      const promise = task().then(result => {
        results.push(result)
      })

      executing.push(promise)

      // Limit concurrency
      if (executing.length >= concurrency) {
        await Promise.race(executing)
        // Remove completed promises
        executing.splice(
          executing.findIndex(p => p === promise),
          1
        )
      }
    }

    await Promise.all(executing)
    return results
  }
}

// 5. Request Deduplication
class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>()

  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // If request is already in flight, return existing promise
    if (this.pending.has(key)) {
      return await this.pending.get(key)!
    }

    // Start new request
    const promise = fn().finally(() => {
      this.pending.delete(key)
    })

    this.pending.set(key, promise)
    return await promise
  }
}
```

### 9.3 Performance Monitoring

```typescript
interface PerformanceMetrics {
  endpoint: string
  method: string
  duration: number
  timestamp: Date
  statusCode: number
  userId?: string
  projectId?: string

  // Resource usage
  cpuUsage: number
  memoryUsage: number

  // Database metrics
  dbQueries: number
  dbQueryTime: number

  // Cache metrics
  cacheHits: number
  cacheMisses: number

  // Agent metrics
  agentsSpawned: number
  totalTokens: number
  avgAgentTime: number
}

class PerformanceMonitor {
  async trackRequest(
    req: Request,
    res: Response,
    metrics: PerformanceMetrics
  ) {
    // Store in time-series database (e.g., InfluxDB, TimescaleDB)
    await this.storeMetrics(metrics)

    // Send to monitoring service (e.g., DataDog, New Relic)
    await this.sendToMonitoring(metrics)

    // Alert on anomalies
    if (metrics.duration > 30000) {  // 30 seconds
      await this.sendAlert({
        severity: 'high',
        message: `Slow request: ${metrics.endpoint} took ${metrics.duration}ms`,
        metrics
      })
    }
  }

  async generatePerformanceReport(period: 'hourly' | 'daily' | 'weekly') {
    // Aggregate metrics
    const report = {
      period,
      timestamp: new Date(),

      // Response times
      avgResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,

      // Throughput
      totalRequests: 0,
      successRate: 0,
      errorRate: 0,

      // Resource usage
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
      peakMemoryUsage: 0,

      // Database
      avgDbQueryTime: 0,
      totalDbQueries: 0,

      // Cache
      cacheHitRate: 0,

      // Agents
      totalExecutions: 0,
      avgExecutionTime: 0,
      totalTokensUsed: 0,
      estimatedCost: 0
    }

    return report
  }
}
```

---

## 10. Security Architecture

### 10.1 Authentication & Authorization

```typescript
// JWT-based authentication
interface JWTPayload {
  userId: string
  email: string
  role: 'user' | 'admin' | 'system'
  permissions: string[]
  iat: number
  exp: number
}

// Role-Based Access Control (RBAC)
const PERMISSIONS = {
  // Project permissions
  'project:read': ['user', 'admin'],
  'project:write': ['user', 'admin'],
  'project:delete': ['admin'],

  // Agent permissions
  'agent:read': ['user', 'admin'],
  'agent:execute': ['user', 'admin'],
  'agent:configure': ['admin'],
  'agent:delete': ['admin'],

  // Execution permissions
  'execution:read': ['user', 'admin'],
  'execution:cancel': ['user', 'admin'],

  // System permissions
  'system:admin': ['admin'],
  'system:metrics': ['admin']
}

function checkPermission(user: JWTPayload, permission: string): boolean {
  const allowedRoles = PERMISSIONS[permission]
  return allowedRoles?.includes(user.role) ?? false
}

// Middleware
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!checkPermission(req.user, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}
```

### 10.2 Input Validation & Sanitization

```typescript
import { z } from 'zod'

// Request validation schemas
const ExecuteAgentSchema = z.object({
  projectId: z.string().uuid(),
  userPrompt: z.string().min(1).max(10000),
  conversationId: z.string().uuid().optional(),
  options: z.object({
    priority: z.enum(['low', 'medium', 'high']).optional(),
    maxTokens: z.number().min(100).max(50000).optional(),
    qualityThreshold: z.number().min(0).max(100).optional()
  }).optional()
})

const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  instructionsPrompt: z.string().max(50000).optional(),
  isActive: z.boolean().optional(),
  qualityThreshold: z.number().min(0).max(100).optional()
})

// Sanitization
function sanitizeInput(input: string): string {
  return input
    // Remove potential XSS
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

// Rate limiting
import rateLimit from 'express-rate-limit'

const agentExecutionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many agent executions, please try again later',
  keyGenerator: (req) => req.user.userId // Per-user rate limit
})
```

### 10.3 Data Encryption & Security

```typescript
// Encrypt sensitive data at rest
import crypto from 'crypto'

class DataEncryption {
  private algorithm = 'aes-256-gcm'
  private key: Buffer

  constructor(secret: string) {
    // Derive key from secret
    this.key = crypto.scryptSync(secret, 'salt', 32)
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  decrypt(encrypted: string): string {
    const [ivHex, authTagHex, encryptedHex] = encrypted.split(':')

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)

    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }
}

// Environment variables encryption
const encryption = new DataEncryption(process.env.ENCRYPTION_KEY!)

// Encrypt API keys before storing
async function storeApiKey(userId: string, apiKey: string) {
  const encrypted = encryption.encrypt(apiKey)

  await db.collection('user-keys').insertOne({
    userId,
    encryptedKey: encrypted,
    createdAt: new Date()
  })
}
```

### 10.4 Audit Logging

```typescript
interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  action: string
  resource: string
  resourceId?: string
  changes?: any
  ipAddress: string
  userAgent: string
  success: boolean
  errorMessage?: string
}

class AuditLogger {
  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    await db.collection('audit-logs').insertOne({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...entry
    })
  }

  async logAgentExecution(
    userId: string,
    agentId: string,
    executionId: string,
    success: boolean,
    metadata: any
  ) {
    await this.log({
      userId,
      action: 'agent.execute',
      resource: 'agent-execution',
      resourceId: executionId,
      changes: { agentId, ...metadata },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      success
    })
  }

  async logConfigChange(
    userId: string,
    agentId: string,
    changes: any
  ) {
    await this.log({
      userId,
      action: 'agent.update',
      resource: 'agent',
      resourceId: agentId,
      changes,
      ipAddress: changes.ipAddress,
      userAgent: changes.userAgent,
      success: true
    })
  }
}
```

---

## 11. API Specifications

### 11.1 REST API Endpoints

```typescript
/**
 * POST /api/orchestrator/execute
 * Execute a user request through the agent system
 */
interface ExecuteRequestBody {
  projectId: string
  userPrompt: string
  conversationId?: string
  options?: {
    priority?: 'low' | 'medium' | 'high'
    maxTokens?: number
    qualityThreshold?: number
  }
}

interface ExecuteResponse {
  executionId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  departmentReports: DepartmentReport[]
  overallQuality: number
  consistency: number
  recommendation: 'ingest' | 'modify' | 'discard'
  metrics: {
    totalTime: number
    tokensUsed: number
    agentsSpawned: number
  }
}

/**
 * GET /api/orchestrator/status/:executionId
 * Get execution status and real-time updates
 */
interface ExecutionStatusResponse {
  executionId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number  // 0-100
  currentPhase: string
  departmentsComplete: number
  departmentsTotal: number
  events: AgentEvent[]
  partialResults?: any
}

/**
 * POST /api/agents/execute
 * Execute a specific agent directly
 */
interface AgentExecuteRequest {
  agentId: string
  prompt: string
  context?: any
  previousRun?: any
}

interface AgentExecuteResponse {
  executionId: string
  output: any
  qualityScore: number
  tokenUsage: {
    input: number
    output: number
    total: number
  }
  executionTime: number
}

/**
 * GET /api/agents
 * List all agents with filtering
 */
interface ListAgentsQuery {
  department?: string
  isDepartmentHead?: boolean
  isActive?: boolean
  limit?: number
  offset?: number
}

/**
 * POST /api/agents
 * Create a new agent
 */
interface CreateAgentRequest {
  agentId: string
  name: string
  department: string
  isDepartmentHead: boolean
  model: string
  instructionsPrompt: string
  toolNames?: string[]
  specialization?: string
  skills?: string[]
}

/**
 * PUT /api/agents/:agentId
 * Update an agent
 */
interface UpdateAgentRequest {
  name?: string
  description?: string
  instructionsPrompt?: string
  toolNames?: string[]
  isActive?: boolean
  qualityThreshold?: number
}

/**
 * GET /api/executions
 * Query execution history
 */
interface ListExecutionsQuery {
  projectId?: string
  conversationId?: string
  status?: string
  department?: string
  agentId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

/**
 * GET /api/analytics/performance
 * Get performance analytics
 */
interface PerformanceAnalyticsQuery {
  projectId?: string
  department?: string
  timeframe: '24h' | '7d' | '30d' | '90d'
}

interface PerformanceAnalyticsResponse {
  avgExecutionTime: number
  avgQualityScore: number
  totalExecutions: number
  successRate: number
  totalTokensUsed: number
  estimatedCost: number
  byDepartment: {
    [key: string]: {
      executions: number
      avgTime: number
      avgQuality: number
    }
  }
}
```

### 11.2 GraphQL Schema

```graphql
type Query {
  # Projects
  project(id: ID!): Project
  projects(limit: Int, offset: Int): [Project!]!

  # Agents
  agent(id: ID!): Agent
  agents(
    department: String
    isDepartmentHead: Boolean
    isActive: Boolean
    limit: Int
    offset: Int
  ): [Agent!]!

  # Executions
  execution(id: ID!): AgentExecution
  executions(
    projectId: ID
    conversationId: ID
    status: ExecutionStatus
    limit: Int
    offset: Int
  ): [AgentExecution!]!

  # Analytics
  performanceMetrics(
    projectId: ID
    department: String
    timeframe: Timeframe!
  ): PerformanceMetrics!
}

type Mutation {
  # Orchestration
  executeOrchestrator(
    projectId: ID!
    userPrompt: String!
    conversationId: ID
    options: ExecutionOptions
  ): OrchestrationResult!

  # Agents
  createAgent(input: CreateAgentInput!): Agent!
  updateAgent(id: ID!, input: UpdateAgentInput!): Agent!
  deleteAgent(id: ID!): Boolean!

  # Executions
  cancelExecution(id: ID!): Boolean!
  retryExecution(id: ID!): AgentExecution!
}

type Subscription {
  # Real-time execution updates
  executionEvents(executionId: ID!): AgentEvent!

  # Department status updates
  departmentStatus(executionId: ID!, department: String!): DepartmentStatus!
}

type Project {
  id: ID!
  slug: String!
  name: String!
  description: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Agent {
  id: ID!
  agentId: String!
  name: String!
  department: Department!
  isDepartmentHead: Boolean!
  model: String!
  instructionsPrompt: String!
  toolNames: [String!]!
  specialization: String
  skills: [String!]!
  isActive: Boolean!
  successRate: Float!
  averageExecutionTime: Int!
  totalExecutions: Int!
  qualityThreshold: Float!
}

type AgentExecution {
  id: ID!
  executionId: String!
  agent: Agent!
  department: Department!
  project: Project!
  prompt: String!
  output: JSON
  status: ExecutionStatus!
  qualityScore: Float
  tokenUsage: TokenUsage!
  executionTime: Int
  reviewStatus: ReviewStatus!
  createdAt: DateTime!
  completedAt: DateTime
  events: [AgentEvent!]!
}

type OrchestrationResult {
  executionId: String!
  departmentReports: [DepartmentReport!]!
  overallQuality: Float!
  consistency: Float!
  recommendation: Recommendation!
  metrics: ExecutionMetrics!
}

enum ExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
  REVISION_NEEDED
}

enum Recommendation {
  INGEST
  MODIFY
  DISCARD
}
```

---

## 12. Performance Benchmarks

### 12.1 Target Performance Metrics

```yaml
# Response Time Targets
Orchestration:
  Simple Request (1 department): 3-7 seconds
  Medium Request (2-3 departments): 8-15 seconds
  Complex Request (4+ departments): 15-30 seconds

Agent Execution:
  Specialist Agent: 1-3 seconds
  Department Head: 3-8 seconds
  Master Orchestrator: 2-5 seconds

API Endpoints:
  GET /api/agents: <100ms
  GET /api/executions: <200ms
  POST /api/orchestrator/execute: 3-30 seconds
  GET /api/orchestrator/status: <50ms

Database Operations:
  Simple Query: <10ms
  Complex Aggregation: <100ms
  Write Operation: <20ms

Cache Operations:
  Redis GET: <5ms
  Redis SET: <5ms
  L1 Cache (in-memory): <1ms

# Throughput Targets
Concurrent Executions: 50-100 simultaneous
Requests per Second: 100-200 RPS
Agents per Second: 500-1000 agent executions/sec

# Resource Utilization
CPU Usage: <70% average, <90% peak
Memory Usage: <4GB per instance
Database Connections: <100 active
Redis Connections: <50 active

# Quality Targets
Uptime: 99.9% (8.76 hours downtime/year)
Error Rate: <0.1%
Success Rate: >99%
Quality Score: >85% average
```

### 12.2 Load Testing Results

```typescript
// Simulated load test results (k6 or Artillery)
interface LoadTestResults {
  scenario: string
  duration: number // seconds
  virtualUsers: number

  requests: {
    total: number
    successful: number
    failed: number
    rps: number // requests per second
  }

  responseTimes: {
    min: number
    max: number
    avg: number
    p50: number
    p95: number
    p99: number
  }

  errors: {
    rate: number
    types: {
      [errorType: string]: number
    }
  }
}

const BENCHMARK_RESULTS: LoadTestResults[] = [
  {
    scenario: 'Baseline - Simple Executions',
    duration: 300,
    virtualUsers: 10,
    requests: {
      total: 1000,
      successful: 998,
      failed: 2,
      rps: 3.33
    },
    responseTimes: {
      min: 2340,
      max: 8120,
      avg: 4567,
      p50: 4200,
      p95: 6800,
      p99: 7900
    },
    errors: {
      rate: 0.002,
      types: {
        timeout: 1,
        rate_limit: 1
      }
    }
  },
  {
    scenario: 'Peak Load - Mixed Complexity',
    duration: 600,
    virtualUsers: 50,
    requests: {
      total: 5000,
      successful: 4920,
      failed: 80,
      rps: 8.33
    },
    responseTimes: {
      min: 3200,
      max: 28400,
      avg: 12340,
      p50: 10500,
      p95: 22000,
      p99: 26000
    },
    errors: {
      rate: 0.016,
      types: {
        timeout: 45,
        rate_limit: 20,
        service_unavailable: 15
      }
    }
  }
]
```

---

## 13. Integration Patterns

### 13.1 Event-Driven Integration

```typescript
// Event Bus Pattern
import { EventEmitter } from 'events'

class AgentEventBus extends EventEmitter {
  // Department events
  emitDepartmentAssigned(executionId: string, department: string) {
    this.emit('department.assigned', { executionId, department })
  }

  emitDepartmentComplete(executionId: string, department: string, result: any) {
    this.emit('department.complete', { executionId, department, result })
  }

  // Agent events
  emitAgentStart(executionId: string, agentId: string) {
    this.emit('agent.start', { executionId, agentId })
  }

  emitAgentComplete(executionId: string, agentId: string, output: any) {
    this.emit('agent.complete', { executionId, agentId, output })
  }

  // Quality events
  emitQualityCheck(executionId: string, scores: any) {
    this.emit('quality.check', { executionId, scores })
  }

  // Error events
  emitError(executionId: string, error: Error, context: any) {
    this.emit('error', { executionId, error, context })
  }
}

// Event Handlers
const eventBus = new AgentEventBus()

// Store events in database
eventBus.on('*', async (event) => {
  await db.collection('events').insertOne({
    type: event.type,
    data: event.data,
    timestamp: new Date()
  })
})

// Send to WebSocket clients
eventBus.on('*', (event) => {
  wsStreamer.broadcast(event.executionId, event)
})

// Trigger workflows
eventBus.on('department.complete', async (event) => {
  // Check if all departments are complete
  const allComplete = await checkAllDepartmentsComplete(event.executionId)
  if (allComplete) {
    await finalizeOrchestration(event.executionId)
  }
})
```

### 13.2 Webhook Integration

```typescript
// Webhook configuration
interface WebhookConfig {
  url: string
  events: string[]
  secret: string
  active: boolean
}

class WebhookManager {
  async trigger(event: string, data: any, projectId: string) {
    // Get webhooks for this project and event
    const webhooks = await db.collection('webhooks').find({
      projectId,
      events: { $in: [event, '*'] },
      active: true
    }).toArray()

    // Trigger all matching webhooks
    await Promise.all(
      webhooks.map(webhook => this.send(webhook, event, data))
    )
  }

  private async send(webhook: WebhookConfig, event: string, data: any) {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString()
    }

    // Generate signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    try {
      await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event
        },
        timeout: 10000
      })
    } catch (error) {
      console.error('Webhook delivery failed:', error)
      // Store failed delivery for retry
      await this.logFailedDelivery(webhook.url, payload, error)
    }
  }

  private async logFailedDelivery(url: string, payload: any, error: any) {
    await db.collection('webhook-failures').insertOne({
      url,
      payload,
      error: error.message,
      timestamp: new Date(),
      retryCount: 0
    })
  }
}
```

### 13.3 External Service Integration

```typescript
// Brain Service Integration
class BrainServiceClient {
  private baseUrl: string
  private apiKey: string

  async storeEntity(document: BrainDocument): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/entities`,
      document,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.id
  }

  async createRelationship(from: string, to: string, type: string, properties: any) {
    await axios.post(
      `${this.baseUrl}/relationships`,
      { from, to, type, properties },
      {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      }
    )
  }

  async query(cypher: string, params: any = {}): Promise<any> {
    const response = await axios.post(
      `${this.baseUrl}/query`,
      { cypher, params },
      {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      }
    )

    return response.data.results
  }
}

// Media Service Integration (Fal.ai, ElevenLabs, etc.)
class MediaServiceIntegration {
  async generateImage(prompt: string, options: any): Promise<string> {
    const response = await fal.subscribe('fal-ai/flux-pro', {
      input: {
        prompt,
        ...options
      }
    })

    return response.images[0].url
  }

  async generateVoice(text: string, voiceId: string): Promise<Buffer> {
    const audio = await elevenlabs.textToSpeech({
      voiceId,
      text,
      modelId: 'eleven_multilingual_v2'
    })

    return audio
  }

  async processVideo(inputPath: string, operations: any[]): Promise<string> {
    // FFmpeg operations
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        // Apply operations
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run()
    })
  }
}
```

---

## Conclusion

This architecture document provides a comprehensive blueprint for implementing the Aladdin Dynamic Agents System. Key takeaways:

1. **Hierarchical Design**: Clear separation of concerns with Master Orchestrator, Department Heads, and Specialists
2. **Real-time Coordination**: WebSocket-based event streaming for live monitoring
3. **Quality-First**: Multi-dimensional quality assessment with configurable thresholds
4. **Scalable**: Designed for horizontal scaling with Redis clustering and MongoDB replicas
5. **Observable**: Comprehensive logging, metrics, and audit trails
6. **Secure**: Authentication, authorization, encryption, and rate limiting built-in

### Next Steps

1. Review this document with the team
2. Begin Phase 1 implementation (PayloadCMS collections)
3. Set up infrastructure (Redis, MongoDB, Neo4j)
4. Implement core orchestration logic
5. Build real-time event streaming
6. Deploy monitoring and alerting
7. Performance testing and optimization

---

**Document Metadata**:
- Created: October 1, 2025
- Author: Analyst Agent (Dynamic Agents Hive Mind)
- Version: 2.0.0
- Status: Ready for Implementation
