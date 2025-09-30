# Aladdin - Video Generation Pipeline

**Version**: 0.1.0  
**Last Updated**: January 28, 2025  
**Parent Document**: [SPECIFICATION.md](./SPECIFICATION.md)

---

## Overview

The video generation pipeline transforms scenes into visual content using AI models. Maximum video length is **7 seconds** per clip.

**Generation Methods**:
1. Text-to-video
2. Image-to-video (single image)
3. Image-to-video (first + last frame)
4. Composite image to video

---

## 1. Video Generation Workflow

### Pipeline Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. SCENE READY FOR VIDEO GENERATION                     │
│    - Script finalized                                    │
│    - Storyboard complete                                 │
│    - Reference images available                          │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 2. DETERMINE GENERATION METHOD                          │
│    - Text-to-video: No images, just script              │
│    - Image-to-video: Single reference image             │
│    - First-last frame: Two keyframe images              │
│    - Composite: Multiple reference images               │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 3. PREPARE INPUTS                                       │
│    - Gather reference images                            │
│    - Compose generation prompt                          │
│    - Set technical parameters                           │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 4. GENERATE VIDEO (Max 7 seconds)                      │
│    - Send to generation API                             │
│    - Monitor progress                                   │
│    - Receive generated video                            │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 5. QUALITY CHECK                                        │
│    - Verify against references                          │
│    - Check consistency                                  │
│    - Validate duration (≤ 7s)                           │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 6. PRESENT TO USER                                      │
│    - Show generated video                               │
│    - Display quality score                              │
│    - Ask: INGEST, REGENERATE, or DISCARD               │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Generation Methods

### 2.1 Text-to-Video

**Use Case**: No visual references available

```typescript
interface TextToVideoRequest {
  method: 'text-to-video';
  
  input: {
    prompt: string;              // Scene description
    negativePrompt?: string;
    style?: string;              // e.g., "cinematic", "anime"
  };
  
  parameters: {
    duration: number;            // Seconds (max 7)
    fps: number;                 // Frames per second
    resolution: string;          // e.g., "1920x1080"
    model: string;               // e.g., "runwayml-gen3"
  };
}
```

**Example**:
```json
{
  "method": "text-to-video",
  "input": {
    "prompt": "A cyberpunk detective walks through neon-lit streets at night, rain falling",
    "style": "cinematic"
  },
  "parameters": {
    "duration": 7,
    "fps": 24,
    "resolution": "1920x1080",
    "model": "runwayml-gen3"
  }
}
```

### 2.2 Image-to-Video (Single Image)

**Use Case**: Animate a single image

```typescript
interface ImageToVideoRequest {
  method: 'image-to-video';
  
  input: {
    sourceImage: string;         // Media ID or URL
    prompt: string;              // Motion description
    motion?: string;             // e.g., "pan left", "zoom in"
  };
  
  parameters: {
    duration: number;            // Max 7 seconds
    fps: number;
    model: string;
  };
}
```

**Example**:
```json
{
  "method": "image-to-video",
  "input": {
    "sourceImage": "media_sarah_portrait_789",
    "prompt": "Sarah turns her head slowly to look at the camera",
    "motion": "slow head turn"
  },
  "parameters": {
    "duration": 5,
    "fps": 24,
    "model": "pika-labs"
  }
}
```

### 2.3 First-Last Frame

**Use Case**: Define start and end states

```typescript
interface FirstLastFrameRequest {
  method: 'first-last-frame';
  
  input: {
    firstFrame: string;          // Starting image
    lastFrame: string;           // Ending image
    prompt: string;              // Transition description
  };
  
  parameters: {
    duration: number;            // Max 7 seconds
    fps: number;
    interpolation: 'smooth' | 'dynamic' | 'cut';
    model: string;
  };
}
```

**Example**:
```json
{
  "method": "first-last-frame",
  "input": {
    "firstFrame": "media_sarah_standing_001",
    "lastFrame": "media_sarah_running_002",
    "prompt": "Sarah breaks into a run"
  },
  "parameters": {
    "duration": 7,
    "fps": 24,
    "interpolation": "dynamic",
    "model": "runwayml-gen3"
  }
}
```

### 2.4 Composite Image to Video

**Use Case**: Generate video from composite shot

```typescript
interface CompositeToVideoRequest {
  method: 'composite-to-video';
  
  input: {
    compositeImage: string;      // Pre-composed image from Image Quality Dept
    action: string;              // What happens in the video
    cameraMovement?: string;
  };
  
  references: {
    character?: string;          // Character reference ID
    location?: string;           // Location reference ID
    props?: string[];            // Prop reference IDs
  };
  
  parameters: {
    duration: number;            // Max 7 seconds
    fps: number;
    model: string;               // e.g., "nano_banana"
  };
}
```

**Example**:
```json
{
  "method": "composite-to-video",
  "input": {
    "compositeImage": "img_sarah_park_jacket_comp_001",
    "action": "Sarah walks forward, looking around cautiously",
    "cameraMovement": "slow dolly forward"
  },
  "references": {
    "character": "ref_sarah_360_001",
    "location": "ref_park_001",
    "clothing": ["ref_orange_jacket_001"]
  },
  "parameters": {
    "duration": 7,
    "fps": 24,
    "model": "nano_banana"
  }
}
```

---

## 3. Scene Assembly

Multiple 7-second clips are combined to create complete scenes.

### Assembly Process

```
1. Generate all clips for a scene (each ≤ 7s)
2. Arrange clips in sequence
3. Add transitions between clips
4. Integrate audio:
   - Dialogue
   - Music
   - Sound effects
5. Apply color grading
6. Render final scene
```

### Example: 30-Second Scene

```typescript
interface SceneAssembly {
  sceneId: string;
  clips: Array<{
    clipId: string;
    duration: 7;                 // seconds
    sequence: number;            // 1, 2, 3, 4...
    transition?: string;         // e.g., "cut", "fade"
  }>;
  audio: {
    dialogue?: string[];         // Audio file IDs
    music?: string;
    soundEffects?: string[];
  };
  postProcessing: {
    colorGrade?: string;
    visualEffects?: string[];
  };
}
```

**For 30-second scene**:
- Clip 1: 0-7s (7 seconds)
- Clip 2: 7-14s (7 seconds)
- Clip 3: 14-21s (7 seconds)
- Clip 4: 21-28s (7 seconds)
- Clip 5: 28-30s (2 seconds)

Total: 5 clips

---

## 4. Video Generation API

### Generate Video Endpoint

```
POST /api/v1/projects/{projectId}/videos/generate

Request:
{
  "sceneId": "scene_005",
  "method": "composite-to-video",
  "input": { /* Method-specific input */ },
  "parameters": { /* Generation parameters */ }
}

Response:
{
  "jobId": "job_video_001",
  "status": "queued",
  "estimatedTime": 120  // seconds
}
```

### Check Video Status

```
GET /api/v1/jobs/{jobId}

Response:
{
  "jobId": "job_video_001",
  "type": "video_generation",
  "status": "processing",
  "progress": 0.45,
  "estimatedTimeRemaining": 60,
  "result": null  // Will contain video URL when complete
}
```

### Video Complete

```
GET /api/v1/jobs/job_video_001

Response:
{
  "jobId": "job_video_001",
  "status": "complete",
  "result": {
    "videoId": "video_001",
    "mediaId": "media_950",
    "url": "https://cdn.aladdin.com/videos/scene_005_clip_1.mp4",
    "duration": 7,
    "qualityRating": 0.88,
    "consistencyScore": 0.85
  },
  "completedAt": "2025-01-28T10:15:00Z"
}
```

---

## 5. Quality Verification for Videos

### Automated Checks

```typescript
interface VideoQualityCheck {
  // Technical Quality
  resolution: {
    target: string;
    actual: string;
    passed: boolean;
  };
  duration: {
    target: number;
    actual: number;
    passed: boolean;             // Must be ≤ 7 seconds
  };
  fps: {
    target: number;
    actual: number;
    passed: boolean;
  };
  
  // Visual Consistency
  characterConsistency?: {
    score: number;               // 0-1
    issues: string[];
  };
  locationConsistency?: {
    score: number;
    issues: string[];
  };
  
  // Content Quality
  overallQuality: number;        // 0-1
  motionQuality: number;         // How natural is the motion
  visualClarity: number;         // Image sharpness/clarity
  
  // Decision
  passed: boolean;               // Overall quality >= threshold
  issues: string[];
  suggestions: string[];
}
```

---

## 6. External Service Integration

### 6.1 FAL.ai Configuration

All image and video generation uses **FAL.ai** with model configuration in environment variables:

**Environment Variables:**
```bash
# Image Generation Models
FAL_AI_TEXT_TO_IMAGE=fal-ai/flux-pro/v1.1
FAL_AI_IMAGE_TO_IMAGE=fal-ai/flux-pro/v1.1-canny
FAL_AI_IMAGES_TO_IMAGE=fal-ai/pulid-flux  # Composite generation

# Video Generation Models
FAL_AI_TEXT_TO_VIDEO=fal-ai/minimax-video
FAL_AI_IMAGE_TO_VIDEO=fal-ai/kling-video/v1/standard/image-to-video
FAL_AI_FIRST_LAST_TO_VIDEO=fal-ai/runway-gen3/turbo/image-to-video
FAL_AI_VIDEO_TO_VIDEO=fal-ai/luma-video-to-video

# FAL.ai API Key
FAL_AI_API_KEY=your_fal_api_key_here
```

**Usage Pattern:**
```typescript
import * as fal from '@fal-ai/serverless-client';

fal.config({
  credentials: process.env.FAL_AI_API_KEY
});

// Generate image
const result = await fal.subscribe(process.env.FAL_AI_TEXT_TO_IMAGE, {
  input: {
    prompt: "Cyberpunk detective character",
    image_size: "landscape_16_9"
  }
});

// Generate video
const videoResult = await fal.subscribe(process.env.FAL_AI_IMAGE_TO_VIDEO, {
  input: {
    image_url: imageUrl,
    prompt: "Character turns head slowly"
  }
});
```

### 6.2 ElevenLabs Voice Integration

**Character Voice Assignment:**

```typescript
// 1. Design voice via ElevenLabs API
import { ElevenLabsClient } from 'elevenlabs';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

// 2. Create or select voice
const voice = await elevenlabs.voices.add({
  name: "Sarah Chen Voice",
  description: "Confident, street-smart female detective",
  files: [/* voice samples if custom */]
});

// 3. Store voice ID in character profile
await updateCharacter({
  characterId: "char_001",
  content: {
    voice: {
      voiceModelId: voice.voice_id,  // Store ElevenLabs voice ID
      provider: "elevenlabs",
      description: "Confident, street-smart"
    }
  }
});

// 4. Generate dialogue audio
const audio = await elevenlabs.generate({
  voice: voice.voice_id,
  text: "I've been tracking this case for weeks.",
  model_id: "eleven_monolingual_v1"
});
```

**Environment Variables:**
```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

**Character Voice Storage:**
```typescript
// In character document
{
  name: "Sarah Chen",
  content: {
    voice: {
      provider: "elevenlabs",
      voiceModelId: "voice_xyz123",  // ElevenLabs voice ID
      description: "Mid-range, confident tone",
      accent: "American",
      sampleAudioUrl: "https://cdn.../sample.mp3"
    }
  }
}
```

---

## 7. Storage Structure

### Video Documents (Open MongoDB)

```typescript
// Collection: project_{id}_videos
{
  _id: "video_001",
  name: "Scene 5 - Sarah in Park",
  projectId: "proj_abc123",
  
  content: {
    // Generation Info
    generationMethod: "composite-to-video",
    sourceImages: ["img_comp_001"],
    sceneId: "scene_005",
    
    // Media Reference
    mediaId: "media_950",
    url: "https://cdn.aladdin.com/...",
    
    // Technical
    duration: 7,
    fps: 24,
    resolution: "1920x1080",
    
    // Quality
    qualityRating: 0.88,
    consistencyScore: 0.85,
    
    // Status
    renderStatus: "complete"
  },
  
  brainValidated: true,
  userApproved: false,
  approvalStatus: "pending"
}
```

---

**Status**: Video Generation Pipeline Complete ✓  
**Next**: Development Phases (Section 6)