/**
 * AI Processing Service for Gather Feature
 * Handles content enrichment, summary/context generation, and vision processing
 */

import { getLLMClient } from '@/lib/llm/client'
import { getBrainClient } from '@/lib/brain/client'
import {
  AIProcessingOptions,
  ProcessingResult,
  EnrichmentResult,
  VisionExtractionResult,
  DuplicateMatch,
} from './types'

export class GatherAIProcessor {
  private llmClient: ReturnType<typeof getLLMClient>
  private maxIterations: number = 3

  constructor() {
    this.llmClient = getLLMClient()
  }

  /**
   * Extract text from image or PDF using vision model
   */
  async extractText(
    fileUrl: string,
    fileType: 'image' | 'document',
  ): Promise<VisionExtractionResult> {
    try {
      const visionModel = process.env.OPENROUTER_VISION_MODE || 'google/gemini-2.5-flash'

      const prompt =
        fileType === 'image'
          ? 'Extract all visible text from this image. Provide a clear, structured transcription.'
          : 'Extract all text content from this PDF document. Provide a clear, structured transcription.'

      const response = await this.llmClient.complete({
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nFile URL: ${fileUrl}`,
          },
        ],
        model: visionModel,
        options: {
          temperature: 0.3,
          maxTokens: 2000,
        },
      })

      return {
        extractedText: response.content,
        confidence: 0.9,
      }
    } catch (error) {
      console.error('[GatherAI] Text extraction failed:', error)
      return {
        extractedText: '',
        confidence: 0,
      }
    }
  }

  /**
   * Enrich content with context (automatic, max 3 iterations)
   */
  async enrichContent(content: any, projectContext: any): Promise<EnrichmentResult> {
    let enrichedContent = content
    let iterationCount = 0

    try {
      for (let i = 0; i < this.maxIterations; i++) {
        iterationCount++

        const response = await this.llmClient.complete({
          messages: [
            {
              role: 'system',
              content: `You are a content enrichment assistant. Analyze the provided content and determine if it needs additional context or clarification. If yes, enhance it with relevant details. If no, return the content as is.

Project Context: ${JSON.stringify(projectContext, null, 2)}`,
            },
            {
              role: 'user',
              content: `Current Content: ${JSON.stringify(enrichedContent, null, 2)}

Analyze if this content needs enrichment. If yes, provide enhanced version. If no, return { "isComplete": true, "content": <current_content> }`,
            },
          ],
          options: {
            temperature: 0.4,
            maxTokens: 1500,
          },
        })

        try {
          const result = JSON.parse(response.content)

          if (result.isComplete) {
            enrichedContent = result.content || enrichedContent
            return {
              enrichedContent,
              isComplete: true,
              iterationCount,
            }
          }

          enrichedContent = result.content || result
        } catch {
          // If not JSON, treat as enriched content
          enrichedContent = response.content
        }
      }

      return {
        enrichedContent,
        isComplete: true,
        iterationCount,
      }
    } catch (error) {
      console.error('[GatherAI] Content enrichment failed:', error)
      return {
        enrichedContent: content,
        isComplete: true,
        iterationCount,
      }
    }
  }

  /**
   * Generate summary (~100 characters)
   */
  async generateSummary(content: any): Promise<string> {
    try {
      const response = await this.llmClient.complete({
        messages: [
          {
            role: 'system',
            content:
              'You are a concise summarization assistant. Generate brief, informative summaries of approximately 100 characters.',
          },
          {
            role: 'user',
            content: `Generate a concise summary (~100 characters) of this content:\n\n${JSON.stringify(content, null, 2)}`,
          },
        ],
        options: {
          temperature: 0.3,
          maxTokens: 50,
        },
      })

      return response.content.trim()
    } catch (error) {
      console.error('[GatherAI] Summary generation failed:', error)
      return 'Content summary unavailable'
    }
  }

  /**
   * Generate detailed context paragraph
   */
  async generateContext(content: any, projectContext: any): Promise<string> {
    try {
      const response = await this.llmClient.complete({
        messages: [
          {
            role: 'system',
            content: `You are a context generation assistant. Generate detailed context paragraphs that explain content in relation to the project.

Project Context: ${JSON.stringify(projectContext, null, 2)}`,
          },
          {
            role: 'user',
            content: `Generate a detailed context paragraph explaining this content in relation to the project:\n\n${JSON.stringify(content, null, 2)}`,
          },
        ],
        options: {
          temperature: 0.4,
          maxTokens: 300,
        },
      })

      return response.content.trim()
    } catch (error) {
      console.error('[GatherAI] Context generation failed:', error)
      return 'Context generation unavailable'
    }
  }

  /**
   * Check for duplicate content using Brain service semantic search
   */
  async checkDuplicates(
    content: any,
    summary: string,
    projectId: string,
  ): Promise<DuplicateMatch[]> {
    try {
      // Initialize Brain client
      const brainClient = getBrainClient()

      // Create search query from content and summary
      const searchText = typeof content === 'string' ? content : JSON.stringify(content)
      const query = `${summary} ${searchText}`.substring(0, 1000) // Limit query length

      // Search for similar content in Brain service
      const results = await brainClient.searchSimilar({
        query,
        projectId,
        type: 'gather', // Search only in gather items
        limit: 5,
        threshold: 0.8, // >80% similarity threshold as per spec
      })

      // Transform results to DuplicateMatch format
      const duplicates: DuplicateMatch[] = results
        .filter((result) => result.similarity >= 0.8)
        .map((result) => ({
          id: result.id,
          similarity: result.similarity,
          content: result.content,
          summary: result.properties?.summary || '',
          suggestion:
            result.similarity > 0.95
              ? 'skip' // Very high similarity - likely duplicate
              : result.similarity > 0.9
                ? 'merge' // High similarity - consider merging
                : 'review', // Above threshold - needs review
        }))

      console.log(`[GatherAI] Found ${duplicates.length} potential duplicates`)
      return duplicates
    } catch (error) {
      console.error('[GatherAI] Duplicate detection failed:', error)
      // Return empty array on error - don't block the process
      return []
    }
  }

  /**
   * Full AI processing pipeline
   */
  async processContent(options: AIProcessingOptions): Promise<ProcessingResult> {
    const { content, imageUrl, documentUrl, projectId } = options

    let extractedText: string | undefined
    let enrichedContent = content

    try {
      // Step 1: Extract text from image/document if provided
      if (imageUrl) {
        const extraction = await this.extractText(imageUrl, 'image')
        extractedText = extraction.extractedText
      } else if (documentUrl) {
        const extraction = await this.extractText(documentUrl, 'document')
        extractedText = extraction.extractedText
      }

      // Step 2: Get project context (mock for now - will integrate with Brain)
      const projectContext = {
        projectId,
        // TODO: Fetch from Brain service
      }

      // Step 3: Enrich content
      const enrichmentResult = await this.enrichContent(enrichedContent, projectContext)
      enrichedContent = enrichmentResult.enrichedContent

      // Step 4: Generate summary
      const summary = await this.generateSummary(enrichedContent)

      // Step 5: Generate context
      const context = await this.generateContext(enrichedContent, projectContext)

      // Step 6: Check for duplicates using Brain service
      const duplicates = await this.checkDuplicates(enrichedContent, summary, projectId)

      return {
        summary,
        context,
        extractedText,
        iterationCount: enrichmentResult.iterationCount,
        duplicates,
        enrichedContent,
      }
    } catch (error) {
      console.error('[GatherAI] Processing failed:', error)
      throw error
    }
  }
}

// Singleton instance
let processorInstance: GatherAIProcessor | null = null

export function getGatherAIProcessor(): GatherAIProcessor {
  if (!processorInstance) {
    processorInstance = new GatherAIProcessor()
  }
  return processorInstance
}
