# Project Readiness - Environment Variables

**Required environment variables for Project Readiness feature**

---

## Task Service Integration (Required)

### Production Task Service

```bash
# Production URL for tasks.ft.tc (Celery-Redis service)
TASKS_API_URL=https://tasks.ft.tc

# API key for authenticating with task service
CELERY_TASK_API_KEY=your_production_api_key_here
```

### Development/Local Task Service

```bash
# Local task service URL
TASKS_API_URL=http://localhost:8001

# Local API key (can be any string for local dev)
CELERY_TASK_API_KEY=local_dev_key_12345
```

---

## Webhook Configuration (Required)

```bash
# Your application's public URL (for webhook callbacks)
# This is where tasks.ft.tc will send completion notifications
NEXT_PUBLIC_APP_URL=https://your-app-domain.com

# For local development with ngrok:
# NEXT_PUBLIC_APP_URL=https://your-ngrok-subdomain.ngrok.io
```

---

## Database Configuration (Already Required)

```bash
# MongoDB connection string (already required for PayloadCMS)
# Used for both main database and gather databases
MONGODB_URI=mongodb://localhost:27017/aladdin

# For production MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/aladdin?retryWrites=true&w=majority
```

---

## Complete `.env.local` Example

```bash
# ========== Database ==========
MONGODB_URI=mongodb://localhost:27017/aladdin
DATABASE_URI=mongodb://localhost:27017/aladdin

# ========== PayloadCMS ==========
PAYLOAD_SECRET=your_payload_secret_here

# ========== Task Service (tasks.ft.tc) ==========
# Production
TASKS_API_URL=https://tasks.ft.tc
CELERY_TASK_API_KEY=your_production_api_key

# OR for local development
# TASKS_API_URL=http://localhost:8001
# CELERY_TASK_API_KEY=local_dev_key

# ========== Webhooks ==========
# Production
NEXT_PUBLIC_APP_URL=https://auto-movie.ft.tc

# OR for local development with ngrok
# NEXT_PUBLIC_APP_URL=https://your-subdomain.ngrok.io

# ========== Cloudflare R2 (Already configured) ==========
R2_ENDPOINT=your_r2_endpoint
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://media.rumbletv.com
```

---

## Environment Variable Validation

Add this to your `src/lib/env.ts` (or create it):

```typescript
/**
 * Validate required environment variables
 */
export function validateProjectReadinessEnv() {
  const required = [
    'TASKS_API_URL',
    'CELERY_TASK_API_KEY',
    'NEXT_PUBLIC_APP_URL',
    'MONGODB_URI',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for Project Readiness: ${missing.join(', ')}`
    )
  }

  console.log('✅ Project Readiness environment variables validated')
}
```

---

## Local Development Setup

### 1. Install and Run Task Service Locally

```bash
# Clone the task service repo
cd ../
git clone <task-service-repo>
cd celery-redis

# Install dependencies
pip install -r requirements.txt

# Run task service
python app/main.py
# Should start on http://localhost:8001
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add:
TASKS_API_URL=http://localhost:8001
CELERY_TASK_API_KEY=local_dev_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Test Connection

```bash
# Test task service health
curl http://localhost:8001/api/v1/health \
  -H "X-API-Key: local_dev_key"

# Should return:
# {
#   "status": "healthy",
#   "redis_status": "connected",
#   ...
# }
```

---

## Production Deployment

### 1. Get Task Service Credentials

Contact your task service admin to get:
- Production URL (`https://tasks.ft.tc`)
- Production API key

### 2. Set Environment Variables

**Vercel/Netlify:**
1. Go to project settings
2. Add environment variables:
   - `TASKS_API_URL`
   - `CELERY_TASK_API_KEY`
   - `NEXT_PUBLIC_APP_URL`

**Docker:**
```bash
docker run -e TASKS_API_URL=https://tasks.ft.tc \
           -e CELERY_TASK_API_KEY=your_key \
           -e NEXT_PUBLIC_APP_URL=https://your-app.com \
           your-image
```

### 3. Verify Webhook Endpoint

```bash
# Test webhook is accessible
curl https://your-app.com/api/webhooks/evaluation-complete \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"task_id":"test","status":"completed","project_id":"test"}'

# Should return 200 or 404 (not 500)
```

---

## Troubleshooting

### "Task submission failed: Failed to fetch"

**Cause**: `TASKS_API_URL` is incorrect or task service is down

**Solution**:
```bash
# Check task service health
curl $TASKS_API_URL/api/v1/health -H "X-API-Key: $CELERY_TASK_API_KEY"
```

### "Invalid or missing API key"

**Cause**: `CELERY_TASK_API_KEY` is incorrect

**Solution**:
```bash
# Verify API key with task service admin
# Update .env.local with correct key
```

### "Webhook not receiving callbacks"

**Cause**: `NEXT_PUBLIC_APP_URL` is incorrect or not publicly accessible

**Solution**:
```bash
# For local development, use ngrok:
ngrok http 3000
# Update NEXT_PUBLIC_APP_URL with ngrok URL

# For production, ensure domain is correct:
# NEXT_PUBLIC_APP_URL=https://your-actual-domain.com
```

### "Failed to get gather count"

**Cause**: Gather database doesn't exist for project

**Solution**:
```bash
# Gather database is created automatically when first item is added
# Use gather page or AI chat to add items first
```

---

## Security Notes

### API Key Security

⚠️ **Never commit API keys to git**

```bash
# Add to .gitignore
.env.local
.env.production.local
*.env

# Use git-secrets or similar tools
git secrets --install
git secrets --register-aws
```

### Webhook Security

Consider adding webhook signature verification:

```typescript
// src/app/api/webhooks/evaluation-complete/route.ts
function verifyWebhookSignature(request: Request) {
  const signature = request.headers.get('X-Webhook-Signature')
  const secret = process.env.WEBHOOK_SECRET

  // Verify signature matches
  // Implementation depends on task service signature method
}
```

---

## Monitoring

### Health Check Endpoint

```bash
# Check task service health
curl https://tasks.ft.tc/api/v1/health \
  -H "X-API-Key: $CELERY_TASK_API_KEY"

# Expected response:
{
  "status": "healthy",
  "redis_status": "connected",
  "worker_count": 4,
  "queue_sizes": { ... },
  "uptime": 86400
}
```

### Task Status Monitoring

```bash
# Get all tasks for a project
curl https://tasks.ft.tc/api/v1/projects/{projectId}/tasks \
  -H "X-API-Key: $CELERY_TASK_API_KEY"
```

---

## Related Documentation

- [Project Readiness Specification](/docs/idea/pages/project-readiness.md)
- [Task Service Documentation](/celery-redis/docs/how-to-use-celery-redis.md)
- [System Integration](/celery-redis/docs/system-integration.md)

---

**Last Updated**: January 2025
**Status**: ✅ Ready for Production
