/**
 * General Chat API - Standard LLM Conversation
 * No project context, just general AI assistance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { getLLMClient } from '@/lib/llm/client'
import { ChatRequestSchema, type ChatResponse } from '../types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await getPayloadHMR({ config: configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
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
        { status: 400 }
      )
    }

    const { message, conversationId, model, temperature, stream } = validationResult.data

    console.log('[Chat API] Processing message:', { conversationId, stream })

    // 3. Initialize LLM client
    const llmClient = getLLMClient()

    // 4. Get conversation history if conversationId provided
    let conversationHistory: any[] = []
    let actualConversationId = conversationId

    if (conversationId) {
      try {
        const conversation = await payload.findByID({
          collection: 'conversations',
          id: conversationId,
        })

        if (conversation && conversation.messages) {
          conversationHistory = conversation.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          }))
        }
      } catch (convError) {
        console.error('[Chat API] Failed to load conversation:', convError)
      }
    }

    // 5. If no conversationId, create new conversation
    if (!actualConversationId) {
      const newConversation = await payload.create({
        collection: 'conversations',
        data: {
          name: `Chat - ${new Date().toISOString()}`,
          user: user.id,
          status: 'active',
          messages: [],
          createdAt: new Date(),
        },
      })
      actualConversationId = newConversation.id
    }

    // 6. Build messages array
    const messages = [
      {
        role: 'system' as const,
        content: `You are a helpful AI assistant. You can help with:
- General questions and explanations
- Code assistance and debugging
- Writing and editing
- Analysis and problem-solving
- Creative tasks

Provide clear, concise, and helpful responses. Use markdown formatting when appropriate.`,
      },
      ...conversationHistory,
      {
        role: 'user' as const,
        content: message,
      },
    ]

    // 7. Get LLM response
    const llmResponse = await llmClient.chat(messages, {
      temperature: temperature ?? 0.7,
      maxTokens: 2000,
    })

    console.log('[Chat API] LLM response generated:', {
      tokens: llmResponse.usage.totalTokens,
      model: llmResponse.model,
    })

    // 8. Generate suggestions for follow-up
    const suggestions = generateChatSuggestions(message, llmResponse.content)

    // 9. Save to conversation
    try {
      await payload.update({
        collection: 'conversations',
        id: actualConversationId,
        data: {
          messages: {
            // @ts-ignore
            append: [
              {
                role: 'user',
                content: message,
                mode: 'chat',
                createdAt: new Date(),
              },
              {
                role: 'assistant',
                content: llmResponse.content,
                mode: 'chat',
                metadata: {
                  model: llmResponse.model,
                  tokens: llmResponse.usage.totalTokens,
                },
                createdAt: new Date(),
              },
            ],
          },
          updatedAt: new Date(),
        },
      })
    } catch (saveError) {
      console.error('[Chat API] Failed to save conversation:', saveError)
      // Continue anyway
    }

    // 10. Build response
    const response: ChatResponse = {
      message: llmResponse.content,
      conversationId: actualConversationId,
      model: llmResponse.model,
      usage: {
        promptTokens: llmResponse.usage.promptTokens,
        completionTokens: llmResponse.usage.completionTokens,
        totalTokens: llmResponse.usage.totalTokens,
      },
      suggestions,
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
      { status: 500 }
    )
  }
}

/**
 * Generate contextual follow-up suggestions
 */
function generateChatSuggestions(userMessage: string, assistantResponse: string): string[] {
  const suggestions: string[] = []

  // Check for code in response
  if (assistantResponse.includes('```')) {
    suggestions.push('Can you explain this code in more detail?')
    suggestions.push('Are there any alternative approaches?')
  }

  // Check for lists or options
  if (assistantResponse.includes('\n-') || assistantResponse.includes('\n1.')) {
    suggestions.push('Can you elaborate on the first point?')
    suggestions.push('Which option would you recommend?')
  }

  // Generic helpful suggestions
  suggestions.push('Can you provide an example?')
  suggestions.push('What are the pros and cons?')

  return suggestions.slice(0, 3)
}
