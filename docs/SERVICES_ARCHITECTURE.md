# Aladdin Services Architecture

**Last Updated**: January 2025  
**Status**: ✅ **OPERATIONAL**

---

## Overview

The Aladdin AI movie production platform consists of **2 operational external services** that work together with the main Next.js application to provide a complete AI-powered movie production system.

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Aladdin Next.js App (Port 3010)                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │  @codebuff/sdk Agent System (37 agents)             ││
│  │  ├── Master Orchestrator                            ││
│  │  ├── 7 Department Heads                             ││
│  │  └── 29 Specialist Agents                           ││
│  └─────────────────────────────────────────────────────┘│
│                          │                              │
│  ┌─────────────────────────────────────────────────────┐│
│  │  PayloadCMS + MongoDB                               ││
│  │  • Projects  • Episodes  • Characters  • Scenes     ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────┬───────────────────┬───────────────────┘
                  │                   │
        ┌─────────▼─────────┐ ┌──────▼──────────┐
        │  brain.ft.tc      │ │  tasks.ft.tc    │
        │  (Port 8002)      │ │  (Port 8001)    │
        │                   │ │                 │
        │  Neo4j + Jina AI  │ │  Celery + Redis │
        │  Knowledge Graph  │ │  GPU Processing │
        │  MCP Protocol     │ │  Task Queue     │
        └───────────────────┘ └─────────────────┘
```

---

## Service 1: Brain Service (brain.ft.tc)

### **Purpose**
Knowledge graph validation and semantic search using embeddings.

### **Technology Stack**
- **Neo4j**: Graph database for relationships
- **Jina AI v4**: Embedding generation
- **MCP Protocol**: Model Context Protocol for AI integration
- **Python FastAPI**: REST API server

### **Location**
- Repository: `services/brain/` folder
- Port: 8002
- Production URL: https://brain.ft.tc

### **Key Features**
- ✅ Knowledge graph storage and querying
- ✅ Semantic search via embeddings
- ✅ Relationship validation
- ✅ Context retrieval for agents
- ✅ MCP tool integration

### **Integration with Agents**
Agents use custom tools to query the Brain service:
```typescript
// Agent custom tool
customTools: [
  'query_brain',           // Search knowledge graph
  'validate_consistency',  // Check for contradictions
  'get_project_context',   // Retrieve project knowledge
  'save_to_brain'          // Store validated data
]
```

### **API Endpoints**
- `POST /api/v1/knowledge/query` - Query knowledge graph
- `POST /api/v1/knowledge/store` - Store knowledge
- `GET /api/v1/knowledge/context/{project_id}` - Get project context
- `POST /api/v1/embeddings/generate` - Generate embeddings

### **Documentation**
- Implementation: `services/brain/src/`
- MCP Server: `services/brain/src/mcp_server.py`
- Knowledge Service: `services/brain/src/services/knowledge_service.py`

---

## Service 2: Task Service (tasks.ft.tc)

### **Purpose**
GPU-intensive task processing for video, image, and audio generation.

### **Technology Stack**
- **FastAPI**: REST API server
- **Celery**: Distributed task queue
- **Redis**: Message broker and result backend
- **FAL.ai**: Video and image generation
- **ElevenLabs**: Voice synthesis

### **Location**
- Repository: `celery-redis/` folder
- Port: 8001
- Production URL: https://tasks.ft.tc

### **Key Features**
- ✅ Video generation (7-second segments)
- ✅ Image generation (characters, concept art, environments)
- ✅ Audio processing (voice synthesis, mixing, foley)
- ✅ Async task processing with webhooks
- ✅ Queue management (gpu_heavy, gpu_medium, cpu_intensive)
- ✅ Progress tracking and status monitoring

### **Integration with Agents**
Agents submit tasks for GPU-intensive operations:
```typescript
// Agent submits video generation task
const task = await fetch('https://tasks.ft.tc/api/v1/tasks/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.CELERY_TASK_API_KEY
  },
  body: JSON.stringify({
    project_id: 'my_project',
    task_type: 'generate_video',
    task_data: { /* scene data */ },
    callback_url: 'https://app.ft.tc/api/webhooks/task-complete'
  })
})
```

### **Task Types**
- `generate_video` - 7-second video segments
- `generate_image` - Character designs, concept art
- `generate_character_voice` - Voice synthesis
- `process_audio` - Audio mixing and enhancement
- `render_animation` - Character animation
- `test_prompt` - Agent prompt testing

### **API Endpoints**
- `POST /api/v1/tasks/submit` - Submit new task
- `GET /api/v1/tasks/{task_id}/status` - Get task status
- `GET /api/v1/projects/{project_id}/tasks` - List project tasks
- `DELETE /api/v1/tasks/{task_id}/cancel` - Cancel task
- `POST /api/v1/tasks/{task_id}/retry` - Retry failed task
- `GET /api/v1/health` - Service health check

### **Queue Architecture**
```python
# Celery task routing
task_routes = {
    'app.tasks.video_tasks.*': {'queue': 'gpu_heavy'},
    'app.tasks.image_tasks.*': {'queue': 'gpu_medium'},
    'app.tasks.audio_tasks.*': {'queue': 'cpu_intensive'},
}
```

### **Documentation**
- Usage Guide: `celery-redis/docs/how-to-use-celery-redis.md`
- System Integration: `celery-redis/docs/system-integration.md`
- Integration Guide: `docs/TASK_SERVICE_INTEGRATION.md`

---

## Agent → Service Integration Flow

### **1. Agent Needs Knowledge Context**
```
Agent → query_brain tool → brain.ft.tc
  ↓
Brain returns relevant context
  ↓
Agent uses context for decision making
```

### **2. Agent Needs GPU Processing**
```
Agent → submit task → tasks.ft.tc
  ↓
Task queued in Celery
  ↓
Worker processes task (GPU)
  ↓
Result uploaded to R2
  ↓
Webhook callback to app
  ↓
Agent receives result
```

### **3. Agent Stores Validated Data**
```
Agent generates content
  ↓
Data Preparation Agent enriches
  ↓
Save to PayloadCMS (structured)
  ↓
Save to MongoDB (open collections)
  ↓
Save to brain.ft.tc (knowledge graph)
```

---

## Environment Configuration

### **Development**
```bash
# Brain Service
BRAIN_SERVICE_URL=http://localhost:8002
NEO4J_URI=bolt://localhost:7687
JINA_API_KEY=your_jina_key

# Task Service
TASK_SERVICE_URL=http://localhost:8001
CELERY_TASK_API_KEY=your_api_key
REDIS_URL=redis://localhost:6379/0
```

### **Production**
```bash
# Brain Service
BRAIN_SERVICE_URL=https://brain.ft.tc
NEO4J_URI=bolt://neo4j.ft.tc:7687
JINA_API_KEY=your_jina_key

# Task Service
TASK_SERVICE_URL=https://tasks.ft.tc
CELERY_TASK_API_KEY=your_api_key
REDIS_URL=redis://redis.ft.tc:6379/0
```

---

## Service Comparison

| Feature | brain.ft.tc | tasks.ft.tc |
|---------|-------------|-------------|
| **Purpose** | Knowledge validation | GPU processing |
| **Technology** | Neo4j + Jina AI | Celery + Redis |
| **Protocol** | MCP + REST | REST + Webhooks |
| **Response Time** | < 1 second | 30s - 15 minutes |
| **Use Case** | Context retrieval | Media generation |
| **Integration** | Custom tools | Task submission |
| **Data Storage** | Graph database | Task results → R2 |

---

## Performance Expectations

### **Brain Service**
- Query response: < 1 second
- Embedding generation: < 2 seconds
- Context retrieval: < 500ms
- Concurrent requests: 100+

### **Task Service**
- Image generation: 30-90 seconds
- Video generation: 2-8 minutes
- Voice synthesis: 10-30 seconds
- Prompt testing: 5-15 seconds

---

## Monitoring & Health

### **Health Check Endpoints**
- Brain: `GET https://brain.ft.tc/health`
- Tasks: `GET https://tasks.ft.tc/api/v1/health`

### **Metrics**
Both services expose Prometheus metrics for monitoring:
- Request rates
- Error rates
- Processing times
- Queue sizes (Task Service)
- Graph size (Brain Service)

---

## Summary

**2 Services, Clear Responsibilities:**

1. **brain.ft.tc** - Fast knowledge retrieval and validation
2. **tasks.ft.tc** - Heavy GPU processing and media generation

**Integration Pattern:**
- Agents use custom tools to interact with services
- Brain service provides context synchronously
- Task service processes async with webhooks
- All data flows through PayloadCMS and MongoDB
- Knowledge graph maintains consistency

**No Domain-Specific MCP Services:**
- All agent orchestration happens in Next.js via @codebuff/sdk
- No separate Story MCP, Character MCP, Visual MCP, etc.
- Simple, maintainable architecture

---

## Related Documentation

- **Agent System**: `docs/idea/AI_AGENT_SYSTEM.md`
- **Agent Implementation**: `docs/AGENT_IMPLEMENTATION_COMPLETE.md`
- **Task Service Integration**: `docs/TASK_SERVICE_INTEGRATION.md`
- **Brain Service**: `services/brain/README.md`
- **Specification**: `docs/SPECIFICATION.md`

