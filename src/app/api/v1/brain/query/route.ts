import { NextRequest, NextResponse } from 'next/server';
import { BrainClient } from '@/lib/brain/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/v1/brain/query
 * Performs semantic search using Brain service
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
    const { projectId, query, type, limit = 10 } = body;

    // Validation
    if (!projectId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, query' },
        { status: 400 }
      );
    }

    if (typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query must be a non-empty string' },
        { status: 400 }
      );
    }

    if (limit && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
      return NextResponse.json(
        { error: 'Limit must be a number between 1 and 100' },
        { status: 400 }
      );
    }

    // Initialize Brain client
    const brainClient = new BrainClient({
      baseUrl: process.env.BRAIN_SERVICE_URL || 'http://localhost:8000',
      timeout: 30000,
      retries: 2,
    });

    // Perform semantic search
    const results = await brainClient.semanticSearch({
      projectId,
      query: query.trim(),
      type,
      limit,
    });

    // Return search results with similarity scores
    return NextResponse.json({
      results: results.map(node => ({
        id: node.id,
        type: node.type,
        properties: node.properties,
        similarity: node.similarity,
        metadata: node.metadata,
      })),
      query: query.trim(),
      projectId,
      count: results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Brain semantic search error:', error);

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
      { error: 'Semantic search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
