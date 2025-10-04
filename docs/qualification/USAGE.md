# Qualification Departments Usage Guide

## Overview

The Qualification Department system processes raw data from the gather database and generates qualified, structured content ready for production use.

## Department Architecture

```
┌─────────────────┐
│  Gather DB      │  ← Raw, unstructured world data
│  (Raw Data)     │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────────────────┐
│              WORLD DEPARTMENT                        │
│  • Extracts world elements, characters, locations   │
│  • Generates comprehensive story bible via LLM      │
│  • Stores in Qualified DB & PayloadCMS             │
│  • Ingests into Brain service                       │
└────────┬────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────┐
│              STORY DEPARTMENT                        │
│  • Gets story bible + characters from Qualified DB  │
│  • Generates full screenplay via LLM                │
│  • Breaks screenplay into 3-7s scenes               │
│  • Analyzes dramatic effect for each scene          │
│  • Creates scenes in PayloadCMS                     │
└─────────────────────────────────────────────────────┘
```

## World Department

### Purpose
Processes raw world data and generates a comprehensive story bible using Claude Sonnet 4.5 via OpenRouter.

### Flow
1. **Extract**: Get raw world data from gather DB
2. **Generate**: Use LLM to create story bible with:
   - World rules (magic, physics, society)
   - Character relationships
   - Timeline of events
   - Consistency rules
   - Location catalog
   - Themes & motifs
   - Visual style guide
3. **Store**: Save to qualified DB and PayloadCMS
4. **Ingest**: Add to brain service for semantic search

### Usage

```typescript
import { worldDepartment } from '@/lib/qualification'

// Process world data for a project
const storyBible = await worldDepartment.processWorldData(
  projectId,
  projectSlug,
  userId
)

console.log(`Story Bible: ${storyBible.title}`)
console.log(`World Rules: ${storyBible.worldRules.length}`)
console.log(`Timeline Events: ${storyBible.timeline.length}`)
console.log(`Themes: ${storyBible.themes.length}`)
```

### Output Example

```json
{
  "title": "Aladdin - 2025 Production",
  "version": "1.0",
  "synopsis": "A young street rat discovers a magical lamp...",
  "worldRules": [
    {
      "ruleName": "Genie Magic System",
      "category": "magic",
      "description": "Genies can grant three wishes with specific rules...",
      "constraints": "Cannot bring back the dead, make someone fall in love...",
      "priority": "critical"
    }
  ],
  "timeline": [
    {
      "eventName": "Aladdin finds the lamp",
      "timestamp": "Act 1, Scene 5",
      "description": "In the Cave of Wonders, Aladdin discovers the magical lamp",
      "importance": "critical",
      "location": "Cave of Wonders"
    }
  ],
  "themes": [
    {
      "theme": "True worth beyond appearances",
      "visualMotifs": "Transformation, mirrors, reflections",
      "colorAssociations": "Gold, purple, deep blue"
    }
  ]
}
```

## Story Department

### Purpose
Generates full screenplay from story bible and breaks it into production-ready scenes.

### Flow
1. **Retrieve**: Get story bible + characters from qualified DB
2. **Generate**: Use LLM to create complete screenplay
3. **Break Down**: Split screenplay into 3-7 second scenes
4. **Analyze**: Determine dramatic effect, camera & lighting for each scene
5. **Store**: Create scene documents in PayloadCMS

### Usage

```typescript
import { storyDepartment } from '@/lib/qualification'

// Generate screenplay and scenes
const result = await storyDepartment.processStory(
  projectId,
  projectSlug,
  userId
)

console.log(`Screenplay: ${result.screenplay.title}`)
console.log(`Total Scenes: ${result.scenes.length}`)
console.log(`Estimated Duration: ${result.screenplay.estimatedDuration}s`)

// Access individual scenes
for (const scene of result.scenes) {
  console.log(`Scene ${scene.sceneNumber}: ${scene.screenplayText}`)
  console.log(`  Duration: ${scene.expectedDuration}s`)
  console.log(`  Dramatic Intensity: ${scene.dramaticEffect.intensity}/10`)
  console.log(`  Camera: ${scene.cameraDirection?.shotType}`)
  console.log(`  Lighting: ${scene.lightingDirection?.style}`)
}
```

### Scene Breakdown Function

```typescript
import { breakScreenplayIntoScenes } from '@/lib/qualification'

// Break a screenplay into scenes
const scenes = await breakScreenplayIntoScenes(screenplay, storyBible)

// Each scene includes:
// - Scene number and sequence order
// - 3-7 second screenplay text
// - Dramatic effect analysis
// - Camera direction (shot type, movement, angle)
// - Lighting direction (style, mood, color temperature)
```

### Scene Output Example

```json
{
  "sceneNumber": "001",
  "sequenceOrder": 1,
  "screenplayText": "EXT. AGRABAH MARKETPLACE - DAY\n\nA bustling marketplace filled with colorful tents and exotic goods. ALADDIN (18) weaves through the crowd, nimble and quick.",
  "expectedDuration": 5,
  "dramaticEffect": {
    "intensity": 4,
    "emotionalTone": "energetic",
    "pacing": "fast",
    "visualImpact": "Vibrant, chaotic marketplace with rich colors and movement",
    "narrativeFunction": "Introduce Aladdin's world and his street-smart nature"
  },
  "cameraDirection": {
    "shotType": "wide",
    "movement": "tracking",
    "angle": "eye-level",
    "focus": "Aladdin moving through crowd"
  },
  "lightingDirection": {
    "style": "naturalistic",
    "mood": "bright",
    "keyLighting": "Natural daylight from above",
    "colorTemperature": "warm"
  },
  "location": "Agrabah Marketplace",
  "timeOfDay": "midday",
  "characters": ["Aladdin"]
}
```

## Complete Workflow Example

```typescript
import { worldDepartment, storyDepartment } from '@/lib/qualification'

async function processProject(projectId: string, projectSlug: string, userId: string) {
  try {
    // Step 1: Generate Story Bible from World Data
    console.log('🌍 Processing world data...')
    const storyBible = await worldDepartment.processWorldData(
      projectId,
      projectSlug,
      userId
    )
    console.log(`✅ Story Bible created: ${storyBible.title}`)
    console.log(`   - ${storyBible.worldRules.length} world rules`)
    console.log(`   - ${storyBible.timeline.length} timeline events`)
    console.log(`   - ${storyBible.themes.length} themes`)

    // Step 2: Generate Screenplay and Scenes
    console.log('\n📝 Generating screenplay...')
    const { screenplay, scenes } = await storyDepartment.processStory(
      projectId,
      projectSlug,
      userId
    )
    console.log(`✅ Screenplay created: ${screenplay.title}`)
    console.log(`   - ${scenes.length} scenes generated`)
    console.log(`   - ${screenplay.estimatedDuration}s total duration`)

    // Step 3: Access the data
    console.log('\n📊 Scene Breakdown:')
    for (const scene of scenes.slice(0, 5)) { // First 5 scenes
      console.log(`
Scene ${scene.sceneNumber}:
  Location: ${scene.location}
  Duration: ${scene.expectedDuration}s
  Tone: ${scene.dramaticEffect.emotionalTone}
  Intensity: ${scene.dramaticEffect.intensity}/10
  Camera: ${scene.cameraDirection?.shotType} ${scene.cameraDirection?.movement}
  Lighting: ${scene.lightingDirection?.style}
      `)
    }

    return { storyBible, screenplay, scenes }
  } catch (error) {
    console.error('❌ Processing failed:', error)
    throw error
  }
}

// Run it
processProject('proj_123', 'aladdin', 'user_456')
```

## Data Storage Locations

### 1. Qualified Database (MongoDB)
- **Database**: `qualified_{projectSlug}`
- **Collections**:
  - `story_bible` - Story bible documents
  - `screenplays` - Full screenplay documents

### 2. PayloadCMS
- **Collections**:
  - `story-bible` - Story bible for UI/editing
  - `scenes` - Individual scene documents with full metadata

### 3. Brain Service (Neo4j + Jina AI)
- Story bible ingested as semantic searchable nodes
- Enables AI-powered content consistency checking

## LLM Integration

Both departments use **Claude Sonnet 4.5** via OpenRouter:

```typescript
// Environment variables required
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
```

### Token Usage
- **World Department**: ~6,000-8,000 tokens per story bible
- **Story Department**: ~14,000-16,000 tokens per screenplay + scenes
- **Cost**: ~$0.10-0.20 per complete processing run

## Error Handling

```typescript
try {
  const storyBible = await worldDepartment.processWorldData(
    projectId,
    projectSlug,
    userId
  )
} catch (error) {
  if (error.message.includes('Story bible not found')) {
    console.error('Run world department first')
  } else if (error.message.includes('OPENROUTER_API_KEY')) {
    console.error('Configure OpenRouter API key')
  } else {
    console.error('Unexpected error:', error)
  }
}
```

## Integration with Existing Systems

### Brain Service Validation
After storing in qualified DB, content can be validated:

```typescript
import { BrainClient } from '@/lib/brain/client'

const brainClient = new BrainClient({
  apiUrl: process.env.BRAIN_SERVICE_BASE_URL,
  apiKey: process.env.BRAIN_SERVICE_API_KEY
})

// Validate screenplay against story bible
const validation = await brainClient.validateContent({
  content: screenplay.screenplay,
  projectId,
  context: {
    storyBible: storyBible,
    worldRules: storyBible.worldRules
  }
})

console.log('Quality Score:', validation.qualityScore)
console.log('Contradictions:', validation.contradictions)
```

### Scene Generation Workflow
Scenes created in PayloadCMS can be queried for generation:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

// Get scenes ready for generation
const scenes = await payload.find({
  collection: 'scenes',
  where: {
    status: { equals: 'ready' }
  },
  sort: 'sceneNumber'
})

// Generate videos for each scene
for (const scene of scenes.docs) {
  await generateSceneVideo(scene)
}
```

## TypeScript Types

All types are exported from the module:

```typescript
import type {
  StoryBible,
  Screenplay,
  Scene,
  WorldData,
  Character,
  DepartmentResult
} from '@/lib/qualification/types'
```

## Performance Notes

- **World Department**: ~10-15 seconds per project
- **Story Department**: ~20-30 seconds per screenplay
- **Total**: ~30-45 seconds for complete processing

Parallelization is possible when processing multiple projects.

## Next Steps

1. **Quality Control**: Implement human review workflow for story bibles
2. **Iteration**: Allow story bible updates and screenplay regeneration
3. **Templates**: Create story bible templates for different genres
4. **Analytics**: Track LLM token usage and costs per project
5. **Optimization**: Cache common prompts and responses
