# Task Service Integration Guide (tasks.ft.tc)

**Service**: AI Movie Platform - Task Service  
**Technology**: FastAPI + Celery + Redis  
**Repository**: `celery-redis/` folder  
**Status**: ✅ **OPERATIONAL**

---

## Overview

The Task Service (`tasks.ft.tc`) is a standalone GPU-intensive task processing service that handles all computationally expensive operations for the Aladdin AI movie production platform.

### **Architecture**
```
Aladdin Next.js App (Port 3010)
    ↓ HTTP REST API
Task Service API (Port 8001)
    ↓ Task Queue
Celery Workers + Redis (Port 6379)
    ↓ GPU Processing
Results → Cloudflare R2 → Webhook Callback
```

---

## Service Endpoints

### **Base URLs**
- **Development**: `http://localhost:8001`
- **Staging**: `https://tasks.ngrok.pro`
- **Production**: `https://tasks.ft.tc`

### **Authentication**
All requests require the `X-API-Key` header:
```bash
X-API-Key: your_celery_api_key_here
```

---

## Core API Endpoints

### 1. Submit Task
**POST** `/api/v1/tasks/submit`

Submit a new task for background processing.

```typescript
// Request
{
  "project_id": "detective_series_001",
  "task_type": "generate_video",
  "task_data": {
    "storyboard_images": ["url1", "url2"],
    "scene_description": "Detective enters the dark alley",
    "camera_angle": "wide_shot",
    "lighting": "noir_dramatic",
    "duration": 7
  },
  "priority": 1,
  "callback_url": "https://auto-movie.ft.tc/api/webhooks/task-complete",
  "metadata": {
    "user_id": "user123",
    "agent_id": "video_generation_agent",
    "session_id": "session456"
  }
}

// Response
{
  "task_id": "abc123-def456-ghi789",
  "status": "queued",
  "project_id": "detective_series_001",
  "estimated_duration": 300,
  "queue_position": 5,
  "created_at": "2025-01-15T10:30:00Z"
}
```

### 2. Get Task Status
**GET** `/api/v1/tasks/{task_id}/status`

```typescript
// Response
{
  "task_id": "abc123-def456-ghi789",
  "project_id": "detective_series_001",
  "status": "processing", // queued | processing | completed | failed | cancelled
  "progress": 0.75,
  "current_step": "rendering_video",
  "result": {
    "media_url": "https://media.ft.tc/project_001/video_abc123.mp4",
    "payload_media_id": "64f1b2c3a8d9e0f1",
    "metadata": {
      "duration": 7.0,
      "resolution": "1920x1080",
      "file_size": 15728640
    }
  },
  "error": null,
  "started_at": "2025-01-15T10:30:15Z",
  "completed_at": "2025-01-15T10:35:30Z",
  "processing_time": 315
}
```

### 3. Health Check
**GET** `/api/v1/health`

```typescript
// Response
{
  "status": "healthy",
  "redis_status": "connected",
  "worker_count": 4,
  "queue_sizes": {
    "gpu_heavy": 3,
    "gpu_medium": 1,
    "cpu_intensive": 0
  },
  "system_load": {
    "cpu_percent": 45.2,
    "memory_percent": 62.8,
    "gpu_utilization": [85.5, 72.1, 0.0, 0.0]
  },
  "uptime": 86400
}
```

---

## Task Types

### Available Task Types
- `generate_video` - Create 7-second video segments
- `generate_image` - Create character designs, concept art
- `generate_character_voice` - Synthesize character dialogue
- `process_audio` - Audio mixing and enhancement
- `render_animation` - Character animation rendering
- `test_prompt` - Test agent prompts with immediate results

### Task Queue Routing
```python
# Celery task routing configuration
task_routes = {
    'app.tasks.video_tasks.*': {'queue': 'gpu_heavy'},
    'app.tasks.image_tasks.*': {'queue': 'gpu_medium'},
    'app.tasks.audio_tasks.*': {'queue': 'cpu_intensive'},
}
```

---

## Integration with Aladdin Agents

### Agent → Task Service Pattern

When an Aladdin agent needs GPU-intensive processing:

```typescript
// In agent custom tool
async function generateVideo(sceneData: any) {
  // 1. Submit task to Task Service
  const task = await fetch('https://tasks.ft.tc/api/v1/tasks/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.CELERY_TASK_API_KEY
    },
    body: JSON.stringify({
      project_id: sceneData.project_id,
      task_type: 'generate_video',
      task_data: sceneData,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/task-complete`,
      metadata: {
        agent_id: 'video-generator',
        department: 'video'
      }
    })
  })
  
  const { task_id } = await task.json()
  
  // 2. Poll for completion or wait for webhook
  return { task_id, status: 'processing' }
}
```

### Webhook Handler

```typescript
// pages/api/webhooks/task-complete.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { task_id, status, result, project_id } = req.body
  
  if (status === 'completed') {
    // Update project with completed media
    await updateProjectMedia(project_id, {
      task_id,
      media_url: result.media_url,
      payload_media_id: result.payload_media_id
    })
    
    // Notify agent via event system
    await notifyAgent(project_id, {
      type: 'task_completed',
      task_id,
      result
    })
  }
  
  res.status(200).json({ received: true })
}
```

---

## Technology Stack

### **Task Service Components**
```
celery-redis/
├── app/
│   ├── main.py              # FastAPI application
│   ├── celery_app.py        # Celery configuration
│   ├── api/                 # REST API endpoints
│   │   ├── tasks.py         # Task management endpoints
│   │   ├── projects.py      # Project task queries
│   │   └── workers.py       # Worker status endpoints
│   ├── tasks/               # Celery task definitions
│   │   ├── video_tasks.py   # Video generation tasks
│   │   ├── image_tasks.py   # Image generation tasks
│   │   └── audio_tasks.py   # Audio processing tasks
│   ├── clients/             # External service clients
│   ├── models/              # Pydantic models
│   └── config/              # Configuration
├── docker-compose.yml       # Service orchestration
├── Dockerfile               # Container definition
└── requirements.txt         # Python dependencies
```

### **Dependencies**
- **FastAPI** (0.104.1+) - REST API framework
- **Celery** (5.3.4+) - Distributed task queue
- **Redis** (5.0.1+) - Message broker and result backend
- **Uvicorn** - ASGI server
- **Structlog** - Structured logging
- **Prometheus Client** - Metrics export

---

## Performance Expectations

| Task Type | Typical Duration | Max Duration |
|-----------|-----------------|--------------|
| Image Generation | 30-90 seconds | 5 minutes |
| Video Generation | 2-8 minutes | 15 minutes |
| Voice Generation | 10-30 seconds | 2 minutes |
| Prompt Testing | 5-15 seconds | 1 minute |

---

## Environment Configuration

### Required Environment Variables
```bash
# Service Configuration
API_HOST=0.0.0.0
API_PORT=8001
ENVIRONMENT=production

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Task Configuration
TASK_TIMEOUT=3600
WORKER_CONCURRENCY=2

# Integration
AUTO_MOVIE_APP_URL=https://auto-movie.ft.tc
PAYLOAD_API_URL=https://auto-movie.ft.tc/api
WEBHOOK_BASE_URL=https://auto-movie.ft.tc/api/webhooks

# Authentication
CELERY_TASK_API_KEY=your_api_key_here

# Media Storage
R2_PUBLIC_URL=https://media.ft.tc
```

---

## Related Documentation

- **Usage Guide**: `celery-redis/docs/how-to-use-celery-redis.md`
- **System Integration**: `celery-redis/docs/system-integration.md`
- **Implementation Report**: `celery-redis/PHASE4_IMPLEMENTATION_REPORT.md`

---

## Summary

The Task Service (tasks.ft.tc) is a production-ready, GPU-optimized task processing service that:
- ✅ Handles all computationally expensive operations
- ✅ Provides REST API for task submission and monitoring
- ✅ Uses Celery + Redis for distributed task processing
- ✅ Supports webhook callbacks for async notifications
- ✅ Integrates seamlessly with Aladdin agents via custom tools
- ✅ Provides health monitoring and metrics

**Integration Pattern**: Aladdin agents submit tasks → Task Service processes → Webhook callback → Agent continues workflow

