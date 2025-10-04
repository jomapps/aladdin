# Automated Gather - External Services Integration

**Status**: ✅ Frontend Complete | ⚠️ Backend Task Needs Implementation at tasks.ft.tc

---

## Architecture Overview

The automated gather feature uses **external microservices** for execution:

```
┌─────────────────┐
│   Next.js App   │
│  (Frontend UI)  │
└────────┬────────┘
         │
         │ HTTP POST /api/v1/automated-gather/start
         ↓
┌─────────────────────────────────────────────┐
│         Next.js API Routes                   │
│  /api/v1/automated-gather/start              │
│  /api/v1/automated-gather/status/[taskId]    │
│  /api/v1/automated-gather/cancel/[taskId]    │
└────────┬────────────────────────────────────┘
         │
         │ taskService.submitTask('automated_gather', ...)
         ↓
┌─────────────────────────────────────────────┐
│         tasks.ft.tc (External Service)       │
│  POST /api/v1/tasks/submit                   │
│  - Task Type: 'automated_gather_creation'    │
│  - Queue: cpu_intensive                      │
│  - Timeout: 10 minutes                       │
│  - Webhook callback for progress             │
└────────┬────────────────────────────────────┘
         │
         │ Task execution needs implementation
         ↓
┌─────────────────────────────────────────────┐
│      brain.ft.tc (External Service)          │
│  - POST /api/v1/nodes/batch                  │
│  - POST /api/v1/search/duplicates            │
│  - GET /api/v1/context/department            │
│  - POST /api/v1/analyze/coverage             │
└──────────────────────────────────────────────┘
```

---

## ✅ What's Already Implemented (Frontend)

### 1. API Routes (`/src/app/api/v1/automated-gather/`)
- ✅ **start/route.ts** - Submits task to tasks.ft.tc
- ✅ **status/[taskId]/route.ts** - Checks task status
- ✅ **cancel/[taskId]/route.ts** - Cancels running task
- ✅ **types.ts** - TypeScript interfaces

### 2. UI Components (`/src/components/automated-gather/`)
- ✅ **AutomatedGatherButton.tsx** - Trigger button
- ✅ **ProgressModal.tsx** - Real-time progress display
- ✅ **StatusIndicator.tsx** - Department progress
- ✅ **DuplicationDisplay.tsx** - "Weeding duplicates" visual

### 3. State Management
- ✅ **stores/automatedGatherStore.ts** - Zustand store
- ✅ **hooks/automated-gather/** - React hooks
  - useAutomatedGather.ts
  - useGatherProgress.ts
  - useGatherWebSocket.ts

### 4. Integration Points
- ✅ **project-readiness page** - Button integrated
- ✅ **gather page** - Button integrated
- ✅ **Database clients** - Updated for automation fields
- ✅ **WebSocket server** - Configured for progress events

---

## ⚠️ What Needs Implementation (Backend at tasks.ft.tc)

The **Celery task implementation** needs to be added to **tasks.ft.tc**:

### Task Type: `automated_gather_creation`

**Location**: `tasks.ft.tc/app/tasks/automated_gather_tasks.py` (or equivalent)

**Queue**: `cpu_intensive`

**Timeout**: 600 seconds (10 minutes)

**Task Data Schema**:
```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "gatherCount": 10,
  "options": {
    "saveInterval": 5,
    "errorRecovery": true,
    "notificationPreferences": {
      "onComplete": true,
      "onError": true,
      "onProgress": false
    }
  }
}
```

### Required Implementation Steps

1. **Dynamic Department Query**
   ```python
   # Query departments with gatherCheck=true, sorted by codeDepNumber
   departments = query_departments_for_automation(project_id)
   ```

2. **Sequential Processing**
   ```python
   for dept in departments:
       # Use department-specific model
       model = dept.get('defaultModel', 'anthropic/claude-sonnet-4.5')
       threshold = dept.get('minQualityThreshold', 80)

       # Generate content using @codebuff/sdk
       new_items = generate_content(dept, model)

       # Check duplicates via brain.ft.tc
       duplicates = brain_client.search_duplicates(content, project_id, 0.90)

       # Save to MongoDB
       save_items(project_id, deduplicated_items)

       # Index in Brain
       brain_client.batch_create_nodes(items)

       # Check quality
       quality = brain_client.analyze_coverage(project_id, dept['slug'], items)

       # Auto-trigger evaluation
       trigger_evaluation(project_id, dept['codeDepNumber'])
   ```

3. **WebSocket Progress Events**
   ```python
   # Send progress via Redis Pub/Sub or HTTP webhook
   send_progress({
       'type': 'department_started',
       'department': dept['slug'],
       'departmentName': dept['name'],
       'threshold': threshold
   })

   send_progress({
       'type': 'deduplicating',
       'department': dept['slug']
   })

   send_progress({
       'type': 'iteration_complete',
       'department': dept['slug'],
       'iteration': iteration,
       'qualityScore': quality_score,
       'itemsCreated': len(new_items)
   })
   ```

4. **Webhook Callback**
   ```python
   # On completion, POST to callback URL
   callback_url = task_data.get('callback_url')
   if callback_url:
       requests.post(callback_url, json={
           'task_id': task_id,
           'status': 'completed',
           'result': {
               'iterations': total_iterations,
               'departmentsProcessed': len(departments),
               'itemsCreated': total_items
           }
       })
   ```

---

## External Service APIs

### tasks.ft.tc

**Base URL**: https://tasks.ft.tc

**Submit Task**:
```bash
POST /api/v1/tasks/submit
{
  "project_id": "507f1f77bcf86cd799439011",
  "task_type": "automated_gather_creation",
  "task_data": { ... },
  "priority": 1,
  "callback_url": "https://aladdin.ngrok.pro/api/webhooks/automated-gather-progress"
}
```

**Get Status**:
```bash
GET /api/v1/tasks/{task_id}/status
```

**Cancel Task**:
```bash
DELETE /api/v1/tasks/{task_id}
```

### brain.ft.tc

**Base URL**: https://brain.ft.tc

**Batch Create Nodes**:
```bash
POST /api/v1/nodes/batch
Authorization: Bearer {API_KEY}
{
  "nodes": [
    {
      "type": "GatherItem",
      "content": "...",
      "projectId": "507f1f77bcf86cd799439011",
      "properties": { ... }
    }
  ]
}
```

**Search Duplicates**:
```bash
POST /api/v1/search/duplicates
Authorization: Bearer {API_KEY}
{
  "content": "...",
  "projectId": "507f1f77bcf86cd799439011",
  "threshold": 0.90
}
```

**Get Department Context**:
```bash
GET /api/v1/context/department?projectId=...&department=character&previousDepartments=story
Authorization: Bearer {API_KEY}
```

**Analyze Coverage**:
```bash
POST /api/v1/analyze/coverage
Authorization: Bearer {API_KEY}
{
  "projectId": "507f1f77bcf86cd799439011",
  "department": "story",
  "gatherItems": [...]
}
```

---

## Environment Variables Required

### Next.js App (.env.local)
```bash
# Task Service
TASKS_API_URL=https://tasks.ft.tc
TASK_API_KEY=your-api-key

# Brain Service
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=your-brain-api-key

# App URL for webhooks
NEXT_PUBLIC_APP_URL=https://aladdin.ngrok.pro
```

### tasks.ft.tc (needs these to call brain.ft.tc)
```bash
# Brain Service
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_API_KEY=your-brain-api-key

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/aladdin

# OpenRouter (for @codebuff/sdk)
OPENROUTER_API_KEY=your-openrouter-key
```

---

## Data Flow

1. **User clicks "Automate Gather" button**
   - AutomatedGatherButton.tsx calls `/api/v1/automated-gather/start`

2. **Next.js API Route**
   - Validates request
   - Submits to tasks.ft.tc via `taskService.submitTask('automated_gather', ...)`
   - Returns task ID to frontend

3. **tasks.ft.tc (needs implementation)**
   - Picks up task from `cpu_intensive` queue
   - Queries departments dynamically
   - For each department:
     - Generates content via @codebuff/sdk
     - Checks duplicates via brain.ft.tc
     - Saves to MongoDB
     - Indexes in brain.ft.tc
     - Analyzes quality
     - Sends progress events
   - Calls webhook on completion

4. **Webhook Handler**
   - `/api/webhooks/automated-gather-progress` receives updates
   - Broadcasts via WebSocket to frontend

5. **Frontend UI**
   - ProgressModal shows real-time updates
   - Displays department progress, quality scores, etc.

---

## Next Steps

1. **Coordinate with tasks.ft.tc team** to implement the `automated_gather_creation` task
2. **Provide task specification** from `docs/idea/automated-gather.md`
3. **Test integration** once task is deployed
4. **Monitor** task execution and webhook delivery

---

## Reference Documents

- **Task Service API**: `/docs/celery-redis/how-to-use-celery-redis.md`
- **Brain Service API**: `/docs/mcp-brain-service/how-to-use.md`
- **Feature Specification**: `/docs/idea/automated-gather.md`
- **Frontend Implementation**: Complete and ready
- **Task Requirements**: `/docs/features/need-task-queue-requirements.md`
- **Brain Requirements**: `/docs/features/need-brain-service-api-requirements.md`

---

**Status Summary**:
- ✅ Frontend: Complete
- ✅ API Routes: Complete
- ✅ UI Components: Complete
- ✅ State Management: Complete
- ⚠️ Backend Task: Needs implementation at tasks.ft.tc
- ✅ External Services: brain.ft.tc ready with all 4 endpoints
