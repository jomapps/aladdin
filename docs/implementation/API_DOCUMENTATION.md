# API Documentation - Aladdin System

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [API Routes](#api-routes)
- [Request/Response Schemas](#requestresponse-schemas)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Overview

The Aladdin API is organized into versioned endpoints under `/api/v1/` with the following main categories:

1. **Gather APIs** - Unqualified content collection
2. **Project Readiness APIs** - Department evaluation and validation
3. **Brain APIs** - Knowledge graph and semantic search
4. **Orchestrator APIs** - AI agent coordination
5. **Webhook APIs** - External service callbacks

**Base URL**: `https://aladdin.ngrok.pro/api/v1`

---

## Authentication

### PayloadCMS Authentication
Most endpoints use PayloadCMS session-based authentication.

```typescript
// Request headers
headers: {
  'Authorization': 'Bearer <payload-token>',
  'Content-Type': 'application/json'
}
```

### Service Authentication
External services (Brain, Task Queue) use API keys:

```typescript
// Brain Service
headers: {
  'Authorization': 'Bearer <BRAIN_SERVICE_API_KEY>'
}

// Task Service
headers: {
  'X-API-Key': '<TASK_API_KEY>'
}
```

---

## API Routes

### 1. Gather APIs

#### GET /api/v1/gather/[projectId]
**Description**: List gather items with pagination and filters

**Query Parameters**:
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 20
  search?: string;      // Full-text search
  sort?: 'latest' | 'oldest' | 'a-z' | 'z-a'; // Default: 'latest'
  hasImage?: boolean;   // Filter by image presence
  hasDocument?: boolean; // Filter by document presence
}
```

**Response**:
```typescript
{
  items: GatherItem[];
  total: number;
  page: number;
  pages: number;
  hasMore: boolean;
}
```

**Example**:
```bash
curl "https://aladdin.ngrok.pro/api/v1/gather/abc123?page=1&limit=10&sort=latest"
```

---

#### POST /api/v1/gather/[projectId]
**Description**: Create new gather item with AI processing

**Request Body**:
```typescript
{
  content: string;        // Required
  imageUrl?: string;      // Optional
  documentUrl?: string;   // Optional
}
```

**Response**:
```typescript
{
  success: boolean;
  item: GatherItem;
  duplicates: Array<{
    id: string;
    similarity: number;
    content: string;
  }>;
  brain: {
    saved: boolean;
    error?: string;
  }
}
```

**Processing Steps**:
1. Validates project existence
2. Authenticates user
3. Processes content with AI (enrichment, summarization)
4. Detects duplicates via Brain service
5. Stores in MongoDB gather database
6. Indexes in Brain service for semantic search

---

#### GET /api/v1/gather/[projectId]/count
**Description**: Get gather item count and statistics

**Response**:
```typescript
{
  count: number;
  lineCount: number;
}
```

---

#### DELETE /api/v1/gather/[projectId]/[id]
**Description**: Delete a gather item

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

#### POST /api/v1/gather/[projectId]/clear
**Description**: Clear all gather items (admin only)

**Response**:
```typescript
{
  success: boolean;
  deletedCount: number;
}
```

---

### 2. Project Readiness APIs

#### GET /api/v1/project-readiness/[projectId]
**Description**: Get all department evaluations for a project

**Response**:
```typescript
{
  departments: Array<{
    id: string;
    departmentId: string;
    departmentName: string;
    status: 'idle' | 'in_progress' | 'completed' | 'failed';
    rating?: number;
    evaluationSummary?: string;
    taskId?: string;
    lastEvaluatedAt?: string;
  }>;
}
```

---

#### POST /api/v1/project-readiness/[projectId]/evaluate
**Description**: Submit a department for evaluation using AI agents

**Architecture**: Uses AladdinAgentRunner to execute evaluation agents from PayloadCMS

**Request Body**:
```typescript
{
  departmentNumber: number; // Required (1-based)
}
```

**Response**:
```typescript
{
  taskId: string;
  department: string;
  status: 'in_progress' | 'queued';
  message: string;
  executionId?: string; // Agent execution ID
}
```

**Execution Flow**:
1. Load department from PayloadCMS
2. Find corresponding agent (e.g., 'story-evaluator-001')
3. Create AladdinAgentRunner instance
4. Execute agent via @codebuff/sdk
5. Agent uses custom tools to:
   - Gather project data
   - Analyze content quality
   - Generate evaluation summary
   - Store results in project-readiness
6. Track execution in agent-executions collection

**Validation Rules**:
1. Previous department must be completed (except dept 1)
2. Previous department rating must meet threshold
3. Project must exist
4. Department must exist
5. Agent must be active in PayloadCMS

---

#### GET /api/v1/project-readiness/[projectId]/task/[taskId]/status
**Description**: Get evaluation task status

**Response**:
```typescript
{
  task_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: {
    rating: number;
    summary: string;
    recommendations: string[];
  };
  error?: string;
}
```

---

#### DELETE /api/v1/project-readiness/[projectId]/task/[taskId]/cancel
**Description**: Cancel a running evaluation task

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 3. Brain Service APIs

#### POST /api/v1/brain/nodes
**Description**: Add node to knowledge graph

**Request Body**:
```typescript
{
  type: 'gather' | 'character' | 'scene' | 'location' | 'dialogue';
  content: string;        // Content to embed for semantic search
  projectId: string;      // Project isolation
  properties?: {          // Additional metadata
    [key: string]: any;
  };
  generateEmbedding?: boolean; // Default: true
}
```

**Response**:
```typescript
{
  node: {
    id: string;
    type: string;
    properties: Record<string, any>;
    embedding?: number[];
  }
}
```

---

#### POST /api/v1/brain/search
**Description**: Semantic search across knowledge graph

**Request Body**:
```typescript
{
  query: string;
  projectId: string;
  type?: string;          // Filter by node type
  limit?: number;         // Default: 10
  threshold?: number;     // Similarity threshold (0-1)
}
```

**Response**:
```typescript
{
  results: Array<{
    id: string;
    type: string;
    content: string;
    similarity: number;
    properties: Record<string, any>;
  }>
}
```

---

#### POST /api/v1/brain/validate
**Description**: Validate content for quality, consistency, contradictions

**Request Body**:
```typescript
{
  content: string;
  projectId: string;
  type: string;
  existingNodes?: string[]; // Node IDs to check against
}
```

**Response**:
```typescript
{
  isValid: boolean;
  qualityScore: number;   // 0-1
  issues: Array<{
    type: 'contradiction' | 'low_quality' | 'duplicate';
    severity: 'low' | 'medium' | 'high';
    description: string;
    relatedNodes?: string[];
  }>;
  recommendations: string[];
}
```

---

### 4. Orchestrator APIs

#### POST /api/orchestrator/chat
**Description**: Send message to master orchestrator

**Request Body**:
```typescript
{
  message: string;
  projectId?: string;
  conversationId?: string;
}
```

**Response** (Streaming):
```typescript
// Server-Sent Events (SSE)
data: {"type": "content", "content": "..."}
data: {"type": "tool_use", "tool": "routeToDepartment", "input": {...}}
data: {"type": "complete", "conversationId": "..."}
```

---

#### POST /api/orchestrator/stream
**Description**: Stream orchestrator execution

**Request Body**:
```typescript
{
  action: string;
  projectId: string;
  data?: any;
}
```

**Response** (Streaming):
```typescript
// Server-Sent Events
data: {"event": "start", "timestamp": "..."}
data: {"event": "agent_spawn", "agent": "character-head"}
data: {"event": "progress", "progress": 0.5}
data: {"event": "complete", "result": {...}}
```

---

### 5. Webhook APIs

#### POST /api/webhooks/evaluation-complete
**Description**: Callback from Task Service when evaluation completes

**Request Body**:
```typescript
{
  task_id: string;
  status: 'completed' | 'failed';
  result?: {
    rating: number;
    summary: string;
    recommendations: string[];
  };
  error?: string;
  metadata: {
    department_id: string;
    user_id?: string;
  };
}
```

**Security**: Validates API key from Task Service

---

#### POST /api/webhooks/automated-gather-progress
**Description**: Callback for automated gather task progress

**Request Body**:
```typescript
{
  task_id: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: {
    content: string;
    quality_score: number;
  };
}
```

---

## Request/Response Schemas

### GatherItem Schema
```typescript
interface GatherItem {
  _id: string;
  projectId: string;
  content: string;           // User's original content
  summary: string;           // AI-generated summary
  context: string;           // AI-extracted context
  imageUrl?: string;
  documentUrl?: string;
  extractedText?: string;    // From image/document OCR
  duplicateCheckScore?: number;
  iterationCount?: number;   // AI processing iterations
  isAutomated?: boolean;     // Auto-generated vs manual
  automationMetadata?: {
    taskId: string;
    department: string;
    iteration: number;
    qualityScore: number;
  };
  createdAt: Date;
  createdBy: string;         // User ID
  lastUpdated: Date;
}
```

### ProjectReadiness Schema
```typescript
interface ProjectReadiness {
  id: string;
  projectId: string;
  departmentId: string;
  status: 'idle' | 'in_progress' | 'completed' | 'failed';
  taskId?: string;           // Task service task ID
  taskStatus?: string;
  rating?: number;           // 0-100 quality score
  evaluationSummary?: string;
  recommendations?: string[];
  gatherDataCount?: number;
  lastEvaluatedAt?: Date;
  evaluatedBy?: string;      // User ID
}
```

### Department Schema
```typescript
interface Department {
  id: string;
  name: string;
  slug: string;
  codeDepNumber: number;     // Sequential order (1-based)
  gatherCheck: boolean;      // Requires gather data
  coordinationSettings?: {
    minQualityThreshold: number; // 0-100
    requiresPreviousDept: boolean;
    maxRetries: number;
  };
}
```

---

## Error Handling

### Standard Error Response
```typescript
{
  error: string;          // Error code
  message: string;        // Human-readable message
  details?: any;          // Additional context
  statusCode: number;
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `invalid_request` | Missing or invalid parameters |
| 401 | `unauthorized` | Authentication required |
| 403 | `forbidden` | Insufficient permissions |
| 404 | `not_found` | Resource doesn't exist |
| 409 | `conflict` | Resource state conflict |
| 422 | `validation_failed` | Data validation error |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Server error |
| 503 | `service_unavailable` | External service down |

### Error Examples

**Invalid Request**:
```json
{
  "error": "invalid_request",
  "message": "Content is required",
  "statusCode": 400
}
```

**Sequential Constraint Violation**:
```json
{
  "error": "validation_failed",
  "message": "Cannot evaluate Character Department. Previous department (Story Department) scored 65, but threshold is 80.",
  "statusCode": 422
}
```

**External Service Error**:
```json
{
  "error": "service_unavailable",
  "message": "Brain service unavailable: Connection refused",
  "details": {
    "service": "brain.ft.tc",
    "endpoint": "/api/v1/nodes"
  },
  "statusCode": 503
}
```

---

## Rate Limiting

### Default Limits
- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **AI Processing**: 10 concurrent operations per project

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1640000000
```

### Rate Limit Error
```json
{
  "error": "rate_limited",
  "message": "Too many requests. Try again in 300 seconds.",
  "retryAfter": 300,
  "statusCode": 429
}
```

---

## WebSocket APIs

### /api/orchestrator/ws
**Description**: Real-time orchestrator updates

**Connection**:
```javascript
const ws = new WebSocket('wss://aladdin.ngrok.pro/api/orchestrator/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

**Message Types**:
```typescript
// Agent spawned
{ type: 'agent_spawn', agent: 'character-head', timestamp: '...' }

// Progress update
{ type: 'progress', progress: 0.5, message: '...' }

// Result
{ type: 'result', data: {...} }

// Error
{ type: 'error', error: '...' }
```

---

## Versioning

Current Version: **v1**

Breaking changes will increment the major version (v2, v3, etc.).

**Deprecation Policy**:
- Deprecated endpoints supported for 6 months
- `Deprecation` header indicates deprecated endpoints
- Migration guide provided in API changelog

---

## Testing

### Test Environment
```bash
# Base URL
https://aladdin-staging.ngrok.pro/api/v1

# Test API Key (Brain Service)
BRAIN_SERVICE_API_KEY=test_key_...
```

### Example: Create Gather Item
```bash
curl -X POST https://aladdin.ngrok.pro/api/v1/gather/project123 \
  -H "Authorization: Bearer ${PAYLOAD_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "The hero discovers their true power in the final act",
    "imageUrl": "https://media.rumbletv.com/scenes/hero-power.jpg"
  }'
```

### Example: Start Evaluation
```bash
curl -X POST https://aladdin.ngrok.pro/api/v1/project-readiness/project123/evaluate \
  -H "Authorization: Bearer ${PAYLOAD_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "departmentNumber": 1
  }'
```

---

## Support

For API support and questions:
- GitHub Issues: https://github.com/aladdin/issues
- Documentation: /docs/implementation/
- Email: api-support@aladdin.io
