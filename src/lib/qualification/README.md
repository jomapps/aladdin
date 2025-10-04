# Character Qualification System

## Overview

The Character Qualification system implements a comprehensive 360° character generation pipeline using FAL.ai models and brain service ingestion.

## Pipeline Flow

```
Raw Characters (Gather DB)
    ↓
Master Reference Generation (fal-ai/nano-banana)
    ↓
6x 360° Views in PARALLEL (fal-ai/nano-banana/edit)
    ├─ front
    ├─ back
    ├─ left_side
    ├─ right_side
    ├─ three_quarter_left
    └─ three_quarter_right
    ↓
Vision Descriptions (fal-ai/moondream2/visual-query)
    ↓
Qualified DB Storage (character_profiles)
    ↓
Brain Service Ingestion (brain.ft.tc)
```

## Key Features

### 1. Master Reference Generation
- Uses `fal-ai/nano-banana` for high-quality character images
- Generates from gather DB character descriptions
- Professional full-body portrait with neutral pose

### 2. 360° Parallel Processing
- **6 angles generated simultaneously** for speed
- Uses `fal-ai/nano-banana/edit` for view rotation
- Maintains character consistency across all views

### 3. Vision-Based Descriptions
- Uses `fal-ai/moondream2/visual-query` for detailed descriptions
- Captures visible features, clothing, expression, lighting
- Specific to each angle for accurate documentation

### 4. Brain Service Integration
- **Max 3 references per request** (as per spec)
- Automatic retry with exponential backoff (3 attempts)
- Stores all 360° references and descriptions
- Character relationships preserved

## API Usage

### Process All Characters

```typescript
import { runCharacterQualification } from '@/lib/qualification'

const profiles = await runCharacterQualification('project-id')
console.log(`Qualified ${profiles.length} characters`)
```

### Process Single Character

```typescript
import { qualifySingleCharacter } from '@/lib/qualification'

const profile = await qualifySingleCharacter('project-id', 'gather-item-id')
console.log(`Character: ${profile.name}`)
console.log(`Brain Node: ${profile.brainNodeId}`)
```

### Direct Department Usage

```typescript
import { CharacterDepartment } from '@/lib/qualification'

const dept = new CharacterDepartment('project-id')
const profiles = await dept.processGatherCharacters()
```

## Data Schema

### Character Profile

```typescript
interface CharacterProfile {
  characterId: string
  projectId: string
  name: string
  description: string

  masterReference: {
    url: string
    prompt: string
    seed?: number
  }

  views360: Array<{
    angle: 'front' | 'back' | 'left_side' | 'right_side' | 'three_quarter_left' | 'three_quarter_right'
    url: string
    description: string  // Vision-generated
    prompt: string
  }>

  brainIngested: boolean
  brainNodeId?: string
  qualityScore?: number
  createdAt: Date
  updatedAt: Date
}
```

## Environment Variables

Required:
- `FAL_KEY` - FAL.ai API key for image generation
- `BRAIN_SERVICE_API_KEY` - Brain service authentication
- `BRAIN_SERVICE_BASE_URL` - Brain service endpoint (default: https://brain.ft.tc)

## Error Handling

### Generation Failures
- FAL.ai failures stop processing immediately
- Error logged with specific angle/step information
- Continues to next character in batch processing

### Brain Ingestion Failures
- Automatic retry up to 3 times
- Exponential backoff: 2s, 4s, 8s
- Detailed error logging for debugging

### Fallback Mechanisms
- Description generation falls back to basic text if vision fails
- Profile still created even if brain ingestion fails (flagged as not ingested)

## Performance

### Parallel Processing
- All 6 angles generated simultaneously using `Promise.all()`
- ~6x faster than sequential processing
- Typical processing time: 15-30 seconds per character

### Rate Limiting
- FAL.ai handles rate limits internally
- Brain service has retry logic for rate limit errors
- Exponential backoff prevents overwhelming services

## Database Storage

### Gather Database (Input)
- Collection: `gather`
- Query: Characters marked by department or keywords
- Read-only access

### Qualified Database (Output)
- Collection: `character_profiles`
- Database: `open_{project-slug}`
- Includes full 360° data and brain references

### Brain Service (Knowledge)
- Endpoint: `/api/v1/knowledge/store`
- Stores text + metadata + references
- Returns node ID for tracking

## Integration Points

### From Gather
```typescript
// Characters are identified by:
- automationMetadata.department === 'character'
- OR summary/context contains 'character'
```

### To Brain
```typescript
// Brain ingestion format:
{
  project_id: string,
  text: string,  // Full character description
  metadata: {
    type: 'character',
    characterId: string,
    references: string[],  // Max 3 URLs
    views360: Array<{ angle, url }>,
    masterReference: string
  }
}
```

## Monitoring & Logging

All operations logged with `[CharacterDept]` prefix:
- Pipeline start/completion
- Each character processing
- Generation success/failure
- Brain ingestion status
- Error details with context

## Future Enhancements

1. **Quality Scoring** - Automated quality assessment of generated views
2. **Style Consistency** - Validate style matches across all angles
3. **Batch Optimization** - Process multiple characters in parallel
4. **Caching** - Cache master references for similar characters
5. **Webhooks** - Real-time progress updates for long-running jobs
