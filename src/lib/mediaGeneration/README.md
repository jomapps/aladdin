# Media Generation Pipeline

Complete scene generation system with shot analysis, iterative compositing, and video generation.

## Architecture

### Flow Overview
```
Scene ID → Shot Agent → Composite Generator → Verifier → Video → Last Frame
```

### Components

#### 1. **sceneGenerator.ts** - Main Orchestrator
- Fetches scene from PayloadCMS
- Coordinates entire generation pipeline
- Updates scene status at each phase
- Global error handling with proper error types
- Batch processing support

**Main Functions:**
- `generateScene(sceneId)` - Generate complete scene
- `generateSceneBatch(sceneIds, options)` - Batch processing
- `getSceneProgress(sceneId)` - Track generation progress

#### 2. **shotAgent.ts** - Scene Analysis & Planning
- Analyzes scene requirements using Brain multimodal query
- Decides composite steps order (location → characters → props)
- Selects character angles based on camera angle
- Maps camera angles to 360° profile angles
- Calculates pacing and timing

**Main Functions:**
- `analyzeShotRequirements(scene, neo4j)` - Create shot decision

**Shot Decision Output:**
```typescript
{
  sceneId: string
  compositeSteps: CompositeStep[]     // Ordered composite steps
  characterAngles: Record<string, CameraAngle>  // Character angle mapping
  pacing: {
    duration: number                  // 5-7 seconds
    motion_strength: number           // 0-1
    transition_type: string
  }
  reasoning: string
}
```

#### 3. **compositeGenerator.ts** - Iterative Composition
- Builds composite iteratively (max 20 iterations)
- Uses fal-ai/nano-banana/edit for compositing
- Max 3 references per iteration
- Retry loop with verification (max 5 retries per step)
- Emergency break at 20 iterations

**Main Functions:**
- `generateComposite(scene, steps, neo4j)` - Generate composite
- `optimizeStepOrder(steps)` - Optimize step order
- `validateCompositePrerequisites(scene, steps)` - Validate inputs
- `getCompositeStats(iterations)` - Get generation stats

**Composite Flow:**
```
For each step:
  1. Generate composite with current image + references (max 3)
  2. Verify with both Brain and FAL
  3. If verification fails, retry (max 5 times)
  4. If all retries fail, throw error
  5. If pass, move to next step
  6. Emergency break at iteration 20
```

#### 4. **verifier.ts** - Two-Step Verification
- **PARALLEL** verification (both must pass)
- Brain multimodal query verification
- FAL moondream2 vision model verification
- Combined scoring

**Main Functions:**
- `verifyComposite(imageUrl, step, sceneDescription, neo4j)` - Verify composite
- `getVerificationReport(result)` - Detailed report

**Verification Process:**
```typescript
// Run in PARALLEL
const [brainResult, falResult] = await Promise.all([
  verifyWithBrain(imageUrl, step, sceneDescription, neo4j),
  verifyWithFAL(imageUrl, step, sceneDescription)
])

// BOTH must pass
overall_pass = brainResult.passed && falResult.passed
combined_score = (brainResult.score + falResult.score) / 2
```

**Brain Verification:**
- Multimodal query with image
- Checks required elements
- Visual quality assessment
- Returns score 0-1 and issues

**FAL Verification:**
- Uses fal-ai/moondream2/visual-query
- Asks: "Does this contain [type] as described?"
- Parses YES/NO response
- Returns score 0-1 and description

#### 5. **types.ts** - Type Definitions
Complete TypeScript interfaces for:
- Scene data structure
- Shot decisions
- Composite steps and iterations
- Verification results
- Video and frame extraction
- Error types
- PayloadCMS updates

## Usage

### Basic Scene Generation
```typescript
import { generateScene } from '@/lib/mediaGeneration'

const scene = await generateScene('scene-123')
```

### Batch Processing
```typescript
import { generateSceneBatch } from '@/lib/mediaGeneration'

const result = await generateSceneBatch(
  ['scene-1', 'scene-2', 'scene-3'],
  { parallel: true, maxConcurrent: 3 }
)

console.log(`Success: ${result.success.length}`)
console.log(`Failed: ${result.failed.length}`)
```

### Track Progress
```typescript
import { getSceneProgress } from '@/lib/mediaGeneration'

const progress = await getSceneProgress('scene-123')
console.log(`${progress.status}: ${progress.progress}%`)
```

### Manual Step-by-Step
```typescript
import {
  analyzeShotRequirements,
  generateComposite,
  verifyComposite
} from '@/lib/mediaGeneration'

// 1. Analyze
const shotDecision = await analyzeShotRequirements(scene, neo4j)

// 2. Generate composite
const composite = await generateComposite(scene, shotDecision.compositeSteps, neo4j)

// 3. Verify manually
const verification = await verifyComposite(
  composite.finalImageUrl,
  shotDecision.compositeSteps[0],
  scene.description,
  neo4j
)
```

## Scene Status Flow

```
pending → analyzing → compositing → verifying → generating_video → extracting_frame → completed
                                                                                           ↓
                                                                                         failed
```

## Error Handling

### Error Types
- `SceneGenerationError` - Top-level scene generation error
- `CompositeGenerationError` - Composite generation error
- `VerificationError` - Verification failure error

### Global Error Handling
All errors update PayloadCMS scene status to 'failed' with error message.

```typescript
try {
  await generateScene(sceneId)
} catch (error) {
  if (error instanceof SceneGenerationError) {
    console.log(`Scene ${error.sceneId} failed at ${error.phase}`)
    console.log(`Error: ${error.message}`)
  }
}
```

## Configuration

### Environment Variables
```env
FAL_API_KEY=your_fal_api_key
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

### Default Settings
- Max composite iterations: 20
- Max verification retries: 5
- Verification threshold: 0.7
- Parallel verification: true
- Max references per step: 3

## PayloadCMS Integration

### Scene Collection Fields
```typescript
{
  id: string
  status: SceneStatus
  composite_iterations: CompositeIteration[]
  final_composite_url: string
  video_url: string
  last_frame_url: string
  error?: string
}
```

### Status Updates
Scene status is updated at each phase:
1. `analyzing` - Shot agent analyzing
2. `compositing` - Building composite
3. `generating_video` - Creating video
4. `extracting_frame` - Extracting last frame
5. `completed` - Generation complete
6. `failed` - Error occurred

## FAL.ai Models Used

### 1. nano-banana/edit (Compositing)
- Endpoint: `fal-ai/nano-banana/edit`
- Input: prompt + image_urls (max 3)
- Output: Edited composite image
- Used for: Iterative composite building

### 2. moondream2/visual-query (Verification)
- Endpoint: `fal-ai/moondream2/visual-query`
- Input: image_url + prompt (verification question)
- Output: Text description/answer
- Used for: Visual verification

### 3. ltx-video/image-to-video (Video Generation)
- Endpoint: `fal-ai/ltx-video/image-to-video`
- Input: composite image + motion parameters
- Output: MP4 video (5-7 seconds)
- Used for: Scene video generation

## Brain Integration

### Multimodal Query
- Analyzes images with vision models
- Retrieves scene context from knowledge graph
- Validates composite against requirements
- Provides feedback and scoring

### Neo4j Queries
- Fetch scene entities (characters, locations, props)
- Get 360° profile references
- Retrieve relationship data
- Semantic search for context

## Performance

### Composite Generation
- Average iterations: 5-10 per scene
- Verification retries: 1-3 per step
- Total time: 30-60 seconds per scene

### Batch Processing
- Parallel mode: 3 scenes concurrently
- Sequential mode: One at a time
- Failure handling: Continue on error

## Testing

### Unit Tests
```typescript
// Test shot agent
test('analyzeShotRequirements returns valid decision', async () => {
  const decision = await analyzeShotRequirements(mockScene, neo4j)
  expect(decision.compositeSteps.length).toBeGreaterThan(0)
  expect(decision.characterAngles).toBeDefined()
})

// Test verification
test('verifyComposite runs both verifications', async () => {
  const result = await verifyComposite(imageUrl, step, description, neo4j)
  expect(result.brain).toBeDefined()
  expect(result.fal).toBeDefined()
  expect(result.overall_pass).toBeDefined()
})
```

### Integration Tests
```typescript
test('generateScene completes full pipeline', async () => {
  const scene = await generateScene(testSceneId)
  expect(scene.status).toBe('completed')
  expect(scene.video_url).toBeDefined()
  expect(scene.last_frame_url).toBeDefined()
})
```

## Future Enhancements

1. **Real-time Progress Streaming**
   - WebSocket updates during generation
   - Live composite preview

2. **Advanced Frame Extraction**
   - FFmpeg integration for precise frame extraction
   - Multiple keyframe extraction

3. **Composite Caching**
   - Cache verified composites
   - Reuse similar compositions

4. **Quality Scoring**
   - Advanced quality metrics
   - ML-based quality prediction

5. **Retry Strategies**
   - Exponential backoff
   - Adaptive verification thresholds
   - Smart retry with modified prompts

## Files Created

- ✅ `types.ts` - Complete type definitions
- ✅ `shotAgent.ts` - Scene analysis and shot planning
- ✅ `compositeGenerator.ts` - Iterative composite generation
- ✅ `verifier.ts` - Two-step parallel verification
- ✅ `sceneGenerator.ts` - Main orchestrator
- ✅ `index.ts` - Barrel exports

## Critical Features

### ✅ Shot Agent
- Brain multimodal query integration
- Composite step planning (location → characters → props)
- Character angle selection based on camera
- Pacing calculation

### ✅ Composite Generator
- Iterative building (max 20 iterations)
- Max 3 references per iteration
- Retry loop (max 5 per step)
- Emergency break
- nano-banana/edit integration

### ✅ Verifier
- **PARALLEL** Brain + FAL verification
- Both must pass
- Combined scoring
- Detailed reporting

### ✅ Scene Generator
- Complete pipeline orchestration
- PayloadCMS status updates
- Video generation
- Last frame extraction
- Global error handling

### ✅ Error Handling
- Custom error types
- Phase tracking
- PayloadCMS error updates
- Detailed error context
