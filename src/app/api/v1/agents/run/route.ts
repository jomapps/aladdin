/**
 * Run Agent API Route
 * Manually trigger agent execution
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { handleUserRequest } from '@/lib/agents/orchestrator'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectSlug, prompt, agentId } = body

    if (!projectSlug || !prompt) {
      return NextResponse.json(
        { error: 'Project slug and prompt are required' },
        { status: 400 }
      )
    }

    // Run orchestration
    const result = await handleUserRequest({
      projectSlug,
      userPrompt: prompt
    })

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Error running agent:', error)
    return NextResponse.json(
      { error: 'Failed to run agent' },
      { status: 500 }
    )
  }
}
