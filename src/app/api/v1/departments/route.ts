/**
 * Departments API
 * GET /api/v1/departments - Get all departments sorted by codeDepNumber
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/v1/departments
 * Fetch departments ordered by codeDepNumber (ascending)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const gatherCheck = searchParams.get('gatherCheck')

    const payload = await getPayload({ config: await config })

    // Build where clause
    const where: any = {}
    
    if (isActive !== null) {
      where.isActive = { equals: isActive === 'true' }
    }
    
    if (gatherCheck !== null) {
      where.gatherCheck = { equals: gatherCheck === 'true' }
    }

    // Fetch departments sorted by codeDepNumber
    const result = await payload.find({
      collection: 'departments',
      where: Object.keys(where).length > 0 ? where : undefined,
      sort: 'codeDepNumber', // CRITICAL: Always sort by codeDepNumber
      limit: 100,
    })

    return NextResponse.json({
      departments: result.docs,
      total: result.totalDocs,
    })
  } catch (error) {
    console.error('[Departments API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}

