/**
 * Query Mode API - Natural Language Query with Brain Service
 * Uses query-assistant agent via queryHandler
 * MIGRATED TO AGENT-BASED ARCHITECTURE
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { QueryRequestSchema, type QueryResponse } from '../types'
import { handleQuery } from '@/lib/orchestrator/queryHandler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    // 2. Validate request
    const body = await req.json()
    const validationResult = QueryRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { query, projectId, conversationId, collections, limit } = validationResult.data

    console.log('[Query API] Processing query:', { query, projectId })

    // 3. Use queryHandler (which uses query-assistant agent)
    const result = await handleQuery({
      content: query,
      projectId,
      conversationId,
      userId: user.id.toString(),
      limit,
      types: collections,
    })

    // 4. Build response
    const response: QueryResponse = {
      message: result.message,
      conversationId: result.conversationId,
      results: result.results,
      model: result.model,
      usage: result.usage,
      metadata: {
        searchTime: Date.now() - startTime,
        resultsCount: result.results.length,
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Query API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'QUERY_ERROR',
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
