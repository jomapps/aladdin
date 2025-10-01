import { NextRequest, NextResponse } from 'next/server'
import { generateCompositeShot } from '@/lib/images/compositeShot'
import type { CompositeShotConfig } from '@/lib/fal/types'

/**
 * POST /api/v1/projects/[id]/images/generate/composite
 * Generate composite shot using multiple reference images
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params
    const body = await request.json()

    const { description, references, sceneDescription, lighting, cameraAngle, resolution, model } =
      body

    // Validation
    if (!description) {
      return NextResponse.json({ error: 'Missing required field: description' }, { status: 400 })
    }

    if (!references || Object.keys(references).length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: references (must include at least one reference)' },
        { status: 400 },
      )
    }

    // Build configuration
    const config: CompositeShotConfig = {
      description,
      projectId,
      references,
      sceneDescription,
      lighting,
      cameraAngle,
      resolution,
      model,
    }

    // Generate composite shot
    const result = await generateCompositeShot(config)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Composite shot generation failed', details: result.error },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      mediaId: result.mediaId,
      imageUrl: result.imageUrl,
      consistencyScore: result.consistencyScore,
      usedReferences: result.usedReferences,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Composite shot generation error:', error)

    return NextResponse.json(
      {
        error: 'Composite shot generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
