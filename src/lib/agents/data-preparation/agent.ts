/**
 * Data Preparation Agent - Core Service
 * Intercepts all data destined for brain service and enriches it with context
 */

import { getLLMClient, LLMClient } from '@/lib/llm/client'
import { ContextGatherer } from './context-gatherer'
import { MetadataGenerator } from './metadata-generator'
import { DataEnricher } from './data-enricher'
import { RelationshipDiscoverer } from './relationship-discoverer'
import { BrainDocumentValidator } from './validator'
import { CacheManager } from './cache-manager'
import { QueueManager } from './queue-manager'
import type {
  AgentConfig,
  PrepareOptions,
  BrainDocument,
  ProcessingMetrics,
  ValidationResult,
} from './types'

export class DataPreparationAgent {
  private llm: LLMClient
  private contextGatherer: ContextGatherer
  private metadataGenerator: MetadataGenerator
  private dataEnricher: DataEnricher
  private relationshipDiscoverer: RelationshipDiscoverer
  private validator: BrainDocumentValidator
  private cache: CacheManager
  private queue: QueueManager
  private config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
    this.llm = getLLMClient(config.llm)
    this.contextGatherer = new ContextGatherer(config)
    this.metadataGenerator = new MetadataGenerator(this.llm, config)
    this.dataEnricher = new DataEnricher(config)
    this.relationshipDiscoverer = new RelationshipDiscoverer(this.llm, config)
    this.validator = new BrainDocumentValidator(config)
    this.cache = new CacheManager(config.redis, config.cache)
    this.queue = new QueueManager(config.redis, config.queue)
  }

  /**
   * Main entry point - prepares data for brain service storage
   */
  async prepare(data: any, options: PrepareOptions): Promise<BrainDocument> {
    const startTime = Date.now()
    const metrics: Partial<ProcessingMetrics> = {
      projectId: options.projectId,
      entityType: options.entityType,
    }

    try {
      // 1. Validate input
      this.validateInput(data, options)
      console.log(`[DataPrepAgent] Preparing ${options.entityType} for project ${options.projectId}`)

      // 2. Check cache if enabled
      if (this.config.features.enableCaching && !options.skipCache) {
        const cached = await this.cache.get<BrainDocument>(
          this.getCacheKey(data, options)
        )
        if (cached) {
          console.log('[DataPrepAgent] Cache hit!')
          metrics.cacheHit = true
          metrics.duration = Date.now() - startTime
          this.logMetrics(metrics as ProcessingMetrics)
          return cached
        }
      }

      // 3. Gather context from all sources
      console.log('[DataPrepAgent] Gathering context...')
      const context = await this.contextGatherer.gatherAll(data, options.projectId)
      console.log('[DataPrepAgent] Context gathered:', {
        characters: context.payload.characters.length,
        scenes: context.payload.scenes.length,
        brainEntities: context.brain.totalCount,
      })

      // 4. Generate metadata using LLM
      console.log('[DataPrepAgent] Generating metadata with LLM...')
      const metadata = await this.metadataGenerator.generate(data, context, options)
      metrics.metadataFields = Object.keys(metadata).length
      console.log('[DataPrepAgent] Metadata generated:', Object.keys(metadata).length, 'fields')

      // 5. Enrich data with related information
      console.log('[DataPrepAgent] Enriching data...')
      const enriched = await this.dataEnricher.enrich(data, context, metadata)

      // 6. Discover and create relationships
      if (this.config.features.enableRelationshipDiscovery) {
        console.log('[DataPrepAgent] Discovering relationships...')
        const relationships = await this.relationshipDiscoverer.discover(
          enriched,
          context,
          metadata
        )
        metrics.relationships = relationships.length
        console.log('[DataPrepAgent] Relationships discovered:', relationships.length)

        // 7. Build final brain document
        const brainDocument = this.buildBrainDocument(
          enriched,
          metadata,
          relationships,
          options
        )

        // 8. Validate if enabled
        if (this.config.features.enableValidation) {
          console.log('[DataPrepAgent] Validating document...')
          const validation = await this.validator.validate(brainDocument)
          if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
          }
          if (validation.warnings.length > 0) {
            console.warn('[DataPrepAgent] Validation warnings:', validation.warnings)
          }
        }

        // 9. Cache result if enabled
        if (this.config.features.enableCaching) {
          await this.cache.set(
            this.getCacheKey(data, options),
            brainDocument,
            this.config.cache.documentTTL
          )
        }

        // 10. Log metrics
        metrics.duration = Date.now() - startTime
        metrics.tokensUsed = this.llm.getTotalTokensUsed()
        metrics.cacheHit = false
        this.logMetrics(metrics as ProcessingMetrics)

        console.log('[DataPrepAgent] Preparation complete!', {
          duration: metrics.duration,
          tokensUsed: metrics.tokensUsed,
        })

        return brainDocument
      } else {
        // No relationship discovery
        const brainDocument = this.buildBrainDocument(enriched, metadata, [], options)
        
        if (this.config.features.enableValidation) {
          const validation = await this.validator.validate(brainDocument)
          if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
          }
        }

        if (this.config.features.enableCaching) {
          await this.cache.set(
            this.getCacheKey(data, options),
            brainDocument,
            this.config.cache.documentTTL
          )
        }

        metrics.duration = Date.now() - startTime
        metrics.tokensUsed = this.llm.getTotalTokensUsed()
        metrics.relationships = 0
        this.logMetrics(metrics as ProcessingMetrics)

        return brainDocument
      }
    } catch (error: any) {
      metrics.duration = Date.now() - startTime
      metrics.errors = [error.message]
      this.logError(error, { data, options, metrics })
      throw error
    }
  }

  /**
   * Async preparation - queues the job and returns immediately
   */
  async prepareAsync(data: any, options: PrepareOptions): Promise<string> {
    if (!this.config.features.enableQueue) {
      throw new Error('Queue feature is disabled')
    }

    const jobId = await this.queue.add('prepare-data', {
      data,
      options,
    })

    console.log(`[DataPrepAgent] Queued job ${jobId}`)
    return jobId
  }

  /**
   * Batch preparation - processes multiple items efficiently
   */
  async prepareBatch(
    items: Array<{ data: any; options: PrepareOptions }>
  ): Promise<BrainDocument[]> {
    console.log(`[DataPrepAgent] Batch preparing ${items.length} items`)

    // Process in parallel with concurrency limit
    const results = await Promise.all(
      items.map(item => this.prepare(item.data, item.options))
    )

    console.log(`[DataPrepAgent] Batch complete: ${results.length} items processed`)
    return results
  }

  /**
   * Build final brain document
   */
  private buildBrainDocument(
    enriched: any,
    metadata: any,
    relationships: any[],
    options: PrepareOptions
  ): BrainDocument {
    return {
      id: this.generateBrainId(enriched, options),
      type: options.entityType,
      project_id: options.projectId,
      text: this.buildSearchableText(enriched, metadata),
      metadata: {
        ...metadata,
        sourceCollection: options.sourceCollection,
        sourceId: options.sourceId,
        createdBy: options.userId,
        createdByType: options.createdByType || 'user',
        dataLineage: {
          source: 'data-preparation-agent',
          processedAt: new Date().toISOString(),
          version: 1,
        },
      },
      relationships,
    }
  }

  /**
   * Build comprehensive searchable text
   */
  private buildSearchableText(enriched: any, metadata: any): string {
    const parts: string[] = []

    // Add main content
    if (enriched.name) parts.push(enriched.name)
    if (enriched.description) parts.push(enriched.description)
    if (enriched.content) parts.push(enriched.content)

    // Add metadata context
    if (metadata.summary) parts.push(metadata.summary)

    // Add related entity names
    if (enriched.relatedEntities && Array.isArray(enriched.relatedEntities)) {
      const names = enriched.relatedEntities
        .map((e: any) => e.name)
        .filter(Boolean)
      if (names.length > 0) {
        parts.push(names.join(', '))
      }
    }

    return parts.filter(Boolean).join('. ')
  }

  /**
   * Generate unique brain ID
   */
  private generateBrainId(data: any, options: PrepareOptions): string {
    const entityId = data.id || data._id || `new_${Date.now()}`
    return `${options.entityType}_${entityId}_${options.projectId}`
  }

  /**
   * Get cache key
   */
  private getCacheKey(data: any, options: PrepareOptions): string {
    const entityId = data.id || data._id || 'unknown'
    return `prep:${options.projectId}:${options.entityType}:${entityId}`
  }

  /**
   * Validate input
   */
  private validateInput(data: any, options: PrepareOptions): void {
    if (!data) {
      throw new Error('Data is required')
    }
    if (!options.projectId) {
      throw new Error('projectId is required')
    }
    if (!options.entityType) {
      throw new Error('entityType is required')
    }
  }

  /**
   * Log metrics
   */
  private logMetrics(metrics: ProcessingMetrics): void {
    console.log('[DataPrepAgent] Metrics:', metrics)
    // TODO: Send to monitoring service (e.g., PostHog, Sentry)
  }

  /**
   * Log error
   */
  private logError(error: any, context: any): void {
    console.error('[DataPrepAgent] Error:', error.message)
    console.error('[DataPrepAgent] Context:', context)
    // TODO: Send to error tracking service (e.g., Sentry)
  }
}

/**
 * Get singleton agent instance
 */
let agentInstance: DataPreparationAgent | null = null

export function getDataPreparationAgent(config?: AgentConfig): DataPreparationAgent {
  if (!agentInstance) {
    const defaultConfig: AgentConfig = {
      llm: {
        apiKey: process.env.OPENROUTER_API_KEY!,
        baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-sonnet-4.5',
        backupModel: process.env.OPENROUTER_BACKUP_MODEL,
      },
      brain: {
        apiUrl: process.env.BRAIN_SERVICE_BASE_URL || 'https://brain.ft.tc',
        apiKey: process.env.BRAIN_SERVICE_API_KEY!,
      },
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
      cache: {
        projectContextTTL: 300, // 5 minutes
        documentTTL: 3600, // 1 hour
        entityTTL: 1800, // 30 minutes
      },
      queue: {
        concurrency: 5,
        maxRetries: 3,
      },
      features: {
        enableCaching: true,
        enableQueue: true,
        enableValidation: true,
        enableRelationshipDiscovery: true,
      },
    }

    agentInstance = new DataPreparationAgent(config || defaultConfig)
  }

  return agentInstance
}

