import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  WebhookProgressPayload,
  ErrorResponse,
  ProgressUpdate,
} from '@/app/api/v1/automated-gather/types';

/**
 * Webhook secret for signature validation
 * Set via WEBHOOK_SECRET environment variable
 */
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-key';

/**
 * Verify webhook signature using HMAC-SHA256
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Forward progress update to WebSocket server
 */
async function forwardToWebSocket(payload: WebhookProgressPayload) {
  // Get WebSocket server URL from environment
  const wsServerUrl = process.env.WEBSOCKET_SERVER_URL;

  if (!wsServerUrl) {
    console.warn('WEBSOCKET_SERVER_URL not configured, skipping WebSocket forward');
    return;
  }

  try {
    const response = await fetch(`${wsServerUrl}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({
        channel: `task:${payload.taskId}`,
        event: payload.event,
        data: payload.data,
      }),
    });

    if (!response.ok) {
      console.error('Failed to forward to WebSocket:', await response.text());
    }
  } catch (error) {
    console.error('Error forwarding to WebSocket:', error);
  }
}

/**
 * Store progress update in database (optional)
 */
async function storeProgressUpdate(payload: WebhookProgressPayload) {
  // TODO: Implement database storage if needed
  // This could store progress updates in a database table for history/auditing
  console.log('Progress update received:', {
    taskId: payload.taskId,
    event: payload.event,
    timestamp: payload.timestamp,
  });
}

/**
 * POST /api/webhooks/automated-gather-progress
 * Webhook handler for Celery progress updates
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('X-Webhook-Signature');

    // Verify webhook signature
    if (process.env.NODE_ENV === 'production') {
      if (!verifyWebhookSignature(rawBody, signature)) {
        return NextResponse.json<ErrorResponse>(
          {
            error: 'INVALID_SIGNATURE',
            message: 'Webhook signature verification failed',
            statusCode: 401,
          },
          { status: 401 }
        );
      }
    }

    // Parse payload
    const payload: WebhookProgressPayload = JSON.parse(rawBody);

    // Validate required fields
    if (!payload.taskId || !payload.event || !payload.timestamp) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'VALIDATION_ERROR',
          message: 'Missing required fields: taskId, event, or timestamp',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Validate event type
    const validEvents = ['progress', 'complete', 'error', 'cancelled'];
    if (!validEvents.includes(payload.event)) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'VALIDATION_ERROR',
          message: `Invalid event type. Must be one of: ${validEvents.join(', ')}`,
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Process the webhook payload
    await Promise.all([
      forwardToWebSocket(payload),
      storeProgressUpdate(payload),
    ]);

    // Emit server-sent event if clients are connected (optional)
    // This could be enhanced with a Server-Sent Events implementation

    return NextResponse.json(
      {
        success: true,
        message: 'Progress update processed successfully',
        taskId: payload.taskId,
        event: payload.event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);

    return NextResponse.json<ErrorResponse>(
      {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while processing webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for webhook verification (optional)
 */
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');

  if (challenge) {
    // Webhook verification challenge (similar to Slack, Discord, etc.)
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    {
      service: 'Automated Gather Progress Webhook',
      status: 'active',
      version: '1.0.0',
    },
    { status: 200 }
  );
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Signature',
    },
  });
}
