# Global Error System

A comprehensive error management system for tracking, displaying, and managing errors across the entire application.

## Features

- **Persistent Errors**: Errors persist across page navigation until dismissed
- **Priority Levels**: Critical, Error, Warning, Info
- **Auto-Dismiss**: Configurable auto-dismiss for low-priority errors
- **User Dismissal**: Manual dismissal with tracking
- **Error Categories**: System, Webhook, Generation, Processing, etc.
- **Statistics**: Track error patterns and frequencies

## Usage

### Adding Errors

```typescript
import { addGlobalError } from '@/lib/errors/globalErrors'

// Add a standard error
await addGlobalError({
  type: 'generation',
  severity: 'error',
  message: 'Video generation failed for scene 001',
  context: { sceneId: '123', taskId: 'task_xyz' },
  dismissible: true,
})

// Add with auto-dismiss
await addGlobalError({
  type: 'success',
  severity: 'info',
  message: 'Scene processed successfully',
  dismissible: true,
  autoDismissMs: 5000, // Auto-dismiss after 5 seconds
})
```

### Helper Functions

```typescript
import {
  addSuccessMessage,
  addWarning,
  addCriticalError,
} from '@/lib/errors/globalErrors'

// Success message (auto-dismisses after 5s)
await addSuccessMessage('Operation completed!', { userId: '123' })

// Warning
await addWarning('Low disk space detected', { availableSpace: '10GB' })

// Critical error (not dismissible)
await addCriticalError('Database connection lost', { database: 'main' })
```

### Retrieving Errors

```typescript
import { getGlobalErrors, getErrorStats } from '@/lib/errors/globalErrors'

// Get all active errors
const errors = await getGlobalErrors()

// Get statistics
const stats = await getErrorStats()
console.log(stats)
// {
//   total: 10,
//   active: 5,
//   dismissed: 5,
//   bySeverity: { critical: 1, error: 2, warning: 1, info: 1 },
//   byType: { system: 2, generation: 3 }
// }
```

### Dismissing Errors

```typescript
import { dismissError, dismissAllErrors } from '@/lib/errors/globalErrors'

// Dismiss specific error
await dismissError('err_123_abc')

// Dismiss all errors
const count = await dismissAllErrors()
console.log(`Dismissed ${count} errors`)
```

## API Endpoints

### Get All Errors

```bash
GET /api/v1/errors
GET /api/v1/errors?severity=error
GET /api/v1/errors?type=webhook
```

Response:
```json
{
  "success": true,
  "count": 3,
  "errors": [
    {
      "id": "err_1234567890_abc123",
      "type": "generation",
      "severity": "error",
      "message": "Video generation failed",
      "context": { "sceneId": "123" },
      "timestamp": "2025-10-04T10:30:00.000Z",
      "dismissed": false,
      "dismissible": true
    }
  ]
}
```

### Dismiss Error

```bash
POST /api/v1/errors/dismiss
Content-Type: application/json

{
  "errorId": "err_1234567890_abc123"
}
```

### Dismiss All Errors

```bash
POST /api/v1/errors/dismiss
Content-Type: application/json

{
  "all": true
}
```

### Get Error Statistics

```bash
GET /api/v1/errors/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "total": 10,
    "active": 5,
    "dismissed": 5,
    "bySeverity": {
      "critical": 1,
      "error": 2,
      "warning": 1,
      "info": 1
    },
    "byType": {
      "system": 2,
      "generation": 3
    }
  }
}
```

## Error Types

- `system` - System-level errors
- `webhook` - Webhook processing errors
- `generation` - Video/content generation errors
- `processing` - Data processing errors
- `automation` - Automation workflow errors
- `notification` - Notification service errors
- `validation` - Validation errors
- `network` - Network/API errors
- `success` - Success messages (info severity)

## Error Severities

- `critical` - Critical errors requiring immediate attention (non-dismissible by default)
- `error` - Standard errors
- `warning` - Warnings
- `info` - Informational messages and success notifications

## Frontend Integration

### React Component Example

```typescript
'use client'

import { useEffect, useState } from 'react'
import { GlobalError } from '@/lib/errors/globalErrors'

export function GlobalErrorDisplay() {
  const [errors, setErrors] = useState<GlobalError[]>([])

  useEffect(() => {
    // Fetch errors on mount
    fetchErrors()

    // Poll for new errors every 5 seconds
    const interval = setInterval(fetchErrors, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchErrors() {
    const res = await fetch('/api/v1/errors')
    const data = await res.json()
    if (data.success) {
      setErrors(data.errors)
    }
  }

  async function dismissError(errorId: string) {
    await fetch('/api/v1/errors/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errorId }),
    })
    fetchErrors()
  }

  if (errors.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`p-4 rounded-lg shadow-lg ${getSeverityClass(error.severity)}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">{error.type}</h4>
              <p>{error.message}</p>
            </div>
            {error.dismissible && (
              <button
                onClick={() => dismissError(error.id)}
                className="ml-4 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function getSeverityClass(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-red-500 text-white'
    case 'error':
      return 'bg-red-100 text-red-900'
    case 'warning':
      return 'bg-yellow-100 text-yellow-900'
    case 'info':
      return 'bg-blue-100 text-blue-900'
    default:
      return 'bg-gray-100 text-gray-900'
  }
}
```

## Configuration

Set these environment variables:

```env
# Webhook Secrets
VIDEO_WEBHOOK_SECRET=your-video-webhook-secret
LAST_FRAME_WEBHOOK_SECRET=your-last-frame-webhook-secret
STITCH_WEBHOOK_SECRET=your-stitch-webhook-secret

# Service URLs
LAST_FRAME_SERVICE_URL=https://last-frame.ft.tc
NOTIFICATION_SERVICE_URL=https://notifications.yourapp.com

# API Keys
LAST_FRAME_API_KEY=your-last-frame-api-key
NOTIFICATION_API_KEY=your-notification-api-key

# App URL
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

## Production Considerations

### Storage Backend

The current implementation uses in-memory storage. For production:

1. **Use Redis**:
```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function addGlobalError(options: AddErrorOptions) {
  const error = { ...options, id: generateId(), timestamp: new Date().toISOString() }
  await redis.set(`error:${error.id}`, JSON.stringify(error), 'EX', 86400) // 24h TTL
  await redis.zadd('errors:active', Date.now(), error.id)
  return error
}
```

2. **Use Database**:
```typescript
// Add to Payload collection or direct database
await payload.create({
  collection: 'global-errors',
  data: {
    type: options.type,
    severity: options.severity,
    message: options.message,
    context: options.context,
    dismissed: false,
  }
})
```

### Rate Limiting

Current implementation uses in-memory store. For production, use Redis-based rate limiting:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})
```

### Monitoring

Add monitoring for webhook health:

```typescript
import { trackWebhookLatency, incrementWebhookErrors } from '@/lib/monitoring'

// Track webhook processing time
const start = Date.now()
// ... process webhook
trackWebhookLatency('video-complete', Date.now() - start)

// Track errors
if (error) {
  incrementWebhookErrors('video-complete')
}
```

## Cleanup

Errors are automatically cleaned up:
- Dismissed errors older than 24 hours are removed
- Auto-cleanup runs every hour
- Maximum 100 errors stored at once

Manual cleanup:
```typescript
import { cleanupErrors } from '@/lib/errors/globalErrors'

const removed = await cleanupErrors()
console.log(`Removed ${removed} old errors`)
```
