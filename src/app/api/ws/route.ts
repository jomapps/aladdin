/**
 * WebSocket API Route Handler for Next.js
 *
 * Provides WebSocket endpoint at /api/ws for real-time agent event streaming.
 * Integrates with Next.js API routes to handle WebSocket upgrade requests.
 *
 * @see {@link /docs/architecture/dynamic-agents-architecture.md} Section 5: Real-time Event Streaming
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWebSocketServer } from '@/lib/agents/events/websocket-server'

/**
 * GET handler for WebSocket upgrade
 *
 * This endpoint handles WebSocket upgrade requests from clients.
 * Note: In production, you may want to run WebSocket server separately
 * or use a dedicated WebSocket hosting solution.
 *
 * @example Client Usage:
 * ```typescript
 * const ws = new WebSocket('ws://localhost:3000/api/ws');
 *
 * ws.addEventListener('open', () => {
 *   // Subscribe to execution
 *   ws.send(JSON.stringify({
 *     type: 'subscribe',
 *     executionId: 'exec-123'
 *   }));
 * });
 *
 * ws.addEventListener('message', (event) => {
 *   const data = JSON.parse(event.data);
 *   if (data.type === 'event') {
 *     console.log('Agent event:', data.event);
 *   }
 * });
 * ```
 */
export async function GET(req: NextRequest) {
  try {
    // Check if this is a WebSocket upgrade request
    const upgrade = req.headers.get('upgrade')
    if (upgrade?.toLowerCase() !== 'websocket') {
      return NextResponse.json(
        {
          error: 'WebSocket upgrade required',
          message: 'This endpoint only accepts WebSocket connections',
          usage: {
            protocol: 'ws:// or wss://',
            endpoint: '/api/ws',
            example: 'ws://localhost:3000/api/ws',
          },
        },
        { status: 426 } // Upgrade Required
      )
    }

    // Initialize WebSocket server if not already running
    const server = getWebSocketServer({
      port: parseInt(process.env.WS_PORT || '3001'),
      redisUrl: process.env.REDIS_URL,
      heartbeatInterval: 30000,
      clientTimeout: 60000,
      verbose: process.env.NODE_ENV === 'development',
    })

    // Ensure server is started
    const stats = server.getStats()
    if (!stats.isRunning) {
      await server.start()
    }

    // Return information about the WebSocket server
    // Note: Actual upgrade happens at the WebSocket server level
    return NextResponse.json({
      message: 'WebSocket server is running',
      wsUrl: `ws://localhost:${process.env.WS_PORT || '3001'}`,
      stats: {
        clientCount: stats.clientCount,
        subscriptionCount: stats.subscriptionCount,
      },
      protocol: {
        subscribe: {
          type: 'subscribe',
          executionId: 'string (optional)',
          conversationId: 'string (optional)',
        },
        unsubscribe: {
          type: 'unsubscribe',
          executionId: 'string (optional)',
          conversationId: 'string (optional)',
        },
        ping: {
          type: 'ping',
        },
      },
      eventTypes: [
        'orchestration-start',
        'orchestration-complete',
        'department-start',
        'department-complete',
        'agent-start',
        'agent-thinking',
        'agent-complete',
        'tool-call',
        'tool-result',
        'quality-check',
        'review-status',
        'error',
      ],
    })
  } catch (error) {
    console.error('[WebSocket API] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST handler - not supported for WebSocket endpoint
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'This endpoint only accepts WebSocket connections via GET with Upgrade header',
    },
    { status: 405 }
  )
}

/**
 * Health check endpoint
 *
 * Can be used to check if WebSocket server is running without upgrading.
 */
export async function HEAD(req: NextRequest) {
  try {
    const server = getWebSocketServer()
    const stats = server.getStats()

    return new NextResponse(null, {
      status: stats.isRunning ? 200 : 503,
      headers: {
        'X-WS-Server-Status': stats.isRunning ? 'running' : 'stopped',
        'X-WS-Client-Count': stats.clientCount.toString(),
        'X-WS-Subscription-Count': stats.subscriptionCount.toString(),
      },
    })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}
