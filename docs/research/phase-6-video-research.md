# Phase 6: Video Generation Integration - Comprehensive Research

**Research Date:** October 1, 2025
**Researcher:** Hive Mind Swarm (swarm-1759247953229-friw6kswf)
**Task ID:** task-1759284278453-qcaht9q61

## Executive Summary

This document provides comprehensive research on video generation capabilities for Phase 6 of the Aladdin project. The research covers FAL.ai video generation models, ElevenLabs voice synthesis, video editing/assembly tools, and quality verification strategies.

**Key Findings:**
- FAL.ai provides 600+ production-ready models with 4x faster inference
- Google Veo 3 and Kling 2.5 are the most advanced models in 2025
- ElevenLabs Node.js SDK supports 29+ languages with streaming capabilities
- FFmpeg via fluent-ffmpeg is the primary video assembly solution
- Character consistency remains challenging but solvable with proper techniques

---

## 1. FAL.ai Video Generation Models

### 1.1 Platform Overview

**FAL.ai** is a comprehensive generative AI API platform hosting 600+ production-ready image, video, audio, and 3D models with 4x faster inference than competitors.

**Key Features:**
- Queue-based processing for long-running operations
- Webhook support for async notifications
- Built-in file storage for input/output assets
- TypeScript-first SDK with full type definitions
- Pay-per-use pricing model

### 1.2 Available Video Generation Models (2025)

#### 1.2.1 Google Veo 3 (Text-to-Video + Audio)
**Model ID:** `fal-ai/veo3`

**Capabilities:**
- Text-to-video generation with sound
- 1080p resolution
- Up to 8-second clips
- Commercial use allowed
- Most advanced AI video model in 2025

**Input Parameters:**
```typescript
{
  prompt: string;              // Text description of desired video
  duration?: number;           // Video duration (max 8 seconds)
  aspect_ratio?: string;       // e.g., "16:9", "9:16", "1:1"
  negative_prompt?: string;    // What to avoid
}
```

**Pricing:** Contact sales (competitive API pricing)

**Use Case:** Best for high-quality text-to-video with integrated audio

---

#### 1.2.2 Google Veo 2 (Text-to-Video & Image-to-Video)
**Model ID:** `fal-ai/veo2` (text-to-video), `fal-ai/veo2/image-to-video`

**Capabilities:**
- Realistic motion and high-quality output
- Extensive camera controls
- Up to 8-second clips
- Text-to-video and image-to-video modes

**Input Parameters (Image-to-Video):**
```typescript
{
  image_url: string;           // Source image URL
  prompt: string;              // Motion description
  duration?: number;           // Max 8 seconds
  camera_motion?: string;      // "pan", "zoom", "orbit", etc.
  motion_strength?: number;    // 0-1
}
```

**Pricing:** Contact sales

**Use Case:** High-quality video with precise camera control

---

#### 1.2.3 MiniMax Hailuo 02 (Image-to-Video)
**Model ID:** `fal-ai/minimax/hailuo-02/standard/image-to-video`

**Capabilities:**
- Best balance of quality and speed (2025 benchmark)
- Super-fast rendering times
- 512P and 768P resolutions
- 6 or 10-second duration (10s not available for 1080p)

**Input Parameters:**
```typescript
{
  image_url: string;           // Required: source image
  prompt: string;              // Required: motion description
  duration?: 6 | 10;           // Default: 6 seconds
  resolution?: "512P" | "768P"; // Default: 768P
  prompt_optimizer?: boolean;   // Default: true
}
```

**Output:**
- MP4 video @ 25 fps
- Processing time: ~4 minutes
- Supported formats: JPG, JPEG, PNG, WebP, GIF, AVIF
- Min image size: 300px (shorter side)
- Max file size: 20MB
- Aspect ratio: 2:5 to 5:2

**Pricing:**
- **768P:** $0.045/second → 6s video = $0.27
- **512P:** $0.017/second → 6s video = $0.10

**Code Example:**
```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/minimax/hailuo-02/standard/image-to-video", {
  input: {
    image_url: "https://storage.fal.ai/your-image.png",
    prompt: "The camera slowly pans right as the character turns their head",
    duration: 6,
    resolution: "768P"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      console.log(`Progress: ${update.logs.map(l => l.message).join('\n')}`);
    }
  }
});

console.log(result.data.video.url); // Output video URL
```

**Use Case:** **RECOMMENDED** for Phase 6 - Best quality/cost/speed balance

---

#### 1.2.4 Kling 2.5 (Text-to-Video & Image-to-Video)
**Model ID:** `fal-ai/kling-video` (various versions)

**Capabilities:**
- Exclusive to FAL.ai in 2025
- Enhanced text-to-video and image-to-video
- High-quality cinematic output

**Input Parameters:**
```typescript
{
  prompt: string;
  image_url?: string;          // Optional for image-to-video
  duration?: number;
  aspect_ratio?: string;
}
```

**Pricing:** Pay-per-use (check fal.ai/pricing)

**Use Case:** Premium cinematic video generation

---

#### 1.2.5 Luma Dream Machine v1.5 (Image-to-Video)
**Model ID:** `fal-ai/luma-video` or similar

**Capabilities:**
- Ultra-fast rendering (under 10 seconds)
- Fastest among major models
- Good quality for quick iterations

**Pricing:** TBD (check fal.ai/pricing)

**Use Case:** Rapid prototyping and iteration

---

#### 1.2.6 Runway Gen-3 (Video-to-Video)
**Model ID:** `fal-ai/runway-gen3`

**Capabilities:**
- Video-to-video transformation
- Style transfer
- Motion editing

**Use Case:** Advanced video transformation and editing

---

#### 1.2.7 Hunyuan Video (Text-to-Video)
**Model ID:** `fal-ai/hunyuan-video`

**Capabilities:**
- Open-source model by Tencent
- Text-to-video generation

**Pricing:** $0.40 per video

**Use Case:** Cost-effective text-to-video for budget-conscious projects

---

#### 1.2.8 Framepack (Image-to-Video)
**Model ID:** `fal-ai/framepack`

**Capabilities:**
- Autoregressive video generation
- High-quality output

**Pricing:** $0.0333/second

**Use Case:** Alternative image-to-video option

---

### 1.3 Model Comparison Table

| Model | Type | Max Duration | Resolution | Speed | Quality | Pricing | Best For |
|-------|------|--------------|------------|-------|---------|---------|----------|
| **MiniMax Hailuo 02** ⭐ | I2V | 10s | 768P | ⚡⚡⚡ Fast | ⭐⭐⭐⭐ | $0.045/s (768P) | **Phase 6 Primary** |
| Google Veo 3 | T2V+Audio | 8s | 1080P | ⚡⚡ Medium | ⭐⭐⭐⭐⭐ | Contact Sales | High-end production |
| Google Veo 2 | T2V, I2V | 8s | 1080P | ⚡⚡ Medium | ⭐⭐⭐⭐⭐ | Contact Sales | Camera control |
| Kling 2.5 | T2V, I2V | Varies | High | ⚡⚡ Medium | ⭐⭐⭐⭐ | Pay-per-use | Cinematic quality |
| Luma Dream v1.5 | I2V | Varies | High | ⚡⚡⚡⚡ Ultra Fast | ⭐⭐⭐ | TBD | Rapid iteration |
| Runway Gen-3 | V2V | Varies | High | ⚡⚡ Medium | ⭐⭐⭐⭐ | Pay-per-use | Transformation |
| Hunyuan Video | T2V | Varies | Medium | ⚡⚡ Medium | ⭐⭐⭐ | $0.40/video | Budget-friendly |
| Framepack | I2V | Varies | High | ⚡⚡ Medium | ⭐⭐⭐⭐ | $0.033/s | Alternative I2V |

**⭐ RECOMMENDATION:** Use **MiniMax Hailuo 02** as the primary model for Phase 6 due to:
- Excellent quality/cost balance
- Fast processing (~4 min for 6s video)
- Predictable pricing ($0.27 per 6s clip @ 768P)
- Reliable performance

---

### 1.4 FAL.ai Node.js SDK Integration

#### 1.4.1 Installation

```bash
npm install @fal-ai/client
# or
yarn add @fal-ai/client
```

#### 1.4.2 Authentication

```javascript
import { fal } from "@fal-ai/client";

// Method 1: Environment variable (recommended)
// Set FAL_KEY in .env file
process.env.FAL_KEY = "your-api-key";

// Method 2: Direct configuration
fal.config({
  credentials: "your-api-key"
});
```

#### 1.4.3 Request Patterns

**Pattern 1: Subscribe (Real-time Updates)**
```javascript
const result = await fal.subscribe("fal-ai/minimax/hailuo-02/standard/image-to-video", {
  input: {
    image_url: imageUrl,
    prompt: motionPrompt,
    duration: 6,
    resolution: "768P"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map(log => log.message).forEach(console.log);
    }
  }
});

console.log(result.data.video.url);
```

**Pattern 2: Queue (Async Processing)**
```javascript
// Step 1: Submit to queue
const { request_id } = await fal.queue.submit("fal-ai/minimax/hailuo-02/standard/image-to-video", {
  input: {
    image_url: imageUrl,
    prompt: motionPrompt,
    duration: 6
  },
  webhookUrl: "https://your-app.com/webhook/video-complete"
});

// Step 2: Poll for status (if no webhook)
const status = await fal.queue.status("fal-ai/minimax/hailuo-02/standard/image-to-video", {
  requestId: request_id,
  logs: true
});

// Step 3: Get result when complete
if (status.status === "COMPLETED") {
  const result = await fal.queue.result("fal-ai/minimax/hailuo-02/standard/image-to-video", {
    requestId: request_id
  });
  console.log(result.video.url);
}
```

#### 1.4.4 Error Handling

```javascript
try {
  const result = await fal.subscribe("fal-ai/minimax/hailuo-02/standard/image-to-video", {
    input: { /* ... */ }
  });
} catch (error) {
  if (error.status === 400) {
    console.error("Invalid input:", error.body);
  } else if (error.status === 429) {
    console.error("Rate limit exceeded");
  } else if (error.status === 500) {
    console.error("Server error:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

#### 1.4.5 File Upload

```javascript
// Upload image to FAL storage
const imageUrl = await fal.storage.upload(imageBuffer);

// Use in video generation
const result = await fal.subscribe("fal-ai/minimax/hailuo-02/standard/image-to-video", {
  input: {
    image_url: imageUrl,
    prompt: "Camera pans slowly to the right"
  }
});
```

---

## 2. Video Generation Methods

### 2.1 Method 1: Text-to-Video

**Description:** Generate video directly from text descriptions without any visual input.

**Best Models:**
- Google Veo 3 (with audio)
- Google Veo 2
- Hunyuan Video

**Implementation:**
```javascript
async function generateTextToVideo(prompt, duration = 8) {
  const result = await fal.subscribe("fal-ai/veo3", {
    input: {
      prompt: prompt,
      duration: duration,
      aspect_ratio: "16:9",
      negative_prompt: "blurry, low quality, distorted"
    }
  });

  return {
    videoUrl: result.data.video.url,
    audioUrl: result.data.audio?.url, // Veo 3 includes audio
    duration: result.data.video.duration
  };
}
```

**Use Cases:**
- Establishing shots without existing visual assets
- Abstract concepts or scenes
- Quick prototyping

**Limitations:**
- Less control over specific visual details
- Character consistency challenges
- May require multiple iterations

---

### 2.2 Method 2: Image-to-Video

**Description:** Animate a single image by describing the desired motion.

**Best Models:**
- **MiniMax Hailuo 02** (recommended)
- Google Veo 2
- Luma Dream Machine v1.5

**Implementation:**
```javascript
async function generateImageToVideo(imageUrl, motionPrompt, duration = 6) {
  const result = await fal.subscribe("fal-ai/minimax/hailuo-02/standard/image-to-video", {
    input: {
      image_url: imageUrl,
      prompt: motionPrompt,
      duration: duration,
      resolution: "768P",
      prompt_optimizer: true
    },
    logs: true,
    onQueueUpdate: (update) => {
      console.log(`Status: ${update.status}`);
    }
  });

  return {
    videoUrl: result.data.video.url,
    width: result.data.video.width,
    height: result.data.video.height,
    duration: result.data.video.duration
  };
}
```

**Motion Prompt Best Practices:**
```javascript
const motionPrompts = {
  subtle: "The camera slowly pans right while maintaining focus on the subject",
  dynamic: "The character turns their head and smiles as the wind blows their hair",
  camera: "Slow dolly zoom in on the subject's face, shallow depth of field",
  environmental: "Leaves rustle in the wind, sunlight flickers through trees"
};
```

**Use Cases:**
- Animating composite shots from Phase 5
- Creating establishing shots from static renders
- Adding life to character portraits

**Advantages:**
- Better control over visual consistency
- Uses existing art direction
- More predictable results

---

### 2.3 Method 3: First-Last Frame (Keyframe Animation)

**Description:** Define start and end keyframes, AI generates interpolation.

**Best Implementation:** Use image-to-video iteratively with motion prompts

**Pseudo-Implementation:**
```javascript
async function generateKeyframeVideo(startImageUrl, endImageUrl, duration = 6) {
  // Step 1: Generate first half (start to middle)
  const firstHalf = await generateImageToVideo(
    startImageUrl,
    "Smooth transition towards the target pose",
    duration / 2
  );

  // Step 2: Generate second half (middle to end)
  const secondHalf = await generateImageToVideo(
    endImageUrl,
    "Continue smooth transition from previous motion",
    duration / 2
  );

  // Step 3: Blend/concatenate videos
  return await blendVideos(firstHalf.videoUrl, secondHalf.videoUrl);
}
```

**Challenges:**
- Not directly supported by most models in 2025
- Requires manual stitching and blending
- Motion coherence across segments

**Workaround:**
Use prompt chaining with image-to-video:
```javascript
const motionChain = [
  { image: frame1, prompt: "Begin turning head to the right, subtle smile" },
  { image: frame2, prompt: "Continue turning, smile widens, eyes sparkle" },
  { image: frame3, prompt: "Complete the turn, full smile, confident expression" }
];
```

---

### 2.4 Method 4: Composite-to-Video (Phase 5 Integration)

**Description:** Animate final composite shots from Phase 5's multi-layer compositing.

**Workflow:**
```
Phase 5 Composite (PNG)
  ↓
Upload to FAL Storage
  ↓
Generate Video with Motion Prompt
  ↓
Download & Store Video Clip
```

**Implementation:**
```javascript
async function animateComposite(compositeImagePath, sceneContext) {
  // Step 1: Upload composite image
  const imageBuffer = await fs.readFile(compositeImagePath);
  const imageUrl = await fal.storage.upload(imageBuffer);

  // Step 2: Generate contextual motion prompt
  const motionPrompt = generateMotionPrompt(sceneContext);

  // Step 3: Generate video
  const video = await generateImageToVideo(imageUrl, motionPrompt, 6);

  // Step 4: Download and store
  const videoPath = await downloadVideo(video.videoUrl);

  return {
    videoPath,
    metadata: {
      sceneId: sceneContext.sceneId,
      duration: video.duration,
      resolution: { width: video.width, height: video.height }
    }
  };
}

function generateMotionPrompt(sceneContext) {
  const { shotType, emotion, action, environment } = sceneContext;

  const prompts = {
    "establishing-shot": `Slow cinematic pan across the ${environment}, revealing the scene`,
    "close-up": `Subtle facial expression showing ${emotion}, slight head movement`,
    "medium-shot": `${action} with natural body language and ${emotion} expression`,
    "over-shoulder": `Maintain focus on subject, slight depth-of-field shift`
  };

  return prompts[shotType] || "Cinematic camera movement with natural motion";
}
```

**Best Practices:**
- Maintain consistent lighting and color grading from Phase 5
- Use scene context to generate appropriate motion prompts
- Generate multiple takes for critical scenes
- Verify character consistency across shots

---

## 3. Scene Assembly Architecture

### 3.1 Overview

**Goal:** Combine multiple 7-second clips into 30+ second scenes with transitions, dialogue, and sound effects.

**Technology Stack:**
- **FFmpeg:** Core video processing engine
- **fluent-ffmpeg:** Node.js wrapper for FFmpeg
- **@elevenlabs/elevenlabs-js:** Voice synthesis
- **@fal-ai/client:** Video generation

### 3.2 FFmpeg & fluent-ffmpeg

#### 3.2.1 Installation

```bash
# Install FFmpeg (system dependency)
# Ubuntu/Debian:
sudo apt-get install ffmpeg

# macOS:
brew install ffmpeg

# Windows:
# Download from https://ffmpeg.org/download.html

# Install Node.js wrapper
npm install fluent-ffmpeg
npm install ffmpeg-static # Bundles FFmpeg binary
```

#### 3.2.2 Basic Video Concatenation

```javascript
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

async function concatenateVideos(videoPaths, outputPath, transition = 'cut') {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();

    // Add all input videos
    videoPaths.forEach(videoPath => {
      command.input(videoPath);
    });

    if (transition === 'cut') {
      // Simple concatenation (no transition effect)
      command
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .mergeToFile(outputPath, path.dirname(outputPath));
    } else {
      // Complex transitions require filter_complex
      const filterComplex = generateTransitionFilter(videoPaths.length, transition);
      command
        .complexFilter(filterComplex)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .save(outputPath);
    }
  });
}
```

#### 3.2.3 Transition Types

**Cut (No Transition):**
```javascript
// Simplest - just concatenate
command.mergeToFile(outputPath, tempDir);
```

**Fade Transition:**
```javascript
function generateFadeFilter(numVideos, fadeDuration = 1) {
  // Example for 3 videos:
  // [0:v]fade=t=out:st=6:d=1[v0];
  // [1:v]fade=t=in:st=0:d=1,fade=t=out:st=6:d=1[v1];
  // [2:v]fade=t=in:st=0:d=1[v2];
  // [v0][v1]overlay[tmp];[tmp][v2]overlay[out]

  const filters = [];
  for (let i = 0; i < numVideos; i++) {
    let filter = `[${i}:v]`;
    if (i > 0) filter += `fade=t=in:st=0:d=${fadeDuration},`;
    if (i < numVideos - 1) filter += `fade=t=out:st=6:d=${fadeDuration}`;
    filters.push(`${filter}[v${i}]`);
  }

  return filters.join(';');
}
```

**Crossfade (Dissolve) Transition:**
```javascript
function generateCrossfadeFilter(numVideos, duration = 1) {
  // More complex - overlaps videos with alpha blending
  const filters = [];
  let lastLabel = `[0:v]`;

  for (let i = 1; i < numVideos; i++) {
    const offset = (i * 7) - duration; // Overlap by duration
    filters.push(
      `${lastLabel}[${i}:v]xfade=transition=fade:duration=${duration}:offset=${offset}[v${i}]`
    );
    lastLabel = `[v${i}]`;
  }

  return filters.join(';');
}
```

**Slide Transition:**
```javascript
function generateSlideFilter(numVideos, direction = 'left') {
  // Slide in from left/right/top/bottom
  const transitions = {
    left: 'slideleft',
    right: 'slideright',
    up: 'slideup',
    down: 'slidedown'
  };

  return `xfade=transition=${transitions[direction]}:duration=1:offset=6`;
}
```

#### 3.2.4 Audio Synchronization

**Add Dialogue Track:**
```javascript
async function addDialogueToVideo(videoPath, audioPath, outputPath, startTime = 0) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .complexFilter([
        `[1:a]adelay=${startTime * 1000}|${startTime * 1000}[delayed]`,
        `[0:a][delayed]amix=inputs=2:duration=first[aout]`
      ])
      .outputOptions('-map 0:v')
      .outputOptions('-map [aout]')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}
```

**Mix Multiple Audio Tracks (Dialogue + Music + SFX):**
```javascript
async function mixAudioTracks(videoPath, audioTracks, outputPath) {
  // audioTracks = [
  //   { path: 'dialogue.mp3', volume: 1.0, delay: 0 },
  //   { path: 'music.mp3', volume: 0.3, delay: 0 },
  //   { path: 'sfx.mp3', volume: 0.8, delay: 2.5 }
  // ]

  return new Promise((resolve, reject) => {
    const command = ffmpeg().input(videoPath);

    // Add all audio inputs
    audioTracks.forEach(track => {
      command.input(track.path);
    });

    // Build filter complex
    const filters = audioTracks.map((track, i) => {
      const inputIdx = i + 1; // +1 because 0 is video
      let filter = `[${inputIdx}:a]`;

      if (track.delay > 0) {
        filter += `adelay=${track.delay * 1000}|${track.delay * 1000},`;
      }

      filter += `volume=${track.volume}[a${i}]`;
      return filter;
    });

    // Mix all audio tracks
    const audioLabels = audioTracks.map((_, i) => `[a${i}]`).join('');
    filters.push(`${audioLabels}amix=inputs=${audioTracks.length}:duration=first[aout]`);

    command
      .complexFilter(filters.join(';'))
      .outputOptions('-map 0:v')
      .outputOptions('-map [aout]')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}
```

#### 3.2.5 Complete Scene Assembly Pipeline

```javascript
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';

class SceneAssembler {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'scene-assembly');
  }

  async assembleScene(sceneData) {
    // sceneData = {
    //   sceneId: "scene-123",
    //   clips: [
    //     { videoPath: "shot1.mp4", duration: 7 },
    //     { videoPath: "shot2.mp4", duration: 7 },
    //     { videoPath: "shot3.mp4", duration: 7 }
    //   ],
    //   dialogue: [
    //     { text: "Hello world", voiceId: "voice-123", startTime: 2 },
    //     { text: "How are you?", voiceId: "voice-456", startTime: 10 }
    //   ],
    //   music: { path: "background.mp3", volume: 0.3 },
    //   sfx: [
    //     { path: "door.mp3", startTime: 5, volume: 0.8 }
    //   ],
    //   transition: "fade"
    // }

    await fs.mkdir(this.tempDir, { recursive: true });

    try {
      // Step 1: Generate all dialogue audio
      const dialogueAudio = await this.generateDialogue(sceneData.dialogue);

      // Step 2: Concatenate video clips with transitions
      const concatenatedVideo = path.join(this.tempDir, `${sceneData.sceneId}-concat.mp4`);
      await this.concatenateWithTransitions(sceneData.clips, concatenatedVideo, sceneData.transition);

      // Step 3: Mix all audio tracks
      const audioTracks = [
        ...dialogueAudio,
        { path: sceneData.music.path, volume: sceneData.music.volume, delay: 0 },
        ...sceneData.sfx.map(sfx => ({
          path: sfx.path,
          volume: sfx.volume,
          delay: sfx.startTime
        }))
      ];

      const finalVideo = path.join(process.cwd(), 'output', `${sceneData.sceneId}-final.mp4`);
      await this.mixAudioTracks(concatenatedVideo, audioTracks, finalVideo);

      // Step 4: Cleanup temp files
      await this.cleanup();

      return {
        success: true,
        videoPath: finalVideo,
        duration: sceneData.clips.reduce((sum, clip) => sum + clip.duration, 0)
      };

    } catch (error) {
      console.error('Scene assembly failed:', error);
      throw error;
    }
  }

  async generateDialogue(dialogueItems) {
    // See Section 4 for ElevenLabs implementation
    return []; // Placeholder
  }

  async concatenateWithTransitions(clips, outputPath, transition) {
    // Implementation from 3.2.2 and 3.2.3
  }

  async mixAudioTracks(videoPath, audioTracks, outputPath) {
    // Implementation from 3.2.4
  }

  async cleanup() {
    await fs.rm(this.tempDir, { recursive: true, force: true });
  }
}
```

### 3.3 Alternative: Cloud-Based Video Assembly

**Option 1: Shotstack API** (Recommended for cloud deployment)
```javascript
// Shotstack provides cloud-based video editing API
import Shotstack from 'shotstack-sdk';

const client = Shotstack.default;
const api = new client.EditApi();

const clips = [
  new client.VideoAsset()
    .setSrc('https://storage.com/shot1.mp4')
    .setTrim(0),
  new client.VideoAsset()
    .setSrc('https://storage.com/shot2.mp4')
    .setTrim(0)
];

const tracks = [new client.Track().setClips(clips)];
const timeline = new client.Timeline().setTracks(tracks);
const output = new client.Output().setFormat('mp4').setResolution('hd');
const edit = new client.Edit().setTimeline(timeline).setOutput(output);

const render = await api.postRender(edit);
```

**Option 2: FAL.ai FFmpeg API**
```javascript
// Use FAL's hosted FFmpeg service
const result = await fal.subscribe("fal-ai/ffmpeg-api/compose", {
  input: {
    inputs: [
      { url: "https://storage.com/shot1.mp4" },
      { url: "https://storage.com/shot2.mp4" }
    ],
    operation: "concat",
    options: {
      transition: "fade",
      duration: 1
    }
  }
});
```

---

## 4. ElevenLabs Voice Integration

### 4.1 Overview

ElevenLabs provides the most advanced AI text-to-speech API with multilingual support, voice cloning, and streaming capabilities.

**Key Features:**
- 3,000+ pre-made voices
- 29-32 language support
- Real-time streaming
- Voice cloning and customization
- Ultra-low latency models

### 4.2 Installation & Setup

```bash
npm install @elevenlabs/elevenlabs-js
```

**Authentication:**
```javascript
import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});
```

### 4.3 Voice Models (2025)

| Model | Latency | Quality | Cost | Use Case |
|-------|---------|---------|------|----------|
| **Eleven Flash v2.5** | Ultra-low | High | 50% lower | Real-time, cost-sensitive |
| **Eleven Turbo v2.5** | Low | Very High | Medium | Balanced quality/speed |
| **Eleven Multilingual v2** | Medium | Highest | Higher | 29 languages, best quality |

**Note:** v1 models are deprecated (removal date: 2025-12-15). Use v2 models.

### 4.4 Basic Text-to-Speech

```javascript
async function generateDialogue(text, voiceId, modelId = "eleven_multilingual_v2") {
  const audio = await elevenlabs.textToSpeech.convert(voiceId, {
    text: text,
    model_id: modelId,
    voice_settings: {
      stability: 0.5,      // 0-1, higher = more consistent
      similarity_boost: 0.75, // 0-1, higher = closer to original voice
      style: 0.5,          // 0-1, exaggeration level
      use_speaker_boost: true
    }
  });

  // Save to file
  const buffer = await streamToBuffer(audio);
  await fs.writeFile(`dialogue-${Date.now()}.mp3`, buffer);

  return buffer;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
```

### 4.5 Voice Discovery & Selection

```javascript
// List all available voices
async function listVoices() {
  const voices = await elevenlabs.voices.getAll();

  return voices.voices.map(voice => ({
    id: voice.voice_id,
    name: voice.name,
    category: voice.category, // "generated", "cloned", "professional"
    labels: voice.labels, // age, gender, accent, etc.
    previewUrl: voice.preview_url
  }));
}

// Search for specific voice characteristics
async function findVoice(criteria) {
  const voices = await listVoices();

  return voices.filter(voice => {
    const labels = voice.labels || {};
    return (
      (!criteria.gender || labels.gender === criteria.gender) &&
      (!criteria.age || labels.age === criteria.age) &&
      (!criteria.accent || labels.accent === criteria.accent)
    );
  });
}

// Example usage
const femaleYoungAmerican = await findVoice({
  gender: "female",
  age: "young",
  accent: "american"
});
```

### 4.6 Voice Cloning (Advanced)

```javascript
// Create custom voice from audio samples
async function cloneVoice(name, audioFiles, description) {
  const voice = await elevenlabs.voices.add({
    name: name,
    files: audioFiles, // Array of audio file buffers
    description: description,
    labels: {
      accent: "american",
      age: "middle-aged",
      gender: "male"
    }
  });

  return voice.voice_id;
}

// Example: Clone character voice for consistency
const characterVoiceId = await cloneVoice(
  "Protagonist Male",
  [audioSample1, audioSample2, audioSample3],
  "Confident, warm male voice for main character"
);
```

### 4.7 Streaming for Real-time Generation

```javascript
async function generateStreamingDialogue(text, voiceId) {
  const audioStream = await elevenlabs.textToSpeech.convertAsStream(voiceId, {
    text: text,
    model_id: "eleven_flash_v2.5", // Use Flash for streaming
    optimize_streaming_latency: 3 // 0-4, higher = lower latency
  });

  // Play immediately or process chunks
  for await (const chunk of audioStream) {
    // Process chunk (e.g., send to client, save to file)
    processAudioChunk(chunk);
  }
}
```

### 4.8 Batch Dialogue Generation for Scene

```javascript
async function generateSceneDialogue(dialogueItems) {
  // dialogueItems = [
  //   { text: "Hello world", characterVoice: "voice-123", startTime: 2 },
  //   { text: "How are you?", characterVoice: "voice-456", startTime: 10 }
  // ]

  const audioFiles = [];

  for (const item of dialogueItems) {
    const audio = await elevenlabs.textToSpeech.convert(item.characterVoice, {
      text: item.text,
      model_id: "eleven_turbo_v2.5"
    });

    const buffer = await streamToBuffer(audio);
    const filename = `dialogue-${Date.now()}-${audioFiles.length}.mp3`;
    const filepath = path.join(process.cwd(), 'temp', 'audio', filename);

    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, buffer);

    audioFiles.push({
      path: filepath,
      startTime: item.startTime,
      volume: 1.0,
      text: item.text
    });
  }

  return audioFiles;
}
```

### 4.9 Pricing & Rate Limits

**Pricing (2025):**
- Free tier: 10,000 characters/month
- Starter: $5/month - 30,000 characters
- Creator: $22/month - 100,000 characters
- Pro: $99/month - 500,000 characters
- Scale: Custom pricing

**Cost Optimization:**
```javascript
// Estimate cost before generation
function estimateCost(text, tier = "creator") {
  const charCount = text.length;
  const costPerChar = {
    starter: 0.000167, // $5 / 30,000
    creator: 0.00022,  // $22 / 100,000
    pro: 0.000198      // $99 / 500,000
  };

  return charCount * costPerChar[tier];
}

// Optimize by removing unnecessary text
function optimizeDialogue(text) {
  return text
    .replace(/\s+/g, ' ') // Remove extra whitespace
    .replace(/[.!?]+/g, match => match[0]) // Remove repeated punctuation
    .trim();
}
```

**Rate Limits:**
- Free tier: 2 requests/second
- Paid tiers: Higher limits (check documentation)

---

## 5. Quality Verification Strategies

### 5.1 Automated Quality Checks

#### 5.1.1 Video Duration Verification

```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function verifyDuration(videoPath, expectedDuration, tolerance = 0.5) {
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
  );

  const actualDuration = parseFloat(stdout.trim());
  const isValid = Math.abs(actualDuration - expectedDuration) <= tolerance;

  return {
    isValid,
    actualDuration,
    expectedDuration,
    difference: Math.abs(actualDuration - expectedDuration)
  };
}
```

#### 5.1.2 Technical Quality Verification

```javascript
async function verifyTechnicalQuality(videoPath) {
  const { stdout } = await execAsync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name,bit_rate -of json "${videoPath}"`
  );

  const info = JSON.parse(stdout).streams[0];

  const checks = {
    resolution: {
      passed: info.width >= 1280 && info.height >= 720,
      value: `${info.width}x${info.height}`,
      expected: "≥1280x720"
    },
    fps: {
      passed: eval(info.r_frame_rate) >= 24,
      value: eval(info.r_frame_rate),
      expected: "≥24"
    },
    codec: {
      passed: ['h264', 'h265', 'vp9'].includes(info.codec_name),
      value: info.codec_name,
      expected: "h264/h265/vp9"
    },
    bitrate: {
      passed: parseInt(info.bit_rate) >= 1000000, // 1 Mbps
      value: `${(parseInt(info.bit_rate) / 1000000).toFixed(2)} Mbps`,
      expected: "≥1 Mbps"
    }
  };

  const allPassed = Object.values(checks).every(check => check.passed);

  return { allPassed, checks };
}
```

#### 5.1.3 Motion Quality Assessment

```javascript
// Use FFmpeg to detect motion vectors and analyze quality
async function assessMotionQuality(videoPath) {
  // Extract motion vectors
  const { stdout } = await execAsync(
    `ffmpeg -flags2 +export_mvs -i "${videoPath}" -vf codecview=mv=pf+bf+bb -f null - 2>&1 | grep "frame="`
  );

  // Analyze frame consistency
  const { stdout: frameInfo } = await execAsync(
    `ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of default=nokey=1:noprint_wrappers=1 "${videoPath}"`
  );

  const frameCount = parseInt(frameInfo.trim());
  const expectedFrames = 7 * 25; // 7 seconds @ 25 fps = 175 frames

  return {
    frameCount,
    expectedFrames,
    frameConsistency: Math.abs(frameCount - expectedFrames) <= 5,
    motionDetected: stdout.includes('motion vector') // Simplified check
  };
}
```

### 5.2 Character Consistency Verification

#### 5.2.1 Perceptual Hash Comparison

```javascript
import { createCanvas, loadImage } from 'canvas';
import pixelmatch from 'pixelmatch';

// Extract key frames from video
async function extractKeyframes(videoPath, timestamps) {
  const frames = [];

  for (const timestamp of timestamps) {
    const outputPath = path.join(this.tempDir, `frame-${timestamp}.png`);
    await execAsync(
      `ffmpeg -ss ${timestamp} -i "${videoPath}" -frames:v 1 "${outputPath}"`
    );
    frames.push(outputPath);
  }

  return frames;
}

// Compare character consistency across frames
async function verifyCharacterConsistency(videoPath, referenceImagePath) {
  // Extract frames at 0s, 3s, 6s
  const frameTimestamps = [0, 3, 6];
  const frames = await extractKeyframes(videoPath, frameTimestamps);

  // Load reference image
  const referenceImage = await loadImage(referenceImagePath);
  const refCanvas = createCanvas(referenceImage.width, referenceImage.height);
  const refCtx = refCanvas.getContext('2d');
  refCtx.drawImage(referenceImage, 0, 0);
  const refData = refCtx.getImageData(0, 0, referenceImage.width, referenceImage.height);

  // Compare each frame to reference
  const consistencyScores = [];

  for (const framePath of frames) {
    const frameImage = await loadImage(framePath);
    const frameCanvas = createCanvas(frameImage.width, frameImage.height);
    const frameCtx = frameCanvas.getContext('2d');
    frameCtx.drawImage(frameImage, 0, 0);
    const frameData = frameCtx.getImageData(0, 0, frameImage.width, frameImage.height);

    // Calculate pixel difference
    const diff = pixelmatch(
      refData.data,
      frameData.data,
      null,
      referenceImage.width,
      referenceImage.height,
      { threshold: 0.1 }
    );

    const totalPixels = referenceImage.width * referenceImage.height;
    const similarity = 1 - (diff / totalPixels);

    consistencyScores.push(similarity);
  }

  const avgConsistency = consistencyScores.reduce((a, b) => a + b) / consistencyScores.length;

  return {
    passed: avgConsistency >= 0.7, // 70% similarity threshold
    avgConsistency,
    frameScores: consistencyScores
  };
}
```

#### 5.2.2 AI-Powered Quality Assessment

```javascript
// Use external API or model for advanced quality checks
async function aiQualityAssessment(videoPath) {
  // Option 1: Use FAL.ai's quality assessment model (if available)
  // Option 2: Use custom model trained on video quality data
  // Option 3: Use commercial API like AWS Rekognition

  // Placeholder implementation
  return {
    aestheticScore: 0.85,
    technicalScore: 0.92,
    characterConsistency: 0.78,
    motionSmoothness: 0.88,
    overallQuality: 0.86,
    issues: [
      { type: "minor_blur", timestamp: 3.5, severity: "low" }
    ]
  };
}
```

### 5.3 Comprehensive Quality Verification Pipeline

```javascript
class VideoQualityVerifier {
  async verifyVideo(videoPath, criteria) {
    const results = {
      videoPath,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // 1. Duration check
    if (criteria.duration) {
      results.checks.duration = await verifyDuration(
        videoPath,
        criteria.duration,
        criteria.durationTolerance || 0.5
      );
    }

    // 2. Technical quality
    results.checks.technical = await verifyTechnicalQuality(videoPath);

    // 3. Motion quality
    results.checks.motion = await assessMotionQuality(videoPath);

    // 4. Character consistency (if reference provided)
    if (criteria.referenceImage) {
      results.checks.characterConsistency = await verifyCharacterConsistency(
        videoPath,
        criteria.referenceImage
      );
    }

    // 5. AI quality assessment
    if (criteria.enableAiAssessment) {
      results.checks.aiQuality = await aiQualityAssessment(videoPath);
    }

    // Calculate overall pass/fail
    const allChecks = Object.values(results.checks);
    results.passed = allChecks.every(check =>
      check.passed || check.allPassed || (check.overallQuality && check.overallQuality >= 0.7)
    );

    // Generate report
    results.summary = this.generateSummary(results);

    return results;
  }

  generateSummary(results) {
    const failedChecks = [];

    for (const [checkName, checkResult] of Object.entries(results.checks)) {
      if (!checkResult.passed && !checkResult.allPassed) {
        failedChecks.push({
          check: checkName,
          reason: this.getFailureReason(checkResult)
        });
      }
    }

    return {
      overallStatus: results.passed ? "PASSED" : "FAILED",
      failedChecks,
      recommendations: this.generateRecommendations(failedChecks)
    };
  }

  getFailureReason(checkResult) {
    if (checkResult.checks) {
      return Object.entries(checkResult.checks)
        .filter(([_, check]) => !check.passed)
        .map(([name, check]) => `${name}: expected ${check.expected}, got ${check.value}`)
        .join('; ');
    }
    return JSON.stringify(checkResult);
  }

  generateRecommendations(failedChecks) {
    const recommendations = [];

    for (const failed of failedChecks) {
      switch (failed.check) {
        case 'duration':
          recommendations.push('Regenerate video with correct duration parameter');
          break;
        case 'technical':
          recommendations.push('Adjust encoding settings or use higher quality model');
          break;
        case 'motion':
          recommendations.push('Refine motion prompt for smoother animation');
          break;
        case 'characterConsistency':
          recommendations.push('Use reference image or regenerate with better prompt');
          break;
        default:
          recommendations.push(`Review ${failed.check} and regenerate if necessary`);
      }
    }

    return recommendations;
  }
}
```

---

## 6. Performance & Optimization

### 6.1 Video Generation Time Estimates

| Model | Resolution | Duration | Avg Processing Time | Cost |
|-------|------------|----------|---------------------|------|
| MiniMax Hailuo 02 | 768P | 6s | ~4 minutes | $0.27 |
| MiniMax Hailuo 02 | 512P | 6s | ~3 minutes | $0.10 |
| Google Veo 2 | 1080P | 8s | ~6-8 minutes | Contact Sales |
| Luma Dream v1.5 | High | 6s | <10 seconds | TBD |
| Hunyuan Video | Medium | Varies | ~3-5 minutes | $0.40 |

**Estimated Timeline for 30-second Scene (5 clips @ 6s each):**
- Video generation: 5 clips × 4 min = 20 minutes
- Voice synthesis: <1 minute
- Video assembly: 2-3 minutes
- **Total: ~23-24 minutes per scene**

### 6.2 Queue System for Long-Running Operations

```javascript
import Bull from 'bull';
import Redis from 'redis';

// Create job queue
const videoGenerationQueue = new Bull('video-generation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Add job to queue
async function queueVideoGeneration(sceneData) {
  const job = await videoGenerationQueue.add('generate-scene', sceneData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000 // 1 minute
    },
    timeout: 1800000 // 30 minutes
  });

  return {
    jobId: job.id,
    status: 'queued'
  };
}

// Process jobs
videoGenerationQueue.process('generate-scene', async (job) => {
  const { sceneData } = job.data;

  // Update progress
  job.progress(0);

  // Step 1: Generate videos (80% of work)
  const videos = [];
  for (let i = 0; i < sceneData.clips.length; i++) {
    const video = await generateImageToVideo(
      sceneData.clips[i].imageUrl,
      sceneData.clips[i].motionPrompt
    );
    videos.push(video);
    job.progress(Math.floor((i + 1) / sceneData.clips.length * 80));
  }

  // Step 2: Generate dialogue (10% of work)
  const dialogue = await generateSceneDialogue(sceneData.dialogue);
  job.progress(90);

  // Step 3: Assemble scene (10% of work)
  const assembler = new SceneAssembler();
  const finalVideo = await assembler.assembleScene({
    ...sceneData,
    clips: videos.map((v, i) => ({ videoPath: v.videoPath, duration: 6 })),
    dialogue
  });
  job.progress(100);

  return finalVideo;
});

// Monitor job status
async function getJobStatus(jobId) {
  const job = await videoGenerationQueue.getJob(jobId);

  if (!job) {
    return { status: 'not_found' };
  }

  const state = await job.getState();
  const progress = job.progress();

  return {
    jobId: job.id,
    status: state, // 'waiting', 'active', 'completed', 'failed'
    progress,
    result: state === 'completed' ? job.returnvalue : null,
    error: state === 'failed' ? job.failedReason : null
  };
}
```

### 6.3 Progress Tracking with Webhooks

```javascript
// FAL.ai webhook endpoint
app.post('/webhook/video-complete', async (req, res) => {
  const { request_id, status, output } = req.body;

  if (status === 'COMPLETED') {
    // Update database
    await db.videos.update(
      { falRequestId: request_id },
      {
        status: 'completed',
        videoUrl: output.video.url,
        completedAt: new Date()
      }
    );

    // Trigger next step in pipeline
    await triggerSceneAssembly(request_id);
  } else if (status === 'FAILED') {
    // Handle failure
    await db.videos.update(
      { falRequestId: request_id },
      {
        status: 'failed',
        error: output.error,
        failedAt: new Date()
      }
    );

    // Optionally retry
    await retryVideoGeneration(request_id);
  }

  res.status(200).send('OK');
});

// Express middleware for webhook signature verification
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-fal-signature'];
  const payload = JSON.stringify(req.body);

  // Verify signature with your secret
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FAL_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature === expectedSignature) {
    next();
  } else {
    res.status(401).send('Invalid signature');
  }
}
```

### 6.4 Cost Optimization Strategies

#### 6.4.1 Batch Processing

```javascript
// Generate multiple videos in parallel to maximize throughput
async function batchGenerateVideos(sceneClips, concurrency = 3) {
  const results = [];

  for (let i = 0; i < sceneClips.length; i += concurrency) {
    const batch = sceneClips.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(clip => generateImageToVideo(clip.imageUrl, clip.motionPrompt))
    );

    results.push(...batchResults);
  }

  return results;
}
```

#### 6.4.2 Resolution Optimization

```javascript
// Use lower resolution for non-critical shots
function selectOptimalResolution(shotType, importance) {
  const resolutionMap = {
    'establishing-shot': { high: '768P', medium: '768P', low: '512P' },
    'close-up': { high: '768P', medium: '768P', low: '768P' },
    'medium-shot': { high: '768P', medium: '512P', low: '512P' },
    'wide-shot': { high: '768P', medium: '512P', low: '512P' }
  };

  return resolutionMap[shotType]?.[importance] || '768P';
}

// Estimate cost savings
function estimateCostSavings(scenes) {
  let highResCost = 0;
  let optimizedCost = 0;

  for (const scene of scenes) {
    for (const shot of scene.shots) {
      const duration = shot.duration || 6;
      highResCost += duration * 0.045; // 768P

      const resolution = selectOptimalResolution(shot.type, shot.importance);
      const costPerSecond = resolution === '768P' ? 0.045 : 0.017;
      optimizedCost += duration * costPerSecond;
    }
  }

  return {
    highResCost: highResCost.toFixed(2),
    optimizedCost: optimizedCost.toFixed(2),
    savings: (highResCost - optimizedCost).toFixed(2),
    savingsPercent: (((highResCost - optimizedCost) / highResCost) * 100).toFixed(1)
  };
}
```

#### 6.4.3 Caching Strategy

```javascript
// Cache generated videos to avoid regenerating identical content
import crypto from 'crypto';

function generateCacheKey(imageUrl, prompt, duration, resolution) {
  const data = `${imageUrl}|${prompt}|${duration}|${resolution}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function getCachedOrGenerateVideo(imageUrl, prompt, duration, resolution) {
  const cacheKey = generateCacheKey(imageUrl, prompt, duration, resolution);

  // Check cache (could be Redis, S3, or database)
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log('Cache hit:', cacheKey);
    return {
      videoUrl: cached.videoUrl,
      cached: true,
      cacheAge: Date.now() - cached.timestamp
    };
  }

  // Generate new video
  console.log('Cache miss, generating:', cacheKey);
  const result = await generateImageToVideo(imageUrl, prompt, duration);

  // Store in cache (with 30-day TTL)
  await cache.set(cacheKey, {
    videoUrl: result.videoUrl,
    timestamp: Date.now()
  }, 2592000); // 30 days in seconds

  return {
    ...result,
    cached: false
  };
}
```

### 6.5 Performance Monitoring

```javascript
class VideoGenerationMetrics {
  constructor() {
    this.metrics = {
      totalVideos: 0,
      successfulVideos: 0,
      failedVideos: 0,
      totalCost: 0,
      totalDuration: 0,
      avgProcessingTime: 0,
      cacheHitRate: 0
    };
  }

  async recordVideoGeneration(result) {
    this.metrics.totalVideos++;

    if (result.success) {
      this.metrics.successfulVideos++;
      this.metrics.totalDuration += result.duration;
      this.metrics.totalCost += result.cost;

      // Update average processing time
      const currentAvg = this.metrics.avgProcessingTime;
      const n = this.metrics.successfulVideos;
      this.metrics.avgProcessingTime =
        (currentAvg * (n - 1) + result.processingTime) / n;
    } else {
      this.metrics.failedVideos++;
    }

    if (result.cached) {
      this.metrics.cacheHitRate =
        (this.metrics.cacheHitRate * (this.metrics.totalVideos - 1) + 1) /
        this.metrics.totalVideos;
    }

    // Persist metrics to database
    await this.saveMetrics();
  }

  async saveMetrics() {
    await db.metrics.upsert({
      id: 'video-generation',
      ...this.metrics,
      updatedAt: new Date()
    });
  }

  getReport() {
    return {
      ...this.metrics,
      successRate: (this.metrics.successfulVideos / this.metrics.totalVideos * 100).toFixed(2) + '%',
      avgCostPerVideo: (this.metrics.totalCost / this.metrics.successfulVideos).toFixed(2),
      estimatedMonthlyCost: this.estimateMonthlyCost()
    };
  }

  estimateMonthlyCost() {
    const avgVideosPerDay = this.metrics.totalVideos / 30; // Assume 30-day sample
    const avgCostPerVideo = this.metrics.totalCost / this.metrics.successfulVideos;
    return (avgVideosPerDay * avgCostPerVideo * 30).toFixed(2);
  }
}
```

---

## 7. Architecture Recommendations

### 7.1 Phase 6 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Phase 6: Video Generation                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Scene Manifest  │  (Input from Phase 5)
│  + Composites    │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Video Generation Service                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Queue Manager (Bull + Redis)                               ││
│  │  - Priority queue for video generation jobs                 ││
│  │  - Webhook handlers for async completion                    ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Generation Workers                                          ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     ││
│  │  │ FAL.ai Client│  │ ElevenLabs   │  │ FFmpeg       │     ││
│  │  │ (Video Gen)  │  │ (Voice Gen)  │  │ (Assembly)   │     ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘     ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Quality Verifier                                            ││
│  │  - Duration checks                                           ││
│  │  - Technical quality validation                              ││
│  │  - Character consistency verification                        ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Storage Manager                                             ││
│  │  - Video file storage (S3/Cloud Storage)                    ││
│  │  - Cache management                                          ││
│  │  - CDN integration                                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│  Final Videos    │  (Output: Assembled scenes with audio)
│  + Metadata      │
└──────────────────┘
```

### 7.2 Recommended Technology Stack

```javascript
// package.json dependencies
{
  "dependencies": {
    // Video Generation
    "@fal-ai/client": "^1.0.0",

    // Voice Synthesis
    "@elevenlabs/elevenlabs-js": "^1.0.0",

    // Video Processing
    "fluent-ffmpeg": "^2.1.3",
    "ffmpeg-static": "^5.2.0",

    // Queue Management
    "bull": "^4.12.0",
    "redis": "^4.6.0",

    // Quality Verification
    "pixelmatch": "^5.3.0",
    "canvas": "^2.11.2",

    // Utilities
    "axios": "^1.6.0",
    "dotenv": "^16.4.0"
  }
}
```

### 7.3 Project Structure

```
phase-6-video-generation/
├── src/
│   ├── services/
│   │   ├── video-generation.service.ts
│   │   ├── voice-synthesis.service.ts
│   │   ├── scene-assembly.service.ts
│   │   └── quality-verification.service.ts
│   ├── workers/
│   │   ├── video-generation.worker.ts
│   │   └── scene-assembly.worker.ts
│   ├── queue/
│   │   ├── queue-manager.ts
│   │   └── webhook-handlers.ts
│   ├── utils/
│   │   ├── ffmpeg.utils.ts
│   │   ├── cache.utils.ts
│   │   └── metrics.utils.ts
│   └── index.ts
├── config/
│   ├── fal.config.ts
│   ├── elevenlabs.config.ts
│   └── redis.config.ts
├── tests/
│   ├── integration/
│   └── unit/
├── temp/
│   ├── video/
│   ├── audio/
│   └── assembly/
└── output/
    └── scenes/
```

### 7.4 Implementation Phases

**Phase 6.1: Video Generation Core (Week 1)**
- Set up FAL.ai integration
- Implement image-to-video generation
- Create queue system for async processing
- Add webhook handlers

**Phase 6.2: Voice Integration (Week 2)**
- Integrate ElevenLabs SDK
- Implement character voice mapping
- Add batch dialogue generation
- Create voice caching system

**Phase 6.3: Scene Assembly (Week 3)**
- Set up FFmpeg pipeline
- Implement video concatenation
- Add audio mixing capabilities
- Create transition effects

**Phase 6.4: Quality & Optimization (Week 4)**
- Build quality verification system
- Add automated testing
- Implement caching strategy
- Performance optimization
- Cost monitoring

---

## 8. Cost Estimates

### 8.1 Typical Usage Scenario

**Assumptions:**
- 10-minute animated film
- 30 seconds per scene
- 20 scenes total
- 5 clips per scene @ 6 seconds each
- 100 total video clips

**Video Generation Costs (MiniMax Hailuo 02 @ 768P):**
```
100 clips × 6 seconds × $0.045/second = $27.00
```

**Voice Synthesis Costs (ElevenLabs Creator tier):**
```
Average dialogue: 500 characters per scene
20 scenes × 500 characters = 10,000 characters
Creator tier: $22/month (includes 100,000 characters)
Cost: Included in subscription
```

**Total Estimated Cost:**
```
Video Generation: $27.00
Voice Synthesis: $22.00 (monthly subscription)
Cloud Storage (S3): ~$5.00
Total: ~$54.00 for 10-minute film
```

### 8.2 Cost Optimization Options

**Option 1: Use 512P for Non-Critical Shots**
```
70 clips @ 512P: 70 × 6 × $0.017 = $7.14
30 clips @ 768P: 30 × 6 × $0.045 = $8.10
Total: $15.24 (saves $11.76, 43% reduction)
```

**Option 2: Use Caching Aggressively**
```
Assuming 20% cache hit rate:
80 clips × 6 × $0.045 = $21.60
Total: $21.60 (saves $5.40, 20% reduction)
```

**Option 3: Use Hunyuan Video for Simpler Scenes**
```
50 clips with MiniMax: 50 × 6 × $0.045 = $13.50
50 clips with Hunyuan: 50 × $0.40 = $20.00
Total: $33.50 (saves $6.50 compared to all premium)
```

---

## 9. Key Findings & Recommendations

### 9.1 Model Selection

**✅ RECOMMENDED: MiniMax Hailuo 02 (768P)**
- **Rationale:** Best balance of quality, speed, and cost
- **Cost:** $0.27 per 6-second clip
- **Processing Time:** ~4 minutes
- **Quality:** High (4/5 stars)
- **Use Case:** Primary model for 80%+ of Phase 6 clips

**Alternative: Google Veo 2/3 for Premium Scenes**
- **Use Case:** Critical hero shots, marketing materials
- **Quality:** Highest (5/5 stars)
- **Cost:** Contact sales (likely higher)

**Budget Option: Hunyuan Video**
- **Use Case:** Background shots, wide establishing shots
- **Cost:** $0.40 per video (flat rate)
- **Quality:** Good (3/5 stars)

### 9.2 Generation Methods

**Primary: Image-to-Video (Method 2)**
- Most control over visual consistency
- Leverages Phase 5 composites
- Predictable results

**Secondary: Text-to-Video (Method 1)**
- For scenes without pre-rendered composites
- Faster iteration
- Less visual control

**Avoid: First-Last Frame (Method 3)**
- Not well-supported by current models
- Requires complex workarounds
- Higher failure rate

### 9.3 Scene Assembly

**Recommended: FFmpeg via fluent-ffmpeg**
- Mature, reliable technology
- Full control over processing
- No additional API costs
- Extensive documentation

**Alternative: Cloud-based (Shotstack, FAL FFmpeg API)**
- Better for cloud deployments
- No server-side FFmpeg installation
- Higher per-operation cost

### 9.4 Voice Integration

**Recommended: ElevenLabs Eleven Turbo v2.5**
- Best balance of quality and latency
- 29 language support
- Affordable pricing ($22/month for 100k chars)

**For Real-time: Eleven Flash v2.5**
- Ultra-low latency
- 50% lower cost
- Slight quality trade-off

### 9.5 Quality Verification

**Must-Have Checks:**
1. Duration verification (±0.5s tolerance)
2. Technical quality (resolution, FPS, codec)
3. Motion smoothness

**Nice-to-Have:**
1. Character consistency (perceptual hash)
2. AI-powered quality assessment
3. Automated re-generation on failures

### 9.6 Performance Optimization

**Critical:**
- Implement queue system (Bull + Redis)
- Use webhooks for async notifications
- Cache generated videos aggressively
- Batch process where possible

**Cost Savings:**
- Use 512P for non-critical shots (43% savings)
- Implement smart caching (20% savings)
- Optimize resolution by shot importance

---

## 10. Next Steps

### 10.1 Immediate Actions

1. **Set up accounts and credentials:**
   - FAL.ai API key
   - ElevenLabs API key
   - Redis instance for queue management

2. **Install dependencies:**
   ```bash
   npm install @fal-ai/client @elevenlabs/elevenlabs-js fluent-ffmpeg bull redis
   ```

3. **Create proof-of-concept:**
   - Generate single test video with MiniMax
   - Synthesize test dialogue with ElevenLabs
   - Assemble simple 2-clip scene with FFmpeg

4. **Set up infrastructure:**
   - Queue system with Bull + Redis
   - Webhook endpoints for async processing
   - Storage solution (S3 or equivalent)

### 10.2 Development Roadmap

**Week 1: Core Video Generation**
- FAL.ai integration
- Image-to-video pipeline
- Queue system setup

**Week 2: Voice Synthesis**
- ElevenLabs integration
- Character voice mapping
- Dialogue generation pipeline

**Week 3: Scene Assembly**
- FFmpeg pipeline
- Video concatenation
- Audio mixing
- Transition effects

**Week 4: Quality & Polish**
- Quality verification system
- Caching implementation
- Performance optimization
- Cost monitoring
- Documentation

### 10.3 Testing Strategy

**Unit Tests:**
- Video generation functions
- Voice synthesis utilities
- FFmpeg operations
- Quality verification checks

**Integration Tests:**
- End-to-end scene generation
- Queue processing
- Webhook handling
- Cache behavior

**Manual QA:**
- Visual quality assessment
- Character consistency validation
- Audio synchronization verification
- Edge case handling

---

## 11. References & Resources

### 11.1 Documentation

- **FAL.ai:** https://docs.fal.ai/
- **ElevenLabs:** https://elevenlabs.io/docs
- **FFmpeg:** https://ffmpeg.org/documentation.html
- **fluent-ffmpeg:** https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
- **Bull:** https://github.com/OptimalBits/bull

### 11.2 Code Examples

- **FAL.ai Node.js SDK:** https://github.com/fal-ai/fal-js
- **ElevenLabs Node.js SDK:** https://github.com/elevenlabs/elevenlabs-js
- **Video Editing with FFmpeg:** https://creatomate.com/blog/video-rendering-with-nodejs-and-ffmpeg

### 11.3 Research Papers

- "A Survey of AI-Generated Video Evaluation" (2025)
- "Multi-Shot Character Consistency for Text-to-Video Generation" (2024)
- "Quality Prediction of AI Generated Images and Videos" (2025)

---

## Appendix A: Code Templates

### A.1 Complete Video Generation Service

```typescript
// src/services/video-generation.service.ts
import { fal } from "@fal-ai/client";

export class VideoGenerationService {
  async generateVideo(params: {
    imageUrl: string;
    prompt: string;
    duration?: number;
    resolution?: "512P" | "768P";
  }) {
    try {
      const result = await fal.subscribe(
        "fal-ai/minimax/hailuo-02/standard/image-to-video",
        {
          input: {
            image_url: params.imageUrl,
            prompt: params.prompt,
            duration: params.duration || 6,
            resolution: params.resolution || "768P",
            prompt_optimizer: true
          },
          logs: true,
          onQueueUpdate: (update) => {
            console.log(`[FAL] Status: ${update.status}`);
            if (update.status === "IN_PROGRESS") {
              update.logs.map(log => log.message).forEach(console.log);
            }
          }
        }
      );

      return {
        success: true,
        videoUrl: result.data.video.url,
        width: result.data.video.width,
        height: result.data.video.height,
        duration: result.data.video.duration,
        cost: this.calculateCost(params.duration || 6, params.resolution || "768P")
      };
    } catch (error) {
      console.error("[FAL] Video generation failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private calculateCost(duration: number, resolution: "512P" | "768P"): number {
    const costPerSecond = resolution === "768P" ? 0.045 : 0.017;
    return duration * costPerSecond;
  }
}
```

### A.2 Complete Voice Synthesis Service

```typescript
// src/services/voice-synthesis.service.ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import fs from "fs/promises";
import path from "path";

export class VoiceSynthesisService {
  private client: ElevenLabsClient;

  constructor() {
    this.client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });
  }

  async generateDialogue(params: {
    text: string;
    voiceId: string;
    modelId?: string;
    outputPath?: string;
  }) {
    try {
      const audio = await this.client.textToSpeech.convert(params.voiceId, {
        text: params.text,
        model_id: params.modelId || "eleven_turbo_v2.5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      });

      const buffer = await this.streamToBuffer(audio);

      if (params.outputPath) {
        await fs.mkdir(path.dirname(params.outputPath), { recursive: true });
        await fs.writeFile(params.outputPath, buffer);
      }

      return {
        success: true,
        audioBuffer: buffer,
        audioPath: params.outputPath,
        characterCount: params.text.length,
        cost: this.estimateCost(params.text.length)
      };
    } catch (error) {
      console.error("[ElevenLabs] Voice synthesis failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  private estimateCost(characterCount: number): number {
    // Assuming Creator tier: $22/month for 100,000 characters
    return (characterCount / 100000) * 22;
  }
}
```

---

## Document Metadata

**Version:** 1.0
**Last Updated:** October 1, 2025
**Author:** Hive Mind Swarm - Research Agent
**Status:** Complete
**Next Review:** Before Phase 6 implementation

---

**END OF RESEARCH DOCUMENT**
