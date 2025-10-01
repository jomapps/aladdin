import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

interface DepartmentMetrics {
  id: string
  name: string
  score: number
  trend: 'up' | 'down' | 'stable'
  alerts: number
  lastUpdated: Date
}

/**
 * GET /api/v1/projects/[id]/quality/metrics
 * Fetch quality metrics for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'

    const payload = await getPayloadHMR({ config: configPromise })

    // Verify project exists
    const project = await payload.findByID({
      collection: 'projects',
      id,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // For now, return default departments with 0 values
    // TODO: Implement real quality metrics calculation
    const defaultDepartments: DepartmentMetrics[] = [
      { id: 'story', name: 'Story', score: 0, trend: 'stable', alerts: 0, lastUpdated: new Date() },
      { id: 'character', name: 'Character', score: 0, trend: 'stable', alerts: 0, lastUpdated: new Date() },
      { id: 'visual', name: 'Visual', score: 0, trend: 'stable', alerts: 0, lastUpdated: new Date() },
      { id: 'video', name: 'Video', score: 0, trend: 'stable', alerts: 0, lastUpdated: new Date() },
      { id: 'audio', name: 'Audio', score: 0, trend: 'stable', alerts: 0, lastUpdated: new Date() },
      { id: 'image-quality', name: 'Image Quality', score: 0, trend: 'stable', alerts: 0, lastUpdated: new Date() },
      { id: 'production', name: 'Production', score: 0, trend: 'stable', alerts: 0, lastUpdated: new Date() },
    ]

    // TODO: Calculate real metrics based on:
    // - Episodes completion status
    // - Media quality scores
    // - Agent task results
    // - Brain service validation results
    // - Export job success rates

    return NextResponse.json({
      metrics: defaultDepartments,
      timeRange,
      projectId: id,
      lastUpdated: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Failed to fetch quality metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
