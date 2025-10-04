/**
 * Error Statistics API
 *
 * GET /api/v1/errors/stats
 * Get global error statistics
 */

import { NextResponse } from 'next/server'
import { getErrorStats } from '@/lib/errors/globalErrors'

/**
 * GET /api/v1/errors/stats
 * Get error statistics
 */
export async function GET() {
  try {
    const stats = await getErrorStats()

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('[API] Error fetching error stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch error statistics',
        message: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
