/**
 * Activity Logs API Endpoint
 * GET /api/v1/activity/logs
 * 
 * Returns activity logs for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    
    const payload = await getPayloadClient()
    
    // Fetch activity logs
    const result = await payload.find({
      collection: 'activity-logs',
      limit,
      sort: '-createdAt',
      where: {
        // Filter by current user if needed
      },
    })
    
    // Transform to activity log format
    const logs = result.docs.map((log: any) => ({
      id: log.id,
      type: log.type || 'action',
      action: log.action || 'viewed',
      entityType: log.entityType || log.collection || 'unknown',
      entityId: log.entityId || log.id,
      entityName: log.entityName || log.name || 'Untitled',
      user: log.user || 'Unknown User',
      details: log.details || {},
      timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
      projectId: log.project || log.projectId,
    }))
    
    return NextResponse.json({
      logs,
      total: result.totalDocs,
    })
  } catch (error) {
    console.error('[API] Error fetching activity logs:', error)
    
    // Return empty array instead of error
    return NextResponse.json({
      logs: [],
      total: 0,
    })
  }
}

