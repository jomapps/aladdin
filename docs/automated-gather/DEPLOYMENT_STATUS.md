# Automated Gather - Deployment Status

**Date**: October 4, 2025
**Status**: ✅ **READY FOR TESTING**

---

## ✅ Deployment Complete

All components are deployed and ready for integration testing.

### External Services

#### 1. tasks.ft.tc ✅ DEPLOYED
- **URL**: https://tasks.ft.tc
- **Task Type**: `automated_gather_creation`
- **Queue**: `cpu_intensive`
- **Timeout**: 10 minutes (hard), 9 minutes (soft)
- **Status**: Available and documented in `/docs/celery-redis/how-to-use-celery-redis.md`

#### 2. brain.ft.tc ✅ DEPLOYED
- **URL**: https://brain.ft.tc
- **Endpoints**: All 4 required endpoints available
  - `POST /api/v1/nodes/batch` - Batch node creation
  - `POST /api/v1/search/duplicates` - Duplicate detection
  - `GET /api/v1/context/department` - Department context
  - `POST /api/v1/analyze/coverage` - Coverage analysis
- **Status**: Documented in `/docs/mcp-brain-service/how-to-use.md`

### Frontend Implementation

#### API Routes ✅ COMPLETE
- ✅ `/api/v1/automated-gather/start` - Start automation
- ✅ `/api/v1/automated-gather/status/[taskId]` - Check status
- ✅ `/api/v1/automated-gather/cancel/[taskId]` - Cancel task
- ✅ `/api/webhooks/automated-gather-progress` - Webhook handler

**Task Type**: Fixed to use `automated_gather_creation` (was `automated_gather`)

#### UI Components ✅ COMPLETE
- ✅ `AutomatedGatherButton.tsx` - Trigger button with validation
- ✅ `ProgressModal.tsx` - Real-time progress display
- ✅ `StatusIndicator.tsx` - Department progress indicators
- ✅ `DuplicationDisplay.tsx` - "Weeding duplicates" visual

#### State Management ✅ COMPLETE
- ✅ `automatedGatherStore.ts` - Zustand store
- ✅ `useAutomatedGather.ts` - Main hook
- ✅ `useGatherProgress.ts` - Progress tracking
- ✅ `useGatherWebSocket.ts` - Real-time updates

#### Page Integration ✅ COMPLETE
- ✅ Project Readiness page - Button integrated
- ✅ Gather page - Button integrated with data refresh

#### Database Support ✅ COMPLETE
- ✅ MongoDB schema updated with automation fields
- ✅ Brain client enhanced with batch operations
- ✅ Task service client configured

---

## 🔄 Data Flow (Complete)

```
1. User clicks "Automate Gather" button
   ↓
2. AutomatedGatherButton → /api/v1/automated-gather/start
   ↓
3. API Route → taskService.submitTask('automated_gather_creation', {...})
   ↓
4. tasks.ft.tc receives task in cpu_intensive queue
   ↓
5. Task execution (at tasks.ft.tc):
   - Query departments (gatherCheck=true, sorted by codeDepNumber)
   - For each department:
     * Generate content via @codebuff/sdk
     * Check duplicates via brain.ft.tc
     * Save to MongoDB
     * Index in brain.ft.tc
     * Analyze quality
     * Send webhook progress
   - Auto-trigger evaluations
   ↓
6. Webhook → /api/webhooks/automated-gather-progress
   ↓
7. WebSocket broadcast → Frontend ProgressModal
   ↓
8. Real-time UI updates showing progress
```

---

## 📋 Configuration Checklist

### Environment Variables

#### Next.js App (.env.local) ✅
```bash
# Task Service
TASKS_API_URL=https://tasks.ft.tc
TASK_API_KEY=your-api-key

# Brain Service (for frontend if needed)
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=your-brain-api-key

# App URL for webhooks
NEXT_PUBLIC_APP_URL=https://aladdin.ngrok.pro

# Webhook Security (optional in dev)
WEBHOOK_SECRET=your-webhook-secret-key

# WebSocket Server (optional)
WEBSOCKET_SERVER_URL=http://localhost:3001
INTERNAL_API_SECRET=your-internal-secret
```

#### tasks.ft.tc ✅
```bash
# Brain Service
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_API_KEY=your-brain-api-key

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/aladdin

# OpenRouter for @codebuff/sdk
OPENROUTER_API_KEY=your-openrouter-key

# Payload CMS for department queries
PAYLOAD_API_URL=your-payload-url
PAYLOAD_API_KEY=your-payload-key
```

---

## 🧪 Testing Guide

### 1. Manual Testing

**Prerequisites**:
- At least 1 gather item exists in the project
- All environment variables configured
- tasks.ft.tc and brain.ft.tc are running

**Steps**:
1. Navigate to Project Readiness page
2. Click "Automate Gather" button
3. Verify ProgressModal opens
4. Watch real-time progress updates
5. Verify department processing in sequence
6. Verify "Weeding duplicates" step appears
7. Verify completion message
8. Check MongoDB for created items with `isAutomated: true`
9. Check Brain service for indexed nodes

### 2. API Testing

**Submit Task**:
```bash
curl -X POST http://localhost:3000/api/v1/automated-gather/start \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "gatherCount": 5,
    "options": {
      "saveInterval": 3,
      "errorRecovery": true
    }
  }'
```

**Check Status**:
```bash
curl http://localhost:3000/api/v1/automated-gather/status/{taskId}
```

**Cancel Task**:
```bash
curl -X DELETE http://localhost:3000/api/v1/automated-gather/cancel/{taskId}
```

### 3. Webhook Testing

**Test Webhook Endpoint**:
```bash
curl -X POST http://localhost:3000/api/webhooks/automated-gather-progress \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "test-task-123",
    "event": "progress",
    "timestamp": "2025-10-04T13:00:00Z",
    "data": {
      "department": "story",
      "progress": 0.5,
      "qualityScore": 75
    }
  }'
```

---

## 🐛 Troubleshooting

### Issue: Task submission fails
**Check**:
- TASKS_API_URL is correct
- TASK_API_KEY is valid
- tasks.ft.tc is running: `curl https://tasks.ft.tc/api/v1/health`

### Issue: No progress updates
**Check**:
- NEXT_PUBLIC_APP_URL is correct
- Webhook endpoint is accessible
- WebSocket server is running (if configured)
- Browser console for WebSocket errors

### Issue: Duplicate items created
**Check**:
- brain.ft.tc is accessible from tasks.ft.tc
- BRAIN_API_KEY is valid
- Duplicate detection threshold (default 90%)

### Issue: Quality threshold not met
**Check**:
- Department `minQualityThreshold` settings
- Content generation quality
- Coverage analysis working correctly

---

## 📊 Monitoring

### Task Queue Metrics

**Get Metrics**:
```bash
curl -H "X-API-Key: $TASK_API_KEY" \
  https://tasks.ft.tc/api/v1/tasks/metrics
```

**Health Check**:
```bash
curl -H "X-API-Key: $TASK_API_KEY" \
  https://tasks.ft.tc/api/v1/tasks/health
```

### Expected Performance

| Metric | Target | Actual (from docs) |
|--------|--------|-------------------|
| Average Duration | 3-5 min | 342 seconds (5.7 min) |
| P95 Duration | 8 min | Within target |
| Success Rate | >90% | >90% |
| Queue | cpu_intensive | ✅ Configured |
| Timeout | 10 min | ✅ Configured |

---

## 🚀 Next Steps

1. **Run Integration Tests**
   - Test with real project data
   - Verify all departments process correctly
   - Confirm WebSocket updates work

2. **Monitor Performance**
   - Track task durations
   - Monitor success rates
   - Check quality scores

3. **User Acceptance Testing**
   - Test with actual users
   - Gather feedback
   - Iterate on UX

4. **Production Deployment**
   - Verify all env vars in production
   - Test webhook URLs with production domains
   - Enable signature verification in production

---

## 📚 Documentation

- **Feature Spec**: `/docs/idea/automated-gather.md`
- **External Services**: `/docs/automated-gather/EXTERNAL_SERVICES_INTEGRATION.md`
- **Task Service API**: `/docs/celery-redis/how-to-use-celery-redis.md`
- **Brain Service API**: `/docs/mcp-brain-service/how-to-use.md`
- **This Document**: `/docs/automated-gather/DEPLOYMENT_STATUS.md`

---

## ✅ Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| tasks.ft.tc | ✅ Deployed | `automated_gather_creation` available |
| brain.ft.tc | ✅ Deployed | All 4 endpoints available |
| API Routes | ✅ Complete | Task type fixed to `automated_gather_creation` |
| UI Components | ✅ Complete | All components built and integrated |
| State Management | ✅ Complete | Zustand + hooks ready |
| Webhook Handler | ✅ Complete | Signature verification implemented |
| Database Clients | ✅ Complete | MongoDB + Brain clients updated |
| Page Integration | ✅ Complete | Both pages have button |
| Documentation | ✅ Complete | All docs written |

**Overall Status**: ✅ **READY FOR TESTING**

---

**Last Updated**: October 4, 2025
**Next Review**: After integration testing
