/**
 * Data Mode API Route
 * Handles data ingestion requests with Gather integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { handleData } from '@/lib/orchestrator/dataHandler'
import { authenticateRequest } from '@/lib/auth/devAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (bypass in development)
    const payload = await getPayload({ config: await configPromise })
    const { userId, isDevMode } = await authenticateRequest(request, payload)

    // In production, require authentication
    if (!isDevMode && !userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    // 2. Parse request
    const body = await request.json()
    const { content, projectId, conversationId, imageUrl, documentUrl } = body

    if (!content || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }

    console.log('[Data API] Processing data ingestion:', {
      projectId,
      conversationId,
      hasImage: !!imageUrl,
      hasDocument: !!documentUrl,
    })

    // 3. Validate project access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 },
      )
    }

    // 4. Handle data ingestion
    const result = await handleData({
      content,
      projectId,
      conversationId,
      userId: userId!,
      imageUrl,
      documentUrl,
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      gatherItemId: result.gatherItemId,
      message: result.message,
      summary: result.summary,
      context: result.context,
      duplicates: result.duplicates,
    })
  } catch (error: any) {
    console.error('[Data API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'DATA_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
