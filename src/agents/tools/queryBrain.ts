/**
 * Query Brain Custom Tool
 * Phase 3: Real Brain service integration for semantic search and validation
 */

import { getCustomToolDefinition } from '@codebuff/sdk'
import { z } from 'zod'
import { getBrainClient } from '@/lib/brain/client'
import { getJinaEmbeddings } from '@/lib/brain/embeddings'

export const queryBrainTool = getCustomToolDefinition({
  toolName: 'query_brain',
  description: 'Query Brain service for semantic search, consistency checks, and find related content',

  inputSchema: z.object({
    projectSlug: z.string().describe('Project slug for scoping search'),
    query: z.string().describe('Search query or content to check'),
    queryType: z.enum(['semantic_search', 'consistency_check', 'find_related']).optional(),
    limit: z.number().optional().default(5),
    contentType: z.string().optional().describe('Content type filter (character, scene, location, etc.)')
  }),

  execute: async ({ projectSlug, query, queryType = 'semantic_search', limit = 5, contentType }) => {
    try {
      const brain = getBrainClient()
      const jina = getJinaEmbeddings()

      if (queryType === 'semantic_search') {
        // Generate query embedding
        const embedding = await jina.generateQueryEmbedding(query)

        // Perform semantic search
        const results = await brain.semanticSearch({
          query,
          embedding: embedding.vector,
          types: contentType ? [contentType] : undefined,
          limit,
          threshold: 0.6,
        })

        const formattedResults = results.map(result => ({
          type: result.node.type,
          name: result.node.properties.name || 'Unnamed',
          relevance: result.score.toFixed(2),
          distance: result.distance.toFixed(2),
          content: result.node.properties,
        }))

        return [{
          type: 'text',
          value: `✅ Brain Semantic Search Results (${results.length} found):\n\n${JSON.stringify(formattedResults, null, 2)}`
        }]
      }

      if (queryType === 'consistency_check') {
        // Parse query as content to validate
        let content: any
        try {
          content = typeof query === 'string' ? JSON.parse(query) : query
        } catch {
          return [{
            type: 'text',
            value: 'Error: Query must be valid JSON for consistency check'
          }]
        }

        // Validate content
        const result = await brain.validateContent({
          content,
          type: contentType || 'character',
          projectId: projectSlug,
        })

        return [{
          type: 'text',
          value: `✅ Brain Consistency Check:\n\nValid: ${result.valid}\nQuality Score: ${result.qualityScore.toFixed(2)}/1.00\nCoherence: ${result.coherenceScore.toFixed(2)}\nCreativity: ${result.creativityScore.toFixed(2)}\nCompleteness: ${result.completenessScore.toFixed(2)}\n\nContradictions: ${result.contradictions.length}\nSuggestions:\n${result.suggestions.map(s => `  - ${s}`).join('\n')}`
        }]
      }

      if (queryType === 'find_related') {
        // Find similar content to query
        const embedding = await jina.generateQueryEmbedding(query)

        const results = await brain.semanticSearch({
          query,
          embedding: embedding.vector,
          types: contentType ? [contentType] : undefined,
          limit,
          threshold: 0.7,
        })

        const relatedContent = results.map(result => ({
          type: result.node.type,
          name: result.node.properties.name || 'Unnamed',
          relationship: result.score > 0.85 ? 'very_similar' : 'related',
          score: result.score.toFixed(2),
        }))

        return [{
          type: 'text',
          value: `✅ Brain Related Content (${relatedContent.length} found):\n\n${JSON.stringify(relatedContent, null, 2)}`
        }]
      }

      return [{
        type: 'text',
        value: 'Error: Unknown query type'
      }]
    } catch (error) {
      console.error('Brain query error:', error)
      return [{
        type: 'text',
        value: `❌ Error querying Brain: ${error instanceof Error ? error.message : 'Unknown error'}\n\nNote: Ensure BRAIN_API_URL and BRAIN_API_KEY are configured.`
      }]
    }
  }
})
