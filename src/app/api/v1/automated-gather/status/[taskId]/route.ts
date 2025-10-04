import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/lib/task-service/client';
import {
  AutomatedGatherStatusResponse,
  ErrorResponse,
  TaskStatus,
  ProgressUpdate,
} from '../../types';

/**
 * GET /api/v1/automated-gather/status/[taskId]
 * Check the status of an automated gather task
 */
export async function GET(
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

    // Query Celery for task status
    const statusResult = await taskService.getTaskStatus(taskId);

    if (!statusResult.success) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'TASK_NOT_FOUND',
          message: statusResult.error || 'Task not found or status unavailable',
          details: statusResult.details,
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    const taskStatus = statusResult.status as TaskStatus;

    // Calculate progress percentage
    const current = taskStatus.current || 0;
    const total = taskStatus.total || 100;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    // Build progress updates array
    const updates: ProgressUpdate[] = [];
    if (taskStatus.meta?.progress) {
      updates.push(...taskStatus.meta.progress);
    }

    // Construct response
    const response: AutomatedGatherStatusResponse = {
      taskId,
      status: taskStatus.state,
      progress: {
        current,
        total,
        percentage,
      },
      result: taskStatus.result,
      updates,
      startTime: taskStatus.meta?.startTime,
      endTime: taskStatus.meta?.endTime,
    };

    // Set appropriate HTTP status based on task state
    let httpStatus = 200;
    if (taskStatus.state === 'FAILURE') {
      httpStatus = 500;
    } else if (taskStatus.state === 'REVOKED') {
      httpStatus = 410; // Gone
    }

    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    console.error('Error checking task status:', error);

    return NextResponse.json<ErrorResponse>(
      {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while checking task status',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
