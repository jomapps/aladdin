/**
 * Single Agent Execution API Route
 * Executes a single agent by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // 2 minutes

/**
 * POST /api/v1/agents/execute
 * Execute a single agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { agentId, prompt, projectId, conversationId, metadata } = body

    // Validate required fields
    if (!agentId || typeof agentId !== 'string') {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    console.log('[Execute API] Executing agent:', agentId)
    console.log('[Execute API] Project:', projectId)
    console.log('[Execute API] Prompt length:', prompt.length)

    // Get runner
    const payload = await getPayload({ config })
    const runner = await getAladdinAgentRunner(payload)

    // Execute agent
    const result = await runner.executeAgent(
      agentId,
      prompt,
      {
        projectId,
        conversationId: conversationId || `exec-${Date.now()}`,
        metadata,
      },
    )

    console.log('[Execute API] Execution complete')
    console.log('[Execute API] Execution ID:', result.executionId)
    console.log('[Execute API] Execution time:', result.executionTime, 'ms')
    console.log('[Execute API] Tokens used:', result.tokenUsage?.totalTokens)

    return NextResponse.json({
      success: !result.error,
      executionId: result.executionId,
      output: result.output,
      object: result.object,
      qualityScore: result.qualityScore,
      executionTime: result.executionTime,
      tokenUsage: result.tokenUsage,
      error: result.error,
    })
  } catch (error) {
    console.error('[Execute API] Error:', error)

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

