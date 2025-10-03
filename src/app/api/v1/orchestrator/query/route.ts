/**
 * Query Mode API Route
 * Handles query requests with brain service integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { handleQuery } from '@/lib/orchestrator/queryHandler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: request as any })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 2. Parse request
    const body = await request.json()
    const { content, projectId, conversationId, limit, types } = body

    if (!content || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    console.log('[Query API] Processing query:', { projectId, conversationId })

    // 3. Validate project access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 4. Handle query
    const result = await handleQuery({
      content,
      projectId,
      conversationId,
      userId: user.id,
      limit,
      types,
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      message: result.message,
      results: result.results,
      model: result.model,
      usage: result.usage,
    })
  } catch (error: any) {
    console.error('[Query API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'QUERY_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
