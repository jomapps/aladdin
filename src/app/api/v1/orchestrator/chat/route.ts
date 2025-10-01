/**
 * Chat Mode API Route
 * Handles general chat requests (no project context)
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content, conversationId } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Missing content' },
        { status: 400 }
      )
    }

    // TODO: Implement general chat
    // This would use a general AI model without project context

    // Generate conversation ID if new
    const newConversationId = conversationId || `conv-${Date.now()}`

    // Mock response for now
    const response = {
      success: true,
      conversationId: newConversationId,
      message: 'Chat message received',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    )
  }
}
