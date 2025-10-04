import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/lib/task-service/client';
import {
  AutomatedGatherStartRequest,
  AutomatedGatherStartResponse,
  ErrorResponse,
  AUTOMATED_GATHER_CONSTRAINTS,
} from '../types';

/**
 * POST /api/v1/automated-gather/start
 * Start an automated gather task
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AutomatedGatherStartRequest = await request.json();

    // Validate required fields
    if (!body.projectId) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'VALIDATION_ERROR',
          message: 'projectId is required',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    if (typeof body.gatherCount !== 'number') {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'VALIDATION_ERROR',
          message: 'gatherCount must be a number',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Validate gather count
    if (
      body.gatherCount < AUTOMATED_GATHER_CONSTRAINTS.MIN_GATHER_COUNT ||
      body.gatherCount > AUTOMATED_GATHER_CONSTRAINTS.MAX_GATHER_COUNT
    ) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'VALIDATION_ERROR',
          message: `gatherCount must be between ${AUTOMATED_GATHER_CONSTRAINTS.MIN_GATHER_COUNT} and ${AUTOMATED_GATHER_CONSTRAINTS.MAX_GATHER_COUNT}`,
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Validate save interval if provided
    if (body.options?.saveInterval !== undefined) {
      if (
        body.options.saveInterval < AUTOMATED_GATHER_CONSTRAINTS.MIN_SAVE_INTERVAL ||
        body.options.saveInterval > AUTOMATED_GATHER_CONSTRAINTS.MAX_SAVE_INTERVAL
      ) {
        return NextResponse.json<ErrorResponse>(
          {
            error: 'VALIDATION_ERROR',
            message: `saveInterval must be between ${AUTOMATED_GATHER_CONSTRAINTS.MIN_SAVE_INTERVAL} and ${AUTOMATED_GATHER_CONSTRAINTS.MAX_SAVE_INTERVAL}`,
            statusCode: 400,
          },
          { status: 400 }
        );
      }
    }

    // Get user ID from session/auth if needed
    // const userId = await getUserIdFromRequest(request);

    // Submit task to Celery via task service
    const taskResult = await taskService.submitTask('automated_gather_creation', {
      projectId: body.projectId,
      gatherCount: body.gatherCount,
      options: {
        saveInterval: body.options?.saveInterval || 5,
        errorRecovery: body.options?.errorRecovery !== false,
        notificationPreferences: body.options?.notificationPreferences || {
          onComplete: true,
          onError: true,
          onProgress: false,
        },
      },
    });

    if (!taskResult.success) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'TASK_SUBMISSION_FAILED',
          message: taskResult.error || 'Failed to submit task to queue',
          details: taskResult.details,
          statusCode: 500,
        },
        { status: 500 }
      );
    }

    // Calculate estimated duration (rough estimate: 30 seconds per gather)
    const estimatedDuration = body.gatherCount * 30;

    const response: AutomatedGatherStartResponse = {
      taskId: taskResult.taskId!,
      status: 'pending',
      message: 'Automated gather task started successfully',
      data: {
        projectId: body.projectId,
        gatherCount: body.gatherCount,
        estimatedDuration,
      },
    };

    return NextResponse.json(response, { status: 202 });
  } catch (error) {
    console.error('Error starting automated gather:', error);

    return NextResponse.json<ErrorResponse>(
      {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
