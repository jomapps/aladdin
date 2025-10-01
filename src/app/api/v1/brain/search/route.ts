import { NextRequest, NextResponse } from 'next/server';
import { BrainClient } from '@/lib/brain/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/v1/brain/search
 * Performs similarity search in Neo4j graph
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const query = searchParams.get('query');
    const type = searchParams.get('type');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Validation
    if (!projectId || !query) {
      return NextResponse.json(
        { error: 'Missing required query parameters: projectId, query' },
        { status: 400 }
      );
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter must be a non-empty string' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
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

    // Search similar content
    const results = await brainClient.searchSimilar({
      projectId,
      query: query.trim(),
      type: type || undefined,
      limit,
    });

    // Return similarity search results
    return NextResponse.json({
      results: results.map(item => ({
        id: item.id,
        type: item.type,
        content: item.content,
        similarity: item.similarity,
        properties: item.properties,
        relationships: item.relationships,
      })),
      query: query.trim(),
      projectId,
      type: type || 'all',
      count: results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Brain similarity search error:', error);

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
      { error: 'Similarity search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
