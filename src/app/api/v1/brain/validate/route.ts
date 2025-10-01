import { NextRequest, NextResponse } from 'next/server';
import { BrainClient } from '@/lib/brain/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/v1/brain/validate
 * Validates content quality using Brain service
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, type, data } = body;

    // Validation
    if (!projectId || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, type, data' },
        { status: 400 }
      );
    }

    // Initialize Brain client
    const brainClient = new BrainClient({
      baseUrl: process.env.BRAIN_SERVICE_URL || 'http://localhost:8000',
      timeout: 30000,
      retries: 2,
    });

    // Validate content
    const validation = await brainClient.validateContent({
      projectId,
      type,
      data,
    });

    // Return validation results
    return NextResponse.json({
      qualityRating: validation.qualityRating,
      brainValidated: validation.brainValidated,
      contradictions: validation.contradictions || [],
      suggestions: validation.suggestions || [],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Brain validation error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Brain service timeout', details: error.message },
          { status: 504 }
        );
      }
      if (error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Brain service unavailable', details: error.message },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Validation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
