/**
 * Send Message API Route
 * Handles sending messages and triggering agent orchestration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { handleUserRequest } from '@/lib/agents/orchestrator'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    const body = await req.json()
    const { content, projectSlug } = body

    if (!content || !projectSlug) {
      return NextResponse.json({ error: 'Content and project slug are required' }, { status: 400 })
    }

    // Get conversation
    const conversation = await payload.findByID({
      collection: 'conversations',
      id: conversationId,
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Add user message to conversation
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
      userId: user.id,
    }

    const updatedMessages = [...(conversation.messages || []), userMessage]

    await payload.update({
      collection: 'conversations',
      id: conversationId,
      data: {
        messages: updatedMessages,
        lastMessageAt: new Date(),
      },
    })

    // Trigger agent orchestration asynchronously
    // The response will be sent via SSE stream
    handleUserRequest({
      projectSlug,
      userPrompt: content,
      conversationId,
    })
      .then(async (result) => {
        // Add agent response to conversation
        const agentMessage = {
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: JSON.stringify(result, null, 2),
          timestamp: new Date().toISOString(),
          agentId: 'master-orchestrator',
        }

        const messages = await payload.findByID({
          collection: 'conversations',
          id: conversationId,
        })

        await payload.update({
          collection: 'conversations',
          id: conversationId,
          data: {
            messages: [...(messages.messages || []), agentMessage],
            lastMessageAt: new Date(),
          },
        })
      })
      .catch((error) => {
        console.error('Agent orchestration error:', error)
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
