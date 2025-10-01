/**
 * Export Download API Route
 * GET /api/v1/projects/[id]/export/[jobId]/download
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

    // Check download permission
    const canDownload = await hasPermission({
      userId,
      projectId,
      permission: Permission.EXPORT_DOWNLOAD,
    })

    if (!canDownload) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get job
    const job = await videoExporter.getJob(jobId)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'completed') {
      return NextResponse.json({ error: 'Export not completed yet' }, { status: 400 })
    }

    if (!job.outputUrl) {
      return NextResponse.json({ error: 'Download URL not available' }, { status: 500 })
    }

    // Redirect to download URL
    return NextResponse.redirect(job.outputUrl)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
