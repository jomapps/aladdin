/**
 * Stitch Complete Webhook
 *
 * POST /api/webhooks/stitch-complete
 * Receives notifications from stitching service when final video compilation completes
 *
 * Flow:
 * 1. Receive final video from stitching service
 * 2. Update project with final_video_url
 * 3. Set project status to 'completed'
 * 4. Notify user (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import crypto from 'crypto'
import { addGlobalError } from '@/lib/errors/globalErrors'

/**
 * Webhook payload structure from stitching service
 */
interface StitchCompletePayload {
  task_id: string
  status: 'completed' | 'failed'
  project_id: string
  final_video_url?: string
  thumbnail_url?: string
  duration?: number
  total_scenes?: number
  file_size?: number
  format?: string
  resolution?: string
  error?: string
  metadata?: {
    processing_time?: number
    stitch_quality?: number
    transitions_applied?: number
    audio_tracks?: number
    [key: string]: any
  }
  timestamp: string
}

/**
 * Webhook secret for signature validation
 */
const WEBHOOK_SECRET = process.env.STITCH_WEBHOOK_SECRET || 'your-stitch-webhook-secret'

/**
 * Rate limiting store
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 50 // 50 requests per minute (lower for heavy operations)

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
 * Notify user of project completion
 */
async function notifyUserOfCompletion(
  projectId: string,
  projectName: string,
  finalVideoUrl: string
): Promise<void> {
  try {
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL

    if (!notificationServiceUrl) {
      console.warn('NOTIFICATION_SERVICE_URL not configured, skipping user notification')
      return
    }

    const response = await fetch(notificationServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NOTIFICATION_API_KEY || '',
      },
      body: JSON.stringify({
        type: 'project_completed',
        project_id: projectId,
        project_name: projectName,
        video_url: finalVideoUrl,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('User notification failed:', errorText)
      throw new Error(`Notification service returned ${response.status}`)
    }

    console.log('[Webhook] User notification sent successfully')
  } catch (error) {
    console.error('[Webhook] Failed to notify user:', error)
    // Don't throw - notification failure shouldn't fail the webhook
    await addGlobalError({
      type: 'notification',
      severity: 'warning',
      message: 'Failed to send project completion notification',
      context: { projectId, error: (error as Error).message },
    })
  }
}

/**
 * GET endpoint for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/webhooks/stitch-complete',
    method: 'POST',
    description:
      'Webhook endpoint for receiving video stitching completion notifications from stitching service',
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
    const payload: StitchCompletePayload = JSON.parse(rawBody)
    const { task_id, status, project_id, final_video_url, error, metadata } = payload

    console.log('[Webhook] Received stitch complete notification:', {
      task_id,
      status,
      project_id,
      has_final_video: !!final_video_url,
      total_scenes: payload.total_scenes,
      duration: payload.duration,
    })

    const payloadInstance = await getPayload({ config })

    // Find project by ID
    const project = await payloadInstance.findByID({
      collection: 'projects',
      id: project_id,
    })

    if (!project) {
      console.warn(`[Webhook] Project not found: ${project_id}`)
      await addGlobalError({
        type: 'webhook',
        severity: 'warning',
        message: `Stitch completed but project not found: ${project_id}`,
        context: { task_id, project_id },
      })
      return NextResponse.json({ received: true, warning: 'Project not found' })
    }

    if (status === 'completed' && final_video_url) {
      console.log('[Webhook] Processing completed final video:', {
        project_id,
        final_video_url,
        duration: payload.duration,
        file_size: payload.file_size,
      })

      // Update project with final video URL and mark as completed
      await payloadInstance.update({
        collection: 'projects',
        id: project_id,
        data: {
          status: 'completed', // Assuming projects have a status field
          phase: 'post-production', // Update phase if applicable
          // Store final video URL - adjust based on your schema
          // You may need to add a finalVideoUrl field to Projects collection
        },
      })

      console.log('[Webhook] Project updated with final video URL')

      // Notify user of completion
      try {
        await notifyUserOfCompletion(project_id, project.name as string, final_video_url)
      } catch (notifyError) {
        console.error('[Webhook] User notification failed:', notifyError)
        // Don't fail the webhook
      }

      // Add success notification to global system
      await addGlobalError({
        type: 'success',
        severity: 'info',
        message: `Project "${project.name}" completed successfully! 🎉`,
        context: {
          project_id,
          final_video_url,
          duration: payload.duration,
          total_scenes: payload.total_scenes,
        },
        dismissible: true,
      })

      return NextResponse.json({
        received: true,
        status: 'completed',
        project_updated: true,
        user_notified: true,
        final_video_url,
      })
    } else if (status === 'failed') {
      console.error('[Webhook] Video stitching failed:', {
        task_id,
        project_id,
        error,
      })

      // Update project with failed status
      await payloadInstance.update({
        collection: 'projects',
        id: project_id,
        data: {
          status: 'failed',
        },
      })

      // Add global error
      await addGlobalError({
        type: 'generation',
        severity: 'critical',
        message: `Video stitching failed for project "${project.name}"`,
        context: { project_id, task_id, error },
        dismissible: true,
      })

      console.log('[Webhook] Project updated with failed status')

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
      message: 'Stitch webhook processing failed',
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
