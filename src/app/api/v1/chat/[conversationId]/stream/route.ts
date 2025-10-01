/**
 * SSE Streaming API Route
 * Server-Sent Events for real-time updates
 */

import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const payload = await getPayload({ config: await configPromise })
  const { user } = await payload.auth({ req: req as any })

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { conversationId } = await params

  // Verify conversation exists and user has access
  const conversation = await payload.findByID({
    collection: 'conversations',
    id: conversationId,
  })

  if (!conversation) {
    return new Response('Conversation not found', { status: 404 })
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', conversationId })}\n\n`),
      )

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000) // Every 30 seconds

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
