/**
 * Task Mode API Route
 * Handles task execution requests with @codebuff/sdk
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { handleTask } from '@/lib/orchestrator/taskHandler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Increase timeout for task execution
export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: request as any })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 2. Parse request
    const body = await request.json()
    const {
      content,
      projectId,
      conversationId,
      agentId,
      departmentSlug,
    } = body

    if (!content || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    console.log('[Task API] Processing task:', {
      projectId,
      conversationId,
      agentId,
      departmentSlug,
    })

    // 3. Validate project access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 4. Handle task
    const result = await handleTask({
      content,
      projectId,
      conversationId,
      userId: user.id,
      agentId,
      departmentSlug,
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      taskId: result.taskId,
      message: result.message,
      progress: result.progress,
      executionId: result.executionId,
    })
  } catch (error: any) {
    console.error('[Task API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'TASK_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
