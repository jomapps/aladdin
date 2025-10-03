/**
 * Cancel Task API Route
 *
 * DELETE /api/v1/project-readiness/[projectId]/task/[taskId]/cancel
 * Cancel an in-progress evaluation task
 */

import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '@/lib/task-service/client'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> },
) {
  try {
    const { taskId, projectId } = await params

    // Cancel task in task service
    await taskService.cancelTask(taskId)

    // Update evaluation record status
    const payload = await getPayload({ config })

    const evaluation = await payload.find({
      collection: 'project-readiness',
      where: {
        and: [{ taskId: { equals: taskId } }, { projectId: { equals: projectId } }],
      },
      limit: 1,
    })

    if (evaluation.docs.length > 0) {
      await payload.update({
        collection: 'project-readiness',
        id: evaluation.docs[0].id,
        data: {
          status: 'failed', // Mark as failed when cancelled
        },
      })
    }

    return NextResponse.json({
      cancelled: true,
      taskId,
      message: 'Task cancelled successfully',
    })
  } catch (error) {
    console.error('Failed to cancel task:', error)
    return NextResponse.json(
      {
        error: 'Failed to cancel task',
        message: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
