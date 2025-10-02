/**
 * Task Status API Route
 *
 * GET /api/v1/project-readiness/[projectId]/task/[taskId]/status
 * Get current status of evaluation task from tasks.ft.tc
 */

import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '@/lib/task-service/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } },
) {
  try {
    const { taskId } = params

    // Get task status from task service
    const status = await taskService.getTaskStatus(taskId)

    return NextResponse.json(status)
  } catch (error) {
    console.error('Failed to get task status:', error)
    return NextResponse.json(
      {
        error: 'Failed to get task status',
        message: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
