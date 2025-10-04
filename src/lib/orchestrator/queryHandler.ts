/**
 * Query Mode Handler - Uses query-assistant agent
 * MIGRATED TO AGENT-BASED ARCHITECTURE
 */

import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'
import { getBrainClient } from '@/lib/brain/client'
import type { SearchSimilarResult } from '@/lib/brain/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { isValidObjectId } from '@/lib/auth/devAuth'

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

export async function handleQuery(options: QueryHandlerOptions): Promise<QueryHandlerResult> {
  const { content, projectId, conversationId, userId, limit = 10, types } = options

  const brainClient = getBrainClient()
  const payload = await getPayload({ config: await configPromise })

  // Search Brain
  let brainResults: SearchSimilarResult[] = []
  const brainProjectId = `${userId}-${projectId}`

  try {
    brainResults = await brainClient.searchSimilar({
      query: content,
      projectId: brainProjectId,
      type: types?.join(','),
      limit,
      threshold: 0.6,
    })
  } catch (error: any) {
    console.warn('[QueryHandler] Brain search failed:', error.message)
  }

  const queryResults: QueryResult[] = brainResults.map(transformBrainResult)

  // Build context for agent
  const brainContext =
    queryResults.length > 0
      ? `Found ${queryResults.length} entities:\n${queryResults.map((r, i) => `${i + 1}. ${r.type}: ${r.title}`).join('\n')}`
      : 'No entities found in Brain knowledge base yet.'

  // Use query-assistant agent
  const runner = new AladdinAgentRunner(payload)
  const result = await runner.execute({
    agentId: 'query-assistant',
    prompt: `${brainContext}

User Question: ${content}

Synthesize the search results into a helpful answer.`,
    context: { projectId, userId, conversationId },
  })

  return {
    conversationId: conversationId || `conv-${Date.now()}`,
    message: result.content,
    results: queryResults,
    model: result.model,
    usage: result.usage,
  }
}

function mapBrainTypeToQueryType(
  brainType: string,
): 'character' | 'scene' | 'location' | 'prop' | 'other' {
  const typeMap: Record<string, 'character' | 'scene' | 'location' | 'prop' | 'other'> = {
    character: 'character',
    scene: 'scene',
    location: 'location',
    prop: 'prop',
  }
  return typeMap[brainType.toLowerCase()] || 'other'
}
