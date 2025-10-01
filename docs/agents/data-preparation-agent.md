# Data Preparation Agent - Architecture & Implementation Plan

**Version**: 1.0.0  
**Status**: Planning  
**Last Updated**: 2025-10-01

---

## Overview

The **Data Preparation Agent** is an intelligent middleware layer that intercepts ALL data destined for the brain service, enriches it with comprehensive context, and generates dynamic metadata summaries. This agent ensures that every piece of information stored in the brain service is contextually rich, properly related, and optimally searchable.

### Core Principle

> **"No data enters the brain service without passing through the Data Preparation Agent"**

The only exception is the `users` table/collection.

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Sources (Triggers)                       │
│  • PayloadCMS Hooks (afterChange, afterCreate)                  │
│  • Direct API Calls                                              │
│  • Agent-Generated Data                                          │
│  • Batch Operations                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Data Preparation Agent (Interceptor)                │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  1. CONTEXT GATHERING (Multi-Source)                      │ │
│  │     • Query PayloadCMS for related entities               │ │
│  │     • Query Brain Service for existing context            │ │
│  │     • Query Open MongoDB for project data                 │ │
│  │     • Fetch project-level metadata                        │ │
│  │     [ALL ISOLATED BY PROJECT_ID]                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                         │                                         │
│                         ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  2. LLM-POWERED METADATA GENERATION                       │ │
│  │     • Multi-sequence prompts to LLM                       │ │
│  │     • Dynamic metadata determination                      │ │
│  │     • Context-aware summary generation                    │ │
│  │     • Relationship identification                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                         │                                         │
│                         ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  3. DATA ENRICHMENT                                       │ │
│  │     • Pull related entities                               │ │
│  │     • Build comprehensive searchable text                 │ │
│  │     • Add quality metrics                                 │ │
│  │     • Include data lineage                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                         │                                         │
│                         ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  4. RELATIONSHIP AUTO-DISCOVERY                           │ │
│  │     • Identify implicit relationships                     │ │
│  │     • Create graph connections                            │ │
│  │     • Link to existing entities                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                         │                                         │
│                         ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  5. VALIDATION & TRANSFORMATION                           │ │
│  │     • Validate data quality                               │ │
│  │     • Transform to brain service format                   │ │
│  │     • Ensure completeness                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Brain Service (Storage)                       │
│  • Neo4j (Graph + Relationships)                                 │
│  • Jina (Embeddings)                                             │
│  • Retriv (Hybrid Search Index)                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Core Agent Service

**Location**: `src/lib/agents/data-preparation-agent.ts`

**Responsibilities**:
- Orchestrate the entire preparation pipeline
- Manage LLM interactions for metadata generation
- Coordinate context gathering from multiple sources
- Handle async processing and queueing

**Key Methods**:
```typescript
class DataPreparationAgent {
  // Main entry point
  async prepare(data: any, options: PrepareOptions): Promise<BrainDocument>
  
  // Context gathering
  async gatherContext(data: any, projectId: string): Promise<Context>
  
  // LLM-powered metadata generation
  async generateMetadata(data: any, context: Context): Promise<Metadata>
  
  // Data enrichment
  async enrichData(data: any, context: Context): Promise<EnrichedData>
  
  // Relationship discovery
  async discoverRelationships(data: any, context: Context): Promise<Relationship[]>
  
  // Validation
  async validate(document: BrainDocument): Promise<ValidationResult>
}
```

### 2. Interceptor Middleware

**Location**: `src/lib/brain/interceptor.ts`

**Responsibilities**:
- Intercept all brain service storage calls
- Route through data preparation agent
- Handle async processing
- Manage queue operations

**Integration Points**:
```typescript
// Wrap brain service client
class BrainServiceClient {
  async store(data: any): Promise<StoreResult> {
    // Intercept and route through agent
    const prepared = await dataPreparationAgent.prepare(data)
    return await this.rawStore(prepared)
  }
  
  async storeBatch(items: any[]): Promise<BatchResult> {
    // Batch preparation
    const prepared = await Promise.all(
      items.map(item => dataPreparationAgent.prepare(item))
    )
    return await this.rawStoreBatch(prepared)
  }
}
```

### 3. Context Gathering System

**Location**: `src/lib/agents/context-gatherer.ts`

**Responsibilities**:
- Query multiple data sources
- Aggregate context information
- Respect project_id isolation
- Cache frequently accessed data

**Data Sources**:
```typescript
interface ContextGatherer {
  // PayloadCMS
  async getPayloadContext(entityId: string, type: string, projectId: string): Promise<PayloadContext>
  
  // Brain Service
  async getBrainContext(projectId: string, entityType: string): Promise<BrainContext>
  
  // Open MongoDB
  async getOpenDBContext(projectId: string, collection: string): Promise<OpenDBContext>
  
  // Project-level
  async getProjectContext(projectId: string): Promise<ProjectContext>
  
  // Aggregate all
  async gatherAll(data: any, projectId: string): Promise<CompleteContext>
}
```

### 4. LLM Metadata Generator

**Location**: `src/lib/agents/metadata-generator.ts`

**Responsibilities**:
- Use LLM to dynamically determine relevant metadata
- Multi-sequence prompts for comprehensive analysis
- Generate context summaries
- Identify key relationships

**Prompt Sequences**:
```typescript
interface MetadataGenerator {
  // Sequence 1: Analyze entity type and determine metadata fields
  async analyzeEntity(data: any, context: Context): Promise<MetadataSchema>
  
  // Sequence 2: Extract metadata values
  async extractMetadata(data: any, schema: MetadataSchema): Promise<Metadata>
  
  // Sequence 3: Generate context summary
  async generateSummary(data: any, context: Context, metadata: Metadata): Promise<string>
  
  // Sequence 4: Identify relationships
  async identifyRelationships(data: any, context: Context): Promise<RelationshipSuggestion[]>
}
```

---

## Data Flow Examples

### Example 1: Character Creation via PayloadCMS

```typescript
// 1. User creates character in PayloadCMS
const character = {
  id: "char_123",
  name: "Aladdin",
  description: "Street-smart young man",
  appearance: "Brown vest, purple pants",
  projectId: "proj_aladdin"
}

// 2. PayloadCMS afterCreate hook triggers
afterCreate: async ({ doc }) => {
  await brainService.store(doc) // Intercepted!
}

// 3. Data Preparation Agent intercepts
const context = await contextGatherer.gatherAll(character, "proj_aladdin")
// Context includes:
// - Project: { name: "Aladdin", genre: ["adventure", "fantasy"], tone: "lighthearted" }
// - Existing characters: [{ name: "Jasmine" }, { name: "Genie" }]
// - Scenes mentioning Aladdin: [{ sceneNumber: 1, description: "..." }]
// - Related locations: [{ name: "Agrabah marketplace" }]

// 4. LLM generates metadata
const metadata = await metadataGenerator.generateMetadata(character, context)
// Result:
{
  characterType: "protagonist",
  role: "hero",
  archetypePattern: "hero's journey",
  visualSignature: "brown vest and purple pants",
  personalityTraits: ["street-smart", "resourceful", "kind-hearted"],
  storyFunction: "main character driving the plot",
  thematicConnection: "represents theme of inner worth vs outer appearance",
  sceneAppearances: [1, 3, 5, 7, 9],
  relationshipDynamics: {
    "Jasmine": "romantic interest",
    "Genie": "mentor/friend"
  }
}

// 5. Generate comprehensive summary
const summary = await metadataGenerator.generateSummary(character, context, metadata)
// Result:
"Aladdin is the protagonist of this adventure/fantasy story set in Agrabah. 
He is a street-smart young man characterized by his brown vest and purple pants. 
As the hero following a classic hero's journey arc, he embodies the theme of 
inner worth versus outer appearance. He appears in 5 key scenes and has 
significant relationships with Jasmine (romantic interest) and Genie (mentor/friend)."

// 6. Discover relationships
const relationships = await relationshipDiscoverer.discover(character, context)
// Result:
[
  { type: "APPEARS_IN", target: "scene_1", properties: { role: "main" } },
  { type: "APPEARS_IN", target: "scene_3", properties: { role: "main" } },
  { type: "LOVES", target: "char_jasmine", properties: { reciprocal: true } },
  { type: "BEFRIENDS", target: "char_genie", properties: { mentorship: true } },
  { type: "LIVES_IN", target: "loc_agrabah", properties: { familiarity: "high" } }
]

// 7. Final brain document
const brainDocument = {
  id: "char_aladdin_proj_aladdin",
  type: "character",
  project_id: "proj_aladdin",
  text: `${character.name}. ${character.description}. ${character.appearance}. ${summary}`,
  metadata: {
    ...metadata,
    sourceCollection: "characters",
    sourceId: "char_123",
    createdBy: "user",
    qualityRating: 0.95,
    completeness: 1.0,
    dataLineage: {
      source: "payloadcms",
      createdAt: "2025-10-01T10:00:00Z",
      processedBy: "data-preparation-agent",
      version: 1
    }
  },
  relationships: relationships
}

// 8. Store in brain service
await brainService.rawStore(brainDocument)
```

### Example 2: Scene Update via API

```typescript
// 1. API call to update scene
POST /api/v1/projects/proj_aladdin/scenes/scene_3
{
  sceneNumber: 3,
  description: "Aladdin meets Jasmine in the marketplace",
  location: "Agrabah marketplace",
  characters: ["Aladdin", "Jasmine"],
  mood: "romantic",
  timeOfDay: "afternoon"
}

// 2. Intercepted by data preparation agent
const context = await contextGatherer.gatherAll(scene, "proj_aladdin")
// Context includes:
// - Project context
// - Character details for Aladdin and Jasmine
// - Location details for marketplace
// - Previous/next scenes for continuity
// - Existing brain data about this scene

// 3. LLM determines this is a pivotal romantic scene
const metadata = await metadataGenerator.generateMetadata(scene, context)
{
  sceneType: "character_interaction",
  narrativeFunction: "relationship_development",
  emotionalTone: "romantic_tension",
  plotSignificance: "high",
  characterDevelopment: {
    "Aladdin": "reveals vulnerability",
    "Jasmine": "shows independence"
  },
  thematicElements: ["class_difference", "true_identity", "first_impressions"],
  continuityNotes: "Follows scene 2 (palace), leads to scene 4 (escape)"
}

// 4. Enrich with related data
const enriched = await enricher.enrich(scene, context)
// Adds: character backstories, location atmosphere, previous interactions

// 5. Store with full context
```

---

## Configuration System

### Entity-Specific Rules

**Location**: `src/lib/agents/config/entity-rules.ts`

```typescript
interface EntityRule {
  type: string
  requiredFields: string[]
  contextSources: ContextSource[]
  metadataTemplate: MetadataTemplate
  relationshipRules: RelationshipRule[]
  enrichmentStrategy: EnrichmentStrategy
}

const ENTITY_RULES: Record<string, EntityRule> = {
  character: {
    type: "character",
    requiredFields: ["name", "projectId"],
    contextSources: ["payload", "brain", "opendb"],
    metadataTemplate: {
      fields: ["characterType", "role", "personality", "relationships"],
      llmPrompt: "Analyze this character in the context of the story..."
    },
    relationshipRules: [
      { type: "APPEARS_IN", targetType: "scene", auto: true },
      { type: "LIVES_IN", targetType: "location", auto: true },
      { type: "RELATES_TO", targetType: "character", auto: false }
    ],
    enrichmentStrategy: "comprehensive"
  },
  scene: {
    // ... scene-specific rules
  },
  // ... more entity types
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create DataPreparationAgent core service
- [ ] Implement BrainServiceClient interceptor
- [ ] Set up basic context gathering
- [ ] Add project isolation

### Phase 2: LLM Integration (Week 1-2)
- [ ] Build MetadataGenerator with LLM
- [ ] Implement multi-sequence prompts
- [ ] Create dynamic metadata determination
- [ ] Add context summary generation

### Phase 3: Context & Enrichment (Week 2)
- [ ] Complete multi-source context gathering
- [ ] Implement data enrichment pipeline
- [ ] Add relationship auto-discovery
- [ ] Build validation system

### Phase 4: Integration (Week 2-3)
- [ ] PayloadCMS hooks integration
- [ ] Direct API integration
- [ ] Async queue processing
- [ ] Caching layer

### Phase 5: Configuration & Extension (Week 3)
- [ ] Entity-specific rules system
- [ ] Extensible configuration
- [ ] Monitoring and logging
- [ ] Performance optimization

### Phase 6: Testing & Documentation (Week 3-4)
- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Comprehensive documentation

---

## Key Design Decisions

### 1. **Project Isolation is Paramount**
Every context query, metadata generation, and relationship discovery MUST respect `project_id` boundaries.

### 2. **LLM as Intelligence Layer**
The LLM determines what metadata is relevant for each case - this is dynamic and context-aware, not hardcoded.

### 3. **Async by Default**
All operations are async to prevent blocking. Queue-based processing for heavy operations.

### 4. **Brain Service Can Be Queried**
The agent can query the brain service to find existing context and enrich new data.

### 5. **Generic & Extensible**
The pattern works for ANY entity type. New types can be added via configuration.

### 6. **No Exceptions (Except Users)**
ALL data storage goes through this agent, except the users table.

---

## Next Steps

1. Review and approve this architecture
2. Begin Phase 1 implementation
3. Create detailed API specifications
4. Set up monitoring and logging infrastructure
5. Document the pattern for reuse across the platform

---

**This pattern will be the foundation for intelligent, context-aware data storage across the entire Aladdin platform.**

