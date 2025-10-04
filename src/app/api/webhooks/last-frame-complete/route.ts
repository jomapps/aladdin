/**
 * Last Frame Complete Webhook
 *
 * POST /api/webhooks/last-frame-complete
 * Receives notifications from last-frame.ft.tc when last frame extraction completes
 *
 * Flow:
 * 1. Receive last frame from last-frame.ft.tc
 * 2. Update scene with last_frame_url
 * 3. Set status to 'completed'
 * 4. Trigger next scene generation if available
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import crypto from 'crypto'
import { addGlobalError } from '@/lib/errors/globalErrors'

/**
 * Webhook payload structure from last-frame.ft.tc
 */
interface LastFrameCompletePayload {
  task_id: string
  status: 'completed' | 'failed'
  scene_id: string
  project_id: string
  last_frame_url?: string
  thumbnail_url?: string
  width?: number
  height?: number
  format?: string
  error?: string
  metadata?: {
    extraction_time?: number
    frame_number?: number
    [key: string]: any
  }
  timestamp: string
}

/**
 * Webhook secret for signature validation
 */
const WEBHOOK_SECRET = process.env.LAST_FRAME_WEBHOOK_SECRET || 'your-last-frame-webhook-secret'

/**
 * Rate limiting store
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100 // 100 requests per minute

/**
 * Verify webhook signature
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
 * Trigger next scene generation
 */
async function triggerNextSceneGeneration(
  projectId: string,
  currentSceneId: string,
  lastFrameUrl: string
): Promise<void> {
  try {
    const payloadInstance = await getPayload({ config })

    // Find all scenes for this project, ordered by sceneNumber
    const scenes = await payloadInstance.find({
      collection: 'scenes',
      where: {
        // Assuming scenes have a project relationship field
        // Adjust based on your actual schema
      },
      sort: 'sceneNumber',
      limit: 1000,
    })

    // Find current scene index
    const currentIndex = scenes.docs.findIndex((s) => s.id === currentSceneId)

    if (currentIndex === -1 || currentIndex === scenes.docs.length - 1) {
      console.log('[Webhook] No next scene to generate')
      return
    }

    const nextScene = scenes.docs[currentIndex + 1]

    // Check if next scene is ready for generation
    if (nextScene.status !== 'ready') {
      console.log(`[Webhook] Next scene ${nextScene.sceneNumber} not ready for generation`)
      return
    }

    console.log(`[Webhook] Triggering generation for next scene: ${nextScene.sceneNumber}`)

    // Trigger video generation for next scene using the last frame as first frame
    const videoGenUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/projects/${projectId}/videos/generate`

    const response = await fetch(videoGenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'first-last-frame',
        prompt: nextScene.mainPrompt,
        sceneId: nextScene.id,
        firstFrameUrl: lastFrameUrl, // Use previous scene's last frame
        lastFrameUrl: nextScene.finalOutputUrl, // If next scene has a target last frame
        model: nextScene.generationModel,
        duration: nextScene.duration || 5,
        fps: nextScene.fps || 24,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/video-complete`,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Webhook] Next scene generation trigger failed:', errorText)
      throw new Error(`Video generation returned ${response.status}`)
    }

    console.log('[Webhook] Next scene generation triggered successfully')
  } catch (error) {
    console.error('[Webhook] Failed to trigger next scene generation:', error)
    await addGlobalError({
      type: 'automation',
      severity: 'warning',
      message: 'Failed to trigger automatic next scene generation',
      context: { projectId, currentSceneId, error: (error as Error).message },
    })
  }
}

/**
 * GET endpoint for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/webhooks/last-frame-complete',
    method: 'POST',
    description:
      'Webhook endpoint for receiving last frame extraction completion notifications from last-frame.ft.tc',
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
    const payload: LastFrameCompletePayload = JSON.parse(rawBody)
    const { task_id, status, scene_id, project_id, last_frame_url, error, metadata } = payload

    console.log('[Webhook] Received last frame complete notification:', {
      task_id,
      status,
      scene_id,
      project_id,
      has_last_frame: !!last_frame_url,
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
        message: `Last frame completed but scene not found: ${scene_id}`,
        context: { task_id, scene_id, project_id },
      })
      return NextResponse.json({ received: true, warning: 'Scene not found' })
    }

    if (status === 'completed' && last_frame_url) {
      console.log('[Webhook] Processing completed last frame:', {
        scene_id,
        last_frame_url,
      })

      // Update scene with last frame URL and mark as completed
      await payloadInstance.update({
        collection: 'scenes',
        id: scene_id,
        data: {
          status: 'verified', // Mark as verified/completed
          // Store last frame URL in notes or custom field
          // Adjust based on your schema
          productionNotes: `Last frame extracted: ${last_frame_url}`,
        },
      })

      console.log('[Webhook] Scene updated with last frame URL')

      // Trigger next scene generation
      try {
        await triggerNextSceneGeneration(project_id, scene_id, last_frame_url)
      } catch (nextSceneError) {
        console.error('[Webhook] Next scene trigger failed:', nextSceneError)
        // Don't fail the webhook, just log it
      }

      return NextResponse.json({
        received: true,
        status: 'completed',
        scene_updated: true,
        next_scene_triggered: true,
      })
    } else if (status === 'failed') {
      console.error('[Webhook] Last frame extraction failed:', {
        task_id,
        scene_id,
        error,
      })

      // Add global error
      await addGlobalError({
        type: 'processing',
        severity: 'error',
        message: `Last frame extraction failed for scene ${scene.sceneNumber}`,
        context: { scene_id, task_id, error },
      })

      console.log('[Webhook] Last frame extraction failure logged')

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
      message: 'Last frame webhook processing failed',
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
