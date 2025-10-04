import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/lib/task-service/client';
import {
  AutomatedGatherCancelResponse,
  ErrorResponse,
  TaskStatus,
} from '../../types';

/**
 * DELETE /api/v1/automated-gather/cancel/[taskId]
 * Cancel a running automated gather task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    if (!taskId) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'VALIDATION_ERROR',
          message: 'taskId is required',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // First, check the current status to preserve partial results
    const statusResult = await taskService.getTaskStatus(taskId);

    if (!statusResult.success) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'TASK_NOT_FOUND',
          message: 'Task not found',
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    const taskStatus = statusResult.status as TaskStatus;

    // Check if task is already completed
    if (taskStatus.state === 'SUCCESS') {
      const response: AutomatedGatherCancelResponse = {
        taskId,
        status: 'already_completed',
        message: 'Task has already completed successfully',
        partialResults: taskStatus.result?.results
          ? {
              completedIterations: taskStatus.result.completedIterations,
              results: taskStatus.result.results.map((r) => ({
                iterationNumber: r.iterationNumber,
                gatherDataId: r.gatherDataId,
              })),
            }
          : undefined,
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Check if task is already cancelled
    if (taskStatus.state === 'REVOKED') {
      const response: AutomatedGatherCancelResponse = {
        taskId,
        status: 'already_completed',
        message: 'Task has already been cancelled',
        partialResults: taskStatus.result?.results
          ? {
              completedIterations: taskStatus.result.completedIterations,
              results: taskStatus.result.results.map((r) => ({
                iterationNumber: r.iterationNumber,
                gatherDataId: r.gatherDataId,
              })),
            }
          : undefined,
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Preserve partial results before cancellation
    const partialResults = taskStatus.result?.results
      ? {
          completedIterations: taskStatus.result.completedIterations || 0,
          results: taskStatus.result.results.map((r) => ({
            iterationNumber: r.iterationNumber,
            gatherDataId: r.gatherDataId,
          })),
        }
      : undefined;

    // Revoke the Celery task
    const cancelResult = await taskService.cancelTask(taskId);

    if (!cancelResult.success) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'CANCELLATION_FAILED',
          message: cancelResult.error || 'Failed to cancel task',
          details: cancelResult.details,
          statusCode: 500,
        },
        { status: 500 }
      );
    }

    const response: AutomatedGatherCancelResponse = {
      taskId,
      status: 'cancelled',
      message: 'Task cancelled successfully',
      partialResults,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error cancelling task:', error);

    return NextResponse.json<ErrorResponse>(
      {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while cancelling task',
        details: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
