# Git Submodules Integration Guide

**Version**: 1.0.0  
**Last Updated**: January 28, 2025

---

## Overview

Aladdin uses Git submodules for external services:
1. **Brain Service** - Neo4j knowledge graph with embeddings API
2. **Celery-Redis Task Queue** - Asynchronous task processing

---

## Adding Submodules

### Initial Setup

```bash
# Add Brain repository (mcp-brain-service)
git submodule add https://github.com/[your-org]/mcp-brain-service services/brain

# Add Celery-Redis task queue
git submodule add https://github.com/[your-org]/celery-redis services/task-queue

# Initialize and fetch
git submodule update --init --recursive
```

### Directory Structure

```
aladdin/
├── src/                    # Next.js application
├── services/
│   ├── brain/             # Brain submodule (external repo)
│   │   ├── api/           # Brain API service
│   │   ├── models/        # ML models
│   │   └── Dockerfile
│   └── task-queue/        # Celery-Redis submodule
│       ├── tasks/         # Celery tasks
│       ├── worker.py
│       └── Dockerfile
├── docker-compose.yml
└── .env
```

---

## Brain Service Integration

### Environment Variables

```bash
# .env
# Use live Brain service
BRAIN_API_URL=https://brain.ft.tc
BRAIN_API_KEY=your_brain_api_key

# Or use local Brain service
# BRAIN_API_URL=http://localhost:8000
```

### Client Implementation

```typescript
// src/lib/brain/client.ts
const BRAIN_API_URL = process.env.BRAIN_API_URL!

interface ValidationRequest {
  projectId: string
  type: string
  data: any
}

interface ValidationResponse {
  qualityRating: number
  qualityDimensions: {
    coherence: number
    creativity: number
    technical: number
    consistency: number
    userIntent: number
  }
  brainValidated: boolean
  contradictions: string[]
  suggestions: string[]
  relatedContent: any[]
}

export async function validateContent(
  req: ValidationRequest
): Promise<ValidationResponse> {
  const response = await fetch(`${BRAIN_API_URL}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BRAIN_API_KEY}`,
    },
    body: JSON.stringify(req),
  })
  
  if (!response.ok) {
    throw new Error(`Brain validation failed: ${response.statusText}`)
  }
  
  return response.json()
}

export async function semanticSearch({
  projectId,
  query,
  types,
  limit = 10,
}: {
  projectId: string
  query: string
  types?: string[]
  limit?: number
}) {
  const response = await fetch(`${BRAIN_API_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BRAIN_API_KEY}`,
    },
    body: JSON.stringify({ projectId, query, types, limit }),
  })
  
  return response.json()
}
```

---

## Celery-Redis Integration

### Environment Variables

```bash
# .env
# Use live Celery-Redis task queue
TASKS_API_URL=https://tasks.ft.tc

# Or use local Redis
# REDIS_URL=redis://localhost:6379
# CELERY_BROKER_URL=redis://localhost:6379/0
# CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

### Task Client Implementation

```typescript
// src/lib/tasks/client.ts
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.REDIS_URL,
})

interface CeleryTask {
  task: string
  args: any[]
  kwargs?: Record<string, any>
  id?: string
}

export async function enqueueTask(task: CeleryTask) {
  await redis.connect()
  
  const taskId = task.id || `task-${Date.now()}`
  
  await redis.lpush(
    'celery',
    JSON.stringify({
      ...task,
      id: taskId,
    })
  )
  
  await redis.disconnect()
  
  return taskId
}

export async function getTaskResult(taskId: string) {
  await redis.connect()
  const result = await redis.get(`celery-task-meta-${taskId}`)
  await redis.disconnect()
  
  return result ? JSON.parse(result) : null
}

// Enqueue Brain validation task
export async function enqueueBrainValidation(data: any) {
  return enqueueTask({
    task: 'brain.validate',
    args: [data],
  })
}

// Enqueue image generation task
export async function enqueueImageGeneration(data: any) {
  return enqueueTask({
    task: 'media.generate_image',
    args: [data],
  })
}
```

---

## Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Main Next.js application
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
      - brain
      - redis
    environment:
      - DATABASE_URI=mongodb://mongodb:27017/aladdin
      - DATABASE_URI_OPEN=mongodb://mongodb:27017
      - BRAIN_API_URL=http://brain:8000
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules

  # Brain service (from submodule)
  brain:
    build: ./services/brain
    ports:
      - "8000:8000"
    depends_on:
      - neo4j
    environment:
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=password
      - OPENAI_API_KEY=${OPENAI_API_KEY}

  # Celery worker (from submodule)
  celery-worker:
    build: ./services/task-queue
    depends_on:
      - redis
      - brain
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
      - BRAIN_API_URL=http://brain:8000
    command: celery -A tasks worker --loglevel=info

  # Redis for Celery
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # MongoDB
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  # Neo4j for Brain
  neo4j:
    image: neo4j:5
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/password
    volumes:
      - neo4j_data:/data

volumes:
  mongodb_data:
  neo4j_data:
  redis_data:
```

---

## Working with Submodules

### Cloning Project with Submodules

```bash
# Clone with submodules
git clone --recursive <aladdin-repo-url>

# Or clone first, then init submodules
git clone <aladdin-repo-url>
cd aladdin
git submodule update --init --recursive
```

### Updating Submodules

```bash
# Update to latest from submodule repos
git submodule update --remote

# Commit the updated submodule references
git add services/brain services/task-queue
git commit -m "Update submodules"
```

### Making Changes to Submodules

```bash
# Navigate to submodule
cd services/brain

# Make changes and commit
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add feature"
git push origin feature/new-feature

# Return to main repo and update reference
cd ../..
git add services/brain
git commit -m "Update brain submodule"
```

---

## Development Workflow

### Starting Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
curl http://localhost:8000/health  # Brain
redis-cli ping                      # Redis
```

### Testing Integration

```bash
# Test Brain validation
curl -X POST http://localhost:8000/validate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test",
    "type": "character",
    "data": {"name": "Test"}
  }'

# Test Celery task
redis-cli lpush celery '{
  "task": "brain.validate",
  "args": [{"test": "data"}]
}'
```

---

## Troubleshooting

### Submodule Not Initialized

```bash
git submodule update --init --recursive
```

### Brain Service Not Responding

```bash
# Check Brain logs
docker-compose logs brain

# Restart Brain service
docker-compose restart brain
```

### Celery Tasks Not Processing

```bash
# Check worker logs
docker-compose logs celery-worker

# Check Redis connection
redis-cli ping

# View queued tasks
redis-cli llen celery
```

---

**Status**: Submodules Integration Guide Complete ✓