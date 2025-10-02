/**
 * Department Sync API Route
 *
 * POST /api/v1/project-readiness/[projectId]/department/[departmentId]/sync
 * Sync completed task results to database
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { taskService } from '@/lib/task-service/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string; departmentId: string } },
) {
  try {
    const { projectId, departmentId } = params
    const payload = await getPayload({ config })

    // Get current evaluation record
    const evaluation = await payload.find({
      collection: 'project-readiness',
      where: {
        and: [
          { projectId: { equals: projectId } },
          { departmentId: { equals: departmentId } },
        ],
      },
      limit: 1,
      sort: '-updatedAt',
    })

    if (evaluation.docs.length === 0) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 })
    }

    const evalDoc = evaluation.docs[0]

    if (!evalDoc.taskId) {
      return NextResponse.json({ error: 'No task ID found' }, { status: 400 })
    }

    // Get task status
    const taskStatus = await taskService.getTaskStatus(evalDoc.taskId)

    if (taskStatus.status === 'completed' && taskStatus.result) {
      // Update with completed results
      await payload.update({
        collection: 'project-readiness',
        id: evalDoc.id,
        data: {
          status: 'completed',
          rating: taskStatus.result.rating,
          evaluationResult: taskStatus.result.evaluation_result,
          evaluationSummary: taskStatus.result.evaluation_summary,
          issues: taskStatus.result.issues?.map((i) => ({ issue: i })) || [],
          suggestions:
            taskStatus.result.suggestions?.map((s) => ({ suggestion: s })) || [],
          evaluationDuration: taskStatus.result.processing_time,
          iterationCount: taskStatus.result.iteration_count,
          lastEvaluatedAt: new Date().toISOString(),
        },
      })

      return NextResponse.json({
        synced: true,
        rating: taskStatus.result.rating,
        status: 'completed',
      })
    } else if (taskStatus.status === 'failed') {
      // Update with failed status
      await payload.update({
        collection: 'project-readiness',
        id: evalDoc.id,
        data: {
          status: 'failed',
        },
      })

      return NextResponse.json({
        synced: true,
        status: 'failed',
        error: taskStatus.error,
      })
    }

    // Still in progress
    return NextResponse.json({
      synced: false,
      status: taskStatus.status,
    })
  } catch (error) {
    console.error('Failed to sync department:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync department',
        message: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
