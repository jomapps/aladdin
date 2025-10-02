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

export async function POST(request: NextRequest) {
  try {
    const body: WebhookPayload = await request.json()
    const { task_id, status, result, metadata } = body

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
      console.warn(`No evaluation found for task ${task_id}`)
      return NextResponse.json({ received: true, warning: 'Evaluation not found' })
    }

    const evalDoc = evaluation.docs[0]

    if (status === 'completed' && result) {
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

      // Update overall project readiness score
      await updateProjectReadinessScore(evalDoc.projectId as string)

      return NextResponse.json({
        received: true,
        status: 'completed',
        rating: result.rating,
      })
    } else if (status === 'failed') {
      // Update with failed status
      await payload.update({
        collection: 'project-readiness',
        id: evalDoc.id,
        data: {
          status: 'failed',
        },
      })

      return NextResponse.json({
        received: true,
        status: 'failed',
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
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
      and: [
        { projectId: { equals: projectId } },
        { status: { equals: 'completed' } },
      ],
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
