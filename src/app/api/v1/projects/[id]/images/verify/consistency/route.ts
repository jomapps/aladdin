import { NextRequest, NextResponse } from 'next/server'
import { verifyConsistency } from '@/lib/images/consistency'
import type { ConsistencyVerificationConfig } from '@/lib/fal/types'

/**
 * POST /api/v1/projects/[id]/images/verify/consistency
 * Verify image consistency against reference set
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()

    const { newImageId, referenceSetId, thresholds } = body

    // Validation
    if (!newImageId || !referenceSetId) {
      return NextResponse.json(
        { error: 'Missing required fields: newImageId, referenceSetId' },
        { status: 400 }
      )
    }

    // Build configuration
    const config: ConsistencyVerificationConfig = {
      newImageId,
      referenceSetId,
      projectId,
      thresholds,
    }

    // Verify consistency
    const result = await verifyConsistency(config)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Consistency verification failed', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      passed: result.passed,
      overallConsistency: result.overallConsistency,
      scores: result.scores,
      differences: result.differences,
      recommendations: result.recommendations,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Consistency verification error:', error)

    return NextResponse.json(
      {
        error: 'Consistency verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
