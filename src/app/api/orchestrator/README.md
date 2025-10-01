# Orchestrator API

Backend API for the Orchestrator UI Hive Mind system.

## 📂 Directory Structure

```
orchestrator/
├── README.md                    # This file
├── types.ts                     # Shared TypeScript types and Zod schemas
├── utils/
│   └── index.ts                # Shared utility functions
├── query/
│   └── route.ts                # Query Mode: Natural language queries
├── data/
│   ├── route.ts                # Data Ingestion: Parse and prepare data
│   └── confirm/
│       └── route.ts            # Confirmation workflow
├── task/
│   └── route.ts                # Task Execution: Multi-agent orchestration
├── chat/
│   └── route.ts                # General Chat: Standard LLM conversation
├── stream/
│   └── route.ts                # SSE Streaming: Real-time updates
└── history/
    └── route.ts                # Conversation History: CRUD operations
```

## 🎯 Modes

### 1. Query Mode (`/query/route.ts`)
**Purpose:** Answer questions using project knowledge graph

**Features:**
- Semantic search across Brain service
- LLM-powered answer generation
- Source citations with similarity scores
- Related node exploration
- Follow-up suggestions
- Conversation history

**Key Integrations:**
- Brain Client (semantic search, relationships)
- LLM Client (answer generation)

### 2. Data Ingestion (`/data/route.ts` + `/data/confirm/route.ts`)
**Purpose:** Intelligent data parsing and ingestion

**Features:**
- LLM-powered data parsing
- Automatic entity type detection
- Duplicate detection via semantic search
- Data Preparation Agent integration
- Entity schema validation
- User confirmation workflow
- Relationship discovery

**Key Integrations:**
- LLM Client (parsing, categorization)
- Brain Client (duplicate detection, ingestion)
- Data Preparation Agent (enrichment)

### 3. Task Execution (`/task/route.ts`)
**Purpose:** Complex multi-agent task orchestration

**Features:**
- Master Orchestrator coordination
- Department-based routing
- Specialist agent spawning
- Async execution with tracking
- Real-time progress via SSE
- Quality scoring and recommendations
- WebSocket support

**Key Integrations:**
- Orchestrator (multi-agent coordination)
- Brain Client (data validation)
- Database (task tracking)

### 4. General Chat (`/chat/route.ts`)
**Purpose:** Standard LLM conversation

**Features:**
- Multi-turn conversation
- No project context (clean slate)
- Conversation history
- Follow-up suggestions
- Code assistance support

**Key Integrations:**
- LLM Client (chat completion)
- Database (conversation storage)

### 5. Streaming (`/stream/route.ts`)
**Purpose:** Real-time updates via Server-Sent Events

**Features:**
- Task progress streaming
- Event-driven architecture
- Connection management
- Automatic cleanup
- Timeout protection

### 6. History (`/history/route.ts`)
**Purpose:** Conversation management

**Features:**
- List conversations
- Get specific conversation
- Save messages
- Archive conversations
- Pagination support

## 🔐 Authentication

All endpoints require PayloadCMS authentication:

```typescript
const payload = await getPayloadHMR({ config: configPromise })
const { user } = await payload.auth({ req: req as any })

if (!user) {
  return NextResponse.json(
    { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
    { status: 401 }
  )
}
```

## ✅ Request Validation

All requests use Zod schemas for validation:

```typescript
import { QueryRequestSchema } from '../types'

const validationResult = QueryRequestSchema.safeParse(body)

if (!validationResult.success) {
  return NextResponse.json({
    error: 'Invalid request',
    code: 'VALIDATION_ERROR',
    details: validationResult.error.errors
  }, { status: 400 })
}
```

## 🛠️ Shared Utilities

Located in `/utils/index.ts`:

- `errorResponse()` - Standardized error responses
- `checkRateLimit()` - Rate limiting (in-memory)
- `authenticateRequest()` - User authentication
- `logAPIRequest()` - Request logging
- `logAPIError()` - Error tracking
- `validateRequiredFields()` - Field validation
- `sanitizeInput()` - Input sanitization
- `estimateProcessingTime()` - Time estimation
- `formatUsageStats()` - Stats formatting

## 📊 Response Format

All successful responses follow consistent patterns:

```typescript
// Query Mode
{
  answer: string
  sources: Array<{ id, type, content, score, metadata }>
  relatedNodes: Array<{ id, type, name, relationship, score }>
  confidence: number
  suggestions: string[]
  metadata: { tokensUsed, processingTime, searchTime }
}

// Data Ingestion
{
  status: 'pending_confirmation' | 'confirmed' | 'rejected'
  suggestedData: { entityType, parsed, metadata, relationships }
  validation: { valid, errors, warnings, suggestions }
  duplicates: Array<{ existingId, similarity, suggestion }>
  preview: { category, confidence, requiredFields }
  confirmationRequired: boolean
}

// Task Execution
{
  taskId: string
  status: 'queued' | 'in_progress' | 'completed' | 'failed'
  departments: Array<{ department, status, relevance, outputs, quality }>
  progress: { current, total, percentage }
  quality: { overall, consistency, completeness }
  recommendation?: 'approve' | 'modify' | 'reject'
}

// Chat
{
  message: string
  conversationId: string
  model: string
  usage: { promptTokens, completionTokens, totalTokens }
  suggestions?: string[]
}
```

## ❌ Error Format

All errors follow this structure:

```typescript
{
  error: string          // Human-readable message
  code: string          // Machine-readable code
  details?: any        // Additional context
  statusCode: number   // HTTP status code
}
```

**Common Error Codes:**
- `AUTH_REQUIRED` (401)
- `FORBIDDEN` (403)
- `VALIDATION_ERROR` (400)
- `NOT_FOUND` (404)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)

## 🔗 Dependencies

### Internal Services
- **Brain Client** (`@/lib/brain/client`) - Knowledge graph operations
- **LLM Client** (`@/lib/llm/client`) - Language model operations
- **Data Prep Agent** (`@/lib/agents/data-preparation/agent`) - Data enrichment
- **Orchestrator** (`@/lib/agents/orchestrator`) - Multi-agent coordination

### External Libraries
- `zod` - Runtime validation
- `axios` - HTTP client (via Brain/LLM clients)
- `@payloadcms/next` - Authentication and database

## 🧪 Testing

### Manual Testing with curl

```bash
# Query Mode
curl -X POST http://localhost:3000/api/orchestrator/query \
  -H "Content-Type: application/json" \
  -H "Cookie: payload-token=YOUR_TOKEN" \
  -d '{"query":"What are Aladdin'\''s traits?","projectId":"proj_123"}'

# Data Ingestion
curl -X POST http://localhost:3000/api/orchestrator/data \
  -H "Content-Type: application/json" \
  -H "Cookie: payload-token=YOUR_TOKEN" \
  -d '{"data":"Jasmine is a princess...","projectId":"proj_123","entityType":"character"}'

# Task Execution
curl -X POST http://localhost:3000/api/orchestrator/task \
  -H "Content-Type: application/json" \
  -H "Cookie: payload-token=YOUR_TOKEN" \
  -d '{"task":"Create character profile","projectId":"proj_123"}'

# General Chat
curl -X POST http://localhost:3000/api/orchestrator/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: payload-token=YOUR_TOKEN" \
  -d '{"message":"Explain hero'\''s journey"}'
```

### Integration Tests

See `/tests/api/orchestrator/` for test suite.

## 📈 Performance

### Caching
- Data Preparation Agent uses Redis caching
- Cache TTL: 1 hour for documents, 5 minutes for context
- Cache keys: `prep:${projectId}:${entityType}:${id}`

### Async Processing
- Task execution is fully async
- Background processing with orchestrator
- Status updates via polling or WebSocket

### Rate Limiting
- 100 requests per minute per user (default)
- In-memory implementation (should migrate to Redis)
- Automatic cleanup of expired limits

## 🔧 Configuration

### Environment Variables Required

```env
# Brain Service
BRAIN_API_URL=https://brain.ft.tc
BRAIN_API_KEY=<key>

# LLM (OpenRouter)
OPENROUTER_API_KEY=<key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5

# Redis
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### PayloadCMS Collections Required

**conversations:**
```typescript
{
  name: string
  project?: string
  user: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    mode: 'query' | 'data' | 'task' | 'chat'
    metadata?: object
    createdAt: Date
  }>
  status: 'active' | 'archived'
  createdAt: Date
  updatedAt: Date
}
```

**agent-tasks:**
```typescript
{
  project: string
  user: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'queued' | 'in_progress' | 'completed' | 'failed'
  departments: string[]
  departmentResults?: array
  progress?: { current, total, percentage }
  quality?: { overall, consistency, completeness }
  recommendation?: 'approve' | 'modify' | 'reject'
  results?: array
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}
```

## 📚 Documentation

- **Full API Reference:** `/docs/api/orchestrator-api.md`
- **Quick Start Guide:** `/docs/api/orchestrator-quick-start.md`
- **Implementation Summary:** `/docs/api/orchestrator-implementation-summary.md`

## 🚀 Development

### Adding a New Endpoint

1. Create new route file: `new-feature/route.ts`
2. Add types to `types.ts`
3. Implement handler with validation
4. Add authentication check
5. Add error handling
6. Update documentation
7. Write tests

### Modifying Existing Endpoints

1. Update handler logic
2. Update types if needed
3. Test thoroughly
4. Update documentation
5. Check for breaking changes

## 🐛 Debugging

### Enable Verbose Logging

```typescript
console.log('[API Name] Processing:', { /* context */ })
console.log('[API Name] Result:', result)
console.error('[API Name] Error:', error)
```

### Check Service Health

```bash
# Brain service
curl https://brain.ft.tc/api/v1/health

# OpenRouter
curl https://openrouter.ai/api/v1/models
```

### Common Issues

**"Unauthorized" Error:**
- Check if user is authenticated
- Verify session cookie is sent
- Check PayloadCMS auth configuration

**"Brain API error":**
- Verify BRAIN_API_KEY is set
- Check Brain service is running
- Test connection with health endpoint

**"LLM request failed":**
- Verify OPENROUTER_API_KEY is set
- Check API quota/credits
- Try backup model if configured

## 📞 Support

**For Issues:**
- Check logs in console
- Review error response details
- Test individual service endpoints
- Review documentation

**For Questions:**
- See full API docs
- Check implementation examples
- Review integration tests

---

**Version:** 1.0.0
**Last Updated:** 2025-10-01
**Status:** ✅ Production Ready
