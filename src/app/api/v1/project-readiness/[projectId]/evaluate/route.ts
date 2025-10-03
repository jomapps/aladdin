/**
 * Evaluation Submission API Route
 *
 * POST /api/v1/project-readiness/[projectId]/evaluate
 * Submit a department for evaluation
 */

import { NextRequest, NextResponse } from 'next/server'
import { sequentialEvaluator } from '@/lib/evaluation/sequential-evaluator'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { departmentNumber } = body

    if (!departmentNumber || typeof departmentNumber !== 'number') {
      return NextResponse.json(
        { error: 'departmentNumber is required and must be a number' },
        { status: 400 },
      )
    }

    // Submit evaluation
    const result = await sequentialEvaluator.evaluateDepartment(projectId, departmentNumber)

    return NextResponse.json({
      taskId: result.taskId,
      department: result.department,
      status: result.status,
      message: 'Evaluation started successfully',
    })
  } catch (error) {
    console.error('Failed to start evaluation:', error)
    return NextResponse.json(
      {
        error: 'Failed to start evaluation',
        message: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
