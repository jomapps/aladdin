/**
 * Phase 6: Video Generation API Route
 * POST /api/v1/projects/[id]/videos/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateVideo } from '@/lib/video/generateVideo'
import type { FalVideoGenerationType } from '@/lib/fal/types'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      type,
      prompt,
      sceneId,
      model,
      duration,
      fps,
      resolution,
      imageUrl,
      firstFrameUrl,
      lastFrameUrl,
      compositeImageUrl,
      cameraMovement,
      motionStrength,
      webhookUrl,
    } = body

    // Validate required fields
    if (!type || !prompt) {
      return NextResponse.json({ error: 'Missing required fields: type, prompt' }, { status: 400 })
    }

    // Validate video generation type
    const validTypes: FalVideoGenerationType[] = [
      'text-to-video',
      'image-to-video',
      'first-last-frame',
      'composite-to-video',
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      )
    }

    // Build request object based on type
    const videoRequest: any = {
      type,
      prompt,
      model,
      duration: Math.min(duration || 5, 7), // Enforce 7s max
      fps,
      resolution,
      motionStrength,
    }

    if (type === 'image-to-video') {
      if (!imageUrl) {
        return NextResponse.json({ error: 'imageUrl required for image-to-video' }, { status: 400 })
      }
      videoRequest.imageUrl = imageUrl
    } else if (type === 'first-last-frame') {
      if (!firstFrameUrl || !lastFrameUrl) {
        return NextResponse.json(
          { error: 'firstFrameUrl and lastFrameUrl required for first-last-frame' },
          { status: 400 },
        )
      }
      videoRequest.firstFrameUrl = firstFrameUrl
      videoRequest.lastFrameUrl = lastFrameUrl
    } else if (type === 'composite-to-video') {
      if (!compositeImageUrl) {
        return NextResponse.json(
          { error: 'compositeImageUrl required for composite-to-video' },
          { status: 400 },
        )
      }
      videoRequest.compositeImageUrl = compositeImageUrl
      videoRequest.cameraMovement = cameraMovement
    }

    // Generate video (async operation)
    const result = await generateVideo({
      type,
      request: videoRequest,
      projectId: id,
      sceneId,
      webhookUrl,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      video: {
        mediaId: result.mediaId,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        duration: result.duration,
        fps: result.fps,
        width: result.width,
        height: result.height,
        qualityScore: result.qualityScore,
      },
      timings: result.timings,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
