/**
 * Evaluation Complete Webhook
 *
 * POST /api/webhooks/evaluation-complete
 * Receive notifications from tasks.ft.tc when evaluation completes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { WebhookPayload } from '@/lib/task-service/types'
import { calculateProjectReadinessScore } from '@/lib/evaluation/score-calculator'

/**
 * GET endpoint for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/webhooks/evaluation-complete',
    method: 'POST',
    description:
      'Webhook endpoint for receiving evaluation completion notifications from tasks.ft.tc',
    timestamp: new Date().toISOString(),
  })
}

/**
 * POST endpoint for receiving webhook notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body: WebhookPayload = await request.json()
    const { task_id, status, result, metadata, project_id } = body

    console.log('[Webhook] Received evaluation complete notification:', {
      task_id,
      status,
      project_id,
      has_result: !!result,
      metadata,
    })

    const payload = await getPayload({ config })

    // Find evaluation by task ID
    const evaluation = await payload.find({
      collection: 'project-readiness',
      where: {
        taskId: { equals: task_id },
      },
      limit: 1,
    })

    if (evaluation.docs.length === 0) {
      console.warn(`[Webhook] No evaluation found for task ${task_id}`)
      return NextResponse.json({ received: true, warning: 'Evaluation not found' })
    }

    const evalDoc = evaluation.docs[0]
    console.log('[Webhook] Found evaluation:', {
      id: evalDoc.id,
      projectId: evalDoc.projectId,
      departmentId: evalDoc.departmentId,
      currentStatus: evalDoc.status,
    })

    if (status === 'completed' && result) {
      console.log('[Webhook] Processing completed evaluation:', {
        rating: result.rating,
        department: result.department,
        issues_count: result.issues?.length || 0,
        suggestions_count: result.suggestions?.length || 0,
      })

      // Update with completed results
      await payload.update({
        collection: 'project-readiness',
        id: evalDoc.id,
        data: {
          status: 'completed',
          rating: result.rating,
          evaluationResult: result.evaluation_result,
          evaluationSummary: result.evaluation_summary,
          issues: result.issues?.map((i) => ({ issue: i })) || [],
          suggestions: result.suggestions?.map((s) => ({ suggestion: s })) || [],
          evaluationDuration: result.processing_time,
          iterationCount: result.iteration_count,
          agentModel: result.metadata?.model || 'unknown',
          lastEvaluatedAt: new Date().toISOString(),
        },
      })

      console.log('[Webhook] Updated evaluation record successfully')

      // Update overall project readiness score
      await updateProjectReadinessScore(evalDoc.projectId as string)

      console.log('[Webhook] Updated project readiness score')

      return NextResponse.json({
        received: true,
        status: 'completed',
        rating: result.rating,
      })
    } else if (status === 'failed') {
      console.error('[Webhook] Evaluation failed:', {
        task_id,
        error: body.error,
      })

      // Update with failed status
      await payload.update({
        collection: 'project-readiness',
        id: evalDoc.id,
        data: {
          status: 'failed',
          evaluationResult: body.error || 'Evaluation failed',
        },
      })

      console.log('[Webhook] Updated evaluation record with failed status')

      return NextResponse.json({
        received: true,
        status: 'failed',
        error: body.error,
      })
    }

    console.warn('[Webhook] Received webhook with unknown status:', status)
    return NextResponse.json({ received: true, warning: 'Unknown status' })
  } catch (error) {
    console.error('[Webhook] Processing error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

/**
 * Update overall project readiness score
 */
async function updateProjectReadinessScore(projectId: string) {
  const payload = await getPayload({ config })

  // Get all completed evaluations for this project
  const evaluations = await payload.find({
    collection: 'project-readiness',
    where: {
      and: [{ projectId: { equals: projectId } }, { status: { equals: 'completed' } }],
    },
  })

  if (evaluations.docs.length === 0) return

  // Calculate overall score
  const scores = evaluations.docs
    .filter((e) => e.rating !== null && e.rating !== undefined)
    .map((e) => ({
      departmentSlug: (e.departmentId as any).slug || 'unknown',
      departmentNumber: (e.departmentId as any).codeDepNumber || 0,
      rating: e.rating as number,
    }))

  const overallScore = calculateProjectReadinessScore(scores)

  // Update all evaluations with the project-level score
  for (const evalDoc of evaluations.docs) {
    await payload.update({
      collection: 'project-readiness',
      id: evalDoc.id,
      data: {
        readinessScore: overallScore,
      },
    })
  }
}
