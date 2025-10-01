/**
 * Error Logging API Endpoint
 * POST /api/v1/errors/log
 * 
 * Logs client-side errors for monitoring and debugging
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      error,
      errorInfo,
      url,
      userAgent,
      timestamp,
    } = body

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Client Error]', {
        message: error?.message,
        stack: error?.stack,
        url,
        timestamp,
      })
    }

    // Store in database for production monitoring
    if (process.env.NODE_ENV === 'production') {
      try {
        const payload = await getPayloadClient()
        
        // Store in activity logs or create a dedicated errors collection
        await payload.create({
          collection: 'activity-logs',
          data: {
            type: 'error',
            action: 'client-error',
            entityType: 'error',
            entityName: error?.message || 'Unknown Error',
            details: {
              error: {
                message: error?.message,
                stack: error?.stack,
                name: error?.name,
              },
              errorInfo,
              url,
              userAgent,
            },
            timestamp: timestamp || new Date().toISOString(),
          },
        })
      } catch (dbError) {
        // Don't fail if database logging fails
        console.error('[Error Logging] Failed to store in database:', dbError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Error Logging] Failed to process error log:', error)
    
    // Return success anyway - don't break client on logging failure
    return NextResponse.json({ success: true })
  }
}

