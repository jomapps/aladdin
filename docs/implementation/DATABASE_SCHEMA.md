# Database Schema Documentation - Aladdin System

## Table of Contents
- [Three-Tier Architecture](#three-tier-architecture)
- [Tier 1: PayloadCMS (MongoDB)](#tier-1-payloadcms-mongodb)
- [Tier 2: Gather Databases (MongoDB)](#tier-2-gather-databases-mongodb)
- [Tier 3: Brain Service (Neo4j)](#tier-3-brain-service-neo4j)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Migration Procedures](#migration-procedures)

---

## Three-Tier Architecture

The Aladdin system uses a sophisticated three-tier database architecture to separate qualified data, unqualified data, and knowledge graphs:

```
┌─────────────────────────────────────────────────────┐
│                 TIER 1: PayloadCMS                  │
│              Qualified Data (MongoDB)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Projects │  │Episodes  │  │ CharacterRefs    │  │
│  │Departments│  │  Agents  │  │ ProjectReadiness │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│          TIER 2: Gather Databases (MongoDB)         │
│              Unqualified Data Collection            │
│                                                      │
│  Database: aladdin-gather-{projectId}               │
│  ┌────────────────────────────────────────────┐    │
│  │            Gather Collection                │    │
│  │  • User content  • AI summaries             │    │
│  │  • Images/docs   • Automation metadata      │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│          TIER 3: Brain Service (Neo4j)              │
│          Knowledge Graph + Embeddings               │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌──────────────────┐   │
│  │  Nodes  │──│Relations│──│ Vector Embeddings │   │
│  │ (Types) │  │ (Types) │  │   (Jina AI)       │   │
│  └─────────┘  └─────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Tier 1 (PayloadCMS)**: Validated, structured, production-ready data
2. **Tier 2 (Gather DBs)**: Raw, unqualified content awaiting validation
3. **Tier 3 (Brain)**: Semantic knowledge graph with relationship mapping

**Data Promotion Flow**:
```
Raw Content → Gather DB → Evaluation → PayloadCMS → Brain Graph
```

---

## Tier 1: PayloadCMS (MongoDB)

### Database Configuration
```typescript
// Database: aladdin (main database)
DATABASE_URI=mongodb://127.0.0.1:27017/aladdin
```

### Collections

#### 1. Projects Collection
**Purpose**: Core project metadata and configuration

```typescript
interface Project {
  id: string;
  name: string;
  slug: string; // URL-safe identifier
  type: 'movie' | 'series';

  // Production Info
  targetLength?: number;
  targetEpisodes?: number;
  genre: Array<{ genre: string }>;
  logline?: string;
  synopsis?: string;

  // Development
  initialIdea?: string;
  storyPremise?: string;
  themes: Array<{ theme: string }>;
  tone?: string;

  // Status
  phase: 'expansion' | 'compacting' | 'complete';
  status: 'active' | 'paused' | 'archived' | 'complete';
  expansionProgress?: number; // 0-100
  compactingProgress?: number; // 0-100

  // Quality
  overallQuality?: number; // 0-1
  qualityBreakdown?: {
    story?: number;
    characters?: number;
    visuals?: number;
    technical?: number;
  };

  // Team
  owner: string; // User ID (required)
  team: Array<{
    user: string; // User ID
    role: 'owner' | 'editor' | 'collaborator' | 'viewer';
    permissions?: string[];
    addedBy?: string;
    addedAt?: Date;
  }>;

  // Open Database Reference
  openDatabaseName: string; // Format: open_{slug}
  dynamicCollections?: Array<{ collectionName: string }>;

  // Settings
  settings?: {
    brainValidationRequired: boolean;
    minQualityThreshold: number; // 0-1
    autoGenerateImages: boolean;
    videoGenerationProvider?: string;
    maxBudget?: number;
  };

  // Metadata
  tags?: string[];
  coverImage?: string; // Media ID
  isPublic: boolean;
  lastActivityAt?: Date;

  // Cloning
  clonedFrom?: {
    projectId: string;
    clonedAt: Date;
    clonedBy: string;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```javascript
db.projects.createIndexes([
  { key: { slug: 1 }, unique: true },
  { key: { owner: 1 } },
  { key: { 'team.user': 1 } },
  { key: { status: 1 } },
  { key: { phase: 1 } },
  { key: { lastActivityAt: -1 } }
])
```

---

#### 2. Departments Collection
**Purpose**: Department configurations and workflows

```typescript
interface Department {
  id: string;
  name: string;
  slug: string;
  codeDepNumber: number; // Sequential order (1-based)

  // Configuration
  description?: string;
  icon?: string;
  color?: string;

  // Gather Requirements
  gatherCheck: boolean; // Requires gather data
  gatherRequirements?: {
    minItems: number;
    requiredTypes?: string[];
  };

  // Agent Configuration
  agentConfig?: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
  };

  // Coordination
  coordinationSettings?: {
    minQualityThreshold: number; // 0-100
    requiresPreviousDept: boolean;
    maxRetries: number;
    timeout?: number;
  };

  // Workflow
  workflowSteps?: Array<{
    name: string;
    type: string;
    config: any;
  }>;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```javascript
db.departments.createIndexes([
  { key: { slug: 1 }, unique: true },
  { key: { codeDepNumber: 1 }, unique: true },
  { key: { gatherCheck: 1 } },
  { key: { isActive: 1 } }
])
```

---

#### 3. Project Readiness Collection
**Purpose**: Track department evaluation status and results

```typescript
interface ProjectReadiness {
  id: string;
  projectId: string;
  departmentId: string;

  // Evaluation Status
  status: 'idle' | 'in_progress' | 'completed' | 'failed';
  taskId?: string; // Task service task ID
  taskStatus?: string;

  // Results
  rating?: number; // 0-100 quality score
  evaluationSummary?: string;
  recommendations?: string[];
  issues?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;

  // Context
  gatherDataCount?: number;
  previousDepartmentRating?: number;

  // Metadata
  lastEvaluatedAt?: Date;
  evaluatedBy?: string; // User ID
  retryCount?: number;
  processingTimeMs?: number;

  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```javascript
db['project-readiness'].createIndexes([
  { key: { projectId: 1, departmentId: 1 }, unique: true },
  { key: { taskId: 1 } },
  { key: { status: 1 } },
  { key: { lastEvaluatedAt: -1 } }
])
```

---

#### 4. Character References Collection
**Purpose**: Qualified character data

```typescript
interface CharacterReference {
  id: string;
  projectId: string;

  // Identity
  name: string;
  fullName?: string;
  aliases?: string[];

  // Attributes
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  age?: number;
  gender?: string;
  species?: string;

  // Personality
  personality?: {
    traits: string[];
    strengths: string[];
    weaknesses: string[];
    motivations: string[];
    fears: string[];
  };

  // Appearance
  appearance?: {
    height?: string;
    build?: string;
    hairColor?: string;
    eyeColor?: string;
    distinguishingFeatures?: string[];
    clothing?: string;
  };

  // Voice
  voice?: {
    accent?: string;
    tone?: string;
    pitch?: string;
    speechPatterns?: string[];
    voiceActorRef?: string;
  };

  // Backstory
  backstory?: string;
  relationships?: Array<{
    characterId: string;
    type: string;
    description: string;
  }>;

  // Media
  referenceImages?: string[]; // Media IDs
  voiceSamples?: string[]; // Media IDs

  // Metadata
  brainNodeId?: string; // Link to Brain service
  qualityScore?: number;
  isPublic: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

---

#### 5. Episodes Collection
**Purpose**: Episode/scene structure for series

```typescript
interface Episode {
  id: string;
  projectId: string;

  // Identity
  title: string;
  episodeNumber?: number;
  season?: number;

  // Content
  synopsis?: string;
  script?: string;
  duration?: number; // seconds

  // Structure
  scenes?: Array<{
    sceneNumber: number;
    location: string;
    characters: string[]; // Character IDs
    description: string;
    dialogue?: Array<{
      character: string;
      line: string;
      emotion?: string;
    }>;
  }>;

  // Production
  status: 'outline' | 'scripted' | 'storyboarded' | 'produced';
  airDate?: Date;

  // Media
  thumbnail?: string; // Media ID
  videoAssets?: string[]; // Media IDs

  createdAt: Date;
  updatedAt: Date;
}
```

---

### User Collection (Built-in PayloadCMS)
```typescript
interface User {
  id: string;
  email: string;
  password: string; // Hashed

  // Profile
  name?: string;
  avatar?: string; // Media ID

  // Permissions
  roles: Array<'admin' | 'editor' | 'viewer'>;

  // Settings
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

---

## Tier 2: Gather Databases (MongoDB)

### Database Structure
Each project gets its own isolated database for unqualified data:

```
Database Name: aladdin-gather-{projectId}
Collection: gather
```

### Gather Collection Schema

```typescript
interface GatherItem {
  _id: ObjectId;
  projectId: string; // Redundant for safety

  // Content
  content: string; // JSON stringified user content
  imageUrl?: string;
  documentUrl?: string;

  // AI Processing
  summary: string; // AI-generated summary
  context: string; // AI-extracted context
  extractedText?: string; // OCR/vision results
  duplicateCheckScore?: number; // 0-1 similarity
  iterationCount?: number; // AI refinement iterations

  // Automation
  isAutomated?: boolean;
  automationMetadata?: {
    taskId: string;
    department: string;
    departmentName: string;
    iteration: number;
    qualityScore: number;
    basedOnNodes: string[]; // Brain node IDs
    model: string;
  };

  // Metadata
  createdAt: Date;
  createdBy: string; // User ID
  lastUpdated: Date;
}
```

### Schema Validation (MongoDB)
```javascript
db.createCollection('gather', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['projectId', 'content', 'summary', 'context', 'createdAt', 'createdBy'],
      properties: {
        projectId: { bsonType: 'string' },
        content: { bsonType: 'string' },
        imageUrl: { bsonType: 'string' },
        documentUrl: { bsonType: 'string' },
        summary: { bsonType: 'string' },
        context: { bsonType: 'string' },
        extractedText: { bsonType: 'string' },
        duplicateCheckScore: { bsonType: 'number' },
        iterationCount: { bsonType: 'number' },
        createdAt: { bsonType: 'date' },
        createdBy: { bsonType: 'string' },
        lastUpdated: { bsonType: 'date' },
        isAutomated: { bsonType: 'bool' },
        automationMetadata: {
          bsonType: 'object',
          properties: {
            taskId: { bsonType: 'string' },
            department: { bsonType: 'string' },
            departmentName: { bsonType: 'string' },
            iteration: { bsonType: 'number' },
            qualityScore: { bsonType: 'number' },
            basedOnNodes: { bsonType: 'array', items: { bsonType: 'string' } },
            model: { bsonType: 'string' }
          }
        }
      }
    }
  }
})
```

### Indexes
```javascript
db.gather.createIndexes([
  { key: { projectId: 1 } },
  { key: { lastUpdated: -1 } },
  { key: { createdAt: -1 } },
  { key: { summary: 'text', context: 'text', content: 'text' } }, // Full-text search
  { key: { isAutomated: 1 } },
  { key: { 'automationMetadata.department': 1 } },
  { key: { 'automationMetadata.taskId': 1 } }
])
```

### Database Locking

After validation and migration, gather databases are locked:

```typescript
// _system_lock collection
interface DatabaseLock {
  databaseName: string; // aladdin-gather-{projectId}
  isLocked: boolean;
  lockedAt: Date;
  lockedBy: string; // User ID
  reason: string;
  migratedToSlug: string; // Target qualified collection
  unlockedAt?: Date;
  unlockedBy?: string;
}
```

---

## Tier 3: Brain Service (Neo4j)

### Graph Database Structure

**Database**: Neo4j Cloud/Aura
**Access**: Via Brain Service API (brain.ft.tc)

### Node Types

```cypher
// Node labels and properties
(:Character {
  id: string,
  type: 'character',
  name: string,
  projectId: string,
  fullName: string,
  role: string,
  personality: json_string,
  appearance: json_string,
  voice: json_string,
  createdAt: datetime,
  updatedAt: datetime,
  embedding: float[] // 1024-dim Jina embeddings
})

(:Scene {
  id: string,
  type: 'scene',
  name: string,
  projectId: string,
  description: string,
  location: string,
  timeOfDay: string,
  mood: string,
  sceneNumber: int,
  embedding: float[]
})

(:Location {
  id: string,
  type: 'location',
  name: string,
  projectId: string,
  description: string,
  locationType: string,
  atmosphere: string,
  embedding: float[]
})

(:Dialogue {
  id: string,
  type: 'dialogue',
  text: string,
  character: string,
  projectId: string,
  emotion: string,
  context: string,
  embedding: float[]
})

(:Project {
  id: string,
  type: 'project',
  name: string,
  slug: string,
  description: string,
  genre: string,
  status: string
})

(:Gather {
  id: string,
  type: 'gather',
  projectId: string,
  content: string, // Content used for embedding
  properties: json_string, // Additional metadata
  embedding: float[]
})
```

### Relationship Types

```cypher
// Character relationships
(:Character)-[:FEATURES_IN]->(:Scene)
(:Character)-[:INTERACTS_WITH]->(:Character)
(:Character)-[:RELATED_TO {relationship: string}]->(:Character)
(:Character)-[:CONFLICTS_WITH]->(:Character)

// Scene relationships
(:Scene)-[:TAKES_PLACE_IN]->(:Location)
(:Scene)-[:FOLLOWS]->(:Scene)
(:Scene)-[:PRECEDES]->(:Scene)
(:Scene)-[:PART_OF]->(:Episode)

// Content relationships
(:Character)-[:CONTAINS]->(:Dialogue)
(:Scene)-[:CONTAINS]->(:Dialogue)
(:Gather)-[:REFERENCES]->(:Character|:Scene|:Location)
(:Gather)-[:SIMILAR_TO {similarity: float}]->(:Gather)
(:Gather)-[:CONTRADICTS {reason: string}]->(:Gather)

// Project structure
(:Character|:Scene|:Location)-[:BELONGS_TO]->(:Project)
(:Gather)-[:BELONGS_TO]->(:Project)
```

### Embedding Storage

Embeddings are stored as node properties:
```cypher
CREATE (n:Gather {
  id: 'gather-123',
  type: 'gather',
  content: 'Hero discovers power...',
  projectId: 'project-abc',
  embedding: [0.123, -0.456, 0.789, ...] // 1024 dimensions
})
```

### Semantic Search

```cypher
// Vector similarity search (via Brain API)
MATCH (n:Gather)
WHERE n.projectId = $projectId
WITH n,
     gds.similarity.cosine(n.embedding, $queryEmbedding) AS similarity
WHERE similarity >= $threshold
RETURN n, similarity
ORDER BY similarity DESC
LIMIT $limit
```

### Consistency Tracking

```cypher
// Track contradictions
CREATE (n1:Gather)-[:CONTRADICTS {
  reason: 'Eye color mismatch',
  severity: 'high',
  detectedAt: datetime()
}]->(n2:Gather)
```

---

## Data Flow Diagrams

### 1. Gather Item Creation Flow

```
User Input
    │
    ▼
┌─────────────────────┐
│   POST /gather      │
│  (Next.js API)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   AI Processor      │
│ • Summarize         │
│ • Extract context   │
│ • OCR (if image)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Duplicate Check    │
│  (Brain Service)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Save to Gather DB  │
│  (MongoDB)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Index in Brain     │
│  (Neo4j + Embed)    │
└─────────────────────┘
```

### 2. Evaluation Flow

```
User Triggers
    │
    ▼
┌─────────────────────┐
│  Validate Previous  │
│  Dept (if needed)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Gather All Data    │
│  (Gather DB)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Get Previous Evals │
│  (PayloadCMS)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Submit to Tasks    │
│  (Celery Queue)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AI Evaluation      │
│  (Task Worker)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Webhook Callback   │
│  (Update Status)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update Readiness   │
│  (PayloadCMS)       │
└─────────────────────┘
```

### 3. Migration Flow (Gather → PayloadCMS)

```
Evaluation Complete
(Rating >= Threshold)
    │
    ▼
┌─────────────────────┐
│  Validate Data      │
│  (Brain Service)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Transform Schema   │
│  (Gather → Payload) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create Records     │
│  (CharacterRefs)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update Brain Graph │
│  (Link nodes)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Lock Gather DB     │
│  (Prevent changes)  │
└─────────────────────┘
```

---

## Migration Procedures

### 1. Gather to CharacterReferences Migration

```typescript
import { gatherDB } from '@/lib/db/gatherDatabase'
import { getPayload } from 'payload'
import { getBrainClient } from '@/lib/brain/client'

async function migrateGatherToCharacters(projectId: string) {
  // 1. Get all character-related gather items
  const items = await gatherDB.getItemsByDepartment(projectId, 'character')

  // 2. Group by character (using Brain clustering)
  const brain = getBrainClient()
  const clusters = await brain.clusterNodes(
    items.map(i => i._id.toString()),
    { threshold: 0.8 }
  )

  // 3. Transform to CharacterReference schema
  const payload = await getPayload({ config })

  for (const cluster of clusters) {
    const characterData = mergeClusterData(cluster.items)

    // Create character reference
    const character = await payload.create({
      collection: 'character-references',
      data: {
        projectId,
        name: characterData.name,
        personality: characterData.personality,
        appearance: characterData.appearance,
        voice: characterData.voice,
        brainNodeId: cluster.brainNodeId,
        qualityScore: cluster.qualityScore
      }
    })

    // Update Brain graph
    await brain.updateNode({
      nodeId: cluster.brainNodeId,
      properties: {
        characterRefId: character.id,
        migrated: true
      }
    })
  }

  // 4. Lock gather database
  await gatherDB.lockDatabase(
    projectId,
    'migration-script',
    'character-references',
    'Migrated to CharacterReferences collection'
  )

  console.log('✅ Migration complete')
}
```

### 2. Database Backup Procedure

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function backupGatherDatabase(projectId: string) {
  const dbName = `aladdin-gather-${projectId}`
  const timestamp = new Date().toISOString().replace(/:/g, '-')
  const backupPath = `./backups/${dbName}-${timestamp}`

  // MongoDB dump
  await execAsync(
    `mongodump --db=${dbName} --out=${backupPath}`
  )

  // Compress
  await execAsync(
    `tar -czf ${backupPath}.tar.gz ${backupPath}`
  )

  console.log(`✅ Backup created: ${backupPath}.tar.gz`)
}
```

### 3. Database Restore Procedure

```typescript
async function restoreGatherDatabase(projectId: string, backupFile: string) {
  const dbName = `aladdin-gather-${projectId}`

  // Extract backup
  await execAsync(`tar -xzf ${backupFile}`)

  // Restore
  const backupPath = backupFile.replace('.tar.gz', '')
  await execAsync(
    `mongorestore --db=${dbName} ${backupPath}/${dbName}`
  )

  console.log(`✅ Database restored: ${dbName}`)
}
```

---

## Performance Considerations

### Indexing Strategy

1. **PayloadCMS Collections**: Auto-indexed by Payload
2. **Gather Collections**: Manual indexes for search/filter
3. **Neo4j Graph**: Automatic node/relationship indexes

### Query Optimization

```typescript
// ✅ Good: Use projection to limit fields
db.gather.find(
  { projectId: 'abc123' },
  { summary: 1, context: 1, createdAt: 1 }
)

// ❌ Bad: Return all fields
db.gather.find({ projectId: 'abc123' })
```

### Caching Strategy

```typescript
// Cache frequently accessed data
import { redis } from '@/lib/redis'

async function getProjectWithCache(projectId: string) {
  const cacheKey = `project:${projectId}`

  // Check cache
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Fetch from DB
  const project = await payload.findByID({
    collection: 'projects',
    id: projectId
  })

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(project))

  return project
}
```

---

## Monitoring

### Database Health Checks

```typescript
async function checkDatabaseHealth() {
  // PayloadCMS
  const payloadHealthy = await payload.db.connection.readyState === 1

  // Gather DB
  const gatherHealthy = await gatherDB.isConnected

  // Brain Service
  const brainHealthy = await brainClient.healthCheck()

  return {
    payload: payloadHealthy,
    gather: gatherHealthy,
    brain: brainHealthy.status === 'ok'
  }
}
```

---

## Support

For database schema questions:
- MongoDB Docs: https://docs.mongodb.com
- Neo4j Docs: https://neo4j.com/docs
- PayloadCMS Docs: https://payloadcms.com/docs
