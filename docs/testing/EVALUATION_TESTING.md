# Department Evaluation Testing Guide

## Overview

This guide covers end-to-end testing of the department evaluation workflow, which integrates:
- **Aladdin Frontend** (Next.js application)
- **PayloadCMS** (Content management and database)
- **Task Service** (Celery-Redis at `https://tasks.ft.tc`)
- **Webhook Integration** (Real-time notifications)

---

## 🚀 Quick Start

### Prerequisites

1. **Development server running**:
   ```bash
   pnpm dev
   ```

2. **Task service online**:
   - Service: `https://tasks.ft.tc`
   - Status: Should be accessible and healthy

3. **Playwright installed**:
   ```bash
   pnpm exec playwright install
   ```

4. **Test project exists**:
   - Project ID: `68df4dab400c86a6a8cf40c6`
   - Has gather data for Story department
   - Story department not yet evaluated (or reset to pending)

---

## 🧪 Running Tests

### Run All Evaluation Tests

```bash
# Run in headless mode
pnpm test:e2e:evaluation

# Run in UI mode (recommended for first time)
pnpm test:e2e:evaluation:ui

# Run in headed mode (watch the browser)
pnpm test:e2e:evaluation:headed
```

### Run Specific Test

```bash
# Run specific test by name
pnpm exec playwright test tests/e2e/evaluation-flow.spec.ts -g "should complete full evaluation workflow"

# Run in debug mode
pnpm exec playwright test tests/e2e/evaluation-flow.spec.ts --debug
```

### View Test Report

```bash
pnpm exec playwright show-report playwright-report/evaluation
```

---

## 📋 Test Coverage

### Test 1: Complete Evaluation Workflow ✅

**What it tests**:
1. Auto-login in development mode
2. Navigate to project gather page
3. Click "Evaluate" on Story department
4. Verify redirect to project-readiness page
5. Verify evaluation auto-triggers
6. Wait for task submission to `tasks.ft.tc`
7. Poll for evaluation completion (up to 2 minutes)
8. Verify webhook notification received
9. Verify results displayed in UI (rating, summary, issues, suggestions)
10. Verify overall readiness score updated

**Expected Duration**: 2-3 minutes

**Success Criteria**:
- ✅ Evaluation completes successfully
- ✅ Rating is between 0-100
- ✅ Summary text is displayed
- ✅ Issues array is populated
- ✅ Suggestions array is populated
- ✅ Overall readiness score is calculated

---

### Test 2: Evaluation Failure Handling ✅

**What it tests**:
- Graceful handling of failed evaluations
- Error message display
- Retry button availability

**Expected Duration**: 30 seconds

**Success Criteria**:
- ✅ Failed status is displayed
- ✅ Error message is shown
- ✅ Retry option is available

---

### Test 3: Evaluation History Display ✅

**What it tests**:
- Display of previous evaluations
- History item count
- Historical data presentation

**Expected Duration**: 10 seconds

**Success Criteria**:
- ✅ History section is visible
- ✅ Previous evaluations are listed
- ✅ Historical ratings are displayed

---

### Test 4: Sequential Evaluation Requirements ✅

**What it tests**:
- Enforcement of sequential evaluation order
- Locked department indicators
- Explanatory messages for locked departments

**Expected Duration**: 10 seconds

**Success Criteria**:
- ✅ Departments are locked until previous ones complete
- ✅ Lock messages explain requirements
- ✅ Evaluate buttons are disabled appropriately

---

## 🔍 What the Tests Verify

### Frontend (Aladdin)
- ✅ Auto-login in development mode
- ✅ Navigation to gather page
- ✅ Department card rendering
- ✅ Evaluate button functionality
- ✅ Redirect to project-readiness page
- ✅ Toast notifications
- ✅ Status updates (pending → in_progress → completed)
- ✅ Results display (rating, summary, issues, suggestions)
- ✅ Overall readiness score calculation

### Backend (API Routes)
- ✅ `/api/v1/project-readiness/[projectId]/evaluate` - Task submission
- ✅ `/api/webhooks/evaluation-complete` - Webhook handler
- ✅ Database updates (project-readiness collection)
- ✅ Score calculation logic

### Task Service Integration
- ✅ Task submission to `https://tasks.ft.tc`
- ✅ Task type: `evaluate_department`
- ✅ Callback URL configuration
- ✅ Webhook delivery
- ✅ Result structure validation

### Webhook Flow
- ✅ Webhook POST to `/api/webhooks/evaluation-complete`
- ✅ Task ID matching
- ✅ Result parsing
- ✅ Database updates
- ✅ Score recalculation

---

## 🐛 Debugging Failed Tests

### Test Fails at Step 1 (Auto-Login)

**Symptoms**: Cannot redirect to dashboard

**Possible Causes**:
- `NODE_ENV` is not set to `development`
- No users exist in database
- PayloadCMS connection issue

**Solutions**:
```bash
# Check environment
echo $NODE_ENV  # Should be "development"

# Seed database with users
pnpm db:seed

# Check PayloadCMS connection
curl http://localhost:3000/api/users
```

---

### Test Fails at Step 4 (Evaluate Button Click)

**Symptoms**: Button not found or not clickable

**Possible Causes**:
- Department card not rendering
- Gather data missing
- Department already evaluated

**Solutions**:
```bash
# Check gather data exists
curl http://localhost:3000/api/v1/gather/68df4dab400c86a6a8cf40c6

# Reset evaluation status (if needed)
# Use PayloadCMS admin to delete evaluation record
```

---

### Test Fails at Step 8 (Evaluation Timeout)

**Symptoms**: Evaluation doesn't complete within 2 minutes

**Possible Causes**:
- Task service is down
- AI service timeout
- Webhook not being sent
- Webhook URL incorrect

**Solutions**:
```bash
# Check task service health
curl https://tasks.ft.tc/api/v1/health

# Check webhook endpoint
curl https://aladdin.ngrok.pro/api/webhooks/evaluation-complete

# Check task service logs for errors
# Check Next.js logs for webhook notifications

# Verify environment variables
echo $TASKS_API_URL  # Should be https://tasks.ft.tc
echo $TASK_API_KEY   # Should be set
echo $NEXT_PUBLIC_APP_URL  # Should be https://aladdin.ngrok.pro
```

---

### Test Fails at Step 9 (Results Not Displayed)

**Symptoms**: Evaluation completes but results don't show

**Possible Causes**:
- Webhook payload structure mismatch
- Database update failed
- UI not refreshing

**Solutions**:
```bash
# Check webhook logs in Next.js console
# Look for: [Webhook] Received evaluation complete notification

# Check database for evaluation record
# Use PayloadCMS admin to view project-readiness collection

# Check browser console for errors
# Open DevTools and look for React errors
```

---

## 📊 Test Configuration

**File**: `tests/e2e/evaluation.config.ts`

**Key Settings**:
- **Timeout**: 180 seconds (3 minutes) per test
- **Expect Timeout**: 15 seconds for assertions
- **Workers**: 1 (sequential execution)
- **Retries**: 1 (local), 2 (CI)
- **Screenshots**: Always captured
- **Videos**: Always recorded
- **Traces**: Always captured

**Why Extended Timeouts?**
- AI evaluations can take 30-120 seconds
- Webhook delivery adds latency
- Database updates require time
- UI polling happens every 5 seconds

---

## 🔧 Manual Testing

If automated tests fail, you can manually test the flow:

### Step-by-Step Manual Test

1. **Open browser**: Navigate to `http://localhost:3000`
2. **Auto-login**: Should redirect to `/dashboard`
3. **Navigate**: Go to `/dashboard/project/68df4dab400c86a6a8cf40c6/gather`
4. **Find Story card**: Look for department card with "Story" title
5. **Click Evaluate**: Press the "Evaluate" button
6. **Verify redirect**: Should go to `/dashboard/project/68df4dab400c86a6a8cf40c6/project-readiness?evaluate=story`
7. **Check toast**: Should see "Starting evaluation for story department..."
8. **Wait**: Evaluation takes 30-120 seconds
9. **Refresh**: Reload page to see updated results
10. **Verify results**: Check rating, summary, issues, suggestions

### Expected Console Logs

**Frontend (Browser Console)**:
```
[ProjectReadiness] Auto-triggering evaluation for: story
[ProjectReadiness] Starting evaluation for department: story
```

**Backend (Next.js Console)**:
```
[TaskService] Submitting evaluation: { url, projectId, taskType }
[TaskService] Response status: 201 Created
[Webhook] Received evaluation complete notification: { task_id, status }
[Webhook] Found evaluation: { id, projectId, departmentId }
[Webhook] Processing completed evaluation: { rating, department }
[Webhook] Updated evaluation record successfully
[Webhook] Updated project readiness score
```

**Task Service (Celery Logs)**:
```
[celery] Task evaluate_department[abc123] received
[celery] Task evaluate_department[abc123] succeeded in 45.2s
[webhook] Sending webhook to https://aladdin.ngrok.pro/api/webhooks/evaluation-complete
[webhook] Webhook delivered successfully: 200 OK
```

---

## 📈 Performance Benchmarks

| Metric | Expected | Acceptable | Concerning |
|--------|----------|------------|------------|
| Task Submission | < 2s | < 5s | > 10s |
| Evaluation Duration | 30-60s | 60-120s | > 180s |
| Webhook Delivery | < 1s | < 3s | > 5s |
| Database Update | < 500ms | < 2s | > 5s |
| UI Refresh | < 1s | < 3s | > 5s |
| **Total Flow** | **45-90s** | **90-180s** | **> 180s** |

---

## 🎯 Next Steps

After successful test runs:

1. **Monitor production**: Watch for evaluation failures in production
2. **Tune timeouts**: Adjust based on actual performance
3. **Add more tests**: Cover edge cases and error scenarios
4. **Performance testing**: Load test with multiple concurrent evaluations
5. **Integration tests**: Test all 12 departments sequentially
6. **Regression tests**: Run before each deployment

---

## 📞 Support

If tests continue to fail:

1. Check this guide's debugging section
2. Review webhook documentation: `docs/webhooks/EVALUATION_WEBHOOK.md`
3. Review task service docs: `celery-redis/docs/how-to-use-celery-redis.md`
4. Check implementation guide: `docs/celery-redis/need-evaluate-department.md`
5. Review test file: `tests/e2e/evaluation-flow.spec.ts`

---

**Happy Testing! 🎉**

