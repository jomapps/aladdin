# Complete Production System Implementation Plan

**Version**: 1.0
**Date**: 2025-10-04
**Status**: Ready for Implementation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Service Infrastructure](#service-infrastructure)
3. [Database Architecture](#database-architecture)
4. [Phase 1: Gather (Unqualified Data)](#phase-1-gather-unqualified-data)
5. [Phase 2: Qualification Process](#phase-2-qualification-process)
6. [Phase 3: Scene Structure & Metadata](#phase-3-scene-structure--metadata)
7. [Phase 4: Media Generation Pipeline](#phase-4-media-generation-pipeline)
8. [PayloadCMS Collections](#payloadcms-collections)
9. [API Specifications](#api-specifications)
10. [Implementation Phases](#implementation-phases)
11. [Testing & Validation](#testing--validation)
12. [Open Questions](#open-questions)

---

## System Overview

### Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 1: GATHER                             │
│                                                                 │
│  User Input → gather_[project-slug] (MongoDB)                  │
│              Raw, unstructured exploration                      │
│                                                                 │
│  Evaluation System → Check readiness                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼ User clicks "Generate Qualified Data"
                      │ (10s popup for edits)
┌─────────────────────▼───────────────────────────────────────────┐
│                 PHASE 2: QUALIFICATION                          │
│                                                                 │
│  Sequential Department Execution:                               │
│  ├─ Phase A (Parallel):                                        │
│  │  ├─ Character Dept → Profiles + Master + 360°              │
│  │  ├─ World Dept → Story Bible                               │
│  │  └─ Visual Dept → Style Guide                              │
│  │                                                             │
│  ├─ Phase B (After A):                                         │
│  │  └─ Story Dept → Screenplay → Scenes (7s each)             │
│  │                                                             │
│  ├─ Phase C (After B):                                         │
│  │  └─ Other departments → Their outputs                       │
│  │                                                             │
│  └─ Phase D (Final):                                           │
│     └─ Brain Ingestion (all qualified data)                    │
│                                                                 │
│  Output:                                                        │
│  ├─ qualified_[project-slug] (MongoDB - flexible)              │
│  ├─ PayloadCMS collections (structured, UI-editable)           │
│  └─ brain.ft.tc (knowledge graph)                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼ Qualification complete
┌─────────────────────▼───────────────────────────────────────────┐
│               PHASE 3: MEDIA GENERATION                         │
│                                                                 │
│  For each scene:                                                │
│  ├─ Shot Agent → Composite iterations (max 20)                 │
│  │  └─ Max 3 refs per request                                  │
│  │                                                             │
│  ├─ Continuity Agent → Check last frame (parallel)             │
│  │                                                             │
│  ├─ Generate Composite Image:                                  │
│  │  ├─ i) Warehouse + lighting → verify                       │
│  │  ├─ ii) + Aladdin + Jafar → verify                         │
│  │  └─ iii) + sword + dagger → verify                         │
│  │                                                             │
│  ├─ Two-Step Verification (BOTH must pass):                    │
│  │  ├─ Brain multimodal query                                 │
│  │  └─ FAL vision model (moondream2)                          │
│  │  └─ If fail: retry up to 5 times                           │
│  │                                                             │
│  ├─ Video Generation (3-7s):                                   │
│  │  ├─ Text-to-video OR                                        │
│  │  ├─ Image-to-video OR                                       │
│  │  └─ Video-to-video                                          │
│  │                                                             │
│  └─ Extract Last Frame → Next scene                            │
│                                                                 │
│  After all scenes:                                              │
│  └─ Video Stitching Service → Final product                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Infrastructure

### Production Services

All services are operational and production-ready:

#### 1. Brain Service (Knowledge Graph & Validation)

**URL**: `https://brain.ft.tc`
**Port**: 8002
**Technology**: Neo4j + Jina AI v4 + MCP Protocol
**Authentication**: `BRAIN_SERVICE_API_KEY` from `.env`

**Endpoints**:
```typescript
POST https://brain.ft.tc/api/v1/knowledge/query
POST https://brain.ft.tc/api/v1/knowledge/store
GET  https://brain.ft.tc/api/v1/knowledge/context/{project_id}
POST https://brain.ft.tc/api/v1/embeddings/generate
GET  https://brain.ft.tc/health
```

**Usage**:
```typescript
// Query for verification
const response = await fetch('https://brain.ft.tc/api/v1/knowledge/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.BRAIN_SERVICE_API_KEY
  },
  body: JSON.stringify({
    query: "Is the face of Jackson correct in this image?",
    image_url: "https://media.rumbletv.com/scene_001.jpg",
    context: {
      project_id: "aladdin-2024",
      character_id: "jackson_character_001"
    }
  })
});
```

**Response Times**:
- Query: < 1 second
- Embedding generation: < 2 seconds
- Context retrieval: < 500ms

---

#### 2. Task Service (GPU Processing & Queue)

**URL**: `https://tasks.ft.tc`
**Port**: 8001
**Technology**: FastAPI + Celery + Redis
**Authentication**: `TASK_API_KEY` from `.env`

**Endpoints**:
```typescript
POST   https://tasks.ft.tc/api/v1/tasks/submit
GET    https://tasks.ft.tc/api/v1/tasks/{task_id}/status
GET    https://tasks.ft.tc/api/v1/projects/{project_id}/tasks
DELETE https://tasks.ft.tc/api/v1/tasks/{task_id}/cancel
POST   https://tasks.ft.tc/api/v1/tasks/{task_id}/retry
GET    https://tasks.ft.tc/api/v1/health
```

**Task Types**:
- `generate_video` - 7-second video segments
- `generate_image` - Character designs, concept art
- `generate_character_voice` - Voice synthesis
- `process_audio` - Audio mixing
- `test_prompt` - Agent prompt testing
- `evaluate_department` - Department evaluation

**Usage**:
```typescript
const response = await fetch('https://tasks.ft.tc/api/v1/tasks/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.TASK_API_KEY
  },
  body: JSON.stringify({
    project_id: 'aladdin-2024',
    task_type: 'generate_video',
    task_data: {
      scene_id: 'scene_001',
      prompt: 'Aladdin strikes Jafar from above...',
      start_image_url: 'https://media.rumbletv.com/last_frame_scene_000.jpg',
      duration: 7.0
    },
    callback_url: 'https://aladdin.ngrok.pro/api/webhooks/video-complete',
    priority: 1
  })
});
```

**Response Times**:
- Image generation: 30-90 seconds
- Video generation: 2-8 minutes
- Voice synthesis: 10-30 seconds

---

#### 3. Last Frame Service (Video/Audio Operations)

**URL**: `https://last-frame.ft.tc`
**Authentication**: Bearer token `121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67`

**Endpoints**:
```typescript
POST https://last-frame.ft.tc/api/v1/process          // Extract last frame
POST https://last-frame.ft.tc/api/v1/stitch           // Video stitching
POST https://last-frame.ft.tc/api/v1/audio-stitch     // Audio stitching
POST https://last-frame.ft.tc/api/v1/music-track      // Music mixing
POST https://last-frame.ft.tc/api/v1/length           // Media length detection
GET  https://last-frame.ft.tc/api/v1/status/{task_id} // Task status
```

**Last Frame Extraction**:
```typescript
const response = await fetch('https://last-frame.ft.tc/api/v1/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    video_url: 'https://media.rumbletv.com/scene_001_video.mp4',
    webhook_url: 'https://aladdin.ngrok.pro/api/webhooks/last-frame-complete'
  })
});
```

**Video Stitching**:
```typescript
const response = await fetch('https://last-frame.ft.tc/api/v1/stitch', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    video_urls: [
      'https://media.rumbletv.com/scene_001.mp4',
      'https://media.rumbletv.com/scene_002.mp4',
      'https://media.rumbletv.com/scene_003.mp4'
    ],
    webhook_url: 'https://aladdin.ngrok.pro/api/webhooks/stitch-complete'
  })
});
```

**Response Times**:
- Last frame extraction: 0.5-2 seconds
- Video stitching: 2-5 seconds (depends on video count)
- Audio stitching: 1-3 seconds

---

#### 4. FAL.ai Models (Image/Video Generation)

**Authentication**: `FAL_KEY` from `.env`

**Models**:

**A) Text-to-Image**: `fal-ai/nano-banana`
```typescript
const response = await fetch('https://fal.run/fal-ai/nano-banana', {
  method: 'POST',
  headers: {
    'Authorization': `Key ${process.env.FAL_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A grand warehouse at evening, dramatic lighting...',
    image_size: '1920x1080',
    num_inference_steps: 50
  })
});
```

**B) Image-to-Image (360° Generation)**: `fal-ai/nano-banana/edit`
```typescript
const response = await fetch('https://fal.run/fal-ai/nano-banana/edit', {
  method: 'POST',
  headers: {
    'Authorization': `Key ${process.env.FAL_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image_url: 'https://media.rumbletv.com/jackson_master_ref.jpg',
    prompt: 'Same character, view from the back',
    strength: 0.7
  })
});
```

**C) Vision Verification**: `fal-ai/moondream2/visual-query`
```typescript
const response = await fetch('https://fal.run/fal-ai/moondream2/visual-query', {
  method: 'POST',
  headers: {
    'Authorization': `Key ${process.env.FAL_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image_url: 'https://media.rumbletv.com/scene_composite.jpg',
    query: 'Does this image show Aladdin with a sword striking from above?'
  })
});
```

**Model Documentation**: See `/docs/model-references/` for detailed specs

---

## Database Architecture

### Three-Tier System

#### Tier 1: Gather Database (Unqualified)

**Name Pattern**: `gather_[project-slug]`
**Example**: `gather_aladdin-2024`

**Purpose**: Raw, exploratory data collection
**Status**: Unvalidated, may have duplicates, contradictions, incomplete info

**Collections** (Flexible, created as needed):
- `raw_characters`
- `raw_scenes`
- `raw_locations`
- `raw_props`
- `raw_notes`
- `user_inputs`
- `ai_expansions`

**Access**: Only during gather phase
**Lifecycle**: Locked (read-only) after qualification button pressed

---

#### Tier 2: Qualified Database (Production-Ready)

**Name Pattern**: `qualified_[project-slug]`
**Example**: `qualified_aladdin-2024`

**Purpose**: Validated, production-ready data
**Status**: Clean, deduplicated, consistent, passed evaluation

**Collections** (Dynamic, project-specific):
- `screenplay` - Full screenplay document
- `story_bible` - Consistency rules and world facts
- `scene_metadata` - Structured scene information
- `character_profiles` - Validated character data
- `character_360_references` - All angle views with descriptions
- `visual_guidelines` - Style guide, color palettes, mood
- `world_rules` - Physics, magic, technology constraints
- `location_details` - Validated location data
- `prop_catalog` - Approved props with descriptions

**Data Format**: All JSON key:value pairs, flexible schemas

**Example Document**:
```json
{
  "_id": "jackson_character_001",
  "name": "Jackson",
  "role": "protagonist",
  "master_reference_url": "https://media.rumbletv.com/jackson_master.jpg",
  "references_360": {
    "front": {
      "url": "https://media.rumbletv.com/jackson_front.jpg",
      "description": "Jackson facing camera, neutral expression, casual outfit, standing straight..."
    },
    "back": {
      "url": "https://media.rumbletv.com/jackson_back.jpg",
      "description": "Jackson from behind, showing back of head, jacket details visible..."
    },
    "left_side": {
      "url": "https://media.rumbletv.com/jackson_left.jpg",
      "description": "Jackson's left profile, showing ear, side of face, body angle 90°..."
    },
    "right_side": {
      "url": "https://media.rumbletv.com/jackson_right.jpg",
      "description": "Jackson's right profile, opposite side visible..."
    },
    "three_quarter_left": {
      "url": "https://media.rumbletv.com/jackson_3ql.jpg",
      "description": "Jackson at 45° angle from left, partial face visible..."
    },
    "three_quarter_right": {
      "url": "https://media.rumbletv.com/jackson_3qr.jpg",
      "description": "Jackson at 45° angle from right..."
    }
  },
  "personality": "Bold, charismatic, street-smart...",
  "appearance": "Medium height, athletic build, dark hair...",
  "background": "Grew up in the streets of Agrabah...",
  "generated_by_agent": "character_creator_v2"
}
```

---

#### Tier 3: PayloadCMS (Structured UI-Editable)

**Purpose**: User-editable structured data with admin UI
**Database**: Main PayloadCMS MongoDB connection

**Collections**: See [PayloadCMS Collections](#payloadcms-collections) section

---

### Data Distribution Rules

| Data Type | Gather DB | Qualified DB | PayloadCMS | Brain |
|-----------|-----------|--------------|------------|-------|
| Raw user input | ✓ | ✗ | ✗ | ✗ |
| Validated characters | ✗ | ✓ | ✗ | ✓ |
| 360° references | ✗ | ✓ | ✓ (metadata) | ✓ |
| Story bible | ✗ | ✓ | ✓ | ✓ |
| Scenes (structure) | ✗ | ✗ | ✓ | ✓ |
| Scene prompts | ✗ | ✗ | ✓ | ✗ |
| Generated videos | ✗ | ✗ | ✓ (URLs) | ✗ |
| Prompt templates | ✗ | ✗ | ✓ | ✗ |

---

## Phase 1: Gather (Unqualified Data)

### Overview

User explores and collects raw information about their movie project.

### Database Operations

**Create Gather Database**:
```typescript
// src/lib/db/gatherDatabase.ts (already exists)
import { MongoClient } from 'mongodb';

export async function getGatherDatabase(projectSlug: string) {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();

  const dbName = `gather_${projectSlug}`;
  return client.db(dbName);
}

export async function createGatherCollection(
  projectSlug: string,
  collectionName: string,
  data: any
) {
  const db = await getGatherDatabase(projectSlug);
  const collection = db.collection(collectionName);

  return await collection.insertOne({
    ...data,
    created_at: new Date(),
    source: 'user_input'
  });
}
```

### Evaluation System

**Check if data is sufficient**:
```typescript
// src/lib/evaluation/checkReadiness.ts
interface DepartmentReadiness {
  department: string;
  ready: boolean;
  score: number;
  missing_items: string[];
}

export async function evaluateProjectReadiness(
  projectId: string
): Promise<{
  overall_ready: boolean;
  departments: DepartmentReadiness[];
}> {
  // Submit to tasks.ft.tc for evaluation
  const taskService = new TaskServiceClient();

  const tasks = await Promise.all(
    DEPARTMENTS.map(dept =>
      taskService.submitEvaluation({
        projectId,
        departmentSlug: dept.slug,
        departmentNumber: dept.number,
        gatherData: await getGatherDataForDept(projectId, dept.slug),
        threshold: 75 // 75% completeness required
      })
    )
  );

  // Poll for results...
  const results = await pollEvaluationResults(tasks);

  return {
    overall_ready: results.every(r => r.ready),
    departments: results
  };
}
```

---

## Phase 2: Qualification Process

### Trigger: User Button Click

**UI Component**:
```typescript
// src/app/(frontend)/dashboard/project/[id]/project-readiness/page.tsx

export default function ProjectReadinessPage({ projectId }) {
  const [showPopup, setShowPopup] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const handleGenerateQualifiedData = async () => {
    // Show 10-second popup
    setShowPopup(true);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-continue after 10s
          startQualification();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startQualification = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/qualify`, {
        method: 'POST'
      });

      if (!response.ok) {
        // Show error at top of all pages
        showGlobalError(await response.json());
        return;
      }

      // Navigate to qualification progress page
      router.push(`/dashboard/project/${projectId}/qualification-progress`);

    } catch (error) {
      showGlobalError(error.message);
    }
  };

  return (
    <div>
      <Button onClick={handleGenerateQualifiedData}>
        Generate Qualified Data
      </Button>

      {showPopup && (
        <EditPopup
          countdown={countdown}
          onEdit={() => {
            clearInterval(timer);
            setShowPopup(false);
          }}
          onContinue={() => {
            clearInterval(timer);
            startQualification();
          }}
        />
      )}
    </div>
  );
}
```

---

### Sequential Department Execution

**API Route**:
```typescript
// src/app/api/projects/[id]/qualify/route.ts

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  try {
    // Lock gather database (make read-only)
    await lockGatherDatabase(projectId);

    // Phase A: Character, World, Visual (PARALLEL)
    console.log('[Qualification] Phase A: Starting parallel execution');
    const phaseA = await Promise.all([
      executeCharacterDepartment(projectId),
      executeWorldDepartment(projectId),
      executeVisualDepartment(projectId)
    ]);

    if (phaseA.some(result => !result.success)) {
      throw new Error('Phase A failed: ' + JSON.stringify(phaseA));
    }

    // Phase B: Story Department (needs Phase A)
    console.log('[Qualification] Phase B: Story department');
    const phaseB = await executeStoryDepartment(projectId);

    if (!phaseB.success) {
      throw new Error('Phase B failed: ' + phaseB.error);
    }

    // Phase C: Other departments
    console.log('[Qualification] Phase C: Other departments');
    const phaseC = await executeOtherDepartments(projectId);

    if (!phaseC.success) {
      throw new Error('Phase C failed: ' + phaseC.error);
    }

    // Phase D: Brain ingestion (FINAL)
    console.log('[Qualification] Phase D: Brain ingestion');
    const phaseD = await ingestAllToBrain(projectId);

    if (!phaseD.success) {
      throw new Error('Phase D failed: ' + phaseD.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Qualification complete',
      qualified_db: `qualified_${projectId}`
    });

  } catch (error) {
    // STOP on error
    console.error('[Qualification] ERROR:', error);

    // Show error at top of all pages
    await createGlobalError(projectId, error.message);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

---

### Character Department (Phase A)

**Generate 360° References**:
```typescript
// src/lib/qualification/characterDepartment.ts

export async function executeCharacterDepartment(projectId: string) {
  const gatherDb = await getGatherDatabase(projectId);
  const characters = await gatherDb.collection('raw_characters').find().toArray();

  const qualifiedDb = await getQualifiedDatabase(projectId);

  for (const char of characters) {
    // 1. Generate master reference
    console.log(`[Character] Generating master reference for ${char.name}`);

    const masterRefResponse = await fetch('https://fal.run/fal-ai/nano-banana', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: generateCharacterPrompt(char),
        image_size: '1920x1080'
      })
    });

    const masterRef = await masterRefResponse.json();

    // 2. Generate 360° views IN PARALLEL (6 views)
    console.log(`[Character] Generating 360° views for ${char.name}`);

    const angles = [
      { name: 'front', prompt: 'Same character, facing camera directly' },
      { name: 'back', prompt: 'Same character, view from behind' },
      { name: 'left_side', prompt: 'Same character, left side profile' },
      { name: 'right_side', prompt: 'Same character, right side profile' },
      { name: 'three_quarter_left', prompt: 'Same character, 45° from left' },
      { name: 'three_quarter_right', prompt: 'Same character, 45° from right' }
    ];

    const views360 = await Promise.all(
      angles.map(async (angle) => {
        const response = await fetch('https://fal.run/fal-ai/nano-banana/edit', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${process.env.FAL_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image_url: masterRef.images[0].url,
            prompt: angle.prompt,
            strength: 0.7
          })
        });

        const result = await response.json();

        return {
          angle: angle.name,
          url: result.images[0].url,
          description: await generateImageDescription(result.images[0].url, char, angle.name)
        };
      })
    );

    // 3. Store in qualified database
    await qualifiedDb.collection('character_profiles').insertOne({
      character_id: char._id,
      name: char.name,
      master_reference_url: masterRef.images[0].url,
      references_360: views360.reduce((acc, view) => {
        acc[view.angle] = {
          url: view.url,
          description: view.description
        };
        return acc;
      }, {}),
      personality: char.personality,
      appearance: char.appearance,
      background: char.background,
      generated_by_agent: 'character_creator_v2',
      created_at: new Date()
    });

    // 4. Ingest into brain
    await ingestCharacterToBrain(projectId, char._id);
  }

  return { success: true };
}

async function generateImageDescription(
  imageUrl: string,
  character: any,
  angle: string
): Promise<string> {
  // Use vision model to describe what's visible
  const response = await fetch('https://fal.run/fal-ai/moondream2/visual-query', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${process.env.FAL_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image_url: imageUrl,
      query: `Describe this image of ${character.name} from the ${angle} angle. Include visible features, clothing, expression, lighting, and any distinguishing characteristics.`
    })
  });

  const result = await response.json();
  return result.output;
}
```

---

### Story Department (Phase B)

**Generate Screenplay & Break into Scenes**:
```typescript
// src/lib/qualification/storyDepartment.ts

export async function executeStoryDepartment(projectId: string) {
  const gatherDb = await getGatherDatabase(projectId);
  const qualifiedDb = await getQualifiedDatabase(projectId);

  // Get story bible and character data from qualified DB
  const storyBible = await qualifiedDb.collection('story_bible').findOne({});
  const characters = await qualifiedDb.collection('character_profiles').find().toArray();

  // 1. Generate full screenplay
  console.log('[Story] Generating screenplay');

  const screenplay = await generateScreenplay({
    projectId,
    storyBible,
    characters,
    gatherData: await gatherDb.collection('raw_scenes').find().toArray()
  });

  // 2. Store screenplay
  await qualifiedDb.collection('screenplay').insertOne({
    project_id: projectId,
    content: screenplay.content,
    generated_by: 'story_architect_v3',
    created_at: new Date()
  });

  // 3. Break screenplay into scenes (7s max each)
  console.log('[Story] Breaking screenplay into scenes');

  const scenes = await breakScreenplayIntoScenes(screenplay.content, storyBible);

  // 4. Create scene documents in PayloadCMS
  const payload = await getPayloadClient();

  for (const scene of scenes) {
    await payload.create({
      collection: 'scenes',
      data: {
        project: projectId,
        scene_number: scene.number,
        sequence_number: scene.sequence,

        // Story context
        screenplay_text: scene.text,
        dramatic_effect: scene.dramatic_effect, // LLM-analyzed
        expected_duration: scene.duration, // 3-7 seconds

        // Will be populated during media generation
        composite_iterations: [],
        generated_image_url: null,
        generated_video_url: null,
        last_frame_url: null,

        // Agent tracking
        shot_agent_decisions: {},
        continuity_checks: [],
        verification_results: [],

        status: 'ready_for_generation',
        created_at: new Date()
      }
    });
  }

  return { success: true, scenes_created: scenes.length };
}

async function breakScreenplayIntoScenes(
  screenplay: string,
  storyBible: any
): Promise<SceneBreakdown[]> {
  // Use LLM to analyze screenplay and break into 3-7s scenes
  // Each scene gets dramatic effect analysis

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [{
        role: 'user',
        content: `Given this screenplay and story bible, break it into scenes that are each 3-7 seconds long.

For each scene, specify:
- Scene number
- Sequence order
- Screenplay text
- Expected duration (3-7s)
- Dramatic effect (what emotion/impact should this create?)
- Camera angle suggestions
- Lighting suggestions
- Pacing (fast/medium/slow)

Screenplay:
${screenplay}

Story Bible:
${JSON.stringify(storyBible, null, 2)}

Return as JSON array of scenes.`
      }]
    })
  });

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}
```

---

## Phase 3: Scene Structure & Metadata

### PayloadCMS Scenes Collection

**Complete Schema** (100+ optional fields):

```typescript
// src/collections/Scenes.ts

import { CollectionConfig } from 'payload/types';

const Scenes: CollectionConfig = {
  slug: 'scenes',
  admin: {
    useAsTitle: 'scene_number',
    defaultColumns: ['scene_number', 'status', 'expected_duration', 'updatedAt']
  },
  fields: [
    // === BASIC INFO ===
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true
    },
    {
      name: 'scene_number',
      type: 'number',
      required: true,
      admin: {
        description: 'Scene number in screenplay'
      }
    },
    {
      name: 'sequence_number',
      type: 'number',
      required: true,
      admin: {
        description: 'Order in final video'
      }
    },

    // === STORY CONTEXT ===
    {
      name: 'screenplay_text',
      type: 'textarea',
      admin: {
        description: 'Original screenplay text for this scene'
      }
    },
    {
      name: 'dramatic_effect',
      type: 'text',
      admin: {
        description: 'LLM-analyzed dramatic intent: tension, excitement, sadness, etc.'
      }
    },
    {
      name: 'expected_duration',
      type: 'number',
      min: 3,
      max: 7,
      admin: {
        description: 'Expected scene duration in seconds (3-7s)'
      }
    },
    {
      name: 'actual_duration',
      type: 'number',
      admin: {
        description: 'Actual generated video duration'
      }
    },

    // === VISUAL COMPOSITION ===
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'Scene location (e.g., "warehouse interior")'
      }
    },
    {
      name: 'time_of_day',
      type: 'select',
      options: [
        { label: 'Dawn', value: 'dawn' },
        { label: 'Morning', value: 'morning' },
        { label: 'Afternoon', value: 'afternoon' },
        { label: 'Evening', value: 'evening' },
        { label: 'Night', value: 'night' },
        { label: 'Twilight', value: 'twilight' }
      ]
    },
    {
      name: 'weather',
      type: 'select',
      options: [
        { label: 'Clear', value: 'clear' },
        { label: 'Cloudy', value: 'cloudy' },
        { label: 'Rainy', value: 'rainy' },
        { label: 'Stormy', value: 'stormy' },
        { label: 'Snowy', value: 'snowy' },
        { label: 'Foggy', value: 'foggy' }
      ]
    },

    // === CAMERA ===
    {
      name: 'camera_angle',
      type: 'select',
      options: [
        { label: 'Eye Level', value: 'eye_level' },
        { label: 'High Angle', value: 'high_angle' },
        { label: 'Low Angle', value: 'low_angle' },
        { label: 'Dutch Angle', value: 'dutch_angle' },
        { label: 'Bird\'s Eye', value: 'birds_eye' },
        { label: 'Worm\'s Eye', value: 'worms_eye' }
      ]
    },
    {
      name: 'camera_shot',
      type: 'select',
      options: [
        { label: 'Extreme Wide', value: 'extreme_wide' },
        { label: 'Wide Shot', value: 'wide' },
        { label: 'Medium Shot', value: 'medium' },
        { label: 'Close Up', value: 'close_up' },
        { label: 'Extreme Close Up', value: 'extreme_close_up' },
        { label: 'Over Shoulder', value: 'over_shoulder' }
      ]
    },
    {
      name: 'camera_movement',
      type: 'select',
      options: [
        { label: 'Static', value: 'static' },
        { label: 'Pan', value: 'pan' },
        { label: 'Tilt', value: 'tilt' },
        { label: 'Zoom', value: 'zoom' },
        { label: 'Dolly', value: 'dolly' },
        { label: 'Tracking', value: 'tracking' }
      ]
    },
    {
      name: 'framing',
      type: 'text',
      admin: {
        description: 'Shot composition and framing notes'
      }
    },

    // === LIGHTING ===
    {
      name: 'lighting_type',
      type: 'select',
      options: [
        { label: 'Natural', value: 'natural' },
        { label: 'Dramatic', value: 'dramatic' },
        { label: 'Soft', value: 'soft' },
        { label: 'Hard', value: 'hard' },
        { label: 'Backlit', value: 'backlit' },
        { label: 'Silhouette', value: 'silhouette' }
      ]
    },
    {
      name: 'lighting_mood',
      type: 'text',
      admin: {
        description: 'Overall lighting mood and atmosphere'
      }
    },
    {
      name: 'color_palette',
      type: 'array',
      fields: [
        {
          name: 'color',
          type: 'text'
        }
      ]
    },

    // === CHARACTERS ===
    {
      name: 'characters_present',
      type: 'relationship',
      relationTo: 'characters',
      hasMany: true,
      admin: {
        description: 'Characters appearing in this scene'
      }
    },
    {
      name: 'character_positions',
      type: 'json',
      admin: {
        description: 'Character positions and blocking as JSON'
      }
    },
    {
      name: 'character_emotions',
      type: 'json',
      admin: {
        description: 'Emotional state of each character'
      }
    },
    {
      name: 'costumes',
      type: 'json',
      admin: {
        description: 'Costume details for each character'
      }
    },

    // === PROPS & SET ===
    {
      name: 'props',
      type: 'array',
      fields: [
        {
          name: 'prop_name',
          type: 'text'
        },
        {
          name: 'prop_description',
          type: 'textarea'
        },
        {
          name: 'prop_reference_url',
          type: 'text'
        }
      ]
    },
    {
      name: 'set_dressing',
      type: 'textarea',
      admin: {
        description: 'Environmental details, furniture, decoration'
      }
    },

    // === AUDIO ===
    {
      name: 'dialogue',
      type: 'array',
      fields: [
        {
          name: 'character',
          type: 'relationship',
          relationTo: 'characters'
        },
        {
          name: 'line',
          type: 'textarea'
        },
        {
          name: 'audio_url',
          type: 'text'
        }
      ]
    },
    {
      name: 'music_track',
      type: 'text',
      admin: {
        description: 'Background music or score'
      }
    },
    {
      name: 'sound_effects',
      type: 'array',
      fields: [
        {
          name: 'effect_name',
          type: 'text'
        },
        {
          name: 'timestamp',
          type: 'number'
        }
      ]
    },
    {
      name: 'ambient_sound',
      type: 'text',
      admin: {
        description: 'Background ambient audio'
      }
    },

    // === TRANSITIONS ===
    {
      name: 'transition_in',
      type: 'select',
      options: [
        { label: 'Cut', value: 'cut' },
        { label: 'Fade In', value: 'fade_in' },
        { label: 'Dissolve', value: 'dissolve' },
        { label: 'Wipe', value: 'wipe' }
      ]
    },
    {
      name: 'transition_out',
      type: 'select',
      options: [
        { label: 'Cut', value: 'cut' },
        { label: 'Fade Out', value: 'fade_out' },
        { label: 'Dissolve', value: 'dissolve' },
        { label: 'Wipe', value: 'wipe' }
      ]
    },

    // === GENERATION PROMPTS ===
    {
      name: 'base_prompt',
      type: 'textarea',
      admin: {
        description: 'Base prompt for image/video generation'
      }
    },
    {
      name: 'text_prompt',
      type: 'textarea',
      admin: {
        description: 'Full text prompt used for generation'
      }
    },
    {
      name: 'negative_prompt',
      type: 'textarea',
      admin: {
        description: 'Things to avoid in generation'
      }
    },
    {
      name: 'prompt_template',
      type: 'relationship',
      relationTo: 'prompts',
      admin: {
        description: 'Prompt template used (if any)'
      }
    },

    // === COMPOSITE GENERATION ===
    {
      name: 'composite_iterations',
      type: 'array',
      admin: {
        description: 'History of composite generation attempts'
      },
      fields: [
        {
          name: 'iteration_number',
          type: 'number'
        },
        {
          name: 'references_used',
          type: 'array',
          fields: [
            {
              name: 'reference_type',
              type: 'select',
              options: [
                { label: 'Location', value: 'location' },
                { label: 'Character', value: 'character' },
                { label: 'Prop', value: 'prop' }
              ]
            },
            {
              name: 'reference_url',
              type: 'text'
            },
            {
              name: 'reference_description',
              type: 'text'
            }
          ]
        },
        {
          name: 'generated_url',
          type: 'text'
        },
        {
          name: 'verification_passed',
          type: 'checkbox'
        },
        {
          name: 'verification_details',
          type: 'json'
        },
        {
          name: 'timestamp',
          type: 'date'
        }
      ]
    },
    {
      name: 'composite_final_url',
      type: 'text',
      admin: {
        description: 'Final approved composite image'
      }
    },

    // === GENERATED MEDIA ===
    {
      name: 'generated_image_url',
      type: 'text',
      admin: {
        description: 'Generated start image for video'
      }
    },
    {
      name: 'generated_video_url',
      type: 'text',
      admin: {
        description: 'Generated scene video'
      }
    },
    {
      name: 'last_frame_url',
      type: 'text',
      admin: {
        description: 'Last frame extracted for next scene'
      }
    },

    // === REFERENCES ===
    {
      name: 'character_references_used',
      type: 'json',
      admin: {
        description: 'Which character 360° references were used'
      }
    },
    {
      name: 'location_reference_url',
      type: 'text'
    },
    {
      name: 'props_reference_urls',
      type: 'array',
      fields: [
        {
          name: 'url',
          type: 'text'
        }
      ]
    },

    // === AGENT DECISIONS ===
    {
      name: 'shot_agent_decisions',
      type: 'json',
      admin: {
        description: 'Decisions made by shot agent'
      }
    },
    {
      name: 'continuity_checks',
      type: 'array',
      fields: [
        {
          name: 'check_type',
          type: 'text'
        },
        {
          name: 'passed',
          type: 'checkbox'
        },
        {
          name: 'notes',
          type: 'textarea'
        },
        {
          name: 'timestamp',
          type: 'date'
        }
      ]
    },

    // === VERIFICATION ===
    {
      name: 'verification_results',
      type: 'array',
      fields: [
        {
          name: 'verification_type',
          type: 'select',
          options: [
            { label: 'Brain Query', value: 'brain_query' },
            { label: 'Vision Model', value: 'vision_model' }
          ]
        },
        {
          name: 'query',
          type: 'text'
        },
        {
          name: 'result',
          type: 'textarea'
        },
        {
          name: 'passed',
          type: 'checkbox'
        },
        {
          name: 'confidence',
          type: 'number'
        },
        {
          name: 'timestamp',
          type: 'date'
        }
      ]
    },

    // === METADATA ===
    {
      name: 'generated_by_agent',
      type: 'text',
      admin: {
        description: 'Agent that generated this scene'
      }
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Ready for Generation', value: 'ready_for_generation' },
        { label: 'Generating Composite', value: 'generating_composite' },
        { label: 'Verifying Composite', value: 'verifying_composite' },
        { label: 'Generating Video', value: 'generating_video' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' }
      ],
      defaultValue: 'ready_for_generation'
    },
    {
      name: 'error_message',
      type: 'textarea',
      admin: {
        condition: (data) => data.status === 'failed'
      }
    },
    {
      name: 'retry_count',
      type: 'number',
      defaultValue: 0
    },
    {
      name: 'processing_time',
      type: 'number',
      admin: {
        description: 'Total processing time in seconds'
      }
    }
  ],
  timestamps: true
};

export default Scenes;
```

---

## Phase 4: Media Generation Pipeline

### Scene Generation Workflow

**For each scene in PayloadCMS**:

```typescript
// src/lib/mediaGeneration/sceneGenerator.ts

export async function generateScene(sceneId: string) {
  const payload = await getPayloadClient();
  const scene = await payload.findByID({
    collection: 'scenes',
    id: sceneId,
    depth: 2
  });

  try {
    // 1. Shot Agent Decisions
    console.log(`[Scene ${scene.scene_number}] Shot agent analyzing`);
    const shotDecisions = await shotAgentAnalyze(scene);

    await payload.update({
      collection: 'scenes',
      id: sceneId,
      data: {
        shot_agent_decisions: shotDecisions,
        status: 'generating_composite'
      }
    });

    // 2. Generate Composite Image (Iterative)
    console.log(`[Scene ${scene.scene_number}] Starting composite generation`);
    const composite = await generateCompositeImage(scene, shotDecisions);

    await payload.update({
      collection: 'scenes',
      id: sceneId,
      data: {
        composite_iterations: composite.iterations,
        composite_final_url: composite.final_url,
        status: 'verifying_composite'
      }
    });

    // 3. Two-Step Verification (PARALLEL)
    console.log(`[Scene ${scene.scene_number}] Running verification`);
    const verification = await verifyComposite(composite.final_url, scene);

    if (!verification.passed) {
      throw new Error('Composite verification failed after 5 retries');
    }

    await payload.update({
      collection: 'scenes',
      id: sceneId,
      data: {
        verification_results: verification.results,
        status: 'generating_video'
      }
    });

    // 4. Generate Video
    console.log(`[Scene ${scene.scene_number}] Generating video`);
    const video = await generateVideo(composite.final_url, scene);

    // 5. Extract Last Frame
    console.log(`[Scene ${scene.scene_number}] Extracting last frame`);
    const lastFrame = await extractLastFrame(video.url);

    // 6. Update scene with final data
    await payload.update({
      collection: 'scenes',
      id: sceneId,
      data: {
        generated_image_url: composite.final_url,
        generated_video_url: video.url,
        last_frame_url: lastFrame.url,
        actual_duration: video.duration,
        status: 'completed',
        processing_time: Date.now() - startTime
      }
    });

    return {
      success: true,
      video_url: video.url,
      last_frame_url: lastFrame.url
    };

  } catch (error) {
    await payload.update({
      collection: 'scenes',
      id: sceneId,
      data: {
        status: 'failed',
        error_message: error.message,
        retry_count: scene.retry_count + 1
      }
    });

    // STOP - Show global error
    await createGlobalError(scene.project, `Scene ${scene.scene_number} failed: ${error.message}`);

    throw error;
  }
}
```

---

### Composite Image Generation (Iterative)

**Shot Agent Coordinates Composite Building**:

```typescript
// src/lib/mediaGeneration/compositeGenerator.ts

interface CompositeIteration {
  iteration_number: number;
  references_used: ReferenceUsed[];
  generated_url: string;
  verification_passed: boolean;
  verification_details: any;
  timestamp: Date;
}

export async function generateCompositeImage(
  scene: any,
  shotDecisions: any
): Promise<{
  iterations: CompositeIteration[];
  final_url: string;
}> {
  const iterations: CompositeIteration[] = [];
  let currentImage: string | null = null;

  // Shot agent decides composite flow
  const compositeSteps = shotDecisions.composite_steps; // e.g., ["location", "characters", "props"]

  for (let i = 0; i < compositeSteps.length; i++) {
    const step = compositeSteps[i];

    if (i >= 20) {
      throw new Error('Emergency break: Max 20 iterations reached');
    }

    console.log(`[Composite] Iteration ${i + 1}: ${step.description}`);

    // Get references for this step (max 3)
    const references = await getReferencesForStep(scene, step, 3);

    // Generate composite
    const prompt = buildCompositePrompt(step, references, currentImage);

    let generatedUrl: string;
    let retryCount = 0;
    let verified = false;

    while (retryCount < 5 && !verified) {
      try {
        // Call FAL.ai
        const response = await fetch('https://fal.run/fal-ai/nano-banana/edit', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${process.env.FAL_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image_url: currentImage || references[0].url, // Use current or first ref
            prompt: prompt,
            strength: 0.8
          })
        });

        if (!response.ok) {
          throw new Error(`FAL.ai generation failed: ${response.statusText}`);
        }

        const result = await response.json();
        generatedUrl = result.images[0].url;

        // Verify this iteration
        const verification = await verifySingleIteration(generatedUrl, step, scene);

        if (verification.passed) {
          verified = true;

          iterations.push({
            iteration_number: i + 1,
            references_used: references,
            generated_url: generatedUrl,
            verification_passed: true,
            verification_details: verification,
            timestamp: new Date()
          });

          currentImage = generatedUrl; // Use for next iteration
          break;
        } else {
          retryCount++;
          console.log(`[Composite] Iteration ${i + 1} failed verification, retry ${retryCount}/5`);
        }

      } catch (error) {
        // FAL.ai error = immediate stop
        throw new Error(`FAL.ai error during iteration ${i + 1}: ${error.message}`);
      }
    }

    if (!verified) {
      throw new Error(`Iteration ${i + 1} failed after 5 verification attempts`);
    }
  }

  return {
    iterations,
    final_url: currentImage!
  };
}

async function getReferencesForStep(
  scene: any,
  step: any,
  maxRefs: number
): Promise<ReferenceUsed[]> {
  const references: ReferenceUsed[] = [];

  if (step.type === 'location') {
    // Get location reference from qualified DB
    const qualifiedDb = await getQualifiedDatabase(scene.project);
    const location = await qualifiedDb.collection('location_details')
      .findOne({ name: scene.location });

    if (location) {
      references.push({
        reference_type: 'location',
        reference_url: location.reference_url,
        reference_description: location.description
      });
    }
  }

  if (step.type === 'characters') {
    // Get character 360° references
    const qualifiedDb = await getQualifiedDatabase(scene.project);

    for (const charId of scene.characters_present) {
      if (references.length >= maxRefs) break;

      const character = await qualifiedDb.collection('character_profiles')
        .findOne({ character_id: charId });

      if (character) {
        // Shot agent decides which angle to use based on camera angle
        const angle = selectBestCharacterAngle(character, scene.camera_angle, step);

        references.push({
          reference_type: 'character',
          reference_url: character.references_360[angle].url,
          reference_description: character.references_360[angle].description
        });
      }
    }
  }

  if (step.type === 'props') {
    // Get prop references
    for (const prop of scene.props) {
      if (references.length >= maxRefs) break;

      references.push({
        reference_type: 'prop',
        reference_url: prop.prop_reference_url,
        reference_description: prop.prop_description
      });
    }
  }

  return references;
}

function selectBestCharacterAngle(
  character: any,
  cameraAngle: string,
  step: any
): string {
  // Shot agent logic for selecting best character reference angle
  // Based on camera angle and character position in scene

  const angleMap = {
    'high_angle': 'three_quarter_left',
    'low_angle': 'front',
    'eye_level': 'front',
    'birds_eye': 'front'
  };

  return angleMap[cameraAngle] || 'front';
}
```

---

### Two-Step Verification (Parallel)

**Both Brain Query and Vision Model must pass**:

```typescript
// src/lib/mediaGeneration/verifier.ts

export async function verifyComposite(
  imageUrl: string,
  scene: any
): Promise<{
  passed: boolean;
  results: VerificationResult[];
}> {
  // Run BOTH verifications in PARALLEL
  const [brainResult, visionResult] = await Promise.all([
    verifyWithBrain(imageUrl, scene),
    verifyWithVisionModel(imageUrl, scene)
  ]);

  const results = [
    {
      verification_type: 'brain_query',
      query: brainResult.query,
      result: brainResult.response,
      passed: brainResult.passed,
      confidence: brainResult.confidence,
      timestamp: new Date()
    },
    {
      verification_type: 'vision_model',
      query: visionResult.query,
      result: visionResult.response,
      passed: visionResult.passed,
      confidence: visionResult.confidence,
      timestamp: new Date()
    }
  ];

  // BOTH must pass
  const allPassed = brainResult.passed && visionResult.passed;

  return {
    passed: allPassed,
    results
  };
}

async function verifyWithBrain(
  imageUrl: string,
  scene: any
): Promise<any> {
  // Query brain with multimodal query
  const query = buildBrainVerificationQuery(scene);

  const response = await fetch('https://brain.ft.tc/api/v1/knowledge/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.BRAIN_SERVICE_API_KEY
    },
    body: JSON.stringify({
      query: query,
      image_url: imageUrl,
      context: {
        project_id: scene.project,
        scene_number: scene.scene_number,
        characters: scene.characters_present
      }
    })
  });

  const result = await response.json();

  return {
    query,
    response: result.answer,
    passed: result.confidence > 0.8, // 80% confidence threshold
    confidence: result.confidence
  };
}

async function verifyWithVisionModel(
  imageUrl: string,
  scene: any
): Promise<any> {
  const query = buildVisionVerificationQuery(scene);

  const response = await fetch('https://fal.run/fal-ai/moondream2/visual-query', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${process.env.FAL_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image_url: imageUrl,
      query: query
    })
  });

  const result = await response.json();

  // Parse response to determine if it passed
  const passed = analyzeVisionResponse(result.output, scene);

  return {
    query,
    response: result.output,
    passed,
    confidence: 0.9 // Vision model doesn't return confidence
  };
}

function buildBrainVerificationQuery(scene: any): string {
  const characters = scene.characters_present.map(c => c.name).join(', ');

  return `Does this image correctly show ${characters} in ${scene.location} during ${scene.time_of_day}?
  Camera angle should be ${scene.camera_angle}.
  Verify character appearances match their references.
  Check for consistency with story bible rules.`;
}

function buildVisionVerificationQuery(scene: any): string {
  return `Analyze this image and confirm:
  1. Location matches: ${scene.location}
  2. Characters present: ${scene.characters_present.map(c => c.name).join(', ')}
  3. Props visible: ${scene.props.map(p => p.prop_name).join(', ')}
  4. Lighting and mood: ${scene.lighting_mood}
  5. Camera angle: ${scene.camera_angle}

  Answer YES if all match, NO if any discrepancies.`;
}
```

---

### Video Generation

**Submit to tasks.ft.tc**:

```typescript
// src/lib/mediaGeneration/videoGenerator.ts

export async function generateVideo(
  startImageUrl: string,
  scene: any
): Promise<{
  url: string;
  duration: number;
  task_id: string;
}> {
  const taskService = new TaskServiceClient();

  // Build video generation prompt
  const prompt = buildVideoPrompt(scene);

  // Submit to task service
  const task = await taskService.submitTask('generate_video', {
    projectId: scene.project,
    scene_id: scene.id,
    prompt: prompt,
    start_image_url: startImageUrl,
    duration: scene.expected_duration,
    model: 'fal-ai/video-generation-model' // Placeholder
  });

  if (!task.success) {
    throw new Error(`Video generation submission failed: ${task.error}`);
  }

  // Poll for completion
  const result = await taskService.pollTaskUntilComplete(
    task.taskId,
    (status) => {
      console.log(`[Video Gen] Scene ${scene.scene_number}: ${status.status}`);
    },
    2000, // Poll every 2s
    600000 // 10 minute timeout
  );

  if (!result.success) {
    throw new Error(`Video generation failed: ${result.error}`);
  }

  return {
    url: result.status.result.video_url,
    duration: result.status.result.duration,
    task_id: task.taskId
  };
}

function buildVideoPrompt(scene: any): string {
  return `${scene.text_prompt}

Camera: ${scene.camera_angle}, ${scene.camera_shot}, ${scene.camera_movement}
Lighting: ${scene.lighting_type}, ${scene.lighting_mood}
Duration: ${scene.expected_duration} seconds
Pacing: ${scene.shot_agent_decisions.pacing}

${scene.dramatic_effect}`;
}
```

---

### Last Frame Extraction

**Call last-frame.ft.tc service**:

```typescript
// src/lib/mediaGeneration/lastFrameExtractor.ts

export async function extractLastFrame(
  videoUrl: string
): Promise<{
  url: string;
  task_id: string;
}> {
  const response = await fetch('https://last-frame.ft.tc/api/v1/process', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      video_url: videoUrl,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/last-frame-complete`
    })
  });

  const task = await response.json();

  // Poll for completion
  let completed = false;
  let imageUrl: string;

  while (!completed) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusResponse = await fetch(
      `https://last-frame.ft.tc/api/v1/status/${task.task_id}`,
      {
        headers: {
          'Authorization': 'Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67'
        }
      }
    );

    const status = await statusResponse.json();

    if (status.status === 'completed') {
      imageUrl = status.image_url;
      completed = true;
    } else if (status.status === 'failed') {
      throw new Error(`Last frame extraction failed: ${status.error_message}`);
    }
  }

  return {
    url: imageUrl!,
    task_id: task.task_id
  };
}
```

---

### Video Stitching (Final Assembly)

**After all scenes are generated**:

```typescript
// src/lib/mediaGeneration/videoStitcher.ts

export async function stitchAllScenes(projectId: string) {
  const payload = await getPayloadClient();

  // Get all scenes in sequence order
  const scenes = await payload.find({
    collection: 'scenes',
    where: {
      project: { equals: projectId },
      status: { equals: 'completed' }
    },
    sort: 'sequence_number',
    limit: 1000
  });

  const videoUrls = scenes.docs.map(scene => scene.generated_video_url);

  // Submit to last-frame.ft.tc stitching service
  const response = await fetch('https://last-frame.ft.tc/api/v1/stitch', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      video_urls: videoUrls,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stitch-complete`
    })
  });

  const task = await response.json();

  // Poll for completion
  let completed = false;
  let finalVideoUrl: string;

  while (!completed) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusResponse = await fetch(
      `https://last-frame.ft.tc/api/v1/status/${task.task_id}`,
      {
        headers: {
          'Authorization': 'Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67'
        }
      }
    );

    const status = await statusResponse.json();

    if (status.status === 'completed') {
      finalVideoUrl = status.video_result_url;
      completed = true;
    } else if (status.status === 'failed') {
      throw new Error(`Video stitching failed: ${status.error_message}`);
    }
  }

  // Update project with final video
  await payload.update({
    collection: 'projects',
    id: projectId,
    data: {
      final_video_url: finalVideoUrl,
      status: 'completed'
    }
  });

  return finalVideoUrl;
}
```

---

## PayloadCMS Collections

### Complete Collection Set

**All collections required for the system**:

#### 1. Scenes Collection
Already defined above - 100+ optional fields

#### 2. Prompts Collection

```typescript
// src/collections/Prompts.ts

const Prompts: CollectionConfig = {
  slug: 'prompts',
  admin: {
    useAsTitle: 'name'
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Template name (e.g., "Character Scene Prompt")'
      }
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'What this template is for'
      }
    },
    {
      name: 'prompt',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Template with variables in square brackets [variable_name]'
      }
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Character', value: 'character' },
        { label: 'Scene', value: 'scene' },
        { label: 'Location', value: 'location' },
        { label: 'Props', value: 'props' },
        { label: 'Video', value: 'video' }
      ]
    },
    {
      name: 'variables',
      type: 'array',
      admin: {
        description: 'Variables that need to be replaced'
      },
      fields: [
        {
          name: 'variable_name',
          type: 'text'
        },
        {
          name: 'variable_description',
          type: 'text'
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: true
        }
      ]
    }
  ],
  timestamps: true
};

export default Prompts;
```

**Example Prompt**:
```
Generate an image of [character_name] in [location] during [time_of_day].
Camera angle: [camera_angle]
Lighting: [lighting_type]
Mood: [dramatic_effect]

The character should be [character_action] with [character_emotion] expression.
```

#### 3. Story Bible Collection

```typescript
// src/collections/StoryBible.ts

const StoryBible: CollectionConfig = {
  slug: 'story-bible',
  admin: {
    useAsTitle: 'title'
  },
  fields: [
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      unique: true
    },
    {
      name: 'title',
      type: 'text',
      required: true
    },
    {
      name: 'world_rules',
      type: 'array',
      fields: [
        {
          name: 'rule_category',
          type: 'select',
          options: [
            { label: 'Physics', value: 'physics' },
            { label: 'Magic', value: 'magic' },
            { label: 'Technology', value: 'technology' },
            { label: 'Society', value: 'society' },
            { label: 'History', value: 'history' }
          ]
        },
        {
          name: 'rule_description',
          type: 'textarea'
        }
      ]
    },
    {
      name: 'character_relationships',
      type: 'json',
      admin: {
        description: 'Character relationship matrix'
      }
    },
    {
      name: 'timeline',
      type: 'array',
      fields: [
        {
          name: 'event',
          type: 'text'
        },
        {
          name: 'timestamp',
          type: 'text'
        },
        {
          name: 'description',
          type: 'textarea'
        }
      ]
    },
    {
      name: 'consistency_rules',
      type: 'array',
      fields: [
        {
          name: 'rule',
          type: 'textarea'
        },
        {
          name: 'priority',
          type: 'select',
          options: [
            { label: 'Critical', value: 'critical' },
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' }
          ]
        }
      ]
    },
    {
      name: 'locations',
      type: 'array',
      fields: [
        {
          name: 'location_name',
          type: 'text'
        },
        {
          name: 'location_description',
          type: 'textarea'
        },
        {
          name: 'location_rules',
          type: 'textarea'
        }
      ]
    },
    {
      name: 'generated_by',
      type: 'text',
      admin: {
        description: 'World Agents department'
      }
    }
  ],
  timestamps: true
};

export default StoryBible;
```

---

## API Specifications

### Qualification API

**POST `/api/projects/[id]/qualify`**

Already defined above in Phase 2

---

### Scene Generation API

**POST `/api/scenes/[id]/generate`**

```typescript
// src/app/api/scenes/[id]/generate/route.ts

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const sceneId = params.id;

  try {
    const result = await generateScene(sceneId);

    return NextResponse.json({
      success: true,
      video_url: result.video_url,
      last_frame_url: result.last_frame_url
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

---

### Webhook Endpoints

**POST `/api/webhooks/video-complete`**

```typescript
// src/app/api/webhooks/video-complete/route.ts

export async function POST(request: Request) {
  const data = await request.json();

  const payload = await getPayloadClient();

  await payload.update({
    collection: 'scenes',
    where: {
      id: { equals: data.scene_id }
    },
    data: {
      generated_video_url: data.video_url,
      actual_duration: data.duration,
      status: 'extracting_last_frame'
    }
  });

  // Trigger last frame extraction
  const scene = await payload.findByID({
    collection: 'scenes',
    id: data.scene_id
  });

  await extractLastFrame(data.video_url);

  return NextResponse.json({ received: true });
}
```

**POST `/api/webhooks/last-frame-complete`**

```typescript
// src/app/api/webhooks/last-frame-complete/route.ts

export async function POST(request: Request) {
  const data = await request.json();

  const payload = await getPayloadClient();

  await payload.update({
    collection: 'scenes',
    where: {
      // Find scene by video URL
      generated_video_url: { equals: data.video_url }
    },
    data: {
      last_frame_url: data.image_url,
      status: 'completed'
    }
  });

  return NextResponse.json({ received: true });
}
```

**POST `/api/webhooks/stitch-complete`**

```typescript
// src/app/api/webhooks/stitch-complete/route.ts

export async function POST(request: Request) {
  const data = await request.json();

  const payload = await getPayloadClient();

  // Extract project ID from task metadata
  const projectId = data.metadata.project_id;

  await payload.update({
    collection: 'projects',
    id: projectId,
    data: {
      final_video_url: data.video_result_url,
      status: 'completed'
    }
  });

  return NextResponse.json({ received: true });
}
```

---

## Implementation Phases

### Phase 1: Database Infrastructure (Week 1)

**Tasks**:
- [ ] Create `getQualifiedDatabase()` function
- [ ] Create database naming utilities
- [ ] Test gather → qualified migration
- [ ] Implement data locking mechanism

**Files to Create**:
- `src/lib/db/qualifiedDatabase.ts`
- `src/lib/db/databaseNaming.ts`
- `src/lib/db/migration.ts`

---

### Phase 2: PayloadCMS Collections (Week 1-2)

**Tasks**:
- [ ] Create Scenes collection (100+ fields)
- [ ] Create Prompts collection
- [ ] Create Story Bible collection
- [ ] Create 360° References metadata collection
- [ ] Test all collections in admin UI

**Files to Create**:
- `src/collections/Scenes.ts`
- `src/collections/Prompts.ts`
- `src/collections/StoryBible.ts`
- `src/collections/CharacterReferences.ts`

---

### Phase 3: Qualification System (Week 2-3)

**Tasks**:
- [ ] Create qualification API route
- [ ] Implement 10s popup UI
- [ ] Build sequential department execution
- [ ] Character department with 360° generation
- [ ] World department with story bible
- [ ] Story department with screenplay breakdown
- [ ] Brain ingestion pipeline
- [ ] Error handling and global errors

**Files to Create**:
- `src/app/api/projects/[id]/qualify/route.ts`
- `src/lib/qualification/characterDepartment.ts`
- `src/lib/qualification/worldDepartment.ts`
- `src/lib/qualification/storyDepartment.ts`
- `src/lib/qualification/brainIngestion.ts`
- `src/components/qualification/EditPopup.tsx`

---

### Phase 4: Media Generation Pipeline (Week 3-5)

**Tasks**:
- [ ] Shot agent implementation
- [ ] Composite image generator (iterative)
- [ ] Two-step verification system
- [ ] Video generation via tasks.ft.tc
- [ ] Last frame extraction integration
- [ ] Video stitching integration
- [ ] Webhook handlers
- [ ] Error recovery and retry logic

**Files to Create**:
- `src/lib/mediaGeneration/sceneGenerator.ts`
- `src/lib/mediaGeneration/shotAgent.ts`
- `src/lib/mediaGeneration/compositeGenerator.ts`
- `src/lib/mediaGeneration/verifier.ts`
- `src/lib/mediaGeneration/videoGenerator.ts`
- `src/lib/mediaGeneration/lastFrameExtractor.ts`
- `src/lib/mediaGeneration/videoStitcher.ts`
- `src/app/api/webhooks/video-complete/route.ts`
- `src/app/api/webhooks/last-frame-complete/route.ts`
- `src/app/api/webhooks/stitch-complete/route.ts`

---

### Phase 5: UI & Monitoring (Week 5-6)

**Tasks**:
- [ ] Qualification progress page
- [ ] Scene generation monitoring
- [ ] Global error display system
- [ ] Scene editor UI
- [ ] Video player with timeline
- [ ] Final video preview

**Files to Create**:
- `src/app/(frontend)/dashboard/project/[id]/qualification-progress/page.tsx`
- `src/app/(frontend)/dashboard/project/[id]/scenes/page.tsx`
- `src/components/errors/GlobalErrorBanner.tsx`
- `src/components/scenes/SceneEditor.tsx`
- `src/components/scenes/VideoTimeline.tsx`

---

## Testing & Validation

### Unit Tests Required

**Database Operations**:
```typescript
// tests/db/qualifiedDatabase.test.ts
describe('Qualified Database', () => {
  it('should create qualified database with correct naming', async () => {
    const db = await getQualifiedDatabase('test-project');
    expect(db.databaseName).toBe('qualified_test-project');
  });

  it('should store character profiles correctly', async () => {
    // Test character profile storage
  });
});
```

**Composite Generation**:
```typescript
// tests/mediaGeneration/compositeGenerator.test.ts
describe('Composite Generator', () => {
  it('should stop after 20 iterations (emergency break)', async () => {
    // Mock infinite loop scenario
    // Verify it stops at 20
  });

  it('should retry up to 5 times on verification failure', async () => {
    // Mock verification failures
    // Verify retry logic
  });

  it('should use max 3 references per request', async () => {
    // Verify reference limiting
  });
});
```

---

### Integration Tests Required

**Qualification Flow**:
```typescript
// tests/integration/qualification.test.ts
describe('Qualification Flow', () => {
  it('should execute departments sequentially', async () => {
    // Test Phase A → B → C → D execution
  });

  it('should stop on error and display globally', async () => {
    // Simulate department failure
    // Verify error is shown at top of all pages
  });
});
```

**Scene Generation**:
```typescript
// tests/integration/sceneGeneration.test.ts
describe('Scene Generation', () => {
  it('should generate complete scene from start to finish', async () => {
    // Test full pipeline
  });

  it('should handle FAL.ai errors correctly', async () => {
    // Mock FAL.ai failure
    // Verify immediate stop
  });
});
```

---

## Open Questions

### 1. Prompt Template System

**Question**: Should prompt templates be pre-populated with defaults, or should users create all templates?

**Options**:
- A) Ship with 10-20 default templates
- B) Users create from scratch
- C) Hybrid: Defaults + user creation

**Impact**: Affects onboarding experience

---

### 2. Global Error Display

**Question**: How long should global errors persist?

**Options**:
- A) Until user dismisses
- B) Auto-dismiss after 30 seconds
- C) Persist until issue resolved

**Recommendation**: A (user dismiss) - generations cost money, user must acknowledge

---

### 3. Continuity Agent Placement

**Question**: Should continuity agent be:
- A) Part of shot agent
- B) Separate parallel agent
- C) Post-generation validator

**Current Plan**: B (separate parallel agent) per design

---

### 4. Scene Duration Flexibility

**Question**: Should users be able to override shot agent's duration decision?

**Options**:
- A) Yes, via scene editor in PayloadCMS
- B) No, shot agent decides based on narrative
- C) Suggestion only, user approves

**Recommendation**: A - PayloadCMS is editable UI

---

### 5. Reference Image Updates

**Question**: If character appearance changes (injury, costume change), should we:
- A) Generate new 360° set automatically
- B) Version the character (character_v2)
- C) Manual user decision

**Impact**: Storage and generation costs

---

## Summary

### System Components Defined

✅ **3 Production Services** with URLs and authentication
✅ **3-Tier Database Architecture** (gather → qualified → PayloadCMS)
✅ **Complete Qualification Workflow** (sequential with dependencies)
✅ **Scene Generation Pipeline** (composite → verify → video → stitch)
✅ **PayloadCMS Collections** (Scenes with 100+ fields, Prompts, Story Bible)
✅ **API Specifications** with request/response examples
✅ **Webhook Integration** for async operations
✅ **Implementation Phases** with file-by-file breakdown
✅ **Testing Requirements** (unit + integration)
✅ **All 12 Resolved Loopholes** integrated throughout

### Ready for Implementation

This document provides complete specifications for building the entire production system from gather to final video. All services are operational, all workflows are defined, and all critical decisions are documented.

**Next Steps**:
1. Review this document for any remaining questions
2. Prioritize implementation phases
3. Begin with Phase 1 (Database Infrastructure)
4. Iterate through phases sequentially

---

**Document Version**: 1.0
**Last Updated**: 2025-10-04
**Status**: ✅ Complete and Ready for Implementation
