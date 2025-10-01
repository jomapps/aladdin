# Phase 5: Image Generation Architecture

**Architect**: System Architecture Designer (Hive Mind Swarm)
**Date**: 2025-10-01
**Status**: Design Complete
**Phase**: 5 - Image Generation Integration (FAL.ai + R2 Storage)
**Dependencies**: Phase 4 (Multi-Department Architecture)

---

## Executive Summary

Phase 5 extends the Image Quality Department (Phase 4) with actual image generation capabilities using FAL.ai's API, integrated with Cloudflare R2 storage for persistent media management. This architecture enables the creation of:

1. **Master Reference Images** - Definitive visual representations of characters/locations
2. **360° Profile Generation** - 12-angle turnaround sheets for consistency
3. **Composite Shots** - Multi-element scene composition using references
4. **Consistency Verification** - Automated quality control across generated images

### Key Innovations

1. **Reference-Based Generation**: Master references ensure visual consistency across all subsequent images
2. **Multi-Angle Consistency**: 360° profiles generated with locked visual parameters
3. **Composite Intelligence**: Shot composer integrates multiple elements with lighting/perspective matching
4. **Quality Verification Pipeline**: Automated consistency checking before storage
5. **R2 CDN Integration**: Fast, distributed media delivery with metadata tracking

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Request (Chat API)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Master Orchestrator                           │
│              (Routes to Image Quality Department)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Image Quality Department Head                    │
│           (Spawns specialist agents on-demand)                   │
└──────┬──────────┬──────────┬──────────┬─────────────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────┐
   │Master│  │360°  │  │Shot  │  │Consistency│
   │Ref   │  │Profile│  │Composer│  │Verifier │
   │Gen   │  │Creator│  │      │  │          │
   └──┬───┘  └──┬───┘  └──┬───┘  └──┬───────┘
      │         │         │         │
      │         │         │         │
      └─────────┴─────────┴─────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FAL.ai Client Layer                         │
│  • Request formatting & validation                               │
│  • Model selection (FLUX.1 [dev], LoRA, ControlNet)             │
│  • Rate limiting & queue management                              │
│  • Error handling & retries                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
                   ▼                   ▼
        ┌─────────────────┐  ┌─────────────────┐
        │   FAL.ai API    │  │  Image Storage  │
        │  • FLUX.1 [dev] │  │   (R2 Bucket)   │
        │  • LoRA Models  │  │  • Media files   │
        │  • ControlNet   │  │  • Metadata      │
        └─────────────────┘  │  • CDN URLs      │
                             └─────────┬─────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │  Media Collection     │
                           │  (MongoDB + Neo4j)    │
                           │  • Media metadata     │
                           │  • Relationships      │
                           │  • Quality scores     │
                           └───────────────────────┘
```

---

## Component Architecture

### 1. FAL.ai Client Layer

**Location**: `/src/lib/fal/`

#### 1.1 Client Configuration (`client.ts`)

```typescript
/**
 * FAL.ai Client Configuration
 * Handles authentication, request formatting, and connection management
 */

interface FalClientConfig {
  apiKey: string
  baseUrl: string
  timeout: number
  maxRetries: number
  rateLimitPerMinute: number
}

interface FalImageRequest {
  model: FalModel
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  numImages?: number
  guidanceScale?: number
  numInferenceSteps?: number
  seed?: number
  enableSafetyChecker?: boolean
  loraWeights?: LoraWeight[]
  controlnetImage?: string
  controlnetConditioningScale?: number
}

type FalModel =
  | 'fal-ai/flux/dev'           // High quality, slower
  | 'fal-ai/flux/schnell'       // Fast, lower quality
  | 'fal-ai/flux-lora'          // Custom LoRA support
  | 'fal-ai/flux-pro'           // Highest quality

interface LoraWeight {
  path: string      // LoRA model path
  scale: number     // Weight influence (0-1)
}

class FalClient {
  private config: FalClientConfig
  private rateLimiter: RateLimiter
  private requestQueue: RequestQueue

  constructor(config: FalClientConfig)

  // Core image generation
  async generateImage(request: FalImageRequest): Promise<FalImageResponse>

  // Batch generation with queue management
  async generateBatch(requests: FalImageRequest[]): Promise<FalImageResponse[]>

  // Check generation status (for async requests)
  async getStatus(requestId: string): Promise<GenerationStatus>

  // Cancel pending request
  async cancelRequest(requestId: string): Promise<void>
}
```

**Key Features**:
- Automatic retry with exponential backoff
- Rate limiting (default: 60 requests/minute)
- Request queue for batch operations
- Error classification (retryable vs permanent)
- Request/response logging for debugging

#### 1.2 Image Generation Service (`generateImage.ts`)

```typescript
/**
 * High-level image generation service
 * Abstracts FAL.ai client for application use
 */

interface GenerateImageOptions {
  prompt: string
  negativePrompt?: string
  width?: number              // Default: 1024
  height?: number             // Default: 1024
  model?: FalModel            // Default: 'fal-ai/flux/dev'
  seed?: number               // For reproducibility
  guidanceScale?: number      // Default: 7.5
  numInferenceSteps?: number  // Default: 50
  customLoRA?: string[]       // Custom LoRA models
}

interface GeneratedImage {
  url: string                 // Temporary FAL.ai URL
  width: number
  height: number
  seed: number                // Actual seed used
  contentType: string
  inferenceTime: number       // Generation time (ms)
}

async function generateImage(
  options: GenerateImageOptions
): Promise<GeneratedImage>

async function generateImageBatch(
  prompts: string[],
  commonOptions: Partial<GenerateImageOptions>
): Promise<GeneratedImage[]>
```

#### 1.3 Rate Limiter (`rateLimiter.ts`)

```typescript
/**
 * Token bucket rate limiter for FAL.ai API
 */

interface RateLimiterConfig {
  tokensPerMinute: number     // Max requests per minute
  burstSize: number           // Max burst requests
  queueTimeout: number        // Max wait time (ms)
}

class RateLimiter {
  private tokens: number
  private lastRefill: number
  private waitQueue: Promise<void>[]

  async acquireToken(): Promise<void>
  releaseToken(): void
  getAvailableTokens(): number
  getQueueSize(): number
}
```

#### 1.4 Error Handling (`errors.ts`)

```typescript
/**
 * FAL.ai specific error types and handlers
 */

class FalApiError extends Error {
  code: FalErrorCode
  retryable: boolean
  statusCode?: number
}

type FalErrorCode =
  | 'RATE_LIMIT_EXCEEDED'      // 429 - wait and retry
  | 'INVALID_PROMPT'           // 400 - fix prompt
  | 'MODEL_UNAVAILABLE'        // 503 - try different model
  | 'AUTHENTICATION_FAILED'    // 401 - check API key
  | 'GENERATION_TIMEOUT'       // 504 - retry with lower steps
  | 'CONTENT_POLICY_VIOLATION' // 422 - adjust prompt
  | 'INTERNAL_ERROR'           // 500 - retry

function handleFalError(error: unknown): FalApiError
function shouldRetry(error: FalApiError): boolean
function getRetryDelay(attempt: number): number
```

---

### 2. Image Generation Service Layer

**Location**: `/src/lib/images/`

#### 2.1 Master Reference Generation (`masterReference.ts`)

```typescript
/**
 * Master Reference Image Generation
 * Creates the definitive visual representation of a character/location
 */

interface MasterReferenceParams {
  subjectType: 'character' | 'location' | 'prop'
  subjectId: string           // Character/location ID
  description: string         // Detailed visual description
  projectId: string
  style?: string              // Art style override
  references?: string[]       // Reference image URLs
}

interface MasterReferenceResult {
  mediaId: string             // Stored media ID
  url: string                 // CDN URL
  prompt: string              // Exact prompt used
  seed: number                // Seed for reproducibility
  specifications: VisualSpecifications
  qualityScore: number
}

interface VisualSpecifications {
  // Character-specific
  faceStructure?: string
  eyeColor?: string           // Hex code
  hairColor?: string          // Hex code
  hairStyle?: string
  skinTone?: string           // Hex code
  bodyType?: string
  height?: string
  costume?: CostumeSpec

  // Location-specific
  environment?: string
  lighting?: LightingSpec
  colorPalette?: string[]

  // Universal
  artStyle: string
  technicalSpecs: TechnicalSpec
}

async function generateMasterReference(
  params: MasterReferenceParams
): Promise<MasterReferenceResult>

// Generate with Brain context
async function generateMasterReferenceWithContext(
  params: MasterReferenceParams,
  brainContext: BrainQueryResult
): Promise<MasterReferenceResult>
```

**Generation Workflow**:
1. Query Brain for existing character/location data
2. Build detailed prompt from specifications
3. Generate image via FAL.ai (high quality settings)
4. Download and validate generated image
5. Upload to R2 storage
6. Extract visual specifications from image
7. Store metadata in Media collection
8. Create Brain relationships
9. Return master reference with CDN URL

#### 2.2 360° Profile Generation (`profile360.ts`)

```typescript
/**
 * 360° Profile Generation
 * Creates 12-angle turnaround sheet using master reference
 */

interface Profile360Params {
  masterReferenceId: string   // Master reference media ID
  subjectId: string
  projectId: string
  angles?: number[]           // Default: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
  resolution?: 'standard' | 'high'
}

interface Profile360Result {
  collectionId: string        // Collection ID for all 12 images
  images: AngleImage[]
  consistency: ConsistencyReport
  masterReferenceUsed: string
}

interface AngleImage {
  mediaId: string
  url: string
  angle: number               // Degrees from front (0°)
  seed: number
  qualityScore: number
}

interface ConsistencyReport {
  overallScore: number        // 0-1
  colorConsistency: number    // 0-1
  proportionConsistency: number
  featureConsistency: number
  issues: ConsistencyIssue[]
}

async function generate360Profile(
  params: Profile360Params
): Promise<Profile360Result>

// Generate with locked parameters from master reference
async function generate360ProfileWithLocking(
  params: Profile360Params,
  visualSpecs: VisualSpecifications
): Promise<Profile360Result>
```

**Generation Workflow**:
1. Retrieve master reference from R2
2. Extract visual specifications from master
3. Build base prompt with locked parameters
4. Generate 12 images in parallel (or batched):
   - Angle 0° (front): "front view, facing camera"
   - Angle 30°: "front-right 3/4 view"
   - Angle 60°: "right 3/4 view"
   - ... (continue for all 12 angles)
5. Download all generated images
6. Run consistency verification
7. Upload all to R2 in collection
8. Store metadata and relationships
9. Return profile with consistency report

#### 2.3 Composite Shot Generation (`compositeShot.ts`)

```typescript
/**
 * Composite Shot Generation
 * Creates final scene images using multiple references
 */

interface CompositeShotParams {
  description: string         // Scene description
  references: ReferenceSet
  projectId: string
  lighting?: LightingSpec
  cameraAngle?: CameraAngle
  resolution?: ImageResolution
}

interface ReferenceSet {
  characters: CharacterReference[]
  location?: string           // Location reference ID
  props?: string[]            // Prop reference IDs
  style?: string              // Style reference ID
}

interface CharacterReference {
  referenceId: string         // Master reference or specific angle
  position: Position
  scale: number               // Relative scale (0.5 = half size)
  pose?: string              // Pose description
}

interface CompositeShotResult {
  mediaId: string
  url: string
  layers: LayerInfo[]
  compositePrompt: string
  consistencyScores: Record<string, number>
  qualityScore: number
}

async function generateCompositeShot(
  params: CompositeShotParams
): Promise<CompositeShotResult>

// Multi-stage generation with ControlNet
async function generateCompositeShotWithControlNet(
  params: CompositeShotParams,
  controlNetImages: string[]
): Promise<CompositeShotResult>
```

**Generation Workflow**:
1. Retrieve all reference images from R2
2. Extract visual specifications from each reference
3. Build composite prompt integrating all elements:
   - Character descriptions with exact visual specs
   - Location/environment description
   - Lighting and mood specifications
   - Camera angle and framing
4. Generate initial composite via FAL.ai
5. (Optional) Use ControlNet for precise positioning
6. Download and validate composite
7. Run consistency checks against references
8. Upload to R2
9. Store metadata with reference links
10. Return composite with quality scores

#### 2.4 Consistency Verification (`consistencyVerifier.ts`)

```typescript
/**
 * Consistency Verification Service
 * Validates visual consistency across generated images
 */

interface ConsistencyCheckParams {
  newImageId: string          // Image to verify
  referenceSetId: string      // Master reference or collection
  checkType: ConsistencyCheckType
  threshold?: number          // Minimum score (default: 0.7)
}

type ConsistencyCheckType =
  | 'color'                   // Color palette consistency
  | 'proportion'              // Body/object proportions
  | 'features'                // Specific features (eyes, hair, etc)
  | 'style'                   // Art style consistency
  | 'all'                     // Comprehensive check

interface ConsistencyResult {
  passed: boolean
  overallConsistency: number  // 0-1
  checks: ConsistencyCheck[]
  recommendations: string[]
}

interface ConsistencyCheck {
  type: ConsistencyCheckType
  score: number               // 0-1
  passed: boolean
  details: string
  issues?: ConsistencyIssue[]
}

interface ConsistencyIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  type: string
  description: string
  suggestion: string
}

async function verifyConsistency(
  params: ConsistencyCheckParams
): Promise<ConsistencyResult>

// Compare two specific images
async function compareImages(
  imageId1: string,
  imageId2: string,
  checkTypes: ConsistencyCheckType[]
): Promise<ConsistencyResult>
```

**Verification Methods**:
1. **Color Consistency**: Extract and compare color palettes
2. **Proportion Consistency**: Analyze body/object ratios
3. **Feature Consistency**: Check specific visual elements
4. **Style Consistency**: Validate art style coherence

---

### 3. Storage Integration Layer

**Location**: `/src/lib/storage/`

#### 3.1 R2 Storage Client (`r2Client.ts`)

```typescript
/**
 * Cloudflare R2 Storage Client
 * Handles image uploads, retrieval, and CDN URL generation
 */

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicDomain: string        // CDN domain
}

interface UploadImageOptions {
  buffer: Buffer
  filename: string
  contentType: string
  metadata: ImageMetadata
  folder?: string             // Optional subfolder
}

interface ImageMetadata {
  projectId: string
  subjectId?: string
  subjectType?: string
  imageType: ImageType
  generationParams: Record<string, any>
  quality: QualityMetrics
}

type ImageType =
  | 'master-reference'
  | 'profile-360'
  | 'composite-shot'
  | 'intermediate'

class R2StorageClient {
  private config: R2Config
  private s3Client: S3Client

  constructor(config: R2Config)

  // Upload image to R2
  async uploadImage(options: UploadImageOptions): Promise<UploadResult>

  // Upload multiple images in batch
  async uploadBatch(images: UploadImageOptions[]): Promise<UploadResult[]>

  // Get CDN URL for stored image
  getCdnUrl(key: string, options?: CdnUrlOptions): string

  // Download image from R2
  async downloadImage(key: string): Promise<Buffer>

  // Delete image from R2
  async deleteImage(key: string): Promise<void>

  // List images by prefix
  async listImages(prefix: string, limit?: number): Promise<ImageInfo[]>
}

interface UploadResult {
  key: string                 // R2 object key
  url: string                 // CDN URL
  size: number                // Bytes
  etag: string
  uploadedAt: Date
}

interface CdnUrlOptions {
  width?: number              // Resize width
  height?: number             // Resize height
  format?: 'webp' | 'avif' | 'jpg'
  quality?: number            // 1-100
  expires?: Date              // Signed URL expiration
}
```

#### 3.2 Image Pipeline (`imagePipeline.ts`)

```typescript
/**
 * Complete image generation and storage pipeline
 * Orchestrates FAL.ai generation → R2 storage → Media collection
 */

interface ImagePipelineParams {
  operation: ImageOperation
  params: any                 // Operation-specific params
  projectId: string
}

type ImageOperation =
  | 'generate-master-reference'
  | 'generate-360-profile'
  | 'generate-composite-shot'
  | 'verify-consistency'

interface ImagePipelineResult {
  success: boolean
  mediaIds: string[]
  urls: string[]
  metadata: ImageMetadata[]
  qualityReport: QualityReport
  errors?: PipelineError[]
}

async function executeImagePipeline(
  params: ImagePipelineParams
): Promise<ImagePipelineResult>
```

**Pipeline Stages**:
1. **Pre-Generation**: Validate params, query Brain context
2. **Generation**: Call FAL.ai with optimized settings
3. **Post-Processing**: Download, validate, optimize images
4. **Storage**: Upload to R2 with metadata
5. **Database**: Store metadata in Media collection
6. **Relationships**: Create Neo4j relationships
7. **Quality Check**: Run consistency verification
8. **Cleanup**: Delete temporary files

#### 3.3 Cleanup Policies (`cleanup.ts`)

```typescript
/**
 * Automated cleanup for temporary and unused images
 */

interface CleanupPolicy {
  temporaryImageTTL: number   // Days before temp deletion
  unusedImageTTL: number      // Days before unused deletion
  maxStorageGB: number        // Trigger cleanup if exceeded
  keepVersions: number        // Max versions to retain
}

async function runCleanupJob(policy: CleanupPolicy): Promise<CleanupReport>

interface CleanupReport {
  temporaryDeleted: number
  unusedDeleted: number
  spaceFreedMB: number
  errors: string[]
}
```

---

### 4. Specialist Agent Integration

**Location**: `/src/agents/specialists/imageQuality/`

All 4 existing specialist agents get enhanced with actual generation capabilities:

#### 4.1 Master Reference Generator (`masterReferenceGenerator.ts`)

**New Custom Tools**:
```typescript
{
  name: 'generate_reference_image',
  description: 'Generate master reference image via FAL.ai',
  parameters: {
    prompt: string
    visualSpecs: VisualSpecifications
    style: string
    seed?: number
  }
}

{
  name: 'save_master_reference',
  description: 'Upload generated image to R2 and store metadata',
  parameters: {
    imageBuffer: Buffer
    metadata: ImageMetadata
  }
}
```

**Enhanced Process**:
1. Receive character/location description from Brain
2. Build detailed prompt with exact specifications
3. Call `generate_reference_image` tool
4. Validate generated image quality
5. Call `save_master_reference` tool
6. Return mediaId and CDN URL to department head

#### 4.2 360° Profile Creator (`profile360Creator.ts`)

**New Custom Tools**:
```typescript
{
  name: 'get_master_reference',
  description: 'Retrieve master reference for base prompt',
  parameters: {
    referenceId: string
  }
}

{
  name: 'generate_turnaround_images',
  description: 'Generate 12-angle turnaround in batch',
  parameters: {
    basePrompt: string
    angles: number[]
    visualSpecs: VisualSpecifications
  }
}

{
  name: 'verify_angle_consistency',
  description: 'Check consistency across all angles',
  parameters: {
    imageIds: string[]
  }
}

{
  name: 'save_profile_360',
  description: 'Save complete 360 profile as collection',
  parameters: {
    images: ImageBuffer[]
    metadata: Profile360Metadata
  }
}
```

**Enhanced Process**:
1. Retrieve master reference via tool
2. Extract locked visual parameters
3. Generate 12 angle-specific prompts
4. Call `generate_turnaround_images` tool (batch)
5. Call `verify_angle_consistency` tool
6. If consistency passes, call `save_profile_360` tool
7. Return collection ID and consistency report

#### 4.3 Shot Composer (`shotComposer.ts`)

**New Custom Tools**:
```typescript
{
  name: 'get_environment_design',
  description: 'Retrieve environment/location reference',
  parameters: {
    locationId: string
  }
}

{
  name: 'get_lighting_design',
  description: 'Retrieve lighting specifications',
  parameters: {
    sceneId: string
  }
}

{
  name: 'composite_image_layers',
  description: 'Generate composite shot with multiple references',
  parameters: {
    description: string
    references: ReferenceSet
    lighting: LightingSpec
  }
}

{
  name: 'save_composite_shot',
  description: 'Save final composite to R2',
  parameters: {
    imageBuffer: Buffer
    metadata: CompositeShotMetadata
  }
}
```

**Enhanced Process**:
1. Retrieve all references (characters, location, props)
2. Extract visual specs from each reference
3. Build composite prompt integrating all elements
4. Call `composite_image_layers` tool
5. Validate consistency against references
6. Call `save_composite_shot` tool
7. Return composite mediaId with quality scores

#### 4.4 Consistency Verifier (`consistencyVerifier.ts`)

**New Custom Tools**:
```typescript
{
  name: 'compare_images',
  description: 'Compare two images for consistency',
  parameters: {
    imageId1: string
    imageId2: string
    checkTypes: ConsistencyCheckType[]
  }
}

{
  name: 'extract_visual_features',
  description: 'Extract visual features for comparison',
  parameters: {
    imageId: string
  }
}

{
  name: 'save_consistency_report',
  description: 'Store consistency report in Brain',
  parameters: {
    report: ConsistencyResult
  }
}
```

**Enhanced Process**:
1. Retrieve images to verify
2. Call `extract_visual_features` for each image
3. Call `compare_images` tool
4. Analyze consistency scores
5. Generate recommendations if issues found
6. Call `save_consistency_report` tool
7. Return pass/fail with detailed report

---

### 5. API Routes

**Location**: `/src/app/api/v1/projects/[id]/images/`

#### 5.1 Generate Master Reference

```typescript
// POST /api/v1/projects/[projectId]/images/generate/master

interface GenerateMasterRequest {
  subjectType: 'character' | 'location' | 'prop'
  subjectId: string
  description: string
  style?: string
  references?: string[]
}

interface GenerateMasterResponse {
  mediaId: string
  url: string
  prompt: string
  seed: number
  specifications: VisualSpecifications
  qualityScore: number
}
```

**Handler**:
1. Validate request body
2. Check project exists and user has access
3. Query Brain for subject context
4. Call Master Reference Generator specialist
5. Return generated reference metadata

#### 5.2 Generate 360° Profile

```typescript
// POST /api/v1/projects/[projectId]/images/generate/profile360

interface Generate360Request {
  masterReferenceId: string
  subjectId: string
  angles?: number[]
  resolution?: 'standard' | 'high'
}

interface Generate360Response {
  collectionId: string
  images: AngleImage[]
  consistency: ConsistencyReport
  masterReferenceUsed: string
}
```

**Handler**:
1. Validate request body
2. Verify master reference exists
3. Call 360° Profile Creator specialist
4. Return profile collection with consistency report

#### 5.3 Generate Composite Shot

```typescript
// POST /api/v1/projects/[projectId]/images/generate/composite

interface GenerateCompositeRequest {
  description: string
  references: ReferenceSet
  lighting?: LightingSpec
  cameraAngle?: CameraAngle
  resolution?: ImageResolution
}

interface GenerateCompositeResponse {
  mediaId: string
  url: string
  layers: LayerInfo[]
  consistencyScores: Record<string, number>
  qualityScore: number
}
```

**Handler**:
1. Validate request body
2. Verify all references exist
3. Call Shot Composer specialist
4. Return composite image with quality metrics

#### 5.4 Verify Consistency

```typescript
// POST /api/v1/projects/[projectId]/images/verify/consistency

interface VerifyConsistencyRequest {
  newImageId: string
  referenceSetId: string
  checkType?: ConsistencyCheckType
  threshold?: number
}

interface VerifyConsistencyResponse {
  passed: boolean
  overallConsistency: number
  checks: ConsistencyCheck[]
  recommendations: string[]
}
```

**Handler**:
1. Validate request body
2. Verify images exist
3. Call Consistency Verifier specialist
4. Return consistency report

#### 5.5 List Generated Images

```typescript
// GET /api/v1/projects/[projectId]/images

interface ListImagesRequest {
  subjectId?: string
  imageType?: ImageType
  limit?: number
  offset?: number
}

interface ListImagesResponse {
  images: ImageInfo[]
  total: number
  hasMore: boolean
}
```

---

### 6. Custom Tools Integration

**Location**: `/src/agents/tools/departments/imageQuality/`

Each tool is a function that agents can call via custom tools framework:

#### 6.1 `generateMasterReference` Tool

```typescript
// File: generateMasterReference.ts

export const generateMasterReferenceTool = {
  name: 'generate_master_reference',
  description: 'Generate master reference image with FAL.ai and store in R2',

  async execute(params: GenerateMasterReferenceParams): Promise<MasterReferenceResult> {
    // 1. Build detailed prompt
    const prompt = buildMasterReferencePrompt(params)

    // 2. Generate via FAL.ai
    const generatedImage = await generateImage({
      prompt,
      model: 'fal-ai/flux/dev',  // High quality
      width: 1024,
      height: 1024,
      guidanceScale: 8.0,
      numInferenceSteps: 50,
      seed: params.seed
    })

    // 3. Download image
    const imageBuffer = await downloadImage(generatedImage.url)

    // 4. Upload to R2
    const uploadResult = await r2Client.uploadImage({
      buffer: imageBuffer,
      filename: `master-ref-${params.subjectId}-${Date.now()}.png`,
      contentType: 'image/png',
      metadata: {
        projectId: params.projectId,
        subjectId: params.subjectId,
        subjectType: params.subjectType,
        imageType: 'master-reference',
        generationParams: { prompt, seed: generatedImage.seed },
        quality: { score: params.qualityScore }
      },
      folder: `projects/${params.projectId}/references`
    })

    // 5. Store metadata in Media collection
    const media = await createMedia({
      projectId: params.projectId,
      url: uploadResult.url,
      type: 'image',
      metadata: {
        subjectId: params.subjectId,
        imageType: 'master-reference',
        prompt,
        seed: generatedImage.seed,
        specifications: params.visualSpecs
      }
    })

    // 6. Create Brain relationships
    await createBrainRelationship({
      fromId: params.subjectId,
      toId: media._id,
      type: 'HAS_MASTER_REFERENCE'
    })

    return {
      mediaId: media._id,
      url: uploadResult.url,
      prompt,
      seed: generatedImage.seed,
      specifications: params.visualSpecs,
      qualityScore: params.qualityScore
    }
  }
}
```

#### 6.2 `generate360Profile` Tool

```typescript
// File: generate360Profile.ts

export const generate360ProfileTool = {
  name: 'generate_360_profile',
  description: 'Generate 12-angle turnaround profile',

  async execute(params: Generate360ProfileParams): Promise<Profile360Result> {
    // 1. Get master reference
    const masterRef = await getMediaById(params.masterReferenceId)
    const visualSpecs = masterRef.metadata.specifications

    // 2. Build base prompt
    const basePrompt = masterRef.metadata.prompt

    // 3. Generate 12 angles in parallel batches
    const angles = params.angles || DEFAULT_360_ANGLES // [0, 30, 60, ...]
    const batchSize = 4
    const allImages: AngleImage[] = []

    for (let i = 0; i < angles.length; i += batchSize) {
      const batch = angles.slice(i, i + batchSize)
      const prompts = batch.map(angle =>
        buildAnglePrompt(basePrompt, angle, visualSpecs)
      )

      const generatedImages = await generateImageBatch(prompts, {
        model: 'fal-ai/flux/dev',
        width: 1024,
        height: 1024,
        seed: masterRef.metadata.seed // Lock seed for consistency
      })

      // Download and upload each angle
      for (let j = 0; j < generatedImages.length; j++) {
        const angle = batch[j]
        const image = generatedImages[j]

        const buffer = await downloadImage(image.url)
        const uploadResult = await r2Client.uploadImage({
          buffer,
          filename: `360-${params.subjectId}-${angle}deg.png`,
          contentType: 'image/png',
          metadata: {
            projectId: params.projectId,
            subjectId: params.subjectId,
            imageType: 'profile-360',
            angle,
            generationParams: { prompt: prompts[j], seed: image.seed }
          },
          folder: `projects/${params.projectId}/360-profiles/${params.subjectId}`
        })

        const media = await createMedia({
          projectId: params.projectId,
          url: uploadResult.url,
          type: 'image',
          metadata: { angle, imageType: 'profile-360' }
        })

        allImages.push({
          mediaId: media._id,
          url: uploadResult.url,
          angle,
          seed: image.seed,
          qualityScore: 0 // Will be set by consistency check
        })
      }
    }

    // 4. Run consistency verification
    const consistency = await verifyConsistency({
      newImageId: allImages[0].mediaId,
      referenceSetId: params.masterReferenceId,
      checkType: 'all'
    })

    // 5. Create collection
    const collectionId = await createImageCollection({
      projectId: params.projectId,
      name: `360° Profile - ${params.subjectId}`,
      imageIds: allImages.map(img => img.mediaId),
      metadata: {
        masterReference: params.masterReferenceId,
        consistency
      }
    })

    return {
      collectionId,
      images: allImages,
      consistency,
      masterReferenceUsed: params.masterReferenceId
    }
  }
}
```

#### 6.3 `generateCompositeShot` Tool

```typescript
// File: generateCompositeShot.ts

export const generateCompositeShotTool = {
  name: 'generate_composite_shot',
  description: 'Generate composite shot with multiple references',

  async execute(params: GenerateCompositeShotParams): Promise<CompositeShotResult> {
    // 1. Retrieve all references
    const characterRefs = await Promise.all(
      params.references.characters.map(ref => getMediaById(ref.referenceId))
    )

    const locationRef = params.references.location
      ? await getMediaById(params.references.location)
      : null

    // 2. Build composite prompt
    const compositePrompt = buildCompositePrompt({
      description: params.description,
      characters: characterRefs.map((ref, i) => ({
        specs: ref.metadata.specifications,
        position: params.references.characters[i].position,
        pose: params.references.characters[i].pose
      })),
      location: locationRef?.metadata.specifications,
      lighting: params.lighting,
      cameraAngle: params.cameraAngle
    })

    // 3. Generate composite
    const generated = await generateImage({
      prompt: compositePrompt,
      model: 'fal-ai/flux/dev',
      width: params.resolution?.width || 1920,
      height: params.resolution?.height || 1080,
      guidanceScale: 7.5,
      numInferenceSteps: 50
    })

    // 4. Download and upload
    const buffer = await downloadImage(generated.url)
    const uploadResult = await r2Client.uploadImage({
      buffer,
      filename: `composite-${Date.now()}.png`,
      contentType: 'image/png',
      metadata: {
        projectId: params.projectId,
        imageType: 'composite-shot',
        generationParams: { prompt: compositePrompt, seed: generated.seed }
      },
      folder: `projects/${params.projectId}/composites`
    })

    // 5. Store metadata
    const media = await createMedia({
      projectId: params.projectId,
      url: uploadResult.url,
      type: 'image',
      metadata: {
        imageType: 'composite-shot',
        prompt: compositePrompt,
        references: params.references,
        lighting: params.lighting
      }
    })

    // 6. Verify consistency against references
    const consistencyScores: Record<string, number> = {}
    for (const charRef of params.references.characters) {
      const score = await compareImages(
        media._id,
        charRef.referenceId,
        ['color', 'features']
      )
      consistencyScores[charRef.referenceId] = score.overallConsistency
    }

    // 7. Create Brain relationships
    for (const charRef of params.references.characters) {
      await createBrainRelationship({
        fromId: media._id,
        toId: charRef.referenceId,
        type: 'USES_REFERENCE'
      })
    }

    return {
      mediaId: media._id,
      url: uploadResult.url,
      layers: [], // Layer info extracted from generation
      compositePrompt,
      consistencyScores,
      qualityScore: calculateOverallQuality(consistencyScores)
    }
  }
}
```

#### 6.4 `verifyConsistency` Tool

```typescript
// File: verifyConsistency.ts

export const verifyConsistencyTool = {
  name: 'verify_consistency',
  description: 'Verify visual consistency between images',

  async execute(params: VerifyConsistencyParams): Promise<ConsistencyResult> {
    // 1. Retrieve images
    const newImage = await getMediaById(params.newImageId)
    const referenceSet = await getImageCollection(params.referenceSetId)

    // 2. Extract visual features
    const newFeatures = await extractVisualFeatures(newImage.url)
    const refFeatures = await Promise.all(
      referenceSet.images.map(img => extractVisualFeatures(img.url))
    )

    // 3. Run consistency checks
    const checks: ConsistencyCheck[] = []

    // Color consistency
    if (params.checkType === 'all' || params.checkType === 'color') {
      const colorScore = compareColorPalettes(
        newFeatures.colorPalette,
        refFeatures[0].colorPalette
      )
      checks.push({
        type: 'color',
        score: colorScore,
        passed: colorScore >= (params.threshold || 0.7),
        details: `Color palette match: ${(colorScore * 100).toFixed(1)}%`
      })
    }

    // Proportion consistency
    if (params.checkType === 'all' || params.checkType === 'proportion') {
      const proportionScore = compareProportions(
        newFeatures.proportions,
        refFeatures[0].proportions
      )
      checks.push({
        type: 'proportion',
        score: proportionScore,
        passed: proportionScore >= (params.threshold || 0.7),
        details: `Proportion match: ${(proportionScore * 100).toFixed(1)}%`
      })
    }

    // Feature consistency
    if (params.checkType === 'all' || params.checkType === 'features') {
      const featureScore = compareFeatures(
        newFeatures.keyFeatures,
        refFeatures[0].keyFeatures
      )
      checks.push({
        type: 'features',
        score: featureScore,
        passed: featureScore >= (params.threshold || 0.7),
        details: `Feature match: ${(featureScore * 100).toFixed(1)}%`
      })
    }

    // 4. Calculate overall consistency
    const overallConsistency = checks.reduce((sum, c) => sum + c.score, 0) / checks.length
    const passed = checks.every(c => c.passed)

    // 5. Generate recommendations
    const recommendations: string[] = []
    for (const check of checks) {
      if (!check.passed) {
        recommendations.push(
          `Improve ${check.type} consistency (current: ${(check.score * 100).toFixed(1)}%)`
        )
      }
    }

    return {
      passed,
      overallConsistency,
      checks,
      recommendations
    }
  }
}
```

---

## Data Flow Diagrams

### Master Reference Generation Flow

```
User Request (via Chat)
    │
    ▼
Master Orchestrator
    │
    ▼
Image Quality Department Head
    │
    ▼
Master Reference Generator Specialist
    │
    ├─► Query Brain (character data)
    │   └─► Character description, style guide
    │
    ├─► Build detailed prompt with visual specs
    │
    ├─► Call FAL.ai API (FLUX.1 [dev])
    │   ├─► Generate high-quality image
    │   └─► Return temporary URL + seed
    │
    ├─► Download image from FAL.ai
    │
    ├─► Upload to R2
    │   ├─► Store in /projects/{id}/references/
    │   └─► Get CDN URL
    │
    ├─► Create Media document
    │   ├─► Store metadata (prompt, seed, specs)
    │   └─► Store CDN URL
    │
    ├─► Create Brain relationships
    │   └─► Character --HAS_MASTER_REFERENCE--> Media
    │
    └─► Return to Department Head
        ├─► Grade output (quality threshold: 0.90)
        └─► Return to Orchestrator
            └─► Present to user (mediaId, CDN URL)
```

### 360° Profile Generation Flow

```
User Request (via API or Chat)
    │
    ▼
360° Profile Creator Specialist
    │
    ├─► Retrieve Master Reference
    │   ├─► Get visual specifications
    │   └─► Get base prompt template
    │
    ├─► Generate 12 angle prompts
    │   └─► Inject angle descriptions
    │
    ├─► Call FAL.ai in batches (4 images/batch)
    │   ├─► Batch 1: 0°, 30°, 60°, 90°
    │   ├─► Batch 2: 120°, 150°, 180°, 210°
    │   └─► Batch 3: 240°, 270°, 300°, 330°
    │
    ├─► Download all 12 images
    │
    ├─► Upload to R2 in collection folder
    │   └─► /projects/{id}/360-profiles/{subjectId}/
    │
    ├─► Consistency Verification
    │   ├─► Extract visual features from all
    │   ├─► Compare colors, proportions, features
    │   └─► Generate consistency report
    │
    ├─► Create Image Collection
    │   ├─► Link all 12 media documents
    │   └─► Store consistency report
    │
    └─► Return to user
        ├─► Collection ID
        ├─► All 12 CDN URLs
        └─► Consistency report
```

### Composite Shot Generation Flow

```
User Request (scene description + references)
    │
    ▼
Shot Composer Specialist
    │
    ├─► Retrieve all references
    │   ├─► Character master references
    │   ├─► Location reference (if any)
    │   └─► Prop references (if any)
    │
    ├─► Extract visual specifications
    │   ├─► Character: face, hair, costume
    │   ├─► Location: environment, lighting
    │   └─► Props: details, materials
    │
    ├─► Query Brain for additional context
    │   ├─► Lighting specifications
    │   └─► Camera angle specifications
    │
    ├─► Build composite prompt
    │   ├─► Integrate all character specs
    │   ├─► Add location description
    │   ├─► Apply lighting parameters
    │   └─► Set camera angle/framing
    │
    ├─► Generate composite via FAL.ai
    │   ├─► Use FLUX.1 [dev] for quality
    │   └─► Optional: ControlNet for positioning
    │
    ├─► Download composite image
    │
    ├─► Verify consistency against references
    │   ├─► Compare with each character reference
    │   └─► Calculate consistency scores
    │
    ├─► Upload to R2
    │   └─► /projects/{id}/composites/
    │
    ├─► Create Media document
    │   ├─► Store all metadata
    │   └─► Link to references
    │
    ├─► Create Brain relationships
    │   └─► Composite --USES_REFERENCE--> References
    │
    └─► Return to user
        ├─► Composite media ID
        ├─► CDN URL
        └─► Consistency scores
```

---

## Integration with Phase 4 Departments

### Cross-Department Workflow Example

**Scenario**: User requests "Create Sarah character with 360° profile and scene in park"

```
1. Master Orchestrator receives request
   │
   ├─► Routes to Character Department
   │   └─► Character Creator specialist creates:
   │       ├─► Character profile (name, personality, backstory)
   │       ├─► Visual description (appearance, costume)
   │       └─► Saves to Brain
   │
   ├─► Routes to Image Quality Department (waits for Character)
   │   │
   │   ├─► Master Reference Generator specialist:
   │   │   ├─► Queries Brain for character data
   │   │   ├─► Generates master reference image
   │   │   └─► Saves to R2 + Brain
   │   │
   │   └─► 360° Profile Creator specialist:
   │       ├─► Uses master reference
   │       ├─► Generates 12-angle turnaround
   │       └─► Saves collection to R2 + Brain
   │
   └─► Routes to Visual Department (waits for Image Quality)
       └─► Cinematographer specialist:
           ├─► Queries Brain for character + 360° profile
           ├─► Designs park scene composition
           └─► Saves scene design to Brain

2. Master Orchestrator aggregates results
   └─► Presents to user:
       ├─► Character profile
       ├─► Master reference (1 image)
       ├─► 360° profile (12 images)
       └─► Scene composition plan
```

### Department Dependencies

```
Character Department (creates character data)
    │
    │ provides character specs
    ▼
Image Quality Department (generates visuals)
    │
    │ provides visual references
    ▼
Visual Department (uses references for scenes)
    │
    │ provides scene compositions
    ▼
Production Department (validates feasibility)
```

---

## Performance Considerations

### Optimization Strategies

1. **Parallel Generation**:
   - 360° profiles: Generate 4 angles at a time (3 batches)
   - Multiple characters: Generate master references in parallel
   - Batch uploads to R2 (up to 10 images at once)

2. **Caching**:
   - Cache master references (avoid regeneration)
   - Cache visual specifications (reuse for consistency)
   - Cache FAL.ai responses (for retry scenarios)

3. **Rate Limiting**:
   - FAL.ai: 60 requests/minute (free tier)
   - Implement queue for burst requests
   - Prioritize critical requests (master references > variants)

4. **Storage Optimization**:
   - Store images in WebP format (30% smaller than PNG)
   - Generate thumbnails on upload (avoid runtime resizing)
   - Use R2 lifecycle policies (delete temp images after 7 days)

5. **CDN Optimization**:
   - Enable R2 public access for faster delivery
   - Use Cloudflare Image Resizing for on-demand variants
   - Cache CDN URLs (avoid repeated R2 queries)

### Performance Metrics

| Operation | Target Time | Max Time |
|-----------|------------|----------|
| Master Reference Generation | 8-12s | 20s |
| 360° Profile (12 images) | 45-60s | 90s |
| Composite Shot | 10-15s | 25s |
| Consistency Verification | 2-5s | 10s |
| R2 Upload (1 image) | 1-2s | 5s |
| R2 Upload (batch 12) | 5-8s | 15s |

### Resource Limits

```typescript
const RESOURCE_LIMITS = {
  maxConcurrentFalRequests: 10,     // Parallel FAL.ai requests
  maxImageSizeMB: 10,                // Max image file size
  max360ProfilesPerHour: 20,         // Rate limit profiles
  maxStoragePerProjectGB: 10,        // Storage quota
  r2UploadTimeoutMs: 30000,          // Upload timeout
  falGenerationTimeoutMs: 60000      // Generation timeout
}
```

---

## Error Handling Strategy

### FAL.ai Error Scenarios

```typescript
const FAL_ERROR_HANDLERS = {
  RATE_LIMIT_EXCEEDED: {
    action: 'retry',
    delay: 'exponential',
    maxRetries: 5,
    message: 'FAL.ai rate limit exceeded, retrying...'
  },

  INVALID_PROMPT: {
    action: 'revise',
    handler: 'sanitizePrompt',
    maxRevisions: 3,
    message: 'Prompt violated content policy, revising...'
  },

  MODEL_UNAVAILABLE: {
    action: 'fallback',
    fallbackModel: 'fal-ai/flux/schnell',
    message: 'Primary model unavailable, using fallback...'
  },

  GENERATION_TIMEOUT: {
    action: 'retry',
    reducedSteps: true,
    maxRetries: 2,
    message: 'Generation timeout, reducing inference steps...'
  },

  INTERNAL_ERROR: {
    action: 'retry',
    delay: 'exponential',
    maxRetries: 3,
    message: 'FAL.ai internal error, retrying...'
  }
}
```

### Storage Error Scenarios

```typescript
const STORAGE_ERROR_HANDLERS = {
  UPLOAD_FAILED: {
    action: 'retry',
    maxRetries: 3,
    message: 'R2 upload failed, retrying...'
  },

  QUOTA_EXCEEDED: {
    action: 'cleanup',
    handler: 'runCleanupJob',
    message: 'Storage quota exceeded, cleaning up...'
  },

  NETWORK_ERROR: {
    action: 'retry',
    delay: 'exponential',
    maxRetries: 5,
    message: 'Network error, retrying...'
  }
}
```

### Graceful Degradation

```typescript
// Example: 360° profile generation with partial failure

async function generate360ProfileWithDegradation(params) {
  try {
    // Attempt full 12-angle generation
    return await generate360Profile(params)
  } catch (error) {
    if (error.code === 'PARTIAL_GENERATION_FAILURE') {
      // If some angles succeeded, return partial profile
      if (error.successCount >= 8) {
        return {
          ...error.partialResult,
          status: 'partial',
          warning: `Only ${error.successCount}/12 angles generated successfully`
        }
      }
    }

    // If < 8 angles succeeded, try simplified 8-angle profile
    return await generate360ProfileSimplified(params)
  }
}
```

---

## Security Considerations

### API Key Management

```typescript
// Environment variables (never commit)
const FAL_CONFIG = {
  apiKey: process.env.FAL_API_KEY,              // FAL.ai API key
  r2AccessKey: process.env.R2_ACCESS_KEY_ID,    // R2 access key
  r2SecretKey: process.env.R2_SECRET_ACCESS_KEY // R2 secret key
}

// Validate keys on startup
if (!FAL_CONFIG.apiKey) {
  throw new Error('FAL_API_KEY not configured')
}
```

### Content Policy Enforcement

```typescript
// Sanitize prompts before sending to FAL.ai
function sanitizePrompt(prompt: string): string {
  // Remove potentially problematic content
  const blocked = ['explicit', 'violent', 'illegal']

  for (const term of blocked) {
    if (prompt.toLowerCase().includes(term)) {
      throw new FalApiError({
        code: 'INVALID_PROMPT',
        message: `Prompt contains blocked term: ${term}`
      })
    }
  }

  return prompt
}
```

### Access Control

```typescript
// Verify user has access to project before generating images
async function verifyProjectAccess(userId: string, projectId: string) {
  const project = await getProject(projectId)

  if (!project) {
    throw new Error('Project not found')
  }

  if (project.createdBy !== userId && !project.collaborators.includes(userId)) {
    throw new Error('Access denied')
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Test FAL.ai client
describe('FalClient', () => {
  test('generates image successfully', async () => {
    const result = await falClient.generateImage({
      prompt: 'Test character',
      model: 'fal-ai/flux/dev',
      width: 1024,
      height: 1024
    })

    expect(result.url).toBeDefined()
    expect(result.seed).toBeGreaterThan(0)
  })

  test('handles rate limit gracefully', async () => {
    // Mock rate limit error
    mockFalApi.mockRateLimitError()

    const result = await falClient.generateImage({
      prompt: 'Test',
      model: 'fal-ai/flux/dev'
    })

    // Should retry and succeed
    expect(result.url).toBeDefined()
  })
})

// Test R2 storage
describe('R2StorageClient', () => {
  test('uploads image successfully', async () => {
    const buffer = await fs.readFile('test-image.png')

    const result = await r2Client.uploadImage({
      buffer,
      filename: 'test.png',
      contentType: 'image/png',
      metadata: { projectId: 'test-proj' }
    })

    expect(result.url).toContain('r2.dev')
    expect(result.key).toBeDefined()
  })

  test('generates CDN URL correctly', () => {
    const url = r2Client.getCdnUrl('projects/test/image.png', {
      width: 500,
      format: 'webp'
    })

    expect(url).toContain('w=500')
    expect(url).toContain('format=webp')
  })
})
```

### Integration Tests

```typescript
// Test complete master reference generation pipeline
describe('Master Reference Pipeline', () => {
  test('generates and stores master reference', async () => {
    const result = await generateMasterReference({
      subjectType: 'character',
      subjectId: 'char_test_001',
      description: 'Cyberpunk detective Sarah',
      projectId: 'proj_test'
    })

    // Verify image generated
    expect(result.mediaId).toBeDefined()
    expect(result.url).toContain('r2.dev')

    // Verify stored in database
    const media = await getMediaById(result.mediaId)
    expect(media.type).toBe('image')
    expect(media.metadata.imageType).toBe('master-reference')

    // Verify Brain relationship created
    const relationships = await getBrainRelationships('char_test_001')
    expect(relationships).toContainEqual({
      type: 'HAS_MASTER_REFERENCE',
      toId: result.mediaId
    })
  })
})

// Test 360° profile generation
describe('360° Profile Pipeline', () => {
  test('generates complete 360 profile', async () => {
    // First create master reference
    const masterRef = await generateMasterReference({
      subjectType: 'character',
      subjectId: 'char_test_002',
      description: 'Test character',
      projectId: 'proj_test'
    })

    // Generate 360 profile
    const result = await generate360Profile({
      masterReferenceId: masterRef.mediaId,
      subjectId: 'char_test_002',
      projectId: 'proj_test'
    })

    // Verify all 12 angles generated
    expect(result.images).toHaveLength(12)

    // Verify consistency report
    expect(result.consistency.overallScore).toBeGreaterThan(0.7)

    // Verify collection created
    const collection = await getImageCollection(result.collectionId)
    expect(collection.imageIds).toHaveLength(12)
  }, 120000) // 2 minute timeout
})
```

### Performance Tests

```typescript
// Test parallel generation performance
describe('Performance Tests', () => {
  test('generates 4 images in parallel faster than sequential', async () => {
    const prompts = [
      'Character angle 1',
      'Character angle 2',
      'Character angle 3',
      'Character angle 4'
    ]

    // Parallel generation
    const parallelStart = Date.now()
    await generateImageBatch(prompts, { model: 'fal-ai/flux/schnell' })
    const parallelTime = Date.now() - parallelStart

    // Sequential generation
    const sequentialStart = Date.now()
    for (const prompt of prompts) {
      await generateImage({ prompt, model: 'fal-ai/flux/schnell' })
    }
    const sequentialTime = Date.now() - sequentialStart

    // Parallel should be at least 2x faster
    expect(parallelTime).toBeLessThan(sequentialTime / 2)
  })
})
```

---

## Deployment Requirements

### Environment Variables

```bash
# FAL.ai Configuration
FAL_API_KEY=your_fal_api_key_here
FAL_BASE_URL=https://fal.run
FAL_RATE_LIMIT_PER_MINUTE=60

# R2 Storage Configuration
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=aladdin-media
R2_PUBLIC_DOMAIN=https://media.aladdin.app

# Image Generation Settings
IMAGE_MAX_SIZE_MB=10
IMAGE_DEFAULT_WIDTH=1024
IMAGE_DEFAULT_HEIGHT=1024
IMAGE_GENERATION_TIMEOUT_MS=60000
```

### Dependencies

```json
{
  "dependencies": {
    "@fal-ai/serverless-client": "^0.9.0",
    "@aws-sdk/client-s3": "^3.450.0",
    "sharp": "^0.32.6",
    "axios": "^1.6.0"
  }
}
```

### Infrastructure

1. **Cloudflare R2 Bucket**:
   - Bucket name: `aladdin-media`
   - Public access: Enabled (for CDN)
   - Lifecycle policy: Delete temp files after 7 days
   - CORS: Enabled for web uploads

2. **FAL.ai Account**:
   - Plan: Pro (for higher rate limits)
   - Models enabled: FLUX.1 [dev], FLUX.1 [schnell]
   - Custom LoRA: Enabled

3. **MongoDB Collections**:
   - `media`: Image metadata storage
   - `image_collections`: 360° profile collections

4. **Neo4j Relationships**:
   - `HAS_MASTER_REFERENCE`: Character → Media
   - `HAS_360_PROFILE`: Character → ImageCollection
   - `USES_REFERENCE`: CompositeShot → MasterReference

---

## Migration Path from Phase 4

### Step 1: Infrastructure Setup (Week 17)

1. Set up FAL.ai account and obtain API key
2. Create R2 bucket with public access
3. Configure environment variables
4. Install dependencies (`@fal-ai/serverless-client`, `@aws-sdk/client-s3`)

### Step 2: Core Services Implementation (Week 17)

1. Implement FAL.ai client layer:
   - `client.ts` - Client configuration
   - `generateImage.ts` - Image generation service
   - `rateLimiter.ts` - Rate limiting
   - `errors.ts` - Error handling

2. Implement R2 storage client:
   - `r2Client.ts` - Storage operations
   - `imagePipeline.ts` - End-to-end pipeline

### Step 3: Specialist Integration (Week 18)

1. Update existing specialist agents with custom tools:
   - Master Reference Generator + `generate_reference_image` tool
   - 360° Profile Creator + `generate_turnaround_images` tool
   - Shot Composer + `composite_image_layers` tool
   - Consistency Verifier + `compare_images` tool

2. Test each specialist individually

### Step 4: API Routes (Week 18)

1. Implement API routes:
   - POST `/api/v1/projects/[id]/images/generate/master`
   - POST `/api/v1/projects/[id]/images/generate/profile360`
   - POST `/api/v1/projects/[id]/images/generate/composite`
   - POST `/api/v1/projects/[id]/images/verify/consistency`
   - GET `/api/v1/projects/[id]/images`

2. Test API endpoints

### Step 5: Integration Testing (Week 19)

1. Test complete workflows:
   - Master reference generation
   - 360° profile generation
   - Composite shot generation
   - Consistency verification

2. Performance testing:
   - Parallel generation
   - Rate limiting
   - Error handling

### Step 6: UI Integration (Week 20)

1. Update Character Department UI to trigger image generation
2. Display generated images in project view
3. Show consistency reports
4. Enable image regeneration

---

## Success Criteria

### Phase 5 Complete When:

- [ ] FAL.ai client successfully generates images
- [ ] Master references stored in R2 with CDN URLs
- [ ] 360° profiles (12 images) generated with consistency > 0.7
- [ ] Composite shots integrate multiple references
- [ ] Consistency verification detects visual mismatches
- [ ] All images stored in R2 with proper metadata
- [ ] API routes functional and tested
- [ ] Integration with Phase 4 departments works
- [ ] Performance meets targets (< 90s for 360° profile)
- [ ] Error handling graceful (retry, fallback, degradation)

---

## Future Enhancements (Phase 6+)

### Video Generation Integration

- Use master references for video consistency
- Generate character animations with locked appearance
- Composite video shots with multiple characters

### Advanced Features

- **Custom LoRA Training**: Train LoRA models from master references
- **Style Transfer**: Apply consistent art style across all images
- **Automated Refinement**: Auto-regenerate low-quality images
- **Version Control**: Track image generations and compare versions
- **Collaborative Editing**: Multiple users refine images together

---

## Conclusion

Phase 5 architecture provides a complete image generation pipeline that:

1. **Ensures Visual Consistency**: Master references + 360° profiles lock visual parameters
2. **Scales Efficiently**: Parallel generation + batch uploads + rate limiting
3. **Integrates Seamlessly**: Plugs into Phase 4 departments with minimal changes
4. **Handles Errors Gracefully**: Retry logic + fallback models + partial success
5. **Optimizes Performance**: Caching + CDN + batch operations

This architecture enables the creation of visually consistent characters and scenes that maintain quality across hundreds of generated images.

---

**Architecture Status**: ✅ DESIGN COMPLETE - Ready for Implementation

**Next Steps**:
1. Review architecture with team
2. Begin Week 17 infrastructure setup
3. Implement FAL.ai client layer
4. Test master reference generation
5. Proceed with 360° profile implementation

---

**Architect**: System Architecture Designer (Hive Mind Swarm)
**Reviewed By**: [Pending]
**Approved By**: [Pending]
**Implementation Start**: Week 17
