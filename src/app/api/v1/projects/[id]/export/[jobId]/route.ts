/**
 * Export Job Status API Route
 * GET /api/v1/projects/[id]/export/[jobId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { videoExporter } from '@/lib/export/videoExporter'
import { hasPermission, Permission } from '@/lib/collaboration/accessControl'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> },
) {
  try {
    const { id: projectId, jobId } = await params

    const userId = request.headers.get('x-user-id') || 'system'

    // Check read permission
    const canRead = await hasPermission({
      userId,
      projectId,
      permission: Permission.PROJECT_READ,
    })

    if (!canRead) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get job status
    const status = await videoExporter.getJobStatus(jobId)

    return NextResponse.json(status)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Job not found' }, { status: 404 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> },
) {
  try {
    const { id: projectId, jobId } = await params

    const userId = request.headers.get('x-user-id') || 'system'

    // Check export permission
    const canExport = await hasPermission({
      userId,
      projectId,
      permission: Permission.EXPORT_CREATE,
    })

    if (!canExport) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Cancel job
    await videoExporter.cancelJob(jobId)

    return NextResponse.json({ message: 'Job cancelled' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
