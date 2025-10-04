/**
 * Data Preparation Agent - Core Service
 * Uses AIAgentExecutor with utility agents for data enrichment
 *
 * MIGRATED TO AGENT-BASED ARCHITECTURE
 */

import { AIAgentExecutor } from '@/lib/ai/agent-executor'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type {
  AgentConfig,
  PrepareOptions,
  BrainDocument,
  ProcessingMetrics,
} from './types'

export class DataPreparationAgent {
  private config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
    console.log('[DataPrepAgent] Initialized with agent-based architecture')
  }

  /**
   * Main entry point - prepares data for brain service storage
   */
  async prepare(data: any, options: PrepareOptions): Promise<BrainDocument> {
    const startTime = Date.now()
    const payload = await getPayload({ config: await configPromise })
    const executor = new AIAgentExecutor(payload)

    console.log(`[DataPrepAgent] Preparing ${options.entityType} for project ${options.projectId}`)

    try {
      // Use data-enricher agent for content processing
      const result = await executor.execute({
        agentId: 'data-enricher',
        prompt: `Enrich this ${options.entityType} data for storage in the Brain knowledge base:

Content: ${JSON.stringify(data, null, 2)}

Generate:
1. Summary (100-150 words)
2. Context explaining how this fits into the project
3. Relevant tags for searchability
4. Entity type classification

Format as JSON with fields: summary, context, tags, entityType`,
        context: {
          projectId: options.projectId,
          userId: options.userId || 'system',
        },
      })

      // Parse the enrichment result
      let enrichment
      try {
        enrichment = JSON.parse(result.content)
      } catch {
        // Fallback if not valid JSON
        enrichment = {
          summary: result.content.substring(0, 150),
          context: 'Enriched content',
          tags: [],
          entityType: options.entityType,
        }
      }

      // Build brain document
      const brainDoc: BrainDocument = {
        id: data.id || `${options.entityType}-${Date.now()}`,
        type: options.entityType,
        content: typeof data === 'string' ? data : JSON.stringify(data),
        properties: {
          name: data.name || data.title || enrichment.summary.substring(0, 50),
          summary: enrichment.summary,
          context: enrichment.context,
          tags: enrichment.tags || [],
          projectId: options.projectId,
          createdAt: new Date().toISOString(),
        },
        metadata: {
          source: 'data-preparation-agent',
          version: '2.0-agent-based',
          enrichedAt: new Date().toISOString(),
        },
      }

      const duration = Date.now() - startTime
      console.log(`[DataPrepAgent] Completed in ${duration}ms`)

      return brainDoc
    } catch (error) {
      console.error('[DataPrepAgent] Error:', error)
      throw error
    }
  }

  /**
   * Validate input data
   */
  private validateInput(data: any, options: PrepareOptions): void {
    if (!data) {
      throw new Error('Data is required')
    }
    if (!options.projectId) {
      throw new Error('ProjectId is required')
    }
    if (!options.entityType) {
      throw new Error('EntityType is required')
    }
  }
}

// Export for backward compatibility
export { DataPreparationAgent as default }
