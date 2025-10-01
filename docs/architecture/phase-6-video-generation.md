# Phase 6: Video Generation Architecture

**Architect**: System Architecture Designer (Hive Mind Swarm)
**Date**: 2025-10-01
**Status**: Design Complete
**Phase**: 6 - Video Generation Integration (FAL.ai Video + Scene Assembly)
**Dependencies**: Phase 5 (Image Generation with R2 Storage)

---

## Executive Summary

Phase 6 extends the visual generation capabilities with **AI-powered video generation** using FAL.ai's video models, enabling the creation of dynamic 7-second clips that are assembled into complete 30+ second scenes. This architecture integrates four video generation methods with scene assembly, audio integration via ElevenLabs, and quality verification.

### Key Innovations

1. **Four Generation Methods**: Text-to-video, image-to-video, first-last frame interpolation, composite-to-video
2. **Scene Assembly Pipeline**: Multi-clip assembly with transitions, audio sync, and color grading
3. **Reference-Based Consistency**: Uses Phase 5 master references and 360° profiles for visual coherence
4. **Job Queue Architecture**: Async video generation with progress tracking and webhooks
5. **Voice Integration**: Character dialogue via ElevenLabs text-to-speech
6. **Quality Verification**: Automated consistency checking against reference images

### Architecture Highlights

- **Maximum clip length**: 7 seconds per generation
- **Scene assembly**: 5 clips = 30-second complete scene
- **Video storage**: Cloudflare R2 with CDN delivery
- **Job processing**: Celery-Redis or BullMQ for async operations
- **Audio integration**: ElevenLabs voice synthesis with character profiles

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Request (Chat API)                      │
│              "Generate video of Sarah walking in park"           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Master Orchestrator                           │
│               (Routes to Video Department)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Video Department Head                            │
│            (Coordinates 4 video specialists)                     │
└──────┬──────────┬──────────┬──────────┬─────────────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────┐
   │Video │  │Scene │  │Quality│  │Audio     │
   │Gen   │  │Assemb│  │Verify│  │Integrator│
   │      │  │ler   │  │      │  │          │
   └──┬───┘  └──┬───┘  └──┬───┘  └──┬───────┘
      │         │         │         │
      │         │         │         │
      └─────────┴─────────┴─────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              Video Generation Service Layer                      │
│  • Method selection (4 types)                                    │
│  • FAL.ai client integration                                     │
│  • Reference image retrieval (from Phase 5)                      │
│  • Job queue management                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
                   ▼                   ▼
        ┌─────────────────┐  ┌─────────────────┐
        │   FAL.ai Video  │  │  ElevenLabs     │
        │   API           │  │  Voice API      │
        │  • minimax-video│  │  • Voice design │
        │  • kling-video  │  │  • Text-to-     │
        │  • runway-gen3  │  │    speech       │
        └─────────┬───────┘  └─────────┬───────┘
                  │                    │
                  ▼                    ▼
        ┌─────────────────────────────────────┐
        │  Scene Assembly & Audio Sync        │
        │  • FFmpeg video editing             │
        │  • Transition effects               │
        │  • Audio track integration          │
        └──────────────────┬──────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  R2 Video Storage    │
                │  • Video files       │
                │  • Audio tracks      │
                │  • CDN URLs          │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Media Collection    │
                │  (MongoDB + Neo4j)   │
                │  • Video metadata    │
                │  • Generation params │
                │  • Quality scores    │
                └──────────────────────┘
```

---

## Component Architecture

### 1. FAL.ai Video Client Layer

**Location**: `/src/lib/fal/`

#### 1.1 Extended FAL Client (`client.ts`)

```typescript
/**
 * FAL.ai Video Client Extension
 * Extends Phase 5 image client with video generation capabilities
 */

interface FalVideoRequest {
  method: 'text-to-video' | 'image-to-video' | 'first-last-frame' | 'composite-to-video'
  model: FalVideoModel
  input: VideoGenerationInput
  parameters: VideoParameters
}

type FalVideoModel =
  | 'fal-ai/minimax-video'              // Text-to-video
  | 'fal-ai/kling-video/v1/standard/image-to-video'  // Image-to-video
  | 'fal-ai/runway-gen3/turbo/image-to-video'        // First-last frame
  | 'fal-ai/luma-video-to-video'        // Video-to-video (composite)

interface VideoGenerationInput {
  // Text-to-video
  prompt?: string
  negativePrompt?: string

  // Image-to-video
  sourceImage?: string                   // Image URL or media ID
  motion?: string                        // Motion description

  // First-last frame
  firstFrame?: string                    // Starting image
  lastFrame?: string                     // Ending image
  transition?: string                    // Interpolation style

  // Composite-to-video
  compositeImage?: string                // Pre-composed image (from Phase 5)
  action?: string                        // Action description
  cameraMovement?: string

  // Reference images (for consistency)
  characterReference?: string            // Master reference ID
  locationReference?: string
}

interface VideoParameters {
  duration: number                       // Seconds (max 7)
  fps?: number                          // Default: 24
  resolution?: string                    // Default: '1920x1080'
  aspectRatio?: '16:9' | '9:16' | '1:1'
  quality?: 'draft' | 'standard' | 'high'
}

interface FalVideoResponse {
  videoUrl: string                       // Temporary FAL.ai URL
  duration: number                       // Actual duration
  fps: number
  resolution: string
  thumbnailUrl?: string
  requestId: string
  inferenceTime: number                  // Generation time (ms)
}

class FalClient {
  // Existing image methods from Phase 5...

  // New video generation methods
  async generateVideo(request: FalVideoRequest): Promise<FalVideoResponse>

  async generateVideoBatch(requests: FalVideoRequest[]): Promise<FalVideoResponse[]>

  // Webhook support for long-running operations
  async subscribeVideoGeneration(
    request: FalVideoRequest,
    webhookUrl: string
  ): Promise<{ jobId: string }>

  async getVideoStatus(jobId: string): Promise<VideoGenerationStatus>

  async cancelVideoGeneration(jobId: string): Promise<void>
}

interface VideoGenerationStatus {
  jobId: string
  status: 'queued' | 'processing' | 'complete' | 'failed'
  progress: number                       // 0-1
  estimatedTimeRemaining?: number        // Seconds
  result?: FalVideoResponse
  error?: string
}
```

**Key Features**:
- Support for 4 video generation methods
- Webhook support for async processing (videos take 30-120s)
- Job status polling with progress tracking
- Automatic retry with exponential backoff
- Error classification and handling

#### 1.2 Video Generation Service (`generateVideo.ts`)

```typescript
/**
 * High-level video generation service
 * Abstracts FAL.ai video client for application use
 */

interface GenerateVideoOptions {
  method: 'text-to-video' | 'image-to-video' | 'first-last-frame' | 'composite-to-video'

  // Common params
  prompt: string
  duration?: number                      // Default: 7 (max)
  quality?: 'draft' | 'standard' | 'high'

  // Method-specific
  sourceImage?: string                   // For image-to-video
  firstFrame?: string                    // For first-last
  lastFrame?: string
  compositeImage?: string                // For composite-to-video

  // References (from Phase 5)
  characterReference?: string            // Master reference media ID
  locationReference?: string

  // Technical
  aspectRatio?: '16:9' | '9:16' | '1:1'
  fps?: number
  webhookUrl?: string                    // For async notification
}

interface GeneratedVideo {
  videoUrl: string                       // Temporary FAL.ai URL
  duration: number
  fps: number
  resolution: string
  thumbnailUrl?: string
  generationTime: number
  method: string
  jobId?: string                         // If async
}

async function generateVideo(
  options: GenerateVideoOptions
): Promise<GeneratedVideo>

async function generateVideoAsync(
  options: GenerateVideoOptions
): Promise<{ jobId: string }>

async function getVideoGenerationStatus(
  jobId: string
): Promise<VideoGenerationStatus>
```

#### 1.3 Video Method Handlers

**Text-to-Video** (`textToVideo.ts`):
```typescript
interface TextToVideoParams {
  prompt: string
  negativePrompt?: string
  duration: number                       // Max 7
  style?: string                         // 'cinematic', 'anime', etc.
  aspectRatio?: string
}

async function generateTextToVideo(
  params: TextToVideoParams
): Promise<GeneratedVideo>
```

**Image-to-Video** (`imageToVideo.ts`):
```typescript
interface ImageToVideoParams {
  sourceImage: string                    // Media ID or URL
  prompt: string                         // Motion description
  motion?: string                        // 'pan', 'zoom', 'dolly'
  duration: number                       // Max 7
  characterReference?: string            // For consistency check
}

async function generateImageToVideo(
  params: ImageToVideoParams
): Promise<GeneratedVideo>
```

**First-Last Frame** (`firstLastFrame.ts`):
```typescript
interface FirstLastFrameParams {
  firstFrame: string                     // Starting image
  lastFrame: string                      // Ending image
  prompt: string                         // Transition description
  duration: number                       // Max 7
  interpolation?: 'smooth' | 'dynamic' | 'cut'
}

async function generateFirstLastFrame(
  params: FirstLastFrameParams
): Promise<GeneratedVideo>
```

**Composite-to-Video** (`compositeToVideo.ts`):
```typescript
interface CompositeToVideoParams {
  compositeImage: string                 // From Phase 5 Shot Composer
  action: string                         // What happens in video
  cameraMovement?: string
  duration: number                       // Max 7
  characterReference?: string            // Master reference
  locationReference?: string
}

async function generateCompositeToVideo(
  params: CompositeToVideoParams
): Promise<GeneratedVideo>
```

---

### 2. Scene Assembly Service Layer

**Location**: `/src/lib/video/`

#### 2.1 Scene Assembly (`assembleScene.ts`)

```typescript
/**
 * Scene Assembly Service
 * Combines multiple 7-second clips into complete scenes
 */

interface SceneAssemblyParams {
  sceneId: string
  clips: ClipDefinition[]
  transitions?: TransitionDefinition[]
  audio?: AudioTrackDefinition[]
  postProcessing?: PostProcessingOptions
}

interface ClipDefinition {
  clipId: string                         // Video media ID
  duration: number                       // Actual duration (≤7s)
  sequence: number                       // Order in scene (1, 2, 3...)
  trimStart?: number                     // Trim from start (seconds)
  trimEnd?: number                       // Trim from end
  speedMultiplier?: number               // Slow-mo or speed-up
}

interface TransitionDefinition {
  fromClip: number                       // Sequence number
  toClip: number
  type: 'cut' | 'fade' | 'dissolve' | 'wipe'
  duration: number                       // Transition duration (seconds)
}

interface AudioTrackDefinition {
  type: 'dialogue' | 'music' | 'sfx'
  audioId: string                        // Audio media ID
  startTime: number                      // When to start in scene (seconds)
  duration?: number                      // Auto-detected if not provided
  volume?: number                        // 0-1
  fadeIn?: number                        // Fade-in duration
  fadeOut?: number                       // Fade-out duration
}

interface PostProcessingOptions {
  colorGrade?: ColorGradePreset
  stabilization?: boolean
  denoise?: boolean
  sharpen?: number                       // 0-1
}

type ColorGradePreset =
  | 'natural'
  | 'cinematic'
  | 'warm'
  | 'cool'
  | 'high-contrast'
  | 'custom'

interface AssembledScene {
  sceneId: string
  mediaId: string                        // Final assembled video
  url: string                            // CDN URL
  duration: number                       // Total duration
  clipCount: number
  audioTracks: number
  qualityScore: number
  renderTime: number                     // Seconds
}

async function assembleScene(
  params: SceneAssemblyParams
): Promise<AssembledScene>
```

**Assembly Workflow**:
1. Retrieve all clip videos from R2
2. Download clips to temporary directory
3. Generate FFmpeg command for assembly:
   - Concatenate clips with transitions
   - Overlay audio tracks with timing
   - Apply color grading
   - Apply post-processing effects
4. Execute FFmpeg rendering
5. Upload assembled video to R2
6. Create Media document with metadata
7. Clean up temporary files
8. Return assembled scene info

#### 2.2 Transition Effects (`transitions.ts`)

```typescript
/**
 * Video Transition Effects
 * Handles transitions between clips using FFmpeg
 */

interface TransitionEffect {
  type: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'slide'
  duration: number
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

// Generate FFmpeg filter for transition
function generateTransitionFilter(
  transition: TransitionEffect,
  clip1Duration: number,
  clip2Duration: number
): string

// Common transitions
const TRANSITIONS = {
  cut: {
    duration: 0,
    ffmpegFilter: null                   // Direct concatenation
  },

  fade: {
    duration: 0.5,                       // 0.5 second fade
    ffmpegFilter: (d: number) => `fade=t=out:st=${d-0.5}:d=0.5`
  },

  dissolve: {
    duration: 1.0,                       // 1 second cross-dissolve
    ffmpegFilter: (d: number) => `xfade=transition=fade:duration=1:offset=${d-1}`
  },

  wipe: {
    duration: 0.75,
    ffmpegFilter: (d: number) => `xfade=transition=wipeleft:duration=0.75:offset=${d-0.75}`
  }
}
```

#### 2.3 Audio Sync (`audioSync.ts`)

```typescript
/**
 * Audio Track Synchronization
 * Syncs dialogue, music, and SFX with video timeline
 */

interface AudioSyncParams {
  videoClips: ClipDefinition[]
  audioTracks: AudioTrackDefinition[]
  outputDuration: number
}

interface SyncedAudioTrack {
  audioId: string
  type: 'dialogue' | 'music' | 'sfx'
  startTime: number
  endTime: number
  volume: number
  fadeIn?: number
  fadeOut?: number
  ffmpegFilter: string
}

async function syncAudioTracks(
  params: AudioSyncParams
): Promise<SyncedAudioTrack[]>

// Generate FFmpeg audio filter chain
function generateAudioFilterChain(
  tracks: SyncedAudioTrack[]
): string
```

**Audio Sync Workflow**:
1. Calculate total video duration
2. For each audio track:
   - Verify audio file exists in R2
   - Calculate actual start/end times
   - Apply volume adjustments
   - Add fade-in/fade-out if specified
   - Generate FFmpeg audio filter
3. Mix all audio tracks:
   - Dialogue (priority 1, center)
   - Music (priority 2, background)
   - SFX (priority 3, positioned)
4. Return FFmpeg filter chain for final render

#### 2.4 Quality Check (`qualityCheck.ts`)

```typescript
/**
 * Video Quality Verification
 * Validates generated videos against references
 */

interface VideoQualityCheckParams {
  videoId: string                        // Video to verify
  characterReference?: string            // Master reference
  locationReference?: string
  expectedDuration: number
  checkTypes: QualityCheckType[]
}

type QualityCheckType =
  | 'duration'                           // Duration <= 7s
  | 'resolution'                         // Matches target
  | 'fps'                                // Consistent frame rate
  | 'character-consistency'              // Matches reference
  | 'location-consistency'
  | 'motion-quality'                     // Natural motion
  | 'visual-clarity'                     // Sharpness

interface VideoQualityResult {
  passed: boolean
  overallQuality: number                 // 0-1
  checks: QualityCheck[]
  issues: string[]
  suggestions: string[]
}

interface QualityCheck {
  type: QualityCheckType
  score: number                          // 0-1
  passed: boolean
  details: string
  threshold: number                      // Minimum to pass
}

async function verifyVideoQuality(
  params: VideoQualityCheckParams
): Promise<VideoQualityResult>

// Check specific aspects
async function checkDuration(videoId: string, expected: number): Promise<QualityCheck>
async function checkResolution(videoId: string, target: string): Promise<QualityCheck>
async function checkCharacterConsistency(
  videoId: string,
  referenceId: string
): Promise<QualityCheck>
```

**Quality Check Methods**:

1. **Technical Quality**:
   - Duration validation (must be ≤ 7 seconds)
   - Resolution check (matches target)
   - FPS consistency (no dropped frames)
   - Bitrate quality

2. **Visual Consistency**:
   - Character appearance vs master reference
   - Location elements vs location reference
   - Color palette consistency
   - Lighting consistency

3. **Motion Quality**:
   - Natural movement (no jitter/artifacts)
   - Smooth transitions
   - Realistic physics

4. **Overall Assessment**:
   - Weighted score across all checks
   - Pass/fail decision (threshold: 0.7)
   - Specific issues identified
   - Improvement suggestions

---

### 3. ElevenLabs Voice Integration

**Location**: `/src/lib/voice/`

#### 3.1 ElevenLabs Client (`client.ts`)

```typescript
/**
 * ElevenLabs Voice Client
 * Handles voice creation and text-to-speech generation
 */

interface ElevenLabsConfig {
  apiKey: string
  baseUrl: string
}

interface VoiceProfile {
  voiceId: string                        // ElevenLabs voice ID
  name: string
  description: string
  gender: 'male' | 'female' | 'neutral'
  age: 'young' | 'middle_aged' | 'old'
  accent: string
  style: string                          // 'confident', 'soft', etc.
  sampleUrl?: string
}

class ElevenLabsClient {
  private config: ElevenLabsConfig

  constructor(config: ElevenLabsConfig)

  // Voice management
  async listVoices(): Promise<VoiceProfile[]>

  async getVoice(voiceId: string): Promise<VoiceProfile>

  async createVoice(params: CreateVoiceParams): Promise<VoiceProfile>

  async deleteVoice(voiceId: string): Promise<void>

  // Text-to-speech
  async generateSpeech(params: TextToSpeechParams): Promise<AudioResult>

  async generateSpeechBatch(
    requests: TextToSpeechParams[]
  ): Promise<AudioResult[]>
}

interface CreateVoiceParams {
  name: string
  description: string
  labels?: Record<string, string>
  files?: File[]                         // Voice samples for cloning
}

interface TextToSpeechParams {
  voiceId: string
  text: string
  modelId?: string                       // Default: 'eleven_monolingual_v1'
  stability?: number                     // 0-1, default: 0.5
  similarityBoost?: number               // 0-1, default: 0.75
  style?: number                         // 0-1
  useSpeakerBoost?: boolean
}

interface AudioResult {
  audioUrl: string                       // Temporary URL
  duration: number                       // Seconds
  characterCount: number
  contentType: string                    // 'audio/mpeg'
}
```

#### 3.2 Voice Creation (`voiceCreation.ts`)

```typescript
/**
 * Character Voice Creation and Management
 * Creates and stores voice profiles for characters
 */

interface CreateCharacterVoiceParams {
  characterId: string
  voiceName: string
  description: string                    // "Confident, street-smart"
  gender: 'male' | 'female' | 'neutral'
  age: 'young' | 'middle_aged' | 'old'
  accent?: string
  style?: string
  referenceSamples?: string[]            // URLs to voice samples
}

interface CharacterVoice {
  characterId: string
  voiceProfile: VoiceProfile
  storedAt: Date
  usageCount: number
}

async function createCharacterVoice(
  params: CreateCharacterVoiceParams
): Promise<CharacterVoice>

async function getCharacterVoice(
  characterId: string
): Promise<CharacterVoice | null>

async function assignVoiceToCharacter(
  characterId: string,
  voiceId: string
): Promise<void>
```

**Voice Creation Workflow**:
1. User requests voice for character
2. Query character data from Brain
3. Generate voice description from character profile
4. Call ElevenLabs to create/select voice
5. Store voice ID in character document
6. Generate sample audio to verify
7. Return voice profile with sample

#### 3.3 Text-to-Speech (`textToSpeech.ts`)

```typescript
/**
 * Dialogue Audio Generation
 * Generates character dialogue for scenes
 */

interface GenerateDialogueParams {
  characterId: string
  text: string
  emotion?: string                       // 'neutral', 'excited', 'sad'
  context?: string                       // Scene context for delivery
}

interface DialogueAudio {
  audioId: string                        // Media ID
  url: string                            // CDN URL
  duration: number
  characterId: string
  text: string
  generationParams: Record<string, any>
}

async function generateDialogue(
  params: GenerateDialogueParams
): Promise<DialogueAudio>

async function generateDialogueBatch(
  dialogues: GenerateDialogueParams[]
): Promise<DialogueAudio[]>
```

**Dialogue Generation Workflow**:
1. Retrieve character voice profile
2. If no voice assigned, create default voice
3. Format text for optimal delivery
4. Add emotion/context modifiers if specified
5. Call ElevenLabs text-to-speech
6. Download generated audio
7. Upload to R2 storage
8. Create Media document with metadata
9. Return dialogue audio info

---

### 4. Video Generation Department

**Location**: `/src/agents/departments/videoGeneration/`

#### 4.1 Video Department Head (`videoHead.ts`)

```typescript
/**
 * Video Generation Department Head
 * Coordinates 4 video specialists for complete video production
 */

interface VideoHeadConfig {
  departmentId: string
  specialists: VideoSpecialist[]
  maxConcurrentJobs: number
}

interface VideoRequest {
  type: 'generate' | 'assemble' | 'verify' | 'integrate-audio'
  params: Record<string, any>
  priority: 'low' | 'medium' | 'high'
  context?: any
}

class VideoHead {
  async processRequest(request: VideoRequest): Promise<VideoHeadResponse>

  // Assess relevance
  private assessRelevance(request: VideoRequest): number

  // Identify needed specialists
  private identifySpecialists(request: VideoRequest): string[]

  // Spawn specialists
  private async spawnSpecialists(
    specialists: string[],
    tasks: SpecialistTask[]
  ): Promise<SpecialistOutput[]>

  // Grade outputs
  private gradeOutput(output: SpecialistOutput): DepartmentGrading

  // Compile department report
  private compileDepartmentReport(
    outputs: GradedOutput[]
  ): VideoHeadResponse
}

interface VideoHeadResponse {
  department: 'video-generation'
  relevance: number
  status: 'complete' | 'partial' | 'failed'
  outputs: GradedOutput[]
  departmentQuality: number
  issues: string[]
  suggestions: string[]
}
```

**Department Workflow**:
1. Receive request from Master Orchestrator
2. Assess relevance (0-1 score)
3. Identify needed specialists:
   - Video Generator (for clip generation)
   - Scene Assembler (for multi-clip scenes)
   - Quality Verifier (for consistency check)
   - Audio Integrator (for dialogue/music)
4. Spawn specialists in parallel
5. Grade each specialist output
6. Compile department report
7. Return to Master Orchestrator

---

### 5. Video Specialists

**Location**: `/src/agents/specialists/video/`

#### 5.1 Video Generator (`videoGenerator.ts`)

```typescript
/**
 * Video Generator Specialist
 * Generates videos using all 4 methods
 */

interface VideoGeneratorInput {
  method: 'text-to-video' | 'image-to-video' | 'first-last-frame' | 'composite-to-video'
  params: GenerateVideoOptions
  characterReference?: string
  locationReference?: string
  context?: string
}

interface VideoGeneratorOutput {
  videoId: string
  mediaId: string
  url: string
  duration: number
  method: string
  qualityScore: number

  // Self-assessment
  confidence: number                     // 0-1
  completeness: number
  issues?: string[]
}

async function generateVideo(
  input: VideoGeneratorInput
): Promise<VideoGeneratorOutput>
```

**Custom Tools**:
```typescript
{
  name: 'generate_text_to_video',
  description: 'Generate video from text prompt',
  parameters: {
    prompt: string
    duration: number
    style?: string
  }
}

{
  name: 'generate_image_to_video',
  description: 'Generate video from source image',
  parameters: {
    sourceImage: string
    motion: string
    duration: number
  }
}

{
  name: 'generate_first_last_frame',
  description: 'Generate video from first and last frames',
  parameters: {
    firstFrame: string
    lastFrame: string
    transition: string
  }
}

{
  name: 'generate_composite_to_video',
  description: 'Generate video from composite image',
  parameters: {
    compositeImage: string
    action: string
    duration: number
  }
}

{
  name: 'save_video',
  description: 'Upload video to R2 and store metadata',
  parameters: {
    videoBuffer: Buffer
    metadata: VideoMetadata
  }
}
```

#### 5.2 Scene Assembler (`sceneAssembler.ts`)

```typescript
/**
 * Scene Assembler Specialist
 * Assembles multi-clip scenes with transitions
 */

interface SceneAssemblerInput {
  sceneId: string
  clips: ClipDefinition[]
  transitions?: TransitionDefinition[]
  postProcessing?: PostProcessingOptions
}

interface SceneAssemblerOutput {
  sceneId: string
  mediaId: string
  url: string
  duration: number
  clipCount: number
  qualityScore: number

  // Self-assessment
  confidence: number
  completeness: number
}

async function assembleScene(
  input: SceneAssemblerInput
): Promise<SceneAssemblerOutput>
```

**Custom Tools**:
```typescript
{
  name: 'retrieve_clips',
  description: 'Retrieve video clips from storage',
  parameters: {
    clipIds: string[]
  }
}

{
  name: 'assemble_video_clips',
  description: 'Assemble clips with transitions using FFmpeg',
  parameters: {
    clips: ClipDefinition[]
    transitions: TransitionDefinition[]
  }
}

{
  name: 'apply_post_processing',
  description: 'Apply color grading and effects',
  parameters: {
    videoBuffer: Buffer
    options: PostProcessingOptions
  }
}

{
  name: 'save_assembled_scene',
  description: 'Upload assembled scene to R2',
  parameters: {
    videoBuffer: Buffer
    metadata: SceneMetadata
  }
}
```

#### 5.3 Quality Verifier (`qualityVerifier.ts`)

```typescript
/**
 * Quality Verifier Specialist
 * Verifies video quality and consistency
 */

interface QualityVerifierInput {
  videoId: string
  checkTypes: QualityCheckType[]
  characterReference?: string
  locationReference?: string
  expectedDuration: number
}

interface QualityVerifierOutput {
  passed: boolean
  overallQuality: number
  checks: QualityCheck[]
  issues: string[]
  suggestions: string[]

  // Self-assessment
  confidence: number
  completeness: number
}

async function verifyVideoQuality(
  input: QualityVerifierInput
): Promise<QualityVerifierOutput>
```

**Custom Tools**:
```typescript
{
  name: 'check_technical_quality',
  description: 'Verify duration, resolution, fps',
  parameters: {
    videoId: string
    expectedDuration: number
    targetResolution: string
  }
}

{
  name: 'check_visual_consistency',
  description: 'Compare video to reference images',
  parameters: {
    videoId: string
    referenceIds: string[]
  }
}

{
  name: 'check_motion_quality',
  description: 'Analyze motion smoothness and realism',
  parameters: {
    videoId: string
  }
}

{
  name: 'save_quality_report',
  description: 'Store quality report in Brain',
  parameters: {
    report: VideoQualityResult
  }
}
```

#### 5.4 Audio Integrator (`audioIntegrator.ts`)

```typescript
/**
 * Audio Integrator Specialist
 * Integrates dialogue and audio tracks
 */

interface AudioIntegratorInput {
  videoId: string
  audioTracks: AudioTrackDefinition[]
  outputDuration: number
}

interface AudioIntegratorOutput {
  videoId: string
  mediaId: string
  url: string
  audioTrackCount: number
  qualityScore: number

  // Self-assessment
  confidence: number
  completeness: number
}

async function integrateAudio(
  input: AudioIntegratorInput
): Promise<AudioIntegratorOutput>
```

**Custom Tools**:
```typescript
{
  name: 'generate_character_dialogue',
  description: 'Generate dialogue audio via ElevenLabs',
  parameters: {
    characterId: string
    text: string
    emotion?: string
  }
}

{
  name: 'sync_audio_tracks',
  description: 'Sync dialogue, music, SFX with video',
  parameters: {
    videoId: string
    audioTracks: AudioTrackDefinition[]
  }
}

{
  name: 'mix_audio',
  description: 'Mix audio tracks with volume/fade',
  parameters: {
    tracks: SyncedAudioTrack[]
  }
}

{
  name: 'save_with_audio',
  description: 'Upload video with integrated audio',
  parameters: {
    videoBuffer: Buffer
    metadata: VideoMetadata
  }
}
```

---

### 6. Custom Tools Implementation

**Location**: `/src/agents/tools/departments/video/`

#### 6.1 `generateVideo` Tool

```typescript
// File: generateVideo.ts

export const generateVideoTool = {
  name: 'generate_video',
  description: 'Generate video using specified method',

  async execute(params: GenerateVideoParams): Promise<VideoGenerationResult> {
    // 1. Validate params
    validateVideoParams(params)

    // 2. Retrieve references if specified
    let characterRef, locationRef
    if (params.characterReference) {
      characterRef = await getMediaById(params.characterReference)
    }
    if (params.locationReference) {
      locationRef = await getMediaById(params.locationReference)
    }

    // 3. Build generation request
    const request: FalVideoRequest = {
      method: params.method,
      model: selectModel(params.method),
      input: buildVideoInput(params, characterRef, locationRef),
      parameters: {
        duration: Math.min(params.duration || 7, 7),  // Max 7s
        fps: params.fps || 24,
        resolution: params.resolution || '1920x1080',
        quality: params.quality || 'standard'
      }
    }

    // 4. Generate video via FAL.ai
    const generated = await falClient.generateVideo(request)

    // 5. Download video from FAL.ai
    const videoBuffer = await downloadVideo(generated.videoUrl)

    // 6. Upload to R2
    const uploadResult = await r2Client.uploadVideo({
      buffer: videoBuffer,
      filename: `video-${Date.now()}.mp4`,
      contentType: 'video/mp4',
      metadata: {
        projectId: params.projectId,
        method: params.method,
        duration: generated.duration,
        generationParams: request
      },
      folder: `projects/${params.projectId}/videos`
    })

    // 7. Store metadata in Media collection
    const media = await createMedia({
      projectId: params.projectId,
      url: uploadResult.url,
      type: 'video',
      metadata: {
        method: params.method,
        duration: generated.duration,
        fps: generated.fps,
        resolution: generated.resolution,
        generationParams: request
      }
    })

    // 8. Create Brain relationships if references used
    if (params.characterReference) {
      await createBrainRelationship({
        fromId: media._id,
        toId: params.characterReference,
        type: 'USES_CHARACTER_REFERENCE'
      })
    }

    return {
      videoId: media._id,
      url: uploadResult.url,
      duration: generated.duration,
      method: params.method,
      qualityScore: 0.85  // Placeholder, will be set by quality verifier
    }
  }
}
```

#### 6.2 `assembleScene` Tool

```typescript
// File: assembleScene.ts

export const assembleSceneTool = {
  name: 'assemble_scene',
  description: 'Assemble multi-clip scene with transitions',

  async execute(params: AssembleSceneParams): Promise<AssembledScene> {
    // 1. Retrieve all clips
    const clips = await Promise.all(
      params.clips.map(c => getMediaById(c.clipId))
    )

    // 2. Download clips to temp directory
    const tempDir = `/tmp/scene-${params.sceneId}`
    await fs.mkdir(tempDir, { recursive: true })

    const clipPaths = await Promise.all(
      clips.map(async (clip, i) => {
        const buffer = await downloadVideo(clip.url)
        const path = `${tempDir}/clip-${i}.mp4`
        await fs.writeFile(path, buffer)
        return path
      })
    )

    // 3. Build FFmpeg command
    const ffmpegCmd = buildFFmpegCommand({
      clips: clipPaths,
      transitions: params.transitions || [],
      output: `${tempDir}/assembled.mp4`
    })

    // 4. Execute FFmpeg
    await executeFFmpeg(ffmpegCmd)

    // 5. Apply post-processing if specified
    if (params.postProcessing) {
      await applyPostProcessing(
        `${tempDir}/assembled.mp4`,
        params.postProcessing
      )
    }

    // 6. Upload assembled scene to R2
    const assembledBuffer = await fs.readFile(`${tempDir}/assembled.mp4`)
    const uploadResult = await r2Client.uploadVideo({
      buffer: assembledBuffer,
      filename: `scene-${params.sceneId}.mp4`,
      contentType: 'video/mp4',
      metadata: {
        projectId: params.projectId,
        sceneId: params.sceneId,
        clipCount: clips.length,
        transitions: params.transitions
      },
      folder: `projects/${params.projectId}/scenes`
    })

    // 7. Store scene metadata
    const media = await createMedia({
      projectId: params.projectId,
      url: uploadResult.url,
      type: 'video',
      metadata: {
        sceneId: params.sceneId,
        clipCount: clips.length,
        duration: calculateTotalDuration(clips),
        assemblyParams: params
      }
    })

    // 8. Clean up temp files
    await fs.rm(tempDir, { recursive: true })

    return {
      sceneId: params.sceneId,
      mediaId: media._id,
      url: uploadResult.url,
      duration: media.metadata.duration,
      clipCount: clips.length,
      qualityScore: 0.82  // Will be set by quality verifier
    }
  }
}

function buildFFmpegCommand(params: {
  clips: string[]
  transitions: TransitionDefinition[]
  output: string
}): string {
  // Build complex FFmpeg filter graph for clip assembly
  // with transitions, audio mixing, etc.

  const inputs = params.clips.map((clip, i) => `-i ${clip}`).join(' ')

  // Generate filter_complex for transitions
  const filterComplex = generateFilterComplex(params.clips, params.transitions)

  return `ffmpeg ${inputs} -filter_complex "${filterComplex}" ${params.output}`
}
```

#### 6.3 `verifyVideoQuality` Tool

```typescript
// File: verifyVideoQuality.ts

export const verifyVideoQualityTool = {
  name: 'verify_video_quality',
  description: 'Verify video quality and consistency',

  async execute(params: VideoQualityCheckParams): Promise<VideoQualityResult> {
    const checks: QualityCheck[] = []

    // 1. Get video metadata
    const video = await getMediaById(params.videoId)

    // 2. Technical quality checks
    if (params.checkTypes.includes('duration')) {
      checks.push(await checkDuration(video, params.expectedDuration))
    }

    if (params.checkTypes.includes('resolution')) {
      checks.push(await checkResolution(video, '1920x1080'))
    }

    if (params.checkTypes.includes('fps')) {
      checks.push(await checkFrameRate(video, 24))
    }

    // 3. Visual consistency checks
    if (params.checkTypes.includes('character-consistency') && params.characterReference) {
      checks.push(await checkCharacterConsistency(
        video,
        params.characterReference
      ))
    }

    if (params.checkTypes.includes('location-consistency') && params.locationReference) {
      checks.push(await checkLocationConsistency(
        video,
        params.locationReference
      ))
    }

    // 4. Motion quality check
    if (params.checkTypes.includes('motion-quality')) {
      checks.push(await checkMotionQuality(video))
    }

    // 5. Visual clarity check
    if (params.checkTypes.includes('visual-clarity')) {
      checks.push(await checkVisualClarity(video))
    }

    // 6. Calculate overall quality
    const overallQuality = checks.reduce((sum, c) => sum + c.score, 0) / checks.length
    const passed = checks.every(c => c.passed)

    // 7. Generate issues and suggestions
    const issues: string[] = []
    const suggestions: string[] = []

    for (const check of checks) {
      if (!check.passed) {
        issues.push(`${check.type}: ${check.details}`)
        suggestions.push(getSuggestionForCheck(check))
      }
    }

    return {
      passed,
      overallQuality,
      checks,
      issues,
      suggestions
    }
  }
}

async function checkCharacterConsistency(
  video: Media,
  referenceId: string
): Promise<QualityCheck> {
  // 1. Extract key frames from video
  const keyFrames = await extractKeyFrames(video.url, 3)  // 3 frames

  // 2. Get reference image
  const reference = await getMediaById(referenceId)

  // 3. Compare each key frame to reference
  const scores: number[] = []

  for (const frame of keyFrames) {
    // Use image comparison (from Phase 5 consistency verifier)
    const comparison = await compareImages(frame, reference.url, [
      'facial-features',
      'body-proportions',
      'color-palette'
    ])
    scores.push(comparison.overallConsistency)
  }

  // 4. Average consistency across frames
  const avgConsistency = scores.reduce((sum, s) => sum + s, 0) / scores.length

  return {
    type: 'character-consistency',
    score: avgConsistency,
    passed: avgConsistency >= 0.7,
    details: `Character consistency: ${(avgConsistency * 100).toFixed(1)}%`,
    threshold: 0.7
  }
}
```

#### 6.4 `integrateAudio` Tool

```typescript
// File: integrateAudio.ts

export const integrateAudioTool = {
  name: 'integrate_audio',
  description: 'Integrate audio tracks with video',

  async execute(params: IntegrateAudioParams): Promise<AudioIntegrationResult> {
    // 1. Get video
    const video = await getMediaById(params.videoId)

    // 2. Generate/retrieve audio tracks
    const audioTracks: SyncedAudioTrack[] = []

    for (const track of params.audioTracks) {
      if (track.type === 'dialogue') {
        // Generate dialogue if needed
        const dialogue = await generateDialogue({
          characterId: track.characterId,
          text: track.text,
          emotion: track.emotion
        })

        audioTracks.push({
          audioId: dialogue.audioId,
          type: 'dialogue',
          startTime: track.startTime,
          endTime: track.startTime + dialogue.duration,
          volume: track.volume || 1.0,
          fadeIn: track.fadeIn,
          fadeOut: track.fadeOut,
          ffmpegFilter: buildAudioFilter(track)
        })
      } else {
        // Use existing audio
        const audio = await getMediaById(track.audioId)
        audioTracks.push({
          audioId: track.audioId,
          type: track.type,
          startTime: track.startTime,
          endTime: track.startTime + (track.duration || audio.metadata.duration),
          volume: track.volume || 1.0,
          fadeIn: track.fadeIn,
          fadeOut: track.fadeOut,
          ffmpegFilter: buildAudioFilter(track)
        })
      }
    }

    // 3. Download video and audio files
    const tempDir = `/tmp/audio-integration-${Date.now()}`
    await fs.mkdir(tempDir, { recursive: true })

    const videoPath = `${tempDir}/video.mp4`
    const videoBuffer = await downloadVideo(video.url)
    await fs.writeFile(videoPath, videoBuffer)

    const audioPaths = await Promise.all(
      audioTracks.map(async (track, i) => {
        const audio = await getMediaById(track.audioId)
        const buffer = await downloadAudio(audio.url)
        const path = `${tempDir}/audio-${i}.mp3`
        await fs.writeFile(path, buffer)
        return { track, path }
      })
    )

    // 4. Build FFmpeg command for audio integration
    const ffmpegCmd = buildAudioIntegrationCommand({
      videoPath,
      audioTracks: audioPaths,
      output: `${tempDir}/output.mp4`,
      duration: params.outputDuration
    })

    // 5. Execute FFmpeg
    await executeFFmpeg(ffmpegCmd)

    // 6. Upload result to R2
    const outputBuffer = await fs.readFile(`${tempDir}/output.mp4`)
    const uploadResult = await r2Client.uploadVideo({
      buffer: outputBuffer,
      filename: `video-audio-${Date.now()}.mp4`,
      contentType: 'video/mp4',
      metadata: {
        projectId: params.projectId,
        videoId: params.videoId,
        audioTrackCount: audioTracks.length
      },
      folder: `projects/${params.projectId}/videos`
    })

    // 7. Create new media document
    const media = await createMedia({
      projectId: params.projectId,
      url: uploadResult.url,
      type: 'video',
      metadata: {
        originalVideoId: params.videoId,
        audioTracks: audioTracks.map(t => ({
          type: t.type,
          startTime: t.startTime,
          duration: t.endTime - t.startTime
        }))
      }
    })

    // 8. Clean up
    await fs.rm(tempDir, { recursive: true })

    return {
      videoId: media._id,
      url: uploadResult.url,
      audioTrackCount: audioTracks.length,
      qualityScore: 0.88
    }
  }
}
```

---

### 7. API Routes

**Location**: `/src/app/api/v1/projects/[id]/videos/`

#### 7.1 Generate Video (Async Job)

```typescript
// POST /api/v1/projects/[projectId]/videos/generate

interface GenerateVideoRequest {
  method: 'text-to-video' | 'image-to-video' | 'first-last-frame' | 'composite-to-video'
  input: {
    prompt: string
    sourceImage?: string
    firstFrame?: string
    lastFrame?: string
    compositeImage?: string
  }
  parameters?: {
    duration?: number
    quality?: 'draft' | 'standard' | 'high'
    aspectRatio?: string
  }
  references?: {
    character?: string
    location?: string
  }
}

interface GenerateVideoResponse {
  jobId: string
  status: 'queued'
  estimatedTime: number                  // Seconds
}

// Handler
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Authenticate user
  const user = await authenticateRequest(request)

  // 2. Verify project access
  await verifyProjectAccess(user._id, params.id)

  // 3. Parse and validate request
  const body = await request.json()
  validateGenerateVideoRequest(body)

  // 4. Create job in queue
  const job = await videoQueue.add('generate-video', {
    projectId: params.id,
    userId: user._id,
    method: body.method,
    input: body.input,
    parameters: body.parameters,
    references: body.references
  })

  // 5. Return job ID
  return NextResponse.json({
    jobId: job.id,
    status: 'queued',
    estimatedTime: estimateGenerationTime(body.method)
  })
}
```

#### 7.2 Assemble Scene

```typescript
// POST /api/v1/projects/[projectId]/videos/assemble

interface AssembleSceneRequest {
  sceneId: string
  clips: Array<{
    clipId: string
    sequence: number
    trimStart?: number
    trimEnd?: number
  }>
  transitions?: Array<{
    fromClip: number
    toClip: number
    type: 'cut' | 'fade' | 'dissolve'
    duration: number
  }>
  audio?: Array<{
    type: 'dialogue' | 'music' | 'sfx'
    audioId?: string
    characterId?: string
    text?: string
    startTime: number
  }>
}

interface AssembleSceneResponse {
  jobId: string
  status: 'queued'
  estimatedTime: number
}

// Handler
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  await verifyProjectAccess(user._id, params.id)

  const body = await request.json()
  validateAssembleSceneRequest(body)

  // Create assembly job
  const job = await videoQueue.add('assemble-scene', {
    projectId: params.id,
    userId: user._id,
    sceneId: body.sceneId,
    clips: body.clips,
    transitions: body.transitions,
    audio: body.audio
  })

  return NextResponse.json({
    jobId: job.id,
    status: 'queued',
    estimatedTime: estimateAssemblyTime(body.clips.length)
  })
}
```

#### 7.3 Verify Video Quality

```typescript
// POST /api/v1/projects/[projectId]/videos/verify

interface VerifyVideoRequest {
  videoId: string
  checkTypes?: QualityCheckType[]
  characterReference?: string
  locationReference?: string
}

interface VerifyVideoResponse {
  passed: boolean
  overallQuality: number
  checks: QualityCheck[]
  issues: string[]
  suggestions: string[]
}

// Handler (synchronous)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  await verifyProjectAccess(user._id, params.id)

  const body = await request.json()

  // Run quality verification
  const result = await verifyVideoQuality({
    videoId: body.videoId,
    checkTypes: body.checkTypes || ['all'],
    characterReference: body.characterReference,
    locationReference: body.locationReference,
    expectedDuration: 7
  })

  return NextResponse.json(result)
}
```

#### 7.4 Get Video Details

```typescript
// GET /api/v1/projects/[projectId]/videos/[videoId]

interface VideoDetails {
  _id: string
  projectId: string
  url: string
  type: 'video'
  metadata: {
    method?: string
    duration: number
    fps: number
    resolution: string
    qualityScore?: number
    characterReference?: string
    locationReference?: string
  }
  createdAt: Date
}

// Handler
export async function GET(
  request: Request,
  { params }: { params: { id: string; videoId: string } }
) {
  const user = await authenticateRequest(request)
  await verifyProjectAccess(user._id, params.id)

  const video = await getMediaById(params.videoId)

  if (!video || video.projectId !== params.id) {
    return NextResponse.json(
      { error: 'Video not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(video)
}
```

#### 7.5 Check Job Status

```typescript
// GET /api/v1/projects/[projectId]/videos/jobs/[jobId]

interface JobStatus {
  jobId: string
  type: 'video_generation' | 'scene_assembly'
  status: 'queued' | 'processing' | 'complete' | 'failed'
  progress: number                       // 0-1
  estimatedTimeRemaining?: number
  result?: {
    videoId: string
    url: string
    duration: number
    qualityScore: number
  }
  error?: string
  createdAt: Date
  completedAt?: Date
}

// Handler
export async function GET(
  request: Request,
  { params }: { params: { id: string; jobId: string } }
) {
  const user = await authenticateRequest(request)
  await verifyProjectAccess(user._id, params.id)

  const job = await videoQueue.getJob(params.jobId)

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    )
  }

  const status: JobStatus = {
    jobId: job.id,
    type: job.name,
    status: await job.getState(),
    progress: job.progress(),
    result: job.returnvalue,
    error: job.failedReason,
    createdAt: new Date(job.timestamp),
    completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined
  }

  return NextResponse.json(status)
}
```

---

### 8. Job Queue System

**Location**: `/src/lib/queue/`

#### 8.1 Video Queue (`videoQueue.ts`)

```typescript
/**
 * Video Generation Job Queue
 * Uses BullMQ for async video processing
 */

import { Queue, Worker, Job } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.REDIS_URL)

// Video generation queue
export const videoQueue = new Queue('video-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: false,
    removeOnFail: false,
    timeout: 300000  // 5 minutes
  }
})

// Queue worker
const videoWorker = new Worker(
  'video-generation',
  async (job: Job) => {
    switch (job.name) {
      case 'generate-video':
        return await processVideoGeneration(job)

      case 'assemble-scene':
        return await processSceneAssembly(job)

      default:
        throw new Error(`Unknown job type: ${job.name}`)
    }
  },
  {
    connection,
    concurrency: 5  // Process 5 jobs in parallel
  }
)

// Job processors
async function processVideoGeneration(job: Job) {
  const { projectId, method, input, parameters, references } = job.data

  // Update progress
  await job.updateProgress(0.1)

  // 1. Generate video
  const video = await generateVideo({
    method,
    ...input,
    ...parameters,
    characterReference: references?.character,
    locationReference: references?.location
  })

  await job.updateProgress(0.7)

  // 2. Verify quality
  const quality = await verifyVideoQuality({
    videoId: video.videoId,
    checkTypes: ['all'],
    characterReference: references?.character,
    locationReference: references?.location,
    expectedDuration: parameters?.duration || 7
  })

  await job.updateProgress(0.9)

  // 3. Store quality score
  await updateMediaQualityScore(video.videoId, quality.overallQuality)

  await job.updateProgress(1.0)

  return {
    videoId: video.videoId,
    url: video.url,
    duration: video.duration,
    qualityScore: quality.overallQuality,
    passed: quality.passed
  }
}

async function processSceneAssembly(job: Job) {
  const { projectId, sceneId, clips, transitions, audio } = job.data

  await job.updateProgress(0.1)

  // 1. Assemble clips
  const scene = await assembleScene({
    sceneId,
    clips,
    transitions
  })

  await job.updateProgress(0.6)

  // 2. Integrate audio if provided
  let finalVideo = scene
  if (audio && audio.length > 0) {
    finalVideo = await integrateAudio({
      videoId: scene.mediaId,
      audioTracks: audio,
      outputDuration: scene.duration
    })
  }

  await job.updateProgress(0.9)

  // 3. Final quality check
  const quality = await verifyVideoQuality({
    videoId: finalVideo.mediaId,
    checkTypes: ['duration', 'resolution', 'motion-quality'],
    expectedDuration: scene.duration
  })

  await job.updateProgress(1.0)

  return {
    sceneId,
    videoId: finalVideo.mediaId,
    url: finalVideo.url,
    duration: scene.duration,
    clipCount: clips.length,
    qualityScore: quality.overallQuality
  }
}

// Event listeners
videoWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed:`, job.returnvalue)

  // Send webhook notification if configured
  if (job.data.webhookUrl) {
    sendWebhookNotification(job.data.webhookUrl, {
      jobId: job.id,
      status: 'complete',
      result: job.returnvalue
    })
  }
})

videoWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message)

  // Send webhook notification
  if (job?.data.webhookUrl) {
    sendWebhookNotification(job.data.webhookUrl, {
      jobId: job.id,
      status: 'failed',
      error: err.message
    })
  }
})

videoWorker.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${(progress * 100).toFixed(0)}%`)
})
```

#### 8.2 Progress Tracking

```typescript
/**
 * Real-time progress tracking via WebSockets
 */

import { Server } from 'socket.io'

export function initializeSocketIO(server: any) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Subscribe to job progress
    socket.on('subscribe-job', async (jobId: string) => {
      // Join room for this job
      socket.join(`job-${jobId}`)

      // Send current status
      const job = await videoQueue.getJob(jobId)
      if (job) {
        socket.emit('job-status', {
          jobId: job.id,
          status: await job.getState(),
          progress: job.progress()
        })
      }
    })

    socket.on('unsubscribe-job', (jobId: string) => {
      socket.leave(`job-${jobId}`)
    })
  })

  // Emit progress updates from worker
  videoWorker.on('progress', (job, progress) => {
    io.to(`job-${job.id}`).emit('job-progress', {
      jobId: job.id,
      progress
    })
  })

  videoWorker.on('completed', (job) => {
    io.to(`job-${job.id}`).emit('job-complete', {
      jobId: job.id,
      result: job.returnvalue
    })
  })

  videoWorker.on('failed', (job, err) => {
    io.to(`job-${job?.id}`).emit('job-failed', {
      jobId: job?.id,
      error: err.message
    })
  })

  return io
}
```

#### 8.3 Webhook Support

```typescript
/**
 * Webhook notifications for job completion
 */

async function sendWebhookNotification(
  webhookUrl: string,
  payload: {
    jobId: string
    status: 'complete' | 'failed'
    result?: any
    error?: string
  }
) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Aladdin-Event': 'video-job-status'
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString()
      })
    })
  } catch (error) {
    console.error('Webhook notification failed:', error)
  }
}
```

---

### 9. Storage Integration

**Location**: `/src/lib/storage/` (extends Phase 5)

#### 9.1 R2 Video Upload

```typescript
// Extends r2Client.ts from Phase 5

class R2StorageClient {
  // Existing image methods...

  // New video upload method
  async uploadVideo(options: UploadVideoOptions): Promise<UploadResult> {
    const { buffer, filename, contentType, metadata, folder } = options

    const key = folder ? `${folder}/${filename}` : filename

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString()
      }
    }))

    return {
      key,
      url: this.getCdnUrl(key),
      size: buffer.length,
      etag: '', // From response
      uploadedAt: new Date()
    }
  }

  // Batch video upload
  async uploadVideoBatch(
    videos: UploadVideoOptions[]
  ): Promise<UploadResult[]> {
    return Promise.all(videos.map(v => this.uploadVideo(v)))
  }

  // Download video
  async downloadVideo(key: string): Promise<Buffer> {
    const response = await this.s3Client.send(new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: key
    }))

    return Buffer.from(await response.Body.transformToByteArray())
  }
}

interface UploadVideoOptions {
  buffer: Buffer
  filename: string
  contentType: 'video/mp4' | 'video/webm'
  metadata: VideoMetadata
  folder?: string
}

interface VideoMetadata {
  projectId: string
  sceneId?: string
  method?: string
  duration: number
  fps: number
  resolution: string
  generationParams?: Record<string, any>
}
```

---

## Data Flow Diagrams

### Video Generation Flow (Text-to-Video Example)

```
User Request: "Generate video of Sarah walking in park"
    │
    ▼
Master Orchestrator
    │
    ▼
Video Department Head
    │
    ├─► Assess relevance: 1.0 (primary domain)
    │
    ├─► Identify specialists: [Video Generator, Quality Verifier]
    │
    └─► Spawn specialists in parallel
        │
        ▼
Video Generator Specialist
    │
    ├─► Query Brain for Sarah character data
    │   └─► Get visual description, personality
    │
    ├─► Query Image Quality Dept for references
    │   ├─► Sarah master reference
    │   └─► Park location reference
    │
    ├─► Build text-to-video prompt
    │   ├─► Character: "Cyberpunk detective Sarah Chen..."
    │   ├─► Action: "walking forward"
    │   ├─► Location: "neon-lit park at night"
    │   └─► Camera: "dolly forward, cinematic"
    │
    ├─► Create job in video queue
    │   └─► Job ID: job_video_001
    │
    └─► Return job ID to department head
        │
        ▼
[ASYNC JOB PROCESSING]
    │
    ├─► Call FAL.ai minimax-video model
    │   ├─► Duration: 7 seconds
    │   ├─► Resolution: 1920x1080
    │   ├─► FPS: 24
    │   └─► Progress updates: 0% → 25% → 50% → 75% → 100%
    │
    ├─► Download generated video (30-90s generation time)
    │
    ├─► Upload to R2
    │   └─► /projects/{id}/videos/sarah_walk_001.mp4
    │
    ├─► Create Media document
    │   ├─► Store metadata (method, params, duration)
    │   └─► Store CDN URL
    │
    ├─► Quality Verifier Specialist
    │   ├─► Extract 3 key frames
    │   ├─► Compare to Sarah master reference
    │   ├─► Check duration (≤ 7s) ✓
    │   ├─► Check resolution ✓
    │   ├─► Check motion quality ✓
    │   ├─► Character consistency: 0.85 ✓
    │   └─► Overall quality: 0.84
    │
    ├─► Create Brain relationships
    │   ├─► Video --DEPICTS--> Sarah character
    │   ├─► Video --USES_REFERENCE--> Sarah master ref
    │   └─► Video --SET_IN--> Park location
    │
    └─► Job complete, emit webhook notification
        │
        ▼
Department Head grades output
    ├─► Quality: 0.84
    ├─► Relevance: 0.95
    ├─► Consistency: 0.85
    ├─► Overall: 0.87 → ACCEPT
    │
    └─► Return to Orchestrator
        │
        ▼
Master Orchestrator
    ├─► Brain final validation
    │   ├─► Semantic consistency ✓
    │   ├─► No contradictions ✓
    │   └─► Quality score: 0.85
    │
    └─► Present to user
        ├─► Video URL (CDN)
        ├─► Duration: 7s
        ├─► Quality: ⭐⭐⭐⭐ 0.85/1.00
        └─► Options: INGEST, REGENERATE, DISCARD
```

### Scene Assembly Flow (30-second scene from 5 clips)

```
User Request: "Assemble Scene 5 from clips 1-5"
    │
    ▼
Video Department Head
    │
    └─► Scene Assembler Specialist
        │
        ├─► Retrieve 5 clips from R2
        │   ├─► Clip 1: 7s (Sarah enters park)
        │   ├─► Clip 2: 7s (Sarah walks past fountain)
        │   ├─► Clip 3: 7s (Sarah looks around)
        │   ├─► Clip 4: 7s (Sarah sits on bench)
        │   └─► Clip 5: 2s (Close-up of Sarah's face)
        │
        ├─► Download clips to temp directory
        │
        ├─► Build FFmpeg command
        │   ├─► Concatenate 5 clips
        │   ├─► Add transitions:
        │   │   ├─► Clip 1 → 2: Dissolve (1s)
        │   │   ├─► Clip 2 → 3: Cut (0s)
        │   │   ├─► Clip 3 → 4: Fade (0.5s)
        │   │   └─► Clip 4 → 5: Cut (0s)
        │   └─► Apply color grading: "cinematic"
        │
        ├─► Execute FFmpeg (render 30s video)
        │
        ├─► Audio Integrator Specialist
        │   │
        │   ├─► Generate dialogue audio
        │   │   ├─► Retrieve Sarah's voice profile
        │   │   ├─► Text: "This park used to be different..."
        │   │   ├─► Call ElevenLabs text-to-speech
        │   │   └─► Duration: 4.5s
        │   │
        │   ├─► Sync audio tracks
        │   │   ├─► Dialogue: 0s - 4.5s (volume: 1.0)
        │   │   ├─► Music: 0s - 30s (volume: 0.3, fade-in: 1s)
        │   │   └─► SFX (birds): 8s - 15s (volume: 0.2)
        │   │
        │   ├─► Mix audio using FFmpeg
        │   │
        │   └─► Integrate with video
        │
        ├─► Upload assembled scene to R2
        │   └─► /projects/{id}/scenes/scene_005.mp4
        │
        ├─► Create Media document
        │   ├─► Duration: 30s
        │   ├─► Clips: 5
        │   ├─► Audio tracks: 3 (dialogue, music, SFX)
        │   └─► Assembly params
        │
        ├─► Quality Verifier
        │   ├─► Check duration: 30s ✓
        │   ├─► Check transitions: smooth ✓
        │   ├─► Check audio sync: aligned ✓
        │   └─► Overall quality: 0.88
        │
        ├─► Clean up temp files
        │
        └─► Return to department head
            │
            └─► Grade output: 0.88 → ACCEPT
                │
                ▼
Master Orchestrator
    └─► Present to user
        ├─► Scene 5 assembled
        ├─► Duration: 30s (5 clips)
        ├─► Quality: ⭐⭐⭐⭐ 0.88/1.00
        └─► Ready for final review
```

---

## Integration with Phase 5 (Images)

### Cross-Phase Workflow

**Scenario**: User requests "Generate video of Sarah in orange jacket in park"

```
1. Master Orchestrator routes to Video Department
   │
   └─► Video Department Head
       │
       ├─► Query Image Quality Dept (Phase 5) for references
       │   ├─► Sarah master reference: ✓ Available
       │   ├─► Orange jacket reference: ✗ Not available
       │   └─► Park location reference: ✓ Available
       │
       ├─► WAIT for missing reference generation
       │   │
       │   └─► Trigger Image Quality Dept
       │       ├─► Master Reference Generator
       │       │   └─► Generate orange jacket reference
       │       ├─► 360° Profile Creator
       │       │   └─► Generate jacket turnaround
       │       └─► Returns jacket reference ID
       │
       ├─► NOW all references available
       │
       └─► Shot Composer (Image Quality Dept)
           ├─► Create composite image:
           │   ├─► Sarah character (master ref)
           │   ├─► Orange jacket (newly generated)
           │   └─► Park location (existing ref)
           │
           └─► Returns composite image ID
               │
               ▼
2. Video Generator Specialist (Phase 6)
   ├─► Use composite image for video generation
   ├─► Method: composite-to-video
   ├─► Call FAL.ai with composite + action
   └─► Generate 7s video clip
       │
       ▼
3. Quality Verifier checks against ALL references
   ├─► Sarah consistency: 0.87 ✓
   ├─► Jacket consistency: 0.83 ✓
   ├─► Location consistency: 0.89 ✓
   └─► Overall: 0.86 → ACCEPT
```

### Reference Retrieval Pattern

```typescript
// Video Generator checks for required references

async function generateCompositeToVideo(params: CompositeToVideoParams) {
  // 1. Check if composite image exists
  let compositeImage = params.compositeImage

  if (!compositeImage) {
    // 2. Need to create composite from references
    const references: ReferenceSet = {
      characters: [{
        referenceId: params.characterReference,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0
      }],
      location: params.locationReference
    }

    // 3. Call Image Quality Dept Shot Composer
    const composite = await generateCompositeShot({
      description: params.action,
      references,
      lighting: params.lighting,
      cameraAngle: params.cameraAngle,
      projectId: params.projectId
    })

    compositeImage = composite.mediaId
  }

  // 4. Now generate video from composite
  const video = await generateVideo({
    method: 'composite-to-video',
    compositeImage,
    action: params.action,
    duration: params.duration
  })

  return video
}
```

---

## Performance Considerations

### Estimated Generation Times

| Operation | Target Time | Max Time |
|-----------|------------|----------|
| Text-to-Video (7s) | 45-60s | 120s |
| Image-to-Video (7s) | 30-45s | 90s |
| First-Last Frame (7s) | 40-55s | 100s |
| Composite-to-Video (7s) | 35-50s | 90s |
| Scene Assembly (5 clips) | 20-30s | 60s |
| Audio Integration | 10-15s | 30s |
| Quality Verification | 5-10s | 20s |

### Optimization Strategies

1. **Parallel Processing**:
   - Generate multiple clips in parallel (5 concurrent jobs)
   - Batch audio generation for dialogue-heavy scenes
   - Parallel quality checks for multi-clip scenes

2. **Caching**:
   - Cache FAL.ai video responses (for retries)
   - Cache reference images locally during generation
   - Cache FFmpeg filters for common transitions

3. **Job Prioritization**:
   - Critical path: User-requested generations (priority: high)
   - Background: Quality verification (priority: medium)
   - Deferred: Scene assembly (priority: low until all clips ready)

4. **Storage Optimization**:
   - Store videos in H.264 format (efficient compression)
   - Generate thumbnails on upload (avoid runtime extraction)
   - Use R2 lifecycle policies (delete temp files after 7 days)

5. **CDN Optimization**:
   - Enable R2 public access for video delivery
   - Use Cloudflare Stream for adaptive bitrate streaming
   - Cache video URLs (avoid repeated R2 queries)

### Resource Limits

```typescript
const VIDEO_RESOURCE_LIMITS = {
  maxConcurrentGenerations: 5,          // Parallel FAL.ai requests
  maxVideoSizeMB: 50,                   // Max video file size
  maxVideosPerHour: 50,                 // Rate limit per user
  maxStoragePerProjectGB: 50,           // Storage quota
  r2UploadTimeoutMs: 60000,             // Upload timeout (1 min)
  falGenerationTimeoutMs: 180000,       // Generation timeout (3 min)
  ffmpegTimeoutMs: 120000,              // FFmpeg timeout (2 min)
  maxClipsPerScene: 10                  // Max clips in scene assembly
}
```

---

## Error Handling Strategy

### FAL.ai Video Errors

```typescript
const FAL_VIDEO_ERROR_HANDLERS = {
  RATE_LIMIT_EXCEEDED: {
    action: 'queue',
    delay: 'exponential',
    maxRetries: 5,
    message: 'Generation queue full, retrying...'
  },

  GENERATION_TIMEOUT: {
    action: 'retry',
    reduceQuality: true,
    maxRetries: 2,
    message: 'Generation timeout, retrying with lower quality...'
  },

  INVALID_INPUT: {
    action: 'revise',
    handler: 'sanitizeInput',
    maxRevisions: 3,
    message: 'Invalid input, adjusting parameters...'
  },

  MODEL_UNAVAILABLE: {
    action: 'fallback',
    fallbackModel: 'fal-ai/luma-video-to-video',
    message: 'Primary model unavailable, using fallback...'
  },

  CONTENT_POLICY_VIOLATION: {
    action: 'fail',
    notify: true,
    message: 'Content violates policy, cannot generate'
  }
}
```

### FFmpeg Errors

```typescript
const FFMPEG_ERROR_HANDLERS = {
  ENCODING_FAILED: {
    action: 'retry',
    adjustCodec: true,
    maxRetries: 2,
    message: 'Encoding failed, trying different codec...'
  },

  MEMORY_EXCEEDED: {
    action: 'optimize',
    reduceResolution: true,
    message: 'Memory exceeded, reducing resolution...'
  },

  INVALID_FILTER: {
    action: 'simplify',
    removeComplexFilters: true,
    message: 'Filter error, simplifying effects...'
  }
}
```

### Graceful Degradation

```typescript
// Example: Scene assembly with partial clip failures

async function assembleSceneWithDegradation(params: SceneAssemblyParams) {
  try {
    // Attempt full scene assembly
    return await assembleScene(params)
  } catch (error) {
    if (error.code === 'PARTIAL_CLIP_FAILURE') {
      // If most clips succeeded, create partial scene
      if (error.successCount >= Math.ceil(params.clips.length * 0.8)) {
        return {
          ...error.partialResult,
          status: 'partial',
          warning: `Only ${error.successCount}/${params.clips.length} clips assembled`,
          missingClips: error.failedClips
        }
      }
    }

    // If < 80% clips succeeded, fail gracefully
    throw new Error(
      `Scene assembly failed: only ${error.successCount}/${params.clips.length} clips available`
    )
  }
}
```

---

## Security Considerations

### API Key Management

```typescript
// Environment variables
const VIDEO_CONFIG = {
  falApiKey: process.env.FAL_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  r2AccessKey: process.env.R2_ACCESS_KEY_ID,
  r2SecretKey: process.env.R2_SECRET_ACCESS_KEY,
  redisUrl: process.env.REDIS_URL
}

// Validate on startup
if (!VIDEO_CONFIG.falApiKey || !VIDEO_CONFIG.elevenLabsApiKey) {
  throw new Error('Missing required API keys for video generation')
}
```

### Content Policy Enforcement

```typescript
// Sanitize prompts and inputs
function sanitizeVideoInput(input: any): any {
  // Remove potentially problematic content
  const blocked = ['explicit', 'violent', 'illegal', 'harmful']

  for (const field of ['prompt', 'action', 'motion']) {
    if (input[field]) {
      for (const term of blocked) {
        if (input[field].toLowerCase().includes(term)) {
          throw new VideoGenerationError({
            code: 'INVALID_INPUT',
            message: `Input contains blocked term: ${term}`
          })
        }
      }
    }
  }

  return input
}
```

### Access Control

```typescript
// Verify user access before video operations
async function verifyVideoAccess(userId: string, videoId: string) {
  const video = await getMediaById(videoId)

  if (!video) {
    throw new Error('Video not found')
  }

  const project = await getProject(video.projectId)

  if (project.createdBy !== userId && !project.collaborators.includes(userId)) {
    throw new Error('Access denied: not authorized for this project')
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Test video generation
describe('Video Generation', () => {
  test('generates text-to-video successfully', async () => {
    const result = await generateVideo({
      method: 'text-to-video',
      prompt: 'Character walks forward',
      duration: 7
    })

    expect(result.videoUrl).toBeDefined()
    expect(result.duration).toBeLessThanOrEqual(7)
    expect(result.method).toBe('text-to-video')
  })

  test('generates composite-to-video with references', async () => {
    // Create test composite
    const composite = await createTestComposite()

    const result = await generateVideo({
      method: 'composite-to-video',
      compositeImage: composite.mediaId,
      action: 'Character walks',
      duration: 5,
      characterReference: 'ref_char_001'
    })

    expect(result.videoUrl).toBeDefined()
    expect(result.duration).toBe(5)
  })
})

// Test scene assembly
describe('Scene Assembly', () => {
  test('assembles 5 clips into 30s scene', async () => {
    const clips = await createTestClips(5, 7)  // 5 clips, 7s each

    const result = await assembleScene({
      sceneId: 'scene_test',
      clips: clips.map((c, i) => ({
        clipId: c.mediaId,
        sequence: i + 1,
        duration: i < 4 ? 7 : 2  // Last clip is 2s
      })),
      transitions: [
        { fromClip: 1, toClip: 2, type: 'fade', duration: 0.5 },
        { fromClip: 2, toClip: 3, type: 'cut', duration: 0 }
      ]
    })

    expect(result.duration).toBe(30)
    expect(result.clipCount).toBe(5)
  }, 120000)  // 2 minute timeout
})

// Test quality verification
describe('Video Quality Verification', () => {
  test('checks character consistency', async () => {
    const video = await generateTestVideo()
    const reference = await getTestReference()

    const result = await verifyVideoQuality({
      videoId: video.mediaId,
      checkTypes: ['character-consistency'],
      characterReference: reference.mediaId,
      expectedDuration: 7
    })

    expect(result.checks).toHaveLength(1)
    expect(result.checks[0].type).toBe('character-consistency')
    expect(result.checks[0].score).toBeGreaterThan(0.7)
  })
})
```

### Integration Tests

```typescript
// Test complete video generation pipeline
describe('Complete Video Pipeline', () => {
  test('generates and stores video with quality check', async () => {
    const result = await generateVideo({
      method: 'text-to-video',
      prompt: 'Cyberpunk detective walks',
      duration: 7,
      quality: 'standard',
      characterReference: 'ref_sarah_001'
    })

    // Verify video generated
    expect(result.videoId).toBeDefined()

    // Verify stored in R2
    const video = await getMediaById(result.videoId)
    expect(video.url).toContain('r2.dev')

    // Verify quality check ran
    expect(result.qualityScore).toBeGreaterThan(0.7)

    // Verify Brain relationships
    const relationships = await getBrainRelationships(result.videoId)
    expect(relationships).toContainEqual({
      type: 'USES_CHARACTER_REFERENCE',
      toId: 'ref_sarah_001'
    })
  }, 180000)  // 3 minute timeout
})

// Test scene assembly with audio
describe('Scene Assembly with Audio', () => {
  test('assembles scene with dialogue', async () => {
    // Generate test clips
    const clips = await generateTestClips(3)

    // Generate dialogue
    const dialogue = await generateDialogue({
      characterId: 'char_001',
      text: 'This is a test line'
    })

    // Assemble scene
    const result = await assembleScene({
      sceneId: 'scene_test',
      clips: clips.map((c, i) => ({ clipId: c.mediaId, sequence: i + 1 })),
      audio: [{
        type: 'dialogue',
        audioId: dialogue.audioId,
        startTime: 2.0,
        volume: 1.0
      }]
    })

    expect(result.audioTrackCount).toBe(1)
    expect(result.duration).toBeGreaterThan(0)
  }, 180000)
})
```

---

## Deployment Requirements

### Environment Variables

```bash
# FAL.ai Video Configuration
FAL_API_KEY=your_fal_api_key
FAL_BASE_URL=https://fal.run
FAL_RATE_LIMIT_PER_MINUTE=60

# Video Models
FAL_AI_TEXT_TO_VIDEO=fal-ai/minimax-video
FAL_AI_IMAGE_TO_VIDEO=fal-ai/kling-video/v1/standard/image-to-video
FAL_AI_FIRST_LAST_TO_VIDEO=fal-ai/runway-gen3/turbo/image-to-video
FAL_AI_VIDEO_TO_VIDEO=fal-ai/luma-video-to-video

# ElevenLabs Voice Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_BASE_URL=https://api.elevenlabs.io

# R2 Storage (from Phase 5)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=aladdin-media
R2_PUBLIC_DOMAIN=https://media.aladdin.app

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# Video Generation Settings
VIDEO_MAX_SIZE_MB=50
VIDEO_DEFAULT_DURATION=7
VIDEO_DEFAULT_FPS=24
VIDEO_DEFAULT_RESOLUTION=1920x1080
VIDEO_GENERATION_TIMEOUT_MS=180000
FFMPEG_TIMEOUT_MS=120000
```

### Dependencies

```json
{
  "dependencies": {
    "@fal-ai/serverless-client": "^0.9.0",
    "@aws-sdk/client-s3": "^3.450.0",
    "bullmq": "^5.0.0",
    "ioredis": "^5.3.2",
    "elevenlabs": "^0.4.0",
    "fluent-ffmpeg": "^2.1.2",
    "socket.io": "^4.6.0",
    "sharp": "^0.32.6"
  },
  "devDependencies": {
    "@ffmpeg-installer/ffmpeg": "^1.1.0"
  }
}
```

### Infrastructure

1. **Cloudflare R2**:
   - Bucket: `aladdin-media` (from Phase 5)
   - Public access enabled
   - Lifecycle: Delete temp files after 7 days
   - Video storage quota: 50GB per project

2. **Redis**:
   - Instance: Redis 7.0+
   - Memory: 2GB minimum
   - Persistence: RDB + AOF
   - Used for BullMQ job queue

3. **FAL.ai Account**:
   - Plan: Pro (for higher rate limits)
   - Models: minimax-video, kling-video, runway-gen3
   - Rate limit: 60 requests/minute

4. **ElevenLabs Account**:
   - Plan: Creator+ (for voice cloning)
   - Character limit: 100,000/month
   - Voice creation enabled

5. **FFmpeg**:
   - Version: 6.0+ with libx264
   - Installed on server/container
   - GPU acceleration: Optional (NVENC for faster encoding)

---

## Migration Path from Phase 5

### Week 21: Infrastructure & Core Services

1. Set up ElevenLabs account and API key
2. Install Redis and configure BullMQ
3. Install FFmpeg with required codecs
4. Implement FAL.ai video client extension
5. Implement video generation service layer (4 methods)
6. Test each generation method individually

### Week 22: Scene Assembly & Audio

1. Implement scene assembly service with FFmpeg
2. Implement transition effects
3. Implement audio sync logic
4. Implement ElevenLabs voice integration
5. Test scene assembly with audio

### Week 23: Department & Specialists

1. Implement Video Department Head
2. Implement 4 video specialists:
   - Video Generator
   - Scene Assembler
   - Quality Verifier
   - Audio Integrator
3. Test department coordination

### Week 24: API Routes & Job Queue

1. Implement API routes (5 endpoints)
2. Implement job queue system with BullMQ
3. Implement webhook support
4. Implement progress tracking (WebSockets)
5. Test complete workflows

### Week 25: Integration Testing

1. Integration with Phase 5 (reference retrieval)
2. End-to-end testing (request → video → storage)
3. Performance testing (parallel jobs)
4. Error handling testing

---

## Success Criteria

### Phase 6 Complete When:

- [ ] All 4 video generation methods functional
- [ ] Videos ≤ 7 seconds generated successfully
- [ ] Scene assembly works (5 clips → 30s scene)
- [ ] Audio integration functional (dialogue + music + SFX)
- [ ] Quality verification catches inconsistencies
- [ ] All videos stored in R2 with CDN URLs
- [ ] API routes functional and tested
- [ ] Job queue processes videos asynchronously
- [ ] Webhook notifications work
- [ ] Progress tracking real-time via WebSockets
- [ ] Integration with Phase 5 references works
- [ ] Performance meets targets (< 90s for 7s video)
- [ ] Error handling graceful (retry, fallback, degradation)

---

## Future Enhancements (Phase 7+)

### Advanced Video Features

- **Custom LoRA Training**: Train video LoRA from character footage
- **Motion Capture**: Use motion data for character animation
- **Multi-Character Scenes**: Handle 3+ characters in single video
- **Camera Control**: Precise camera movement specifications
- **Advanced Editing**: Cuts, dissolves, wipes, effects

### Performance Optimizations

- **GPU Acceleration**: Use NVENC for faster FFmpeg encoding
- **Streaming**: Cloudflare Stream for adaptive bitrate
- **Preview Generation**: Low-res previews before full render
- **Incremental Rendering**: Render scenes incrementally as clips complete

---

## Conclusion

Phase 6 architecture provides a complete video generation and assembly pipeline that:

1. **Extends Phase 5**: Leverages master references and 360° profiles for visual consistency
2. **Four Generation Methods**: Text-to-video, image-to-video, first-last frame, composite-to-video
3. **Scene Assembly**: Multi-clip assembly with transitions and audio integration
4. **Voice Integration**: Character dialogue via ElevenLabs with voice profiles
5. **Async Processing**: Job queue with progress tracking and webhooks
6. **Quality Assurance**: Automated consistency verification against references
7. **Scalable Architecture**: Handles parallel generation and assembly
8. **Error Resilient**: Graceful degradation and retry logic

This architecture enables the creation of complete 30+ second scenes from multiple 7-second clips, with consistent characters, smooth transitions, and integrated audio.

---

**Architecture Status**: ✅ DESIGN COMPLETE - Ready for Implementation

**Next Steps**:
1. Review architecture with team
2. Begin Week 21 infrastructure setup
3. Implement FAL.ai video client extension
4. Test video generation methods
5. Implement scene assembly pipeline
6. Integrate ElevenLabs voice generation
7. Build Video Department and specialists
8. Test complete workflows

---

**Architect**: System Architecture Designer (Hive Mind Swarm)
**Reviewed By**: [Pending]
**Approved By**: [Pending]
**Implementation Start**: Week 21
