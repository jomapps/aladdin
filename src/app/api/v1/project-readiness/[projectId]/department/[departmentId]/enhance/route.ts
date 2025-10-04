/**
 * AI Enhancement API Route
 *
 * POST /api/v1/project-readiness/[projectId]/department/[departmentId]/enhance
 * Uses AI to analyze evaluation results, address issues, and add enriched data to gather+brain
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { evaluationEnhancer } from '@/lib/evaluation/evaluation-enhancer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; departmentId: string }> }
) {
  try {
    const { projectId, departmentId } = await params
    const payload = await getPayload({ config })

    // 1. Get the latest evaluation for this department
    const evaluation = await payload.find({
      collection: 'project-readiness',
      where: {
        and: [{ projectId: { equals: projectId } }, { departmentId: { equals: departmentId } }],
      },
      limit: 1,
      sort: '-lastEvaluatedAt',
    })

    if (evaluation.docs.length === 0) {
      return NextResponse.json(
        { error: 'No evaluation found for this department' },
        { status: 404 }
      )
    }

    const evalDoc = evaluation.docs[0]

    if (evalDoc.status !== 'completed') {
      return NextResponse.json(
        { error: 'Evaluation must be completed before enhancement' },
        { status: 400 }
      )
    }

    if (!evalDoc.evaluationResult) {
      return NextResponse.json(
        { error: 'No evaluation result available to enhance' },
        { status: 400 }
      )
    }

    // 2. Get department info
    const department = await payload.findByID({
      collection: 'departments',
      id: departmentId,
    })

    // 3. Use the evaluation enhancer to generate improvements
    const result = await evaluationEnhancer.enhance({
      projectId,
      departmentId,
      departmentSlug: department.slug,
      departmentName: department.name,
      evaluationResult: evalDoc.evaluationResult,
      evaluationSummary: evalDoc.evaluationSummary || '',
      issues: evalDoc.issues?.map((i: any) => i.issue) || [],
      suggestions: evalDoc.suggestions?.map((s: any) => s.suggestion) || [],
      rating: evalDoc.rating || 0,
    })

    return NextResponse.json({
      success: true,
      itemsCreated: result.itemsCreated,
      message: result.message,
    })
  } catch (error) {
    console.error('AI enhancement failed:', error)
    return NextResponse.json(
      {
        error: 'Enhancement failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

