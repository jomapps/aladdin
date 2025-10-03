/**
 * General Chat API - Standard LLM Conversation
 * No project context, just general AI assistance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getLLMClient } from '@/lib/llm/client'
import { ChatRequestSchema, type ChatResponse } from '../types'

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

    const { message, conversationId, model, temperature, stream } = validationResult.data

    console.log('[Chat API] Processing message:', { conversationId, stream })

    // 3. Initialize LLM client
    const llmClient = getLLMClient()

    // 4. Get conversation history if conversationId provided
    let conversationHistory: any[] = []
    let actualConversationId = conversationId
    let conversationProjectId: string | undefined

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

          // Capture project association if present
          try {
            // project can be an ID or a populated doc
            // @ts-ignore - Payload returns either string or object
            const proj = (conversation as any).project
            if (proj) {
              conversationProjectId =
                typeof proj === 'string' ? proj : proj?.id?.toString?.() || proj?.id
            }
          } catch {}
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

    // Intercept "what should I do next"-type intents to provide deterministic guidance
    if (isNextStepIntent(message)) {
      const suggestion = await computeNextDepartmentSuggestion(payload, conversationProjectId)

      // Save conversation with deterministic assistant response
      try {
        await payload.update({
          collection: 'conversations',
          id: actualConversationId!,
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
                  content: suggestion,
                  mode: 'chat',
                  metadata: {
                    model: 'heuristic/next-step',
                  },
                  createdAt: new Date(),
                },
              ],
            },
            updatedAt: new Date(),
          },
        })
      } catch (saveError) {
        console.error('[Chat API] Failed to save conversation (heuristic):', saveError)
      }

      const response: ChatResponse = {
        message: suggestion,
        conversationId: actualConversationId!,
        model: 'heuristic/next-step',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        suggestions: [],
      }

      return NextResponse.json(response)
    }

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
      { status: 500 },
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

/**
 * Detects if the user is asking for the next step
 */
function isNextStepIntent(text: string): boolean {
  const t = (text || '').toLowerCase()
  const phrases = [
    'what should i do next',
    "what's next",
    'what is next',
    'next step',
    'where should i start',
    'what do i do next',
  ]
  return phrases.some((p) => t.includes(p))
}

/**
 * Compute next department suggestion using project readiness if available,
 * otherwise fall back to first core department by codeDepNumber.
 */
async function computeNextDepartmentSuggestion(payload: any, projectId?: string): Promise<string> {
  try {
    const departments = await payload.find({
      collection: 'departments',
      where: {
        and: [
          { coreDepartment: { equals: true } },
          { gatherCheck: { equals: true } },
          { isActive: { equals: true } },
        ],
      },
      sort: 'codeDepNumber',
      limit: 100,
    })

    const docs = departments?.docs || []
    if (!docs.length) {
      return 'Try loading the Story Department'
    }

    // If no project context, suggest the first department in the flow
    if (!projectId) {
      const first = docs[0]
      return `Try loading the ${first.name}`
    }

    // With project context: find the lowest-number department not above threshold
    for (const dept of docs) {
      const evaluation = await payload.find({
        collection: 'project-readiness',
        where: {
          and: [{ projectId: { equals: projectId } }, { departmentId: { equals: dept.id } }],
        },
        sort: '-lastEvaluatedAt',
        limit: 1,
      })

      const evalData = evaluation?.docs?.[0]
      const threshold = (dept.coordinationSettings as any)?.minQualityThreshold || 80
      const rating = evalData?.rating ?? null
      const status = evalData?.status ?? 'pending'
      const aboveThreshold = rating !== null && rating >= threshold && status === 'completed'

      if (!aboveThreshold) {
        return `Try loading the ${dept.name}`
      }
    }

    // All above thresholds
    const last = docs[docs.length - 1]
    return `All core departments meet their thresholds. Try loading the ${last.name}.`
  } catch (e) {
    console.warn('[Chat API] Failed to compute next department suggestion:', e)
    return 'Try loading the Story Department'
  }
}
