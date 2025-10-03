import { NextRequest, NextResponse } from 'next/server';
import { BrainClient } from '@/lib/brain/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/v1/brain/nodes
 * Creates a new node in the Neo4j graph
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
    const { projectId, type, properties, relationships } = body;

    // Validation
    if (!projectId || !type || !properties) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, type, properties' },
        { status: 400 }
      );
    }

    // Initialize Brain client using singleton
    const { getBrainClient } = await import('@/lib/brain/client');
    const brainClient = getBrainClient();

    // Add node to graph
    const node = await brainClient.addNode({
      projectId,
      type,
      properties,
      relationships: relationships || [],
    });

    return NextResponse.json({
      success: true,
      node: {
        id: node.id,
        type: node.type,
        properties: node.properties,
        relationships: node.relationships,
      },
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error) {
    console.error('Brain node creation error:', error);

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
      { error: 'Node creation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/brain/nodes
 * Retrieves a node from the Neo4j graph by ID
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
    const nodeId = searchParams.get('id');
    const projectId = searchParams.get('projectId');

    // Validation
    if (!nodeId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required query parameters: id, projectId' },
        { status: 400 }
      );
    }

    // Initialize Brain client using singleton
    const { getBrainClient } = await import('@/lib/brain/client');
    const brainClient = getBrainClient();

    // Retrieve node
    const node = await brainClient.getNode({
      projectId,
      nodeId,
    });

    if (!node) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      node: {
        id: node.id,
        type: node.type,
        properties: node.properties,
        relationships: node.relationships,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Brain node retrieval error:', error);

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
      { error: 'Node retrieval failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/brain/nodes
 * Removes a node from the Neo4j graph
 */
export async function DELETE(request: NextRequest) {
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
    const nodeId = searchParams.get('id');
    const projectId = searchParams.get('projectId');

    // Validation
    if (!nodeId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required query parameters: id, projectId' },
        { status: 400 }
      );
    }

    // Initialize Brain client using singleton
    const { getBrainClient } = await import('@/lib/brain/client');
    const brainClient = getBrainClient();

    // Delete node
    await brainClient.deleteNode({
      projectId,
      nodeId,
    });

    return NextResponse.json({
      success: true,
      message: 'Node deleted successfully',
      nodeId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Brain node deletion error:', error);

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
      { error: 'Node deletion failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
