/**
 * Agent Orchestration API Route
 * Handles multi-agent orchestrated workflows
 */

import { NextRequest, NextResponse } from 'next/server'
import { orchestrate } from '@/lib/agents/orchestrator'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for complex orchestrations

/**
 * POST /api/v1/agents/orchestrate
 * Execute orchestrated multi-agent workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { prompt, projectId, conversationId, userId, metadata } = body

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required and must be a string' }, { status: 400 })
    }

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    console.log('[Orchestrate API] Starting orchestration...')
    console.log('[Orchestrate API] Project:', projectId)
    console.log('[Orchestrate API] Prompt length:', prompt.length)

    // Execute orchestration
    const result = await orchestrate({
      prompt,
      projectId,
      conversationId,
      userId,
      metadata,
    })

    console.log('[Orchestrate API] Orchestration complete')
    console.log('[Orchestrate API] Success:', result.success)
    console.log('[Orchestrate API] Departments:', result.departmentResults.length)
    console.log('[Orchestrate API] Total time:', result.totalExecutionTime, 'ms')

    return NextResponse.json({
      success: result.success,
      masterOutput: result.masterOutput,
      departments: result.departmentResults.map((dept) => ({
        departmentId: dept.departmentId,
        departmentName: dept.departmentName,
        output: dept.departmentHeadOutput,
        specialists: dept.specialistResults.map((spec) => ({
          agentId: spec.agentId,
          agentName: spec.agentName,
          output: spec.output,
          executionTime: spec.executionTime,
          qualityScore: spec.qualityScore,
        })),
        executionTime: dept.executionTime,
        qualityScore: dept.qualityScore,
      })),
      metrics: {
        totalExecutionTime: result.totalExecutionTime,
        totalTokens: result.totalTokens,
        estimatedCost: result.estimatedCost,
      },
      error: result.error,
    })
  } catch (error) {
    console.error('[Orchestrate API] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

