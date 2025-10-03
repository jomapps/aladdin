/**
 * Chat Mode Handler
 * Handles general AI conversation with optional project context via Brain service
 */

import { getLLMClient, type LLMMessage } from '@/lib/llm/client'
import { getBrainClient } from '@/lib/brain/client'
import { GLOBAL_PROJECT_ID, DEFAULT_SIMILARITY_THRESHOLD, DEFAULT_SEARCH_LIMIT } from '@/lib/brain/constants'
import type { SearchSimilarResult } from '@/lib/brain/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface ChatHandlerOptions {
  content: string
  conversationId?: string
  userId: string
  projectId?: string // Optional: if provided, uses project context; otherwise uses global
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface ChatHandlerResult {
  conversationId: string
  message: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  suggestions: string[]
}

/**
 * Handle general chat requests with Brain service integration
 */
export async function handleChat(options: ChatHandlerOptions): Promise<ChatHandlerResult> {
  const { content, conversationId, userId, projectId, model, temperature = 0.7, maxTokens = 2000 } = options

  // 1. Initialize clients
  const llmClient = getLLMClient()
  const brainClient = getBrainClient()
  const payload = await getPayload({ config: await configPromise })

  // Determine if we're using project-specific or global context
  const effectiveProjectId = projectId || GLOBAL_PROJECT_ID
  const isProjectContext = !!projectId

  console.log('[ChatHandler] Initialized with context:', {
    projectId: effectiveProjectId,
    isProjectContext
  })

  // 2. Load or create conversation
  let actualConversationId = conversationId
  let conversationHistory: LLMMessage[] = []
  let conversationProjectId: string | undefined

  if (conversationId) {
    try {
      const conversation = await payload.findByID({
        collection: 'conversations',
        id: conversationId,
      })

      if (conversation && conversation.messages) {
        conversationHistory = conversation.messages.map((msg: any) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }))
      }

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
    } catch (error) {
      console.error('[ChatHandler] Failed to load conversation:', error)
      // Continue with empty history
    }
  }

  // 3. Create conversation if new
  if (!actualConversationId) {
    const newConversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Chat - ${new Date().toISOString()}`,
        user: userId,
        status: 'active',
        messages: [],
        createdAt: new Date(),
      },
    })
    actualConversationId = newConversation.id.toString()
  }

  // 4. Query Brain service for relevant context
  console.log('[ChatHandler] Searching Brain for context:', content)

  let brainResults: SearchSimilarResult[] = []
  let brainContext = ''

  try {
    brainResults = await brainClient.searchSimilar({
      query: content,
      projectId: effectiveProjectId,
      limit: DEFAULT_SEARCH_LIMIT,
      threshold: DEFAULT_SIMILARITY_THRESHOLD,
    })

    console.log('[ChatHandler] Brain results:', brainResults.length)

    if (brainResults.length > 0) {
      brainContext = `\n\nRelevant Knowledge (${brainResults.length} items found):\n\n${brainResults
        .map((r, i) =>
          `${i + 1}. ${r.type.toUpperCase()}: ${r.properties.name || r.id} (${Math.round(r.similarity * 100)}% relevant)\n${r.content.substring(0, 200)}...`
        )
        .join('\n\n')}`
    }
  } catch (brainError: any) {
    console.warn('[ChatHandler] Brain search not available:', brainError.message)
    // Continue without Brain context - service may not have data yet
  }

  // 5. Build messages array with system prompt (enhanced with Brain context)
  const systemPrompt = isProjectContext
    ? `You are a helpful AI assistant for a movie production project. You can help with:
- Understanding project details (characters, scenes, locations, plot)
- Creative writing and storytelling within the project context
- Brainstorming ideas and overcoming writer's block
- Providing constructive feedback on the project

${brainContext ? brainContext : 'The project knowledge base is being built. I can still help with general creative guidance.'}

Provide clear, concise, and helpful responses. Use markdown formatting when appropriate.
Be encouraging and supportive while maintaining professionalism.`
    : `You are a helpful AI assistant for creative professionals. You can help with:
- Creative writing and storytelling
- Brainstorming ideas and overcoming writer's block
- General questions about narrative structure and techniques
- Providing constructive feedback and suggestions

${brainContext ? brainContext : ''}

Provide clear, concise, and helpful responses. Use markdown formatting when appropriate.
Be encouraging and supportive while maintaining professionalism.`

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...conversationHistory,
    {
      role: 'user',
      content,
    },
  ]

  // Intercept "what should I do next"-type intents to provide deterministic guidance
  if (isNextStepIntent(content)) {
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
                id: `msg-${Date.now()}-user`,
                role: 'user',
                content,
                timestamp: new Date(),
              },
              {
                id: `msg-${Date.now()}-assistant`,
                role: 'assistant',
                content: suggestion,
                timestamp: new Date(),
                agentId: 'heuristic/next-step',
              },
            ],
          },
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      })
    } catch (saveError) {
      console.error('[ChatHandler] Failed to save conversation (heuristic):', saveError)
      // Continue anyway
    }

    return {
      conversationId: actualConversationId!,
      message: suggestion,
      model: 'heuristic/next-step',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      suggestions: [],
    }
  }

  // 6. Get LLM response
  const llmResponse = await llmClient.chat(messages, {
    temperature,
    maxTokens,
  })

  console.log('[ChatHandler] LLM response generated:', {
    tokens: llmResponse.usage.totalTokens,
    model: llmResponse.model,
    brainResultsUsed: brainResults.length,
  })

  // 7. Generate contextual suggestions
  const suggestions = generateChatSuggestions(content, llmResponse.content)

  // 8. Save messages to conversation
  try {
    await payload.update({
      collection: 'conversations',
      id: actualConversationId,
      data: {
        messages: [
          ...conversationHistory,
          {
            id: `msg-${Date.now()}-user`,
            role: 'user',
            content,
            timestamp: new Date(),
          },
          {
            id: `msg-${Date.now()}-assistant`,
            role: 'assistant',
            content: llmResponse.content,
            timestamp: new Date(),
            metadata: brainResults.length > 0 ? { brainResultsCount: brainResults.length } : undefined,
          },
        ],
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },

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
async function computeNextDepartmentSuggestion(
  payload: any,
  projectId?: string,
): Promise<string> {
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
          and: [
            { projectId: { equals: projectId } },
            { departmentId: { equals: dept.id } },
          ],
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
    console.warn('[ChatHandler] Failed to compute next department suggestion:', e)
    return 'Try loading the Story Department'
  }
}

  } catch (saveError) {
    console.error('[ChatHandler] Failed to save conversation:', saveError)
    // Continue anyway - don't fail the request
  }

  // 9. Return result
  return {
    conversationId: actualConversationId,
    message: llmResponse.content,
    model: llmResponse.model,
    usage: {
      promptTokens: llmResponse.usage.promptTokens,
      completionTokens: llmResponse.usage.completionTokens,
      totalTokens: llmResponse.usage.totalTokens,
    },
    suggestions,
  }
}

/**
 * Generate contextual follow-up suggestions
 */
function generateChatSuggestions(userMessage: string, assistantResponse: string): string[] {
  const suggestions: string[] = []

  // Check for code in response
  if (assistantResponse.includes('```')) {
    suggestions.push('Can you explain this in more detail?')
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
