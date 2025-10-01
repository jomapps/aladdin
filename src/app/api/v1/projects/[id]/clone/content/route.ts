/**
 * Clone Content API Route
 * POST /api/v1/projects/[id]/clone/content
 */

import { NextRequest, NextResponse } from 'next/server'
import { contentCloner } from '@/lib/clone/cloneContent'
import { hasPermission, Permission } from '@/lib/collaboration/accessControl'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: targetProjectId } = await params
    const body = await request.json()
    const { sourceProjectId, contentType, documentId, options } = body

    // Get user from session (simplified - implement auth)
    const userId = request.headers.get('x-user-id') || 'system'

    // Check permissions
    const canRead = await hasPermission({
      userId,
      projectId: sourceProjectId,
      permission: Permission.CONTENT_READ,
    })

    const canWrite = await hasPermission({
      userId,
      projectId: targetProjectId,
      permission: Permission.CONTENT_CREATE,
    })

    if (!canRead || !canWrite) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Clone content
    const result = await contentCloner.cloneContent({
      sourceProjectId,
      targetProjectId,
      contentType,
      documentId,
      options,
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Clone failed', details: result.errors }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
