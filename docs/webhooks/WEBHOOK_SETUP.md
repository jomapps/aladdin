# Webhook System Setup Guide

Complete guide for setting up and configuring the webhook integration system.

## Overview

The webhook system handles asynchronous video processing notifications from external services:

1. **video-complete** - Receives video generation completion from tasks.ft.tc
2. **last-frame-complete** - Receives last frame extraction from last-frame.ft.tc
3. **stitch-complete** - Receives final video stitching completion

## Architecture Flow

```
┌─────────────────┐
│   Video Gen     │
│  tasks.ft.tc    │
└────────┬────────┘
         │
         │ POST /api/webhooks/video-complete
         │
         ▼
┌─────────────────────────────────────────┐
│  1. Verify signature                    │
│  2. Rate limit check                    │
│  3. Update scene with video URL         │
│  4. Trigger last frame extraction       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Last Frame     │
│ last-frame.ft.tc│
└────────┬────────┘
         │
         │ POST /api/webhooks/last-frame-complete
         │
         ▼
┌─────────────────────────────────────────┐
│  1. Verify signature                    │
│  2. Update scene with last frame        │
│  3. Mark scene as completed             │
│  4. Trigger next scene generation       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   All scenes    │
│   completed?    │
└────────┬────────┘
         │ Yes
         │
         ▼
┌─────────────────┐
│  Stitch Service │
└────────┬────────┘
         │
         │ POST /api/webhooks/stitch-complete
         │
         ▼
┌─────────────────────────────────────────┐
│  1. Verify signature                    │
│  2. Update project with final video     │
│  3. Set project status to completed     │
│  4. Notify user                         │
└─────────────────────────────────────────┘
```

## Environment Variables

Add these to your `.env` file:

```bash
# ===========================================
# WEBHOOK SECURITY
# ===========================================
# Generate strong secrets for each webhook
VIDEO_WEBHOOK_SECRET=your-video-webhook-secret-change-me
LAST_FRAME_WEBHOOK_SECRET=your-last-frame-webhook-secret-change-me
STITCH_WEBHOOK_SECRET=your-stitch-webhook-secret-change-me

# ===========================================
# EXTERNAL SERVICE URLs
# ===========================================
# Video generation service
VIDEO_GENERATION_SERVICE=https://tasks.ft.tc

# Last frame extraction service
LAST_FRAME_SERVICE_URL=https://last-frame.ft.tc

# Video stitching service
STITCH_SERVICE_URL=https://stitch.yourapp.com

# Notification service (optional)
NOTIFICATION_SERVICE_URL=https://notifications.yourapp.com

# ===========================================
# SERVICE API KEYS
# ===========================================
LAST_FRAME_API_KEY=your-last-frame-api-key
NOTIFICATION_API_KEY=your-notification-api-key

# ===========================================
# APPLICATION
# ===========================================
NEXT_PUBLIC_APP_URL=https://yourapp.com

# Environment
NODE_ENV=production
```

### Generating Webhook Secrets

Use strong, random secrets for each webhook:

```bash
# Generate secrets using OpenSSL
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Webhook Endpoints

### 1. Video Complete Webhook

**Endpoint**: `POST /api/webhooks/video-complete`

**Purpose**: Receives notifications when video generation completes

**Headers**:
```
Content-Type: application/json
X-Webhook-Signature: <hmac-sha256-signature>
```

**Request Body**:
```json
{
  "task_id": "task_1234567890_abc",
  "status": "completed",
  "scene_id": "scene_001",
  "project_id": "proj_xyz",
  "video_url": "https://cdn.example.com/videos/scene_001.mp4",
  "thumbnail_url": "https://cdn.example.com/thumbnails/scene_001.jpg",
  "duration": 5.0,
  "fps": 24,
  "width": 1920,
  "height": 1080,
  "quality_score": 8.5,
  "metadata": {
    "model": "runway-gen3-alpha",
    "processing_time": 45.2
  },
  "timestamp": "2025-10-04T10:30:00.000Z"
}
```

**Response**:
```json
{
  "received": true,
  "status": "completed",
  "scene_updated": true,
  "last_frame_triggered": true
}
```

### 2. Last Frame Complete Webhook

**Endpoint**: `POST /api/webhooks/last-frame-complete`

**Purpose**: Receives notifications when last frame extraction completes

**Headers**:
```
Content-Type: application/json
X-Webhook-Signature: <hmac-sha256-signature>
```

**Request Body**:
```json
{
  "task_id": "task_1234567890_def",
  "status": "completed",
  "scene_id": "scene_001",
  "project_id": "proj_xyz",
  "last_frame_url": "https://cdn.example.com/frames/scene_001_last.jpg",
  "width": 1920,
  "height": 1080,
  "format": "jpeg",
  "metadata": {
    "extraction_time": 2.1,
    "frame_number": 120
  },
  "timestamp": "2025-10-04T10:31:00.000Z"
}
```

**Response**:
```json
{
  "received": true,
  "status": "completed",
  "scene_updated": true,
  "next_scene_triggered": true
}
```

### 3. Stitch Complete Webhook

**Endpoint**: `POST /api/webhooks/stitch-complete`

**Purpose**: Receives notifications when final video stitching completes

**Headers**:
```
Content-Type: application/json
X-Webhook-Signature: <hmac-sha256-signature>
```

**Request Body**:
```json
{
  "task_id": "task_1234567890_ghi",
  "status": "completed",
  "project_id": "proj_xyz",
  "final_video_url": "https://cdn.example.com/final/project_xyz.mp4",
  "thumbnail_url": "https://cdn.example.com/final/project_xyz_thumb.jpg",
  "duration": 120.5,
  "total_scenes": 24,
  "file_size": 524288000,
  "format": "mp4",
  "resolution": "1920x1080",
  "metadata": {
    "processing_time": 180.5,
    "stitch_quality": 9.2,
    "transitions_applied": 23,
    "audio_tracks": 2
  },
  "timestamp": "2025-10-04T10:45:00.000Z"
}
```

**Response**:
```json
{
  "received": true,
  "status": "completed",
  "project_updated": true,
  "user_notified": true,
  "final_video_url": "https://cdn.example.com/final/project_xyz.mp4"
}
```

## Security

### Signature Verification

All webhooks verify HMAC-SHA256 signatures to prevent unauthorized requests.

**Generating Signature (Service Side)**:
```python
import hmac
import hashlib
import json

payload = json.dumps(webhook_data)
secret = os.environ['WEBHOOK_SECRET']

signature = hmac.new(
    secret.encode('utf-8'),
    payload.encode('utf-8'),
    hashlib.sha256
).hexdigest()

headers = {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
}
```

**Verification (Our Side)**:
```typescript
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex')

const isValid = crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
)
```

### Rate Limiting

- **Limit**: 100 requests per minute per IP (video/last-frame), 50 per minute (stitch)
- **Window**: 1 minute sliding window
- **Storage**: In-memory (use Redis in production)

**Production Setup**:
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})

const { success } = await ratelimit.limit(clientIp)
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

## Registering Webhooks with External Services

### tasks.ft.tc (Video Generation)

```bash
curl -X POST https://tasks.ft.tc/api/webhooks/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/api/webhooks/video-complete",
    "events": ["task.completed", "task.failed"],
    "secret": "your-video-webhook-secret-change-me"
  }'
```

### last-frame.ft.tc (Frame Extraction)

```bash
curl -X POST https://last-frame.ft.tc/api/webhooks/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/api/webhooks/last-frame-complete",
    "events": ["extraction.completed", "extraction.failed"],
    "secret": "your-last-frame-webhook-secret-change-me"
  }'
```

## Testing Webhooks

### Health Check

```bash
# Video complete webhook
curl https://yourapp.com/api/webhooks/video-complete

# Last frame webhook
curl https://yourapp.com/api/webhooks/last-frame-complete

# Stitch webhook
curl https://yourapp.com/api/webhooks/stitch-complete
```

### Test Payload

```bash
# Generate test signature
SECRET="your-video-webhook-secret-change-me"
PAYLOAD='{"task_id":"test_123","status":"completed","scene_id":"scene_001","project_id":"proj_test","video_url":"https://example.com/test.mp4","timestamp":"2025-10-04T10:30:00.000Z"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

# Send test webhook
curl -X POST https://yourapp.com/api/webhooks/video-complete \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

## Error Handling

All webhook errors are logged to the global error system:

```typescript
// Errors are automatically logged
await addGlobalError({
  type: 'webhook',
  severity: 'error',
  message: 'Video generation failed for scene 001',
  context: { sceneId: '123', taskId: 'task_xyz', error: 'Timeout' }
})
```

View errors:
```bash
# Get all errors
curl https://yourapp.com/api/v1/errors

# Get webhook-specific errors
curl https://yourapp.com/api/v1/errors?type=webhook

# Get error statistics
curl https://yourapp.com/api/v1/errors/stats
```

## Monitoring

### Webhook Metrics

Track webhook health with these metrics:

1. **Latency**: Time to process webhook
2. **Success Rate**: Successful vs failed webhooks
3. **Error Types**: Categories of failures
4. **Rate Limit Hits**: How often rate limits are reached

### Recommended Tools

- **Sentry**: Error tracking and monitoring
- **Datadog**: APM and metrics
- **LogRocket**: Session replay for debugging
- **Upstash**: Redis-based rate limiting

### Example Monitoring

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  // Process webhook
  await processWebhook(payload)

  // Track success
  Sentry.metrics.increment('webhook.success', {
    tags: { type: 'video-complete' }
  })
} catch (error) {
  // Track error
  Sentry.captureException(error, {
    tags: { webhook_type: 'video-complete' },
    contexts: { payload }
  })
}
```

## Troubleshooting

### Common Issues

1. **Invalid Signature**
   - Verify webhook secret matches on both sides
   - Ensure raw body is used for signature verification
   - Check secret encoding (UTF-8)

2. **Rate Limit Exceeded**
   - Increase rate limit for your service
   - Implement exponential backoff
   - Use Redis for distributed rate limiting

3. **Scene/Project Not Found**
   - Verify IDs in webhook payload match database
   - Check for race conditions (webhook arrives before DB write)
   - Add retry logic with exponential backoff

4. **Service Unavailable**
   - Check external service URLs are correct
   - Verify API keys are valid
   - Implement circuit breaker pattern

### Debug Mode

Enable detailed logging:

```bash
DEBUG=webhooks:* npm run dev
```

View webhook logs:
```bash
# Tail webhook logs
tail -f logs/webhooks.log

# Search for specific webhook
grep "task_123" logs/webhooks.log
```

## Production Checklist

- [ ] Generate strong webhook secrets
- [ ] Configure all environment variables
- [ ] Register webhooks with external services
- [ ] Set up Redis for rate limiting
- [ ] Configure error monitoring (Sentry)
- [ ] Set up log aggregation (Datadog, CloudWatch)
- [ ] Test all webhook endpoints
- [ ] Document webhook flow for team
- [ ] Set up alerts for webhook failures
- [ ] Implement retry logic for failed webhooks
- [ ] Configure CORS if needed
- [ ] Set up webhook replay mechanism
- [ ] Test signature verification
- [ ] Verify rate limiting works
- [ ] Test error recovery flows

## Support

For issues or questions:
- Check logs: `/api/v1/errors`
- View stats: `/api/v1/errors/stats`
- Health checks: `/api/webhooks/{webhook-name}` (GET)
