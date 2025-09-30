# Aladdin - Data Models Specification

**Version**: 0.2.0  
**Last Updated**: January 28, 2025  
**Parent Document**: [SPECIFICATION.md](./SPECIFICATION.md)

---

## Overview

Aladdin uses a **dual-database architecture**:

1. **PayloadCMS Collections** - Curated, well-known production data with admin UI
2. **Per-Project Open Databases** - Flexible storage for ad-hoc information
3. **Neo4j Brain** - Knowledge graph with embeddings for validation

### Key Principles
- **Project ID binds everything** across all databases
- **Only `name` field is required** in all collections (flexibility first)
- **All changes hook to the Brain** for validation and consistency
- **PayloadCMS for known structures**, open databases for everything else

---

## 1. PayloadCMS Curated Collections

These are managed by PayloadCMS with admin backend editing capabilities.

### 1.1 Projects Collection

**Purpose**: Core project metadata - the foundation that binds everything

**Hooks**: `afterChange` → Send to Brain for embedding

```typescript
interface Project {
  // Required
  id: string;                    // Primary key - binds all data
  name: string;                  // REQUIRED - Only required field
  slug: string;                  // URL-friendly, auto-generated from name
  
  // Project Type
  type?: 'movie' | 'series';
  
  // Production Info
  targetLength?: number;         // Minutes (for movie) or per episode
  targetEpisodes?: number;       // For series
  genre?: string[];              // e.g., ['sci-fi', 'thriller']
  logline?: string;              // One-sentence description
  synopsis?: string;             // Full description
  targetAudience?: string;       // e.g., "Young Adults 18-35"
  contentRating?: string;        // e.g., "PG-13", "TV-MA"
  
  // Story Development
  initialIdea?: string;          // User's original concept
  storyPremise?: string;         // Developed premise
  themes?: string[];             // Core themes
  tone?: string;                 // e.g., "dark", "comedic"
  
  // Production Status
  phase?: 'expansion' | 'compacting' | 'complete';
  status?: 'active' | 'paused' | 'archived' | 'complete';
  expansionProgress?: number;    // 0-100%
  compactingProgress?: number;   // 0-100%
  
  // Quality Metrics
  overallQuality?: number;       // 0-1, calculated average
  qualityBreakdown?: {
    story?: number;
    characters?: number;
    visuals?: number;
    technical?: number;
  };
  
  // Team & Access
  owner: Relationship<User>;     // Project creator
  team?: Array<{
    user: Relationship<User>;
    role: 'producer' | 'director' | 'writer' | 'editor' | 'viewer';
    permissions?: string[];      // e.g., ['edit', 'generate', 'approve']
    addedAt: Date;
  }>;
  
  // Settings
  settings?: {
    brainValidationRequired?: boolean;     // Must pass Brain check
    minQualityThreshold?: number;          // Minimum acceptable (0-1)
    autoGenerateImages?: boolean;          // Auto-create character images
    videoGenerationProvider?: string;      // e.g., 'runwayml'
    maxBudget?: number;                    // Generation cost limit
  };
  
  // Open Database Reference
  openDatabaseName: string;      // e.g., "open_project-slug"
  dynamicCollections?: string[]; // List of created collections
  
  // Metadata
  tags?: string[];
  coverImage?: Relationship<Media>;
  isPublic?: boolean;
  
  // Timestamps (auto-managed by PayloadCMS)
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
}
```

### 1.2 Episodes Collection (For Series)

**Purpose**: Episode-level structure for series projects

**Hooks**: `afterChange` → Send to Brain

```typescript
interface Episode {
  // Required
  name: string;                  // REQUIRED - e.g., "Episode 1: The Beginning"
  
  // Basic Info
  project: Relationship<Project>;
  episodeNumber: number;         // 1, 2, 3...
  seasonNumber?: number;         // For multi-season series
  
  // Story
  title?: string;                // Episode title
  logline?: string;              // One-sentence summary
  synopsis?: string;             // Full episode description
  
  // Production
  targetLength?: number;         // Minutes
  status?: 'outlined' | 'scripted' | 'storyboarded' | 'generated' | 'complete';
  
  // Quality
  qualityRating?: number;        // 0-1
  
  // Story Structure
  actStructure?: Array<{
    actNumber: number;
    description?: string;
    sceneCount?: number;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.3 Users Collection

**Purpose**: Authentication and user management

```typescript
interface User {
  // Required
  id: string;
  email: string;                 // Unique
  password: string;              // Hashed by PayloadCMS
  
  // Profile (name is combination)
  name?: string;                 // Full name
  firstName?: string;
  lastName?: string;
  displayName?: string;          // Chat display name
  avatar?: Relationship<Media>;
  bio?: string;
  
  // Roles & Access
  role?: 'admin' | 'creator' | 'viewer';
  subscriptionTier?: 'free' | 'pro' | 'enterprise';
  
  // Usage Stats
  stats?: {
    projectsCreated?: number;
    imagesGenerated?: number;
    videosGenerated?: number;
    brainQueries?: number;
    totalApiCalls?: number;
  };
  
  // Preferences
  preferences?: {
    defaultModel?: string;       // e.g., "gpt-4"
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    language?: string;           // e.g., "en"
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

### 1.4 Media Collection

**Purpose**: File uploads and CDN references

**Hooks**: `afterChange` → Send metadata to Brain

```typescript
interface Media {
  // Required
  id: string;
  filename: string;
  url: string;                   // Cloudflare R2 CDN URL
  
  // File Info
  mimeType?: string;             // e.g., "image/png"
  filesize?: number;             // Bytes
  width?: number;                // For images/videos
  height?: number;
  duration?: number;             // For videos (seconds)
  
  // Storage
  thumbnailUrl?: string;         // Auto-generated
  
  // Project Association
  project?: Relationship<Project>;
  
  // Open Database Link
  linkedDocument?: {
    database: string;            // e.g., "open_project-slug"
    collection: string;          // e.g., "characters"
    documentId: string;          // Document _id
    field?: string;              // Field name
  };
  
  // Generation Info (if AI-generated)
  generatedBy?: {
    agent?: string;              // Agent that created it
    prompt?: string;             // Generation prompt
    model?: string;              // AI model used
    parameters?: Record<string, any>;
  };
  
  // Metadata
  alt?: string;                  // Accessibility
  caption?: string;
  tags?: string[];
  
  // Upload Info
  uploadedBy?: Relationship<User>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.5 Conversations Collection

**Purpose**: Chat history for the project

```typescript
interface Conversation {
  // Required
  name: string;                  // REQUIRED - e.g., "Main Project Chat"
  
  // Association
  project: Relationship<Project>;
  user?: Relationship<User>;
  
  // Messages (stored as JSON array)
  messages?: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    agentId?: string;            // Which agent responded
  }>;
  
  // Status
  status?: 'active' | 'archived';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}
```

### 1.6 Workflows Collection

**Purpose**: Track pipeline states and quality gates

```typescript
interface Workflow {
  // Required
  name: string;                  // REQUIRED - e.g., "Main Production Workflow"
  
  // Association
  project: Relationship<Project>;
  
  // Current State
  currentPhase?: 'expansion' | 'compacting' | 'complete';
  
  // Quality Gates
  qualityGates?: Array<{
    name: string;
    threshold: number;           // 0-1
    passed?: boolean;
    evaluatedAt?: Date;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 2. Per-Project Open MongoDB Databases

### 2.1 Database Naming

Each project gets its own database: `open_[project-slug]`

Example:
- Project slug: `cyber-detective-2099`
- Database: `open_cyber-detective-2099`

### 2.2 Collection Naming

Grouped by logical content type:
- `characters`
- `scenes`
- `locations`
- `dialogue`
- `storyboards`
- `images`
- `videos`
- `audio`
- `props`
- `costumes`
- `worldbuilding`
- `storynotes`
- etc.

### 2.3 Base Document Structure

All documents share this base structure with **flexible `content`**:

**Hooks**: All changes → Send to Brain for validation

```typescript
interface BaseDocument {
  _id: ObjectId;
  
  // Required
  name: string;                  // REQUIRED - Only required field
  
  // Project Binding
  projectId: string;             // Links to PayloadCMS Project.id
  collectionName: string;        // e.g., "characters"
  
  // Versioning
  version?: number;              // Version number
  previousVersionId?: string;    // Link to previous version
  
  // Authorship
  createdBy?: string;            // User ID or agent ID
  createdByType?: 'user' | 'agent';
  generatedByAgent?: string;     // Agent ID if AI-generated
  conversationId?: string;       // Chat conversation reference
  messageId?: string;            // Message that created this
  
  // Quality & Validation
  qualityRating?: number;        // 0-1
  qualityDimensions?: {
    coherence?: number;
    creativity?: number;
    technical?: number;
    consistency?: number;
    userIntent?: number;
  };
  brainValidated?: boolean;
  brainValidationResults?: {
    score?: number;
    issues?: string[];
    suggestions?: string[];
    relatedContent?: string[];
  };
  
  // User Approval
  userApproved?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'deferred';
  userFeedback?: string;
  
  // Relationships
  relatedDocuments?: Array<{
    collection: string;          // e.g., "scenes"
    documentId: string;          // Document _id
    relationship?: string;       // e.g., "APPEARS_IN"
  }>;
  
  // Tags & Search
  tags?: string[];
  searchableText?: string;       // For full-text search
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  
  // FLEXIBLE CONTENT - Varies by collection type
  content: Record<string, any>;
}
```

---

## 3. Open Database Collections - Content Structures

### 3.1 Characters Collection

```typescript
interface CharacterDocument extends BaseDocument {
  name: string;                  // REQUIRED - Character name
  
  content: {
    // Basic Info (all optional)
    fullName?: string;
    aliases?: string[];
    age?: number | string;
    gender?: string;
    species?: string;
    
    // Role
    role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'background';
    importance?: number;         // 1-10
    arcType?: string;
    
    // Personality
    personalityTraits?: string[];
    strengths?: string[];
    weaknesses?: string[];
    fears?: string[];
    desires?: string[];
    motivations?: string[];
    quirks?: string[];
    
    // Backstory
    backstory?: string;
    occupation?: string;
    education?: string;
    family?: string;
    significantEvents?: string[];
    
    // Relationships
    relationships?: Array<{
      characterId: string;
      characterName?: string;
      type: string;              // e.g., "partner", "rival", "mentor"
      description?: string;
    }>;
    
    // Appearance
    physicalDescription?: string;
    height?: string;
    build?: string;
    hairColor?: string;
    hairStyle?: string;
    eyeColor?: string;
    skinTone?: string;
    distinctiveFeatures?: string[];
    tattoosPiercings?: string;
    
    // Style
    fashionStyle?: string;
    typicalOutfit?: string;
    accessories?: string[];
    
    // Voice & Speech
    voiceDescription?: string;
    accent?: string;
    speechPatterns?: string[];
    catchphrases?: string[];
    voiceModelId?: string;       // AI voice model reference
    
    // Character Arc
    startingState?: string;
    wantVsNeed?: string;
    internalConflict?: string;
    externalConflict?: string;
    transformation?: string;
    endingState?: string;
    keyMoments?: Array<{
      sceneId?: string;
      description: string;
      impact?: string;
    }>;
    
    // Media References
    portraitImageId?: string;    // Media ID from PayloadCMS
    referenceImages?: string[];  // Array of Media IDs
    inspirationImages?: string[];
    
    // Additional flexible fields
    [key: string]: any;          // Truly flexible for ad-hoc info
  };
}
```

### 3.2 Scenes Collection

```typescript
interface SceneDocument extends BaseDocument {
  name: string;                  // REQUIRED - Scene name/title
  
  content: {
    // Story Position (all optional)
    episodeNumber?: number;
    actNumber?: number;
    sceneNumber?: string;        // e.g., "1A", "5B"
    sequenceNumber?: number;
    
    // Location & Setting
    locationName?: string;
    locationType?: 'interior' | 'exterior' | 'mixed';
    locationDescription?: string;
    locationId?: string;         // Link to location document
    timeOfDay?: 'dawn' | 'morning' | 'day' | 'afternoon' | 'evening' | 'dusk' | 'night';
    season?: string;
    weather?: string;
    
    // Content
    logline?: string;            // One-line summary
    description?: string;        // Full scene description
    purpose?: string;            // Story purpose
    dramaticBeat?: string;       // Story beat type
    conflict?: string;
    outcome?: string;
    
    // Characters
    charactersPresent?: Array<{
      characterId: string;
      characterName?: string;
      role: 'main' | 'supporting' | 'background';
      emotionalState?: string;
      objective?: string;
    }>;
    
    // Dialogue
    dialogue?: Array<{
      characterId: string;
      characterName?: string;
      text: string;
      action?: string;           // Stage direction
      emotion?: string;
      subtext?: string;
    }>;
    
    // Action/Blocking
    action?: string;             // Physical action description
    blocking?: string;           // Character positioning
    
    // Cinematography
    visualMood?: string;
    lighting?: string;
    colorPalette?: string[];
    cameraAngles?: string[];
    shotTypes?: string[];        // e.g., "close-up", "wide", "medium"
    cameraMovement?: string;
    framing?: string;
    
    // Audio
    ambientSound?: string;
    soundEffects?: string[];
    musicCue?: string;
    musicMood?: string;
    
    // Pacing
    estimatedDuration?: number;  // Seconds
    targetLength?: number;
    pacing?: 'slow' | 'medium' | 'fast' | 'varied';
    tension?: number;            // 1-10 scale
    
    // Production Status
    productionStatus?: 'outlined' | 'scripted' | 'storyboarded' | 'generated' | 'edited' | 'final';
    
    // Generated Assets
    storyboardImages?: string[]; // Media IDs
    generatedVideoClips?: string[];
    finalVideoId?: string;
    
    // Notes
    productionNotes?: string;
    technicalNotes?: string;
    
    [key: string]: any;
  };
}
```

### 3.3 Locations Collection

```typescript
interface LocationDocument extends BaseDocument {
  name: string;                  // REQUIRED - Location name
  
  content: {
    // Basic Info
    type?: 'interior' | 'exterior' | 'mixed';
    category?: string;           // e.g., "home", "office", "street", "nature"
    description?: string;
    
    // Setting Details
    architecture?: string;
    sizeScale?: string;          // e.g., "small room", "vast landscape"
    timepe riod?: string;
    geographicLocation?: string;
    climate?: string;
    
    // Atmosphere
    mood?: string;
    lighting?: string;
    soundscape?: string;
    smell?: string;
    temperature?: string;
    
    // Visual Details
    keyFeatures?: string[];
    colorScheme?: string[];
    textures?: string[];
    
    // Practical Info
    accessibility?: string;
    capacity?: string;           // How many characters
    
    // Story Significance
    significance?: string;
    symbolism?: string;
    
    // Scenes Here
    scenesFilmedHere?: string[]; // Scene IDs
    
    // Reference Media
    referenceImages?: string[];  // Media IDs
    generatedImages?: string[];
    
    [key: string]: any;
  };
}
```

### 3.4 Dialogue Collection

```typescript
interface DialogueDocument extends BaseDocument {
  name: string;                  // REQUIRED - e.g., "Opening Exchange"
  
  content: {
    // Context
    sceneId?: string;
    characterId?: string;
    characterName?: string;
    
    // Dialogue
    lines?: Array<{
      characterId: string;
      characterName?: string;
      text: string;
      action?: string;
      emotion?: string;
      emphasis?: string[];
      pause?: boolean;
      interruption?: boolean;
    }>;
    
    // Audio Generation
    voiceModelId?: string;
    generatedAudioId?: string;   // Media ID
    
    [key: string]: any;
  };
}
```

### 3.5 Images Collection

```typescript
interface ImageDocument extends BaseDocument {
  name: string;                  // REQUIRED - Image title
  
  content: {
    // Type
    imageType?: 'character' | 'location' | 'prop' | 'costume' | 'storyboard' | 'concept' | 'reference';
    
    // Generation
    generationPrompt?: string;
    negativePrompt?: string;
    model?: string;              // e.g., "midjourney-v6"
    style?: string;
    parameters?: Record<string, any>;
    
    // Media Reference
    mediaId?: string;            // PayloadCMS Media ID
    url?: string;
    
    // Composite Info
    isComposite?: boolean;
    compositeSteps?: Array<{
      operation: string;
      prompt: string;
      resultMediaId?: string;
    }>;
    
    // Associations
    linkedToType?: string;       // "character", "scene", etc.
    linkedToId?: string;
    usedInScenes?: string[];
    
    [key: string]: any;
  };
}
```

### 3.6 Videos Collection

```typescript
interface VideoDocument extends BaseDocument {
  name: string;                  // REQUIRED - Video title
  
  content: {
    // Type
    videoType?: 'scene-clip' | 'full-scene' | 'sequence' | 'test' | 'final';
    
    // Generation
    generationMethod?: 'text-to-video' | 'image-to-video' | 'first-last-frame';
    sourcePrompt?: string;
    sourceImageIds?: string[];   // Media IDs
    model?: string;
    parameters?: Record<string, any>;
    
    // Media Reference
    mediaId?: string;            // PayloadCMS Media ID
    url?: string;
    duration?: number;           // Seconds (max 7)
    
    // Associations
    sceneId?: string;
    sequencePosition?: number;
    
    // Status
    renderStatus?: 'queued' | 'processing' | 'complete' | 'failed';
    
    [key: string]: any;
  };
}
```

### 3.7 Storyboards Collection

```typescript
interface StoryboardDocument extends BaseDocument {
  name: string;                  // REQUIRED
  
  content: {
    // Association
    sceneId?: string;
    shotNumber?: number;
    
    // Visual
    description?: string;
    cameraAngle?: string;
    shotType?: string;
    framing?: string;
    movement?: string;
    
    // Timing
    duration?: number;
    
    // Media
    imageId?: string;            // Generated storyboard image
    
    [key: string]: any;
  };
}
```

### 3.8 World Building Collection

```typescript
interface WorldBuildingDocument extends BaseDocument {
  name: string;                  // REQUIRED - e.g., "Society Structure"
  
  content: {
    // Category
    category?: 'rules' | 'geography' | 'culture' | 'history' | 'technology' | 'magic' | 'politics' | 'economy' | 'religion';
    
    // Content
    description?: string;
    details?: Record<string, any>;
    rules?: string[];
    exceptions?: string[];
    
    // Impact
    storyRelevance?: string;
    affectedCharacters?: string[];
    affectedLocations?: string[];
    
    [key: string]: any;
  };
}
```

### 3.9 Props Collection

```typescript
interface PropDocument extends BaseDocument {
  name: string;                  // REQUIRED - Prop name
  
  content: {
    // Type
    type?: string;               // e.g., "weapon", "vehicle", "artifact"
    
    // Description
    description?: string;
    appearance?: string;
    size?: string;
    materials?: string[];
    
    // Significance
    significance?: string;
    owner?: string;              // Character ID
    usedInScenes?: string[];
    
    // Media
    referenceImages?: string[];
    generatedImages?: string[];
    
    [key: string]: any;
  };
}
```

### 3.10 Story Notes Collection

```typescript
interface StoryNoteDocument extends BaseDocument {
  name: string;                  // REQUIRED - Note title
  
  content: {
    // Type
    noteType?: 'idea' | 'plot-point' | 'question' | 'research' | 'reminder' | 'continuity';
    
    // Content
    note?: string;
    details?: string;
    
    // Relationships
    relatedTo?: Array<{
      type: string;
      id: string;
    }>;
    
    // Status
    resolved?: boolean;
    resolution?: string;
    
    [key: string]: any;
  };
}
```

---

## 4. Neo4j Brain Knowledge Graph

### 4.1 Purpose

- **Embeddings**: Vector representations of all content
- **Relationships**: Semantic connections between entities
- **Validation**: Consistency checking across project
- **Search**: Similarity and relationship queries

### 4.2 Node Types

```cypher
// Project Node
(:Project {
  id: string,
  name: string,
  slug: string,
  type: string,
  embedding: vector
})

// Content Nodes (from open databases)
(:Character {
  id: string,
  projectId: string,
  name: string,
  embedding: vector,
  // ... key properties
})

(:Scene), (:Location), (:Dialogue), 
(:Image), (:Video), (:Prop), etc.
```

### 4.3 Relationships

```cypher
(Character)-[:APPEARS_IN]->(Scene)
(Scene)-[:LOCATED_AT]->(Location)
(Character)-[:USES]->(Prop)
(Character)-[:RELATES_TO {type: "rival"}]->(Character)
(Scene)-[:FOLLOWS]->(Scene)
(Image)-[:DEPICTS]->(Character)
(Video)-[:SHOWS]->(Scene)
(Dialogue)-[:SPOKEN_BY]->(Character)
(Dialogue)-[:IN_SCENE]->(Scene)

// Consistency relationships
(Content)-[:CONTRADICTS]->(Content)
(Content)-[:VALIDATES]->(Content)
(Content)-[:SIMILAR_TO {score: float}]->(Content)
```

### 4.4 Brain Operations

**CRITICAL: Quality-Gated Pipeline**

The Brain only accepts qualified information:

**Pre-Brain Quality Check:**
1. Validate completeness (required fields present)
2. Check format and structure
3. Assess initial coherence
4. If fails → Chat asks qualifying questions
5. If passes → Proceed to Brain

**Brain Processing (for qualified info only):**
1. Generate embedding for content
2. Compare against existing knowledge
3. Check for contradictions
4. Calculate quality score (0-1)
5. Store/update node in Neo4j (if score ≥ threshold)
6. Create/update relationships
7. Return validation results

**Post-Brain Storage:**
- PayloadCMS: Structured, known formats
- Open MongoDB: Flexible, ad-hoc data
- Both tagged with: `brainValidated: true`, `qualityRating: number`

**Future Validations:**
- Only Brain-validated content used for new validations
- Builds increasingly accurate validation over time
- Each project isolated (no cross-project validation)

---

## 5. Implementation Notes

### 5.1 PayloadCMS Hooks

All PayloadCMS collections with hooks:

```typescript
// Example hook for Projects
const Projects: CollectionConfig = {
  slug: 'projects',
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        // Send to Brain for embedding
        await sendToBrain({
          type: 'project',
          id: doc.id,
          data: doc,
          operation
        });
      }
    ]
  },
  // ... fields
};
```

### 5.2 Open MongoDB Change Streams

Watch for changes in open databases:

```typescript
// Watch all collections in open database
const changeStream = db.watch();

changeStream.on('change', async (change) => {
  if (change.operationType === 'insert' || 
      change.operationType === 'update') {
    // Send to Brain
    await sendToBrain({
      database: db.name,
      collection: change.ns.coll,
      document: change.fullDocument
    });
  }
});
```

### 5.3 Required Field Validation

Only `name` is required everywhere:

```typescript
// PayloadCMS validation
fields: [
  {
    name: 'name',
    type: 'text',
    required: true,  // ONLY required field
  },
  // All other fields optional
]

// MongoDB schema validation
{
  validator: {
    $jsonSchema: {
      required: ['name'],  // ONLY required
      properties: {
        name: { bsonType: 'string' }
      }
    }
  }
}
```

---

**Status**: Comprehensive Data Models Complete ✓  
**Next**: AI Agent Integration (Section 2)