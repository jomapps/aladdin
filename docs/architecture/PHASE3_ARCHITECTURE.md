# Phase 3: Brain Integration Architecture

**Version**: 1.0
**Status**: Design Complete
**Last Updated**: 2025-10-01

## Executive Summary

Phase 3 integrates the existing Brain service (Neo4j + Jina embeddings) and Celery-Redis task queue with the Aladdin platform to enable real-time content validation, semantic search, and quality scoring for all creative content.

### Key Objectives

1. **Real-time Validation**: All content validated through Brain service before storage
2. **Quality Gates**: Enforce minimum quality thresholds (80% default)
3. **Semantic Search**: Enable natural language queries across project content
4. **Async Processing**: Offload heavy validation to Celery-Redis queue
5. **Knowledge Graph**: Build Neo4j relationship graph of all project entities

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Aladdin Platform                         │
│  ┌────────────┐      ┌──────────────┐      ┌────────────┐      │
│  │ PayloadCMS │─────▶│ Agent System │─────▶│  Open DB   │      │
│  │   Hooks    │      │  (Phase 2)   │      │  (MongoDB) │      │
│  └────────────┘      └──────────────┘      └────────────┘      │
│         │                    │                     │            │
│         │                    ▼                     │            │
│         │            ┌──────────────┐              │            │
│         └───────────▶│ Brain Client │◀─────────────┘            │
│                      └──────────────┘                           │
└──────────────────────────────│──────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
    ┌────────────────────┐        ┌────────────────────┐
    │   Brain Service    │        │  Celery-Redis      │
    │   (WebSocket/HTTP) │        │   Task Queue       │
    │                    │        │                    │
    │  ┌──────────────┐  │        │  ┌──────────────┐ │
    │  │    Neo4j     │  │        │  │    Redis     │ │
    │  │ (Knowledge   │  │        │  │   (Queue)    │ │
    │  │   Graph)     │  │        │  └──────────────┘ │
    │  └──────────────┘  │        │                    │
    │  ┌──────────────┐  │        │  ┌──────────────┐ │
    │  │ Jina v4 API  │  │        │  │   Celery     │ │
    │  │ (Embeddings) │  │        │  │   Workers    │ │
    │  └──────────────┘  │        │  └──────────────┘ │
    └────────────────────┘        └────────────────────┘
```

---

## Component Architecture

### 1. Brain API Client

**Location**: `src/lib/brain/client.ts`

**Responsibilities**:
- HTTP/WebSocket communication with Brain service
- Request/response serialization
- Connection pooling and retry logic
- Error handling and circuit breaking

**Interface**:
```typescript
interface BrainClient {
  // Core operations
  validateContent(params: ValidationRequest): Promise<ValidationResult>
  searchSemantic(query: SemanticQuery): Promise<SearchResult[]>
  createKnowledgeNode(node: KnowledgeNode): Promise<NodeResult>

  // Relationship management
  createRelationship(rel: Relationship): Promise<RelationshipResult>
  queryGraph(cypher: string, params: object): Promise<GraphResult>

  // Health & monitoring
  checkHealth(): Promise<HealthStatus>
  getMetrics(): Promise<BrainMetrics>
}

interface ValidationRequest {
  projectId: string
  type: 'character' | 'scene' | 'location' | 'dialogue' | 'plot'
  data: {
    name: string
    description: string
    metadata?: Record<string, any>
  }
  context?: {
    existingEntities: string[]
    relationships: Relationship[]
  }
}

interface ValidationResult {
  valid: boolean
  qualityScore: number  // 0-100
  issues: ValidationIssue[]
  suggestions: string[]
  embedding?: number[]
  nodeId?: string
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info'
  category: 'consistency' | 'quality' | 'completeness'
  message: string
  field?: string
}
```

**Configuration**:
```typescript
// Environment variables
BRAIN_API_URL=https://brain.ft.tc  // or http://localhost:8002
BRAIN_WS_URL=wss://brain.ft.tc     // or ws://localhost:8002
BRAIN_API_KEY=<api-key>
BRAIN_TIMEOUT_MS=30000
BRAIN_MAX_RETRIES=3
```

---

### 2. Neo4j Connection Manager

**Location**: `src/lib/brain/neo4j.ts`

**Responsibilities**:
- Direct Neo4j driver management (optional, for advanced queries)
- Connection pooling
- Transaction management
- Query optimization

**Schema Design**:

```cypher
// Node Types
(:Project {
  id: String!,
  name: String!,
  slug: String!,
  createdAt: DateTime,
  updatedAt: DateTime
})

(:Character {
  id: String!,
  projectId: String!,
  name: String!,
  personalityDescription: String,
  appearanceDescription: String,
  embedding: [Float],
  qualityScore: Float,
  createdAt: DateTime,
  updatedAt: DateTime
})

(:Scene {
  id: String!,
  projectId: String!,
  title: String!,
  description: String,
  location: String,
  embedding: [Float],
  qualityScore: Float,
  createdAt: DateTime
})

(:Location {
  id: String!,
  projectId: String!,
  name: String!,
  description: String,
  embedding: [Float],
  qualityScore: Float
})

(:Dialogue {
  id: String!,
  projectId: String!,
  text: String!,
  context: String,
  embedding: [Float],
  qualityScore: Float
})

(:PlotPoint {
  id: String!,
  projectId: String!,
  description: String!,
  embedding: [Float],
  qualityScore: Float
})

// Relationship Types
(:Character)-[:APPEARS_IN {
  importance: Float,
  firstAppearance: DateTime
}]->(:Scene)

(:Character)-[:SPEAKS {
  timestamp: DateTime
}]->(:Dialogue)

(:Scene)-[:LOCATED_AT {
  duration: Int
}]->(:Location)

(:Character)-[:INTERACTS_WITH {
  type: String,
  frequency: Int
}]->(:Character)

(:Character)-[:CONTRADICTS {
  severity: Float,
  description: String,
  detectedAt: DateTime
}]->(:Character)

(:PlotPoint)-[:INVOLVES]->(:Character)
(:PlotPoint)-[:OCCURS_IN]->(:Scene)
(:PlotPoint)-[:LEADS_TO]->(:PlotPoint)

(:Project)-[:CONTAINS]->(:Character)
(:Project)-[:CONTAINS]->(:Scene)
(:Project)-[:CONTAINS]->(:Location)
```

**Indexes & Constraints**:
```cypher
// Uniqueness constraints
CREATE CONSTRAINT project_id IF NOT EXISTS
FOR (p:Project) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT character_id IF NOT EXISTS
FOR (c:Character) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT scene_id IF NOT EXISTS
FOR (s:Scene) REQUIRE s.id IS UNIQUE;

// Indexes for performance
CREATE INDEX character_project IF NOT EXISTS
FOR (c:Character) ON (c.projectId);

CREATE INDEX scene_project IF NOT EXISTS
FOR (s:Scene) ON (s.projectId);

CREATE INDEX character_name IF NOT EXISTS
FOR (c:Character) ON (c.name);

// Vector index for semantic search (Neo4j 5.11+)
CREATE VECTOR INDEX character_embedding IF NOT EXISTS
FOR (c:Character) ON (c.embedding)
OPTIONS {indexConfig: {
  `vector.dimensions`: 768,
  `vector.similarity_function`: 'cosine'
}};
```

---

### 3. Embedding Service

**Location**: `src/lib/brain/embeddings.ts`

**Responsibilities**:
- Generate embeddings via Jina v4 API
- Batch processing for efficiency
- Caching strategies
- Fallback handling

**Implementation**:
```typescript
interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>
  computeSimilarity(embedding1: number[], embedding2: number[]): number
}

// Configuration
JINA_API_URL=https://api.jina.ai/v4/embeddings
JINA_API_KEY=<jina-key>
JINA_MODEL=jina-embeddings-v4-base-en
JINA_BATCH_SIZE=32
JINA_TIMEOUT_MS=10000
```

**Caching Strategy**:
- Redis cache for frequently accessed embeddings
- TTL: 24 hours for character/location embeddings
- Cache key: `embedding:${projectId}:${entityType}:${entityId}`

---

### 4. Validation Pipeline

**Location**: `src/lib/brain/validator.ts`

**Responsibilities**:
- Orchestrate validation workflow
- Apply quality gates
- Handle validation failures
- User feedback loop

**Validation Flow**:

```typescript
async function validateContent(
  content: ContentToValidate,
  options: ValidationOptions
): Promise<ValidationResult> {
  // 1. Pre-validation checks
  const preChecks = await runPreValidationChecks(content)
  if (!preChecks.passed) {
    return {
      valid: false,
      qualityScore: 0,
      issues: preChecks.issues
    }
  }

  // 2. Generate embedding
  const embedding = await embeddingService.generateEmbedding(
    content.description
  )

  // 3. Semantic similarity check (detect duplicates)
  const similar = await brainClient.searchSemantic({
    projectId: content.projectId,
    type: content.type,
    embedding,
    threshold: 0.85
  })

  if (similar.length > 0) {
    return {
      valid: false,
      qualityScore: 50,
      issues: [{
        severity: 'warning',
        category: 'consistency',
        message: `Similar ${content.type} already exists: ${similar[0].name}`
      }]
    }
  }

  // 4. Brain service validation
  const brainResult = await brainClient.validateContent({
    projectId: content.projectId,
    type: content.type,
    data: content.data,
    context: await getProjectContext(content.projectId)
  })

  // 5. Quality gate check
  const threshold = options.qualityThreshold || 80
  if (brainResult.qualityScore < threshold) {
    return {
      valid: false,
      qualityScore: brainResult.qualityScore,
      issues: [
        ...brainResult.issues,
        {
          severity: 'error',
          category: 'quality',
          message: `Quality score ${brainResult.qualityScore} below threshold ${threshold}`
        }
      ],
      suggestions: brainResult.suggestions
    }
  }

  // 6. Create knowledge node in Neo4j
  const node = await brainClient.createKnowledgeNode({
    projectId: content.projectId,
    type: content.type,
    data: {
      ...content.data,
      embedding,
      qualityScore: brainResult.qualityScore
    }
  })

  return {
    valid: true,
    qualityScore: brainResult.qualityScore,
    issues: [],
    suggestions: brainResult.suggestions,
    embedding,
    nodeId: node.id
  }
}
```

**Quality Gates**:
```typescript
interface QualityGate {
  threshold: number        // 0-100
  blockOnFailure: boolean  // true = reject, false = warn
  requireUserApproval: boolean
}

const QUALITY_GATES: Record<string, QualityGate> = {
  character: {
    threshold: 80,
    blockOnFailure: true,
    requireUserApproval: true
  },
  scene: {
    threshold: 75,
    blockOnFailure: true,
    requireUserApproval: false
  },
  dialogue: {
    threshold: 70,
    blockOnFailure: false,
    requireUserApproval: false
  },
  location: {
    threshold: 75,
    blockOnFailure: true,
    requireUserApproval: false
  }
}
```

---

### 5. MongoDB Change Streams

**Location**: `src/lib/brain/changeStreams.ts`

**Responsibilities**:
- Watch MongoDB collections for changes
- Enqueue validation tasks to Celery
- Handle resume tokens for reliability
- Error recovery and retry

**Implementation**:
```typescript
import { ChangeStream, ChangeStreamDocument } from 'mongodb'
import { getOpenDatabase } from '@/lib/db/openDatabase'
import { enqueueValidation } from '@/lib/tasks/client'

interface ChangeStreamWatcher {
  start(projectSlug: string): Promise<void>
  stop(projectSlug: string): Promise<void>
  getStatus(): WatcherStatus[]
}

class ProjectChangeStreamWatcher implements ChangeStreamWatcher {
  private watchers: Map<string, ChangeStream> = new Map()
  private resumeTokens: Map<string, any> = new Map()

  async start(projectSlug: string): Promise<void> {
    const db = await getOpenDatabase(projectSlug)

    // Collections to watch
    const collections = [
      'characters',
      'scenes',
      'locations',
      'dialogues',
      'plotPoints'
    ]

    for (const collectionName of collections) {
      const collection = db.collection(collectionName)

      const pipeline = [
        {
          $match: {
            operationType: { $in: ['insert', 'update'] }
          }
        }
      ]

      const options = {
        fullDocument: 'updateLookup' as const,
        resumeAfter: this.resumeTokens.get(`${projectSlug}:${collectionName}`)
      }

      const changeStream = collection.watch(pipeline, options)

      changeStream.on('change', async (change) => {
        await this.handleChange(projectSlug, collectionName, change)
      })

      changeStream.on('error', async (error) => {
        console.error(`Change stream error for ${projectSlug}:${collectionName}:`, error)
        // Implement exponential backoff retry
        await this.retryWithBackoff(projectSlug, collectionName)
      })

      changeStream.on('resumeTokenChanged', (token) => {
        this.resumeTokens.set(`${projectSlug}:${collectionName}`, token)
        // Persist token to Redis for crash recovery
        this.persistResumeToken(projectSlug, collectionName, token)
      })

      this.watchers.set(`${projectSlug}:${collectionName}`, changeStream)
    }

    console.log(`Started change stream watchers for project: ${projectSlug}`)
  }

  async handleChange(
    projectSlug: string,
    collectionName: string,
    change: ChangeStreamDocument
  ): Promise<void> {
    if (!change.fullDocument) return

    // Enqueue validation task to Celery-Redis
    await enqueueValidation({
      taskType: 'validate_content',
      priority: this.getPriority(change.operationType),
      payload: {
        projectId: projectSlug,
        entityType: collectionName.slice(0, -1), // Remove trailing 's'
        entityId: change.fullDocument._id.toString(),
        data: change.fullDocument,
        operationType: change.operationType
      }
    })
  }

  async stop(projectSlug: string): Promise<void> {
    const watcherKeys = Array.from(this.watchers.keys())
      .filter(key => key.startsWith(`${projectSlug}:`))

    for (const key of watcherKeys) {
      const watcher = this.watchers.get(key)
      await watcher?.close()
      this.watchers.delete(key)
    }

    console.log(`Stopped change stream watchers for project: ${projectSlug}`)
  }

  private getPriority(operationType: string): number {
    return operationType === 'insert' ? 1 : 2 // Higher priority for new content
  }

  private async persistResumeToken(
    projectSlug: string,
    collectionName: string,
    token: any
  ): Promise<void> {
    // Persist to Redis for crash recovery
    const redis = await getRedisClient()
    await redis.set(
      `resume_token:${projectSlug}:${collectionName}`,
      JSON.stringify(token),
      { EX: 86400 } // 24 hour TTL
    )
  }
}

// Singleton instance
export const changeStreamWatcher = new ProjectChangeStreamWatcher()
```

**Startup Integration**:
```typescript
// src/app/api/v1/projects/[id]/watch/route.ts
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const project = await payload.findByID({
    collection: 'projects',
    id: params.id
  })

  await changeStreamWatcher.start(project.slug)

  return Response.json({ status: 'watching' })
}
```

---

### 6. Celery-Redis Task Queue

**Location**: `src/lib/tasks/client.ts`

**Responsibilities**:
- Enqueue validation tasks to Celery
- Monitor task progress
- Handle task results
- Retry failed tasks

**Implementation**:
```typescript
import { createClient, RedisClientType } from 'redis'
import { v4 as uuidv4 } from 'uuid'

interface CeleryTask {
  id: string
  task: string
  args: any[]
  kwargs: Record<string, any>
  retries: number
  eta?: string
}

interface TaskResult {
  status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY'
  result?: any
  error?: string
  traceback?: string
}

class CeleryClient {
  private redis: RedisClientType

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    })
  }

  async connect(): Promise<void> {
    await this.redis.connect()
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect()
  }

  async enqueueTask(
    taskName: string,
    args: any[] = [],
    kwargs: Record<string, any> = {},
    options: {
      priority?: number
      eta?: Date
      expires?: Date
      retries?: number
    } = {}
  ): Promise<string> {
    const taskId = uuidv4()

    const task: CeleryTask = {
      id: taskId,
      task: taskName,
      args,
      kwargs,
      retries: options.retries || 3,
      eta: options.eta?.toISOString()
    }

    const message = JSON.stringify({
      body: Buffer.from(JSON.stringify([args, kwargs])).toString('base64'),
      headers: {
        id: taskId,
        task: taskName,
        retries: task.retries,
        eta: task.eta
      },
      'content-type': 'application/json',
      'content-encoding': 'utf-8',
      properties: {
        correlation_id: taskId,
        reply_to: taskId,
        delivery_mode: 2,
        priority: options.priority || 0
      }
    })

    // Push to Celery queue
    await this.redis.lPush('celery', message)

    console.log(`Enqueued Celery task: ${taskName} (${taskId})`)

    return taskId
  }

  async getTaskResult(taskId: string): Promise<TaskResult> {
    const resultKey = `celery-task-meta-${taskId}`
    const result = await this.redis.get(resultKey)

    if (!result) {
      return { status: 'PENDING' }
    }

    return JSON.parse(result)
  }

  async waitForTask(
    taskId: string,
    timeoutMs: number = 60000
  ): Promise<TaskResult> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      const result = await this.getTaskResult(taskId)

      if (result.status === 'SUCCESS' || result.status === 'FAILURE') {
        return result
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    throw new Error(`Task ${taskId} timed out after ${timeoutMs}ms`)
  }
}

// Convenience functions
export async function enqueueValidation(data: {
  taskType: string
  priority: number
  payload: any
}): Promise<string> {
  const client = new CeleryClient()
  await client.connect()

  try {
    const taskId = await client.enqueueTask(
      'brain.validate_content',
      [],
      data.payload,
      { priority: data.priority }
    )

    return taskId
  } finally {
    await client.disconnect()
  }
}

export const celeryClient = new CeleryClient()
```

**Task Handlers** (Python side - existing in task-queue service):
```python
# services/task-queue/app/tasks/validation_tasks.py
from celery import Task
from app.clients.brain_client import BrainClient
from app.models.task import ValidationTask

class ValidationTask(Task):
    name = 'brain.validate_content'
    max_retries = 3
    default_retry_delay = 10  # seconds

    def run(self, project_id: str, entity_type: str, entity_id: str, data: dict, operation_type: str):
        brain = BrainClient()

        try:
            result = brain.validate_content(
                project_id=project_id,
                type=entity_type,
                data=data
            )

            # Store result in Redis
            self.update_state(
                state='SUCCESS',
                meta={'result': result}
            )

            return result

        except Exception as exc:
            self.retry(exc=exc, countdown=60)
```

---

### 7. PayloadCMS Integration

**Location**: `src/collections/Projects.ts`, `src/collections/Characters.ts`, etc.

**Responsibilities**:
- Trigger Brain validation on content changes
- Update quality scores in PayloadCMS
- Block saves on validation failures
- User feedback for low-quality content

**Hooks Implementation**:

```typescript
// src/collections/hooks/validateWithBrain.ts
import { CollectionAfterChangeHook } from 'payload/types'
import { brainClient } from '@/lib/brain/client'
import { validateContent } from '@/lib/brain/validator'

export const validateWithBrain: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  collection
}) => {
  // Skip validation for admin operations
  if (req.user?.role === 'admin' && req.query?.skipValidation) {
    return doc
  }

  // Only validate on create/update
  if (operation !== 'create' && operation !== 'update') {
    return doc
  }

  try {
    const result = await validateContent(
      {
        projectId: doc.projectId || doc.id,
        type: collection.slug,
        data: doc
      },
      {
        qualityThreshold: 80,
        blockOnFailure: true
      }
    )

    if (!result.valid) {
      // Rollback operation - throw error
      throw new Error(
        `Validation failed: ${result.issues.map(i => i.message).join(', ')}`
      )
    }

    // Update document with Brain metadata
    doc.brainValidated = true
    doc.qualityScore = result.qualityScore
    doc.brainNodeId = result.nodeId
    doc.embedding = result.embedding
    doc.validatedAt = new Date()

    return doc

  } catch (error) {
    console.error('Brain validation error:', error)

    // Re-throw to block save
    throw error
  }
}

// Apply to collections
// src/collections/Characters.ts
export const Characters: CollectionConfig = {
  slug: 'characters',
  hooks: {
    afterChange: [validateWithBrain]
  },
  fields: [
    // ... existing fields
    {
      name: 'brainValidated',
      type: 'checkbox',
      admin: { readOnly: true }
    },
    {
      name: 'qualityScore',
      type: 'number',
      admin: { readOnly: true }
    },
    {
      name: 'brainNodeId',
      type: 'text',
      admin: { readOnly: true }
    },
    {
      name: 'validatedAt',
      type: 'date',
      admin: { readOnly: true }
    }
  ]
}
```

---

### 8. Phase 2 Integration

**Update Existing Agent Tools**:

```typescript
// src/agents/tools/queryBrain.ts
import { tool } from '@anthropic-ai/sdk'
import { brainClient } from '@/lib/brain/client'

export const queryBrainTool = tool({
  name: 'query_brain',
  description: 'Query the Brain service for semantic search and validation',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language query'
      },
      projectId: {
        type: 'string',
        description: 'Project ID to search within'
      },
      entityType: {
        type: 'string',
        enum: ['character', 'scene', 'location', 'dialogue', 'plot'],
        description: 'Type of entity to search for'
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return',
        default: 5
      }
    },
    required: ['query', 'projectId']
  },
  async execute({ query, projectId, entityType, limit = 5 }) {
    // Generate embedding for query
    const embedding = await embeddingService.generateEmbedding(query)

    // Semantic search
    const results = await brainClient.searchSemantic({
      projectId,
      type: entityType,
      embedding,
      limit
    })

    return {
      results: results.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        similarityScore: r.similarity,
        qualityScore: r.qualityScore
      }))
    }
  }
})

// src/agents/tools/saveCharacter.ts
import { tool } from '@anthropic-ai/sdk'
import { validateContent } from '@/lib/brain/validator'
import { getOpenDatabase } from '@/lib/db/openDatabase'

export const saveCharacterTool = tool({
  name: 'save_character',
  description: 'Save character to database with Brain validation',
  input_schema: {
    type: 'object',
    properties: {
      projectId: { type: 'string' },
      name: { type: 'string' },
      personalityDescription: { type: 'string' },
      appearanceDescription: { type: 'string' },
      background: { type: 'string' }
    },
    required: ['projectId', 'name', 'personalityDescription']
  },
  async execute(character) {
    // Step 1: Validate with Brain
    const validation = await validateContent(
      {
        projectId: character.projectId,
        type: 'character',
        data: character
      },
      {
        qualityThreshold: 80,
        blockOnFailure: true
      }
    )

    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed',
        issues: validation.issues,
        suggestions: validation.suggestions
      }
    }

    // Step 2: Save to MongoDB
    const db = await getOpenDatabase(character.projectId)
    const result = await db.collection('characters').insertOne({
      ...character,
      brainValidated: true,
      qualityScore: validation.qualityScore,
      brainNodeId: validation.nodeId,
      embedding: validation.embedding,
      createdAt: new Date()
    })

    return {
      success: true,
      characterId: result.insertedId.toString(),
      qualityScore: validation.qualityScore,
      nodeId: validation.nodeId
    }
  }
})
```

---

## Data Flow Diagrams

### 1. Content Creation Flow

```
User creates character via chat
         │
         ▼
Master Orchestrator Agent
         │
         ▼
Character Department Head
         │
         ▼
Character Creator Specialist
         │
         ▼
saveCharacter Tool
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
Brain Validator              MongoDB (Open DB)
         │                             │
         ├──► Generate Embedding       │
         ├──► Check Duplicates         │
         ├──► Validate Quality         │
         ├──► Create Neo4j Node        │
         │                             │
         ▼                             │
Quality Gate Check                     │
         │                             │
    Pass │ Fail                        │
         │    │                        │
         │    └──► Reject & Suggest    │
         │                             │
         └──► Save with Metadata ──────┘
                     │
                     ▼
            PayloadCMS Hook
                     │
                     ▼
           Update Quality Score
```

### 2. Async Validation Flow (Change Streams)

```
Document updated in MongoDB
         │
         ▼
Change Stream Watcher
         │
         ▼
Enqueue to Celery-Redis
         │
         ▼
Celery Worker picks task
         │
         ▼
Brain Service Validation
         │
         ▼
Store result in Redis
         │
         ▼
Webhook to Aladdin API
         │
         ▼
Update PayloadCMS record
         │
         ▼
WebSocket notification to user
```

### 3. Semantic Search Flow

```
User queries "Find strong female detective"
         │
         ▼
queryBrain Agent Tool
         │
         ▼
Generate Query Embedding (Jina)
         │
         ▼
Neo4j Vector Search
         │
         ▼
Return top 5 similar characters
         │
         ▼
Display in Chat UI with scores
```

---

## API Specifications

### Brain API Endpoints

```typescript
// POST /api/v1/brain/validate
interface ValidateEndpoint {
  request: {
    projectId: string
    type: 'character' | 'scene' | 'location' | 'dialogue' | 'plot'
    data: Record<string, any>
    context?: {
      existingEntities: string[]
      relationships: Relationship[]
    }
  }
  response: {
    valid: boolean
    qualityScore: number
    issues: ValidationIssue[]
    suggestions: string[]
    nodeId?: string
  }
}

// POST /api/v1/brain/search
interface SearchEndpoint {
  request: {
    projectId: string
    query: string
    type?: string
    limit?: number
    threshold?: number
  }
  response: {
    results: Array<{
      id: string
      name: string
      type: string
      similarity: number
      qualityScore: number
      data: Record<string, any>
    }>
  }
}

// POST /api/v1/brain/graph/query
interface GraphQueryEndpoint {
  request: {
    projectId: string
    cypher: string
    params?: Record<string, any>
  }
  response: {
    records: any[]
    summary: {
      queryType: string
      counters: {
        nodesCreated: number
        relationshipsCreated: number
      }
    }
  }
}

// GET /api/v1/brain/health
interface HealthEndpoint {
  response: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: {
      neo4j: { status: string; latency: number }
      redis: { status: string; latency: number }
      jina: { status: string; latency: number }
    }
    version: string
  }
}
```

---

## Performance Considerations

### 1. Latency Targets

| Operation | Target | Strategy |
|-----------|--------|----------|
| Embedding generation | < 200ms | Batch processing, caching |
| Brain validation | < 1s | Async via Celery for large payloads |
| Semantic search | < 500ms | Neo4j vector indexes |
| Change stream processing | < 100ms | Redis queue buffering |

### 2. Scalability

**Horizontal Scaling**:
- Brain service: Multiple instances behind load balancer
- Celery workers: Scale based on queue depth (autoscaling group)
- Redis: Redis Cluster for high availability
- Neo4j: Read replicas for query load

**Vertical Scaling**:
- Neo4j: 16GB+ RAM for embedding storage
- Redis: 8GB+ RAM for queue and cache
- Celery workers: 4 CPU cores per worker

### 3. Caching Strategy

```typescript
// Multi-level cache
interface CacheStrategy {
  L1: 'In-memory LRU cache (Node.js process)'  // 100MB, 5min TTL
  L2: 'Redis cache (shared)'                    // 1GB, 1hr TTL
  L3: 'Neo4j materialized views'               // Permanent
}

// Cache keys
const cacheKeys = {
  embedding: `emb:${projectId}:${type}:${id}`,
  validation: `val:${projectId}:${type}:${hash(data)}`,
  search: `search:${projectId}:${hash(query)}`
}
```

### 4. Rate Limiting

```typescript
// Per-project rate limits
const rateLimits = {
  validation: {
    requests: 100,
    period: '1m'
  },
  search: {
    requests: 50,
    period: '1m'
  },
  graph_query: {
    requests: 20,
    period: '1m'
  }
}
```

---

## Security & Authentication

### 1. API Key Management

```typescript
// Environment-based keys
BRAIN_API_KEY=<secret-key>         // For Aladdin → Brain
JINA_API_KEY=<jina-key>            // For Brain → Jina
NEO4J_PASSWORD=<neo4j-password>    // For Brain → Neo4j
REDIS_PASSWORD=<redis-password>    // For Celery → Redis
```

### 2. Request Authentication

```typescript
// Brain client authentication
const headers = {
  'Authorization': `Bearer ${process.env.BRAIN_API_KEY}`,
  'X-Project-ID': projectId,
  'Content-Type': 'application/json'
}

// Verify in Brain service
async function verifyRequest(req: Request): Promise<boolean> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  return token === process.env.BRAIN_API_SECRET
}
```

### 3. Data Isolation

```cypher
// All queries scoped to project
MATCH (n:Character {projectId: $projectId})
WHERE n.id = $characterId
RETURN n

// Row-level security in MongoDB
db.characters.find({ projectId: currentProjectId })
```

---

## Error Handling & Retry

### 1. Circuit Breaker Pattern

```typescript
import CircuitBreaker from 'opossum'

const brainCircuitBreaker = new CircuitBreaker(
  async (params) => await brainClient.validateContent(params),
  {
    timeout: 30000,              // 30s timeout
    errorThresholdPercentage: 50, // Open circuit at 50% errors
    resetTimeout: 30000,          // Try again after 30s
    rollingCountTimeout: 10000,   // 10s window
    rollingCountBuckets: 10
  }
)

brainCircuitBreaker.fallback(() => ({
  valid: false,
  qualityScore: 0,
  issues: [{
    severity: 'error',
    message: 'Brain service unavailable'
  }]
}))
```

### 2. Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error

      const delay = Math.min(1000 * Math.pow(2, i), 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error('Max retries exceeded')
}
```

### 3. Graceful Degradation

```typescript
// Fallback validation (no Brain)
async function validateContentWithFallback(content: ContentToValidate) {
  try {
    return await validateContent(content, { qualityThreshold: 80 })
  } catch (error) {
    console.warn('Brain validation failed, using fallback:', error)

    // Basic validation without Brain
    return {
      valid: true,
      qualityScore: 60,  // Conservative score
      issues: [{
        severity: 'warning',
        message: 'Advanced validation unavailable'
      }],
      suggestions: ['Review manually for quality']
    }
  }
}
```

---

## Monitoring & Observability

### 1. Metrics

```typescript
// Prometheus metrics
import client from 'prom-client'

const brainRequestDuration = new client.Histogram({
  name: 'brain_request_duration_seconds',
  help: 'Brain API request duration',
  labelNames: ['operation', 'status']
})

const brainValidationScore = new client.Histogram({
  name: 'brain_validation_score',
  help: 'Quality scores from Brain',
  labelNames: ['project_id', 'entity_type']
})

const celeryQueueDepth = new client.Gauge({
  name: 'celery_queue_depth',
  help: 'Number of tasks in Celery queue'
})
```

### 2. Logging

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'brain-integration' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// Log all Brain operations
logger.info('Brain validation completed', {
  projectId,
  entityType,
  qualityScore,
  duration: Date.now() - startTime
})
```

### 3. Tracing

```typescript
import { trace, context } from '@opentelemetry/api'

const tracer = trace.getTracer('brain-integration')

async function validateWithTracing(content: ContentToValidate) {
  return tracer.startActiveSpan('brain.validate', async (span) => {
    span.setAttribute('project.id', content.projectId)
    span.setAttribute('entity.type', content.type)

    try {
      const result = await validateContent(content)
      span.setAttribute('quality.score', result.qualityScore)
      return result
    } finally {
      span.end()
    }
  })
}
```

---

## Testing Strategy

### 1. Unit Tests

```typescript
// tests/lib/brain/validator.test.ts
describe('Brain Validator', () => {
  it('should validate high-quality character', async () => {
    const result = await validateContent({
      projectId: 'test-project',
      type: 'character',
      data: {
        name: 'Sarah Connor',
        personalityDescription: 'Strong-willed resistance leader',
        appearanceDescription: 'Athletic build, determined expression'
      }
    })

    expect(result.valid).toBe(true)
    expect(result.qualityScore).toBeGreaterThan(80)
  })

  it('should reject duplicate character', async () => {
    // Create first character
    await createCharacter({ name: 'John Doe' })

    // Try to create duplicate
    const result = await validateContent({
      projectId: 'test-project',
      type: 'character',
      data: { name: 'John Doe', description: 'Similar description' }
    })

    expect(result.valid).toBe(false)
    expect(result.issues).toContainEqual(
      expect.objectContaining({ category: 'consistency' })
    )
  })
})
```

### 2. Integration Tests

```typescript
// tests/integration/brain-flow.test.ts
describe('Brain Integration Flow', () => {
  it('should create character via agent → Brain → DB', async () => {
    // Send chat message
    const response = await sendChatMessage(
      projectId,
      'Create a detective character named Mike Hammer'
    )

    // Verify Brain validation occurred
    expect(response.brainValidated).toBe(true)

    // Verify stored in MongoDB
    const db = await getOpenDatabase(projectId)
    const character = await db.collection('characters').findOne({
      name: 'Mike Hammer'
    })

    expect(character).toBeDefined()
    expect(character.qualityScore).toBeGreaterThan(0)

    // Verify Neo4j node created
    const neo4jResult = await neo4j.run(
      'MATCH (c:Character {id: $id}) RETURN c',
      { id: character._id.toString() }
    )

    expect(neo4jResult.records.length).toBe(1)
  })
})
```

### 3. Performance Tests

```typescript
// tests/performance/brain-benchmark.test.ts
describe('Brain Performance', () => {
  it('should validate 100 characters in < 30s', async () => {
    const characters = generateTestCharacters(100)

    const start = Date.now()
    const results = await Promise.all(
      characters.map(c => validateContent(c))
    )
    const duration = Date.now() - start

    expect(duration).toBeLessThan(30000)
    expect(results.every(r => r.qualityScore > 0)).toBe(true)
  })

  it('should handle 10 concurrent semantic searches', async () => {
    const queries = generateTestQueries(10)

    const start = Date.now()
    await Promise.all(queries.map(q => brainClient.searchSemantic(q)))
    const duration = Date.now() - start

    expect(duration).toBeLessThan(5000)
  })
})
```

---

## Deployment Checklist

### Phase 3.1: Infrastructure (Week 9)

- [ ] Add Brain service git submodule
- [ ] Add Celery-Redis git submodule
- [ ] Create `docker-compose.yml` for local development (development only)
- [ ] Configure environment variables
- [ ] Deploy Brain service (https://brain.ft.tc)
- [ ] Deploy Celery-Redis (https://tasks.ft.tc)
- [ ] Setup Neo4j database with constraints (Ubuntu Server)
- [ ] Setup Redis cluster for caching (Ubuntu Server)
- [ ] Configure Jina API access

### Phase 3.2: Integration (Week 10)

- [ ] Implement Brain client (`src/lib/brain/client.ts`)
- [ ] Implement Neo4j manager (`src/lib/brain/neo4j.ts`)
- [ ] Implement embedding service (`src/lib/brain/embeddings.ts`)
- [ ] Implement validator (`src/lib/brain/validator.ts`)
- [ ] Update `saveCharacter.ts` with Brain validation
- [ ] Update `queryBrain.ts` with semantic search
- [ ] Add PayloadCMS hooks for all collections
- [ ] Unit tests for all Brain components

### Phase 3.3: Async Processing (Week 11)

- [ ] Implement Celery client (`src/lib/tasks/client.ts`)
- [ ] Implement change streams (`src/lib/brain/changeStreams.ts`)
- [ ] Setup change stream watchers on app startup
- [ ] Implement task result webhooks
- [ ] Integration tests for async flow
- [ ] Performance tests for queue throughput

### Phase 3.4: Verification (Week 12)

- [ ] End-to-end test: Create character via chat
- [ ] Verify Neo4j node creation
- [ ] Verify MongoDB storage with quality scores
- [ ] Verify change stream triggers validation
- [ ] Verify quality gates block low-quality content
- [ ] Load test: 1000 characters with validation
- [ ] Monitor Celery queue depth
- [ ] Verify error handling and retry logic

---

## Migration Plan

### From Phase 2 to Phase 3

1. **Add Brain validation to existing agent tools** (non-breaking):
   - Update `saveCharacter.ts` to call Brain before MongoDB
   - Update `queryBrain.ts` to use semantic search
   - Quality gates initially set to warning-only (not blocking)

2. **Backfill existing content** (batch job):
   ```typescript
   // scripts/backfill-brain-validation.ts
   async function backfillProject(projectSlug: string) {
     const db = await getOpenDatabase(projectSlug)
     const characters = await db.collection('characters').find({
       brainValidated: { $ne: true }
     }).toArray()

     for (const character of characters) {
       await validateContent({
         projectId: projectSlug,
         type: 'character',
         data: character
       })
     }
   }
   ```

3. **Enable quality gates gradually**:
   - Week 11: Warning mode (log issues, don't block)
   - Week 12: Blocking mode for new content
   - Week 13: Enforce for all updates

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Brain service downtime | High | Circuit breaker, fallback validation, health checks |
| Celery queue backlog | Medium | Auto-scaling workers, queue depth monitoring |
| Neo4j performance | Medium | Vector indexes, read replicas, query optimization |
| Jina API rate limits | Low | Caching, batch processing, alternative embedding service |
| Change stream failures | Medium | Resume tokens, Redis persistence, exponential backoff |
| Quality gate false positives | High | User override mechanism, feedback loop for model improvement |

---

## Success Metrics

### Phase 3 Completion Criteria

- [ ] 100% of new content validated through Brain
- [ ] Quality scores > 80 for 90% of content
- [ ] P95 validation latency < 2s
- [ ] P95 semantic search latency < 500ms
- [ ] Celery queue depth < 100 tasks
- [ ] Change stream lag < 5 seconds
- [ ] Zero data loss in change stream processing
- [ ] 90% test coverage for Brain integration
- [ ] All integration tests passing
- [ ] Performance benchmarks met

---

## Future Enhancements (Phase 4+)

1. **Advanced Validation**:
   - Multi-modal validation (images, audio)
   - Cross-project learning (shared quality models)
   - User feedback incorporation

2. **Enhanced Search**:
   - Multi-hop graph queries
   - Temporal queries (character evolution over time)
   - Relationship-based recommendations

3. **Optimization**:
   - Model fine-tuning on project-specific data
   - Embedding compression for storage efficiency
   - GPU acceleration for batch processing

4. **Analytics**:
   - Quality trend dashboards
   - Consistency heat maps
   - Relationship visualization

---

**Document Version**: 1.0
**Authors**: System Architect Agent
**Review Date**: 2025-10-01
**Next Review**: Phase 3 Week 8 Retrospective
