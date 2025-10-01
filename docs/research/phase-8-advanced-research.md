# Phase 8: Advanced Features - Comprehensive Research Document

**Research Date:** October 1, 2025
**Researcher:** Hive Mind Swarm - Research Agent
**Task ID:** phase-8-research
**Swarm ID:** swarm-1759247953229-friw6kswf

---

## Executive Summary

This document provides comprehensive research for Phase 8: Advanced Features, covering content cloning, video export functionality, and team collaboration. Phase 8 represents the final phase of the Aladdin project, transforming it from a single-user creative tool into a collaborative production platform with advanced export capabilities.

**Key Findings:**
- **Content Cloning:** Deep cloning with cross-database migration requires careful reference rewriting and dependency resolution
- **Video Export:** FFmpeg provides professional-grade export to MP4/WebM/MOV with quality presets
- **Team Collaboration:** RBAC with project-level and asset-level permissions enables secure multi-user workflows
- **Project Isolation:** Database-level separation prevents data leakage between projects
- **Real-time Sync:** WebSocket + operational transforms enable conflict-free collaborative editing

**Critical Architecture Decisions:**
1. Use MongoDB database-per-project pattern for data isolation
2. Implement RBAC at API middleware level with permission caching
3. Use FFmpeg for video export with quality presets (good/better/best)
4. Apply Operational Transform (OT) for real-time conflict resolution
5. Store audit logs in separate collection for compliance and security

---

## Table of Contents

1. [Content Cloning Architecture](#1-content-cloning-architecture)
2. [Video Export Implementation](#2-video-export-implementation)
3. [Team Collaboration System](#3-team-collaboration-system)
4. [Project Isolation Strategies](#4-project-isolation-strategies)
5. [Real-Time Collaboration](#5-real-time-collaboration)
6. [Security Considerations](#6-security-considerations)
7. [Integration Patterns](#7-integration-patterns-with-phases-1-7)
8. [Code Examples](#8-code-examples)
9. [Performance & Optimization](#9-performance--optimization)
10. [Testing Strategy](#10-testing-strategy)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. Content Cloning Architecture

### 1.1 Overview

Content cloning enables users to copy characters, scenes, locations, and other assets between projects while maintaining data integrity and updating all references.

**Key Requirements:**
- Deep copy of all document fields
- Rewrite internal references to new project context
- Clone related media files (R2 storage)
- Update Neo4j graph relationships
- Track clone attribution (original source)
- Handle dependency resolution (characters → scenes → episodes)

### 1.2 Cloning Patterns

#### 1.2.1 Shallow vs Deep Cloning

**Shallow Clone:**
- Copies document without following relationships
- Fast, single-document operation
- References point to original project (breaks cross-project links)
- **Use case:** Quick duplication within same project

**Deep Clone:**
- Recursively copies all related documents
- Rewrites all references to cloned versions
- Maintains relationship integrity
- **Use case:** Project-to-project content migration

```typescript
interface CloneOptions {
  depth: 'shallow' | 'deep';
  includeMedia?: boolean;        // Clone R2 media files
  includeRelationships?: boolean; // Clone related documents
  overrides?: Record<string, any>; // Override fields in clone
  preserveIds?: boolean;         // Keep original IDs (risky)
}
```

#### 1.2.2 Clone Tracking

Every cloned document stores its origin:

```typescript
interface CloneMetadata {
  clonedFrom: {
    projectId: string;
    collectionName: string;
    documentId: string;
    clonedAt: Date;
    clonedBy: string;              // User ID
  };
  isClone: boolean;                // Quick flag
  cloneDepth: number;              // 1 = direct, 2+ = clone of clone
  originalCreator?: string;        // Track original author
}
```

### 1.3 MongoDB Cross-Database Cloning

#### 1.3.1 Database Connection Pattern

```typescript
import { MongoClient } from 'mongodb';

class DatabaseManager {
  private connections: Map<string, MongoClient> = new Map();

  async getDatabase(projectId: string): Promise<Db> {
    const dbName = `open_${projectId}`;

    if (!this.connections.has(dbName)) {
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      this.connections.set(dbName, client);
    }

    return this.connections.get(dbName)!.db(dbName);
  }

  async cloneDocument(params: {
    sourceProjectId: string;
    targetProjectId: string;
    collectionName: string;
    documentId: string;
    options: CloneOptions;
  }) {
    const sourceDb = await this.getDatabase(params.sourceProjectId);
    const targetDb = await this.getDatabase(params.targetProjectId);

    const sourceDoc = await sourceDb
      .collection(params.collectionName)
      .findOne({ _id: params.documentId });

    if (!sourceDoc) {
      throw new Error('Source document not found');
    }

    // Create clone with new ID
    const clonedDoc = {
      ...sourceDoc,
      _id: new ObjectId(), // New ID
      projectId: params.targetProjectId,
      clonedFrom: {
        projectId: params.sourceProjectId,
        collectionName: params.collectionName,
        documentId: params.documentId,
        clonedAt: new Date(),
        clonedBy: params.options.userId
      },
      isClone: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Remove source-specific fields
    delete clonedDoc.brainValidated; // Re-validate in target context
    delete clonedDoc.userApproved;

    await targetDb.collection(params.collectionName).insertOne(clonedDoc);

    return clonedDoc;
  }
}
```

#### 1.3.2 Reference Rewriting

When cloning, internal references must be updated:

```typescript
class ReferenceRewriter {
  private referenceMap: Map<string, string> = new Map(); // oldId -> newId

  async rewriteReferences(document: any): Promise<any> {
    // Deep clone to avoid mutation
    const cloned = JSON.parse(JSON.stringify(document));

    // Rewrite relatedDocuments array
    if (cloned.relatedDocuments) {
      cloned.relatedDocuments = cloned.relatedDocuments.map((rel: any) => ({
        ...rel,
        documentId: this.referenceMap.get(rel.documentId) || rel.documentId
      }));
    }

    // Rewrite content field (recursive)
    if (cloned.content) {
      cloned.content = this.rewriteObjectReferences(cloned.content);
    }

    return cloned;
  }

  private rewriteObjectReferences(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.rewriteObjectReferences(item));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Check if this looks like an ID reference
        if (key.endsWith('Id') && typeof value === 'string') {
          result[key] = this.referenceMap.get(value) || value;
        } else if (key === 'characterId' || key === 'sceneId' || key === 'locationId') {
          result[key] = this.referenceMap.get(value as string) || value;
        } else {
          result[key] = this.rewriteObjectReferences(value);
        }
      }
      return result;
    }

    return obj;
  }
}
```

### 1.4 Neo4j Graph Cloning

#### 1.4.1 Clone Nodes and Relationships

```typescript
import neo4j from 'neo4j-driver';

class Neo4jCloner {
  private driver: neo4j.Driver;

  async cloneSubgraph(params: {
    sourceProjectId: string;
    targetProjectId: string;
    rootNodeId: string;
    depth: number;
  }) {
    const session = this.driver.session();

    try {
      // 1. Find all nodes in subgraph
      const nodesQuery = `
        MATCH path = (root:Content {id: $rootNodeId, projectId: $sourceProjectId})
                     -[*0..${params.depth}]-(related:Content)
        WHERE related.projectId = $sourceProjectId
        RETURN DISTINCT related
      `;

      const nodesResult = await session.run(nodesQuery, {
        rootNodeId: params.rootNodeId,
        sourceProjectId: params.sourceProjectId
      });

      const nodeIdMap = new Map<string, string>(); // oldId -> newId

      // 2. Clone all nodes
      for (const record of nodesResult.records) {
        const oldNode = record.get('related').properties;
        const newNodeId = this.generateNewId();

        nodeIdMap.set(oldNode.id, newNodeId);

        await session.run(`
          CREATE (n:Content)
          SET n = $properties,
              n.id = $newId,
              n.projectId = $targetProjectId,
              n.clonedFrom = $clonedFrom
        `, {
          properties: oldNode,
          newId: newNodeId,
          targetProjectId: params.targetProjectId,
          clonedFrom: {
            projectId: params.sourceProjectId,
            originalId: oldNode.id,
            clonedAt: new Date().toISOString()
          }
        });
      }

      // 3. Clone relationships
      const relationshipsQuery = `
        MATCH path = (root:Content {id: $rootNodeId, projectId: $sourceProjectId})
                     -[*0..${params.depth}]-(related:Content)
        WHERE related.projectId = $sourceProjectId
        MATCH (n1:Content)-[r]->(n2:Content)
        WHERE n1 IN nodes(path) AND n2 IN nodes(path)
        RETURN n1.id AS source, type(r) AS relType, properties(r) AS relProps, n2.id AS target
      `;

      const relsResult = await session.run(relationshipsQuery, {
        rootNodeId: params.rootNodeId,
        sourceProjectId: params.sourceProjectId
      });

      for (const record of relsResult.records) {
        const sourceId = record.get('source');
        const targetId = record.get('target');
        const relType = record.get('relType');
        const relProps = record.get('relProps');

        const newSourceId = nodeIdMap.get(sourceId);
        const newTargetId = nodeIdMap.get(targetId);

        if (newSourceId && newTargetId) {
          await session.run(`
            MATCH (source:Content {id: $sourceId, projectId: $projectId})
            MATCH (target:Content {id: $targetId, projectId: $projectId})
            CREATE (source)-[r:${relType}]->(target)
            SET r = $properties
          `, {
            sourceId: newSourceId,
            targetId: newTargetId,
            projectId: params.targetProjectId,
            properties: relProps
          });
        }
      }

      return nodeIdMap;

    } finally {
      await session.close();
    }
  }

  private generateNewId(): string {
    return `cloned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 1.5 Media File Cloning (R2 Storage)

#### 1.5.1 Cloudflare R2 Copy Operations

```typescript
import { S3Client, CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

class R2MediaCloner {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.R2_ENDPOINT,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
      }
    });
    this.bucketName = process.env.R2_BUCKET_NAME!;
  }

  async cloneMedia(params: {
    sourceProjectId: string;
    targetProjectId: string;
    mediaId: string;
  }): Promise<string> {
    // 1. Get source media metadata
    const sourceKey = `projects/${params.sourceProjectId}/media/${params.mediaId}`;

    const headCommand = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: sourceKey
    });

    const metadata = await this.s3Client.send(headCommand);

    // 2. Generate new media ID
    const newMediaId = this.generateMediaId();
    const targetKey = `projects/${params.targetProjectId}/media/${newMediaId}`;

    // 3. Copy file in R2 (server-side copy, no download/upload)
    const copyCommand = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourceKey}`,
      Key: targetKey,
      ContentType: metadata.ContentType,
      Metadata: {
        ...metadata.Metadata,
        clonedFrom: sourceKey,
        clonedAt: new Date().toISOString()
      }
    });

    await this.s3Client.send(copyCommand);

    return newMediaId;
  }

  private generateMediaId(): string {
    return `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 1.6 Dependency Resolution Strategy

#### 1.6.1 Dependency Graph

Before cloning, build dependency graph to determine clone order:

```typescript
interface DependencyNode {
  id: string;
  type: string;
  dependencies: string[]; // IDs this node depends on
}

class DependencyResolver {
  async buildDependencyGraph(
    db: Db,
    collectionName: string,
    documentId: string
  ): Promise<DependencyNode[]> {
    const visited = new Set<string>();
    const graph: DependencyNode[] = [];

    await this.traverse(db, collectionName, documentId, visited, graph);

    return graph;
  }

  private async traverse(
    db: Db,
    collectionName: string,
    documentId: string,
    visited: Set<string>,
    graph: DependencyNode[]
  ) {
    const key = `${collectionName}:${documentId}`;
    if (visited.has(key)) return;

    visited.add(key);

    const doc = await db.collection(collectionName).findOne({ _id: documentId });
    if (!doc) return;

    const dependencies: string[] = [];

    // Extract dependencies from relatedDocuments
    if (doc.relatedDocuments) {
      for (const rel of doc.relatedDocuments) {
        dependencies.push(`${rel.collection}:${rel.documentId}`);
        await this.traverse(db, rel.collection, rel.documentId, visited, graph);
      }
    }

    // Extract dependencies from content field
    if (doc.content) {
      const contentDeps = this.extractDependenciesFromContent(doc.content);
      dependencies.push(...contentDeps);

      for (const dep of contentDeps) {
        const [depCollection, depId] = dep.split(':');
        await this.traverse(db, depCollection, depId, visited, graph);
      }
    }

    graph.push({
      id: key,
      type: collectionName,
      dependencies
    });
  }

  private extractDependenciesFromContent(content: any, prefix = ''): string[] {
    const deps: string[] = [];

    if (Array.isArray(content)) {
      for (const item of content) {
        deps.push(...this.extractDependenciesFromContent(item, prefix));
      }
    } else if (content && typeof content === 'object') {
      for (const [key, value] of Object.entries(content)) {
        // Look for ID patterns
        if (key.endsWith('Id') && typeof value === 'string') {
          const type = key.replace('Id', '') + 's'; // characterId -> characters
          deps.push(`${type}:${value}`);
        } else {
          deps.push(...this.extractDependenciesFromContent(value, prefix));
        }
      }
    }

    return deps;
  }

  topologicalSort(graph: DependencyNode[]): DependencyNode[] {
    const sorted: DependencyNode[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (node: DependencyNode) => {
      if (visited.has(node.id)) return;
      if (visiting.has(node.id)) {
        throw new Error(`Circular dependency detected: ${node.id}`);
      }

      visiting.add(node.id);

      for (const depId of node.dependencies) {
        const depNode = graph.find(n => n.id === depId);
        if (depNode) visit(depNode);
      }

      visiting.delete(node.id);
      visited.add(node.id);
      sorted.push(node);
    };

    for (const node of graph) {
      visit(node);
    }

    return sorted;
  }
}
```

### 1.7 Complete Clone Service

```typescript
class ContentCloneService {
  private dbManager: DatabaseManager;
  private neo4jCloner: Neo4jCloner;
  private mediaCloner: R2MediaCloner;
  private referenceRewriter: ReferenceRewriter;
  private depResolver: DependencyResolver;

  async cloneContent(params: {
    sourceProjectId: string;
    targetProjectId: string;
    contentType: string;
    documentId: string;
    options: CloneOptions;
  }) {
    // 1. Build dependency graph
    const sourceDb = await this.dbManager.getDatabase(params.sourceProjectId);
    const depGraph = await this.depResolver.buildDependencyGraph(
      sourceDb,
      params.contentType,
      params.documentId
    );

    // 2. Sort dependencies (clone dependencies first)
    const sortedDeps = this.depResolver.topologicalSort(depGraph);

    // 3. Clone in order
    for (const dep of sortedDeps) {
      const [collectionName, docId] = dep.id.split(':');

      // Clone MongoDB document
      const clonedDoc = await this.dbManager.cloneDocument({
        sourceProjectId: params.sourceProjectId,
        targetProjectId: params.targetProjectId,
        collectionName,
        documentId: docId,
        options: params.options
      });

      // Track mapping for reference rewriting
      this.referenceRewriter.referenceMap.set(docId, clonedDoc._id.toString());

      // Clone media if needed
      if (params.options.includeMedia && clonedDoc.content) {
        await this.cloneMediaReferences(clonedDoc, params);
      }
    }

    // 4. Rewrite all references
    const targetDb = await this.dbManager.getDatabase(params.targetProjectId);
    for (const dep of sortedDeps) {
      const [collectionName, docId] = dep.id.split(':');
      const newId = this.referenceRewriter.referenceMap.get(docId);

      if (newId) {
        const doc = await targetDb.collection(collectionName).findOne({ _id: new ObjectId(newId) });
        const rewritten = await this.referenceRewriter.rewriteReferences(doc);
        await targetDb.collection(collectionName).replaceOne({ _id: new ObjectId(newId) }, rewritten);
      }
    }

    // 5. Clone Neo4j subgraph
    if (params.options.includeRelationships) {
      await this.neo4jCloner.cloneSubgraph({
        sourceProjectId: params.sourceProjectId,
        targetProjectId: params.targetProjectId,
        rootNodeId: params.documentId,
        depth: 3 // Clone up to 3 levels deep
      });
    }

    return {
      success: true,
      clonedCount: sortedDeps.length,
      newRootId: this.referenceRewriter.referenceMap.get(params.documentId)
    };
  }

  private async cloneMediaReferences(document: any, params: any) {
    // Find all media IDs in content
    const mediaIds = this.extractMediaIds(document.content);

    for (const mediaId of mediaIds) {
      try {
        const newMediaId = await this.mediaCloner.cloneMedia({
          sourceProjectId: params.sourceProjectId,
          targetProjectId: params.targetProjectId,
          mediaId
        });

        this.referenceRewriter.referenceMap.set(mediaId, newMediaId);
      } catch (error) {
        console.error(`Failed to clone media ${mediaId}:`, error);
      }
    }
  }

  private extractMediaIds(content: any): string[] {
    const mediaIds: string[] = [];

    const extract = (obj: any) => {
      if (Array.isArray(obj)) {
        obj.forEach(extract);
      } else if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          if ((key.endsWith('ImageId') || key.endsWith('VideoId') || key.endsWith('AudioId') || key === 'mediaId') && typeof value === 'string') {
            mediaIds.push(value);
          } else {
            extract(value);
          }
        }
      }
    };

    extract(content);
    return [...new Set(mediaIds)]; // Deduplicate
  }
}
```

---

## 2. Video Export Implementation

### 2.1 Overview

Export assembled scenes and complete projects to industry-standard video formats with quality presets and professional codecs.

**Supported Formats:**
- **MP4** (H.264/H.265) - Universal playback
- **WebM** (VP8/VP9) - Web-optimized
- **MOV** (ProRes) - Professional editing

**Quality Presets:**
- **Good:** 720p, medium bitrate, H.264 (web sharing)
- **Better:** 1080p, high bitrate, H.264 (general use)
- **Best:** 1080p/4K, maximum bitrate, H.265/ProRes (archival/editing)

### 2.2 FFmpeg Export Engine

#### 2.2.1 Quality Presets

```typescript
interface ExportPreset {
  name: string;
  resolution: { width: number; height: number };
  videoBitrate: string;
  audioBitrate: string;
  codec: string;
  fps: number;
  format: 'mp4' | 'webm' | 'mov';
}

const EXPORT_PRESETS: Record<string, ExportPreset> = {
  'mp4-good': {
    name: 'MP4 - Good Quality (720p)',
    resolution: { width: 1280, height: 720 },
    videoBitrate: '2500k',
    audioBitrate: '128k',
    codec: 'libx264',
    fps: 24,
    format: 'mp4'
  },
  'mp4-better': {
    name: 'MP4 - Better Quality (1080p)',
    resolution: { width: 1920, height: 1080 },
    videoBitrate: '5000k',
    audioBitrate: '192k',
    codec: 'libx264',
    fps: 24,
    format: 'mp4'
  },
  'mp4-best': {
    name: 'MP4 - Best Quality (1080p, H.265)',
    resolution: { width: 1920, height: 1080 },
    videoBitrate: '8000k',
    audioBitrate: '256k',
    codec: 'libx265',
    fps: 24,
    format: 'mp4'
  },
  'webm-good': {
    name: 'WebM - Good Quality (720p)',
    resolution: { width: 1280, height: 720 },
    videoBitrate: '2000k',
    audioBitrate: '128k',
    codec: 'libvpx-vp9',
    fps: 24,
    format: 'webm'
  },
  'webm-best': {
    name: 'WebM - Best Quality (1080p)',
    resolution: { width: 1920, height: 1080 },
    videoBitrate: '6000k',
    audioBitrate: '192k',
    codec: 'libvpx-vp9',
    fps: 24,
    format: 'webm'
  },
  'mov-prores': {
    name: 'MOV - ProRes 422 (Professional)',
    resolution: { width: 1920, height: 1080 },
    videoBitrate: '', // ProRes doesn't use bitrate setting
    audioBitrate: '256k',
    codec: 'prores_ks',
    fps: 24,
    format: 'mov'
  },
  'mp4-4k': {
    name: 'MP4 - 4K (2160p, H.265)',
    resolution: { width: 3840, height: 2160 },
    videoBitrate: '20000k',
    audioBitrate: '320k',
    codec: 'libx265',
    fps: 24,
    format: 'mp4'
  }
};
```

#### 2.2.2 Export Service

```typescript
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';

class VideoExportService {
  async exportProject(params: {
    projectId: string;
    preset: string;
    outputFilename: string;
    includeScenes?: string[]; // Optional: specific scenes
  }) {
    const preset = EXPORT_PRESETS[params.preset];
    if (!preset) {
      throw new Error(`Invalid preset: ${params.preset}`);
    }

    // 1. Gather all scene videos
    const scenes = await this.getProjectScenes(params.projectId, params.includeScenes);

    // 2. Create concat list file
    const concatListPath = await this.createConcatList(scenes);

    // 3. Export with FFmpeg
    const outputPath = path.join(process.cwd(), 'exports', `${params.outputFilename}.${preset.format}`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise<string>((resolve, reject) => {
      const command = ffmpeg();

      // Input: concat demuxer
      command
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0']);

      // Video codec and settings
      if (preset.codec === 'libx264') {
        command
          .videoCodec('libx264')
          .videoBitrate(preset.videoBitrate)
          .outputOptions([
            '-preset medium',
            '-profile:v high',
            '-level 4.0',
            '-pix_fmt yuv420p'
          ]);
      } else if (preset.codec === 'libx265') {
        command
          .videoCodec('libx265')
          .videoBitrate(preset.videoBitrate)
          .outputOptions([
            '-preset medium',
            '-tag:v hvc1', // For compatibility
            '-pix_fmt yuv420p'
          ]);
      } else if (preset.codec === 'libvpx-vp9') {
        command
          .videoCodec('libvpx-vp9')
          .videoBitrate(preset.videoBitrate)
          .outputOptions([
            '-row-mt 1',
            '-tile-columns 2',
            '-cpu-used 2'
          ]);
      } else if (preset.codec === 'prores_ks') {
        command
          .videoCodec('prores_ks')
          .outputOptions([
            '-profile:v 2', // ProRes 422
            '-vendor apl0',
            '-pix_fmt yuv422p10le'
          ]);
      }

      // Audio codec
      if (preset.format === 'webm') {
        command.audioCodec('libopus').audioBitrate(preset.audioBitrate);
      } else {
        command.audioCodec('aac').audioBitrate(preset.audioBitrate);
      }

      // Resolution and FPS
      command
        .size(`${preset.resolution.width}x${preset.resolution.height}`)
        .fps(preset.fps);

      // Metadata
      command.outputOptions([
        `-metadata title="${params.outputFilename}"`,
        `-metadata comment="Exported from Aladdin"`,
        `-metadata date="${new Date().toISOString()}"`
      ]);

      // Progress tracking
      command.on('progress', (progress) => {
        console.log(`Export progress: ${progress.percent?.toFixed(2)}%`);
      });

      // Completion
      command.on('end', () => {
        console.log('Export complete:', outputPath);
        resolve(outputPath);
      });

      command.on('error', (error) => {
        console.error('Export failed:', error);
        reject(error);
      });

      // Start export
      command.save(outputPath);
    });
  }

  private async getProjectScenes(projectId: string, sceneIds?: string[]) {
    const db = await this.dbManager.getDatabase(projectId);
    const query = sceneIds ? { _id: { $in: sceneIds } } : {};
    const scenes = await db.collection('videos')
      .find(query)
      .sort({ createdAt: 1 })
      .toArray();

    return scenes.map(scene => ({
      id: scene._id,
      videoPath: this.getLocalPath(scene.content.url),
      duration: scene.content.duration
    }));
  }

  private async createConcatList(scenes: any[]): Promise<string> {
    const listPath = path.join(process.cwd(), 'temp', `concat-${Date.now()}.txt`);
    await fs.mkdir(path.dirname(listPath), { recursive: true });

    const lines = scenes.map(scene => `file '${scene.videoPath}'`);
    await fs.writeFile(listPath, lines.join('\n'));

    return listPath;
  }

  private getLocalPath(url: string): string {
    // Convert CDN URL to local file path or download if needed
    // Implementation depends on storage strategy
    return url; // Placeholder
  }
}
```

#### 2.2.3 Progress Tracking

```typescript
class ExportJobManager {
  private jobs: Map<string, ExportJob> = new Map();

  async createExportJob(params: {
    projectId: string;
    preset: string;
    outputFilename: string;
  }): Promise<string> {
    const jobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: ExportJob = {
      id: jobId,
      projectId: params.projectId,
      preset: params.preset,
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.jobs.set(jobId, job);

    // Start export in background
    this.processExport(jobId, params).catch(error => {
      job.status = 'failed';
      job.error = error.message;
      job.updatedAt = new Date();
    });

    return jobId;
  }

  private async processExport(jobId: string, params: any) {
    const job = this.jobs.get(jobId)!;
    job.status = 'processing';
    job.updatedAt = new Date();

    const exportService = new VideoExportService();

    try {
      const outputPath = await exportService.exportProject({
        ...params,
        onProgress: (progress: number) => {
          job.progress = progress;
          job.updatedAt = new Date();
        }
      });

      job.status = 'completed';
      job.outputPath = outputPath;
      job.completedAt = new Date();
      job.updatedAt = new Date();

      // Upload to R2 for download
      const downloadUrl = await this.uploadToStorage(outputPath);
      job.downloadUrl = downloadUrl;

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.updatedAt = new Date();
      throw error;
    }
  }

  getJobStatus(jobId: string): ExportJob | undefined {
    return this.jobs.get(jobId);
  }

  private async uploadToStorage(filePath: string): Promise<string> {
    // Upload to R2 and return public URL
    // Implementation omitted for brevity
    return 'https://cdn.aladdin.com/exports/...';
  }
}

interface ExportJob {
  id: string;
  projectId: string;
  preset: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  outputPath?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

### 2.3 Batch Export

```typescript
class BatchExporter {
  async exportMultipleFormats(params: {
    projectId: string;
    outputFilename: string;
    presets: string[]; // e.g., ['mp4-good', 'webm-good', 'mov-prores']
  }) {
    const jobs: string[] = [];

    for (const preset of params.presets) {
      const jobId = await this.exportJobManager.createExportJob({
        projectId: params.projectId,
        preset,
        outputFilename: `${params.outputFilename}_${preset}`
      });
      jobs.push(jobId);
    }

    return {
      batchId: `batch_${Date.now()}`,
      jobs,
      message: `Started ${jobs.length} export jobs`
    };
  }

  async getBatchStatus(batchId: string) {
    // Track all jobs in batch
    // Return aggregate status
  }
}
```

---

## 3. Team Collaboration System

### 3.1 Role-Based Access Control (RBAC)

#### 3.1.1 User Roles

```typescript
enum ProjectRole {
  OWNER = 'owner',        // Full control, can delete project
  EDITOR = 'editor',      // Can edit all content
  COLLABORATOR = 'collaborator', // Can create/edit own content
  VIEWER = 'viewer'       // Read-only access
}

interface TeamMember {
  userId: string;
  role: ProjectRole;
  permissions: Permission[];
  addedAt: Date;
  addedBy: string;        // User ID of inviter
  lastActiveAt?: Date;
}
```

#### 3.1.2 Permission Matrix

```typescript
enum Permission {
  // Project-level
  PROJECT_VIEW = 'project:view',
  PROJECT_EDIT = 'project:edit',
  PROJECT_DELETE = 'project:delete',
  PROJECT_EXPORT = 'project:export',
  PROJECT_SHARE = 'project:share',

  // Content-level
  CONTENT_VIEW = 'content:view',
  CONTENT_CREATE = 'content:create',
  CONTENT_EDIT = 'content:edit',
  CONTENT_DELETE = 'content:delete',

  // Asset-level
  MEDIA_UPLOAD = 'media:upload',
  MEDIA_DELETE = 'media:delete',

  // Generation
  GENERATE_IMAGE = 'generate:image',
  GENERATE_VIDEO = 'generate:video',
  GENERATE_VOICE = 'generate:voice',

  // Team management
  TEAM_INVITE = 'team:invite',
  TEAM_REMOVE = 'team:remove',
  TEAM_EDIT_ROLES = 'team:edit_roles'
}

const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  [ProjectRole.OWNER]: [
    // All permissions
    Permission.PROJECT_VIEW,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_EXPORT,
    Permission.PROJECT_SHARE,
    Permission.CONTENT_VIEW,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_EDIT,
    Permission.CONTENT_DELETE,
    Permission.MEDIA_UPLOAD,
    Permission.MEDIA_DELETE,
    Permission.GENERATE_IMAGE,
    Permission.GENERATE_VIDEO,
    Permission.GENERATE_VOICE,
    Permission.TEAM_INVITE,
    Permission.TEAM_REMOVE,
    Permission.TEAM_EDIT_ROLES
  ],
  [ProjectRole.EDITOR]: [
    Permission.PROJECT_VIEW,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_EXPORT,
    Permission.CONTENT_VIEW,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_EDIT,
    Permission.CONTENT_DELETE,
    Permission.MEDIA_UPLOAD,
    Permission.MEDIA_DELETE,
    Permission.GENERATE_IMAGE,
    Permission.GENERATE_VIDEO,
    Permission.GENERATE_VOICE
  ],
  [ProjectRole.COLLABORATOR]: [
    Permission.PROJECT_VIEW,
    Permission.CONTENT_VIEW,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_EDIT, // Own content only
    Permission.MEDIA_UPLOAD,
    Permission.GENERATE_IMAGE,
    Permission.GENERATE_VIDEO,
    Permission.GENERATE_VOICE
  ],
  [ProjectRole.VIEWER]: [
    Permission.PROJECT_VIEW,
    Permission.CONTENT_VIEW
  ]
};
```

#### 3.1.3 Permission Checking Middleware

```typescript
import { NextRequest, NextResponse } from 'next/server';

function requirePermission(...permissions: Permission[]) {
  return async (req: NextRequest, context?: any) => {
    // 1. Get user from session
    const payload = await getPayloadHMR({ config: configPromise });
    const { user } = await payload.auth({ req });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get project ID from route params
    const projectId = context?.params?.projectId || req.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // 3. Check user's role and permissions
    const hasPermission = await this.checkPermissions(user.id, projectId, permissions);

    if (!hasPermission) {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
        requiredPermissions: permissions
      }, { status: 403 });
    }

    // 4. Attach project context to request
    (req as any).projectId = projectId;
    (req as any).userRole = await this.getUserRole(user.id, projectId);

    // 5. Continue to handler
    return null; // Middleware passed, continue
  };
}

class PermissionChecker {
  private cache: Map<string, { role: ProjectRole; expires: number }> = new Map();

  async checkPermissions(
    userId: string,
    projectId: string,
    requiredPermissions: Permission[]
  ): Promise<boolean> {
    const role = await this.getUserRole(userId, projectId);
    if (!role) return false;

    const userPermissions = ROLE_PERMISSIONS[role];
    return requiredPermissions.every(perm => userPermissions.includes(perm));
  }

  async getUserRole(userId: string, projectId: string): Promise<ProjectRole | null> {
    const cacheKey = `${userId}:${projectId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.role;
    }

    // Fetch from database
    const payload = await getPayloadHMR({ config: configPromise });
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId
    });

    if (!project) return null;

    // Check if user is owner
    if (project.owner.id === userId) {
      this.cache.set(cacheKey, { role: ProjectRole.OWNER, expires: Date.now() + 300000 }); // 5 min cache
      return ProjectRole.OWNER;
    }

    // Check team members
    const teamMember = project.team?.find((member: any) => member.user.id === userId);
    if (teamMember) {
      this.cache.set(cacheKey, { role: teamMember.role, expires: Date.now() + 300000 });
      return teamMember.role;
    }

    return null;
  }
}
```

#### 3.1.4 Usage Example

```typescript
// app/api/v1/projects/[projectId]/content/route.ts
import { requirePermission, Permission } from '@/lib/auth/permissions';

export const POST = requirePermission(
  Permission.CONTENT_CREATE
)(async (req: NextRequest, context) => {
  const body = await req.json();
  const projectId = (req as any).projectId;
  const userRole = (req as any).userRole;

  // Create content logic
  const content = await createContent({
    projectId,
    ...body,
    createdBy: (req as any).user.id
  });

  return NextResponse.json(content);
});

export const DELETE = requirePermission(
  Permission.CONTENT_DELETE
)(async (req: NextRequest, context) => {
  const projectId = (req as any).projectId;
  const contentId = context.params.contentId;
  const userRole = (req as any).userRole;

  // For COLLABORATOR role, verify ownership
  if (userRole === ProjectRole.COLLABORATOR) {
    const content = await getContent(projectId, contentId);
    if (content.createdBy !== (req as any).user.id) {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'You can only delete your own content'
      }, { status: 403 });
    }
  }

  await deleteContent(projectId, contentId);
  return NextResponse.json({ success: true });
});
```

### 3.2 Team Management

#### 3.2.1 Invite System

```typescript
class TeamManager {
  async inviteUser(params: {
    projectId: string;
    invitedBy: string;
    email: string;
    role: ProjectRole;
  }) {
    // 1. Verify inviter has permission
    const hasPermission = await this.permissionChecker.checkPermissions(
      params.invitedBy,
      params.projectId,
      [Permission.TEAM_INVITE]
    );

    if (!hasPermission) {
      throw new Error('You do not have permission to invite users');
    }

    // 2. Check if user exists
    const payload = await getPayloadHMR({ config: configPromise });
    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: params.email } }
    });

    const invitedUser = users.docs[0];

    // 3. Create invitation
    const invitation = await payload.create({
      collection: 'invitations',
      data: {
        projectId: params.projectId,
        invitedBy: params.invitedBy,
        invitedEmail: params.email,
        invitedUserId: invitedUser?.id,
        role: params.role,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // 4. Send email notification
    await this.sendInvitationEmail({
      to: params.email,
      inviterName: (await payload.findByID({ collection: 'users', id: params.invitedBy })).name,
      projectName: (await payload.findByID({ collection: 'projects', id: params.projectId })).name,
      role: params.role,
      invitationLink: `${process.env.APP_URL}/invitations/${invitation.id}`
    });

    return invitation;
  }

  async acceptInvitation(invitationId: string, userId: string) {
    const payload = await getPayloadHMR({ config: configPromise });

    const invitation = await payload.findByID({
      collection: 'invitations',
      id: invitationId
    });

    if (!invitation || invitation.status !== 'pending') {
      throw new Error('Invalid invitation');
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation expired');
    }

    // Add user to project team
    await payload.update({
      collection: 'projects',
      id: invitation.projectId,
      data: {
        team: {
          ...(await payload.findByID({ collection: 'projects', id: invitation.projectId })).team,
          push: {
            user: userId,
            role: invitation.role,
            addedAt: new Date(),
            addedBy: invitation.invitedBy
          }
        }
      }
    });

    // Mark invitation as accepted
    await payload.update({
      collection: 'invitations',
      id: invitationId,
      data: {
        status: 'accepted',
        acceptedAt: new Date()
      }
    });

    return { success: true };
  }

  async removeTeamMember(params: {
    projectId: string;
    removedBy: string;
    userId: string;
  }) {
    // 1. Verify permission
    const hasPermission = await this.permissionChecker.checkPermissions(
      params.removedBy,
      params.projectId,
      [Permission.TEAM_REMOVE]
    );

    if (!hasPermission) {
      throw new Error('You do not have permission to remove team members');
    }

    // 2. Cannot remove owner
    const payload = await getPayloadHMR({ config: configPromise });
    const project = await payload.findByID({
      collection: 'projects',
      id: params.projectId
    });

    if (project.owner.id === params.userId) {
      throw new Error('Cannot remove project owner');
    }

    // 3. Remove from team
    await payload.update({
      collection: 'projects',
      id: params.projectId,
      data: {
        team: project.team.filter((member: any) => member.user.id !== params.userId)
      }
    });

    return { success: true };
  }

  async updateMemberRole(params: {
    projectId: string;
    updatedBy: string;
    userId: string;
    newRole: ProjectRole;
  }) {
    // Verify permission
    const hasPermission = await this.permissionChecker.checkPermissions(
      params.updatedBy,
      params.projectId,
      [Permission.TEAM_EDIT_ROLES]
    );

    if (!hasPermission) {
      throw new Error('You do not have permission to edit roles');
    }

    // Update role
    const payload = await getPayloadHMR({ config: configPromise });
    const project = await payload.findByID({
      collection: 'projects',
      id: params.projectId
    });

    const updatedTeam = project.team.map((member: any) =>
      member.user.id === params.userId
        ? { ...member, role: params.newRole }
        : member
    );

    await payload.update({
      collection: 'projects',
      id: params.projectId,
      data: { team: updatedTeam }
    });

    // Clear permission cache
    this.permissionChecker.cache.delete(`${params.userId}:${params.projectId}`);

    return { success: true };
  }
}
```

### 3.3 Activity Tracking & Audit Logs

```typescript
interface ActivityLog {
  id: string;
  projectId: string;
  userId: string;
  action: string;              // 'create', 'update', 'delete', 'export', 'invite'
  resourceType: string;        // 'character', 'scene', 'project', 'team'
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

class ActivityLogger {
  async logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const payload = await getPayloadHMR({ config: configPromise });

    await payload.create({
      collection: 'activity_logs',
      data: {
        ...activity,
        timestamp: new Date()
      }
    });
  }

  async getProjectActivity(projectId: string, options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
  }) {
    const payload = await getPayloadHMR({ config: configPromise });

    const where: any = { projectId: { equals: projectId } };

    if (options?.userId) {
      where.userId = { equals: options.userId };
    }

    if (options?.action) {
      where.action = { equals: options.action };
    }

    const result = await payload.find({
      collection: 'activity_logs',
      where,
      limit: options?.limit || 50,
      skip: options?.offset || 0,
      sort: '-timestamp'
    });

    return result.docs;
  }
}
```

---

## 4. Project Isolation Strategies

### 4.1 Database-Level Isolation

**Pattern:** Each project gets its own MongoDB database.

```
open_project-slug-1  (Database)
  ├── characters     (Collection)
  ├── scenes         (Collection)
  ├── videos         (Collection)
  └── ...

open_project-slug-2  (Database)
  ├── characters     (Collection)
  ├── scenes         (Collection)
  └── ...
```

**Benefits:**
- Complete data isolation
- No cross-project queries possible
- Easy backup/restore per project
- Clear data boundaries

**Implementation:**
```typescript
class ProjectDatabaseManager {
  async createProjectDatabase(projectId: string, projectSlug: string) {
    const dbName = `open_${projectSlug}`;
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    const db = client.db(dbName);

    // Create indexes
    await db.collection('characters').createIndex({ projectId: 1 });
    await db.collection('scenes').createIndex({ projectId: 1 });
    await db.collection('videos').createIndex({ projectId: 1 });

    // Store database name in project metadata
    const payload = await getPayloadHMR({ config: configPromise });
    await payload.update({
      collection: 'projects',
      id: projectId,
      data: {
        openDatabaseName: dbName,
        dynamicCollections: ['characters', 'scenes', 'videos']
      }
    });

    return dbName;
  }

  async deleteProjectDatabase(projectId: string) {
    const payload = await getPayloadHMR({ config: configPromise });
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId
    });

    if (!project.openDatabaseName) return;

    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    // Drop entire database
    await client.db(project.openDatabaseName).dropDatabase();

    console.log(`Dropped database: ${project.openDatabaseName}`);
  }
}
```

### 4.2 Permission Boundaries

**Middleware Enforcement:**
```typescript
async function enforceProjectAccess(req: NextRequest, context: any) {
  const projectId = context.params.projectId;
  const user = (req as any).user;

  // Check if user has any role in project
  const role = await permissionChecker.getUserRole(user.id, projectId);

  if (!role) {
    return NextResponse.json({
      error: 'Access Denied',
      message: 'You do not have access to this project'
    }, { status: 403 });
  }

  return null; // Access granted
}
```

### 4.3 Neo4j Project Isolation

**Graph Queries Scoped by Project ID:**
```cypher
// All queries must include projectId filter
MATCH (n:Content {projectId: $projectId})
WHERE n.type = 'character'
RETURN n

// Relationships also scoped
MATCH (c:Character {projectId: $projectId})-[r:APPEARS_IN]->(s:Scene {projectId: $projectId})
RETURN c, r, s
```

**Prevent Cross-Project Queries:**
```typescript
class BrainService {
  async validateContent(params: {
    projectId: string;
    content: any;
  }) {
    const session = this.neo4jDriver.session();

    try {
      // ALWAYS include projectId in queries
      const result = await session.run(`
        MATCH (related:Content {projectId: $projectId})
        WHERE related.embedding IS NOT NULL
        RETURN related
      `, { projectId: params.projectId });

      // Process results...

    } finally {
      await session.close();
    }
  }
}
```

---

## 5. Real-Time Collaboration

### 5.1 WebSocket Architecture

```typescript
import { WebSocketServer, WebSocket } from 'ws';

class CollaborationServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Set<WebSocket>> = new Map(); // projectId -> clients

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const projectId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('projectId');
      const userId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('userId');

      if (!projectId || !userId) {
        ws.close(1008, 'Missing projectId or userId');
        return;
      }

      // Verify user has access to project
      this.verifyAccess(userId, projectId).then(hasAccess => {
        if (!hasAccess) {
          ws.close(1008, 'Access denied');
          return;
        }

        // Add to room
        if (!this.rooms.has(projectId)) {
          this.rooms.set(projectId, new Set());
        }
        this.rooms.get(projectId)!.add(ws);

        // Notify others
        this.broadcast(projectId, {
          type: 'user_joined',
          userId,
          timestamp: Date.now()
        }, ws);

        // Handle messages
        ws.on('message', (data) => {
          this.handleMessage(projectId, userId, ws, data.toString());
        });

        // Handle disconnect
        ws.on('close', () => {
          this.rooms.get(projectId)?.delete(ws);
          this.broadcast(projectId, {
            type: 'user_left',
            userId,
            timestamp: Date.now()
          }, ws);
        });
      });
    });
  }

  private async verifyAccess(userId: string, projectId: string): Promise<boolean> {
    const role = await new PermissionChecker().getUserRole(userId, projectId);
    return role !== null;
  }

  private handleMessage(projectId: string, userId: string, ws: WebSocket, data: string) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'cursor_move':
          this.broadcast(projectId, {
            type: 'cursor_move',
            userId,
            position: message.position,
            timestamp: Date.now()
          }, ws);
          break;

        case 'content_change':
          this.handleContentChange(projectId, userId, message);
          break;

        case 'typing_start':
        case 'typing_stop':
          this.broadcast(projectId, {
            type: message.type,
            userId,
            documentId: message.documentId,
            timestamp: Date.now()
          }, ws);
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private broadcast(projectId: string, message: any, excludeWs?: WebSocket) {
    const room = this.rooms.get(projectId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    room.forEach(client => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  private async handleContentChange(projectId: string, userId: string, message: any) {
    // Apply operational transform for conflict resolution
    const ot = new OperationalTransform();
    const resolved = await ot.transform(message.operation);

    // Broadcast to all clients
    this.broadcast(projectId, {
      type: 'content_change',
      userId,
      documentId: message.documentId,
      operation: resolved,
      timestamp: Date.now()
    });

    // Persist change to database
    await this.persistChange(projectId, message.documentId, resolved);
  }

  private async persistChange(projectId: string, documentId: string, operation: any) {
    // Save operation to database
    const dbManager = new DatabaseManager();
    const db = await dbManager.getDatabase(projectId);

    await db.collection('operations').insertOne({
      documentId,
      operation,
      timestamp: new Date()
    });
  }
}
```

### 5.2 Operational Transform (OT)

```typescript
class OperationalTransform {
  async transform(operation: Operation): Promise<Operation> {
    // Simplified OT implementation
    // In production, use a library like ShareDB or Yjs

    switch (operation.type) {
      case 'insert':
        return this.transformInsert(operation);
      case 'delete':
        return this.transformDelete(operation);
      case 'update':
        return this.transformUpdate(operation);
      default:
        return operation;
    }
  }

  private transformInsert(op: Operation): Operation {
    // Transform insert operation against concurrent operations
    return op;
  }

  private transformDelete(op: Operation): Operation {
    // Transform delete operation
    return op;
  }

  private transformUpdate(op: Operation): Operation {
    // Transform update operation
    return op;
  }
}

interface Operation {
  type: 'insert' | 'delete' | 'update';
  path: string;          // JSON path to field
  value?: any;
  oldValue?: any;
  position?: number;
}
```

### 5.3 Presence Indicators

```typescript
interface UserPresence {
  userId: string;
  userName: string;
  avatar?: string;
  status: 'active' | 'idle' | 'away';
  cursor?: {
    documentId: string;
    position: { x: number; y: number };
  };
  lastActivity: Date;
}

class PresenceManager {
  private presences: Map<string, Map<string, UserPresence>> = new Map(); // projectId -> userId -> presence

  updatePresence(projectId: string, userId: string, update: Partial<UserPresence>) {
    if (!this.presences.has(projectId)) {
      this.presences.set(projectId, new Map());
    }

    const projectPresences = this.presences.get(projectId)!;
    const current = projectPresences.get(userId) || {
      userId,
      userName: '',
      status: 'active',
      lastActivity: new Date()
    };

    projectPresences.set(userId, {
      ...current,
      ...update,
      lastActivity: new Date()
    });

    return projectPresences.get(userId);
  }

  getProjectPresences(projectId: string): UserPresence[] {
    const projectPresences = this.presences.get(projectId);
    if (!projectPresences) return [];

    // Filter out inactive users (> 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    return Array.from(projectPresences.values()).filter(
      presence => presence.lastActivity > fiveMinutesAgo
    );
  }

  removePresence(projectId: string, userId: string) {
    this.presences.get(projectId)?.delete(userId);
  }
}
```

---

## 6. Security Considerations

### 6.1 API-Level Permission Verification

**Every API route must verify permissions:**

```typescript
// app/api/v1/projects/[projectId]/content/[contentId]/route.ts
export const GET = withAuth(async (req: NextRequest, context) => {
  const user = (req as any).user;
  const { projectId, contentId } = context.params;

  // 1. Verify user has access to project
  const role = await permissionChecker.getUserRole(user.id, projectId);
  if (!role) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // 2. Verify permission for this action
  const hasPermission = await permissionChecker.checkPermissions(
    user.id,
    projectId,
    [Permission.CONTENT_VIEW]
  );

  if (!hasPermission) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // 3. Fetch content (project-scoped)
  const dbManager = new DatabaseManager();
  const db = await dbManager.getDatabase(projectId);
  const content = await db.collection('characters').findOne({ _id: contentId });

  if (!content) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 4. Return content
  return NextResponse.json(content);
});
```

### 6.2 Audit Logging

**Log all sensitive operations:**

```typescript
class AuditLogger {
  async logSensitiveOperation(params: {
    userId: string;
    projectId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details?: any;
    ipAddress?: string;
  }) {
    const payload = await getPayloadHMR({ config: configPromise });

    await payload.create({
      collection: 'audit_logs',
      data: {
        ...params,
        timestamp: new Date(),
        severity: this.getSeverity(params.action)
      }
    });
  }

  private getSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityActions = ['delete', 'export', 'share', 'remove_member'];
    const criticalActions = ['delete_project', 'transfer_ownership'];

    if (criticalActions.includes(action)) return 'critical';
    if (highSeverityActions.includes(action)) return 'high';
    return 'medium';
  }

  async getAuditTrail(projectId: string, options?: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const payload = await getPayloadHMR({ config: configPromise });

    const where: any = { projectId: { equals: projectId } };

    if (options?.userId) {
      where.userId = { equals: options.userId };
    }

    if (options?.action) {
      where.action = { equals: options.action };
    }

    if (options?.startDate) {
      where.timestamp = { greater_than_equal: options.startDate };
    }

    if (options?.endDate) {
      where.timestamp = { ...where.timestamp, less_than_equal: options.endDate };
    }

    const result = await payload.find({
      collection: 'audit_logs',
      where,
      limit: 1000,
      sort: '-timestamp'
    });

    return result.docs;
  }
}
```

### 6.3 Rate Limiting

**Prevent abuse of export and generation APIs:**

```typescript
import rateLimit from 'express-rate-limit';

const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 exports per hour
  message: 'Too many export requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.user.id}:${req.params.projectId}`;
  }
});

const generationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 generations per minute
  message: 'Too many generation requests, please slow down'
});

// Apply to routes
app.post('/api/v1/projects/:projectId/export', exportLimiter, exportHandler);
app.post('/api/v1/projects/:projectId/generate/video', generationLimiter, videoGenerationHandler);
```

### 6.4 Data Encryption

**Encrypt sensitive fields:**

```typescript
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

  encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex')
    };
  }

  decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

---

## 7. Integration Patterns with Phases 1-7

### 7.1 Phase 1-2 Integration (Foundation & Chat)

**Team members appear in chat:**
```typescript
// Display team presence in chat interface
const TeamPresenceIndicator = () => {
  const presences = useProjectPresences(projectId);

  return (
    <div className="team-presence">
      {presences.map(presence => (
        <Avatar
          key={presence.userId}
          src={presence.avatar}
          name={presence.userName}
          status={presence.status}
        />
      ))}
    </div>
  );
};
```

### 7.2 Phase 3 Integration (Brain)

**Brain validates cloned content:**
```typescript
// After cloning, re-validate in target project context
await brainService.validateContent({
  projectId: targetProjectId,
  content: clonedCharacter,
  operation: 'clone'
});

// Brain marks as "needs validation" since context changed
```

### 7.3 Phase 4-5 Integration (Departments & Images)

**Permission checks for generation:**
```typescript
// Before generating image
const canGenerate = await permissionChecker.checkPermissions(
  userId,
  projectId,
  [Permission.GENERATE_IMAGE]
);

if (!canGenerate) {
  throw new Error('You do not have permission to generate images');
}
```

### 7.4 Phase 6 Integration (Video)

**Export includes all assembled videos:**
```typescript
// Gather all scenes for export
const scenes = await db.collection('videos')
  .find({ projectId, status: 'completed' })
  .sort({ sceneNumber: 1 })
  .toArray();

// Export as single video
await exportService.exportProject({
  projectId,
  preset: 'mp4-best',
  scenes: scenes.map(s => s._id)
});
```

### 7.5 Phase 7 Integration (Polish)

**Team activity in timeline view:**
```typescript
// Show who made recent changes
const recentActivity = await activityLogger.getProjectActivity(projectId, {
  limit: 20
});

// Display in timeline UI
<ActivityTimeline events={recentActivity} />
```

---

## 8. Code Examples

### 8.1 Complete Clone API Route

```typescript
// app/api/v1/projects/[projectId]/clone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { ContentCloneService } from '@/services/clone.service';

export const POST = withAuth(async (req: NextRequest, context) => {
  const user = (req as any).user;
  const { projectId } = context.params;
  const body = await req.json();

  const {
    targetProjectId,
    contentType,
    documentId,
    includeMedia = true,
    includeRelationships = true
  } = body;

  // Verify permissions
  const sourceRole = await permissionChecker.getUserRole(user.id, projectId);
  const targetRole = await permissionChecker.getUserRole(user.id, targetProjectId);

  if (!sourceRole || !targetRole) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const hasSourcePermission = await permissionChecker.checkPermissions(
    user.id,
    projectId,
    [Permission.CONTENT_VIEW]
  );

  const hasTargetPermission = await permissionChecker.checkPermissions(
    user.id,
    targetProjectId,
    [Permission.CONTENT_CREATE]
  );

  if (!hasSourcePermission || !hasTargetPermission) {
    return NextResponse.json({
      error: 'Insufficient permissions',
      message: 'You need view access to source and create access to target'
    }, { status: 403 });
  }

  // Perform clone
  const cloneService = new ContentCloneService();

  try {
    const result = await cloneService.cloneContent({
      sourceProjectId: projectId,
      targetProjectId,
      contentType,
      documentId,
      options: {
        depth: 'deep',
        includeMedia,
        includeRelationships,
        userId: user.id
      }
    });

    // Log activity
    await activityLogger.logActivity({
      projectId,
      userId: user.id,
      action: 'clone',
      resourceType: contentType,
      resourceId: documentId,
      details: {
        targetProjectId,
        clonedCount: result.clonedCount
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Clone failed:', error);
    return NextResponse.json({
      error: 'Clone failed',
      message: error.message
    }, { status: 500 });
  }
});
```

### 8.2 Complete Export API Route

```typescript
// app/api/v1/projects/[projectId]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { ExportJobManager } from '@/services/export.service';

export const POST = withAuth(async (req: NextRequest, context) => {
  const user = (req as any).user;
  const { projectId } = context.params;
  const body = await req.json();

  const { preset, outputFilename, includeScenes } = body;

  // Verify permission
  const hasPermission = await permissionChecker.checkPermissions(
    user.id,
    projectId,
    [Permission.PROJECT_EXPORT]
  );

  if (!hasPermission) {
    return NextResponse.json({
      error: 'Forbidden',
      message: 'You do not have permission to export this project'
    }, { status: 403 });
  }

  // Create export job
  const exportManager = new ExportJobManager();

  try {
    const jobId = await exportManager.createExportJob({
      projectId,
      preset,
      outputFilename,
      includeScenes
    });

    // Log activity
    await activityLogger.logActivity({
      projectId,
      userId: user.id,
      action: 'export_started',
      resourceType: 'project',
      resourceId: projectId,
      details: { preset, jobId }
    });

    return NextResponse.json({
      jobId,
      status: 'queued',
      message: 'Export job created successfully'
    });
  } catch (error) {
    console.error('Export job creation failed:', error);
    return NextResponse.json({
      error: 'Export failed',
      message: error.message
    }, { status: 500 });
  }
});

export const GET = withAuth(async (req: NextRequest, context) => {
  const user = (req as any).user;
  const { projectId } = context.params;
  const jobId = req.nextUrl.searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }

  const exportManager = new ExportJobManager();
  const job = exportManager.getJobStatus(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
});
```

### 8.3 Complete Team Management API Routes

```typescript
// app/api/v1/projects/[projectId]/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { TeamManager } from '@/services/team.service';

// Invite user
export const POST = withAuth(async (req: NextRequest, context) => {
  const user = (req as any).user;
  const { projectId } = context.params;
  const body = await req.json();

  const { email, role } = body;

  const teamManager = new TeamManager();

  try {
    const invitation = await teamManager.inviteUser({
      projectId,
      invitedBy: user.id,
      email,
      role
    });

    await activityLogger.logActivity({
      projectId,
      userId: user.id,
      action: 'invite_sent',
      resourceType: 'team',
      resourceId: invitation.id,
      details: { email, role }
    });

    return NextResponse.json(invitation);
  } catch (error) {
    return NextResponse.json({
      error: 'Invitation failed',
      message: error.message
    }, { status: error.message.includes('permission') ? 403 : 500 });
  }
});

// Remove team member
export const DELETE = withAuth(async (req: NextRequest, context) => {
  const user = (req as any).user;
  const { projectId } = context.params;
  const userId = req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const teamManager = new TeamManager();

  try {
    await teamManager.removeTeamMember({
      projectId,
      removedBy: user.id,
      userId
    });

    await activityLogger.logActivity({
      projectId,
      userId: user.id,
      action: 'member_removed',
      resourceType: 'team',
      resourceId: userId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      error: 'Remove failed',
      message: error.message
    }, { status: error.message.includes('permission') ? 403 : 500 });
  }
});

// Update member role
export const PATCH = withAuth(async (req: NextRequest, context) => {
  const user = (req as any).user;
  const { projectId } = context.params;
  const body = await req.json();

  const { userId, newRole } = body;

  const teamManager = new TeamManager();

  try {
    await teamManager.updateMemberRole({
      projectId,
      updatedBy: user.id,
      userId,
      newRole
    });

    await activityLogger.logActivity({
      projectId,
      userId: user.id,
      action: 'role_updated',
      resourceType: 'team',
      resourceId: userId,
      details: { newRole }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      error: 'Update failed',
      message: error.message
    }, { status: error.message.includes('permission') ? 403 : 500 });
  }
});
```

---

## 9. Performance & Optimization

### 9.1 Permission Caching

```typescript
class PermissionCacheManager {
  private redis: Redis;
  private TTL = 300; // 5 minutes

  async cachePermissions(userId: string, projectId: string, role: ProjectRole) {
    const key = `permissions:${userId}:${projectId}`;
    const permissions = ROLE_PERMISSIONS[role];

    await this.redis.setex(key, this.TTL, JSON.stringify({
      role,
      permissions,
      cachedAt: Date.now()
    }));
  }

  async getCachedPermissions(userId: string, projectId: string) {
    const key = `permissions:${userId}:${projectId}`;
    const cached = await this.redis.get(key);

    if (!cached) return null;

    return JSON.parse(cached);
  }

  async invalidateCache(userId: string, projectId: string) {
    const key = `permissions:${userId}:${projectId}`;
    await this.redis.del(key);
  }
}
```

### 9.2 Export Queue Optimization

```typescript
import Bull from 'bull';

const exportQueue = new Bull('export-jobs', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000
    },
    removeOnComplete: false, // Keep for history
    removeOnFail: false
  }
});

exportQueue.process(async (job) => {
  const { projectId, preset, outputFilename } = job.data;

  job.progress(0);

  const exportService = new VideoExportService();

  try {
    const outputPath = await exportService.exportProject({
      projectId,
      preset,
      outputFilename,
      onProgress: (progress) => {
        job.progress(progress);
      }
    });

    job.progress(100);

    return { success: true, outputPath };
  } catch (error) {
    throw error;
  }
});
```

### 9.3 Database Connection Pooling

```typescript
class MongoDBPool {
  private static instance: MongoDBPool;
  private clients: Map<string, MongoClient> = new Map();
  private maxPoolSize = 10;

  static getInstance() {
    if (!MongoDBPool.instance) {
      MongoDBPool.instance = new MongoDBPool();
    }
    return MongoDBPool.instance;
  }

  async getClient(dbName: string): Promise<MongoClient> {
    if (this.clients.has(dbName)) {
      return this.clients.get(dbName)!;
    }

    if (this.clients.size >= this.maxPoolSize) {
      // Evict least recently used
      const firstKey = this.clients.keys().next().value;
      const client = this.clients.get(firstKey)!;
      await client.close();
      this.clients.delete(firstKey);
    }

    const client = new MongoClient(process.env.MONGODB_URI!, {
      maxPoolSize: 10,
      minPoolSize: 2
    });

    await client.connect();
    this.clients.set(dbName, client);

    return client;
  }
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
// __tests__/services/clone.service.test.ts
describe('ContentCloneService', () => {
  let cloneService: ContentCloneService;

  beforeEach(() => {
    cloneService = new ContentCloneService();
  });

  test('clones character to new project', async () => {
    const result = await cloneService.cloneContent({
      sourceProjectId: 'proj_a',
      targetProjectId: 'proj_b',
      contentType: 'characters',
      documentId: 'char_001',
      options: { depth: 'deep', includeMedia: true, includeRelationships: true }
    });

    expect(result.success).toBe(true);
    expect(result.newRootId).toBeDefined();

    // Verify clone exists in target
    const targetDb = await dbManager.getDatabase('proj_b');
    const clonedChar = await targetDb.collection('characters').findOne({ _id: result.newRootId });

    expect(clonedChar).toBeDefined();
    expect(clonedChar.projectId).toBe('proj_b');
    expect(clonedChar.clonedFrom.projectId).toBe('proj_a');
  });

  test('rewrites references correctly', async () => {
    // Test reference rewriting logic
  });

  test('handles circular dependencies', async () => {
    // Test circular dependency detection
  });
});
```

### 10.2 Integration Tests

```typescript
// __tests__/integration/export.test.ts
describe('Video Export Integration', () => {
  test('exports project to MP4', async () => {
    const projectId = await createTestProject();
    await addTestScenes(projectId, 3);

    const exportManager = new ExportJobManager();
    const jobId = await exportManager.createExportJob({
      projectId,
      preset: 'mp4-better',
      outputFilename: 'test-export'
    });

    // Wait for completion (or timeout)
    const job = await waitForJob(jobId, 120000); // 2 minute timeout

    expect(job.status).toBe('completed');
    expect(job.downloadUrl).toBeDefined();

    // Verify file exists
    const fileExists = await fs.access(job.outputPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });
});
```

### 10.3 Permission Tests

```typescript
// __tests__/auth/permissions.test.ts
describe('Permission System', () => {
  test('owner has all permissions', async () => {
    const userId = 'user_123';
    const projectId = 'proj_abc';

    // Set up: user is owner
    await setupProjectOwner(userId, projectId);

    const allPermissions = Object.values(Permission);

    for (const permission of allPermissions) {
      const hasPermission = await permissionChecker.checkPermissions(
        userId,
        projectId,
        [permission]
      );

      expect(hasPermission).toBe(true);
    }
  });

  test('viewer cannot edit content', async () => {
    const userId = 'user_456';
    const projectId = 'proj_abc';

    await setupProjectViewer(userId, projectId);

    const canEdit = await permissionChecker.checkPermissions(
      userId,
      projectId,
      [Permission.CONTENT_EDIT]
    );

    expect(canEdit).toBe(false);
  });

  test('collaborator can only edit own content', async () => {
    // Test collaborator permissions
  });
});
```

---

## 11. Implementation Roadmap

### Week 29-30: Content Cloning

**Week 29:**
- [ ] Implement MongoDB cross-database cloning
- [ ] Build dependency resolver
- [ ] Create reference rewriter
- [ ] Unit tests for clone logic

**Week 30:**
- [ ] Implement Neo4j graph cloning
- [ ] Add R2 media file cloning
- [ ] Create clone API routes
- [ ] Integration tests
- [ ] Documentation

**Deliverables:**
- Working clone API
- Deep cloning with dependencies
- Media file duplication
- Graph relationship cloning

---

### Week 31: Export Functionality

**Tasks:**
- [ ] Set up FFmpeg export service
- [ ] Implement quality presets
- [ ] Create export job queue
- [ ] Add progress tracking
- [ ] Build webhook notifications
- [ ] Upload to R2 for downloads
- [ ] Export API routes
- [ ] Testing

**Deliverables:**
- Multi-format export (MP4, WebM, MOV)
- Quality presets (Good/Better/Best)
- Async job processing
- Download URLs

---

### Week 32: Team Collaboration

**Tasks:**
- [ ] Implement RBAC permission system
- [ ] Create permission middleware
- [ ] Build team management API
- [ ] Add invitation system
- [ ] Activity logging
- [ ] Audit trail
- [ ] Real-time WebSocket server
- [ ] Presence indicators
- [ ] Operational Transform basics
- [ ] Testing

**Deliverables:**
- Full RBAC system
- Team invitation/management
- Activity logs
- Real-time collaboration
- Audit trail

---

## Key Findings & Recommendations

### Content Cloning

**✅ RECOMMENDED APPROACH:**
- Use deep cloning with dependency resolution
- Implement topological sort to handle dependencies
- Rewrite all internal references post-clone
- Clone Neo4j subgraph for relationship integrity
- Use R2 server-side copy for media (no download/upload)

**CHALLENGES:**
- Circular dependencies require detection and handling
- Large clones (100+ documents) may take minutes
- Media cloning adds significant time

**MITIGATION:**
- Implement clone job queue
- Show progress indicators
- Allow partial clones (skip media option)
- Cache dependency graphs

---

### Video Export

**✅ RECOMMENDED APPROACH:**
- Use FFmpeg with fluent-ffmpeg wrapper
- Provide 3-4 quality presets (Good/Better/Best/4K)
- Queue-based processing with Bull + Redis
- Upload to R2 with signed URLs for downloads

**CHALLENGES:**
- Exports can take 5-30 minutes depending on length
- High CPU usage during export
- Storage costs for exported files

**MITIGATION:**
- Background job processing
- Progress tracking via webhooks
- Auto-cleanup after 7 days
- Compress with H.265 for smaller files

---

### Team Collaboration

**✅ RECOMMENDED APPROACH:**
- RBAC with 4 roles (Owner, Editor, Collaborator, Viewer)
- Permission checks at API middleware level
- Cache permissions in Redis (5 min TTL)
- WebSocket for real-time presence and updates
- Operational Transform for conflict resolution

**CHALLENGES:**
- Real-time sync complexity
- Permission caching invalidation
- Conflict resolution edge cases

**MITIGATION:**
- Use established OT libraries (ShareDB, Yjs)
- Conservative permission caching
- Clear audit trail for conflicts
- Graceful degradation if WebSocket fails

---

## Next Steps

1. **Set up infrastructure:**
   - Redis for caching and queues
   - WebSocket server for real-time
   - FFmpeg installation

2. **Implement core services:**
   - ContentCloneService
   - VideoExportService
   - TeamManager
   - PermissionChecker

3. **Create API routes:**
   - /api/v1/projects/[id]/clone
   - /api/v1/projects/[id]/export
   - /api/v1/projects/[id]/team

4. **Add real-time features:**
   - WebSocket server
   - Presence system
   - Live updates

5. **Testing:**
   - Unit tests for all services
   - Integration tests for workflows
   - Load testing for exports

---

## Conclusion

Phase 8 represents the culmination of the Aladdin project, adding professional-grade features that enable teams to collaborate on movie production at scale. The architecture balances security, performance, and user experience while maintaining the flexibility of earlier phases.

**Critical Success Factors:**
- Robust permission system prevents unauthorized access
- Efficient cloning preserves data integrity
- High-quality exports meet professional standards
- Real-time collaboration enhances teamwork
- Audit logs ensure accountability

**Timeline:** 4 weeks (Weeks 29-32)

**Risk Level:** Medium (Real-time collaboration adds complexity)

**Priority:** High (Enables multi-user production workflows)

---

**Document Status:** Complete ✓
**Last Updated:** October 1, 2025
**Next Review:** Before Phase 8 implementation kickoff

---

**END OF RESEARCH DOCUMENT**
