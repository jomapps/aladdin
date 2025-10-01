/**
 * Health Check API Endpoint
 * Phase 7: Production Polish
 */

import { NextResponse } from 'next/server'
import { performHealthCheck } from '@/lib/monitoring/healthCheck'

export async function GET() {
  try {
    const health = await performHealthCheck()

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 503 : 500

    return NextResponse.json(health, { status: statusCode })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date(),
      },
      { status: 500 },
    )
  }
}
