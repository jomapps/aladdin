/**
 * Dismiss Error API
 *
 * POST /api/v1/errors/dismiss
 * Dismiss a specific error by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { dismissError, dismissAllErrors } from '@/lib/errors/globalErrors'

/**
 * POST /api/v1/errors/dismiss
 * Dismiss specific error or all errors
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { errorId, all } = body

    if (all) {
      // Dismiss all errors
      const count = await dismissAllErrors()

      return NextResponse.json({
        success: true,
        message: `Dismissed ${count} error(s)`,
        count,
      })
    }

    if (!errorId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing errorId parameter',
        },
        { status: 400 }
      )
    }

    const dismissed = await dismissError(errorId)

    if (!dismissed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error not found or not dismissible',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Error dismissed successfully',
      errorId,
    })
  } catch (error) {
    console.error('[API] Error dismissing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to dismiss error',
        message: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
