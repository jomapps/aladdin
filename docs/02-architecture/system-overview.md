# System Overview

**Purpose**: High-level understanding of Aladdin's architecture  
**Audience**: Developers, Architects, Technical Leads  
**Updated**: October 4, 2025

---

## 🎯 What is Aladdin?

Aladdin is an AI-powered movie production platform that enables anyone to create professional-quality movies and series through an intelligent chat interface. The system uses 50+ specialized AI agents to guide users from initial concept to final video production.

### Core Philosophy
**"Chat-Driven Data Pipeline with Flexible Quality Rating"**

Unlike traditional rigid workflows, Aladdin uses a conversational interface where:
- Users and AI agents collaborate to fill the production pipeline
- Data can be added in any order based on natural conversation flow
- Quality is rated rather than enforced through rigid requirements
- The "Brain" (embedding system with Neo4j) validates and enhances data at every step

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chat Interface (UI)                      │
│            User ↔ AI Agents Conversational Flow            │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                   PayloadCMS (Next.js)                      │
│              Structured Data & Collections                   │
│              (Projects, Users, Metadata)                     │
└──────────────────────┬──────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         ↓                             ↓
┌──────────────────┐          ┌──────────────────┐
│   MongoDB #1     │          │   MongoDB #2     │
│  (Structured)    │          │  (Open/Dynamic)  │
│  Payload Data    │          │  [projectId]_*   │
└──────────────────┘          └──────────────────┘
         │                             │
         └──────────────┬──────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                  The Brain (Neo4j + Embeddings)             │
│           Validation, Consistency, Knowledge Graph          │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              AI Agent System (Vercel AI SDK)                │
│                    50+ Specialized Agents                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|----------|
| **Frontend Framework** | Next.js 15 | Full-stack React framework |
| **CMS & Data Layer** | PayloadCMS v3 | Headless CMS for structured data |
| **Primary Database** | MongoDB (Structured) | Payload collections & known schemas |
| **Secondary Database** | MongoDB (Open) | Dynamic JSON collections per project |
| **Knowledge Graph** | Neo4j | "The Brain" - embeddings & validation |
| **AI Framework** | Vercel AI SDK | Agent orchestration & execution |
| **Agent Coordination** | Hierarchical (built-in) | Master → Dept Heads → Specialists |
| **Task Service** | FastAPI + Celery + Redis | GPU-intensive task processing |
| **Image Generation** | FAL.ai | Text-to-image, image-to-image, composite |
| **Video Generation** | FAL.ai | Text-to-video, image-to-video, video-to-video |
| **Voice Generation** | ElevenLabs | Character voice synthesis |
| **Media Storage** | Cloudflare R2 | CDN for images, videos, assets |
| **Cache Layer** | Redis | Multi-layer caching strategy |
| **UI Components** | Shadcn/ui + Tailwind CSS | Production-ready accessible components |

---

## 📊 Dual Database Architecture

### Why Two Databases?

1. **Structured Data (MongoDB #1)**: Known schemas that benefit from PayloadCMS features
   - Authentication, hooks, admin UI
   - Fixed schemas: projects, users, media, conversations
   - Relationships and constraints

2. **Dynamic Data (MongoDB #2)**: Flexible JSON documents that evolve during production
   - Per-project collections: `[projectId]_[collectionName]`
   - Flexible schemas for characters, scenes, locations
   - AI-generated content with varying structures

### Database #1: PayloadCMS Collections

**Core Collections:**
- `projects` - Project metadata, settings, team
- `users` - Authentication, roles, permissions
- `media` - File uploads, references, CDN links
- `conversations` - Chat history and context
- `workflows` - Pipeline states, quality ratings
- `agents` - Agent configurations, custom agents

### Database #2: Open MongoDB Collections

**Naming Pattern**: `[projectId]_[collectionName]`

**Examples:**
```
project_abc123_characters
project_abc123_scenes
project_abc123_dialogue
project_abc123_storyboards
project_abc123_shots
```

**Base Document Structure:**
```javascript
{
  _id: ObjectId,
  projectId: "abc123",          // Links to PayloadCMS project
  collectionType: "character",   // Type of content
  version: 1,                    // Version tracking
  createdBy: "user_xyz",         // User or agent ID
  createdAt: ISODate,
  updatedAt: ISODate,
  qualityRating: 0.85,          // AI-assessed quality (0-1)
  brainValidated: true,         // Checked by Neo4j Brain
  
  // Dynamic content - varies by collection type
  content: {
    // Flexible JSON structure
    // For character: name, backstory, appearance, voice, etc.
    // For scene: description, location, characters, timing, etc.
  },
  
  // Chat context
  generatedByAgent: "character-creator",
  conversationId: "conv_456",
  userApproved: true,
  
  // Relationships
  relatedDocuments: [
    { collectionType: "scene", documentId: "scene_789" }
  ]
}
```

---

## 🧠 The Brain: Neo4j Knowledge Graph

### Purpose

The Brain serves as the **validation and consistency engine** that:
- Stores embeddings of all generated content
- Validates new content against existing knowledge
- Identifies inconsistencies and contradictions
- Suggests improvements and connections
- Maintains story coherence across the project

### Qualified Information Pipeline

**Core Principle**: Only quality-validated information enters the Brain.

```
New Information (User/Agent Generated)
    ↓
Pre-Brain Quality Check:
    • Completeness validation
    • Format validation
    • Basic coherence test
    ↓
PASS → Send to Brain
FAIL → Chat asks qualifying questions
    ↓
Brain Validation:
    • Generate embeddings
    • Compare to existing knowledge
    • Check contradictions
    • Calculate quality score (0-1)
    ↓
IF quality ≥ threshold:
    • Store in appropriate database
    • Add to Brain knowledge graph
    • Mark brainValidated: true
    • Now available for future validations
ELSE:
    • Present to user with issues
    • Options: MODIFY/DISCARD/ACCEPT-ANYWAY
```

### Knowledge Graph Structure

**Node Types:**
- `Project` - Top-level project nodes
- `Character` - Character profiles
- `Scene` - Scene definitions
- `Location` - Environment nodes
- `Dialogue` - Dialogue sequences
- `Image` - Visual references
- `Video` - Video clips
- `Prop`, `Costume`, `WorldBuilding`, etc.

**Relationship Types:**
- `APPEARS_IN` - Character → Scene
- `LOCATED_AT` - Scene → Location
- `RELATES_TO` - Character → Character
- `USES` - Character → Prop
- `FOLLOWS` - Scene → Scene (sequence)
- `DEPICTS` - Image → Character/Location
- `SHOWS` - Video → Scene
- `CONTRADICTS` - Content conflicts
- `VALIDATES` - Content validations
- `SIMILAR_TO` - Semantic similarity scores

---

## 🤖 AI Agent System

### Three-Tier Hierarchy

Aladdin uses **50+ specialized AI agents** in a hierarchical structure:

```
TIER 1: Master Orchestrator
    ↓
TIER 2: Department Heads (7 fixed)
    • Character Department
    • Story Department
    • Visual Department
    • Image Quality Department
    • Audio Department
    • Production Department
    ↓
TIER 3: Specialist Agents (50+)
    On-demand, single-purpose agents
```

### Agent Execution Flow

1. **Master Orchestrator**
   - Parse user intent from chat messages
   - Determine scope and complexity
   - Route to appropriate department heads
   - Coordinate parallel department execution
   - Validate cross-department consistency

2. **Department Heads**
   - Assess relevance to their domain
   - Identify required specialists
   - Spawn specialists in parallel
   - Grade each output (quality, relevance, consistency)
   - Compile department report

3. **Specialist Agents**
   - Execute specific tasks
   - Self-assess confidence scores
   - Provide structured outputs
   - Terminate after completion

### Vercel AI SDK Integration

All AI operations flow through the Vercel AI SDK:

```
User Request
    ↓
Handler (chatHandler, queryHandler, etc.)
    ↓
AladdinAgentRunner
    ↓
AIAgentExecutor
    ↓
Vercel AI SDK (generateText/generateObject)
    ↓
OpenRouter API
    ↓
Claude Sonnet 4.5
```

---

## 🔄 Production Pipeline

### Phase 1: EXPANSION (Data Generation)

**Goal**: Generate comprehensive production data from initial idea

**Process:**
1. User provides movie/series idea via chat
2. AI agents generate content:
   - Story structure, episodes, scenes
   - Character profiles, relationships
   - World building, locations
   - Dialogue, screenplay
3. Each generation:
   - Stored in open MongoDB: `[projectId]_[type]`
   - Validated by Brain (Neo4j embeddings)
   - User can accept/modify/reject
   - Quality rating assigned

**Completion Criteria:**
- Story structure is complete
- All characters are defined
- Screenplay is finalized
- User approves to move to compacting phase

### Phase 2: COMPACTING (Visual Production)

**Goal**: Transform text-based content into visual media

**Process:**
1. **Image Generation**:
   - Character designs
   - Location/environment renders
   - Storyboard frames
   - Composite images (layered edits)

2. **Video Generation** (max 7 seconds):
   - Text-to-video
   - Image-to-video (single image)
   - Image-to-video (first + last frame)
   - Composite images supported

3. **Scene Assembly**:
   - Multiple 7s clips combined
   - Audio integration
   - Effects, transitions

---

## 📈 Quality System

### Quality Dimensions

| Dimension | Weight | Evaluation |
|-----------|--------|------------|
| **Coherence** | 25% | Fits with existing story/characters |
| **Creativity** | 20% | Novel and engaging |
| **Technical Quality** | 20% | Well-structured, clear |
| **Consistency** | 20% | No contradictions |
| **User Intent** | 15% | Matches what user asked for |

### Rating Scale

- **0.90 - 1.00**: Excellent - Ready for production
- **0.75 - 0.89**: Good - Minor refinements suggested
- **0.60 - 0.74**: Acceptable - Consider revision
- **0.40 - 0.59**: Weak - Recommend regeneration
- **0.00 - 0.39**: Poor - Discard and start over

### Pipeline Completion Thresholds

**Expansion Phase:**
- Average quality ≥ 0.75 across all content
- No critical consistency issues
- User approval to proceed

**Compacting Phase:**
- Visual quality ≥ 0.80
- Technical quality (resolution, rendering) ≥ 0.85
- User approval for final output

---

## 🔗 Key Integrations

### External Services

1. **OpenRouter** - LLM model access
   - Primary model: Claude Sonnet 4.5
   - Fallback models available
   - Token-based pricing

2. **FAL.ai** - Image and video generation
   - Text-to-image: FLUX models
   - Image-to-video: Kling, Runway
   - Composite image generation

3. **ElevenLabs** - Voice synthesis
   - Custom voice profiles
   - Emotion control
   - Multi-language support

4. **Cloudflare R2** - Media storage
   - S3-compatible API
   - Built-in CDN
   - No egress fees

### Internal Services

1. **Brain Service** - Neo4j knowledge graph
   - RESTful API
   - Embedding generation
   - Consistency validation

2. **Task Queue** - Background processing
   - Celery workers
   - Redis broker
   - Job status tracking

---

## 🎯 Key Design Principles

1. **Flexibility Over Rigidity** - Natural conversation flow vs forced steps
2. **Quality-First** - All content validated before acceptance
3. **Project Isolation** - Each project has its own data space
4. **Incremental Generation** - Build content piece by piece
5. **User Control** - Human in the loop for all decisions
6. **Scalable Architecture** - Handle unlimited projects and users
7. **Real-Time Collaboration** - Multiple users can work together

---

## 📚 Related Documentation

- [Technology Stack Details](./tech-stack.md) - Complete technology overview
- [Database Architecture](./database.md) - MongoDB and Neo4j details
- [The Brain (Neo4j)](./brain.md) - Knowledge graph implementation
- [AI Agent System](./agent-system.md) - Agent hierarchy and execution
- [Vercel AI SDK Integration](../04-ai-agents/vercel-ai-sdk.md) - Current AI implementation
- [Quick Start Guide](../01-getting-started/quick-start.md) - Get running in 5 minutes
- [Ubuntu Deployment Guide](../07-deployment/ubuntu-deployment.md) - Production setup

---

**Document Version**: 1.0.0  
**Last Updated**: October 4, 2025  
**Next Review**: January 4, 2026