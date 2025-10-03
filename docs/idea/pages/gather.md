# Gather Page - Complete Implementation Specification

**Version**: 2.0
**Last Updated**: January 2025
**Status**: Ready for Implementation

---

## 📋 Overview

The **Gather Page** is an unqualified data collection and management system that allows users to collect, process, and manage raw content before it enters the qualified Brain knowledge graph. It provides AI-powered enrichment, duplicate detection, and conflict resolution while maintaining strict project isolation.

**Key Principle**: This is UNQUALIFIED data - it serves as a collection/staging area and does NOT save to the Brain service.

---

## 🎯 Purpose

This page enables users to:
- Drop content, images, and documents for collection
- Let AI chat create and enhance content
- Review and manage raw information
- Detect duplicates and resolve conflicts
- Prepare content before qualification

---

## 📍 Location & Layout

### Route
```
src/app/(frontend)/dashboard/project/[id]/gather
```

### Layout Structure
- **Main Menu**: Standard top navigation
- **Left Sidebar**: Project navigation (includes Gather link with count badge)
- **Center Panel**: Gather card list with pagination
- **Right Sidebar**: AI chat integration with conditional gather buttons

---

## 🏗️ Architecture

### Database Design

**Database Name**: `aladdin-gather-{projectId}`
- Uses `projectId` from URL parameter (guaranteed unique, no lookups needed)
- Database created automatically on first access
- Completely isolated per project

**Collection Name**: `gather`

**Document Schema**:
```json
{
  "_id": "ObjectId",
  "projectId": "string",              // From URL, validated against PayloadCMS
  "lastUpdated": "ISOString",         // DateTime stamp
  "content": "string",                // JSON stringified content
  "imageUrl": "string (optional)",    // Cloudflare R2 public URL
  "documentUrl": "string (optional)", // Cloudflare R2 public URL
  "summary": "string",                // AI-generated ~100 characters
  "context": "string",                // AI-generated detailed paragraph

  // Processing Metadata
  "extractedText": "string (optional)",      // From vision LLM
  "duplicateCheckScore": "number (optional)", // Similarity score (0-1)
  "iterationCount": "number (optional)",      // AI enrichment iterations used

  // Audit Fields
  "createdAt": "ISOString",
  "createdBy": "string"               // User ID
}
```

### Storage Architecture

**Cloudflare R2 Structure**:
```
/{projectId}/gather/images/     - Image files
/{projectId}/gather/documents/  - Document files (PDFs)
```

**File Naming Convention**:
```
{projectId}-gather-{timestamp}-{original-filename}
Example: proj_123-gather-1704123456789-character_sketch.jpg
```

**File Limits**:
- **Images**: Maximum 20MB (jpg, png, webp)
- **Documents (PDF)**: Maximum 10MB
- **PDFs**: Text extraction ONLY (no images extracted)

**Upload Features**:
- Progress tracking with animated progress bar
- Cancellation support
- Public URL return for browser viewing/download
- Error handling with retry logic

### Brain Integration (Read-Only)

**Purpose**: Context enrichment during AI processing

**Allowed Operations**:
```typescript
✅ brain.query({ projectId })           // Read project context
✅ brain.semanticSearch({ projectId })  // Duplicate detection
✅ brain.getEmbedding(content)          // Generate embeddings
```

**Forbidden Operations**:
```typescript
❌ brain.saveNode(...)           // NEVER save from Gather
❌ brain.createRelationship(...) // NEVER create relationships
❌ brain.updateNode(...)         // NEVER update Brain nodes
```

**Critical Rule**: All queries scoped by `projectId`. NO data saving to Brain (unqualified data remains isolated).

---

## 🎨 UI Components & Visual Design

### Technology Stack
- **UI Framework**: shadcn components (import using project patterns)
- **State Management**: Zustand for edit/selection state
- **Icons**: Lucide React

### Gather Card Component

**Collapsed State**:
```
┌─────────────────────────────────────────────────────┐
│ [_id: 507f1f77...] - Last updated: 2 hours ago [×] │
│ "Character profile for Maya, the protagonist..."    │ ← Summary (AI-generated)
│ [Expand ▼]                                          │
└─────────────────────────────────────────────────────┘
```

**Expanded State (content only)**:
```
┌─────────────────────────────────────────────────────┐
│ [_id: 507f1f77...] - Last updated: 2 hours ago [×] │
│ "Character profile for Maya, the protagonist..."    │
├─────────────────────────────────────────────────────┤
│ Content:                                            │
│ {                                                   │
│   "name": "Maya",                                   │
│   "age": 28,                                        │
│   "occupation": "Scientist",                        │
│   "personality": "Curious, determined..."           │
│ }                                                   │
│                                                     │
│ Context: "Maya is the protagonist in a sci-fi       │
│ thriller set in 2157. She works at..."              │
│                                                     │
│ [Edit] [Save] [Delete Card]                         │
└─────────────────────────────────────────────────────┘
```

**Expanded State (with image/document) - 2 Column Split**:
```
┌─────────────────────────────────────────────────────┐
│ [_id: 507f1f77...] - Last updated: 2 hours ago [×] │
│ "Character profile for Maya, the protagonist..."    │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌───────────────────────────┐ │
│ │   📷 Image      │  │  Content (Editable)       │ │
│ │                 │  │                           │ │
│ │   [View URL]    │  │  {                        │ │
│ │   [Download]    │  │    "name": "Maya",        │ │
│ │   [Delete ×]    │  │    "age": 28,             │ │
│ │                 │  │    "occupation": "..."    │ │
│ │                 │  │  }                        │ │
│ └─────────────────┘  └───────────────────────────┘ │
│                                                     │
│ Context: "Maya is the protagonist in a sci-fi       │
│ thriller set in 2157..."                            │
│                                                     │
│ [Edit] [Save] [Delete Card]                         │
└─────────────────────────────────────────────────────┘
```

**Card Features**:
- **Collapsible**: Expand/collapse animation
- **Heading**: MongoDB `_id` and datetime stamp
- **Subheading**: AI-generated summary (~100 chars)
- **Edit Mode**: Inline editing with Zustand state
- **Explicit Save**: Save button triggers full re-validation
- **Delete**: Hard delete (no confirmation dialog)
- **Media Controls**: Image/document with individual delete buttons
- **Public URLs**: Click to open in new tab for viewing/download

### Page Layout

```
┌─────────────────────────────────────────────────────┐
│ Header: "Gather - Unqualified Content Collection"  │
│ ┌─────────────┐ ┌──────────┐      Items: (23)     │
│ │ 🔍 Search   │ │ Sort: ▼  │                       │
│ └─────────────┘ └──────────┘                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Gather Card 1]                                    │
│  [Gather Card 2]                                    │
│  [Gather Card 3]                                    │
│  ...                                                │
│  [Gather Card 20]                                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [← Previous]  Page 1 of 5  [Next →]                │
└─────────────────────────────────────────────────────┘
```

**Features**:
- **Pagination**: 20 cards per page maximum
- **Search**: Full-text search across content, summary, context (debounced 300ms)
- **Filter**: Date range, has image, has document
- **Sort Options**: Latest, Oldest, A-Z, Z-A

### Department Display Order

**Critical Rule**: When displaying departments anywhere in the Gather page, they MUST be ordered by `codeDepNumber` in ascending order.

**Department Collection Schema**:
```typescript
interface Department {
  id: string
  slug: string
  name: string
  description: string
  icon?: string
  color?: string
  codeDepNumber: number  // Process flow order (1-7)
  isActive?: boolean
  coreDepartment?: boolean
  gatherCheck?: boolean
}
```

**Default Department Order** (by `codeDepNumber`):
1. **Story Department** - `codeDepNumber: 1`
2. **Character Department** - `codeDepNumber: 2`
3. **Visual Department** - `codeDepNumber: 3`
4. **Image Quality Department** - `codeDepNumber: 4`
5. **Video Department** - `codeDepNumber: 5`
6. **Audio Department** - `codeDepNumber: 6`
7. **Production Department** - `codeDepNumber: 7`

**Query Implementation**:
```typescript
// Fetch departments ordered by codeDepNumber
const departments = await payload.find({
  collection: 'departments',
  where: {
    isActive: {
      equals: true
    }
  },
  sort: 'codeDepNumber',  // Ascending order
  limit: 100
})
```

**UI Display**:
- Department filters should appear in `codeDepNumber` order
- Department badges/tags should follow this order
- Department selection dropdowns must use this order
- Any department listing must respect this order

**Rationale**: The `codeDepNumber` represents the natural workflow progression in movie production (Story → Character → Visual → Video → Audio → Production), ensuring consistent and intuitive department ordering throughout the application.

---

## 🤖 AI Chat Integration

### Button Visibility (CRITICAL)

**Conditional Rendering**: Buttons visible ONLY when on `/gather` or `/project-readiness` routes
- Prevents unqualified data in advanced workflow pages
- Route detection: `pathname.includes('/gather') || pathname.includes('/project-readiness')`

### Chat UI Implementation

**Normal Chat View (on /gather or /project-readiness routes)**:
```
┌─────────────────────────────────────────────────────┐
│  💬 Chat Messages                                   │
│  ┌───────────────────────────────────────────────┐ │
│  │ User: "Create a character named Maya"         │ │
│  │ AI: "Here's Maya's profile..."                │ │
│  │ User: "Add her backstory"                     │ │
│  │ AI: "Maya's backstory: She grew up..."        │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [📦 Add to Gather] [📦 Add All to Gather]         │
└─────────────────────────────────────────────────────┘
```

### Add to Gather (Selection Mode)

**Workflow**:
1. User clicks "Add to Gather"
2. Chat cards get selection checkboxes
3. User selects multiple cards
4. Click "Add to Gather" to process

**UI**:
```
┌─────────────────────────────────────────────────────┐
│  Select items to add to Gather:                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ ☑ User: "Create a character named Maya"      │ │
│  │ ☐ AI: "Here's Maya's profile..."             │ │
│  │ ☑ User: "Add backstory"                      │ │
│  │ ☑ AI: "Maya's backstory: She grew up..."     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Add Selected (3)] [Cancel]                        │
└─────────────────────────────────────────────────────┘
```

### Add All to Gather (Bulk Operation)

**Process Flow**:

1. **Background Job Initialization**
   - User clicks "Add All to Gather"
   - BullMQ job created for batch processing
   - Progress indicator shown

2. **Duplicate Detection**
   - Semantic search across all chat cards vs existing gather items
   - Use Brain queries for fast similarity matching
   - Threshold: **>80% similarity** triggers duplicate warning

3. **Conflict Resolution**
   - For each duplicate, identify conflicts
   - Example: "Maya age 25 vs 30", "Maya Student vs Scientist"
   - Show side-by-side comparison UI
   - User chooses: **Merge**, **Skip**, or **Create New**

4. **Batch Processing**
   - Process 10 items at a time
   - Apply user resolutions
   - Save to gather collection

5. **Completion**
   - Show summary: "23 items added, 3 duplicates resolved, 2 skipped"
   - No logging required (unqualified data)

---

## 🔄 AI Processing Pipeline

### LLM Model Configuration

**Available Models** (from environment):
```bash
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_BACKUP_MODEL=qwen/qwen3-vl-235b-a22b-thinking
OPENROUTER_VISION_MODE=google/gemini-2.5-flash
FAL_TEXT_TO_IMAGE_MODEL=fal-ai/nano-banana
FAL_IMAGE_TO_IMAGE_MODEL=fal-ai/nano-banana/edit
```

**Model Selection Strategy** (Fallback Chain):
```
1. Default Model (OPENROUTER_DEFAULT_MODEL) → anthropic/claude-sonnet-4.5
   ↓ (if fails)
2. Backup Model (OPENROUTER_BACKUP_MODEL) → qwen/qwen3-vl-235b-a22b-thinking
   ↓ (if fails)
3. Vision Model (OPENROUTER_VISION_MODE) → google/gemini-2.5-flash
```

### Processing Workflow

#### Step 1: File Upload & Text Extraction

**If Image Provided**:
```typescript
1. Upload to Cloudflare R2 → /{projectId}/gather/images/
   - File name: {projectId}-gather-{timestamp}-{filename}
   - Show progress bar with cancel button
2. Get public URL → Store in imageUrl field
3. Extract text using Vision LLM (OPENROUTER_VISION_MODE)
4. Store extracted text (user-editable)
```

**If Document (PDF) Provided**:
```typescript
1. Upload to Cloudflare R2 → /{projectId}/gather/documents/
   - File name: {projectId}-gather-{timestamp}-{filename}
   - Show progress bar with cancel button
2. Get public URL → Store in documentUrl field
3. Extract text using Vision LLM (OPENROUTER_VISION_MODE)
   - PDF used ONLY for text (no images extracted)
4. Store extracted text (user-editable)
```

#### Step 2: Content Enrichment (Automatic, max 3 iterations)

```typescript
// Automatic enrichment loop
for (let iteration = 0; iteration < 3; iteration++) {
  // Query Brain for project context (READ-ONLY)
  const projectContext = await brain.query({
    projectId,
    types: ['character', 'scene', 'location'],
    limit: 10
  })

  // Send to LLM with context
  const result = await llm.complete({
    prompt: `
      Project Context: ${projectContext}
      Current Content: ${content}

      Analyze if follow-up questions are needed to enrich this content.
      If yes, generate questions and enhance the content.
      If no, return the finalized content.
    `,
    model: 'default' // Uses fallback chain: Default → Backup → Vision
  })

  // Update content
  content = result.enrichedContent

  // Check if sufficient context achieved
  if (result.isComplete) {
    break
  }
}
```

**Key Points**:
- **Automatic**: No user approval needed for iterations
- **Brain Queries**: Read-only access for context
- **No Saving**: Data never saved to Brain (unqualified)
- **Accept All**: Whatever is provided is accepted (no rejections)
- **Iteration Count**: Tracked but not shown to user

#### Step 3: Purpose Collection (Optional)

```typescript
// Optional question (user can skip)
const purposeQuestion = "What is the purpose of this content from the project and user point of view?"

// User response optional - can skip
if (userResponse) {
  content.purpose = userResponse
}
```

#### Step 4: Summary Generation

```typescript
const summary = await llm.complete({
  prompt: `Generate a concise summary (~100 characters) of this content: ${content}`,
  model: 'default', // Uses fallback chain
  maxTokens: 50,
  temperature: 0.3
})

// Summary characteristics:
// - Approximately 100 characters (not hard limit)
// - NOT user-editable (regenerated on save)
// - Stored in summary field
```

#### Step 5: Context Generation

```typescript
const context = await llm.complete({
  prompt: `
    Project Context: ${projectContext}
    Content: ${content}

    Generate a detailed context paragraph explaining this content
    in relation to the project. Be specific and comprehensive.
  `,
  model: 'default', // Uses fallback chain
  maxTokens: 300,
  temperature: 0.4
})

// Context characteristics:
// - Detailed paragraph format
// - Project-aware (uses Brain context)
// - Explains relevance and relationships
// - Stored in context field
```

#### Step 6: Duplicate Detection

```typescript
// Generate embedding for semantic search
const embedding = await brain.getEmbedding(content)

// Search existing gather items using Brain
const duplicates = await brain.semanticSearch({
  projectId,
  embedding,
  threshold: 0.80,  // >80% similarity triggers warning
  limit: 5
})

// Also check for conflicts
const conflicts = detectConflicts(content, duplicates)

if (duplicates.length > 0) {
  // Show conflict resolution UI
  return {
    isDuplicate: true,
    matches: duplicates,
    conflicts: conflicts,  // e.g., "age: 25 vs 30"
    actions: ['merge', 'skip', 'createNew']
  }
}
```

**Detection Details**:
- **Method**: Semantic similarity using Brain embeddings
- **Threshold**: >80% similarity score
- **Conflict Detection**: Check for contradicting values (age, name, etc.)
- **No Logging**: Resolutions not tracked (unqualified data)

#### Step 7: Save to Gather Collection

```typescript
await gatherDb.collection('gather').insertOne({
  projectId,
  lastUpdated: new Date(),
  content: JSON.stringify(content),
  imageUrl,
  documentUrl,
  summary,
  context,
  extractedText,
  duplicateCheckScore: duplicates[0]?.score || null,
  iterationCount,
  createdAt: new Date(),
  createdBy: userId
})
```

---

## 🔀 Duplicate Detection & Conflict Resolution

### Detection Method

**Semantic Similarity**:
```typescript
// Fast Brain query for duplicates
const similar = await brain.semanticSearch({
  projectId,
  query: content,
  threshold: 0.80,
  limit: 5
})

// Returns items with similarity score >80%
```

### Conflict Identification

**Common Conflicts**:
- Character age: 25 vs 30
- Character occupation: Student vs Scientist
- Scene time: Day vs Night
- Location: Boston vs New York

**Detection Logic**:
```typescript
function detectConflicts(newContent, existingItems) {
  const conflicts = []

  for (const item of existingItems) {
    const existing = JSON.parse(item.content)
    const newData = JSON.parse(newContent)

    // Compare each field
    for (const [key, value] of Object.entries(newData)) {
      if (existing[key] && existing[key] !== value) {
        conflicts.push({
          field: key,
          newValue: value,
          existingValue: existing[key],
          existingId: item._id
        })
      }
    }
  }

  return conflicts
}
```

### Resolution UI (Side-by-Side Comparison)

```
┌─────────────────────────────────────────────────────┐
│  Duplicate Detected - Similarity: 87%               │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ 🆕 New Content   │  │ 📋 Existing Content      │ │
│  │                  │  │                          │ │
│  │ Name: Maya       │  │ Name: Maya               │ │
│  │ Age: 30 ⚠️       │  │ Age: 25                  │ │
│  │ Job: Scientist⚠️ │  │ Job: Student             │ │
│  │ City: Boston     │  │ City: Boston             │ │
│  └──────────────────┘  └──────────────────────────┘ │
│                                                     │
│  ⚠️ Conflicts Detected:                            │
│  • Age: 30 vs 25                                    │
│  • Occupation: Scientist vs Student                 │
│                                                     │
│  [🔀 Merge] [⏭️ Skip New] [➕ Create as New]       │
└─────────────────────────────────────────────────────┘
```

**Resolution Options**:

1. **🔀 Merge**:
   - Combine both contents
   - User selects which values to keep for conflicts
   - Update existing item with merged data

2. **⏭️ Skip New**:
   - Discard new content
   - Keep existing item unchanged
   - No save operation

3. **➕ Create as New**:
   - Save as separate item despite similarity
   - Both items exist independently

**Implementation**:
```typescript
// Resolution handler
async function resolveConflict(resolution, newContent, existingId) {
  switch (resolution) {
    case 'merge':
      const merged = await showMergeUI(newContent, existingId)
      await updateGatherItem(existingId, merged)
      break

    case 'skip':
      // Do nothing, discard new content
      break

    case 'createNew':
      await createGatherItem(newContent)
      break
  }
}
```

**No Logging**: Conflict resolutions are NOT tracked (unqualified data)

---

## ✏️ Editing & Validation Workflow

### Edit State Management (Zustand)

```typescript
// src/stores/gatherStore.ts
interface GatherStore {
  // Selection mode for "Add to Gather"
  selectionMode: boolean
  selectedCards: string[]

  // Editing state
  editingCard: {
    id: string
    content: any
  } | null

  // Actions
  toggleSelection: (cardId: string) => void
  setEditMode: (cardId: string, content: any) => void
  saveChanges: () => Promise<void>
  cancelEdit: () => void
}

const useGatherStore = create<GatherStore>((set, get) => ({
  selectionMode: false,
  selectedCards: [],
  editingCard: null,

  toggleSelection: (cardId) => {
    set((state) => ({
      selectedCards: state.selectedCards.includes(cardId)
        ? state.selectedCards.filter(id => id !== cardId)
        : [...state.selectedCards, cardId]
    }))
  },

  setEditMode: (cardId, content) => {
    set({ editingCard: { id: cardId, content } })
  },

  saveChanges: async () => {
    const { editingCard } = get()
    if (!editingCard) return

    // Trigger full re-validation pipeline
    await revalidateContent(editingCard.id, editingCard.content)

    set({ editingCard: null })
  },

  cancelEdit: () => {
    set({ editingCard: null })
  }
}))
```

### Edit Workflow

**Step-by-Step Process**:

1. **User Clicks "Edit"**:
   ```typescript
   const handleEdit = (cardId, content) => {
     setEditMode(cardId, content)
     // Card enters edit mode
     // Content becomes editable (not summary/context)
   }
   ```

2. **User Edits Content**:
   ```typescript
   // Real-time state updates in Zustand
   const handleContentChange = (newContent) => {
     setEditingCard({
       ...editingCard,
       content: newContent
     })
   }
   // No automatic saves
   // Conserves API calls and costs
   ```

3. **User Clicks "Save"**:
   ```typescript
   const handleSave = async () => {
     // Explicit save triggers FULL re-validation:

     // 1. Re-extract text (if image/document changed)
     if (hasMediaChanges) {
       extractedText = await extractText(imageUrl || documentUrl)
     }

     // 2. Content enrichment (3 iterations)
     const enriched = await enrichContent(content, projectId)

     // 3. Summary regeneration
     const summary = await generateSummary(enriched)

     // 4. Context regeneration
     const context = await generateContext(enriched, projectId)

     // 5. Duplicate detection
     const duplicates = await checkDuplicates(enriched, projectId)

     // 6. Update in database
     await updateGatherItem(cardId, {
       content: enriched,
       summary,
       context,
       lastUpdated: new Date()
     })
   }
   ```

**Important Notes**:
- **No Diff Tracking**: Changes not tracked individually
- **No Partial Saves**: Entire object saved at once
- **Summary Regeneration**: Always regenerated (not user-editable)
- **Full Pipeline**: Complete AI processing on every save
- **Cost Optimization**: Zustand prevents premature saves

---

## 🗑️ Deletion Behavior

### Card Deletion

**Hard Delete Implementation**:
```typescript
const handleDeleteCard = async (cardId) => {
  // Hard delete (immediate removal)
  await gatherDb.collection('gather').deleteOne({ _id: cardId })

  // No confirmation dialog
  // No soft-delete or trash
  // No restore capability

  // Update UI
  removeCardFromList(cardId)
}
```

**Characteristics**:
- **Immediate**: No confirmation dialog required
- **Permanent**: No trash or restore functionality
- **Database**: Hard delete from MongoDB
- **R2 Files**: Files remain in Cloudflare R2

### Attachment Deletion

**Image/Document Removal**:
```typescript
const handleDeleteAttachment = async (cardId, type: 'image' | 'document') => {
  // Remove reference from gather item
  await gatherDb.collection('gather').updateOne(
    { _id: cardId },
    {
      $unset: {
        [type === 'image' ? 'imageUrl' : 'documentUrl']: ""
      }
    }
  )

  // File stays in R2 (public URL persists)
  // No cleanup job required
}
```

**UI Implementation**:
```
┌─────────────────┐
│   📷 Image      │
│   [View URL]    │
│   [Download]    │
│   [Delete ×]    │  ← Removes imageUrl reference only
└─────────────────┘
```

---

## 📂 Left Sidebar Integration

### Menu Specification

**Location**: Top of "Quick Actions" section in ProjectSidebar

**Visual Design**:
```
┌──────────────────────────────┐
│ Quick Actions                │
├──────────────────────────────┤
│ 📦 Gather              (23)  │  ← New addition (top position)
│ 💬 Chat with AI              │
│ ⚙️ Settings                   │
└──────────────────────────────┘
```

**Implementation**:
```typescript
// src/app/(frontend)/dashboard/project/[id]/components/ProjectSidebar.tsx

// Add to Quick Actions section (before Chat)
<div className="border-t border-gray-200 pt-4 mt-4">
  {/* NEW: Gather Link */}
  <Link
    href={`${basePath}/gather`}
    className={`
      flex items-center gap-2 px-3 py-2 rounded text-sm
      transition-colors w-full
      ${pathname.includes('/gather')
        ? 'bg-blue-50 text-blue-700 font-medium'
        : 'text-gray-700 hover:bg-gray-50'
      }
    `}
  >
    <span>📦</span>
    <span>Gather</span>
    {gatherCount > 0 && (
      <span className="ml-auto px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
        {gatherCount}
      </span>
    )}
  </Link>

  {/* Existing: Chat Link */}
  <Link href={`${basePath}/chat`} ...>
    <span>💬</span>
    <span>Chat with AI</span>
  </Link>

  {/* Existing: Settings Link */}
  <Link href={`${basePath}/settings`} ...>
    <span>⚙️</span>
    <span>Settings</span>
  </Link>
</div>
```

**Features**:
- **Icon**: 📦 (Archive icon)
- **Label**: "Gather"
- **Count Badge**: Shows number of items in gather collection
- **Position**: First item in Quick Actions (top)
- **Active State**: Highlighted when on /gather route
- **Route Pattern**: Visible on all `/project/[id]/*` routes

**Count Badge Logic**:
```typescript
// Fetch count for badge
const [gatherCount, setGatherCount] = useState(0)

useEffect(() => {
  const fetchCount = async () => {
    const response = await fetch(`/api/v1/gather/${projectId}/count`)
    const data = await response.json()
    setGatherCount(data.count)
  }

  fetchCount()

  // Update every minute
  const interval = setInterval(fetchCount, 60000)
  return () => clearInterval(interval)
}, [projectId])
```

---

## 🔌 API Endpoints

### Gather CRUD Operations

```typescript
// CREATE: Add new gather item
POST /api/v1/gather/{projectId}
Request Body: {
  content: string | object,
  imageUrl?: string,
  documentUrl?: string
}
Response: {
  id: string,
  summary: string,
  context: string,
  createdAt: string
}

// READ: List gather items (with pagination)
GET /api/v1/gather/{projectId}
Query Parameters:
  - page?: number (default: 1)
  - limit?: number (default: 20, max: 20)
  - search?: string (full-text search)
  - sort?: 'latest' | 'oldest' | 'a-z' | 'z-a'
  - hasImage?: boolean
  - hasDocument?: boolean
Response: {
  items: GatherItem[],
  total: number,
  page: number,
  pages: number,
  hasMore: boolean
}

// READ: Get single gather item
GET /api/v1/gather/{projectId}/{id}
Response: GatherItem

// UPDATE: Edit gather item (triggers re-validation)
PUT /api/v1/gather/{projectId}/{id}
Request Body: {
  content: string | object,
  imageUrl?: string,
  documentUrl?: string
}
Response: {
  updated: true,
  summary: string,      // Regenerated
  context: string,      // Regenerated
  duplicates: []        // Re-checked
}

// DELETE: Remove gather item (hard delete)
DELETE /api/v1/gather/{projectId}/{id}
Response: {
  deleted: true
}

// COUNT: Get total items count (for sidebar badge)
GET /api/v1/gather/{projectId}/count
Response: {
  count: number
}
```

### File Upload Operations

```typescript
// UPLOAD: Upload file to Cloudflare R2
POST /api/v1/gather/{projectId}/upload
Query Parameters:
  - type: 'image' | 'document'
Request Body: FormData
  - file: File (multipart/form-data)
Response: {
  publicUrl: string,    // Cloudflare R2 public URL
  fileName: string,     // {projectId}-gather-{timestamp}-{filename}
  fileSize: number,     // Bytes
  uploadedAt: string    // ISO timestamp
}

Features:
  - Progress tracking (via upload events)
  - Cancellation support (abort controller)
  - Max size validation (20MB images, 10MB PDFs)
  - File type validation
  - Error handling with retry

// DELETE: Remove file reference (R2 file persists)
DELETE /api/v1/gather/{projectId}/file
Request Body: {
  gatherItemId: string,
  fileType: 'image' | 'document'
}
Response: {
  deleted: true,
  message: "File reference removed (R2 file persists)"
}
```

### AI Processing Operations

```typescript
// PROCESS: Full AI pipeline (enrich, summarize, contextualize)
POST /api/v1/gather/{projectId}/process
Request Body: {
  content: any,
  imageUrl?: string,
  documentUrl?: string,
  existingItemId?: string  // For re-validation
}
Response: {
  summary: string,
  context: string,
  extractedText?: string,
  iterationCount: number,
  duplicates: DuplicateMatch[],
  enrichedContent: any
}

// DUPLICATES: Check for duplicates
POST /api/v1/gather/{projectId}/duplicates
Request Body: {
  content: any
}
Response: {
  duplicates: [{
    id: string,
    similarity: number,  // 0-1 score
    conflicts: [{
      field: string,
      newValue: any,
      existingValue: any
    }],
    existingContent: any
  }]
}

// ADD ALL: Bulk add from chat (background job)
POST /api/v1/gather/{projectId}/add-all
Request Body: {
  chatMessages: Message[]
}
Response: {
  jobId: string,
  status: 'processing',
  estimatedTime: number  // seconds
}

// JOB STATUS: Check background job progress
GET /api/v1/gather/{projectId}/add-all/{jobId}
Response: {
  status: 'processing' | 'completed' | 'failed',
  progress: {
    current: number,
    total: number,
    percentage: number
  },
  duplicates: DuplicateMatch[],  // For conflict resolution
  completed: string[],            // Successfully added IDs
  errors: string[]                // Failed items with reasons
}
```

### Department Operations

```typescript
// GET: Fetch departments ordered by codeDepNumber
GET /api/v1/departments
Query Parameters:
  - isActive?: boolean (filter by active status)
  - gatherCheck?: boolean (filter by gather check flag)
Response: {
  departments: [{
    id: string,
    slug: string,
    name: string,
    description: string,
    icon?: string,
    color?: string,
    codeDepNumber: number,
    isActive: boolean,
    coreDepartment: boolean,
    gatherCheck: boolean
  }],
  total: number
}

// CRITICAL: Response is ALWAYS sorted by codeDepNumber in ascending order
// This ensures consistent department ordering throughout the application

Example Response:
{
  "departments": [
    { "name": "Story Department", "codeDepNumber": 1, ... },
    { "name": "Character Department", "codeDepNumber": 2, ... },
    { "name": "Visual Department", "codeDepNumber": 3, ... },
    { "name": "Image Quality Department", "codeDepNumber": 4, ... },
    { "name": "Video Department", "codeDepNumber": 5, ... },
    { "name": "Audio Department", "codeDepNumber": 6, ... },
    { "name": "Production Department", "codeDepNumber": 7, ... }
  ],
  "total": 7
}
```

**Implementation Note**: The API endpoint MUST always sort departments by `codeDepNumber` to maintain workflow consistency. Frontend components should NOT re-sort departments.

---

## 🔐 Security & Validation

### Project Validation

**On Every Request**:
```typescript
// Middleware: Validate projectId exists in PayloadCMS
export async function validateProject(projectId: string) {
  const payload = await getPayload({ config: await configPromise })

  const project = await payload.findByID({
    collection: 'projects',
    id: projectId
  })

  if (!project) {
    throw new Error('Project not found')
  }

  return project
}
```

**On Page Load**:
```typescript
// src/app/(frontend)/dashboard/project/[id]/gather/page.tsx

export default async function GatherPage({ params }) {
  const { id: projectId } = params

  // Validate project exists
  try {
    await validateProject(projectId)
  } catch (error) {
    redirect('/dashboard/projects')
  }

  // Initialize database if first time
  await initializeGatherDatabase(projectId)

  // Render page
  return <GatherPageClient projectId={projectId} />
}
```

**Database Initialization**:
```typescript
async function initializeGatherDatabase(projectId: string) {
  const dbName = `aladdin-gather-${projectId}`

  // Check if database exists
  const db = await mongoClient.db(dbName)
  const collections = await db.listCollections().toArray()

  // Create gather collection if not exists
  if (!collections.find(c => c.name === 'gather')) {
    await db.createCollection('gather', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['projectId', 'content'],
          properties: {
            projectId: { bsonType: 'string' },
            content: { bsonType: 'string' },
            summary: { bsonType: 'string' },
            context: { bsonType: 'string' }
          }
        }
      }
    })

    // Create indexes
    await db.collection('gather').createIndexes([
      { key: { projectId: 1 } },
      { key: { lastUpdated: -1 } },
      { key: { summary: 'text', context: 'text', content: 'text' } }
    ])
  }
}
```

### Authentication & Authorization

```typescript
// Check user authentication
const { user } = await payload.auth({ req })

if (!user) {
  return { error: 'Unauthorized', status: 401 }
}

// Check user has access to project
const hasAccess = await checkProjectAccess(user.id, projectId)

if (!hasAccess) {
  return { error: 'Forbidden', status: 403 }
}

// Log operation
await logGatherOperation({
  userId: user.id,
  projectId,
  action: 'create' | 'update' | 'delete',
  itemId,
  timestamp: new Date()
})
```

### File Validation

```typescript
// Validate file before upload
function validateFile(file: File, type: 'image' | 'document') {
  const maxSizes = {
    image: 20 * 1024 * 1024,  // 20MB
    document: 10 * 1024 * 1024 // 10MB
  }

  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/webp'],
    document: ['application/pdf']
  }

  // Check file size
  if (file.size > maxSizes[type]) {
    throw new Error(`File too large. Max ${type === 'image' ? '20MB' : '10MB'}`)
  }

  // Check file type
  if (!allowedTypes[type].includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes[type].join(', ')}`)
  }

  return true
}
```

---

## 📊 Performance Optimization

### Pagination Strategy

```typescript
// Server-side pagination
async function getPaginatedGatherItems(
  projectId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  const db = await getGatherDatabase(projectId)
  const collection = db.collection('gather')

  const [items, total] = await Promise.all([
    collection
      .find({ projectId })
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments({ projectId })
  ])

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    hasMore: skip + items.length < total
  }
}
```

### Search & Filter Implementation

```typescript
// Full-text search with debouncing
const [searchQuery, setSearchQuery] = useState('')
const debouncedSearch = useDebounce(searchQuery, 300)

useEffect(() => {
  if (debouncedSearch) {
    fetchGatherItems({
      projectId,
      search: debouncedSearch,
      page: 1
    })
  }
}, [debouncedSearch])

// Server-side search
async function searchGatherItems(projectId: string, query: string) {
  const db = await getGatherDatabase(projectId)

  return db.collection('gather').find({
    projectId,
    $text: { $search: query }
  }).toArray()
}
```

### Caching Strategy

```typescript
// Brain query caching during enrichment
const brainCache = new Map<string, any>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getCachedBrainContext(projectId: string) {
  const cacheKey = `brain_context_${projectId}`
  const cached = brainCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const context = await brain.query({ projectId })
  brainCache.set(cacheKey, {
    data: context,
    timestamp: Date.now()
  })

  return context
}

// Count badge caching
const [gatherCount, setGatherCount] = useState(0)

useEffect(() => {
  const fetchCount = async () => {
    const cached = sessionStorage.getItem(`gather_count_${projectId}`)
    const cacheTime = sessionStorage.getItem(`gather_count_time_${projectId}`)

    if (cached && Date.now() - parseInt(cacheTime) < 60000) {
      setGatherCount(parseInt(cached))
      return
    }

    const response = await fetch(`/api/v1/gather/${projectId}/count`)
    const data = await response.json()

    setGatherCount(data.count)
    sessionStorage.setItem(`gather_count_${projectId}`, data.count.toString())
    sessionStorage.setItem(`gather_count_time_${projectId}`, Date.now().toString())
  }

  fetchCount()
}, [projectId])
```

### Background Job Management

```typescript
// BullMQ configuration for "Add All" operation
import { Queue, Worker } from 'bullmq'

const gatherQueue = new Queue('gather-add-all', {
  connection: redisConnection
})

// Add job
const job = await gatherQueue.add('add-all', {
  projectId,
  chatMessages,
  userId
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
})

// Worker
const worker = new Worker('gather-add-all', async (job) => {
  const { projectId, chatMessages, userId } = job.data
  const batchSize = 10

  for (let i = 0; i < chatMessages.length; i += batchSize) {
    const batch = chatMessages.slice(i, i + batchSize)

    // Process batch
    await processBatch(batch, projectId, userId)

    // Update progress
    await job.updateProgress({
      current: i + batch.length,
      total: chatMessages.length,
      percentage: ((i + batch.length) / chatMessages.length) * 100
    })
  }

  return { completed: chatMessages.length }
}, {
  connection: redisConnection
})
```

---

## ⚠️ Important Considerations

### Data Classification

**UNQUALIFIED Data Principles**:
```
✅ This gather process is UNQUALIFIED Data
   - NOT used for any purpose other than gathering and managing
   - NO connection to PayloadCMS (except project validation)
   - NO saving to Brain (read-only queries ONLY)
   - Stays isolated in aladdin-gather-{projectId} database

❌ What Gather Data Is NOT:
   - NOT production-ready content
   - NOT validated against project standards
   - NOT searchable in main project queries
   - NOT included in exports or reports
```

### Cross-Project Isolation

**Strict Boundaries**:
```typescript
// ❌ FORBIDDEN: Cross-project gather access
async function forbiddenCrossProject(sourceProjectId, targetProjectId) {
  // This will NEVER be implemented
  const sourceData = await getGatherItems(sourceProjectId)
  await copyToProject(targetProjectId, sourceData) // FORBIDDEN
}

// ✅ ALLOWED: Project-scoped operations only
async function allowedProjectScoped(projectId) {
  // All operations scoped to single project
  const data = await getGatherItems(projectId)
  await processGatherItems(projectId, data)
}
```

**Isolation Enforcement**:
- Each project's gather database is completely isolated
- Buttons only visible on `/gather` route (prevents wrong context)
- No copying/moving between projects
- Database validation on every operation

### Brain Service Boundaries

**Allowed Operations** (Read-Only):
```typescript
✅ brain.query({ projectId })
   // Get project context for enrichment

✅ brain.semanticSearch({ projectId, threshold: 0.80 })
   // Duplicate detection using embeddings

✅ brain.getEmbedding(content)
   // Generate embeddings for similarity
```

**Forbidden Operations** (Write):
```typescript
❌ brain.saveNode({ type, properties, projectId })
   // NEVER save unqualified data to Brain

❌ brain.createRelationship({ fromId, toId, type })
   // NEVER create relationships from Gather

❌ brain.updateNode({ nodeId, properties })
   // NEVER update Brain nodes from Gather

❌ brain.deleteNode({ nodeId })
   // NEVER delete Brain nodes from Gather
```

**Validation Check**:
```typescript
// Prevent accidental Brain writes
function validateBrainOperation(operation: string) {
  const allowedReadOps = ['query', 'semanticSearch', 'getEmbedding']

  if (!allowedReadOps.includes(operation)) {
    throw new Error(
      `Brain write operation '${operation}' is forbidden from Gather. ` +
      `Gather data is UNQUALIFIED and must not enter Brain.`
    )
  }
}
```

---

## 🚀 Implementation Checklist

### Phase 1: Core Infrastructure (Week 1)

**Database & Storage**:
- [ ] Create database manager for `aladdin-gather-{projectId}`
- [ ] Implement collection schema with validation
- [ ] Setup database indexes (projectId, lastUpdated, text search)
- [ ] Implement Cloudflare R2 upload service
- [ ] Configure R2 bucket structure (`/{projectId}/gather/images|documents/`)
- [ ] File naming implementation (`{projectId}-gather-{timestamp}-{filename}`)
- [ ] Progress tracking for uploads
- [ ] Upload cancellation support

**API Endpoints**:
- [ ] POST `/api/v1/gather/{projectId}` - Create item
- [ ] GET `/api/v1/gather/{projectId}` - List items with pagination
- [ ] GET `/api/v1/gather/{projectId}/{id}` - Get single item
- [ ] PUT `/api/v1/gather/{projectId}/{id}` - Update item
- [ ] DELETE `/api/v1/gather/{projectId}/{id}` - Delete item
- [ ] GET `/api/v1/gather/{projectId}/count` - Get count for badge
- [ ] GET `/api/v1/departments` - Fetch departments sorted by codeDepNumber

**Validation**:
- [ ] Project validation against PayloadCMS
- [ ] Database initialization on first access
- [ ] User authentication checks
- [ ] File type and size validation

**Department Integration**:
- [ ] Fetch departments from PayloadCMS sorted by `codeDepNumber`
- [ ] Display departments in ascending `codeDepNumber` order in all UI components
- [ ] Implement department filter/selection with proper ordering
- [ ] Cache department list for performance

### Phase 2: AI Processing Pipeline (Week 2)

**Vision Processing**:
- [ ] Image text extraction using `OPENROUTER_VISION_MODE`
- [ ] PDF text extraction (text-only, no images)
- [ ] Extracted text editability

**Content Enrichment**:
- [ ] Automatic 3-iteration enrichment loop
- [ ] Brain query integration (read-only)
- [ ] Model fallback chain (Default → Backup → Vision)
- [ ] Purpose collection (optional user input)

**Summary & Context**:
- [ ] Summary generation (~100 chars, not editable)
- [ ] Context generation (detailed paragraph)
- [ ] Project-aware context using Brain queries

**API Endpoints**:
- [ ] POST `/api/v1/gather/{projectId}/upload` - File upload
- [ ] POST `/api/v1/gather/{projectId}/process` - AI processing
- [ ] DELETE `/api/v1/gather/{projectId}/file` - Remove file reference

### Phase 3: Duplicate Detection & Conflict Resolution (Week 2)

**Duplicate Detection**:
- [ ] Semantic similarity using Brain embeddings
- [ ] Threshold detection (>80%)
- [ ] Conflict identification logic
- [ ] Side-by-side comparison data structure

**Resolution UI**:
- [ ] Conflict resolver component
- [ ] Merge, Skip, Create New actions
- [ ] Visual diff display (2-column layout)
- [ ] Conflict highlighting

**API Endpoint**:
- [ ] POST `/api/v1/gather/{projectId}/duplicates` - Check duplicates

### Phase 4: UI Components (Week 3)

**Core Components**:
- [ ] GatherCard component (collapsible, editable)
- [ ] GatherList component with pagination
- [ ] FileUploader component with progress
- [ ] ConflictResolver component
- [ ] Pagination component (20 per page)
- [ ] Search bar with debouncing (300ms)
- [ ] Filter controls (date, has image, has document)
- [ ] Department filter/selector (ordered by codeDepNumber)

**Page Implementation**:
- [ ] Gather page route (`/dashboard/project/[id]/gather`)
- [ ] Page layout with header, search, filters
- [ ] Card list rendering
- [ ] Pagination controls
- [ ] Empty state UI

**Features**:
- [ ] Expand/collapse animation
- [ ] Inline editing mode
- [ ] Explicit save button
- [ ] Hard delete confirmation
- [ ] Image/document preview
- [ ] Public URL links (open in new tab)

### Phase 5: Chat Integration (Week 3)

**Conditional Rendering**:
- [ ] Route detection for `/gather` and `/project-readiness`
- [ ] "Add to Gather" button (visible only on /gather and /project-readiness)
- [ ] "Add All to Gather" button (visible only on /gather and /project-readiness)

**Selection Mode**:
- [ ] Selection checkboxes for chat cards
- [ ] Zustand store for selection state
- [ ] "Add Selected" action
- [ ] Cancel selection mode

**Bulk Operation**:
- [ ] Background job setup (BullMQ)
- [ ] Batch processing (10 items at a time)
- [ ] Progress tracking
- [ ] Duplicate resolution workflow

**API Endpoints**:
- [ ] POST `/api/v1/gather/{projectId}/add-all` - Start bulk job
- [ ] GET `/api/v1/gather/{projectId}/add-all/{jobId}` - Job status

**State Management**:
- [ ] Zustand store setup
- [ ] Selection mode state
- [ ] Editing state
- [ ] Save/cancel actions

### Phase 6: Sidebar & Polish (Week 4)

**Sidebar Integration**:
- [ ] Add "📦 Gather" link to ProjectSidebar
- [ ] Position at top of Quick Actions
- [ ] Count badge implementation
- [ ] Active state styling
- [ ] Count caching (1 minute)

**Error Handling**:
- [ ] API error handling with retries
- [ ] File upload error messages
- [ ] Duplicate detection failures
- [ ] User-friendly error displays

**Testing**:
- [ ] Unit tests for AI processing
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user workflows
- [ ] Performance testing (pagination, search)

**Documentation**:
- [ ] API documentation
- [ ] Component documentation
- [ ] User guide for Gather feature
- [ ] Developer setup instructions

---

## 📝 Technical Implementation Notes

### File Structure

```
src/
├── app/
│   ├── (frontend)/
│   │   └── dashboard/
│   │       └── project/
│   │           └── [id]/
│   │               ├── gather/
│   │               │   └── page.tsx                 # Main gather page
│   │               ├── chat/
│   │               │   └── ChatInterface.tsx        # Modified for gather buttons
│   │               └── components/
│   │                   └── ProjectSidebar.tsx       # Modified for gather link
│   └── api/
│       └── v1/
│           └── gather/
│               └── [projectId]/
│                   ├── route.ts                     # CRUD endpoints
│                   ├── [id]/
│                   │   └── route.ts                 # Single item operations
│                   ├── upload/
│                   │   └── route.ts                 # File upload
│                   ├── process/
│                   │   └── route.ts                 # AI processing
│                   ├── duplicates/
│                   │   └── route.ts                 # Duplicate check
│                   ├── count/
│                   │   └── route.ts                 # Count for badge
│                   └── add-all/
│                       ├── route.ts                 # Start bulk job
│                       └── [jobId]/
│                           └── route.ts             # Job status
├── components/
│   └── gather/
│       ├── GatherCard.tsx                           # Card component
│       ├── GatherList.tsx                           # List with pagination
│       ├── GatherPagination.tsx                     # Pagination controls
│       ├── ConflictResolver.tsx                     # Duplicate resolution UI
│       ├── FileUploader.tsx                         # Upload component
│       └── SearchFilter.tsx                         # Search and filter
├── lib/
│   ├── db/
│   │   └── gatherDatabase.ts                        # Database manager
│   ├── storage/
│   │   └── cloudflareUpload.ts                      # R2 upload service
│   ├── vision/
│   │   └── visionProcessor.ts                       # Image/PDF processing
│   ├── gather/
│   │   ├── aiProcessor.ts                           # AI enrichment
│   │   ├── duplicateDetector.ts                     # Semantic search
│   │   ├── conflictResolver.ts                      # Conflict logic
│   │   └── types.ts                                 # TypeScript types
│   └── jobs/
│       └── gatherAddAll.ts                          # BullMQ worker
└── stores/
    └── gatherStore.ts                               # Zustand state
```

### Environment Variables

**Required additions to `.env`**:
```bash
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=aladdin-gather
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.r2.dev

# Already configured LLM models (from original doc)
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_BACKUP_MODEL=qwen/qwen3-vl-235b-a22b-thinking
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_VISION_MODE=google/gemini-2.5-flash
FAL_TEXT_TO_IMAGE_MODEL=fal-ai/nano-banana
FAL_IMAGE_TO_IMAGE_MODEL=fal-ai/nano-banana/edit

# Redis for BullMQ (if not already configured)
REDIS_URL=redis://localhost:6379
```

### Dependencies

**New packages needed**:
```json
{
  "@aws-sdk/client-s3": "^3.x.x",               // Cloudflare R2 (S3 compatible)
  "@aws-sdk/s3-request-presigner": "^3.x.x",    // Signed URLs for uploads
  "bullmq": "^5.x.x",                            // Background jobs (already installed)
  "zustand": "^4.x.x"                            // State management (already installed)
}
```

**Installation**:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
# or
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## ✅ Definition of Done

The Gather page implementation is **complete** when:

### Functional Requirements
1. ✅ Page accessible at `/dashboard/project/[id]/gather`
2. ✅ Database `aladdin-gather-{projectId}` created on first access
3. ✅ ProjectId validated against PayloadCMS on every request
4. ✅ Files upload to Cloudflare R2 with progress tracking
5. ✅ Vision LLM extracts text from images/PDFs
6. ✅ AI enrichment runs automatically (max 3 iterations)
7. ✅ Brain queries work (read-only, no saving)
8. ✅ Summary and context generated correctly
9. ✅ Duplicate detection works (>80% threshold)
10. ✅ Conflict resolution UI functional

### UI/UX Requirements
11. ✅ Cards display with expand/collapse
12. ✅ Inline editing with explicit save
13. ✅ Save triggers full re-validation
14. ✅ Hard delete works (no confirmation)
15. ✅ Pagination works (20 per page)
16. ✅ Search and filter functional
17. ✅ "Add to Gather" buttons visible only on `/gather` route
18. ✅ "Add All" runs as background job
19. ✅ Sidebar shows "📦 Gather" with count

### Quality Requirements
20. ✅ All tests pass (unit, integration, E2E)
21. ✅ Documentation complete (API, components, user guide)

---

## 🎯 Success Criteria

### Functional Success
- **Data Collection**: Users can efficiently collect unqualified content
- **AI Enhancement**: Enrichment provides valuable context
- **Duplicate Prevention**: Detection prevents redundant data
- **Editing Workflow**: Intuitive and safe with no data loss
- **File Management**: Reliable uploads with progress feedback

### Performance Success
- **Page Load**: < 2 seconds initial load
- **File Upload**: Shows progress, supports cancellation
- **AI Processing**: < 30 seconds for 3-iteration enrichment
- **Duplicate Check**: < 5 seconds for semantic search
- **Pagination**: Instant page switching (<100ms)
- **Search**: Debounced, results in <500ms

### Quality Success
- **Data Isolation**: No leakage between projects
- **Brain Protection**: No unqualified data enters Brain
- **Security**: All operations authenticated and authorized
- **Error Handling**: Graceful failures with user feedback
- **User Experience**: Clear feedback for all operations

---

## 📈 Metrics & Monitoring

**Key Metrics to Track**:
```typescript
// Usage metrics
- Total gather items per project
- Average items per user session
- Upload success/failure rate
- AI processing success rate
- Duplicate detection accuracy

// Performance metrics
- API response times (p50, p95, p99)
- Upload speed and completion rate
- Search query performance
- Background job completion time
- Database query performance

// User experience
- Edit-to-save time
- Duplicate resolution actions taken
- Feature adoption rate
- Error frequency and types
```

---

**Implementation Ready** 🚀

**Estimated Effort**:
- **Total Files**: 18 new files, 3 modified files
- **Lines of Code**: ~2,500-3,000 LOC
- **Development Time**: 3-4 weeks (4 sprints)
- **Team Size**: 2-3 developers

**Next Steps**:
1. Review and approve this specification
2. Setup development environment (Cloudflare R2, env vars)
3. Begin Phase 1: Core Infrastructure
4. Iterate through phases 2-6
5. Testing and quality assurance
6. Deploy to staging for user acceptance testing
7. Production deployment

---

*This document is the single source of truth for the Gather page implementation. All ambiguities have been resolved based on clarifications provided.*
