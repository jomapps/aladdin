import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
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
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'

    const payload = await getPayload({ config: await configPromise })

    // Verify project exists
    const project = await payload.findByID({
      collection: 'projects',
      id,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch all departments from database
    const departmentsResult = await payload.find({
      collection: 'departments',
      limit: 100,
      sort: 'priority',
    })

    // Map departments to metrics format
    const departmentMetrics: DepartmentMetrics[] = departmentsResult.docs.map((dept: any) => ({
      id: dept.slug,
      name: dept.name,
      score: dept.performance?.averageQualityScore || 0,
      trend: 'stable' as const,
      alerts: 0,
      lastUpdated: new Date(dept.updatedAt),
    }))

    // TODO: Calculate real metrics based on:
    // - Episodes completion status
    // - Media quality scores
    // - Agent task results
    // - Brain service validation results
    // - Export job success rates

    return NextResponse.json({
      metrics: departmentMetrics,
      timeRange,
      projectId: id,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch quality metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
