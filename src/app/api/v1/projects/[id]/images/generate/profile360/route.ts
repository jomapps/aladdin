import { NextRequest, NextResponse } from 'next/server'
import { generate360Profile } from '@/lib/images/profile360'
import type { Profile360Config } from '@/lib/fal/types'

/**
 * POST /api/v1/projects/[id]/images/generate/profile360
 * Generate 360° profile turnaround (12 images at 30° intervals)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()

    const { masterReferenceId, subjectId, angles, resolution, model, parallelBatches } = body

    // Validation
    if (!masterReferenceId || !subjectId) {
      return NextResponse.json(
        { error: 'Missing required fields: masterReferenceId, subjectId' },
        { status: 400 }
      )
    }

    // Build configuration
    const config: Profile360Config = {
      masterReferenceId,
      subjectId,
      projectId,
      angles,
      resolution,
      model,
      parallelBatches,
    }

    // Generate 360° profile
    const result = await generate360Profile(config)

    if (!result.success) {
      return NextResponse.json(
        { error: '360° profile generation failed', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      images: result.images,
      masterReferenceId: result.masterReferenceId,
      subjectId: result.subjectId,
      totalGenerationTime: result.totalGenerationTime,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('360° profile generation error:', error)

    return NextResponse.json(
      {
        error: '360° profile generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
