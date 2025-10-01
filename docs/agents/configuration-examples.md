# Data Preparation Agent - Configuration Examples

## Table of Contents

1. [Common Scenarios](#common-scenarios)
2. [Custom Entity Creation](#custom-entity-creation)
3. [Prompt Customization](#prompt-customization)
4. [Validation Rules](#validation-rules)
5. [Feature Flags](#feature-flags)
6. [Advanced Patterns](#advanced-patterns)

---

## Common Scenarios

### 1. Basic Character Processing

```typescript
import { getDataPreparationAgent } from '@/lib/agents/data-preparation/agent'

const agent = getDataPreparationAgent()

const character = {
  id: 'char_001',
  name: 'Sarah Chen',
  description: 'A brilliant neuroscientist haunted by her past',
  age: 32,
  occupation: 'Neuroscientist',
  personality: ['intelligent', 'driven', 'mysterious'],
}

const document = await agent.prepare(character, {
  projectId: 'sci-fi-thriller-001',
  entityType: 'character',
  sourceCollection: 'characters',
  sourceId: character.id,
  userId: 'user_123',
})

// Result includes:
// - Rich metadata (characterType, role, archetypePattern, etc.)
// - Relationships to scenes, locations, other characters
// - Searchable summary text
// - Quality validation
```

### 2. Scene Processing with Context

```typescript
const scene = {
  id: 'scene_042',
  sceneNumber: 42,
  name: 'The Discovery',
  description: 'Sarah discovers the truth about the experiment',
  location: 'Research Lab',
  timeOfDay: 'night',
  characters: ['Sarah Chen', 'Dr. Martinez'],
  action: 'Sarah finds hidden files revealing the conspiracy',
  dialogue: [
    { character: 'Sarah', line: 'What have they been hiding?' },
    { character: 'Martinez', line: 'You shouldn\'t be here.' },
  ],
}

const document = await agent.prepare(scene, {
  projectId: 'sci-fi-thriller-001',
  entityType: 'scene',
  sourceCollection: 'scenes',
  sourceId: scene.id,
})

// Automatically discovers:
// - CONTAINS relationships to characters
// - LOCATED_IN relationship to location
// - FOLLOWS/PRECEDES relationships to adjacent scenes
// - Thematic connections
```

### 3. Location Processing

```typescript
const location = {
  id: 'loc_003',
  name: 'NeuroTech Research Lab',
  description: 'A cutting-edge neuroscience facility with dark secrets',
  locationType: 'interior',
  atmosphere: 'sterile, ominous',
  features: ['high-tech equipment', 'hidden vault', 'observation room'],
}

const document = await agent.prepare(location, {
  projectId: 'sci-fi-thriller-001',
  entityType: 'location',
  sourceCollection: 'locations',
  sourceId: location.id,
})

// Generates metadata:
// - Visual elements
// - Soundscape
// - Scene count
// - Significance level
```

### 4. Episode Processing (Series)

```typescript
const episode = {
  id: 'ep_101',
  episodeNumber: 1,
  seasonNumber: 1,
  title: 'Awakening',
  synopsis: 'Sarah begins to question her reality',
  scenes: ['scene_001', 'scene_002', 'scene_003'],
  characterFocus: ['Sarah Chen'],
  plotThreads: ['conspiracy', 'identity'],
}

const document = await agent.prepare(episode, {
  projectId: 'sci-fi-series-001',
  entityType: 'episode',
  sourceCollection: 'episodes',
  sourceId: episode.id,
})

// Creates relationships:
// - CONTAINS scenes
// - FEATURES characters
// - EXPLORES themes
```

---

## Custom Entity Creation

### Example 1: Prop Entity

```typescript
// Define custom prop type
const prop = {
  id: 'prop_001',
  name: 'Neural Interface Device',
  description: 'A brain-computer interface that unlocks memories',
  type: 'technology',
  significance: 'high',
  appearances: ['scene_042', 'scene_089', 'scene_112'],
  ownedBy: 'char_001',
}

const document = await agent.prepare(prop, {
  projectId: 'sci-fi-thriller-001',
  entityType: 'prop',  // Custom entity type
  sourceCollection: 'props',
  sourceId: prop.id,
})

// Agent automatically:
// 1. Analyzes prop significance in story
// 2. Creates relationships to scenes where it appears
// 3. Links to owner character
// 4. Generates searchable metadata
```

### Example 2: Theme/Concept Entity

```typescript
const theme = {
  id: 'theme_001',
  name: 'Identity vs. Memory',
  description: 'Exploration of whether we are defined by our memories',
  relatedConcepts: ['consciousness', 'reality', 'truth'],
  manifestations: [
    'Sarah\'s fragmented memories',
    'The memory manipulation experiment',
    'The choice between truth and happiness',
  ],
}

const document = await agent.prepare(theme, {
  projectId: 'sci-fi-thriller-001',
  entityType: 'concept',
  sourceCollection: 'concepts',
  sourceId: theme.id,
})

// Discovers thematic connections:
// - Characters embodying the theme
// - Scenes exploring the theme
// - Related philosophical concepts
```

### Example 3: Timeline Event

```typescript
const event = {
  id: 'event_005',
  name: 'The Memory Wipe Incident',
  date: '2025-03-15',
  description: 'Mass memory manipulation event affecting 1000+ subjects',
  participants: ['Dr. Martinez', 'Sarah Chen', 'Project Director'],
  consequences: ['Sarah begins investigation', 'Conspiracy uncovered'],
  relatedScenes: ['scene_001', 'scene_042'],
}

const document = await agent.prepare(event, {
  projectId: 'sci-fi-thriller-001',
  entityType: 'timeline_event',
  sourceCollection: 'events',
  sourceId: event.id,
})
```

---

## Prompt Customization

### Custom Metadata Schema

While the agent automatically determines metadata schema, you can influence it through structured data:

```typescript
// Provide rich, structured input for better metadata
const character = {
  // Basic info
  id: 'char_002',
  name: 'Dr. Marcus Martinez',

  // Detailed attributes (agent uses these for metadata)
  physicalDescription: {
    age: 58,
    height: '6\'2"',
    appearance: 'Distinguished, silver hair, intense eyes',
  },

  psychological: {
    personality: ['calculating', 'charismatic', 'morally ambiguous'],
    fears: ['losing control', 'being exposed'],
    motivations: ['scientific advancement', 'legacy'],
  },

  narrative: {
    role: 'antagonist',
    archetype: 'The Scientist Who Went Too Far',
    characterArc: 'Fall from grace',
  },

  relationships: {
    'Sarah Chen': 'Former mentor, now adversary',
    'Project Director': 'Complicated alliance',
  },
}

const document = await agent.prepare(character, {
  projectId: 'sci-fi-thriller-001',
  entityType: 'character',
})

// Agent generates metadata matching this structure
```

### Context-Rich Processing

```typescript
// Provide context that influences metadata generation
const scene = {
  id: 'scene_089',
  sceneNumber: 89,
  name: 'The Confrontation',

  // Rich context for better metadata
  narrativeContext: {
    actStructure: 'Act 3 - Climax',
    plotSignificance: 'high',
    emotionalTone: 'intense, revelatory',
    thematicFocus: ['truth vs. lies', 'redemption'],
  },

  production: {
    visualStyle: 'Noir lighting, close-ups',
    soundscape: 'Minimal, heartbeat-driven score',
    pacing: 'fast',
  },

  characterDevelopment: {
    'Sarah Chen': 'Confronts her past self',
    'Dr. Martinez': 'Moment of truth',
  },
}

const document = await agent.prepare(scene, {
  projectId: 'sci-fi-thriller-001',
  entityType: 'scene',
})
```

---

## Validation Rules

### Custom Validation via Input Structure

```typescript
// The agent validates based on entity type
// Provide complete data to pass validation

const validatedCharacter = {
  // Required fields
  id: 'char_003',
  name: 'Elena Rodriguez',  // Must have name
  description: 'A investigative journalist with a relentless pursuit of truth', // 10+ chars

  // Optional but recommended
  type: 'supporting',
  role: 'Ally to protagonist',
}

try {
  const document = await agent.prepare(validatedCharacter, {
    projectId: 'sci-fi-thriller-001',
    entityType: 'character',
  })

  // Validation passed!
  console.log('Document validated:', document.id)

} catch (error) {
  console.error('Validation failed:', error.message)
  // Errors: "Document text is required", "Document text is very short", etc.
}
```

### Validation Best Practices

```typescript
// ✅ GOOD: Complete data
const goodScene = {
  id: 'scene_100',
  sceneNumber: 100,
  name: 'Resolution',
  description: 'Sarah makes her final choice between truth and comfort',
  location: 'Memory Chamber',
  characters: ['Sarah Chen', 'Dr. Martinez'],
  content: 'Full scene content with dialogue and action...',
}

// ❌ BAD: Incomplete data
const badScene = {
  id: 'scene_101',
  // Missing name, description, content
}

// Prepare good scene
const document = await agent.prepare(goodScene, {
  projectId: 'sci-fi-thriller-001',
  entityType: 'scene',
})

// This will fail validation
try {
  await agent.prepare(badScene, {
    projectId: 'sci-fi-thriller-001',
    entityType: 'scene',
  })
} catch (error) {
  console.error('Validation error:', error.message)
  // "Document text is required"
}
```

---

## Feature Flags

### Disable Relationship Discovery

Useful for simple entities or performance optimization:

```typescript
const agent = new DataPreparationAgent({
  ...defaultConfig,
  features: {
    enableCaching: true,
    enableQueue: true,
    enableValidation: true,
    enableRelationshipDiscovery: false,  // Disabled
  },
})

// Faster processing, no relationships
const document = await agent.prepare(data, options)
// document.relationships will be []
```

### Disable Validation

For trusted data sources (use with caution):

```typescript
const agent = new DataPreparationAgent({
  ...defaultConfig,
  features: {
    enableCaching: true,
    enableQueue: true,
    enableValidation: false,  // Skip validation
    enableRelationshipDiscovery: true,
  },
})

// Faster, but no quality checks
```

### Disable Caching

For real-time, always-fresh data:

```typescript
const agent = new DataPreparationAgent({
  ...defaultConfig,
  features: {
    enableCaching: false,  // No caching
    enableQueue: true,
    enableValidation: true,
    enableRelationshipDiscovery: true,
  },
})

// Always fresh processing
```

### Development vs Production Config

```typescript
// Development: Fast feedback, full features
const devAgent = new DataPreparationAgent({
  ...defaultConfig,
  cache: {
    projectContextTTL: 60,     // 1 minute
    documentTTL: 120,          // 2 minutes
    entityTTL: 60,             // 1 minute
  },
  features: {
    enableCaching: true,
    enableQueue: false,         // Sync for debugging
    enableValidation: true,
    enableRelationshipDiscovery: true,
  },
})

// Production: Optimized performance
const prodAgent = new DataPreparationAgent({
  ...defaultConfig,
  cache: {
    projectContextTTL: 600,    // 10 minutes
    documentTTL: 3600,         // 1 hour
    entityTTL: 1800,           // 30 minutes
  },
  queue: {
    concurrency: 10,           // Higher throughput
    maxRetries: 3,
  },
  features: {
    enableCaching: true,
    enableQueue: true,          // Async processing
    enableValidation: true,
    enableRelationshipDiscovery: true,
  },
})
```

---

## Advanced Patterns

### 1. Multi-Project Agent

```typescript
// Share agent across multiple projects
const agent = getDataPreparationAgent()

// Project 1: Sci-fi thriller
const doc1 = await agent.prepare(character1, {
  projectId: 'sci-fi-001',
  entityType: 'character',
})

// Project 2: Fantasy epic
const doc2 = await agent.prepare(character2, {
  projectId: 'fantasy-001',
  entityType: 'character',
})

// Cache is project-aware (separate cache keys)
```

### 2. Batch Processing by Type

```typescript
// Process all characters, then all scenes
const characters = [...] // Array of character data
const scenes = [...] // Array of scene data

const characterDocs = await agent.prepareBatch(
  characters.map(c => ({
    data: c,
    options: {
      projectId: 'proj_001',
      entityType: 'character',
    },
  }))
)

const sceneDocs = await agent.prepareBatch(
  scenes.map(s => ({
    data: s,
    options: {
      projectId: 'proj_001',
      entityType: 'scene',
    },
  }))
)
```

### 3. Async with Status Tracking

```typescript
// Queue multiple jobs
const jobIds = await Promise.all([
  agent.prepareAsync(character1, options1),
  agent.prepareAsync(character2, options2),
  agent.prepareAsync(scene1, options3),
])

console.log('Queued jobs:', jobIds)

// Track job status (implementation depends on queue system)
for (const jobId of jobIds) {
  // Poll for completion
  // const status = await queue.getJobStatus(jobId)
}
```

### 4. Custom Error Handling

```typescript
async function safePrepare(data: any, options: PrepareOptions) {
  try {
    return await agent.prepare(data, options)
  } catch (error) {
    if (error.message.includes('Validation failed')) {
      // Log validation errors but don't throw
      console.warn('Validation warning:', error.message)

      // Return minimal document
      return {
        id: `${options.entityType}_${data.id}`,
        type: options.entityType,
        project_id: options.projectId,
        text: data.description || data.name || 'Unknown entity',
        metadata: { error: error.message },
        relationships: [],
      }
    }
    throw error // Re-throw other errors
  }
}
```

### 5. Progressive Enhancement

```typescript
// Start with basic processing, enhance over time
async function progressiveEnhancement(data: any, options: PrepareOptions) {
  // Phase 1: Quick processing
  const basicDoc = await agent.prepare(data, {
    ...options,
    skipCache: true,
  })

  // Store basic version immediately
  await brainClient.store(basicDoc)

  // Phase 2: Queue for enhanced processing
  const jobId = await agent.prepareAsync(data, {
    ...options,
    // Enhanced processing with more context
  })

  return { basicDoc, enhancementJobId: jobId }
}
```

### 6. Cache Warming

```typescript
// Pre-populate cache for frequently accessed projects
async function warmCache(projectId: string) {
  const agent = getDataPreparationAgent()

  // Fetch and cache project context
  const payload = await getPayload()
  const project = await payload.findByID({
    collection: 'projects',
    id: projectId,
  })

  // Process a representative sample
  const samples = await payload.find({
    collection: 'characters',
    where: { project: { equals: projectId } },
    limit: 5,
  })

  for (const sample of samples.docs) {
    await agent.prepare(sample, {
      projectId,
      entityType: 'character',
    })
  }

  console.log('Cache warmed for project:', projectId)
}
```

### 7. Metrics Collection

```typescript
// Wrap agent for metrics
class MetricsCollector {
  private agent: DataPreparationAgent
  private metrics: any[] = []

  constructor(agent: DataPreparationAgent) {
    this.agent = agent
  }

  async prepare(data: any, options: PrepareOptions) {
    const start = Date.now()

    try {
      const result = await this.agent.prepare(data, options)

      this.metrics.push({
        duration: Date.now() - start,
        projectId: options.projectId,
        entityType: options.entityType,
        success: true,
        metadataFields: Object.keys(result.metadata).length,
        relationships: result.relationships.length,
      })

      return result
    } catch (error) {
      this.metrics.push({
        duration: Date.now() - start,
        projectId: options.projectId,
        entityType: options.entityType,
        success: false,
        error: error.message,
      })
      throw error
    }
  }

  getMetrics() {
    return this.metrics
  }

  getAverages() {
    const successful = this.metrics.filter(m => m.success)
    return {
      avgDuration: successful.reduce((sum, m) => sum + m.duration, 0) / successful.length,
      avgMetadataFields: successful.reduce((sum, m) => sum + m.metadataFields, 0) / successful.length,
      avgRelationships: successful.reduce((sum, m) => sum + m.relationships, 0) / successful.length,
      successRate: successful.length / this.metrics.length,
    }
  }
}

// Usage
const collector = new MetricsCollector(agent)
await collector.prepare(data, options)
console.log('Metrics:', collector.getAverages())
```

---

## See Also

- [Configuration System Guide](/mnt/d/Projects/aladdin/docs/agents/configuration-system-guide.md)
- [Migration Guide](/mnt/d/Projects/aladdin/docs/agents/configuration-migration.md)
- [Troubleshooting Guide](/mnt/d/Projects/aladdin/docs/agents/configuration-troubleshooting.md)
- [Example Code](/mnt/d/Projects/aladdin/src/lib/agents/data-preparation/config/examples/)
