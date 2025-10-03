/**
 * Streaming API Route
 * Server-Sent Events (SSE) for real-time LLM token streaming
 */

import { NextRequest } from 'next/server'
import { createSSEStream, streamLLMTokens } from '@/lib/orchestrator/streaming'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const conversationId = searchParams.get('conversationId')
  const mode = searchParams.get('mode') as 'chat' | 'query' | 'task' | 'data'

  if (!conversationId || !mode) {
    return new Response('Missing conversationId or mode', { status: 400 })
  }

  // Create SSE stream
  const { stream, send, close } = createSSEStream()

  // Set SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  })

  // Start streaming in background
  ;(async () => {
    try {
      const payload = await getPayload({ config: await configPromise })

      // Load conversation
      const conversation = await payload.findByID({
        collection: 'conversations',
        id: conversationId,
      })

      if (!conversation) {
        send({
          type: 'error',
          data: { message: 'Conversation not found' },
          timestamp: Date.now(),
        })
        close()
        return
      }

      // Get messages
      const messages = conversation.messages || []
      const lastUserMessage = messages
        .filter((msg: any) => msg.role === 'user')
        .pop()

      if (!lastUserMessage) {
        send({
          type: 'error',
          data: { message: 'No user message found' },
          timestamp: Date.now(),
        })
        close()
        return
      }

      // Build LLM messages
      const llmMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Stream tokens
      await streamLLMTokens(llmMessages, {
        onToken: (token) => {
          send({
            type: 'token',
            data: { token },
            timestamp: Date.now(),
          })
        },
        onComplete: (fullText) => {
          send({
            type: 'complete',
            data: { message: fullText },
            timestamp: Date.now(),
          })
          close()
        },
        onError: (error) => {
          send({
            type: 'error',
            data: { message: error.message },
            timestamp: Date.now(),
          })
          close()
        },
      })
    } catch (error: any) {
      send({
        type: 'error',
        data: { message: error.message },
        timestamp: Date.now(),
      })
      close()
    }
  })()

  return new Response(stream, { headers })
}

/**
 * Stream task progress updates
 */
async function streamTaskProgress(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  taskId: string,
  payload: any,
  isOpenFn: () => boolean,
) {
  let lastStatus = ''
  let pollCount = 0
  const maxPolls = 120 // 2 minutes max (1 second intervals)

  while (isOpenFn() && pollCount < maxPolls) {
    try {
      // Get current task status
      const task = await payload.findByID({
        collection: 'agent-tasks',
        id: taskId,
      })

      if (!task) {
        sendEvent(controller, encoder, {
          type: 'error',
          error: 'Task not found',
        })
        break
      }

      // Send progress update if status changed
      if (task.status !== lastStatus) {
        lastStatus = task.status

        sendEvent(controller, encoder, {
          type: 'progress',
          stage: task.status,
          current: task.progress?.current || 0,
          total: task.progress?.total || 1,
          message: getStatusMessage(task.status),
        })
      }

      // Send department updates
      if (task.departmentResults && task.departmentResults.length > 0) {
        sendEvent(controller, encoder, {
          type: 'departments',
          departments: task.departmentResults,
        })
      }

      // Check if task is complete
      if (task.status === 'completed' || task.status === 'failed') {
        sendEvent(controller, encoder, {
          type: 'task_complete',
          taskId,
          status: task.status,
          quality: task.quality,
          recommendation: task.recommendation,
        })
        break
      }

      // Wait before next poll
      await sleep(1000)
      pollCount++
    } catch (pollError) {
      console.error('[Stream API] Poll error:', pollError)
      // Continue polling despite errors
      await sleep(1000)
      pollCount++
    }
  }

  if (pollCount >= maxPolls) {
    sendEvent(controller, encoder, {
      type: 'timeout',
      message: 'Task exceeded maximum polling time',
    })
  }
}

/**
 * Send SSE event
 */
function sendEvent(controller: ReadableStreamDefaultController, encoder: TextEncoder, data: any) {
  try {
    const json = JSON.stringify(data)
    const message = `data: ${json}\n\n`
    controller.enqueue(encoder.encode(message))
  } catch (error) {
    console.error('[Stream API] Failed to send event:', error)
  }
}

/**
 * Get human-readable status message
 */
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    queued: 'Task queued for processing',
    in_progress: 'Analyzing task and routing to departments',
    completed: 'Task completed successfully',
    failed: 'Task failed',
  }
  return messages[status] || status
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
