/**
 * Data Ingestion API - Intelligent Data Parsing and Validation
 * Uses data-enricher agent via dataHandler
 * MIGRATED TO AGENT-BASED ARCHITECTURE
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { DataIngestionRequestSchema, type DataIngestionResponse } from '../types'
import { handleData } from '@/lib/orchestrator/dataHandler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    // 2. Validate request
    const body = await req.json()
    const validationResult = DataIngestionRequestSchema.safeParse(body)

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

    const { data, projectId } = validationResult.data

    console.log('[Data Ingestion] Processing:', { projectId })

    // 3. Use dataHandler (which uses data-enricher agent)
    const result = await handleData({
      content: data,
      projectId,
      userId: user.id.toString(),
    })

    // 4. Build response
    const response: DataIngestionResponse = {
      conversationId: result.conversationId,
      gatherItemId: result.gatherItemId,
      message: result.message,
      summary: result.summary,
      duplicates: result.duplicates,
      metadata: {
        context: result.context,
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Data Ingestion] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'DATA_INGESTION_ERROR',
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
