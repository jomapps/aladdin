/**
 * Video Complete Webhook
 *
 * POST /api/webhooks/video-complete
 * Receives notifications from tasks.ft.tc when video generation completes
 *
 * Flow:
 * 1. Receive video completion from tasks.ft.tc
 * 2. Update scene with generated_video_url
 * 3. Trigger last frame extraction
 * 4. Return acknowledgment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import crypto from 'crypto'
import { addGlobalError } from '@/lib/errors/globalErrors'

/**
 * Webhook payload structure from tasks.ft.tc
 */
interface VideoCompletePayload {
  task_id: string
  status: 'completed' | 'failed'
  scene_id: string
  project_id: string
  video_url?: string
  thumbnail_url?: string
  duration?: number
  fps?: number
  width?: number
  height?: number
  quality_score?: number
  error?: string
  metadata?: {
    model?: string
    processing_time?: number
    [key: string]: any
  }
  timestamp: string
}

/**
 * Webhook secret for signature validation
 */
const WEBHOOK_SECRET = process.env.VIDEO_WEBHOOK_SECRET || 'your-video-webhook-secret'

/**
 * Rate limiting store (simple in-memory, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100 // 100 requests per minute

/**
 * Verify webhook signature using HMAC-SHA256
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

/**
 * Check rate limit
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

/**
 * Trigger last frame extraction service
 */
async function triggerLastFrameExtraction(
  videoUrl: string,
  sceneId: string,
  projectId: string
): Promise<void> {
  const lastFrameServiceUrl = process.env.LAST_FRAME_SERVICE_URL

  if (!lastFrameServiceUrl) {
    console.warn('LAST_FRAME_SERVICE_URL not configured, skipping last frame extraction')
    return
  }

  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/last-frame-complete`

    const response = await fetch(lastFrameServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.LAST_FRAME_API_KEY || '',
      },
      body: JSON.stringify({
        video_url: videoUrl,
        scene_id: sceneId,
        project_id: projectId,
        webhook_url: webhookUrl,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Last frame extraction trigger failed:', errorText)
      throw new Error(`Last frame service returned ${response.status}`)
    }

    console.log('[Webhook] Last frame extraction triggered successfully')
  } catch (error) {
    console.error('[Webhook] Failed to trigger last frame extraction:', error)
    throw error
  }
}

/**
 * GET endpoint for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/webhooks/video-complete',
    method: 'POST',
    description: 'Webhook endpoint for receiving video completion notifications from tasks.ft.tc',
    timestamp: new Date().toISOString(),
  })
}

/**
 * POST endpoint for receiving webhook notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('X-Webhook-Signature')

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!verifyWebhookSignature(rawBody, signature)) {
        console.warn('[Webhook] Invalid signature received')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIp)) {
      console.warn(`[Webhook] Rate limit exceeded for ${clientIp}`)
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Parse payload
    const payload: VideoCompletePayload = JSON.parse(rawBody)
    const { task_id, status, scene_id, project_id, video_url, error, metadata } = payload

    console.log('[Webhook] Received video complete notification:', {
      task_id,
      status,
      scene_id,
      project_id,
      has_video: !!video_url,
    })

    const payloadInstance = await getPayload({ config })

    // Find scene by ID
    const scene = await payloadInstance.findByID({
      collection: 'scenes',
      id: scene_id,
    })

    if (!scene) {
      console.warn(`[Webhook] Scene not found: ${scene_id}`)
      await addGlobalError({
        type: 'webhook',
        severity: 'warning',
        message: `Video completed but scene not found: ${scene_id}`,
        context: { task_id, scene_id, project_id },
      })
      return NextResponse.json({ received: true, warning: 'Scene not found' })
    }

    if (status === 'completed' && video_url) {
      console.log('[Webhook] Processing completed video:', {
        scene_id,
        video_url,
        quality_score: payload.quality_score,
      })

      // Update scene with video URL
      await payloadInstance.update({
        collection: 'scenes',
        id: scene_id,
        data: {
          status: 'generated',
          finalOutputUrl: video_url,
          renderTime: metadata?.processing_time || 0,
          // Update verification results if quality score available
          ...(payload.quality_score && {
            verificationResults: {
              qualityScore: payload.quality_score,
            },
          }),
        },
      })

      console.log('[Webhook] Scene updated with video URL')

      // Trigger last frame extraction
      try {
        await triggerLastFrameExtraction(video_url, scene_id, project_id)
      } catch (extractError) {
        console.error('[Webhook] Last frame extraction failed:', extractError)
        await addGlobalError({
          type: 'processing',
          severity: 'error',
          message: 'Failed to extract last frame from video',
          context: { scene_id, video_url, error: (extractError as Error).message },
        })
      }

      return NextResponse.json({
        received: true,
        status: 'completed',
        scene_updated: true,
        last_frame_triggered: true,
      })
    } else if (status === 'failed') {
      console.error('[Webhook] Video generation failed:', {
        task_id,
        scene_id,
        error,
      })

      // Update scene with failed status
      await payloadInstance.update({
        collection: 'scenes',
        id: scene_id,
        data: {
          status: 'rejected',
          notes: `Video generation failed: ${error || 'Unknown error'}`,
        },
      })

      // Add global error
      await addGlobalError({
        type: 'generation',
        severity: 'error',
        message: `Video generation failed for scene ${scene.sceneNumber}`,
        context: { scene_id, task_id, error },
      })

      console.log('[Webhook] Scene updated with failed status')

      return NextResponse.json({
        received: true,
        status: 'failed',
        error,
      })
    }

    console.warn('[Webhook] Received webhook with unknown status:', status)
    return NextResponse.json({ received: true, warning: 'Unknown status' })
  } catch (error) {
    console.error('[Webhook] Processing error:', error)

    await addGlobalError({
      type: 'system',
      severity: 'critical',
      message: 'Webhook processing failed',
      context: { error: (error as Error).message },
    }).catch(console.error)

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Signature',
    },
  })
}
