# Service Integration Guide - Aladdin System

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Brain Service Integration](#brain-service-integration)
- [Task Service Integration](#task-service-integration)
- [FAL.ai Integration](#falai-integration)
- [Integration Patterns](#integration-patterns)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)

---

## Architecture Overview

The Aladdin system integrates external services through a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│              Aladdin Next.js Application                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Gather    │  │   Project    │  │ AladdinAgent   │ │
│  │   System    │  │  Readiness   │  │    Runner      │ │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘ │
└─────────┼─────────────────┼──────────────────┼──────────┘
          │                 │                  │
          ▼                 ▼                  ▼
    ┌──────────┐      ┌──────────┐   ┌─────────────────┐
    │  Brain   │      │   Task   │   │  @codebuff/sdk  │
    │ Service  │      │ Service  │   │  (LLM Layer)    │
    │(brain.ft)│      │(tasks.ft)│   └────────┬────────┘
    └──────────┘      └──────────┘            │
         │                  │                 │
         ▼                  ▼                 ▼
    Neo4j Graph        Redis/Celery    ┌──────────────┐
    + Embeddings       Task Queue       │  OpenRouter  │
                                        │  Anthropic   │
                                        └──────────────┘
          │
          ▼
    ┌──────────┐
    │  FAL.ai  │
    │  Media   │
    └──────────┘
```

**Service Responsibilities**:
1. **Brain Service** (`brain.ft.tc`) - Knowledge graph, semantic search, validation
2. **Task Service** (`tasks.ft.tc`) - Async task processing, evaluation queue
3. **@codebuff/sdk** - LLM abstraction layer (OpenRouter/Anthropic)
4. **AladdinAgentRunner** - Agent execution engine (PayloadCMS ↔ @codebuff/sdk)
5. **FAL.ai** - AI-powered media generation (images, vision queries)

---

## Brain Service Integration

### Overview
The Brain service provides knowledge graph storage, semantic search, and content validation using Neo4j and Jina embeddings.

**Base URL**: `https://brain.ft.tc`
**Authentication**: Bearer token

### Client Setup

```typescript
// src/lib/brain/client.ts
import { BrainClient, getBrainClient } from '@/lib/brain/client'

// Get singleton instance
const brainClient = getBrainClient()

// Or configure manually
const brainClient = new BrainClient({
  apiUrl: process.env.BRAIN_SERVICE_BASE_URL,
  apiKey: process.env.BRAIN_SERVICE_API_KEY,
  jinaApiKey: process.env.JINA_API_KEY,
}, {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000
})
```

### Core Operations

#### 1. Add Node to Knowledge Graph
```typescript
// Store gather item in Brain
const node = await brainClient.addNode({
  type: 'gather',
  content: `${summary}\n\n${context}\n\n${userContent}`, // Combined for better search
  projectId: 'project123',
  properties: {
    id: gatherItemId,
    summary: 'AI-generated summary',
    context: 'Extracted context',
    imageUrl: 'https://...',
    createdBy: userId,
    createdAt: new Date().toISOString()
  },
  generateEmbedding: true // Auto-generate embedding
})
```

**Key Points**:
- `content` field is used for semantic embedding
- `properties` store additional metadata (not embedded)
- `projectId` ensures project isolation
- Embeddings generated via Jina AI (1024-dim vectors)

#### 2. Semantic Search
```typescript
// Find similar content
const results = await brainClient.searchSimilar({
  query: 'hero discovers power',
  projectId: 'project123',
  type: 'gather',
  limit: 10,
  threshold: 0.7 // 70% similarity minimum
})

// Results format
results.forEach(result => {
  console.log(`Similarity: ${result.similarity}`)
  console.log(`Content: ${result.content}`)
  console.log(`Properties:`, result.properties)
})
```

#### 3. Duplicate Detection
```typescript
// Check for duplicates before saving
const duplicates = await brainClient.searchDuplicates(
  content,
  projectId,
  0.85 // 85% similarity threshold
)

if (duplicates.length > 0) {
  console.warn('Similar content found:', duplicates)
  // Handle duplicate scenario
}
```

#### 4. Content Validation
```typescript
// Validate quality and check contradictions
const validation = await brainClient.validateContent({
  content: 'Character has blue eyes',
  projectId: 'project123',
  type: 'character',
  existingNodes: ['character-node-id']
})

if (!validation.isValid) {
  console.error('Quality issues:', validation.issues)
  // issues: [{ type: 'contradiction', severity: 'high', description: '...' }]
}
```

### Node Types and Schemas

```typescript
// Available node types
NODE_TYPES = {
  CHARACTER: 'character',
  SCENE: 'scene',
  LOCATION: 'location',
  DIALOGUE: 'dialogue',
  PROJECT: 'project',
  CONCEPT: 'concept',
  EPISODE: 'episode',
  WORKFLOW: 'workflow',
  GATHER: 'gather'
}

// Schema validation
import { validateNodeSchema } from '@/lib/brain/schema'

const validation = validateNodeSchema('character', {
  name: 'John Doe',
  projectId: 'project123',
  personality: { traits: ['brave', 'loyal'] }
})

if (!validation.valid) {
  console.error(validation.errors)
}
```

### Relationship Management

```typescript
// Add relationship between nodes
await brainClient.addRelationship({
  fromNodeId: 'character-node-1',
  toNodeId: 'scene-node-1',
  type: 'FEATURES_IN',
  properties: {
    role: 'protagonist',
    screenTime: 300
  }
})

// Get node relationships
const relationships = await brainClient.getRelationships(
  'character-node-1',
  {
    types: ['FEATURES_IN', 'INTERACTS_WITH'],
    direction: 'outgoing'
  }
)
```

### Error Handling

```typescript
try {
  await brainClient.addNode(nodeData)
} catch (error) {
  if (error.message.includes('[404]')) {
    // Node not found
  } else if (error.message.includes('[503]')) {
    // Service unavailable - retry logic
    console.error('Brain service down, saving to queue...')
  } else {
    // Other errors
    console.error('Brain API error:', error)
  }
}
```

### Usage in Gather System

```typescript
// src/app/api/v1/gather/[projectId]/route.ts
import { getBrainClient } from '@/lib/brain/client'

export async function POST(request: NextRequest) {
  // ... create gather item in MongoDB ...

  // Store in Brain for semantic search
  const brainClient = getBrainClient()

  try {
    await brainClient.addNode({
      type: 'gather',
      content: brainContent,
      projectId,
      properties: {
        id: gatherItem._id?.toString(),
        summary: processingResult.summary,
        context: processingResult.context,
        imageUrl,
        documentUrl,
        createdAt: new Date().toISOString()
      }
    })
  } catch (error) {
    // Log error but don't fail request
    console.error('Failed to store in Brain:', error)
  }
}
```

---

## Task Service Integration

### Overview
The Task Service handles async operations using Celery + Redis architecture for long-running AI evaluations and automations.

**Base URL**: `https://tasks.ft.tc`
**Authentication**: X-API-Key header

### Client Setup

```typescript
// src/lib/task-service/client.ts
import { taskService } from '@/lib/task-service/client'

// Singleton instance auto-configured from env
const result = await taskService.submitEvaluation({
  projectId: 'project123',
  departmentSlug: 'story',
  departmentNumber: 1,
  gatherData: [...],
  previousEvaluations: [...],
  threshold: 80
})
```

### Core Operations

#### 1. Submit Evaluation Task
```typescript
// Sequential evaluation with cascading context
const task = await taskService.submitEvaluation({
  projectId: 'project123',
  departmentSlug: 'character',
  departmentNumber: 2,
  departmentId: 'dept-id',
  gatherData: [
    {
      content: 'Hero has blue eyes',
      summary: 'Character appearance',
      context: 'Visual description'
    }
  ],
  previousEvaluations: [
    {
      department: 'story',
      rating: 85,
      summary: 'Strong narrative foundation'
    }
  ],
  threshold: 80,
  userId: 'user123'
})

console.log('Task ID:', task.task_id)
console.log('Status:', task.status) // 'queued' | 'processing'
```

**Task Processing Flow**:
1. Task submitted to Redis queue
2. Celery worker picks up task
3. AI processes gather data + context
4. Quality scoring against threshold
5. Webhook callback to Aladdin
6. Updates project-readiness collection

#### 2. Check Task Status
```typescript
const status = await taskService.getTaskStatus(taskId)

console.log(status.status) // 'queued' | 'processing' | 'completed' | 'failed'
console.log(status.progress) // 0-100
console.log(status.result) // Available when completed
```

#### 3. Poll Until Completion
```typescript
const finalStatus = await taskService.pollTaskUntilComplete(
  taskId,
  (status) => {
    console.log(`Progress: ${status.progress}%`)
  },
  2000, // Poll interval: 2s
  600000 // Max duration: 10min
)

console.log('Final rating:', finalStatus.result.rating)
```

#### 4. Cancel Running Task
```typescript
const result = await taskService.cancelTask(taskId)

if (result.success) {
  console.log('Task cancelled successfully')
}
```

#### 5. Automated Gather Task
```typescript
const task = await taskService.submitAutomatedGather({
  projectId: 'project123',
  department: 'character',
  departmentName: 'Character Department',
  iteration: 1,
  baseNodes: ['node1', 'node2'],
  previousContent: [...],
  targetQuality: 80,
  model: 'claude-3-5-sonnet-20241022',
  maxIterations: 3
})
```

### Webhook Integration

Task service sends callbacks to Aladdin when tasks complete:

```typescript
// src/app/api/webhooks/evaluation-complete/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validate API key
  const apiKey = request.headers.get('X-API-Key')
  if (apiKey !== process.env.TASK_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Update project-readiness
  await payload.update({
    collection: 'project-readiness',
    where: { taskId: { equals: body.task_id } },
    data: {
      status: body.status,
      rating: body.result?.rating,
      evaluationSummary: body.result?.summary,
      recommendations: body.result?.recommendations,
      lastEvaluatedAt: new Date()
    }
  })

  return NextResponse.json({ success: true })
}
```

### Task Types

```typescript
// Available task types
TASK_TYPES = {
  EVALUATE_DEPARTMENT: 'evaluate_department',
  AUTOMATED_GATHER: 'automated_gather',
  QUALITY_CHECK: 'quality_check',
  MIGRATE_DATA: 'migrate_data'
}
```

### Error Handling

```typescript
try {
  const task = await taskService.submitEvaluation(data)
} catch (error) {
  if (error.message.includes('service_unavailable')) {
    // Task service down - notify user
    console.error('Task service unavailable')
  } else if (error.message.includes('validation_failed')) {
    // Invalid task data
    console.error('Invalid task configuration')
  } else {
    console.error('Task submission failed:', error)
  }
}
```

---

## LLM Integration via @codebuff/sdk

### Overview
All LLM interactions go through @codebuff/sdk, which provides a unified interface to OpenRouter and Anthropic APIs.

**Architecture**: PayloadCMS Agents → AladdinAgentRunner → @codebuff/sdk → OpenRouter/Anthropic

### AladdinAgentRunner Setup

```typescript
// src/lib/agents/AladdinAgentRunner.ts
import { CodebuffClient } from '@codebuff/sdk'
import type { Payload } from 'payload'

export class AladdinAgentRunner {
  private client: CodebuffClient
  private payload: Payload

  constructor(apiKey: string, payload: Payload, cwd?: string) {
    // Auto-detect OpenRouter vs Anthropic
    const useOpenRouter = !!process.env.OPENROUTER_BASE_URL
    const finalApiKey = useOpenRouter
      ? process.env.OPENROUTER_API_KEY || apiKey
      : apiKey

    this.client = new CodebuffClient({
      apiKey: finalApiKey,
      baseURL: useOpenRouter ? process.env.OPENROUTER_BASE_URL : undefined,
      cwd: cwd || process.cwd(),
    })
    this.payload = payload
  }

  async executeAgent(
    agentId: string,
    prompt: string,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // 1. Load agent from PayloadCMS
    const agent = await this.payload.find({
      collection: 'agents',
      where: { agentId: { equals: agentId } }
    })

    // 2. Load custom tools for agent
    const tools = await this.loadCustomTools(agent)

    // 3. Create agent definition
    const agentDefinition = {
      id: agent.agentId,
      model: agent.model,
      displayName: agent.name,
      toolNames: agent.toolNames,
      instructionsPrompt: agent.instructionsPrompt
    }

    // 4. Execute via @codebuff/sdk
    const result = await this.client.run({
      agent: agent.agentId,
      prompt,
      agentDefinitions: [agentDefinition],
      customToolDefinitions: tools,
      maxAgentSteps: agent.maxAgentSteps || 20,
      handleEvent: async (event) => {
        // Store events in agent-executions collection
        await this.handleAgentEvent(executionId, event)
      }
    })

    return {
      executionId,
      output: result.output,
      runState: result,
      executionTime: Date.now() - startTime
    }
  }
}
```

### Usage in Qualification System

```typescript
// src/lib/qualification/worldDepartment.ts
import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function processWorldData(projectId: string) {
  const payload = await getPayload({ config })
  const runner = new AladdinAgentRunner(
    process.env.CODEBUFF_API_KEY!,
    payload
  )

  // Execute world-processor agent
  const result = await runner.executeAgent(
    'world-processor-001',
    'Generate story bible from gather data',
    {
      projectId,
      conversationId: `world-${projectId}`,
      metadata: { department: 'world' }
    }
  )

  return result.output // Story bible
}
```

### Custom Tool Loading

```typescript
// Tools are loaded from PayloadCMS custom-tools collection
private async loadCustomTools(agent: any): Promise<any[]> {
  const toolsQuery = await this.payload.find({
    collection: 'custom-tools',
    where: {
      and: [
        {
          or: [
            { isGlobal: { equals: true } },
            { departments: { contains: agent.department } }
          ]
        },
        { isActive: { equals: true } }
      ]
    }
  })

  return toolsQuery.docs.map(tool => ({
    toolName: tool.toolName,
    description: tool.description,
    inputSchema: tool.inputSchema,
    execute: new Function(`return ${tool.executeFunction}`)()
  }))
}
```

### OpenRouter Configuration

```bash
# .env
# For OpenRouter (via @codebuff/sdk)
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5

# For direct Anthropic (via @codebuff/sdk)
ANTHROPIC_API_KEY=sk-ant-...
CODEBUFF_API_KEY=${ANTHROPIC_API_KEY}
```

### Execution Tracking

All agent executions are tracked in the `agent-executions` collection:

```typescript
interface AgentExecution {
  id: string
  agent: string              // Agent ID
  department: string         // Department ID
  project: string            // Project ID
  prompt: string            // Input prompt
  output: unknown           // Agent output
  runState: RunState        // Full @codebuff/sdk run state
  status: 'running' | 'completed' | 'failed'
  executionTime: number     // Milliseconds
  tokenUsage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  events: Array<unknown>    // Real-time events
  error?: {
    message: string
    code?: string
  }
}
```

### Error Handling

```typescript
try {
  const result = await runner.executeAgent(agentId, prompt, context)
} catch (error) {
  console.error('Agent execution failed:', error)

  // Automatic retry with exponential backoff
  if (execution.retryCount < execution.maxRetries) {
    const delay = Math.pow(2, execution.retryCount) * 1000
    await new Promise(resolve => setTimeout(resolve, delay))
    return runner.executeAgent(agentId, prompt, context)
  }
}
```

### Performance Metrics

Agent performance is automatically tracked:

```typescript
interface AgentMetrics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number  // Milliseconds
  successRate: number            // Percentage
  lastExecutedAt: Date
}
```

---

## FAL.ai Integration

### Overview
FAL.ai provides AI-powered media generation for images and vision queries.

**Models Used**:
- `fal-ai/nano-banana` - Text to image generation
- `fal-ai/nano-banana/edit` - Image to image editing
- `fal-ai/moondream2/visual-query` - Vision-language queries

### Client Setup

```typescript
import * as fal from '@fal-ai/serverless-client'

fal.config({
  credentials: process.env.FAL_KEY
})
```

### Core Operations

#### 1. Text to Image Generation
```typescript
import { generateImage } from '@/lib/fal/text-to-image'

const result = await generateImage({
  prompt: 'A heroic character with blue eyes standing in a medieval castle',
  imageSize: 'landscape_16_9',
  numInferenceSteps: 28,
  numImages: 1
})

console.log('Image URL:', result.images[0].url)
console.log('Content type:', result.images[0].content_type)
```

#### 2. Image Editing
```typescript
import { editImage } from '@/lib/fal/image-to-image'

const result = await editImage({
  imageUrl: 'https://existing-image.jpg',
  prompt: 'Change eye color to green',
  strength: 0.75 // How much to modify (0-1)
})

console.log('Edited image:', result.images[0].url)
```

#### 3. Vision Query (OCR/Understanding)
```typescript
import { queryVision } from '@/lib/fal/vision-query'

const result = await queryVision({
  imageUrl: 'https://document-image.jpg',
  prompt: 'Extract all text from this document'
})

console.log('Extracted text:', result.output)
```

### Usage in Gather System

```typescript
// Process uploaded images
import { getGatherAIProcessor } from '@/lib/gather/aiProcessor'

const aiProcessor = getGatherAIProcessor()

const result = await aiProcessor.processContent({
  content: 'User uploaded an image',
  imageUrl: 'https://media.rumbletv.com/uploads/scene.jpg',
  projectId: 'project123'
})

// Result includes:
// - extractedText (from vision query)
// - enrichedContent (combined text + image analysis)
// - summary & context
```

### Error Handling

```typescript
try {
  const result = await generateImage(params)
} catch (error) {
  if (error.message.includes('quota_exceeded')) {
    console.error('FAL.ai quota exceeded')
  } else if (error.message.includes('content_policy')) {
    console.error('Image violates content policy')
  } else {
    console.error('Image generation failed:', error)
  }
}
```

### Rate Limits
- **Free tier**: 100 requests/day
- **Pro tier**: 10,000 requests/day
- **Response time**: 2-10 seconds per image

---

## Integration Patterns

### 1. Resilient Integration Pattern

```typescript
async function resilientBrainOperation<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    console.error('Brain operation failed:', error)

    // Log to monitoring
    await logError('brain_service', error)

    // Return fallback or null
    return fallback ?? null
  }
}

// Usage
const brainResult = await resilientBrainOperation(
  () => brainClient.addNode(nodeData),
  null // Continue even if Brain fails
)
```

### 2. Queue-Based Pattern (Task Service)

```typescript
// Submit task and return immediately
const taskId = await taskService.submitEvaluation(data)

// Store task ID for later polling
await redis.set(`task:${projectId}:${deptId}`, taskId)

// Client polls for updates via API
// GET /api/v1/project-readiness/[projectId]/task/[taskId]/status
```

### 3. Webhook Callback Pattern

```typescript
// Task service sends callback when done
// POST /api/webhooks/evaluation-complete

export async function POST(request: NextRequest) {
  const { task_id, status, result, error } = await request.json()

  // Update database
  await updateProjectReadiness(task_id, status, result)

  // Notify client via WebSocket
  await notifyClient(projectId, { type: 'evaluation_complete', result })

  return NextResponse.json({ success: true })
}
```

### 4. Retry Pattern with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error

      const delay = baseDelay * Math.pow(2, i)
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error('Max retries exceeded')
}

// Usage
const result = await retryWithBackoff(
  () => brainClient.addNode(nodeData),
  3,
  1000
)
```

---

## Error Handling

### Service-Specific Error Codes

#### Brain Service
```typescript
{
  404: 'Node not found',
  409: 'Duplicate node',
  422: 'Validation failed',
  503: 'Neo4j connection failed'
}
```

#### Task Service
```typescript
{
  400: 'Invalid task data',
  404: 'Task not found',
  409: 'Task already running',
  503: 'Celery worker unavailable'
}
```

#### FAL.ai
```typescript
{
  400: 'Invalid parameters',
  402: 'Quota exceeded',
  451: 'Content policy violation',
  503: 'Model unavailable'
}
```

### Global Error Handler

```typescript
// src/lib/error-handler.ts
export async function handleServiceError(
  service: 'brain' | 'task' | 'fal',
  error: Error,
  context: Record<string, any>
) {
  // Log to monitoring
  console.error(`[${service.toUpperCase()}] Error:`, {
    error: error.message,
    context,
    timestamp: new Date().toISOString()
  })

  // Alert if critical
  if (isCriticalError(error)) {
    await sendAlert(service, error, context)
  }

  // Return user-friendly message
  return {
    error: service + '_error',
    message: getUserMessage(error),
    canRetry: isRetryable(error)
  }
}
```

---

## Performance Optimization

### 1. Caching Strategy

```typescript
// Redis caching for Brain searches
import { redis } from '@/lib/redis'

async function cachedSemanticSearch(query: string, projectId: string) {
  const cacheKey = `brain:search:${projectId}:${query}`

  // Check cache
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Fetch from Brain
  const results = await brainClient.semanticSearch({ query, projectId })

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(results))

  return results
}
```

### 2. Batch Operations

```typescript
// Batch node creation
const nodes = await Promise.all([
  brainClient.addNode(node1),
  brainClient.addNode(node2),
  brainClient.addNode(node3)
])

// Or use batch API
const nodes = await brainClient.batchCreateNodes([
  node1, node2, node3
])
```

### 3. Connection Pooling

```typescript
// Brain client reuses axios instance
const brainClient = getBrainClient() // Singleton

// Task service reuses fetch configuration
const taskService = new TaskServiceClient() // Singleton
```

### 4. Timeout Configuration

```typescript
// Brain client: 30s timeout
const brainClient = new BrainClient(config, {
  timeout: 30000,
  retries: 3
})

// Task service: 60s timeout
const taskService = new TaskServiceClient()
taskService.timeout = 60000
```

---

## Health Monitoring

### Service Health Checks

```typescript
// Check all services
export async function checkServicesHealth() {
  const [brain, task, fal] = await Promise.allSettled([
    brainClient.healthCheck(),
    taskService.checkHealth(),
    falClient.healthCheck()
  ])

  return {
    brain: brain.status === 'fulfilled',
    task: task.status === 'fulfilled',
    fal: fal.status === 'fulfilled',
    timestamp: new Date().toISOString()
  }
}

// Health endpoint
// GET /api/health
export async function GET() {
  const health = await checkServicesHealth()
  const allHealthy = Object.values(health).every(v => v === true || typeof v === 'string')

  return NextResponse.json(health, {
    status: allHealthy ? 200 : 503
  })
}
```

---

## Configuration Reference

### Environment Variables

```bash
# Brain Service
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=your_brain_api_key
JINA_API_KEY=your_jina_api_key

# Task Service
TASKS_API_URL=https://tasks.ft.tc
TASK_API_KEY=your_task_api_key

# FAL.ai
FAL_KEY=your_fal_api_key
FAL_TEXT_TO_IMAGE_MODEL=fal-ai/nano-banana
FAL_IMAGE_TO_IMAGE_MODEL=fal-ai/nano-banana/edit
FAL_VISION_QUERY_MODEL=fal-ai/moondream2/visual-query

# Webhooks
NEXT_PUBLIC_APP_URL=https://aladdin.ngrok.pro
```

---

## Best Practices

1. **Always use singleton instances** for service clients
2. **Implement fallback behavior** for non-critical operations
3. **Use webhooks for long-running tasks** instead of polling
4. **Cache frequently accessed data** with appropriate TTL
5. **Log all service interactions** for debugging
6. **Monitor service health** proactively
7. **Handle errors gracefully** without breaking user experience
8. **Use batch operations** when processing multiple items
9. **Set appropriate timeouts** for each service
10. **Validate data before sending** to external services

---

## Troubleshooting

### Brain Service Issues
```bash
# Test connection
curl https://brain.ft.tc/api/v1/health \
  -H "Authorization: Bearer ${BRAIN_SERVICE_API_KEY}"

# Check Neo4j connectivity
curl https://brain.ft.tc/api/v1/stats \
  -H "Authorization: Bearer ${BRAIN_SERVICE_API_KEY}"
```

### Task Service Issues
```bash
# Check service health
curl https://tasks.ft.tc/api/v1/health \
  -H "X-API-Key: ${TASK_API_KEY}"

# Check task status
curl https://tasks.ft.tc/api/v1/tasks/${TASK_ID}/status \
  -H "X-API-Key: ${TASK_API_KEY}"
```

### FAL.ai Issues
```bash
# Test API key
curl https://fal.run/fal-ai/nano-banana \
  -H "Authorization: Key ${FAL_KEY}" \
  -d '{"prompt": "test"}'
```

---

## Support

For integration issues:
- Brain Service: https://github.com/brain-service/docs
- Task Service: /docs/celery-redis/
- FAL.ai: https://fal.ai/docs
