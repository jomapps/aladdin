/**
 * Project Readiness API Routes
 *
 * GET /api/v1/project-readiness/[projectId]
 * Get all department evaluations and overall readiness score
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { calculateProjectReadinessScore } from '@/lib/evaluation/score-calculator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const payload = await getPayload({ config })

    // Get all core departments in order
    const departments = await payload.find({
      collection: 'departments',
      where: {
        and: [{ coreDepartment: { equals: true } }, { gatherCheck: { equals: true } }],
      },
      sort: 'codeDepNumber',
    })

    // Get evaluations for each department
    const departmentEvaluations = await Promise.all(
      departments.docs.map(async (dept) => {
        const evaluation = await payload.find({
          collection: 'project-readiness',
          where: {
            and: [{ projectId: { equals: projectId } }, { departmentId: { equals: dept.id } }],
          },
          limit: 1,
          sort: '-lastEvaluatedAt',
        })

        const evalData = evaluation.docs[0]
        const threshold = (dept.coordinationSettings as any)?.minQualityThreshold || 80

        return {
          departmentId: dept.id,
          departmentSlug: dept.slug,
          departmentName: dept.name,
          departmentNumber: dept.codeDepNumber,
          status: evalData?.status || 'pending',
          rating: evalData?.rating || null,
          taskId: evalData?.taskId || null,
          evaluationSummary: evalData?.evaluationSummary || null,
          evaluationResult: evalData?.evaluationResult || null,
          issues: evalData?.issues || [],
          suggestions: evalData?.suggestions || [],
          threshold,
          lastEvaluatedAt: evalData?.lastEvaluatedAt || null,
        }
      }),
    )

    // Calculate overall readiness score
    const completedEvaluations = departmentEvaluations.filter(
      (d) => d.status === 'completed' && d.rating !== null,
    )

    const projectReadinessScore =
      completedEvaluations.length > 0
        ? calculateProjectReadinessScore(
            completedEvaluations.map((d) => ({
              departmentSlug: d.departmentSlug,
              departmentNumber: d.departmentNumber,
              rating: d.rating!,
            })),
          )
        : null

    return NextResponse.json({
      projectId,
      projectReadinessScore,
      gatherCount: 0, // Will be updated by separate endpoint
      gatherLineCount: 0, // Will be updated by separate endpoint
      departments: departmentEvaluations,
    })
  } catch (error) {
    console.error('Failed to get project readiness:', error)
    return NextResponse.json(
      { error: 'Failed to get project readiness', details: (error as Error).message },
      { status: 500 },
    )
  }
}
