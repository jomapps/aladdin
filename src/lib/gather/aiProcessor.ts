/**
 * AI Processing Service for Gather Feature
 * Uses data-enricher agent for content enrichment
 * MIGRATED TO AGENT-BASED ARCHITECTURE
 */

import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface AIProcessingOptions {
  projectId: string
  userId: string
}

export interface ProcessingResult {
  summary: string
  context: string
  tags: string[]
}

export interface EnrichmentResult {
  summary: string
  context: string
  metadata: Record<string, any>
}

export interface VisionExtractionResult {
  text: string
  confidence: number
}

export interface DuplicateMatch {
  id: string
  similarity: number
  suggestion: 'skip' | 'merge' | 'review'
}

export class GatherAIProcessor {
  private maxIterations: number = 3

  constructor() {
    console.log('[GatherAIProcessor] Using agent-based architecture')
  }

  async extractText(
    fileUrl: string,
    fileType: 'image' | 'document',
  ): Promise<VisionExtractionResult> {
    // Vision processing would use fal.ai directly (allowed exception)
    return {
      text: 'Text extraction not yet implemented',
      confidence: 0,
    }
  }

  async enrichContent(content: string, options: AIProcessingOptions): Promise<EnrichmentResult> {
    const payload = await getPayload({ config: await configPromise })
    const runner = new AladdinAgentRunner(payload)

    const result = await runner.execute({
      agentId: 'data-enricher',
      prompt: `Enrich this content:

${content}

Provide summary, context, and metadata as JSON.`,
      context: options,
    })

    try {
      const parsed = JSON.parse(result.content)
      return {
        summary: parsed.summary || result.content.substring(0, 150),
        context: parsed.context || 'Enriched content',
        metadata: parsed.metadata || {},
      }
    } catch {
      return {
        summary: result.content.substring(0, 150),
        context: 'Enriched content',
        metadata: {},
      }
    }
  }

  async checkDuplicates(content: string, projectId: string): Promise<DuplicateMatch[]> {
    // Duplicate checking would query Brain service
    return []
  }

  async processContent(options: {
    content: string
    imageUrl?: string
    documentUrl?: string
    projectId: string
  }): Promise<{
    enrichedContent: string
    summary: string
    context: string
    tags: string[]
    extractedText?: string
    iterationCount?: number
    duplicates?: Array<{ similarity: number }>
  }> {
    const { content, projectId } = options

    // For now, return a simple processed version
    // In the future, this will use the data-enricher agent
    // Force rebuild
    return {
      enrichedContent: content,
      summary: content.substring(0, 150),
      context: 'Processed content',
      tags: [],
      extractedText: content,
      iterationCount: 1,
      duplicates: [],
    }
  }
}

// Singleton instance
let processorInstance: GatherAIProcessor | null = null

/**
 * Get or create the GatherAIProcessor singleton instance
 */
export function getGatherAIProcessor(): GatherAIProcessor {
  if (!processorInstance) {
    processorInstance = new GatherAIProcessor()
  }
  return processorInstance
}
