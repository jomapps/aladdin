# Aladdin - AI Movie Production Platform Specification

**Version**: 0.1.0  
**Last Updated**: January 28, 2025  
**Status**: Living Document - Evolving

---

## 1. Project Overview

### Vision
Aladdin is an AI-powered movie production platform that enables anyone to create professional-quality movies and series through an intelligent chat interface. The system uses 50+ specialized AI agents to guide users from initial concept to final video production.

### Core Philosophy
**"Chat-Driven Data Pipeline with Flexible Quality Rating"**

Unlike traditional rigid workflows, Aladdin uses a conversational interface where:
- Users and AI agents collaborate to fill the production pipeline
- Data can be added in any order based on natural conversation flow
- Quality is rated rather than enforced through rigid requirements
- The "Brain" (embedding system with Neo4j) validates and enhances data at every step

---

## 2. High-Level Architecture

### 2.1 Core Components

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
│              AI Agent System (@codebuff/sdk)                │
│                    50+ Specialized Agents                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|----------|
| **Frontend Framework** | Next.js 15 | Full-stack React framework |
| **CMS & Data Layer** | PayloadCMS v3 | Headless CMS for structured data |
| **Primary Database** | MongoDB (Structured) | Payload collections & known schemas |
| **Secondary Database** | MongoDB (Open) | Dynamic JSON collections per project |
| **Knowledge Graph** | Neo4j (brain.ft.tc) | "The Brain" - embeddings & validation |
| **AI Agent Framework** | @codebuff/sdk | Agent orchestration & execution (37 agents) |
| **Agent Coordination** | Hierarchical (built-in) | Master → Dept Heads → Specialists |
| **Task Service** | FastAPI + Celery + Redis (tasks.ft.tc) | GPU-intensive task processing |
| **Image Generation** | FAL.ai (via Task Service) | Text-to-image, image-to-image, composite |
| **Video Generation** | FAL.ai (via Task Service) | Text-to-video, image-to-video, video-to-video |
| **Voice Generation** | ElevenLabs (via Task Service) | Character voice synthesis |
| **Media Storage** | Cloudflare R2 | CDN for images, videos, assets |

---

## 3. Dual Database Architecture

### 3.1 Database Strategy

**Why Two Databases?**
- **Structured Data (MongoDB #1)**: Known schemas that benefit from PayloadCMS features (auth, hooks, admin UI)
- **Dynamic Data (MongoDB #2)**: Flexible JSON documents that evolve during production

### 3.2 Database #1: PayloadCMS Structured Collections

**Managed by PayloadCMS**, includes:
- `projects` - Project metadata, settings, team
- `users` - Authentication, roles, permissions
- `media` - File uploads, references, CDN links
- `workflows` - Pipeline states, quality ratings
- `agents` - Agent configurations, custom agents

### 3.3 Database #2: Open MongoDB Collections

**Dynamic collections** with naming pattern: `[projectId]_[collectionName]`

**Examples:**
```
project_abc123_characters
project_abc123_scenes
project_abc123_dialogue
project_abc123_storyboards
project_abc123_shots
```

**Structure:**
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

## 4. Production Pipeline Phases

### 4.1 Phase 1: EXPANSION (Data Generation)

**Goal**: Generate comprehensive production data from initial idea

**Process:**
1. User provides movie/series idea via chat
2. AI agents generate content:
   - Story structure, episodes, scenes
   - Character profiles, relationships
   - World building, locations
   - Dialogue, screenplay
3. Each generation step:
   - Stored in open MongoDB: `[projectId]_[type]`
   - Validated by Brain (Neo4j embeddings)
   - User can accept/modify/reject
   - Quality rating assigned

**Expansion Complete When:**
- Story structure is complete
- All characters are defined
- Screenplay is finalized
- User approves to move to compacting phase

### 4.2 Phase 2: COMPACTING (Visual Production)

**Goal**: Transform text-based content into visual media

**Process:**
1. **Image Generation**:
   - Character designs
   - Location/environment renders
   - Storyboard frames
   - Composite images (layered edits)

2. **Video Generation** (max 7 seconds):
   - Input types:
     - Text-to-video
     - Image-to-video (single image)
     - Image-to-video (first + last frame)
   - Composite images supported

3. **Scene Assembly**:
   - Multiple 7s clips combined
   - Audio integration
   - Effects, transitions

**Storage Pattern:**
```
project_abc123_images       // Generated images
project_abc123_videos       // Generated video clips
project_abc123_compositions // Composite image recipes
project_abc123_scenes       // Assembled scenes
```

---

## 5. The Brain: Neo4j Knowledge Graph

### 5.1 Purpose

**The Brain** is the validation and consistency engine that:
- Stores embeddings of all generated content
- Validates new content against existing knowledge
- Identifies inconsistencies or contradictions
- Suggests improvements and connections
- Maintains story coherence
- **Only qualified information enters the Brain** (quality-gated)

### 5.2 CRITICAL PATTERN: Qualified Information Pipeline

**Core Principle**: Information quality gates ensure only validated content becomes part of the knowledge base.

```
┌─────────────────────────────────────────────────────────────┐
│           NEW INFORMATION (from user or agent)              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
              ┌────────────────────┐
              │ VALIDITY & QUALITY │
              │   TESTING          │
              └────────┬───────────┘
                       ↓
            ┌──────────┴──────────┐
            │                     │
      VALID ↓               INVALID/LOW QUALITY
            │                     ↓
            │              ┌──────────────────┐
            │              │ CHAT ASKS        │
            │              │ QUALIFYING       │
            │              │ QUESTIONS        │
            │              └──────────────────┘
            ↓
   ┌────────────────────┐
   │  STORAGE DECISION  │
   └────────┬───────────┘
            │
      ┌─────┴─────┐
      ↓           ↓
┌──────────┐  ┌──────────────┐
│PayloadCMS│  │ Open MongoDB │
│(Structured)  │(Unstructured)│
└─────┬────┘  └──────┬───────┘
      │              │
      └──────┬───────┘
             ↓
    ┌────────────────┐
    │   THE BRAIN    │
    │   (Neo4j)      │
    │ ✓ Qualified    │
    │ ✓ Validated    │
    └────────┬───────┘
             ↓
    ┌────────────────┐
    │ USED IN FUTURE │
    │  VALIDATIONS   │
    └────────────────┘
```

### 5.3 Validation Flow with Quality Gates

**Step 1: Initial Reception**
```
User/Agent generates content
        ↓
Immediate Quality Assessment:
- Completeness check
- Format validation
- Basic coherence test
        ↓
Decision Point:
- PASS → Continue to Brain
- FAIL → Chat asks qualifying questions
- UNCERTAIN → Request clarification
```

**Step 2: Brain Validation**
```
Send to Brain (Neo4j) - ONLY if initial quality passed
        ↓
Brain analyzes:
- Semantic similarity to existing content
- Consistency with story bible
- Character continuity
- Visual/tonal alignment
- Contradiction detection
        ↓
Brain returns:
- Quality score (0-1)
- Validity assessment
- Consistency issues found
- Suggested improvements
- Related content links
```

**Step 3: Storage Decision**
```
IF quality score ≥ threshold:
        ↓
   Determine storage location:
   - Known structure? → PayloadCMS
   - Flexible/Ad-hoc? → Open MongoDB
        ↓
   Store with metadata:
   - qualityRating
   - brainValidated: true
   - validatedAt: timestamp
        ↓
   Add to Brain knowledge graph
        ↓
   Now available for future validations

ELSE (quality too low):
        ↓
   Present to user in chat:
   "This content has quality issues:
   - [Issue 1]
   - [Issue 2]
   
   Should I:
   1. MODIFY and retry
   2. DISCARD
   3. ACCEPT anyway (mark as low quality)"
```

**Step 4: Future Use**
```
Validated content in Brain:
        ↓
Used to validate NEW content:
- "Does this contradict existing characters?"
- "Is this consistent with the story world?"
- "Have we seen similar concepts?"
        ↓
Builds increasingly robust validation over time
```

### 5.4 Chat Qualifying Questions

When information quality cannot be determined, the chat asks:

**Examples:**
- "I'm not sure about [aspect]. Can you clarify [specific question]?"
- "This seems to contradict [existing content]. Which should I prioritize?"
- "I need more information about [missing detail] to validate this."
- "The quality score is borderline (0.65). Would you like me to refine it or accept as-is?"

### 5.5 Project Isolation with Content Cloning

**Principle**: Projects remain isolated, but content can be selectively cloned.

```
Project A              Project B
   │                      │
   ├─ Character: Sarah    │
   ├─ Scene: Opening      │
   │                      │
   │    CLONE             │
   └──────────────────────→ Character: Sarah (cloned)
                          │  - New projectId
                          │  - New _id
                          │  - Original reference stored
                          │  - Independent from source
```

**Cloning Process:**
1. User: "Clone Sarah from Project A to Project B"
2. System reads source character from Project A's open DB
3. Creates new document in Project B's open DB
4. Assigns new projectId and _id
5. Stores reference to original: `clonedFrom: { projectId, documentId }`
6. Sends to Brain for validation in Project B's context
7. Future changes to Project B's Sarah do NOT affect Project A

**Brain Isolation:**
- Each project has its own subgraph in Neo4j
- Queries are scoped by projectId
- No cross-project validation unless explicitly cloning
- Cloned content validated against destination project only

### 5.3 Knowledge Graph Structure

**Nodes:**
- Projects
- Characters
- Locations
- Scenes
- Themes
- Story Beats

**Relationships:**
- APPEARS_IN (Character → Scene)
- LOCATED_AT (Scene → Location)
- RELATES_TO (Character → Character)
- FOLLOWS (Scene → Scene)
- CONTRADICTS (for conflicts)

---

## 6. Chat-Driven Pipeline

### 6.1 Chat Interface Principles

**Flexibility Over Rigidity:**
- No forced sequential steps
- User can jump between topics naturally
- Agents adapt to conversation flow
- Quality ratings guide completion, not block progress

### 6.2 Chat Command Patterns

**User Input Examples:**
```
"Create a cyberpunk detective series set in 2099"
"Add a new character named Sarah, she's the detective's partner"
"Show me the character profiles we've created"
"Generate a scene where Sarah confronts the villain"
"I want to change the setting to 2150 instead"
"Create images for the main character"
"Generate the opening scene as a video"
```

**AI Agent Responses:**
```
[Agent generates content]
"I've created a character profile for Sarah. Here are the details:
- Role: Detective's partner
- Personality: ...
- Backstory: ...

Quality Rating: 0.87/1.00
Brain Validation: ✓ Consistent with existing story

Would you like me to INGEST this into the project or DISCARD it?"
```

### 6.3 Ingestion Decision Flow

```
Agent generates content
        ↓
Display to user with:
- Content preview
- Quality rating
- Brain validation result
- Consistency notes
        ↓
User chooses:
1. INGEST → Save permanently, update graph
2. MODIFY → User provides changes, regenerate
3. DISCARD → Delete, no record kept
4. DEFER → Save as draft, decide later
```

---

## 7. Mass Generation & Analysis

### 7.1 Batch Generation Pattern

**Use Case**: Generate multiple variations for review

**Example:**
```
User: "Generate 5 different opening scenes"
        ↓
AI generates 5 versions in parallel
        ↓
Store all in temporary collection:
project_abc123_temp_scenes
        ↓
Brain analyzes all 5:
- Ranks by quality
- Identifies best elements from each
- Suggests hybrid approach
        ↓
Present ranked list to user
        ↓
User selects or requests synthesis
```

### 7.2 Analysis Feedback Loop

**Pattern:**
1. Generate batch of content
2. Feed batch back to Brain
3. Brain identifies:
   - Best options
   - Common themes
   - Missing elements
   - Inconsistencies
4. Present analysis to user
5. User refines request
6. Repeat until satisfied

---

## 8. Quality Rating System

### 8.1 Quality Dimensions

| Dimension | Weight | Evaluation |
|-----------|--------|------------|
| **Coherence** | 25% | Fits with existing story/characters |
| **Creativity** | 20% | Novel and engaging |
| **Technical Quality** | 20% | Well-structured, clear |
| **Consistency** | 20% | No contradictions |
| **User Intent** | 15% | Matches what user asked for |

### 8.2 Rating Scale

- **0.90 - 1.00**: Excellent - Ready for production
- **0.75 - 0.89**: Good - Minor refinements suggested
- **0.60 - 0.74**: Acceptable - Consider revision
- **0.40 - 0.59**: Weak - Recommend regeneration
- **0.00 - 0.39**: Poor - Discard and start over

### 8.3 Pipeline Completion Thresholds

**Expansion Phase:**
- Average quality ≥ 0.75 across all content
- No critical consistency issues
- User approval to proceed

**Compacting Phase:**
- Visual quality ≥ 0.80
- Technical quality (resolution, rendering) ≥ 0.85
- User approval for final output

---

## 9. Data Connection Strategy

### 9.1 Primary Key: Project ID

**All data connected via `projectId`:**
```javascript
// PayloadCMS Collections
projects.id = "abc123"

// Open MongoDB Collections
project_abc123_characters
project_abc123_scenes
project_abc123_images
// ... etc

// Neo4j Nodes
(:Project {id: "abc123"})
```

### 9.2 Cross-Collection References

**In Open MongoDB documents:**
```javascript
{
  _id: "char_001",
  projectId: "abc123",
  collectionType: "character",
  content: {
    name: "Sarah",
    // ...
  },
  relatedDocuments: [
    {
      collectionType: "scene",
      collectionName: "project_abc123_scenes",
      documentId: "scene_005",
      relationship: "APPEARS_IN"
    },
    {
      collectionType: "image",
      collectionName: "project_abc123_images",
      documentId: "img_042",
      relationship: "VISUAL_REFERENCE"
    }
  ]
}
```

### 9.3 Media Asset Linking

**PayloadCMS Media Collection:**
```javascript
{
  id: "media_789",
  filename: "sarah_portrait.png",
  url: "https://cdn.example.com/...",
  projectId: "abc123",
  
  // Link to open MongoDB
  linkedDocument: {
    collection: "project_abc123_characters",
    documentId: "char_001",
    field: "portraitImage"
  }
}
```

---

## 9. UI/UX Design for Chat-Driven Interface

### 9.1 Core UI Philosophy

**"Conversational First, Dashboard Second"**

The UI is designed around natural conversation, not traditional forms and workflows. The chat interface is the primary mechanism for creating and managing the entire movie production pipeline.

### 9.2 Main UI Components

```
┌─────────────────────────────────────────────────────────────┐
│  Top Bar: Project Name | Phase Badge | Quality Score       │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│   Sidebar       │          Main Chat Area                   │
│   (Collapsible) │                                           │
│                 │   ┌─────────────────────────────────┐    │
│  • Overview     │   │ User: Create a detective series │    │
│  • Characters   │   └─────────────────────────────────┘    │
│  • Scenes       │                                           │
│  • Images       │   ┌─────────────────────────────────┐    │
│  • Videos       │   │ AI: Great! I'll create...       │    │
│  • Timeline     │   │ [Content Preview Card]          │    │
│  • Quality      │   │ Quality: 0.87 ✓ Brain Validated │    │
│                 │   │ [INGEST] [MODIFY] [DISCARD]     │    │
│  Quick Actions: │   └─────────────────────────────────┘    │
│  + Character    │                                           │
│  + Scene        │   ┌─────────────────────────────────┐    │
│  + Image        │   │ User: Show me what we have      │    │
│                 │   └─────────────────────────────────┘    │
│                 │                                           │
│                 │   [Chat Input Box with AI Assist]        │
└─────────────────┴───────────────────────────────────────────┘
```

### 9.3 Chat Interface Design

#### **Chat Message Types**

1. **User Messages** (Standard chat bubble)
2. **AI Text Responses** (Assistant bubble)
3. **Content Preview Cards** (Rich embedded content)
4. **Action Cards** (Ingest/Discard decisions)
5. **Status Updates** (System notifications)
6. **Batch Results** (Multiple options to review)

#### **Content Preview Card Structure**
```
┌─────────────────────────────────────────────────┐
│ 📝 Character: Sarah Chen                        │
│ ─────────────────────────────────────────────── │
│ Detective's partner, age 32, cyberpunk aesthetic│
│                                                 │
│ Quality Rating: ⭐⭐⭐⭐⭐ 0.87/1.00            │
│ Brain Status: ✓ Validated & Consistent         │
│ Created by: character-creator agent             │
│                                                 │
│ [Show Full Details] [Edit] [See Related (3)]   │
│                                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ INGEST  │ │ MODIFY  │ │ DISCARD │           │
│ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────┘
```

### 9.4 Sidebar Navigation

#### **Dynamic Content Organization**

Sidebar updates in real-time as content is generated:

```
📊 Overview
   • Phase: Expansion (75% complete)
   • Quality: 0.82 avg
   • Items: 24 total

👥 Characters (5)
   • Sarah Chen ⭐ 0.87
   • Marcus Rey ⭐ 0.91
   • Dr. Voss ⭐ 0.79
   • + 2 more...

🎬 Scenes (12)
   • Opening Sequence ⭐ 0.85
   • First Confrontation ⭐ 0.88
   • + 10 more...

🖼️ Images (8)
   • Character portraits (5)
   • Locations (3)

🎥 Videos (0)
   Ready to generate

📈 Quality Dashboard
   View detailed metrics
```

### 9.5 Smart Chat Input

#### **AI-Assisted Input Box**

```
┌─────────────────────────────────────────────────┐
│ Type your message...                            │
│                                                 │
│ 💡 Quick Actions:                               │
│  • "Add a character"                            │
│  • "Show me all scenes"                         │
│  • "Generate images for main characters"        │
│  • "Start video generation"                     │
│                                                 │
│ [📎 Attach] [🎤 Voice] [Send →]                │
└─────────────────────────────────────────────────┘
```

**Smart Features:**
- Auto-suggestions based on context
- Voice input support
- File/image attachments
- Command shortcuts (e.g., "/character Sarah")
- Context-aware prompts

### 9.6 Batch Generation UI

**When Multiple Options Generated:**

```
┌─────────────────────────────────────────────────┐
│ 🎨 Generated 5 Opening Scene Variations         │
│ ─────────────────────────────────────────────── │
│                                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│ │Version 1│ │Version 2│ │Version 3│ │More... ││
│ │⭐ 0.92  │ │⭐ 0.88  │ │⭐ 0.85  │ │        ││
│ │[Preview]│ │[Preview]│ │[Preview]│ │        ││
│ └─────────┘ └─────────┘ └─────────┘ └────────┘│
│                                                 │
│ Brain Analysis:                                 │
│ • Version 1: Best pacing and atmosphere         │
│ • Version 2: Strongest character introduction   │
│ • Version 3: Most unique visual style           │
│                                                 │
│ [Select Best] [Synthesize Hybrid] [Regenerate]  │
└─────────────────────────────────────────────────┘
```

### 9.7 Visual Feedback & Status

#### **Real-time Processing Indicators**

```
AI is working... 🤖
├─ Generating character profile
├─ Checking Brain for consistency
├─ Creating embeddings
└─ Calculating quality score

Estimated time: 15 seconds
```

#### **Quality Visualization**

Color-coded quality indicators:
- 🟢 **Green (0.90-1.00)**: Excellent, ready
- 🟡 **Yellow (0.75-0.89)**: Good, minor refinements
- 🟠 **Orange (0.60-0.74)**: Acceptable, review
- 🔴 **Red (0.00-0.59)**: Poor, regenerate

### 9.8 Timeline & Progress View

**Visual Production Timeline:**

```
┌─────────────────────────────────────────────────┐
│         Production Timeline                     │
│ ─────────────────────────────────────────────── │
│                                                 │
│ EXPANSION ██████████████████░░░░ 75%           │
│ │                                               │
│ ├─ Story Structure ✓                            │
│ ├─ Characters ✓                                 │
│ ├─ Scenes (12/15) ⏳                            │
│ └─ Screenplay (Draft) ⏳                        │
│                                                 │
│ COMPACTING ░░░░░░░░░░░░░░░░░░░░ 0%            │
│ │                                               │
│ ├─ Images (Not started)                         │
│ ├─ Videos (Not started)                         │
│ └─ Assembly (Not started)                       │
│                                                 │
│ Overall Quality: ⭐⭐⭐⭐☆ 0.82/1.00           │
└─────────────────────────────────────────────────┘
```

### 9.9 Responsive Design Patterns

#### **Desktop (1920x1080+)**
- Three-column layout: Sidebar | Chat | Inspector
- Full preview cards with rich content
- Multiple items visible simultaneously

#### **Tablet (768x1024)**
- Two-column: Collapsible sidebar | Chat
- Slide-out inspector panel
- Compact preview cards

#### **Mobile (375x667)**
- Single column: Chat only
- Bottom navigation for sections
- Swipeable preview cards
- Simplified action buttons

### 9.10 Key UX Principles

1. **Immediate Feedback**: Every action shows instant response
2. **Undo-Friendly**: Easy to discard or modify decisions
3. **Context Preservation**: Chat history maintains full context
4. **Progressive Disclosure**: Show details only when needed
5. **Error Prevention**: Validate before action, warn on destructive ops
6. **Collaborative**: Multiple users can work simultaneously
7. **Accessible**: Keyboard shortcuts, screen reader support
8. **Visual Hierarchy**: Important actions prominently displayed

### 9.11 Interaction Patterns

#### **Primary Flows**

**Flow 1: Creating Content**
```
User types request → AI generates → Preview shown → 
User chooses action → Content ingested → Sidebar updates → 
Chat continues
```

**Flow 2: Reviewing Batch**
```
User requests variations → AI generates multiple → 
Brain ranks → Grid displayed → User selects/synthesizes → 
Final version ingested
```

**Flow 3: Editing Existing**
```
User clicks item in sidebar → Chat focuses on item → 
User requests changes → AI modifies → Preview comparison → 
User approves/rejects → Updates applied
```

### 9.12 Advanced UI Features

#### **Split View Mode**
Compare two versions side-by-side during revision

#### **Graph Visualization**
Visual representation of story connections (characters, scenes, locations)

#### **Quality Dashboard**
Detailed analytics:
- Quality trends over time
- Brain validation history
- Content type breakdown
- Agent performance metrics

#### **Collaboration Indicators**
- Live cursors when multiple users present
- "User X is generating..." notifications
- Comment threads on content items

---

## 10. Next Steps in Specification

### To Be Defined:

1. **Detailed Data Models**
   - PayloadCMS collection schemas
   - Open MongoDB document structures by type
   - Neo4j graph schema

2. **AI Agent Integration**
   - @codebuff/sdk implementation details
   - Custom agent definitions
   - Agent-to-agent communication

3. **API Design**
   - REST endpoints for chat interface
   - GraphQL schema for queries
   - WebSocket for real-time updates

4. **Authentication & Authorization**
   - User roles (Producer, Director, Writer, Viewer)
   - Permission system
   - Team collaboration

5. **Video Generation Pipeline**
   - Integration with generation services
   - Composite image creation workflow
   - Scene assembly process

6. **Development Phases & Milestones**
   - MVP features
   - Phase 1, 2, 3 breakdown
   - Technical dependencies

---

**Document Status**: Foundation Complete ✓  
**Next Section**: Detailed Data Models

*This is a living document. Updates will be made as we continue our discussion.*