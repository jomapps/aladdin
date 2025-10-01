/**
 * Batch Clone API Route
 * POST /api/v1/projects/[id]/clone/batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { contentCloner } from '@/lib/clone/cloneContent';
import { hasPermission, Permission } from '@/lib/collaboration/accessControl';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetProjectId = params.id;
    const body = await request.json();
    const { sourceProjectId, items, options } = body;

    const userId = request.headers.get('x-user-id') || 'system';

    // Check permissions
    const canRead = await hasPermission({
      userId,
      projectId: sourceProjectId,
      permission: Permission.CONTENT_READ,
    });

    const canWrite = await hasPermission({
      userId,
      projectId: targetProjectId,
      permission: Permission.CONTENT_CREATE,
    });

    if (!canRead || !canWrite) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Clone items in parallel
    const results = await Promise.all(
      items.map((item: any) =>
        contentCloner.cloneContent({
          sourceProjectId,
          targetProjectId,
          contentType: item.contentType,
          documentId: item.documentId,
          options: { ...options, ...item.options },
        })
      )
    );

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
