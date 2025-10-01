/**
 * Streaming API - Server-Sent Events for Real-time Updates
 * Provides token streaming for LLM responses and progress updates
 */

import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET endpoint for SSE streaming
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Get parameters
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode') // 'query', 'chat', etc.
    const taskId = searchParams.get('taskId')
    const conversationId = searchParams.get('conversationId')

    console.log('[Stream API] Starting stream:', { mode, taskId })

    // 3. Create readable stream
    const encoder = new TextEncoder()
    let isOpen = true

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connection event
          sendEvent(controller, encoder, {
            type: 'connected',
            timestamp: new Date(),
          })

          // For task mode, poll task status
          if (mode === 'task' && taskId) {
            await streamTaskProgress(controller, encoder, taskId, payload, () => isOpen)
          }

          // For query/chat modes, would stream tokens
          // This would require LLM client to support streaming
          // Placeholder for now
          if (mode === 'query' || mode === 'chat') {
            sendEvent(controller, encoder, {
              type: 'info',
              message: 'Streaming support coming soon',
            })
          }

          // Send complete event
          if (isOpen) {
            sendEvent(controller, encoder, {
              type: 'complete',
            })
          }

          controller.close()
        } catch (error: any) {
          console.error('[Stream API] Error:', error)
          sendEvent(controller, encoder, {
            type: 'error',
            error: error.message,
          })
          controller.close()
        }
      },

      cancel() {
        console.log('[Stream API] Client disconnected')
        isOpen = false
      },
    })

    // 4. Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('[Stream API] Setup error:', error)
    return new Response('Internal server error', { status: 500 })
  }
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
