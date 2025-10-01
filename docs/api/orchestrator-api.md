# Orchestrator API Documentation

Complete API reference for the Orchestrator UI Hive Mind system.

## Overview

The Orchestrator API provides 4 intelligent modes for interacting with project data:

1. **Query Mode** - Natural language queries with Brain service
2. **Data Ingestion** - Intelligent data parsing and validation
3. **Task Execution** - Complex multi-agent task orchestration
4. **General Chat** - Standard LLM conversation

All endpoints require authentication and support real-time streaming via Server-Sent Events (SSE).

## Base URL

```
/api/orchestrator
```

## Authentication

All endpoints require a valid session cookie from PayloadCMS authentication.

```http
Cookie: payload-token=<jwt-token>
```

## Endpoints

### 1. Query Mode API

Natural language queries across project knowledge graph.

**Endpoint:** `POST /api/orchestrator/query`

**Request Body:**
```typescript
{
  query: string              // Required: Natural language query
  projectId?: string         // Optional: Project context
  conversationId?: string    // Optional: Link to conversation
  collections?: string[]     // Optional: Filter by entity types
  limit?: number            // Optional: Max results (default: 10)
  includeRelationships?: boolean  // Optional: Include related nodes (default: true)
}
```

**Response:**
```typescript
{
  answer: string                    // LLM-generated answer
  sources: Array<{
    id: string
    type: string
    content: string
    score: number                   // Similarity score 0-1
    metadata: object
  }>
  relatedNodes: Array<{
    id: string
    type: string
    name: string
    relationship: string
    score: number
  }>
  confidence: number                // Overall confidence 0-1
  suggestions: string[]             // Follow-up suggestions
  conversationId?: string
  metadata: {
    tokensUsed: number
    processingTime: number          // milliseconds
    searchTime: number             // milliseconds
  }
}
```

**Example:**
```bash
curl -X POST /api/orchestrator/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are Aladdin'\''s key personality traits?",
    "projectId": "proj_123",
    "limit": 5
  }'
```

---

### 2. Data Ingestion API

Intelligent data parsing with LLM-powered categorization.

**Endpoint:** `POST /api/orchestrator/data`

**Request Body:**
```typescript
{
  data: any                  // Required: Raw data (string or object)
  projectId: string          // Required: Project ID
  entityType: string         // Required: Expected entity type
  sourceCollection?: string  // Optional: Source Payload collection
  sourceId?: string         // Optional: Source document ID
  autoConfirm?: boolean     // Optional: Skip confirmation (default: false)
  skipValidation?: boolean  // Optional: Skip validation (default: false)
}
```

**Response:**
```typescript
{
  status: 'pending_confirmation' | 'confirmed' | 'rejected'
  suggestedData: {
    entityType: string
    parsed: object                  // Structured data
    metadata: object
    relationships: Array<{
      type: string
      target: string
      targetType: string
      confidence: number
      reasoning: string
      properties?: object
    }>
  }
  validation: {
    valid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
  }
  duplicates: Array<{
    existingId: string
    similarity: number              // 0-1
    existingData: object
    suggestion: 'merge' | 'skip' | 'create_new'
  }>
  preview: {
    category: string
    confidence: number
    requiredFields: Array<{
      name: string
      type: string
      description: string
      value: any
      status: 'complete' | 'incomplete' | 'needs_review'
    }>
  }
  confirmationRequired: boolean
  brainDocumentId?: string          // If auto-confirmed
}
```

**Example:**
```bash
curl -X POST /api/orchestrator/data \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Princess Jasmine is a strong-willed character...",
    "projectId": "proj_123",
    "entityType": "character"
  }'
```

**Confirmation Endpoint:** `POST /api/orchestrator/data/confirm`

```typescript
{
  brainDocument: object      // Full brain document from ingestion response
  action: 'confirm' | 'reject' | 'modify'
  modifications?: object     // If action is 'modify'
}
```

---

### 3. Task Execution API

Multi-agent task orchestration with department coordination.

**Endpoint:** `POST /api/orchestrator/task`

**Request Body:**
```typescript
{
  task: string              // Required: Task description
  projectId: string         // Required: Project ID
  conversationId?: string   // Optional: Link to conversation
  priority?: 'low' | 'medium' | 'high' | 'critical'  // Default: 'medium'
  departments?: string[]    // Optional: Specific departments
  context?: object         // Optional: Additional context
}
```

**Response:**
```typescript
{
  taskId: string
  status: 'queued' | 'in_progress' | 'completed' | 'failed'
  departments: Array<{
    department: string
    status: 'pending' | 'in_progress' | 'complete' | 'failed'
    relevance: number           // 0-1
    outputs: Array<{
      agentId: string
      agentName: string
      output: object
      qualityScore: number
      issues: string[]
      suggestions: string[]
      decision: 'approve' | 'modify' | 'reject' | 'pending'
    }>
    quality: number            // 0-1
    issues: string[]
    suggestions: string[]
  }>
  progress: {
    current: number
    total: number
    percentage: number
  }
  results?: Array<{
    type: string
    data: object
    quality: number
    brainDocumentId?: string
  }>
  quality: {
    overall: number           // 0-1
    consistency: number       // 0-1
    completeness: number      // 0-1
  }
  recommendation?: 'approve' | 'modify' | 'reject'
  estimatedCompletion?: Date
  websocketUrl?: string       // For real-time updates
}
```

**Get Task Status:** `GET /api/orchestrator/task?taskId=<id>`

**Example:**
```bash
curl -X POST /api/orchestrator/task \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Create a character profile for Jafar",
    "projectId": "proj_123",
    "priority": "high"
  }'
```

---

### 4. General Chat API

Standard LLM conversation without project context.

**Endpoint:** `POST /api/orchestrator/chat`

**Request Body:**
```typescript
{
  message: string           // Required: User message
  conversationId?: string   // Optional: Conversation ID
  model?: string           // Optional: LLM model override
  temperature?: number     // Optional: 0-2 (default: 0.7)
  stream?: boolean        // Optional: Enable streaming (default: false)
}
```

**Response:**
```typescript
{
  message: string
  conversationId: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  suggestions?: string[]
}
```

**Example:**
```bash
curl -X POST /api/orchestrator/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain the hero'\''s journey in storytelling",
    "temperature": 0.7
  }'
```

---

### 5. Streaming API

Server-Sent Events for real-time updates.

**Endpoint:** `GET /api/orchestrator/stream?mode=<mode>&taskId=<id>`

**Query Parameters:**
- `mode`: 'query' | 'chat' | 'task'
- `taskId`: Task ID (for task mode)
- `conversationId`: Conversation ID (optional)

**Event Types:**
```typescript
// Connection established
{ type: 'connected', timestamp: Date }

// Progress update
{
  type: 'progress',
  stage: string,
  current: number,
  total: number,
  message: string
}

// Token streaming (for chat/query)
{ type: 'token', token: string, index: number }

// Error event
{ type: 'error', error: string, code?: string }

// Completion event
{ type: 'complete', data: any }
```

**Example:**
```javascript
const eventSource = new EventSource('/api/orchestrator/stream?mode=task&taskId=123');

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data);
});
```

---

### 6. Conversation History API

Manage conversation storage and retrieval.

**Get Conversation:** `GET /api/orchestrator/history?conversationId=<id>`

**List Conversations:** `GET /api/orchestrator/history?projectId=<id>&limit=50&offset=0`

**Save Message:** `POST /api/orchestrator/history`
```typescript
{
  conversationId?: string   // Create new if not provided
  projectId?: string
  name?: string
  message: {
    role: 'user' | 'assistant' | 'system'
    content: string
    mode: 'query' | 'data' | 'task' | 'chat'
    metadata?: object
  }
}
```

**Delete Conversation:** `DELETE /api/orchestrator/history?conversationId=<id>`

---

## Error Responses

All endpoints return standardized error responses:

```typescript
{
  error: string          // Human-readable error message
  code: string          // Machine-readable error code
  details?: any        // Additional error details
  statusCode: number
}
```

**Common Error Codes:**
- `AUTH_REQUIRED` (401) - Authentication required
- `FORBIDDEN` (403) - Access denied
- `VALIDATION_ERROR` (400) - Invalid request data
- `NOT_FOUND` (404) - Resource not found
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

---

## Rate Limiting

- **Default Limit:** 100 requests per minute per user
- **Rate Limit Headers:**
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Timestamp when limit resets

---

## Best Practices

### Query Mode
- Use specific, focused queries
- Include `projectId` for project-specific context
- Leverage `includeRelationships` for exploring connections
- Check `confidence` score to assess answer quality

### Data Ingestion
- Always review suggested data before confirming
- Check for duplicates to avoid redundant entries
- Use validation warnings to improve data quality
- Provide `sourceCollection` and `sourceId` for traceability

### Task Execution
- Monitor progress via WebSocket for long-running tasks
- Set appropriate `priority` based on urgency
- Review quality metrics before accepting results
- Use `departments` filter to focus on specific areas

### General Chat
- Keep conversations focused for better context
- Use `temperature` to control response creativity
- Enable `stream` for real-time token delivery
- Review `suggestions` for follow-up questions

---

## Integration Examples

### React Hook
```typescript
import { useState } from 'react'

function useOrchestratorQuery() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const query = async (text: string, projectId?: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/orchestrator/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, projectId }),
      })

      if (!response.ok) {
        throw new Error('Query failed')
      }

      const data = await response.json()
      setResult(data)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { query, loading, result, error }
}
```

### Task Progress Monitoring
```typescript
async function monitorTask(taskId: string) {
  const eventSource = new EventSource(
    `/api/orchestrator/stream?mode=task&taskId=${taskId}`
  )

  eventSource.addEventListener('message', (event) => {
    const data = JSON.parse(event.data)

    switch (data.type) {
      case 'progress':
        console.log(`Progress: ${data.current}/${data.total} - ${data.message}`)
        break
      case 'complete':
        console.log('Task completed:', data.data)
        eventSource.close()
        break
      case 'error':
        console.error('Task error:', data.error)
        eventSource.close()
        break
    }
  })

  return eventSource
}
```

---

## Support

For issues or questions:
- **Documentation:** `/docs/api/orchestrator-api.md`
- **GitHub Issues:** https://github.com/your-org/aladdin/issues
- **Contact:** support@your-org.com
