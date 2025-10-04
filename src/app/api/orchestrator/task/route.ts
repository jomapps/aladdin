/**
 * Task Execution API - Complex Task Orchestration
 * Coordinates multiple dynamic agents via department system
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { TaskExecutionRequestSchema, type TaskExecutionResponse } from '../types'
import { handleUserRequest } from '@/lib/agents/orchestrator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    // 2. Validate request
    const body = await req.json()
    const validationResult = TaskExecutionRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { task, projectId, conversationId, priority, departments, context } =
      validationResult.data

    console.log('[Task Execution] Starting task:', { task, projectId, priority })

    // 3. Get project for context
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 },
      )
    }

    // 4. Create task record in database for tracking
    const taskRecord = await payload.create({
      collection: 'agent-tasks',
      data: {
        project: projectId,
        user: user.id,
        description: task,
        priority,
        status: 'queued',
        departments: departments || [],
        context: context || {},
        createdAt: new Date(),
      },
    })

    const taskId = taskRecord.id

    console.log('[Task Execution] Task created:', taskId)

    // 5. Execute orchestrator asynchronously
    // Don't await - return immediately and update via WebSocket
    executeTaskAsync(taskId, task, project.slug, payload)

    // 6. Build WebSocket URL for real-time updates
    const websocketUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace('http', 'ws')}/api/ws?taskId=${taskId}`

    // 7. Return initial response
    const response: TaskExecutionResponse = {
      taskId,
      status: 'queued',
      departments: [],
      progress: {
        current: 0,
        total: 1,
        percentage: 0,
      },
      quality: {
        overall: 0,
        consistency: 0,
        completeness: 0,
      },
      websocketUrl,
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes estimate
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Task Execution API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'TASK_ERROR',
        details: error.stack,
      },
      { status: 500 },
    )
  }
}

/**
 * GET endpoint to check task status
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required', code: 'MISSING_TASK_ID' },
        { status: 400 },
      )
    }

    // Get task from database
    const task = await payload.findByID({
      collection: 'agent-tasks',
      id: taskId,
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found', code: 'TASK_NOT_FOUND' }, { status: 404 })
    }

    // Build response from task record
    const response: TaskExecutionResponse = {
      taskId: task.id,
      status: task.status,
      departments: task.departmentResults || [],
      progress: task.progress || {
        current: 0,
        total: 1,
        percentage: 0,
      },
      results: task.results || [],
      quality: task.quality || {
        overall: 0,
        consistency: 0,
        completeness: 0,
      },
      recommendation: task.recommendation,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Task Status API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'STATUS_ERROR',
        details: error.stack,
      },
      { status: 500 },
    )
  }
}

/**
 * Execute task asynchronously with orchestrator
 */
async function executeTaskAsync(taskId: string, task: string, projectSlug: string, payload: any) {
  try {
    console.log('[Task Execution] Async execution started:', taskId)

    // Update status to in_progress
    await payload.update({
      collection: 'agent-tasks',
      id: taskId,
      data: {
        status: 'in_progress',
        startedAt: new Date(),
      },
    })

    // Execute orchestrator
    const result = await handleUserRequest({
      projectSlug,
      userPrompt: task,
    })

    console.log('[Task Execution] Orchestrator complete:', {
      taskId,
      quality: result.overallQuality,
    })

    // Map orchestrator result to task format
    const departments = result.departmentReports.map((dept) => ({
      department: dept.department,
      status: dept.status,
      relevance: dept.relevance,
      outputs: dept.outputs.map((output) => ({
        agentId: output.specialistAgentId,
        agentName: output.specialistAgentId,
        output: output.output,
        qualityScore: output.overallScore,
        issues: output.issues,
        suggestions: output.suggestions,
        decision: output.decision,
      })),
      quality: dept.departmentQuality,
      issues: dept.issues,
      suggestions: dept.suggestions,
    }))

    // Update task with results
    await payload.update({
      collection: 'agent-tasks',
      id: taskId,
      data: {
        status: 'completed',
        departmentResults: departments,
        quality: {
          overall: result.overallQuality,
          consistency: result.consistency,
          completeness: result.completeness,
        },
        recommendation: result.recommendation,
        progress: {
          current: 1,
          total: 1,
          percentage: 100,
        },
        completedAt: new Date(),
      },
    })

    console.log('[Task Execution] Task completed successfully:', taskId)
  } catch (error: any) {
    console.error('[Task Execution] Async execution failed:', error)

    // Update task with error
    await payload.update({
      collection: 'agent-tasks',
      id: taskId,
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    })
  }
}
