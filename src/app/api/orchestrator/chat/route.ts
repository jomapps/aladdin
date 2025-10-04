/**
 * General Chat API - Standard LLM Conversation
 * Uses chat-assistant agent via chatHandler
 * MIGRATED TO AGENT-BASED ARCHITECTURE
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { ChatRequestSchema, type ChatResponse } from '../types'
import { handleChat } from '@/lib/orchestrator/chatHandler'

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
    const validationResult = ChatRequestSchema.safeParse(body)

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

    const { message, conversationId, model, temperature } = validationResult.data

    console.log('[Chat API] Processing message:', { conversationId, userId: user.id })

    // 3. Use chatHandler (which uses chat-assistant agent)
    const result = await handleChat({
      content: message,
      conversationId,
      userId: user.id.toString(),
      model,
      temperature,
    })

    // 4. Build response
    const response: ChatResponse = {
      message: result.message,
      conversationId: result.conversationId,
      model: result.model,
      usage: result.usage,
      suggestions: result.suggestions,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Chat API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'CHAT_ERROR',
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
