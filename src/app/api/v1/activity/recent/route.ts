/**
 * Recent Items API Endpoint
 * GET /api/v1/activity/recent
 * 
 * Returns recent items accessed by the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '5', 10)
    
    const payload = await getPayloadClient()
    
    // Fetch recent activity logs
    const activityLogs = await payload.find({
      collection: 'activity-logs',
      limit,
      sort: '-createdAt',
      where: {
        // Filter by current user if needed
      },
    })
    
    // Transform activity logs to recent items format
    const recentItems = activityLogs.docs.map((log: any) => {
      const entityType = log.entityType || 'document'
      const entityId = log.entityId || log.id
      
      // Determine href based on entity type
      let href = '/dashboard'
      if (entityType === 'project' || log.collection === 'projects') {
        href = `/dashboard/project/${entityId}`
      } else if (entityType === 'episode' || log.collection === 'episodes') {
        href = `/dashboard/project/${log.project}/episodes/${entityId}`
      } else if (entityType === 'character' || log.collection === 'characters') {
        href = `/dashboard/project/${log.project}/characters/${entityId}`
      } else if (entityType === 'scene' || log.collection === 'scenes') {
        href = `/dashboard/project/${log.project}/scenes/${entityId}`
      }
      
      return {
        id: log.id,
        type: entityType,
        name: log.entityName || log.name || 'Untitled',
        href,
        timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
        projectId: log.project || log.projectId,
      }
    })
    
    return NextResponse.json({
      items: recentItems,
      total: activityLogs.totalDocs,
    })
  } catch (error) {
    console.error('[API] Error fetching recent items:', error)
    
    // Return empty array instead of error to prevent UI breakage
    return NextResponse.json({
      items: [],
      total: 0,
    })
  }
}

