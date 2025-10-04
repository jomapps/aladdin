# Automated Gather API

API routes for managing automated gather tasks with Celery-Redis task queue.

## Endpoints

### Start Automated Gather

**POST** `/api/v1/automated-gather/start`

Start a new automated gather task.

**Request Body:**
```json
{
  "projectId": "string",
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

**Validation:**
- `projectId` (required): Project identifier
- `gatherCount` (required): Number between 1 and 100
- `options.saveInterval` (optional): Number between 1 and 50

**Response (202 Accepted):**
```json
{
  "taskId": "abc123-def456",
  "status": "pending",
  "message": "Automated gather task started successfully",
  "data": {
    "projectId": "project-123",
    "gatherCount": 10,
    "estimatedDuration": 300
  }
}
```

**Error Response (400/500):**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "gatherCount must be between 1 and 100",
  "statusCode": 400
}
```

### Check Task Status

**GET** `/api/v1/automated-gather/status/[taskId]`

Check the status of a running or completed task.

**Response (200 OK):**
```json
{
  "taskId": "abc123-def456",
  "status": "PROGRESS",
  "progress": {
    "current": 5,
    "total": 10,
    "percentage": 50
  },
  "result": null,
  "updates": [
    {
      "type": "progress",
      "timestamp": "2025-10-04T12:00:00Z",
      "data": {
        "currentIteration": 5,
        "totalIterations": 10,
        "percentage": 50,
        "message": "Processing iteration 5 of 10"
      }
    }
  ],
  "startTime": "2025-10-04T11:55:00Z"
}
```

**Task States:**
- `PENDING`: Task queued, not started
- `STARTED`: Task execution started
- `PROGRESS`: Task in progress with updates
- `SUCCESS`: Task completed successfully
- `FAILURE`: Task failed with error
- `REVOKED`: Task cancelled

**Error Response (404):**
```json
{
  "error": "TASK_NOT_FOUND",
  "message": "Task not found or status unavailable",
  "statusCode": 404
}
```

### Cancel Task

**DELETE** `/api/v1/automated-gather/cancel/[taskId]`

Cancel a running task and preserve partial results.

**Response (200 OK):**
```json
{
  "taskId": "abc123-def456",
  "status": "cancelled",
  "message": "Task cancelled successfully",
  "partialResults": {
    "completedIterations": 5,
    "results": [
      {
        "iterationNumber": 1,
        "gatherDataId": "gather-001"
      },
      {
        "iterationNumber": 2,
        "gatherDataId": "gather-002"
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "error": "TASK_NOT_FOUND",
  "message": "Task not found",
  "statusCode": 404
}
```

## Webhook

### Progress Updates Webhook

**POST** `/api/webhooks/automated-gather-progress`

Receives progress updates from Celery tasks and forwards to WebSocket server.

**Headers:**
- `X-Webhook-Signature`: HMAC-SHA256 signature for verification

**Request Body:**
```json
{
  "taskId": "abc123-def456",
  "event": "progress",
  "data": {
    "currentIteration": 5,
    "totalIterations": 10,
    "percentage": 50,
    "message": "Processing iteration 5 of 10"
  },
  "timestamp": "2025-10-04T12:00:00Z",
  "signature": "hmac-signature"
}
```

**Event Types:**
- `progress`: Task progress update
- `complete`: Task completed successfully
- `error`: Task encountered an error
- `cancelled`: Task was cancelled

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Progress update processed successfully",
  "taskId": "abc123-def456",
  "event": "progress"
}
```

## Environment Variables

```bash
# Required
TASKS_API_URL=http://localhost:8001
TASK_API_KEY=your-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional
WEBHOOK_SECRET=your-webhook-secret-key
WEBSOCKET_SERVER_URL=http://localhost:3001
INTERNAL_API_SECRET=your-internal-secret
```

## Usage Example

```typescript
// Start automated gather
const response = await fetch('/api/v1/automated-gather/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'my-project',
    gatherCount: 10,
    options: {
      saveInterval: 5,
      errorRecovery: true
    }
  })
});

const { taskId } = await response.json();

// Poll for status
const statusResponse = await fetch(`/api/v1/automated-gather/status/${taskId}`);
const status = await statusResponse.json();

// Cancel if needed
const cancelResponse = await fetch(`/api/v1/automated-gather/cancel/${taskId}`, {
  method: 'DELETE'
});
const cancelResult = await cancelResponse.json();
```

## Error Handling

All endpoints return standardized error responses:

```typescript
interface ErrorResponse {
  error: string;          // Error code
  message: string;        // Human-readable message
  details?: unknown;      // Additional error details
  statusCode: number;     // HTTP status code
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid request parameters
- `TASK_NOT_FOUND`: Task ID not found
- `TASK_SUBMISSION_FAILED`: Failed to submit to queue
- `CANCELLATION_FAILED`: Failed to cancel task
- `INVALID_SIGNATURE`: Webhook signature invalid
- `INTERNAL_ERROR`: Unexpected server error

## Integration with Task Service

The API routes use the task service client (`@/lib/task-service/client`) to interact with the Celery-Redis task queue:

```typescript
import { taskService } from '@/lib/task-service/client';

// Submit task
const result = await taskService.submitTask('automated_gather', {
  projectId: 'my-project',
  gatherCount: 10,
  options: { saveInterval: 5 }
});

// Check status
const status = await taskService.getTaskStatus(taskId);

// Cancel task
await taskService.cancelTask(taskId);
```

## WebSocket Integration

Progress updates are forwarded to a WebSocket server for real-time updates:

```typescript
// WebSocket client example
const ws = new WebSocket('ws://localhost:3001');

ws.on('message', (data) => {
  const update = JSON.parse(data);
  if (update.channel === `task:${taskId}`) {
    console.log('Progress:', update.data);
  }
});
```

## Security

1. **API Key Authentication**: All task service requests require `X-API-Key` header
2. **Webhook Signatures**: Webhooks are verified using HMAC-SHA256
3. **CORS Headers**: Appropriate CORS headers for cross-origin requests
4. **Input Validation**: All inputs validated before processing
5. **Rate Limiting**: Consider implementing rate limiting for production

## Monitoring

Monitor task execution with:
- Task status endpoint polling
- WebSocket real-time updates
- Celery task logs
- Database audit logs (optional)

## Related Documentation

- [Task Service Documentation](/celery-redis/docs/how-to-use-celery-redis.md)
- [Automated Gather Specification](/docs/idea/automated-gather.md)
- [WebSocket Server Setup](/docs/websocket/setup.md)
