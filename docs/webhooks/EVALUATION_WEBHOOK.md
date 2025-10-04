# Evaluation Webhook Implementation

## Overview

The evaluation webhook receives notifications from `tasks.ft.tc` when department evaluations complete, eliminating the need for continuous polling.

## Endpoint

**URL**: `POST /api/webhooks/evaluation-complete`  
**Public URL**: `https://aladdin.ngrok.pro/api/webhooks/evaluation-complete`

## Implementation

### File Location
`src/app/api/webhooks/evaluation-complete/route.ts`

### Features

✅ **Health Check Endpoint** - GET request returns webhook status  
✅ **Webhook Handler** - POST request processes evaluation results  
✅ **Comprehensive Logging** - All webhook events are logged  
✅ **Error Handling** - Graceful handling of missing evaluations and errors  
✅ **Database Updates** - Automatic update of evaluation records  
✅ **Score Calculation** - Recalculates overall project readiness score  

## Webhook Flow

```
┌─────────────────┐
│  tasks.ft.tc    │
│  (Task Service) │
└────────┬────────┘
         │
         │ POST /api/webhooks/evaluation-complete
         │ {
         │   task_id: "uuid",
         │   status: "completed",
         │   result: { ... }
         │ }
         ▼
┌─────────────────────────────────────┐
│  Aladdin Webhook Handler            │
│  /api/webhooks/evaluation-complete  │
└────────┬────────────────────────────┘
         │
         │ 1. Find evaluation by task_id
         ▼
┌─────────────────────────────────────┐
│  PayloadCMS                         │
│  project-readiness collection       │
└────────┬────────────────────────────┘
         │
         │ 2. Update evaluation record
         │    - status: 'completed'
         │    - rating: 85
         │    - summary, issues, suggestions
         ▼
┌─────────────────────────────────────┐
│  Calculate Project Readiness Score  │
│  - Average all department ratings   │
│  - Update all evaluations           │
└────────┬────────────────────────────┘
         │
         │ 3. Return 200 OK
         ▼
┌─────────────────┐
│  tasks.ft.tc    │
│  (Confirmed)    │
└─────────────────┘
```

## Webhook Payload

### Success Payload

```typescript
{
  task_id: string              // UUID of the task
  status: 'completed'          // Task status
  project_id: string           // Project ID
  result: {
    department: string         // Department slug (e.g., "story")
    rating: number            // 0-100 rating score
    evaluation_result: string // "pass" or "fail"
    evaluation_summary: string // AI-generated summary
    issues: string[]          // List of identified issues
    suggestions: string[]     // List of improvement suggestions
    iteration_count: number   // Number of AI iterations
    processing_time: number   // Processing time in seconds
    metadata: {
      model: string          // AI model used
      tokens_used: number    // Token count
    }
  }
  processing_time: number      // Total processing time
  completed_at: string         // ISO timestamp
  metadata: {
    user_id?: string          // User who triggered evaluation
    department_id?: string    // Department ID
  }
}
```

### Failure Payload

```typescript
{
  task_id: string
  status: 'failed'
  project_id: string
  error: string               // Error message
  processing_time: number
  completed_at: string
  metadata: {
    user_id?: string
    department_id?: string
  }
}
```

## Database Updates

### On Success

The webhook updates the `project-readiness` collection:

```typescript
{
  status: 'completed',
  rating: result.rating,
  evaluationResult: result.evaluation_result,
  evaluationSummary: result.evaluation_summary,
  issues: result.issues.map(i => ({ issue: i })),
  suggestions: result.suggestions.map(s => ({ suggestion: s })),
  evaluationDuration: result.processing_time,
  iterationCount: result.iteration_count,
  agentModel: result.metadata?.model || 'unknown',
  lastEvaluatedAt: new Date().toISOString(),
  readinessScore: <calculated_overall_score>
}
```

### On Failure

```typescript
{
  status: 'failed',
  evaluationResult: error_message
}
```

## Logging

All webhook events are logged with the `[Webhook]` prefix:

```
[Webhook] Received evaluation complete notification: { task_id, status, ... }
[Webhook] Found evaluation: { id, projectId, departmentId, ... }
[Webhook] Processing completed evaluation: { rating, department, ... }
[Webhook] Updated evaluation record successfully
[Webhook] Updated project readiness score
```

## Error Handling

### Evaluation Not Found
- **Status**: 200 OK
- **Response**: `{ received: true, warning: 'Evaluation not found' }`
- **Log**: `[Webhook] No evaluation found for task {task_id}`

### Processing Error
- **Status**: 500 Internal Server Error
- **Response**: `{ error: 'Webhook processing failed', message: '...' }`
- **Log**: `[Webhook] Processing error: ...`

### Unknown Status
- **Status**: 200 OK
- **Response**: `{ received: true, warning: 'Unknown status' }`
- **Log**: `[Webhook] Received webhook with unknown status: ...`

## Integration with Task Service

### Task Submission

When submitting an evaluation task, include the callback URL:

```typescript
const response = await fetch('https://tasks.ft.tc/api/v1/tasks/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.TASK_API_KEY
  },
  body: JSON.stringify({
    project_id: projectId,
    task_type: 'evaluate_department',
    task_data: { ... },
    callback_url: 'https://aladdin.ngrok.pro/api/webhooks/evaluation-complete',
    metadata: {
      user_id: userId,
      department_id: departmentId
    }
  })
})
```

### Task Service Configuration

The task service must be configured to send webhooks:
- ✅ Webhook URL is validated (must be HTTP/HTTPS)
- ✅ Webhook is called on task completion (success or failure)
- ✅ Webhook includes full task result and metadata
- ✅ Webhook retries on failure (optional)

## Polling vs Webhooks

### With Webhooks (Current Implementation)
- ✅ **Instant updates** - No delay between completion and UI update
- ✅ **Reduced server load** - No continuous polling
- ✅ **Better UX** - Immediate feedback to users
- ✅ **Fallback polling** - 30-second polling still active as backup

### Polling Behavior
- Polling continues at 30-second intervals
- Webhook provides instant update
- Next poll confirms the update
- Polling can be stopped manually if needed

## Testing

See `docs/testing/webhook-test.md` for:
- Health check tests
- Success notification tests
- Failure notification tests
- Troubleshooting guide

## Security Considerations

### Current Implementation
- ✅ No authentication required (webhook is public)
- ✅ Validates task_id exists in database
- ✅ Validates payload structure
- ✅ Logs all webhook calls

### Future Enhancements
- 🔄 Add webhook signature verification
- 🔄 Add rate limiting
- 🔄 Add IP whitelist for tasks.ft.tc
- 🔄 Add webhook secret validation

## Monitoring

Monitor webhook health by checking:
1. **Logs**: Look for `[Webhook]` prefix in Next.js console
2. **Database**: Check `project-readiness` collection for status updates
3. **UI**: Verify evaluation results appear in project-readiness page
4. **Health endpoint**: `GET /api/webhooks/evaluation-complete`

## Related Files

- `src/app/api/webhooks/evaluation-complete/route.ts` - Webhook handler
- `src/lib/task-service/client.ts` - Task service client (sends callback_url)
- `src/lib/task-service/types.ts` - TypeScript types for webhook payload
- `src/stores/projectReadinessStore.ts` - State management with polling
- `docs/testing/webhook-test.md` - Testing guide

