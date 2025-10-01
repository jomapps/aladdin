# Phase 8: Advanced Features Architecture
## Final Phase - Enterprise Collaboration & Export

**Version:** 1.0.0
**Date:** 2025-10-01
**Architect:** Hive Mind Swarm
**Status:** Design Complete

---

## Executive Summary

Phase 8 represents the culmination of Aladdin's development, introducing enterprise-grade features that transform the platform from a powerful authoring tool into a collaborative production ecosystem. This phase delivers three critical capabilities:

1. **Content Cloning System** - Deep cloning with intelligent reference rewriting
2. **Video Export Pipeline** - Professional-grade video generation with multi-format support
3. **Team Collaboration Framework** - RBAC-based multi-user workflows

### Key Metrics
- **Components:** 18 new modules across 4 subsystems
- **API Endpoints:** 11 new routes
- **Integration Points:** 7 phases (all previous work)
- **Performance Target:** <5s clone time, <30s export initiation
- **Scalability:** Support 50+ concurrent team members per project

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALADDIN PLATFORM (Phase 8)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Content Clone   │  │  Video Export    │  │ Collaboration │ │
│  │     Engine       │  │    Pipeline      │  │   Framework   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                     │                     │          │
│           └─────────────────────┼─────────────────────┘          │
│                                 │                                │
│                    ┌────────────▼──────────────┐                │
│                    │   Permission Middleware    │                │
│                    │   (RBAC + Audit Trail)     │                │
│                    └────────────┬───────────────┘                │
│                                 │                                │
│        ┌────────────────────────┼────────────────────────┐       │
│        │                        │                        │       │
│  ┌─────▼─────┐          ┌──────▼──────┐         ┌──────▼──────┐│
│  │ PayloadCMS│          │  MongoDB    │         │   Redis     ││
│  │   Team    │          │   Cloning   │         │ Export Queue││
│  │  Fields   │          │  + Activity │         │   (BullMQ)  ││
│  └───────────┘          └─────────────┘         └─────────────┘│
│                                                                   │
│                    ┌─────────────────────┐                       │
│                    │  Cloudflare R2      │                       │
│                    │  (Media + Exports)  │                       │
│                    └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Content Cloning System

### 1.1 Architecture Overview

The cloning system provides deep, intelligent copying of content across projects with automatic reference rewriting and dependency resolution.

#### Component Structure

```
/src/lib/clone/
├── cloneContent.ts          # Main orchestrator
├── cloneStrategies.ts       # Entity-specific strategies
├── referenceResolver.ts     # ID mapping & rewriting
├── cloneTracker.ts          # Audit trail & genealogy
└── types.ts                 # TypeScript interfaces
```

### 1.2 Core Components

#### A. Clone Orchestrator (`cloneContent.ts`)

**Responsibility:** Coordinate entire cloning process with transactional safety

```typescript
interface CloneOperation {
  sourceProjectId: string;
  targetProjectId: string;
  entities: CloneEntity[];
  options: CloneOptions;
}

interface CloneOptions {
  includeMedia: boolean;
  includeBrainGraph: boolean;
  preserveRelationships: boolean;
  updateReferences: boolean;
}

class CloneOrchestrator {
  async clone(operation: CloneOperation): Promise<CloneResult> {
    // Phase 1: Validation
    await this.validateAccess(operation);
    await this.validateDependencies(operation);

    // Phase 2: Dependency Graph
    const graph = await this.buildDependencyGraph(operation.entities);
    const sortedEntities = this.topologicalSort(graph);

    // Phase 3: Cloning (within MongoDB transaction)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const idMap = new Map<string, string>();

      for (const entity of sortedEntities) {
        const strategy = this.getStrategy(entity.type);
        const clonedId = await strategy.clone(entity, idMap, session);
        idMap.set(entity.id, clonedId);
      }

      // Phase 4: Reference Rewriting
      await this.rewriteReferences(sortedEntities, idMap, session);

      // Phase 5: Media Duplication (if enabled)
      if (operation.options.includeMedia) {
        await this.duplicateMedia(sortedEntities, idMap);
      }

      // Phase 6: Brain Graph Cloning (if enabled)
      if (operation.options.includeBrainGraph) {
        await this.cloneBrainGraph(sortedEntities, idMap);
      }

      await session.commitTransaction();

      // Phase 7: Tracking
      await this.trackClone(operation, idMap);

      return { success: true, idMap, clonedEntities: sortedEntities.length };
    } catch (error) {
      await session.abortTransaction();
      throw new CloneError('Clone operation failed', error);
    } finally {
      session.endSession();
    }
  }
}
```

#### B. Clone Strategies (`cloneStrategies.ts`)

**Responsibility:** Entity-specific cloning logic

```typescript
interface CloneStrategy {
  clone(entity: any, idMap: Map<string, string>, session: ClientSession): Promise<string>;
  extractReferences(entity: any): string[];
  rewriteReferences(entity: any, idMap: Map<string, string>): any;
}

class CharacterCloneStrategy implements CloneStrategy {
  async clone(character: Character, idMap: Map, session: ClientSession): Promise<string> {
    const cloned = {
      ...character,
      _id: new mongoose.Types.ObjectId(),
      name: `${character.name} (Copy)`,
      originalCharacterId: character._id,
      clonedAt: new Date(),

      // Preserve attributes
      attributes: { ...character.attributes },

      // Clone media references (IDs updated later)
      profileImage: character.profileImage,
      gallery: [...character.gallery],

      // Clone relationships (IDs rewritten in phase 4)
      relationships: [...character.relationships]
    };

    await Character.create([cloned], { session });
    return cloned._id.toString();
  }

  extractReferences(character: Character): string[] {
    return [
      character.profileImage,
      ...character.gallery,
      ...character.relationships.map(r => r.characterId)
    ].filter(Boolean);
  }

  rewriteReferences(character: Character, idMap: Map): Character {
    return {
      ...character,
      profileImage: idMap.get(character.profileImage) || character.profileImage,
      gallery: character.gallery.map(id => idMap.get(id) || id),
      relationships: character.relationships.map(r => ({
        ...r,
        characterId: idMap.get(r.characterId) || r.characterId
      }))
    };
  }
}

class SceneCloneStrategy implements CloneStrategy {
  async clone(scene: Scene, idMap: Map, session: ClientSession): Promise<string> {
    const cloned = {
      ...scene,
      _id: new mongoose.Types.ObjectId(),
      title: `${scene.title} (Copy)`,
      originalSceneId: scene._id,
      clonedAt: new Date(),

      // Deep clone script with character references
      script: scene.script.map(line => ({
        ...line,
        characterId: line.characterId, // Rewritten in phase 4
        emotions: [...line.emotions]
      })),

      // Clone shots
      shots: scene.shots.map(shot => ({
        ...shot,
        shotId: new mongoose.Types.ObjectId(),
        characterIds: [...shot.characterIds], // Rewritten in phase 4
        locationId: shot.locationId // Rewritten in phase 4
      })),

      // Preserve metadata
      duration: scene.duration,
      beatSheet: { ...scene.beatSheet }
    };

    await Scene.create([cloned], { session });
    return cloned._id.toString();
  }
}

class EpisodeCloneStrategy implements CloneStrategy {
  async clone(episode: Episode, idMap: Map, session: ClientSession): Promise<string> {
    const cloned = {
      ...episode,
      _id: new mongoose.Types.ObjectId(),
      title: `${episode.title} (Copy)`,
      originalEpisodeId: episode._id,
      clonedAt: new Date(),

      // Clone scene references (rewritten in phase 4)
      scenes: [...episode.scenes],

      // Clone timeline
      timeline: episode.timeline.map(event => ({
        ...event,
        sceneId: event.sceneId // Rewritten in phase 4
      })),

      // Preserve metadata
      metadata: { ...episode.metadata },
      status: 'draft' // Reset to draft
    };

    await Episode.create([cloned], { session });
    return cloned._id.toString();
  }
}

class LocationCloneStrategy implements CloneStrategy {
  async clone(location: Location, idMap: Map, session: ClientSession): Promise<string> {
    const cloned = {
      ...location,
      _id: new mongoose.Types.ObjectId(),
      name: `${location.name} (Copy)`,
      originalLocationId: location._id,
      clonedAt: new Date(),

      // Clone images
      images: [...location.images],

      // Preserve descriptions
      description: location.description,
      environmentalDetails: { ...location.environmentalDetails }
    };

    await Location.create([cloned], { session });
    return cloned._id.toString();
  }
}
```

#### C. Reference Resolver (`referenceResolver.ts`)

**Responsibility:** Build dependency graph and rewrite references

```typescript
interface DependencyNode {
  id: string;
  type: string;
  dependencies: string[];
}

class ReferenceResolver {
  buildDependencyGraph(entities: CloneEntity[]): Map<string, DependencyNode> {
    const graph = new Map<string, DependencyNode>();

    for (const entity of entities) {
      const strategy = this.getStrategy(entity.type);
      const references = strategy.extractReferences(entity);

      graph.set(entity.id, {
        id: entity.id,
        type: entity.type,
        dependencies: references.filter(ref =>
          entities.some(e => e.id === ref)
        )
      });
    }

    return graph;
  }

  topologicalSort(graph: Map<string, DependencyNode>): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected: ${nodeId}`);
      }

      visiting.add(nodeId);
      const node = graph.get(nodeId)!;

      for (const depId of node.dependencies) {
        if (graph.has(depId)) {
          visit(depId);
        }
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      sorted.push(nodeId);
    };

    for (const nodeId of graph.keys()) {
      visit(nodeId);
    }

    return sorted;
  }

  async rewriteReferences(
    entities: any[],
    idMap: Map<string, string>,
    session: ClientSession
  ): Promise<void> {
    for (const entity of entities) {
      const strategy = this.getStrategy(entity.type);
      const rewritten = strategy.rewriteReferences(entity, idMap);

      const Model = this.getModel(entity.type);
      await Model.updateOne(
        { _id: rewritten._id },
        { $set: rewritten },
        { session }
      );
    }
  }
}
```

#### D. Clone Tracker (`cloneTracker.ts`)

**Responsibility:** Audit trail and genealogy tracking

```typescript
interface CloneRecord {
  cloneId: string;
  sourceProjectId: string;
  targetProjectId: string;
  clonedEntities: Array<{
    sourceId: string;
    targetId: string;
    type: string;
  }>;
  clonedBy: string;
  clonedAt: Date;
  options: CloneOptions;
}

class CloneTracker {
  async trackClone(operation: CloneOperation, idMap: Map<string, string>): Promise<void> {
    const record: CloneRecord = {
      cloneId: new mongoose.Types.ObjectId().toString(),
      sourceProjectId: operation.sourceProjectId,
      targetProjectId: operation.targetProjectId,
      clonedEntities: Array.from(idMap.entries()).map(([sourceId, targetId]) => ({
        sourceId,
        targetId,
        type: operation.entities.find(e => e.id === sourceId)?.type || 'unknown'
      })),
      clonedBy: operation.userId,
      clonedAt: new Date(),
      options: operation.options
    };

    await CloneLog.create(record);
  }

  async getCloneHistory(entityId: string): Promise<CloneRecord[]> {
    return CloneLog.find({
      $or: [
        { 'clonedEntities.sourceId': entityId },
        { 'clonedEntities.targetId': entityId }
      ]
    }).sort({ clonedAt: -1 });
  }

  async getCloneGenealogy(entityId: string): Promise<{
    ancestors: string[];
    descendants: string[];
  }> {
    // Recursive traversal of clone history
    const ancestors = await this.findAncestors(entityId);
    const descendants = await this.findDescendants(entityId);

    return { ancestors, descendants };
  }
}
```

### 1.3 Media Duplication

**Responsibility:** Duplicate R2 objects for cloned media

```typescript
class MediaDuplicator {
  async duplicateMedia(entities: any[], idMap: Map<string, string>): Promise<void> {
    const mediaIds = this.extractMediaIds(entities);

    for (const mediaId of mediaIds) {
      const media = await Media.findById(mediaId);
      if (!media) continue;

      // Copy R2 object
      const sourceKey = media.r2Key;
      const targetKey = `clones/${new mongoose.Types.ObjectId()}_${media.filename}`;

      await this.r2.copyObject({
        CopySource: `${process.env.R2_BUCKET}/${sourceKey}`,
        Bucket: process.env.R2_BUCKET,
        Key: targetKey
      });

      // Create new media document
      const clonedMedia = await Media.create({
        ...media.toObject(),
        _id: new mongoose.Types.ObjectId(),
        r2Key: targetKey,
        originalMediaId: media._id,
        clonedAt: new Date()
      });

      idMap.set(mediaId, clonedMedia._id.toString());
    }
  }
}
```

### 1.4 Brain Graph Cloning

**Responsibility:** Clone Neo4j knowledge graph

```typescript
class BrainGraphCloner {
  async cloneBrainGraph(entities: any[], idMap: Map<string, string>): Promise<void> {
    const session = this.neo4jDriver.session();

    try {
      // Extract all nodes related to source entities
      const sourceIds = Array.from(idMap.keys());

      const result = await session.run(`
        MATCH (n)
        WHERE n.entityId IN $sourceIds
        OPTIONAL MATCH (n)-[r]->(m)
        RETURN n, collect({rel: r, target: m}) as connections
      `, { sourceIds });

      // Clone nodes with new IDs
      for (const record of result.records) {
        const node = record.get('n');
        const oldEntityId = node.properties.entityId;
        const newEntityId = idMap.get(oldEntityId);

        await session.run(`
          CREATE (n:${node.labels.join(':')})
          SET n = $props
          SET n.entityId = $newEntityId
          SET n.clonedFrom = $oldEntityId
        `, {
          props: { ...node.properties },
          newEntityId,
          oldEntityId
        });

        // Clone relationships
        const connections = record.get('connections');
        for (const conn of connections) {
          const targetId = conn.target.properties.entityId;
          const newTargetId = idMap.get(targetId);

          if (newTargetId) {
            await session.run(`
              MATCH (source {entityId: $sourceId})
              MATCH (target {entityId: $targetId})
              CREATE (source)-[r:${conn.rel.type}]->(target)
              SET r = $relProps
            `, {
              sourceId: newEntityId,
              targetId: newTargetId,
              relProps: conn.rel.properties
            });
          }
        }
      }
    } finally {
      await session.close();
    }
  }
}
```

### 1.5 API Routes

```typescript
// POST /api/v1/projects/[id]/clone/content
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { entities, targetProjectId, options } = await req.json();

  // Validate permissions
  await checkPermission(req, params.id, 'read');
  await checkPermission(req, targetProjectId, 'write');

  const orchestrator = new CloneOrchestrator();
  const result = await orchestrator.clone({
    sourceProjectId: params.id,
    targetProjectId,
    entities,
    options
  });

  return Response.json(result);
}

// POST /api/v1/projects/[id]/clone/batch
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { batches } = await req.json();

  const results = await Promise.all(
    batches.map(batch => orchestrator.clone(batch))
  );

  return Response.json({ results });
}
```

---

## 2. Video Export System

### 2.1 Architecture Overview

Professional-grade video export pipeline with multi-format support, job queuing, and progress tracking.

#### Component Structure

```
/src/lib/export/
├── videoExporter.ts         # Main orchestrator
├── formatHandlers.ts        # Format-specific handlers
├── exportQueue.ts           # BullMQ job queue
├── exportStorage.ts         # Storage management
└── types.ts                 # TypeScript interfaces
```

### 2.2 Export Pipeline Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      VIDEO EXPORT PIPELINE                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. INITIATION                                                    │
│     ├─ Validate project/episode                                  │
│     ├─ Check permissions                                          │
│     └─ Create export job                                          │
│                                                                    │
│  2. SCENE ASSEMBLY                                                │
│     ├─ Load all scenes in episode                                │
│     ├─ Generate video segments (FFmpeg)                          │
│     ├─ Generate audio segments (TTS/Music)                       │
│     └─ Store temp files                                           │
│                                                                    │
│  3. VIDEO COMPOSITION                                             │
│     ├─ Concatenate video segments                                │
│     ├─ Merge audio tracks                                         │
│     ├─ Apply transitions                                          │
│     └─ Add subtitles (optional)                                   │
│                                                                    │
│  4. FORMAT CONVERSION                                             │
│     ├─ MP4 (H.264/H.265)                                          │
│     ├─ WebM (VP8/VP9)                                             │
│     └─ MOV (ProRes)                                               │
│                                                                    │
│  5. UPLOAD & CLEANUP                                              │
│     ├─ Upload to R2                                               │
│     ├─ Generate download URL                                      │
│     ├─ Cleanup temp files                                         │
│     └─ Send webhook notification                                  │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Core Components

#### A. Video Exporter (`videoExporter.ts`)

```typescript
interface ExportJob {
  jobId: string;
  projectId: string;
  episodeId: string;
  format: 'mp4' | 'webm' | 'mov';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  createdBy: string;
  createdAt: Date;
}

interface ExportOptions {
  includeSubtitles: boolean;
  resolution: '720p' | '1080p' | '4k';
  fps: 24 | 30 | 60;
  bitrate?: string;
  audioQuality: 'low' | 'medium' | 'high';
  watermark?: string;
}

class VideoExporter {
  private queue: Queue;
  private formatHandlers: Map<string, FormatHandler>;

  constructor() {
    this.queue = new Queue('video-export', {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    this.formatHandlers = new Map([
      ['mp4', new MP4Handler()],
      ['webm', new WebMHandler()],
      ['mov', new MOVHandler()]
    ]);

    this.initializeWorker();
  }

  async createExportJob(jobData: Omit<ExportJob, 'jobId' | 'status' | 'progress'>): Promise<string> {
    const jobId = new mongoose.Types.ObjectId().toString();

    const job = await this.queue.add('export', {
      ...jobData,
      jobId
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: false,
      removeOnFail: false
    });

    // Store job in MongoDB
    await ExportJob.create({
      jobId,
      ...jobData,
      status: 'pending',
      progress: 0
    });

    return jobId;
  }

  private initializeWorker(): void {
    const worker = new Worker('video-export', async (job) => {
      return this.processExportJob(job.data);
    }, {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
      },
      concurrency: 3
    });

    worker.on('progress', async (job, progress) => {
      await ExportJob.updateOne(
        { jobId: job.data.jobId },
        { $set: { progress } }
      );
    });

    worker.on('completed', async (job) => {
      await ExportJob.updateOne(
        { jobId: job.data.jobId },
        { $set: { status: 'completed', progress: 100 } }
      );
    });

    worker.on('failed', async (job, err) => {
      await ExportJob.updateOne(
        { jobId: job.data.jobId },
        { $set: { status: 'failed', error: err.message } }
      );
    });
  }

  private async processExportJob(jobData: ExportJob): Promise<ExportResult> {
    const workDir = `/tmp/exports/${jobData.jobId}`;
    await fs.mkdir(workDir, { recursive: true });

    try {
      // Phase 1: Scene Assembly (0-40%)
      await this.updateProgress(jobData.jobId, 5);
      const scenes = await this.loadScenes(jobData.episodeId);

      await this.updateProgress(jobData.jobId, 10);
      const videoSegments = await this.generateVideoSegments(scenes, workDir);

      await this.updateProgress(jobData.jobId, 25);
      const audioSegments = await this.generateAudioSegments(scenes, workDir);

      await this.updateProgress(jobData.jobId, 40);

      // Phase 2: Video Composition (40-70%)
      const composedVideo = await this.composeVideo(
        videoSegments,
        audioSegments,
        jobData.options,
        workDir
      );

      await this.updateProgress(jobData.jobId, 70);

      // Phase 3: Format Conversion (70-90%)
      const handler = this.formatHandlers.get(jobData.format)!;
      const finalVideo = await handler.convert(composedVideo, jobData.options);

      await this.updateProgress(jobData.jobId, 90);

      // Phase 4: Upload & Cleanup (90-100%)
      const downloadUrl = await this.uploadToR2(finalVideo, jobData);

      await this.updateProgress(jobData.jobId, 95);
      await this.cleanup(workDir);

      await this.updateProgress(jobData.jobId, 100);

      // Send webhook notification
      if (jobData.webhookUrl) {
        await this.sendWebhook(jobData.webhookUrl, {
          jobId: jobData.jobId,
          status: 'completed',
          downloadUrl
        });
      }

      return { downloadUrl, fileSize: finalVideo.size };
    } catch (error) {
      await this.cleanup(workDir);
      throw error;
    }
  }

  private async generateVideoSegments(scenes: Scene[], workDir: string): Promise<string[]> {
    const segments: string[] = [];

    for (const scene of scenes) {
      const segmentPath = `${workDir}/video_${scene._id}.mp4`;

      // Use FFmpeg to generate video from images/assets
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(scene.backgroundImage || 'default_bg.png')
          .duration(scene.duration)
          .videoCodec('libx264')
          .fps(24)
          .size('1920x1080')
          .output(segmentPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      segments.push(segmentPath);
    }

    return segments;
  }

  private async generateAudioSegments(scenes: Scene[], workDir: string): Promise<string[]> {
    const segments: string[] = [];

    for (const scene of scenes) {
      const segmentPath = `${workDir}/audio_${scene._id}.mp3`;

      // Generate audio from TTS + music
      const dialogue = await this.generateDialogue(scene.script);
      const music = scene.backgroundMusic;

      // Merge dialogue + music
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(dialogue)
          .input(music || 'silence.mp3')
          .complexFilter([
            '[0:a][1:a]amix=inputs=2:duration=longest'
          ])
          .output(segmentPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      segments.push(segmentPath);
    }

    return segments;
  }

  private async composeVideo(
    videoSegments: string[],
    audioSegments: string[],
    options: ExportOptions,
    workDir: string
  ): Promise<string> {
    const outputPath = `${workDir}/composed.mp4`;

    // Create concat file
    const concatFile = `${workDir}/concat.txt`;
    const videoConcat = videoSegments.map(s => `file '${s}'`).join('\n');
    await fs.writeFile(concatFile, videoConcat);

    // Concatenate videos
    const tempVideo = `${workDir}/video_concat.mp4`;
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatFile)
        .inputOptions(['-f concat', '-safe 0'])
        .videoCodec('copy')
        .output(tempVideo)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    // Merge video + audio
    const audioConcat = `${workDir}/audio_concat.mp3`;
    await this.concatenateAudio(audioSegments, audioConcat);

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(tempVideo)
        .input(audioConcat)
        .videoCodec('libx264')
        .audioCodec('aac')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    return outputPath;
  }
}
```

#### B. Format Handlers (`formatHandlers.ts`)

```typescript
interface FormatHandler {
  convert(inputPath: string, options: ExportOptions): Promise<string>;
}

class MP4Handler implements FormatHandler {
  async convert(inputPath: string, options: ExportOptions): Promise<string> {
    const outputPath = inputPath.replace('.mp4', '_final.mp4');

    await new Promise<void>((resolve, reject) => {
      const cmd = ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(this.getResolution(options.resolution))
        .fps(options.fps);

      if (options.bitrate) {
        cmd.videoBitrate(options.bitrate);
      }

      cmd.output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    return outputPath;
  }

  private getResolution(res: string): string {
    const resolutions = {
      '720p': '1280x720',
      '1080p': '1920x1080',
      '4k': '3840x2160'
    };
    return resolutions[res] || '1920x1080';
  }
}

class WebMHandler implements FormatHandler {
  async convert(inputPath: string, options: ExportOptions): Promise<string> {
    const outputPath = inputPath.replace('.mp4', '.webm');

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libvpx-vp9')
        .audioCodec('libopus')
        .size(this.getResolution(options.resolution))
        .fps(options.fps)
        .outputOptions([
          '-crf 30',
          '-b:v 0'
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    return outputPath;
  }
}

class MOVHandler implements FormatHandler {
  async convert(inputPath: string, options: ExportOptions): Promise<string> {
    const outputPath = inputPath.replace('.mp4', '.mov');

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('prores_ks')
        .audioCodec('pcm_s16le')
        .size(this.getResolution(options.resolution))
        .fps(options.fps)
        .outputOptions([
          '-profile:v 3', // ProRes HQ
          '-vendor apl0',
          '-pix_fmt yuv422p10le'
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    return outputPath;
  }
}
```

#### C. Export Storage (`exportStorage.ts`)

```typescript
class ExportStorage {
  private r2: S3Client;

  async uploadToR2(filePath: string, job: ExportJob): Promise<string> {
    const fileStream = fs.createReadStream(filePath);
    const stats = await fs.stat(filePath);

    const key = `exports/${job.projectId}/${job.jobId}.${job.format}`;

    await this.r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: this.getContentType(job.format),
      ContentLength: stats.size,
      Metadata: {
        projectId: job.projectId,
        episodeId: job.episodeId,
        exportedBy: job.createdBy,
        exportedAt: new Date().toISOString()
      }
    }));

    // Generate signed URL (valid for 7 days)
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key
    });

    const signedUrl = await getSignedUrl(this.r2, command, { expiresIn: 604800 });

    return signedUrl;
  }

  async cleanup(workDir: string): Promise<void> {
    await fs.rm(workDir, { recursive: true, force: true });
  }

  private getContentType(format: string): string {
    const types = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime'
    };
    return types[format] || 'application/octet-stream';
  }
}
```

### 2.4 API Routes

```typescript
// POST /api/v1/projects/[id]/export
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { episodeId, format, quality, options } = await req.json();

  await checkPermission(req, params.id, 'export');

  const exporter = new VideoExporter();
  const jobId = await exporter.createExportJob({
    projectId: params.id,
    episodeId,
    format,
    quality,
    options,
    createdBy: req.user.id,
    createdAt: new Date()
  });

  return Response.json({ jobId });
}

// GET /api/v1/projects/[id]/export/[jobId]
export async function GET(req: Request, { params }: { params: { id: string; jobId: string } }) {
  await checkPermission(req, params.id, 'read');

  const job = await ExportJob.findOne({
    jobId: params.jobId,
    projectId: params.id
  });

  if (!job) {
    return Response.json({ error: 'Export job not found' }, { status: 404 });
  }

  return Response.json(job);
}

// GET /api/v1/projects/[id]/export/[jobId]/download
export async function GET(req: Request, { params }: { params: { id: string; jobId: string } }) {
  await checkPermission(req, params.id, 'export');

  const job = await ExportJob.findOne({
    jobId: params.jobId,
    projectId: params.id
  });

  if (!job || job.status !== 'completed') {
    return Response.json({ error: 'Export not ready' }, { status: 400 });
  }

  return Response.redirect(job.downloadUrl);
}
```

---

## 3. Team Collaboration Framework

### 3.1 Architecture Overview

RBAC-based multi-user collaboration with activity tracking and real-time presence.

#### Component Structure

```
/src/lib/collaboration/
├── accessControl.ts         # RBAC implementation
├── teamManager.ts           # Team management
├── activityTracker.ts       # Activity logging
├── presenceManager.ts       # Real-time presence
└── types.ts                 # TypeScript interfaces
```

### 3.2 Role-Based Access Control

#### Role Definitions

```typescript
enum Role {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  COLLABORATOR = 'collaborator'
}

const PERMISSIONS = {
  [Role.OWNER]: [
    'read', 'write', 'delete', 'export',
    'manage_team', 'transfer_ownership',
    'clone', 'publish'
  ],
  [Role.EDITOR]: [
    'read', 'write', 'export', 'clone'
  ],
  [Role.COLLABORATOR]: [
    'read', 'write', 'comment'
  ],
  [Role.VIEWER]: [
    'read', 'comment'
  ]
};

interface TeamMember {
  userId: string;
  role: Role;
  addedBy: string;
  addedAt: Date;
  lastActive?: Date;
}
```

#### Access Control (`accessControl.ts`)

```typescript
class AccessControl {
  async checkPermission(
    userId: string,
    projectId: string,
    permission: string
  ): Promise<boolean> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    // Owner always has permission
    if (project.ownerId === userId) return true;

    // Check team membership
    const member = project.team?.find(m => m.userId === userId);
    if (!member) return false;

    // Check if role has permission
    const rolePermissions = PERMISSIONS[member.role];
    return rolePermissions.includes(permission);
  }

  async requirePermission(
    req: Request,
    projectId: string,
    permission: string
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('Not authenticated');
    }

    const hasPermission = await this.checkPermission(userId, projectId, permission);
    if (!hasPermission) {
      throw new ForbiddenError(`Permission denied: ${permission}`);
    }
  }
}

// Middleware
export async function checkPermission(
  req: Request,
  projectId: string,
  permission: string
): Promise<void> {
  const ac = new AccessControl();
  await ac.requirePermission(req, projectId, permission);
}
```

### 3.3 Team Management

#### Team Manager (`teamManager.ts`)

```typescript
class TeamManager {
  async addMember(
    projectId: string,
    userId: string,
    role: Role,
    addedBy: string
  ): Promise<void> {
    // Validate role
    if (!Object.values(Role).includes(role)) {
      throw new Error('Invalid role');
    }

    // Check if user already in team
    const project = await Project.findById(projectId);
    const existing = project.team?.find(m => m.userId === userId);
    if (existing) {
      throw new Error('User already in team');
    }

    // Add member
    await Project.updateOne(
      { _id: projectId },
      {
        $push: {
          team: {
            userId,
            role,
            addedBy,
            addedAt: new Date()
          }
        }
      }
    );

    // Log activity
    await this.logActivity(projectId, addedBy, 'MEMBER_ADDED', {
      userId,
      role
    });

    // Send notification
    await this.notifyUser(userId, {
      type: 'TEAM_INVITATION',
      projectId,
      role
    });
  }

  async updateRole(
    projectId: string,
    userId: string,
    newRole: Role,
    updatedBy: string
  ): Promise<void> {
    await Project.updateOne(
      { _id: projectId, 'team.userId': userId },
      {
        $set: {
          'team.$.role': newRole,
          'team.$.updatedAt': new Date(),
          'team.$.updatedBy': updatedBy
        }
      }
    );

    await this.logActivity(projectId, updatedBy, 'ROLE_CHANGED', {
      userId,
      newRole
    });
  }

  async removeMember(
    projectId: string,
    userId: string,
    removedBy: string
  ): Promise<void> {
    await Project.updateOne(
      { _id: projectId },
      {
        $pull: {
          team: { userId }
        }
      }
    );

    await this.logActivity(projectId, removedBy, 'MEMBER_REMOVED', {
      userId
    });
  }

  async listTeam(projectId: string): Promise<TeamMember[]> {
    const project = await Project.findById(projectId).populate('team.userId', 'name email avatar');
    return project.team || [];
  }
}
```

### 3.4 Activity Tracking

#### Activity Tracker (`activityTracker.ts`)

```typescript
interface ActivityLog {
  projectId: string;
  userId: string;
  action: ActivityAction;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

enum ActivityAction {
  // Content Actions
  CONTENT_CREATED = 'CONTENT_CREATED',
  CONTENT_UPDATED = 'CONTENT_UPDATED',
  CONTENT_DELETED = 'CONTENT_DELETED',
  CONTENT_CLONED = 'CONTENT_CLONED',

  // Team Actions
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  ROLE_CHANGED = 'ROLE_CHANGED',

  // Export Actions
  EXPORT_STARTED = 'EXPORT_STARTED',
  EXPORT_COMPLETED = 'EXPORT_COMPLETED',
  EXPORT_FAILED = 'EXPORT_FAILED',

  // Project Actions
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_SETTINGS_UPDATED = 'PROJECT_SETTINGS_UPDATED',
  PROJECT_PUBLISHED = 'PROJECT_PUBLISHED'
}

class ActivityTracker {
  async logActivity(log: Omit<ActivityLog, 'timestamp'>): Promise<void> {
    await ActivityLog.create({
      ...log,
      timestamp: new Date()
    });
  }

  async getActivityFeed(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
      actions?: ActivityAction[];
      userId?: string;
    } = {}
  ): Promise<ActivityLog[]> {
    const query: any = { projectId };

    if (options.actions) {
      query.action = { $in: options.actions };
    }

    if (options.userId) {
      query.userId = options.userId;
    }

    return ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(options.limit || 50)
      .skip(options.offset || 0)
      .populate('userId', 'name email avatar');
  }

  async getAuditTrail(
    projectId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ActivityLog[]> {
    const query: any = { projectId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    return ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .populate('userId', 'name email avatar');
  }
}
```

### 3.5 Real-Time Presence (Optional)

#### Presence Manager (`presenceManager.ts`)

```typescript
interface PresenceData {
  userId: string;
  projectId: string;
  status: 'active' | 'away' | 'offline';
  currentPage?: string;
  lastSeen: Date;
}

class PresenceManager {
  private io: Server;
  private presenceStore: Map<string, PresenceData>;

  constructor(io: Server) {
    this.io = io;
    this.presenceStore = new Map();
    this.initializeSocketHandlers();
  }

  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      socket.on('join-project', (data: { userId: string; projectId: string }) => {
        socket.join(`project:${data.projectId}`);

        this.updatePresence({
          userId: data.userId,
          projectId: data.projectId,
          status: 'active',
          lastSeen: new Date()
        });

        this.broadcastPresence(data.projectId);
      });

      socket.on('leave-project', (data: { userId: string; projectId: string }) => {
        socket.leave(`project:${data.projectId}`);

        this.updatePresence({
          userId: data.userId,
          projectId: data.projectId,
          status: 'offline',
          lastSeen: new Date()
        });

        this.broadcastPresence(data.projectId);
      });

      socket.on('page-change', (data: { userId: string; projectId: string; page: string }) => {
        this.updatePresence({
          userId: data.userId,
          projectId: data.projectId,
          status: 'active',
          currentPage: data.page,
          lastSeen: new Date()
        });

        this.broadcastPresence(data.projectId);
      });

      socket.on('disconnect', () => {
        // Mark user as offline after disconnect
        const presence = Array.from(this.presenceStore.values()).find(
          p => p.userId === socket.data.userId
        );

        if (presence) {
          this.updatePresence({
            ...presence,
            status: 'offline',
            lastSeen: new Date()
          });

          this.broadcastPresence(presence.projectId);
        }
      });
    });
  }

  private updatePresence(data: PresenceData): void {
    const key = `${data.projectId}:${data.userId}`;
    this.presenceStore.set(key, data);
  }

  private broadcastPresence(projectId: string): void {
    const presence = Array.from(this.presenceStore.values())
      .filter(p => p.projectId === projectId);

    this.io.to(`project:${projectId}`).emit('presence-update', presence);
  }

  getActiveUsers(projectId: string): PresenceData[] {
    return Array.from(this.presenceStore.values())
      .filter(p => p.projectId === projectId && p.status === 'active');
  }
}
```

### 3.6 API Routes

```typescript
// GET /api/v1/projects/[id]/team
export async function GET(req: Request, { params }: { params: { id: string } }) {
  await checkPermission(req, params.id, 'read');

  const manager = new TeamManager();
  const team = await manager.listTeam(params.id);

  return Response.json({ team });
}

// POST /api/v1/projects/[id]/team
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await checkPermission(req, params.id, 'manage_team');

  const { userId, role } = await req.json();

  const manager = new TeamManager();
  await manager.addMember(params.id, userId, role, req.user.id);

  return Response.json({ success: true });
}

// PUT /api/v1/projects/[id]/team/[userId]
export async function PUT(req: Request, { params }: { params: { id: string; userId: string } }) {
  await checkPermission(req, params.id, 'manage_team');

  const { role } = await req.json();

  const manager = new TeamManager();
  await manager.updateRole(params.id, params.userId, role, req.user.id);

  return Response.json({ success: true });
}

// DELETE /api/v1/projects/[id]/team/[userId]
export async function DELETE(req: Request, { params }: { params: { id: string; userId: string } }) {
  await checkPermission(req, params.id, 'manage_team');

  const manager = new TeamManager();
  await manager.removeMember(params.id, params.userId, req.user.id);

  return Response.json({ success: true });
}

// GET /api/v1/projects/[id]/activity
export async function GET(req: Request, { params }: { params: { id: string } }) {
  await checkPermission(req, params.id, 'read');

  const { limit, offset, actions } = req.query;

  const tracker = new ActivityTracker();
  const activities = await tracker.getActivityFeed(params.id, {
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0,
    actions: actions?.split(',')
  });

  return Response.json({ activities });
}
```

---

## 4. PayloadCMS Updates

### 4.1 Projects Collection Updates

```typescript
// /src/collections/Projects.ts

export const Projects: CollectionConfig = {
  slug: 'projects',
  fields: [
    // ... existing fields ...

    // Team Collaboration Fields
    {
      name: 'team',
      type: 'array',
      label: 'Team Members',
      fields: [
        {
          name: 'userId',
          type: 'relationship',
          relationTo: 'users',
          required: true
        },
        {
          name: 'role',
          type: 'select',
          required: true,
          options: [
            { label: 'Owner', value: 'owner' },
            { label: 'Editor', value: 'editor' },
            { label: 'Collaborator', value: 'collaborator' },
            { label: 'Viewer', value: 'viewer' }
          ]
        },
        {
          name: 'addedBy',
          type: 'relationship',
          relationTo: 'users',
          required: true
        },
        {
          name: 'addedAt',
          type: 'date',
          required: true,
          admin: {
            date: {
              displayFormat: 'MMM dd, yyyy h:mm a'
            }
          }
        },
        {
          name: 'lastActive',
          type: 'date',
          admin: {
            date: {
              displayFormat: 'MMM dd, yyyy h:mm a'
            }
          }
        }
      ]
    },

    // Clone Tracking Fields
    {
      name: 'clonedFrom',
      type: 'group',
      label: 'Clone Source',
      fields: [
        {
          name: 'projectId',
          type: 'relationship',
          relationTo: 'projects',
          label: 'Original Project'
        },
        {
          name: 'clonedAt',
          type: 'date',
          label: 'Cloned At'
        },
        {
          name: 'clonedBy',
          type: 'relationship',
          relationTo: 'users',
          label: 'Cloned By'
        }
      ]
    }
  ],

  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-add owner to team on creation
        if (operation === 'create' && req.user) {
          data.team = data.team || [];
          data.team.push({
            userId: req.user.id,
            role: 'owner',
            addedBy: req.user.id,
            addedAt: new Date()
          });
        }

        return data;
      }
    ],

    afterRead: [
      async ({ doc, req }) => {
        // Filter team members based on permissions
        if (doc.team && req.user) {
          const ac = new AccessControl();
          const canManageTeam = await ac.checkPermission(
            req.user.id,
            doc.id,
            'manage_team'
          );

          if (!canManageTeam) {
            // Hide sensitive team data for non-managers
            doc.team = doc.team.map(member => ({
              userId: member.userId,
              role: member.role
            }));
          }
        }

        return doc;
      }
    ]
  },

  access: {
    read: async ({ req }) => {
      if (!req.user) return false;

      // Users can read projects they own or are team members of
      return {
        or: [
          { ownerId: { equals: req.user.id } },
          { 'team.userId': { equals: req.user.id } }
        ]
      };
    },

    create: ({ req }) => {
      // Any authenticated user can create projects
      return Boolean(req.user);
    },

    update: async ({ req, id }) => {
      if (!req.user) return false;

      const ac = new AccessControl();
      return ac.checkPermission(req.user.id, id, 'write');
    },

    delete: async ({ req, id }) => {
      if (!req.user) return false;

      const ac = new AccessControl();
      return ac.checkPermission(req.user.id, id, 'delete');
    }
  }
};
```

### 4.2 Activity Logs Collection

```typescript
// /src/collections/ActivityLogs.ts

export const ActivityLogs: CollectionConfig = {
  slug: 'activity-logs',
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'userId', 'projectId', 'timestamp']
  },
  fields: [
    {
      name: 'projectId',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      index: true
    },
    {
      name: 'userId',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true
    },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Content Created', value: 'CONTENT_CREATED' },
        { label: 'Content Updated', value: 'CONTENT_UPDATED' },
        { label: 'Content Deleted', value: 'CONTENT_DELETED' },
        { label: 'Content Cloned', value: 'CONTENT_CLONED' },
        { label: 'Member Added', value: 'MEMBER_ADDED' },
        { label: 'Member Removed', value: 'MEMBER_REMOVED' },
        { label: 'Role Changed', value: 'ROLE_CHANGED' },
        { label: 'Export Started', value: 'EXPORT_STARTED' },
        { label: 'Export Completed', value: 'EXPORT_COMPLETED' },
        { label: 'Export Failed', value: 'EXPORT_FAILED' },
        { label: 'Project Created', value: 'PROJECT_CREATED' },
        { label: 'Settings Updated', value: 'PROJECT_SETTINGS_UPDATED' },
        { label: 'Project Published', value: 'PROJECT_PUBLISHED' }
      ],
      index: true
    },
    {
      name: 'details',
      type: 'json',
      label: 'Activity Details'
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
      index: true,
      admin: {
        date: {
          displayFormat: 'MMM dd, yyyy h:mm:ss a'
        }
      }
    },
    {
      name: 'ipAddress',
      type: 'text',
      label: 'IP Address'
    },
    {
      name: 'userAgent',
      type: 'text',
      label: 'User Agent'
    }
  ],

  access: {
    read: async ({ req, id }) => {
      if (!req.user) return false;

      // Users can read activity logs for projects they have access to
      const log = await ActivityLog.findById(id);
      if (!log) return false;

      const ac = new AccessControl();
      return ac.checkPermission(req.user.id, log.projectId, 'read');
    },

    create: ({ req }) => {
      // Only system can create activity logs
      return req.user?.role === 'admin';
    },

    update: () => false, // Activity logs are immutable
    delete: () => false  // Activity logs are immutable
  },

  timestamps: true
};
```

---

## 5. Integration Architecture

### 5.1 Phase Integration Map

```
Phase 8 Integration Points:

┌────────────────────────────────────────────────────────────────┐
│ PHASE 1: Foundation (MongoDB + PayloadCMS)                     │
├────────────────────────────────────────────────────────────────┤
│ • Team field in Projects collection                            │
│ • Access control hooks                                         │
│ • Clone tracking fields                                        │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ PHASE 2: Chat System                                           │
├────────────────────────────────────────────────────────────────┤
│ • Activity tracking for chat messages                          │
│ • Team member notifications                                    │
│ • Chat history cloning (optional)                              │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ PHASE 3: Brain Integration                                     │
├────────────────────────────────────────────────────────────────┤
│ • Brain graph cloning (Neo4j)                                  │
│ • Knowledge transfer between clones                            │
│ • Activity tracking for brain queries                          │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ PHASE 4: Departments                                           │
├────────────────────────────────────────────────────────────────┤
│ • All department data available for cloning                    │
│ • Characters, scenes, episodes, locations                      │
│ • Department-specific activity tracking                        │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ PHASE 5: Image Generation                                      │
├────────────────────────────────────────────────────────────────┤
│ • R2 object duplication for cloned images                      │
│ • Generation history preserved in clones                       │
│ • Activity tracking for image generation                       │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ PHASE 6: Audio Generation                                      │
├────────────────────────────────────────────────────────────────┤
│ • Audio segments in video export pipeline                      │
│ • TTS integration for dialogue export                          │
│ • Music track merging                                          │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ PHASE 7: Dashboard                                             │
├────────────────────────────────────────────────────────────────┤
│ • Export progress display                                      │
│ • Team member list UI                                          │
│ • Activity feed visualization                                  │
│ • Clone history tracking                                       │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ PHASE 8: Advanced Features (CURRENT)                           │
├────────────────────────────────────────────────────────────────┤
│ • Content cloning system                                       │
│ • Video export pipeline                                        │
│ • Team collaboration framework                                 │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Flow Diagram

```
USER ACTION
    │
    ├─── CLONE CONTENT ───┐
    │                     │
    │                     ▼
    │            ┌──────────────────┐
    │            │ Clone Orchestrator│
    │            └────────┬──────────┘
    │                     │
    │                     ├─── MongoDB (Content)
    │                     ├─── Neo4j (Brain Graph)
    │                     ├─── R2 (Media Files)
    │                     └─── ActivityLog
    │
    ├─── EXPORT VIDEO ────┐
    │                     │
    │                     ▼
    │            ┌──────────────────┐
    │            │  Video Exporter   │
    │            └────────┬──────────┘
    │                     │
    │                     ├─── Redis (Job Queue)
    │                     ├─── FFmpeg (Processing)
    │                     ├─── R2 (Export Storage)
    │                     └─── ActivityLog
    │
    └─── TEAM MANAGEMENT ─┐
                          │
                          ▼
                 ┌──────────────────┐
                 │   Team Manager    │
                 └────────┬──────────┘
                          │
                          ├─── MongoDB (Team Data)
                          ├─── ActivityLog
                          └─── Notifications
```

---

## 6. Security & Performance

### 6.1 Security Considerations

#### A. Access Control Security

```typescript
// Prevent privilege escalation
class SecurityValidator {
  async validateRoleChange(
    currentUserId: string,
    targetUserId: string,
    currentRole: Role,
    newRole: Role
  ): Promise<void> {
    // Prevent self-promotion
    if (currentUserId === targetUserId && newRole === Role.OWNER) {
      throw new SecurityError('Cannot promote self to owner');
    }

    // Only owners can assign owner role
    if (newRole === Role.OWNER && currentRole !== Role.OWNER) {
      throw new SecurityError('Only owners can assign owner role');
    }
  }

  async validateCloneAccess(
    userId: string,
    sourceProjectId: string,
    targetProjectId: string
  ): Promise<void> {
    const ac = new AccessControl();

    // Must have read access to source
    const canReadSource = await ac.checkPermission(userId, sourceProjectId, 'read');
    if (!canReadSource) {
      throw new SecurityError('No access to source project');
    }

    // Must have write access to target
    const canWriteTarget = await ac.checkPermission(userId, targetProjectId, 'write');
    if (!canWriteTarget) {
      throw new SecurityError('No write access to target project');
    }
  }
}
```

#### B. Export Security

```typescript
// Prevent unauthorized downloads
class ExportSecurityValidator {
  async validateDownloadAccess(
    userId: string,
    jobId: string
  ): Promise<void> {
    const job = await ExportJob.findOne({ jobId });
    if (!job) throw new Error('Export job not found');

    const ac = new AccessControl();
    const hasAccess = await ac.checkPermission(userId, job.projectId, 'export');

    if (!hasAccess) {
      throw new SecurityError('No export access for this project');
    }
  }

  async sanitizeExportOptions(options: ExportOptions): Promise<ExportOptions> {
    // Prevent command injection in watermark paths
    if (options.watermark) {
      options.watermark = path.basename(options.watermark);
    }

    return options;
  }
}
```

### 6.2 Performance Optimization

#### A. Clone Performance

```typescript
// Batch operations for performance
class PerformanceOptimizer {
  async batchClone(entities: CloneEntity[]): Promise<void> {
    // Group by type for bulk operations
    const grouped = entities.reduce((acc, entity) => {
      acc[entity.type] = acc[entity.type] || [];
      acc[entity.type].push(entity);
      return acc;
    }, {} as Record<string, CloneEntity[]>);

    // Clone in parallel by type
    await Promise.all(
      Object.entries(grouped).map(([type, items]) =>
        this.bulkCloneType(type, items)
      )
    );
  }

  async bulkCloneType(type: string, items: any[]): Promise<void> {
    const Model = this.getModel(type);

    // Use bulkWrite for efficiency
    await Model.bulkWrite(
      items.map(item => ({
        insertOne: {
          document: item
        }
      }))
    );
  }
}
```

#### B. Export Performance

```typescript
// Parallel segment processing
class ExportOptimizer {
  async processSegmentsInParallel(
    scenes: Scene[],
    concurrency: number = 4
  ): Promise<string[]> {
    const chunks = this.chunkArray(scenes, concurrency);
    const results: string[] = [];

    for (const chunk of chunks) {
      const segmentPaths = await Promise.all(
        chunk.map(scene => this.generateSegment(scene))
      );
      results.push(...segmentPaths);
    }

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

#### C. Activity Tracking Performance

```typescript
// Async activity logging to avoid blocking
class ActivityLogger {
  private queue: ActivityLog[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    // Flush every 5 seconds
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  async log(activity: ActivityLog): Promise<void> {
    this.queue.push(activity);

    // Flush immediately if queue is large
    if (this.queue.length >= 100) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const toInsert = [...this.queue];
    this.queue = [];

    await ActivityLog.insertMany(toInsert);
  }
}
```

### 6.3 Scalability Considerations

#### Horizontal Scaling

**Production (Ubuntu Server with PM2):**
```bash
# Use PM2 cluster mode for horizontal scaling
pm2 start ecosystem.config.js
pm2 scale aladdin-app +2  # Add 2 more instances

# PM2 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'aladdin-app',
    script: 'npm',
    args: 'start',
    instances: 3,  # Number of instances
    exec_mode: 'cluster',
    max_memory_restart: '4G',
    env: {
      NODE_ENV: 'production',
      REDIS_HOST: 'localhost',
      MONGODB_URI: 'mongodb://localhost:27017/aladdin',
      NEO4J_URI: 'bolt://localhost:7687'
    }
  }]
}
```

**Local Development (docker-compose):**
```yaml
# docker-compose.yml for local development only
version: '3.8'

services:
  app:
    image: aladdin-app:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 4G
    environment:
      - REDIS_HOST=redis
      - MONGODB_URI=mongodb://mongo:27017/aladdin
      - NEO4J_URI=bolt://neo4j:7687

  export-worker:
    image: aladdin-worker:latest
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '4'
          memory: 8G
    environment:
      - REDIS_HOST=redis
      - WORKER_TYPE=export
      - CONCURRENCY=3

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db

  neo4j:
    image: neo4j:5
    volumes:
      - neo4j-data:/data

volumes:
  redis-data:
  mongo-data:
  neo4j-data:
```

---

## 7. Deployment Requirements

### 7.1 Infrastructure Requirements

```yaml
# Minimum requirements for Phase 8

Compute:
  - App Servers: 3x instances, 2 vCPU, 4GB RAM each
  - Export Workers: 5x instances, 4 vCPU, 8GB RAM each
  - Total: 8 instances, 26 vCPU, 52GB RAM

Storage:
  - MongoDB: 500GB SSD
  - Neo4j: 100GB SSD
  - Redis: 32GB memory
  - R2 (Cloudflare): Unlimited (pay per GB)

Network:
  - Load Balancer: 100 Mbps
  - CDN: Cloudflare (global)

Software:
  - Node.js: v20+
  - FFmpeg: v6+ (with libx264, libvpx, prores)
  - Redis: v7+
  - MongoDB: v7+
  - Neo4j: v5+
```

### 7.2 Environment Variables

```bash
# .env.production

# Phase 8 Specific
REDIS_HOST=redis.production.internal
REDIS_PORT=6379
REDIS_PASSWORD=<strong_password>

EXPORT_CONCURRENCY=3
EXPORT_TEMP_DIR=/tmp/exports
EXPORT_MAX_DURATION=3600  # 1 hour max

CLONE_MAX_ENTITIES=1000
CLONE_MAX_MEDIA_SIZE_MB=5000  # 5GB

TEAM_MAX_MEMBERS=50
ACTIVITY_LOG_RETENTION_DAYS=365

# Webhooks
WEBHOOK_TIMEOUT_MS=10000
WEBHOOK_RETRY_ATTEMPTS=3

# R2 Export Storage
R2_EXPORT_BUCKET=aladdin-exports
R2_EXPORT_URL_EXPIRY=604800  # 7 days

# Feature Flags
FEATURE_CLONE_ENABLED=true
FEATURE_EXPORT_ENABLED=true
FEATURE_TEAM_ENABLED=true
FEATURE_PRESENCE_ENABLED=false  # Optional
```

### 7.3 Database Migrations

```typescript
// /src/migrations/phase8-migration.ts

export async function migratePhase8() {
  // 1. Add team field to existing projects
  await Project.updateMany(
    { team: { $exists: false } },
    {
      $set: {
        team: []
      }
    }
  );

  // 2. Auto-add owners to team
  const projects = await Project.find({ team: { $size: 0 } });

  for (const project of projects) {
    await Project.updateOne(
      { _id: project._id },
      {
        $push: {
          team: {
            userId: project.ownerId,
            role: 'owner',
            addedBy: project.ownerId,
            addedAt: new Date()
          }
        }
      }
    );
  }

  // 3. Create indexes for performance
  await ActivityLog.createIndexes([
    { projectId: 1, timestamp: -1 },
    { userId: 1, timestamp: -1 },
    { action: 1 }
  ]);

  await ExportJob.createIndexes([
    { jobId: 1 },
    { projectId: 1, status: 1 },
    { createdAt: -1 }
  ]);

  // 4. Initialize Redis queues
  const queue = new Queue('video-export');
  await queue.obliterate({ force: true }); // Clear old jobs
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// /tests/unit/clone/cloneOrchestrator.test.ts

describe('CloneOrchestrator', () => {
  let orchestrator: CloneOrchestrator;

  beforeEach(() => {
    orchestrator = new CloneOrchestrator();
  });

  test('should clone simple character', async () => {
    const result = await orchestrator.clone({
      sourceProjectId: 'project1',
      targetProjectId: 'project2',
      entities: [
        { id: 'char1', type: 'character' }
      ],
      options: {
        includeMedia: false,
        includeBrainGraph: false,
        preserveRelationships: true,
        updateReferences: true
      }
    });

    expect(result.success).toBe(true);
    expect(result.clonedEntities).toBe(1);
  });

  test('should handle circular dependencies', async () => {
    // Character A references Character B, Character B references Character A
    await expect(orchestrator.clone({
      sourceProjectId: 'project1',
      targetProjectId: 'project2',
      entities: [
        { id: 'charA', type: 'character', relationships: ['charB'] },
        { id: 'charB', type: 'character', relationships: ['charA'] }
      ],
      options: { ... }
    })).rejects.toThrow('Circular dependency detected');
  });

  test('should rollback on error', async () => {
    // Mock error during cloning
    jest.spyOn(CharacterCloneStrategy.prototype, 'clone')
      .mockRejectedValueOnce(new Error('Clone failed'));

    await expect(orchestrator.clone({ ... })).rejects.toThrow();

    // Verify no partial data in database
    const count = await Character.countDocuments({ clonedAt: { $exists: true } });
    expect(count).toBe(0);
  });
});
```

### 8.2 Integration Tests

```typescript
// /tests/integration/export/videoExport.test.ts

describe('VideoExporter Integration', () => {
  let exporter: VideoExporter;

  beforeAll(async () => {
    // Setup test database and Redis
    await setupTestEnvironment();
    exporter = new VideoExporter();
  });

  test('should export simple episode', async () => {
    // Create test project with scenes
    const project = await createTestProject({
      episodes: [
        {
          scenes: [
            { duration: 10, script: [...] },
            { duration: 15, script: [...] }
          ]
        }
      ]
    });

    const jobId = await exporter.createExportJob({
      projectId: project.id,
      episodeId: project.episodes[0].id,
      format: 'mp4',
      quality: 'medium',
      options: {
        includeSubtitles: false,
        resolution: '1080p',
        fps: 24,
        audioQuality: 'medium'
      },
      createdBy: 'test-user',
      createdAt: new Date()
    });

    // Wait for job completion (with timeout)
    const result = await waitForJobCompletion(jobId, 60000);

    expect(result.status).toBe('completed');
    expect(result.downloadUrl).toBeDefined();
  }, 120000); // 2 minute timeout
});
```

### 8.3 Performance Tests

```typescript
// /tests/performance/clone.perf.test.ts

describe('Clone Performance', () => {
  test('should clone 100 entities in < 5 seconds', async () => {
    const entities = Array.from({ length: 100 }, (_, i) => ({
      id: `char${i}`,
      type: 'character'
    }));

    const start = Date.now();

    await orchestrator.clone({
      sourceProjectId: 'project1',
      targetProjectId: 'project2',
      entities,
      options: { ... }
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });

  test('should handle 50 concurrent clone operations', async () => {
    const operations = Array.from({ length: 50 }, (_, i) =>
      orchestrator.clone({ ... })
    );

    const start = Date.now();
    const results = await Promise.all(operations);
    const duration = Date.now() - start;

    expect(results.every(r => r.success)).toBe(true);
    expect(duration).toBeLessThan(30000); // 30 seconds
  });
});
```

---

## 9. Documentation Requirements

### 9.1 API Documentation

```yaml
# OpenAPI 3.0 Specification

/api/v1/projects/{projectId}/clone/content:
  post:
    summary: Clone content between projects
    parameters:
      - name: projectId
        in: path
        required: true
        schema:
          type: string
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              entities:
                type: array
                items:
                  type: object
              targetProjectId:
                type: string
              options:
                type: object
    responses:
      200:
        description: Clone successful
      400:
        description: Invalid request
      403:
        description: Permission denied

/api/v1/projects/{projectId}/export:
  post:
    summary: Export episode as video
    parameters:
      - name: projectId
        in: path
        required: true
        schema:
          type: string
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              episodeId:
                type: string
              format:
                type: string
                enum: [mp4, webm, mov]
              quality:
                type: string
                enum: [low, medium, high, ultra]
              options:
                type: object
    responses:
      200:
        description: Export job created
        content:
          application/json:
            schema:
              type: object
              properties:
                jobId:
                  type: string
```

### 9.2 User Documentation

Create user-facing documentation at `/docs/user-guides/`:
- **Clone Guide**: How to clone content between projects
- **Export Guide**: How to export videos with different formats
- **Team Guide**: How to manage team members and permissions
- **Activity Guide**: How to view and filter activity logs

### 9.3 Developer Documentation

Create developer documentation at `/docs/developer/`:
- **Clone System**: Architecture and extension points
- **Export Pipeline**: Adding new formats and processors
- **Permission System**: Custom permission checks
- **Activity Tracking**: Adding new activity types

---

## 10. Success Metrics

### 10.1 Performance Metrics

```typescript
interface Phase8Metrics {
  clone: {
    averageTimePerEntity: number; // Target: < 50ms
    successRate: number;           // Target: > 99%
    mediaCloneTime: number;        // Target: < 2s per file
  };

  export: {
    averageExportTime: number;     // Target: < 120s for 5min video
    queueProcessingTime: number;   // Target: < 10s
    successRate: number;           // Target: > 95%
  };

  collaboration: {
    permissionCheckTime: number;   // Target: < 50ms
    activityLogLatency: number;    // Target: < 100ms
    presenceUpdateTime: number;    // Target: < 500ms (optional)
  };
}
```

### 10.2 Monitoring Dashboards

```typescript
// Datadog/Grafana metrics

// Clone Metrics
- aladdin.clone.duration (histogram)
- aladdin.clone.entities.count (counter)
- aladdin.clone.errors (counter)

// Export Metrics
- aladdin.export.queue.size (gauge)
- aladdin.export.processing.duration (histogram)
- aladdin.export.file.size (histogram)

// Collaboration Metrics
- aladdin.team.members.count (gauge)
- aladdin.activity.logs.rate (counter)
- aladdin.permissions.checks.duration (histogram)
```

---

## 11. Implementation Timeline

### Phase 8A: Content Cloning (Week 1-2)
- Day 1-3: Core cloning engine
- Day 4-6: Reference resolution
- Day 7-10: Media duplication
- Day 11-14: Brain graph cloning

### Phase 8B: Video Export (Week 3-4)
- Day 15-17: Export orchestrator
- Day 18-20: Format handlers
- Day 21-24: Job queue setup
- Day 25-28: Storage and cleanup

### Phase 8C: Team Collaboration (Week 5-6)
- Day 29-31: Access control
- Day 32-34: Team management
- Day 35-38: Activity tracking
- Day 39-42: API routes and hooks

### Phase 8D: Integration & Testing (Week 7-8)
- Day 43-46: PayloadCMS updates
- Day 47-50: Integration testing
- Day 51-54: Performance optimization
- Day 55-56: Documentation and deployment

---

## 12. Conclusion

Phase 8 represents the culmination of Aladdin's architecture, introducing enterprise-grade collaboration and production features that transform the platform into a complete content creation ecosystem.

### Key Achievements
✅ **Content Cloning**: Deep cloning with intelligent reference rewriting
✅ **Video Export**: Professional-grade multi-format video generation
✅ **Team Collaboration**: RBAC-based multi-user workflows
✅ **Activity Tracking**: Comprehensive audit trail
✅ **Scalability**: Horizontal scaling with job queues

### Next Steps
1. Begin implementation of Phase 8A (Cloning)
2. Set up Redis infrastructure for job queues
3. Implement unit tests for core components
4. Deploy to staging environment for integration testing
5. Performance benchmarking and optimization
6. User acceptance testing
7. Production deployment

**Total Development Effort**: 8 weeks
**Team Size**: 4-6 developers
**Risk Level**: Medium (complex integrations, performance critical)

---

**Architecture Approved By:** Hive Mind Swarm - Architect Agent
**Date:** 2025-10-01
**Version:** 1.0.0
