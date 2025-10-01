# Data Preparation Agent - Migration Guide

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [From Manual Brain Integration](#from-manual-brain-integration)
3. [Step-by-Step Migration](#step-by-step-migration)
4. [Breaking Changes](#breaking-changes)
5. [Compatibility Notes](#compatibility-notes)
6. [Rollback Strategy](#rollback-strategy)

---

## Migration Overview

### What's Changing

**Before (Manual Approach):**
```typescript
// Direct brain service calls
const brainDoc = {
  id: `character_${character.id}`,
  type: 'character',
  project_id: projectId,
  text: `${character.name}. ${character.description}`,
  metadata: {
    name: character.name,
    // Limited manual metadata
  },
  relationships: [], // Manual relationship creation
}

await brainClient.store(brainDoc)
```

**After (Data Preparation Agent):**
```typescript
// Automated enrichment
const agent = getDataPreparationAgent()

const brainDoc = await agent.prepare(character, {
  projectId,
  entityType: 'character',
  sourceCollection: 'characters',
  sourceId: character.id,
})

// Document now includes:
// - Rich AI-generated metadata
// - Automatic relationship discovery
// - Context from multiple sources
// - Quality validation

await brainClient.store(brainDoc)
```

### Benefits of Migration

✅ **Richer Metadata**: LLM-generated contextual metadata
✅ **Automatic Relationships**: Discovers entity connections
✅ **Multi-Source Context**: PayloadCMS + Brain + OpenDB
✅ **Better Search**: Enhanced searchable text
✅ **Validation**: Quality checks before storage
✅ **Caching**: Performance optimization
✅ **Queue Support**: Async processing
✅ **Consistency**: Standardized document structure

### Migration Timeline

- **Phase 1**: Setup (1 day)
- **Phase 2**: Integration (2-3 days)
- **Phase 3**: Testing (2-3 days)
- **Phase 4**: Gradual Rollout (1 week)
- **Phase 5**: Full Migration (1 week)

---

## From Manual Brain Integration

### Current Implementation

If you're currently using direct Brain Service calls:

```typescript
// OLD: Manual brain service integration
import { getBrainClient } from '@/lib/brain/client'

async function saveCharacterToBrain(character: any, projectId: string) {
  const brainClient = getBrainClient()

  const document = {
    id: `character_${character.id}`,
    type: 'character',
    project_id: projectId,
    text: `${character.name}. ${character.description || ''}`,
    metadata: {
      name: character.name,
      description: character.description,
      age: character.age,
      // Limited metadata
    },
    relationships: [
      // Manually created relationships
    ],
  }

  await brainClient.store(document)
}
```

### New Implementation

```typescript
// NEW: Data Preparation Agent
import { getDataPreparationAgent } from '@/lib/agents/data-preparation/agent'
import { getBrainClient } from '@/lib/brain/client'

async function saveCharacterToBrain(character: any, projectId: string) {
  // 1. Get agent instance
  const agent = getDataPreparationAgent()

  // 2. Prepare document with enrichment
  const document = await agent.prepare(character, {
    projectId,
    entityType: 'character',
    sourceCollection: 'characters',
    sourceId: character.id,
    userId: 'system', // or actual user ID
  })

  // 3. Store enriched document
  const brainClient = getBrainClient()
  await brainClient.store(document)

  return document
}
```

---

## Step-by-Step Migration

### Step 1: Environment Setup

Add required environment variables:

```bash
# .env
# LLM Configuration (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_BACKUP_MODEL=openai/gpt-3.5-turbo

# Brain Service (existing)
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=your_brain_key

# Redis (for caching and queue)
REDIS_URL=redis://localhost:6379
```

### Step 2: Install Dependencies

```bash
# If not already installed
npm install ioredis bullmq
```

### Step 3: Update PayloadCMS Hooks

Replace manual brain integration with agent:

```typescript
// OLD: src/lib/agents/data-preparation/payload-hooks.ts (if exists)
import { getBrainClient } from '@/lib/brain/client'

const afterChange: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation === 'create' || operation === 'update') {
    const brainDoc = {
      id: `character_${doc.id}`,
      type: 'character',
      project_id: doc.project,
      text: `${doc.name}. ${doc.description}`,
      metadata: { ...doc },
      relationships: [],
    }

    await getBrainClient().store(brainDoc)
  }
}
```

```typescript
// NEW: src/lib/agents/data-preparation/payload-hooks.ts
import { getDataPreparationAgent } from './agent'
import { getBrainClient } from '@/lib/brain/client'

const afterChange: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation === 'create' || operation === 'update') {
    try {
      // Use agent for preparation
      const agent = getDataPreparationAgent()

      const brainDoc = await agent.prepare(doc, {
        projectId: doc.project,
        entityType: 'character',
        sourceCollection: 'characters',
        sourceId: doc.id,
        userId: req.user?.id || 'system',
        createdByType: req.user ? 'user' : 'agent',
      })

      // Store enriched document
      await getBrainClient().store(brainDoc)

      console.log('[PayloadHook] Character saved to brain:', brainDoc.id)
    } catch (error) {
      console.error('[PayloadHook] Failed to save to brain:', error)
      // Don't throw - allow PayloadCMS operation to succeed
    }
  }
}

export const characterHooks = {
  afterChange: [afterChange],
}
```

### Step 4: Update API Routes

Replace manual calls in API routes:

```typescript
// OLD: src/app/api/characters/route.ts
import { getBrainClient } from '@/lib/brain/client'

export async function POST(request: Request) {
  const data = await request.json()

  // Create in PayloadCMS
  const character = await payload.create({
    collection: 'characters',
    data,
  })

  // Manual brain storage
  const brainDoc = {
    id: `character_${character.id}`,
    type: 'character',
    project_id: data.project,
    text: `${character.name}. ${character.description}`,
    metadata: { ...character },
    relationships: [],
  }
  await getBrainClient().store(brainDoc)

  return Response.json(character)
}
```

```typescript
// NEW: src/app/api/characters/route.ts
import { getDataPreparationAgent } from '@/lib/agents/data-preparation/agent'
import { getBrainClient } from '@/lib/brain/client'

export async function POST(request: Request) {
  const data = await request.json()

  // Create in PayloadCMS
  const character = await payload.create({
    collection: 'characters',
    data,
  })

  try {
    // Use agent for enrichment
    const agent = getDataPreparationAgent()

    const brainDoc = await agent.prepare(character, {
      projectId: data.project,
      entityType: 'character',
      sourceCollection: 'characters',
      sourceId: character.id,
      userId: data.userId,
    })

    // Store enriched document
    await getBrainClient().store(brainDoc)

    console.log('[API] Character enriched and saved:', brainDoc.id)
  } catch (error) {
    console.error('[API] Failed to enrich character:', error)
    // Character still saved in PayloadCMS
  }

  return Response.json(character)
}
```

### Step 5: Update Server Actions

```typescript
// OLD: Server action
'use server'

import { getBrainClient } from '@/lib/brain/client'

export async function createCharacter(data: CharacterInput) {
  const character = await payload.create({
    collection: 'characters',
    data,
  })

  const brainDoc = {
    id: `character_${character.id}`,
    type: 'character',
    project_id: data.project,
    text: `${character.name}. ${character.description}`,
    metadata: { ...character },
    relationships: [],
  }

  await getBrainClient().store(brainDoc)

  return character
}
```

```typescript
// NEW: Server action
'use server'

import { getDataPreparationAgent } from '@/lib/agents/data-preparation/agent'
import { getBrainClient } from '@/lib/brain/client'

export async function createCharacter(data: CharacterInput) {
  const character = await payload.create({
    collection: 'characters',
    data,
  })

  try {
    const agent = getDataPreparationAgent()

    const brainDoc = await agent.prepare(character, {
      projectId: data.project,
      entityType: 'character',
      sourceCollection: 'characters',
      sourceId: character.id,
      userId: data.userId,
    })

    await getBrainClient().store(brainDoc)
  } catch (error) {
    console.error('Failed to enrich character:', error)
  }

  return character
}
```

### Step 6: Async Processing (Optional)

For large batches, use async processing:

```typescript
// NEW: Async processing
import { getDataPreparationAgent } from '@/lib/agents/data-preparation/agent'

export async function createCharacterAsync(data: CharacterInput) {
  const character = await payload.create({
    collection: 'characters',
    data,
  })

  // Queue for background processing
  const agent = getDataPreparationAgent()

  const jobId = await agent.prepareAsync(character, {
    projectId: data.project,
    entityType: 'character',
    sourceCollection: 'characters',
    sourceId: character.id,
    userId: data.userId,
  })

  console.log('Queued character enrichment:', jobId)

  return { character, jobId }
}
```

---

## Breaking Changes

### 1. Document ID Format

**Before:**
```typescript
id: `character_${characterId}`
```

**After:**
```typescript
id: `character_${characterId}_${projectId}`
// Includes project ID for uniqueness
```

**Migration:**
- Update any hardcoded ID references
- Re-index existing documents (optional)

### 2. Metadata Structure

**Before:**
```typescript
metadata: {
  name: character.name,
  description: character.description,
  // Simple fields
}
```

**After:**
```typescript
metadata: {
  // Original fields preserved
  name: character.name,
  description: character.description,

  // AI-generated additions
  characterType: 'protagonist',
  role: 'Main character',
  archetypePattern: 'Hero\'s Journey',
  visualSignature: 'Dark hair, determined eyes',
  personalityTraits: ['brave', 'intelligent', 'stubborn'],

  // System metadata
  sourceCollection: 'characters',
  sourceId: character.id,
  createdBy: 'user_123',
  createdByType: 'user',
  dataLineage: {
    source: 'data-preparation-agent',
    processedAt: '2025-01-28T...',
    version: 1,
  },
}
```

**Migration:**
- Old metadata fields remain compatible
- New fields are additive
- Update queries to use new fields

### 3. Text Field Format

**Before:**
```typescript
text: `${character.name}. ${character.description}`
```

**After:**
```typescript
text: `Sarah Chen. A brilliant neuroscientist haunted by her past. Related to: Dr. Martinez, Memory Lab. Themes: identity, truth. Protagonist in psychological thriller.`
// Includes summary, relationships, themes
```

**Migration:**
- Search queries benefit from richer text
- No breaking changes to existing queries

### 4. Relationships

**Before:**
```typescript
relationships: []  // Manually created
```

**After:**
```typescript
relationships: [
  {
    type: 'APPEARS_IN',
    target: 'scene_042',
    targetType: 'scene',
    confidence: 0.95,
    reasoning: 'Character mentioned in scene description',
  },
  // More auto-discovered relationships
]
```

**Migration:**
- Old relationships preserved
- New relationships added automatically
- Update relationship queries

---

## Compatibility Notes

### Backward Compatibility

✅ **Existing Documents**: Old brain documents continue to work
✅ **Queries**: Existing search/query logic unchanged
✅ **APIs**: Brain Service API unchanged

### Forward Compatibility

⚠️ **New Fields**: New metadata fields won't exist in old documents
⚠️ **Relationships**: Old documents have fewer relationships
⚠️ **Text Format**: Old documents have simpler text

### Handling Mixed Data

```typescript
// Query that works with both old and new documents
const results = await brainClient.search({
  projectId,
  query: 'Sarah',
  limit: 10,
})

// Handle both formats
for (const doc of results) {
  // New format
  if (doc.metadata.characterType) {
    console.log('Character type:', doc.metadata.characterType)
  }

  // Old format fallback
  const name = doc.metadata.name || extractNameFromText(doc.text)
  console.log('Name:', name)
}
```

---

## Rollback Strategy

### Emergency Rollback

If issues arise, revert to manual integration:

```typescript
// Rollback flag
const USE_DATA_PREP_AGENT = process.env.ENABLE_DATA_PREP_AGENT === 'true'

async function saveCharacterToBrain(character: any, projectId: string) {
  if (USE_DATA_PREP_AGENT) {
    // New agent-based approach
    const agent = getDataPreparationAgent()
    const document = await agent.prepare(character, {
      projectId,
      entityType: 'character',
      sourceCollection: 'characters',
      sourceId: character.id,
    })
    await brainClient.store(document)
  } else {
    // Old manual approach
    const document = {
      id: `character_${character.id}`,
      type: 'character',
      project_id: projectId,
      text: `${character.name}. ${character.description}`,
      metadata: { ...character },
      relationships: [],
    }
    await brainClient.store(document)
  }
}
```

### Gradual Rollout

Enable for specific entity types:

```typescript
const AGENT_ENABLED_TYPES = new Set(['character', 'scene'])

async function saveToBrain(entity: any, entityType: string, projectId: string) {
  if (AGENT_ENABLED_TYPES.has(entityType)) {
    // Use agent
    const agent = getDataPreparationAgent()
    const document = await agent.prepare(entity, {
      projectId,
      entityType,
      sourceCollection: `${entityType}s`,
      sourceId: entity.id,
    })
    await brainClient.store(document)
  } else {
    // Use old approach
    const document = buildManualDocument(entity, entityType, projectId)
    await brainClient.store(document)
  }
}
```

### Data Re-Processing

Re-process old documents with agent:

```typescript
// Re-process script
import { getDataPreparationAgent } from '@/lib/agents/data-preparation/agent'
import { getBrainClient } from '@/lib/brain/client'

async function reprocessOldDocuments(projectId: string) {
  const agent = getDataPreparationAgent()
  const payload = await getPayload()

  // Get all characters
  const { docs: characters } = await payload.find({
    collection: 'characters',
    where: { project: { equals: projectId } },
    limit: 1000,
  })

  console.log(`Re-processing ${characters.length} characters...`)

  // Process in batches
  const batchSize = 10
  for (let i = 0; i < characters.length; i += batchSize) {
    const batch = characters.slice(i, i + batchSize)

    await agent.prepareBatch(
      batch.map(char => ({
        data: char,
        options: {
          projectId,
          entityType: 'character',
          sourceCollection: 'characters',
          sourceId: char.id,
          skipCache: true,  // Force re-processing
        },
      }))
    )

    console.log(`Processed ${i + batch.length}/${characters.length}`)
  }

  console.log('Re-processing complete!')
}
```

---

## Migration Checklist

- [ ] Add environment variables
- [ ] Install dependencies
- [ ] Test agent in development
- [ ] Update PayloadCMS hooks
- [ ] Update API routes
- [ ] Update server actions
- [ ] Test with sample data
- [ ] Enable for one entity type
- [ ] Monitor performance
- [ ] Enable for all entity types
- [ ] Re-process old documents (optional)
- [ ] Remove rollback flags
- [ ] Update documentation

---

## See Also

- [Configuration System Guide](/mnt/d/Projects/aladdin/docs/agents/configuration-system-guide.md)
- [Configuration Examples](/mnt/d/Projects/aladdin/docs/agents/configuration-examples.md)
- [Troubleshooting Guide](/mnt/d/Projects/aladdin/docs/agents/configuration-troubleshooting.md)
