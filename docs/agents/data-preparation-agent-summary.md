# Data Preparation Agent - Executive Summary

**Version**: 1.0.0  
**Status**: Planning Phase  
**Last Updated**: 2025-10-01

---

## What Is It?

The **Data Preparation Agent** is an intelligent middleware layer that sits between your application and the brain service. It ensures that every piece of data stored in the brain service is:

1. **Contextually Rich** - Enriched with related information from multiple sources
2. **Intelligently Analyzed** - Metadata generated dynamically by LLM based on context
3. **Properly Connected** - Relationships automatically discovered and created
4. **Optimally Searchable** - Comprehensive text built for hybrid search
5. **Project Isolated** - All operations respect project_id boundaries

---

## The Golden Rule

> **"No data enters the brain service without passing through the Data Preparation Agent"**

**Exception**: Users table only.

---

## Why Do We Need It?

### Problem: Dumb Data Storage
Without the agent:
```typescript
// Raw data goes to brain
await brainService.store({
  name: "Aladdin",
  description: "A young man"
})

// Result: Minimal context, no relationships, poor searchability
```

### Solution: Intelligent Data Preparation
With the agent:
```typescript
// Same input, but agent enriches it
await brainService.store({
  name: "Aladdin",
  description: "A young man"
})

// Agent automatically:
// 1. Gathers project context (genre, themes, tone)
// 2. Finds related entities (Jasmine, Genie, scenes)
// 3. Queries brain for existing context
// 4. Uses LLM to generate rich metadata
// 5. Creates relationships automatically
// 6. Builds comprehensive searchable text

// Result: Rich, connected, searchable data
```

---

## How It Works

### The Pipeline

```
Input Data
    ↓
[1] Context Gathering
    • PayloadCMS: Related entities
    • Brain Service: Existing context
    • Open MongoDB: Project data
    • Project: Genre, themes, tone
    ↓
[2] LLM Analysis (Multi-Sequence)
    • Determine relevant metadata fields
    • Extract metadata values
    • Generate context summary
    • Identify relationships
    ↓
[3] Data Enrichment
    • Pull related entity details
    • Build comprehensive text
    • Add quality metrics
    • Include data lineage
    ↓
[4] Relationship Discovery
    • Auto-detect connections
    • Create graph relationships
    • Link to existing entities
    ↓
[5] Validation & Storage
    • Validate completeness
    • Transform to brain format
    • Store in brain service
```

---

## Real-World Example

### Input: Simple Character
```json
{
  "name": "Aladdin",
  "description": "Street-smart young man",
  "appearance": "Brown vest, purple pants",
  "projectId": "proj_aladdin"
}
```

### Agent Processing

**Step 1: Context Gathering**
```typescript
// Agent queries multiple sources
const context = {
  project: {
    name: "Aladdin",
    genre: ["adventure", "fantasy"],
    tone: "lighthearted",
    themes: ["inner worth", "true love", "identity"]
  },
  existingCharacters: ["Jasmine", "Genie", "Jafar"],
  scenes: [
    { sceneNumber: 1, description: "Aladdin steals bread" },
    { sceneNumber: 3, description: "Meets Jasmine in marketplace" }
  ],
  locations: ["Agrabah marketplace", "Cave of Wonders"]
}
```

**Step 2: LLM Generates Metadata**
```typescript
// Agent sends context to LLM
const metadata = {
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
    "Genie": "mentor/friend",
    "Jafar": "antagonist"
  },
  narrativeArc: "from street rat to prince to true self",
  emotionalJourney: "self-discovery and acceptance"
}
```

**Step 3: Generate Summary**
```typescript
const summary = `
Aladdin is the protagonist of this adventure/fantasy story set in Agrabah. 
He is a street-smart young man characterized by his brown vest and purple pants. 
As the hero following a classic hero's journey arc, he embodies the theme of 
inner worth versus outer appearance. He appears in 5 key scenes and has 
significant relationships with Jasmine (romantic interest), Genie (mentor/friend), 
and Jafar (antagonist). His narrative arc takes him from street rat to prince 
to discovering his true self.
`
```

**Step 4: Discover Relationships**
```typescript
const relationships = [
  { type: "APPEARS_IN", target: "scene_1", properties: { role: "main" } },
  { type: "APPEARS_IN", target: "scene_3", properties: { role: "main" } },
  { type: "LOVES", target: "char_jasmine", properties: { reciprocal: true } },
  { type: "BEFRIENDS", target: "char_genie", properties: { mentorship: true } },
  { type: "OPPOSES", target: "char_jafar", properties: { conflict: "high" } },
  { type: "LIVES_IN", target: "loc_agrabah", properties: { familiarity: "high" } }
]
```

### Output: Rich Brain Document
```json
{
  "id": "char_aladdin_proj_aladdin",
  "type": "character",
  "project_id": "proj_aladdin",
  "text": "Aladdin. Street-smart young man. Brown vest, purple pants. Aladdin is the protagonist of this adventure/fantasy story set in Agrabah...",
  "metadata": {
    "characterType": "protagonist",
    "role": "hero",
    "archetypePattern": "hero's journey",
    "visualSignature": "brown vest and purple pants",
    "personalityTraits": ["street-smart", "resourceful", "kind-hearted"],
    "storyFunction": "main character driving the plot",
    "thematicConnection": "represents theme of inner worth vs outer appearance",
    "sceneAppearances": [1, 3, 5, 7, 9],
    "relationshipDynamics": {
      "Jasmine": "romantic interest",
      "Genie": "mentor/friend",
      "Jafar": "antagonist"
    },
    "narrativeArc": "from street rat to prince to true self",
    "emotionalJourney": "self-discovery and acceptance",
    "sourceCollection": "characters",
    "sourceId": "char_123",
    "qualityRating": 0.95,
    "dataLineage": {
      "source": "data-preparation-agent",
      "processedAt": "2025-10-01T10:00:00Z",
      "version": 1
    }
  },
  "relationships": [
    { "type": "APPEARS_IN", "target": "scene_1", "properties": { "role": "main" } },
    { "type": "APPEARS_IN", "target": "scene_3", "properties": { "role": "main" } },
    { "type": "LOVES", "target": "char_jasmine", "properties": { "reciprocal": true } },
    { "type": "BEFRIENDS", "target": "char_genie", "properties": { "mentorship": true } },
    { "type": "OPPOSES", "target": "char_jafar", "properties": { "conflict": "high" } },
    { "type": "LIVES_IN", "target": "loc_agrabah", "properties": { "familiarity": "high" } }
  ]
}
```

---

## Key Benefits

### 1. **Intelligent Context**
Every entity understands its place in the story, not just isolated data.

### 2. **Better Search**
Rich metadata and comprehensive text = better hybrid search results.

### 3. **Automatic Relationships**
No manual relationship creation - the agent figures it out.

### 4. **Consistent Quality**
Every entity gets the same level of enrichment and analysis.

### 5. **Project Isolation**
Context gathering respects project boundaries - no cross-contamination.

### 6. **Extensible**
Works for ANY entity type - characters, scenes, locations, concepts, etc.

### 7. **Async Processing**
Heavy operations don't block the UI - queue-based processing.

---

## Integration Points

### 1. PayloadCMS Hooks
```typescript
// Automatic processing on data changes
afterCreate: async ({ doc }) => {
  await brainService.store(doc) // Intercepted by agent
}
```

### 2. Direct API Calls
```typescript
// Programmatic access
await brainService.store(characterData) // Intercepted by agent
```

### 3. Batch Operations
```typescript
// Efficient batch processing
await brainService.storeBatch([char1, char2, char3]) // All processed by agent
```

---

## Configuration

### Entity-Specific Rules
```typescript
// Different rules for different entity types
const rules = {
  character: {
    contextSources: ["payload", "brain", "opendb"],
    metadataTemplate: "character-analysis",
    relationshipRules: ["APPEARS_IN", "RELATES_TO", "LIVES_IN"]
  },
  scene: {
    contextSources: ["payload", "brain"],
    metadataTemplate: "scene-analysis",
    relationshipRules: ["CONTAINS", "FOLLOWS", "PRECEDES"]
  }
}
```

---

## Performance

### Caching
- Project context cached for 5 minutes
- Prepared documents cached for 1 hour
- Frequently accessed entities cached

### Async Processing
- Heavy operations queued
- Non-blocking UI
- Batch processing for efficiency

### Parallel Operations
- Context gathering in parallel
- Multiple LLM calls concurrent
- Relationship discovery parallel

---

## Monitoring

### Metrics Tracked
- Processing time per entity
- LLM token usage
- Cache hit rates
- Queue depth
- Error rates

### Logging
- All agent decisions logged
- Context gathering logged
- Metadata generation logged
- Relationship creation logged

---

## Next Steps

1. **Review & Approve** this architecture
2. **Phase 1**: Implement core agent service
3. **Phase 2**: Add LLM integration
4. **Phase 3**: Build context gathering
5. **Phase 4**: Integrate with PayloadCMS
6. **Phase 5**: Add monitoring & optimization
7. **Phase 6**: Test & document

---

## Documentation

- **Architecture**: `docs/agents/data-preparation-agent.md`
- **Technical Spec**: `docs/agents/data-preparation-agent-technical-spec.md`
- **API Reference**: (To be created)
- **Integration Guide**: (To be created)

---

## Questions?

This pattern will be used **everywhere** in the Aladdin platform. Any time data is saved to a database (except users), it goes through this agent.

**The result**: Intelligent, connected, searchable knowledge graph that understands your movie production context.

---

**Status**: Ready for implementation approval ✅

