/**
 * Video Export API Route
 * POST /api/v1/projects/[id]/export
 */

import { NextRequest, NextResponse } from 'next/server'
import { videoExporter } from '@/lib/export/videoExporter'
import { hasPermission, Permission } from '@/lib/collaboration/accessControl'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { videoId, format, quality, resolution, fps, options } = body

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

    // Create export job
    const job = await videoExporter.exportVideo({
      videoId,
      format: format || 'mp4',
      quality: quality || 'high',
      resolution,
      fps,
      userId,
      options,
    })

    return NextResponse.json(job)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
