/**
 * Chat Mode API Route
 * Handles general chat requests (no project context)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { handleChat } from '@/lib/orchestrator/chatHandler'

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
    const { content, conversationId, model, temperature, maxTokens } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Missing content', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    console.log('[Chat API] Processing message:', { conversationId })

    // 3. Handle chat
    const result = await handleChat({
      content,
      conversationId,
      userId: user.id,
      model,
      temperature,
      maxTokens,
    })

    // 4. Return response
    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      message: result.message,
      model: result.model,
      usage: result.usage,
      suggestions: result.suggestions,
    })
  } catch (error: any) {
    console.error('[Chat API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'CHAT_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
