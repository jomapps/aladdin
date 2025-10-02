/**
 * Gather API - Count Endpoint
 * GET /api/v1/gather/[projectId]/count - Get total count of gather items
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { gatherDB } from '@/lib/db/gatherDatabase'

/**
 * GET /api/v1/gather/[projectId]/count
 * Get count of gather items for sidebar badge
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    // Validate project exists
    const payload = await getPayload({ config: await config })
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get count
    const count = await gatherDB.getGatherCount(projectId)

    return NextResponse.json({ count })
  } catch (error) {
    console.error('[Gather API] Count error:', error)
    return NextResponse.json(
      { error: 'Failed to get gather count' },
      { status: 500 }
    )
  }
}

