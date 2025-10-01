import { NextRequest, NextResponse } from 'next/server'
import { generateMasterReference } from '@/lib/images/masterReference'
import type { MasterReferenceConfig } from '@/lib/fal/types'

/**
 * POST /api/v1/projects/[id]/images/generate/master
 * Generate master reference image for a character or location
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()

    const { subjectType, subjectId, description, styleGuide, resolution, model, qualityThreshold } = body

    // Validation
    if (!subjectType || !subjectId || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: subjectType, subjectId, description' },
        { status: 400 }
      )
    }

    if (!['character', 'location', 'object'].includes(subjectType)) {
      return NextResponse.json(
        { error: 'Invalid subjectType. Must be: character, location, or object' },
        { status: 400 }
      )
    }

    // Build configuration
    const config: MasterReferenceConfig = {
      subjectType,
      subjectId,
      description,
      projectId,
      styleGuide,
      resolution,
      model,
      qualityThreshold,
    }

    // Generate master reference
    const result = await generateMasterReference(config)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Generation failed', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mediaId: result.mediaId,
      url: result.url,
      width: result.width,
      height: result.height,
      seed: result.seed,
      timings: result.timings,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Master reference generation error:', error)

    return NextResponse.json(
      {
        error: 'Master reference generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
