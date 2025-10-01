/**
 * Activity Log API Route
 * GET /api/v1/projects/[id]/activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
// TODO: Re-enable after fixing access control
// import { hasPermission, Permission } from '@/lib/collaboration/accessControl'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params

    // TODO: Re-enable permission checks after fixing access control
    // const userId = request.headers.get('x-user-id') || 'system'
    // const canRead = await hasPermission({
    //   userId,
    //   projectId,
    //   permission: Permission.PROJECT_READ,
    // })
    // if (!canRead) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const actionType = searchParams.get('action')

    const payload = await getPayload({ config: await configPromise })

    // Query activity logs
    const where: any = { project: { equals: projectId } }
    if (actionType) {
      where.action = { equals: actionType }
    }

    const result = await payload.find({
      collection: 'activity-logs',
      where,
      limit,
      page,
      sort: '-timestamp',
      depth: 2,
    })

    return NextResponse.json({
      activities: result.docs,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      page: result.page,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
