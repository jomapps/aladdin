/**
 * Global Errors API
 *
 * GET  /api/v1/errors - Get all active errors
 * POST /api/v1/errors/dismiss - Dismiss specific error
 * POST /api/v1/errors/dismiss-all - Dismiss all errors
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGlobalErrors } from '@/lib/errors/globalErrors'

/**
 * GET /api/v1/errors
 * Get all active global errors
 */
export async function GET(request: NextRequest) {
  try {
    const errors = await getGlobalErrors()

    // Filter by severity if requested
    const severity = request.nextUrl.searchParams.get('severity')
    const type = request.nextUrl.searchParams.get('type')

    let filtered = errors

    if (severity) {
      filtered = filtered.filter((e) => e.severity === severity)
    }

    if (type) {
      filtered = filtered.filter((e) => e.type === type)
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      errors: filtered,
    })
  } catch (error) {
    console.error('[API] Error fetching global errors:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch errors',
        message: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
