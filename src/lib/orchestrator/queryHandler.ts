/**
 * Query Mode Handler
 * Handles Brain service queries with semantic search
 */

import { getLLMClient, type LLMMessage } from '@/lib/llm/client'
import { getBrainClient } from '@/lib/brain/client'
import type { SearchSimilarResult } from '@/lib/brain/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface QueryResult {
  id: string
  type: 'character' | 'scene' | 'location' | 'prop' | 'other'
  title: string
  content: string
  relevance: number
  metadata?: Record<string, any>
}

export interface QueryHandlerOptions {
  content: string
  projectId: string
  conversationId?: string
  userId: string
  limit?: number
  types?: string[]
}

export interface QueryHandlerResult {
  conversationId: string
  message: string
  results: QueryResult[]
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Transform Brain SearchSimilarResult to QueryResult
 */
function transformBrainResult(result: SearchSimilarResult): QueryResult {
  return {
    id: result.id,
    type: mapBrainTypeToQueryType(result.type),
    title: result.properties.name || result.properties.title || result.id,
    content: result.content || JSON.stringify(result.properties, null, 2),
    relevance: result.similarity,
    metadata: result.properties,
  }
}

/**
 * Handle query requests with Brain search
 */
export async function handleQuery(
  options: QueryHandlerOptions
): Promise<QueryHandlerResult> {
  const {
    content,
    projectId,
    conversationId,
    userId,
    limit = 10,
    types,
  } = options

  // 1. Initialize clients
  const llmClient = getLLMClient()
  const brainClient = getBrainClient()
  const payload = await getPayload({ config: await configPromise })

  console.log('[QueryHandler] Initialized Brain client for project:', projectId)

  // 2. Load or create conversation
  let actualConversationId = conversationId
  let conversationHistory: LLMMessage[] = []

  if (conversationId) {
    try {
      const conversation = await payload.findByID({
        collection: 'conversations',
        id: conversationId,
      })

      if (conversation && conversation.messages) {
        conversationHistory = conversation.messages
          .filter((msg: any) => msg.role !== 'system')
          .map((msg: any) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }))
      }
    } catch (error) {
      console.error('[QueryHandler] Failed to load conversation:', error)
    }
  }

  // 3. Create conversation if new
  if (!actualConversationId) {
    const newConversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Query - ${new Date().toISOString()}`,
        project: projectId,
        user: userId,
        status: 'active',
        messages: [],
        createdAt: new Date(),
      },
    })
    actualConversationId = newConversation.id.toString()
  }

  // 4. Search Brain for relevant entities
  console.log('[QueryHandler] Searching Brain for:', content)

  let brainResults: SearchSimilarResult[] = []

  try {
    brainResults = await brainClient.searchSimilar({
      query: content,
      projectId,
      type: types?.join(','), // Join multiple types with comma
      limit,
      threshold: 0.6, // 60% similarity threshold
    })

    console.log('[QueryHandler] Brain results:', brainResults.length)
  } catch (brainError: any) {
    console.error('[QueryHandler] Brain search failed:', brainError.message)
    // Continue with empty results - don't fail the entire request
  }

  // 5. Transform Brain results to QueryResults
  const queryResults: QueryResult[] = brainResults.map(transformBrainResult)

  // 6. Build context for LLM
  const brainContext = queryResults.length > 0
    ? `Found ${queryResults.length} relevant entities:\n\n${queryResults
        .map(
          (r, i) =>
            `${i + 1}. ${r.type.toUpperCase()}: ${r.title} (${Math.round(r.relevance * 100)}% relevant)\n${r.content.substring(0, 200)}...`
        )
        .join('\n\n')}`
    : 'No relevant entities found in the project Brain.'

  // 7. Build messages for LLM
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a helpful AI assistant that searches and retrieves information from a movie production project's knowledge base (Brain).

Your role:
- Help users find characters, scenes, locations, and other project entities
- Provide clear, concise summaries of search results
- Highlight the most relevant information
- Suggest follow-up queries

Project Context:
${brainContext}

Always cite which entity you're referring to when answering questions.`,
    },
    ...conversationHistory,
    {
      role: 'user',
      content,
    },
  ]

  // 8. Get LLM response
  const llmResponse = await llmClient.chat(messages, {
    temperature: 0.3, // Lower temperature for factual retrieval
    maxTokens: 1500,
  })

  console.log('[QueryHandler] LLM response generated:', {
    tokens: llmResponse.usage.totalTokens,
    model: llmResponse.model,
  })

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
            },
          ],
        },
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    })
  } catch (saveError) {
    console.error('[QueryHandler] Failed to save conversation:', saveError)
  }

  // 10. Return result
  return {
    conversationId: actualConversationId,
    message: llmResponse.content,
    results: queryResults,
    model: llmResponse.model,
    usage: {
      promptTokens: llmResponse.usage.promptTokens,
      completionTokens: llmResponse.usage.completionTokens,
      totalTokens: llmResponse.usage.totalTokens,
    },
  }
}

/**
 * Map Brain entity type to QueryResult type
 */
function mapBrainTypeToQueryType(
  brainType: string
): 'character' | 'scene' | 'location' | 'prop' | 'other' {
  const typeMap: Record<string, 'character' | 'scene' | 'location' | 'prop' | 'other'> = {
    character: 'character',
    scene: 'scene',
    location: 'location',
    prop: 'prop',
  }

  return typeMap[brainType.toLowerCase()] || 'other'
}
