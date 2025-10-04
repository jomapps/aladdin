#!/usr/bin/env tsx

/**
 * Test script for Automated Gather API
 *
 * Tests the API endpoints locally to verify:
 * - Request validation
 * - Type safety
 * - Error handling
 */

import type {
  AutomatedGatherStartRequest,
  AutomatedGatherStartResponse,
  AutomatedGatherStatusResponse,
  AutomatedGatherCancelResponse,
  ErrorResponse,
} from '../src/app/api/v1/automated-gather/types';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testStartEndpoint() {
  console.log('🧪 Testing POST /api/v1/automated-gather/start');

  // Valid request
  const validRequest: AutomatedGatherStartRequest = {
    projectId: 'test-project-123',
    gatherCount: 10,
    options: {
      saveInterval: 5,
      errorRecovery: true,
      notificationPreferences: {
        onComplete: true,
        onError: true,
        onProgress: true,
      },
    },
  };

  try {
    const response = await fetch(`${API_BASE}/api/v1/automated-gather/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validRequest),
    });

    const data: AutomatedGatherStartResponse | ErrorResponse = await response.json();

    if (response.ok) {
      console.log('✅ Start endpoint successful:', data);
      return (data as AutomatedGatherStartResponse).taskId;
    } else {
      console.log('❌ Start endpoint error:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return null;
  }
}

async function testValidation() {
  console.log('\n🧪 Testing validation');

  // Invalid gatherCount
  const invalidRequest = {
    projectId: 'test-project',
    gatherCount: 150, // Too high
  };

  try {
    const response = await fetch(`${API_BASE}/api/v1/automated-gather/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRequest),
    });

    const data: ErrorResponse = await response.json();

    if (response.status === 400) {
      console.log('✅ Validation working correctly:', data.message);
    } else {
      console.log('❌ Validation not working:', data);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

async function testStatusEndpoint(taskId: string) {
  console.log(`\n🧪 Testing GET /api/v1/automated-gather/status/${taskId}`);

  try {
    const response = await fetch(`${API_BASE}/api/v1/automated-gather/status/${taskId}`);
    const data: AutomatedGatherStatusResponse | ErrorResponse = await response.json();

    if (response.ok) {
      const status = data as AutomatedGatherStatusResponse;
      console.log('✅ Status endpoint successful:', {
        taskId: status.taskId,
        status: status.status,
        progress: status.progress,
      });
    } else {
      console.log('❌ Status endpoint error:', data);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

async function testCancelEndpoint(taskId: string) {
  console.log(`\n🧪 Testing DELETE /api/v1/automated-gather/cancel/${taskId}`);

  try {
    const response = await fetch(`${API_BASE}/api/v1/automated-gather/cancel/${taskId}`, {
      method: 'DELETE',
    });
    const data: AutomatedGatherCancelResponse | ErrorResponse = await response.json();

    if (response.ok) {
      console.log('✅ Cancel endpoint successful:', data);
    } else {
      console.log('❌ Cancel endpoint error:', data);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

async function testWebhook() {
  console.log('\n🧪 Testing POST /api/webhooks/automated-gather-progress');

  const webhookPayload = {
    taskId: 'test-task-123',
    event: 'progress',
    data: {
      currentIteration: 5,
      totalIterations: 10,
      percentage: 50,
      message: 'Processing iteration 5 of 10',
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(`${API_BASE}/api/webhooks/automated-gather-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'test-signature',
      },
      body: JSON.stringify(webhookPayload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Webhook endpoint successful:', data);
    } else {
      console.log('⚠️  Webhook endpoint (may require signature):', data);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting Automated Gather API Tests\n');
  console.log(`API Base URL: ${API_BASE}\n`);

  // Test validation first
  await testValidation();

  // Test start endpoint
  const taskId = await testStartEndpoint();

  if (taskId) {
    // Test status endpoint
    await testStatusEndpoint(taskId);

    // Test cancel endpoint
    await testCancelEndpoint(taskId);
  } else {
    console.log('\n⚠️  Skipping status and cancel tests (no task created)');
    console.log('This is expected if task service is not running');
  }

  // Test webhook endpoint
  await testWebhook();

  console.log('\n✨ Test suite completed\n');
  console.log('📝 Notes:');
  console.log('- Task creation may fail if Celery service is not running');
  console.log('- Webhook signature validation is enforced in production');
  console.log('- Check server logs for detailed error messages');
}

// Run tests
runTests().catch(console.error);
