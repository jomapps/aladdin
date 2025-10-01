# Data Preparation Agent - Technical Specification

**Version**: 1.0.0  
**Status**: Planning  
**Last Updated**: 2025-10-01

---

## Technical Architecture

### Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js (Next.js environment)
- **LLM Integration**: OpenAI GPT-4 / Anthropic Claude
- **Queue**: BullMQ (Redis-backed)
- **Caching**: Redis
- **Databases**: 
  - PayloadCMS (PostgreSQL)
  - Open MongoDB
  - Brain Service (Neo4j, Jina, Retriv)

---

## Core Components

### 1. DataPreparationAgent Class

**File**: `src/lib/agents/data-preparation-agent.ts`

```typescript
import { LLMClient } from '@/lib/llm/client'
import { ContextGatherer } from './context-gatherer'
import { MetadataGenerator } from './metadata-generator'
import { DataEnricher } from './data-enricher'
import { RelationshipDiscoverer } from './relationship-discoverer'
import { BrainDocumentValidator } from './validator'

export interface PrepareOptions {
  projectId: string
  entityType: string
  sourceCollection?: string
  sourceId?: string
  async?: boolean
  skipCache?: boolean
  customRules?: EntityRule
}

export interface BrainDocument {
  id: string
  type: string
  project_id: string
  text: string
  metadata: Record<string, any>
  relationships: Relationship[]
}

export class DataPreparationAgent {
  private llm: LLMClient
  private contextGatherer: ContextGatherer
  private metadataGenerator: MetadataGenerator
  private dataEnricher: DataEnricher
  private relationshipDiscoverer: RelationshipDiscoverer
  private validator: BrainDocumentValidator
  private cache: CacheManager
  private queue: QueueManager

  constructor(config: AgentConfig) {
    this.llm = new LLMClient(config.llm)
    this.contextGatherer = new ContextGatherer(config)
    this.metadataGenerator = new MetadataGenerator(this.llm, config)
    this.dataEnricher = new DataEnricher(config)
    this.relationshipDiscoverer = new RelationshipDiscoverer(this.llm, config)
    this.validator = new BrainDocumentValidator(config)
    this.cache = new CacheManager(config.redis)
    this.queue = new QueueManager(config.redis)
  }

  /**
   * Main entry point - prepares data for brain service storage
   */
  async prepare(data: any, options: PrepareOptions): Promise<BrainDocument> {
    const startTime = Date.now()
    
    try {
      // 1. Validate input
      this.validateInput(data, options)
      
      // 2. Check cache
      if (!options.skipCache) {
        const cached = await this.cache.get(this.getCacheKey(data, options))
        if (cached) return cached
      }
      
      // 3. Gather context from all sources
      const context = await this.contextGatherer.gatherAll(data, options.projectId)
      
      // 4. Generate metadata using LLM
      const metadata = await this.metadataGenerator.generate(data, context, options)
      
      // 5. Enrich data with related information
      const enriched = await this.dataEnricher.enrich(data, context, metadata)
      
      // 6. Discover and create relationships
      const relationships = await this.relationshipDiscoverer.discover(enriched, context)
      
      // 7. Build final brain document
      const brainDocument = this.buildBrainDocument(enriched, metadata, relationships, options)
      
      // 8. Validate
      const validation = await this.validator.validate(brainDocument)
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }
      
      // 9. Cache result
      await this.cache.set(this.getCacheKey(data, options), brainDocument, 3600)
      
      // 10. Log metrics
      this.logMetrics({
        duration: Date.now() - startTime,
        projectId: options.projectId,
        entityType: options.entityType,
        metadataFields: Object.keys(metadata).length,
        relationships: relationships.length
      })
      
      return brainDocument
      
    } catch (error) {
      this.logError(error, { data, options })
      throw error
    }
  }

  /**
   * Async preparation - queues the job and returns immediately
   */
  async prepareAsync(data: any, options: PrepareOptions): Promise<string> {
    const jobId = await this.queue.add('prepare-data', {
      data,
      options
    })
    
    return jobId
  }

  /**
   * Batch preparation - processes multiple items efficiently
   */
  async prepareBatch(items: Array<{ data: any; options: PrepareOptions }>): Promise<BrainDocument[]> {
    // Process in parallel with concurrency limit
    const results = await Promise.all(
      items.map(item => this.prepare(item.data, item.options))
    )
    
    return results
  }

  private buildBrainDocument(
    enriched: any,
    metadata: any,
    relationships: Relationship[],
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
        dataLineage: {
          source: 'data-preparation-agent',
          processedAt: new Date().toISOString(),
          version: 1
        }
      },
      relationships
    }
  }

  private buildSearchableText(enriched: any, metadata: any): string {
    // Build comprehensive searchable text
    const parts: string[] = []
    
    // Add main content
    if (enriched.name) parts.push(enriched.name)
    if (enriched.description) parts.push(enriched.description)
    
    // Add metadata context
    if (metadata.summary) parts.push(metadata.summary)
    
    // Add related entity names
    if (enriched.relatedEntities) {
      parts.push(enriched.relatedEntities.map((e: any) => e.name).join(', '))
    }
    
    return parts.join('. ')
  }

  private generateBrainId(data: any, options: PrepareOptions): string {
    return `${options.entityType}_${data.id || data._id}_${options.projectId}`
  }

  private getCacheKey(data: any, options: PrepareOptions): string {
    return `prep:${options.projectId}:${options.entityType}:${data.id || data._id}`
  }

  private validateInput(data: any, options: PrepareOptions): void {
    if (!data) throw new Error('Data is required')
    if (!options.projectId) throw new Error('projectId is required')
    if (!options.entityType) throw new Error('entityType is required')
  }

  private logMetrics(metrics: any): void {
    console.log('[DataPreparationAgent] Metrics:', metrics)
    // TODO: Send to monitoring service
  }

  private logError(error: any, context: any): void {
    console.error('[DataPreparationAgent] Error:', error, context)
    // TODO: Send to error tracking service
  }
}
```

---

### 2. ContextGatherer Class

**File**: `src/lib/agents/context-gatherer.ts`

```typescript
import { getPayload } from 'payload'
import { BrainServiceClient } from '@/lib/brain/client'
import { getOpenDatabase } from '@/lib/db/openDatabase'

export interface Context {
  project: ProjectContext
  payload: PayloadContext
  brain: BrainContext
  opendb: OpenDBContext
  related: RelatedEntities
}

export class ContextGatherer {
  private brainClient: BrainServiceClient
  private cache: CacheManager

  constructor(config: AgentConfig) {
    this.brainClient = new BrainServiceClient(config.brain)
    this.cache = new CacheManager(config.redis)
  }

  async gatherAll(data: any, projectId: string): Promise<Context> {
    // Gather from all sources in parallel
    const [project, payload, brain, opendb] = await Promise.all([
      this.getProjectContext(projectId),
      this.getPayloadContext(data, projectId),
      this.getBrainContext(data, projectId),
      this.getOpenDBContext(data, projectId)
    ])

    // Identify related entities
    const related = await this.getRelatedEntities(data, projectId, { project, payload, brain, opendb })

    return { project, payload, brain, opendb, related }
  }

  private async getProjectContext(projectId: string): Promise<ProjectContext> {
    // Check cache first
    const cached = await this.cache.get(`project:${projectId}`)
    if (cached) return cached

    const payload = await getPayload()
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId
    })

    const context: ProjectContext = {
      id: project.id,
      name: project.name,
      type: project.type,
      genre: project.genre,
      tone: project.tone,
      themes: project.themes,
      targetAudience: project.targetAudience,
      phase: project.phase,
      status: project.status
    }

    // Cache for 5 minutes
    await this.cache.set(`project:${projectId}`, context, 300)

    return context
  }

  private async getPayloadContext(data: any, projectId: string): Promise<PayloadContext> {
    // Query PayloadCMS for related entities
    const payload = await getPayload()
    
    const context: PayloadContext = {
      characters: [],
      scenes: [],
      locations: [],
      episodes: []
    }

    // Example: If this is a scene, get characters in the scene
    if (data.characters && Array.isArray(data.characters)) {
      context.characters = await Promise.all(
        data.characters.map(async (charId: string) => {
          return await payload.findByID({
            collection: 'characters',
            id: charId
          })
        })
      )
    }

    return context
  }

  private async getBrainContext(data: any, projectId: string): Promise<BrainContext> {
    // Query brain service for existing related data
    const results = await this.brainClient.query({
      project_id: projectId,
      query: this.buildContextQuery(data),
      top_k: 10
    })

    return {
      existingEntities: results.results,
      totalCount: results.total,
      relatedNodes: await this.getRelatedNodes(data, projectId)
    }
  }

  private async getOpenDBContext(data: any, projectId: string): Promise<OpenDBContext> {
    // Query open MongoDB for project-specific data
    const db = await getOpenDatabase(projectId)
    
    // Get counts and samples from various collections
    const collections = await db.listCollections().toArray()
    
    const context: OpenDBContext = {
      collections: collections.map(c => c.name),
      stats: {}
    }

    // Get stats for each collection
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments({ projectId })
      context.stats[collection.name] = { count }
    }

    return context
  }

  private async getRelatedEntities(
    data: any,
    projectId: string,
    context: Partial<Context>
  ): Promise<RelatedEntities> {
    // Analyze data and context to find related entities
    const related: RelatedEntities = {
      characters: [],
      scenes: [],
      locations: [],
      concepts: []
    }

    // Example: Extract character names from text
    if (data.description) {
      const characterNames = this.extractEntityNames(data.description, context.payload?.characters || [])
      related.characters = characterNames
    }

    return related
  }

  private buildContextQuery(data: any): string {
    // Build a query to find related context in brain
    const parts: string[] = []
    
    if (data.name) parts.push(data.name)
    if (data.description) parts.push(data.description)
    if (data.type) parts.push(data.type)
    
    return parts.join(' ')
  }

  private extractEntityNames(text: string, entities: any[]): string[] {
    // Simple name extraction - could be enhanced with NER
    return entities
      .filter(entity => text.includes(entity.name))
      .map(entity => entity.name)
  }

  private async getRelatedNodes(data: any, projectId: string): Promise<any[]> {
    // Query Neo4j for related nodes
    // This would use the brain service's graph query capabilities
    return []
  }
}
```

---

### 3. MetadataGenerator Class

**File**: `src/lib/agents/metadata-generator.ts`

```typescript
import { LLMClient } from '@/lib/llm/client'
import { Context } from './context-gatherer'

export class MetadataGenerator {
  private llm: LLMClient
  private config: AgentConfig

  constructor(llm: LLMClient, config: AgentConfig) {
    this.llm = llm
    this.config = config
  }

  async generate(data: any, context: Context, options: PrepareOptions): Promise<any> {
    // Multi-sequence LLM prompts
    
    // Sequence 1: Analyze entity and determine metadata schema
    const schema = await this.analyzeEntity(data, context, options)
    
    // Sequence 2: Extract metadata values
    const metadata = await this.extractMetadata(data, context, schema)
    
    // Sequence 3: Generate context summary
    const summary = await this.generateSummary(data, context, metadata)
    
    // Sequence 4: Identify key relationships
    const relationshipSuggestions = await this.identifyRelationships(data, context)
    
    return {
      ...metadata,
      summary,
      relationshipSuggestions,
      generatedAt: new Date().toISOString()
    }
  }

  private async analyzeEntity(data: any, context: Context, options: PrepareOptions): Promise<any> {
    const prompt = `
You are analyzing a ${options.entityType} entity for a movie production project.

Project Context:
- Name: ${context.project.name}
- Type: ${context.project.type}
- Genre: ${context.project.genre?.join(', ')}
- Tone: ${context.project.tone}
- Themes: ${context.project.themes?.join(', ')}

Entity Data:
${JSON.stringify(data, null, 2)}

Related Context:
- Characters in project: ${context.payload.characters?.length || 0}
- Scenes in project: ${context.payload.scenes?.length || 0}
- Existing brain entities: ${context.brain.totalCount || 0}

Task: Determine what metadata fields would be most valuable for this entity.
Consider:
1. What makes this entity unique in the story?
2. How does it relate to other entities?
3. What role does it play in the narrative?
4. What thematic elements does it represent?
5. What practical production information is needed?

Return a JSON object with metadata field names and their purposes.
`

    const response = await this.llm.complete(prompt, {
      temperature: 0.3,
      maxTokens: 1000
    })

    return JSON.parse(response)
  }

  private async extractMetadata(data: any, context: Context, schema: any): Promise<any> {
    const prompt = `
Based on the following metadata schema, extract values from the entity data and context.

Schema:
${JSON.stringify(schema, null, 2)}

Entity Data:
${JSON.stringify(data, null, 2)}

Context:
${JSON.stringify(context, null, 2)}

Extract metadata values that match the schema. Be specific and contextual.
Return a JSON object with the metadata values.
`

    const response = await this.llm.complete(prompt, {
      temperature: 0.2,
      maxTokens: 1500
    })

    return JSON.parse(response)
  }

  private async generateSummary(data: any, context: Context, metadata: any): Promise<string> {
    const prompt = `
Generate a comprehensive context summary for this entity that will be used for semantic search.

Entity: ${data.name || 'Unknown'}
Type: ${data.type || 'Unknown'}
Project: ${context.project.name}

Data:
${JSON.stringify(data, null, 2)}

Metadata:
${JSON.stringify(metadata, null, 2)}

Context:
- Project genre: ${context.project.genre?.join(', ')}
- Project themes: ${context.project.themes?.join(', ')}
- Related entities: ${context.related.characters?.length || 0} characters, ${context.related.scenes?.length || 0} scenes

Create a 2-3 sentence summary that:
1. Describes the entity's role in the story
2. Highlights key relationships
3. Mentions thematic connections
4. Includes searchable keywords

Return only the summary text, no JSON.
`

    return await this.llm.complete(prompt, {
      temperature: 0.4,
      maxTokens: 300
    })
  }

  private async identifyRelationships(data: any, context: Context): Promise<any[]> {
    const prompt = `
Identify relationships between this entity and others in the project.

Entity:
${JSON.stringify(data, null, 2)}

Available entities in project:
- Characters: ${context.payload.characters?.map((c: any) => c.name).join(', ')}
- Scenes: ${context.payload.scenes?.map((s: any) => s.name || s.sceneNumber).join(', ')}
- Locations: ${context.payload.locations?.map((l: any) => l.name).join(', ')}

Existing brain relationships:
${JSON.stringify(context.brain.relatedNodes, null, 2)}

Identify logical relationships. Return a JSON array of relationship suggestions:
[
  {
    "type": "RELATIONSHIP_TYPE",
    "target": "target_entity_id",
    "targetType": "character|scene|location",
    "properties": { "key": "value" },
    "confidence": 0.0-1.0,
    "reasoning": "why this relationship exists"
  }
]
`

    const response = await this.llm.complete(prompt, {
      temperature: 0.3,
      maxTokens: 1000
    })

    return JSON.parse(response)
  }
}
```

---

## Next Steps

1. Implement remaining components (DataEnricher, RelationshipDiscoverer, Validator)
2. Create BrainServiceClient interceptor
3. Set up queue processing with BullMQ
4. Implement caching layer
5. Add PayloadCMS hook integration
6. Create monitoring and logging
7. Write comprehensive tests

---

**This technical specification provides the foundation for implementing the Data Preparation Agent.**

