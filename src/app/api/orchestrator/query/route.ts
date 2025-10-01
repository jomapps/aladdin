/**
 * Query Mode API - Natural Language Query with Brain Service
 * Enables users to ask questions and explore project knowledge
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getBrainClient } from '@/lib/brain/client'
import { getLLMClient } from '@/lib/llm/client'
import { QueryRequestSchema, type QueryResponse } from '../types'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Authenticate user
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ req: req as any })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    // 2. Validate request
    const body = await req.json()
    const validationResult = QueryRequestSchema.safeParse(body)

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

    const { query, projectId, conversationId, collections, limit, includeRelationships } =
      validationResult.data

    console.log('[Query API] Processing query:', { query, projectId })

    // 3. Initialize clients
    const brainClient = getBrainClient()
    const llmClient = getLLMClient()

    // 4. Semantic search in Brain service
    const searchStartTime = Date.now()
    const searchResults = await brainClient.semanticSearch({
      query,
      types: collections,
      projectId,
      limit,
      threshold: 0.5,
    })
    const searchTime = Date.now() - searchStartTime

    console.log('[Query API] Search results:', searchResults.length)

    // 5. Build context from search results
    const context = searchResults
      .map(
        (result, idx) =>
          `[Source ${idx + 1}] (${result.type}, score: ${result.score.toFixed(2)})\n${result.content}`,
      )
      .join('\n\n')

    // 6. Generate answer using LLM with context
    const llmPrompt = `You are a helpful AI assistant for the Aladdin movie production project. Answer the user's question based on the provided context from the knowledge graph.

CONTEXT FROM KNOWLEDGE GRAPH:
${context}

USER QUESTION:
${query}

INSTRUCTIONS:
- Answer the question accurately using the provided context
- If the context doesn't contain enough information, say so clearly
- Cite sources by referencing [Source N] when appropriate
- Be concise but thorough
- If asked about relationships or connections, explore the graph structure

Answer:`

    const llmResponse = await llmClient.complete(llmPrompt, {
      temperature: 0.3,
      maxTokens: 1000,
    })

    // 7. Get related nodes if requested
    let relatedNodes: any[] = []
    if (includeRelationships && searchResults.length > 0) {
      const topResultId = searchResults[0].id
      const relationships = await brainClient.getRelationships(topResultId, {
        direction: 'both',
      })

      relatedNodes = relationships.slice(0, 5).map((rel) => ({
        id: rel.targetId,
        type: rel.targetType || 'unknown',
        name: rel.properties?.name || rel.targetId,
        relationship: rel.type,
        score: rel.properties?.confidence || 0.8,
      }))
    }

    // 8. Generate suggestions for follow-up queries
    const suggestions = generateSuggestions(searchResults, relatedNodes)

    // 9. Save to conversation if conversationId provided
    if (conversationId) {
      try {
        await payload.update({
          collection: 'conversations',
          id: conversationId,
          data: {
            messages: {
              // @ts-ignore
              append: [
                {
                  role: 'user',
                  content: query,
                  mode: 'query',
                  createdAt: new Date(),
                },
                {
                  role: 'assistant',
                  content: llmResponse,
                  mode: 'query',
                  metadata: {
                    sources: searchResults.length,
                    searchTime,
                  },
                  createdAt: new Date(),
                },
              ],
            },
            updatedAt: new Date(),
          },
        })
      } catch (convError) {
        console.error('[Query API] Failed to save to conversation:', convError)
        // Continue anyway - don't fail the request
      }
    }

    // 10. Build response
    const response: QueryResponse = {
      answer: llmResponse,
      sources: searchResults.map((result) => ({
        id: result.id,
        type: result.type,
        content: result.content,
        score: result.score,
        metadata: result.metadata || {},
      })),
      relatedNodes,
      confidence: searchResults.length > 0 ? searchResults[0].score : 0,
      suggestions,
      conversationId,
      metadata: {
        tokensUsed: llmClient.getTotalTokensUsed(),
        processingTime: Date.now() - startTime,
        searchTime,
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Query API] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'QUERY_ERROR',
        details: error.stack,
      },
      { status: 500 },
    )
  }
}

/**
 * Generate follow-up query suggestions
 */
function generateSuggestions(searchResults: any[], relatedNodes: any[]): string[] {
  const suggestions: string[] = []

  // Suggest exploring top result in more detail
  if (searchResults.length > 0) {
    const topResult = searchResults[0]
    if (topResult.type === 'character') {
      suggestions.push(`What are the key personality traits of this character?`)
      suggestions.push(`Which scenes feature this character?`)
    } else if (topResult.type === 'scene') {
      suggestions.push(`Who appears in this scene?`)
      suggestions.push(`What is the emotional tone of this scene?`)
    }
  }

  // Suggest exploring relationships
  if (relatedNodes.length > 0) {
    const relNode = relatedNodes[0]
    suggestions.push(`Tell me more about the relationship with ${relNode.name}`)
  }

  // Generic suggestions
  suggestions.push(`What other related content should I explore?`)

  return suggestions.slice(0, 3)
}
