# Gather Feature - Complete Documentation

**Status**: 90% Complete - Production Ready ✅  
**Version**: 1.0.0  
**Last Updated**: January 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Implementation Status](#implementation-status)
5. [API Reference](#api-reference)
6. [Usage Guide](#usage-guide)
7. [Configuration](#configuration)
8. [Related Documentation](#related-documentation)

---

## Overview

The **Gather** feature is a content collection and management system that allows users to collect unqualified data (raw information, ideas, notes) before it's ready for the main production workflow. It includes AI-powered processing, semantic duplicate detection, and intelligent content enrichment.

### Key Concepts

- **Unqualified Data**: Raw content that hasn't been validated or structured yet
- **AI Processing**: Automatic enrichment, summarization, and context generation
- **Duplicate Detection**: Semantic similarity search to prevent redundant entries
- **Brain Service Integration**: Intelligent search and relationship mapping
- **Project Isolation**: All data is isolated by project ID

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  • Gather Page UI (cards, list, pagination)                 │
│  • Chat Integration (Add to Gather buttons)                 │
│  • Sidebar Integration (count badge, navigation)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API)                   │
├─────────────────────────────────────────────────────────────┤
│  • CRUD Operations (create, read, update, delete)           │
│  • File Upload (images, PDFs)                               │
│  • Count Endpoint (for sidebar badge)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   MongoDB (Per-Project)  │  │   Brain Service (AI)     │
├──────────────────────────┤  ├──────────────────────────┤
│  • Gather Collections    │  │  • Semantic Search       │
│  • Schema Validation     │  │  • Duplicate Detection   │
│  • Full-Text Search      │  │  • Knowledge Graph       │
└──────────────────────────┘  └──────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│              AI Processing Pipeline (OpenRouter)              │
├──────────────────────────────────────────────────────────────┤
│  1. Text Extraction (vision models)                          │
│  2. Content Enrichment (max 3 iterations)                    │
│  3. Summary Generation (~100 chars)                          │
│  4. Context Generation (detailed paragraph)                  │
│  5. Duplicate Detection (Brain service)                      │
└──────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│              Storage Layer (Cloudflare R2)                    │
├──────────────────────────────────────────────────────────────┤
│  • Image Storage (JPG, PNG, WEBP - max 20MB)                │
│  • Document Storage (PDF - max 10MB)                         │
│  • Public URL Generation                                     │
└──────────────────────────────────────────────────────────────┘
```

### Database Structure

**Database Naming**: `aladdin-gather-{projectId}`  
**Collection**: `gather`

**Schema**:
```typescript
{
  _id: ObjectId,
  projectId: string,           // Project isolation
  content: string,             // JSON stringified content
  summary: string,             // ~100 char summary (AI-generated)
  context: string,             // Detailed paragraph (AI-generated)
  imageUrl?: string,           // Cloudflare R2 URL
  documentUrl?: string,        // Cloudflare R2 URL
  extractedText?: string,      // Text from image/PDF
  iterationCount: number,      // AI enrichment iterations (max 3)
  duplicateCheckScore?: number,// Highest similarity score
  createdBy: string,           // User ID
  createdAt: Date,
  lastUpdated: Date
}
```

---

## Features

### ✅ Implemented (95% Complete)

#### 1. Core CRUD Operations
- Create, read, update, delete gather items
- Pagination (20 items per page)
- Search (full-text across summary, context, content)
- Sort (latest, oldest, a-z, z-a)
- Filter (has image, has document)

#### 2. AI Processing Pipeline
- **Text Extraction**: Extract text from images and PDFs using vision models
- **Content Enrichment**: Iterative improvement (max 3 iterations)
- **Summary Generation**: Concise ~100 character summaries
- **Context Generation**: Detailed contextual paragraphs
- **Model Fallback**: Default → Backup → Vision model chain

#### 3. AI Chat Integration (NEW - January 2025)
- **Add to Gather from Chat**: Add AI chat messages directly to gather
- **Dual-Mode Operation**:
  - **Quick Add**: "Add All" button to bulk add all messages
  - **Selective Add**: Selection mode with click-to-select messages
- **Smart Filtering**: Automatically filters out empty messages
- **Visual Feedback**: Checkboxes, highlighting, and clear button states
- **Both Message Types**: Can add both user questions and AI responses
- **Conditional Display**: Buttons only appear on gather and project-readiness pages

#### 3. Duplicate Detection
- **Semantic Search**: Brain service integration
- **80% Threshold**: Configurable similarity threshold
- **Automatic Suggestions**:
  - >95% similarity: "skip" (likely duplicate)
  - >90% similarity: "merge" (high similarity)
  - >80% similarity: "review" (needs review)
- **Top 5 Results**: Returns most similar items

#### 4. Brain Service Integration
- **Automatic Storage**: Items stored in Brain on create
- **Automatic Cleanup**: Items removed from Brain on delete
- **Project Isolation**: Data segregated by project ID
- **Graceful Degradation**: Errors don't block operations

#### 5. Chat Integration
- **Conditional Rendering**: Buttons only on `/gather` and `/project-readiness`
- **Selection Mode**: Toggle to select specific messages
- **Bulk Add**: "Add All to Gather" for all AI responses
- **Progress Feedback**: Loading states and success/error counts

#### 6. Sidebar Integration
- **Navigation Link**: "📦 Gather" at top of Quick Actions
- **Count Badge**: Shows number of items
- **Auto-Refresh**: Updates every 60 seconds
- **Active State**: Highlights when on gather page

#### 7. File Management
- **Image Upload**: JPG, PNG, WEBP (max 20MB)
- **Document Upload**: PDF (max 10MB)
- **Public URLs**: Cloudflare R2 with custom domain
- **File Removal**: Remove references without deleting files

### 🚧 Remaining (10%)

#### Phase 3: Conflict Resolution UI
- Side-by-side comparison component
- Merge/Skip/Create New actions
- Visual diff highlighting
- Batch conflict resolution

---

## Implementation Status

| Phase | Component | Status | Completion |
|-------|-----------|--------|------------|
| 1 | Core Infrastructure | ✅ Complete | 100% |
| 2 | AI Processing + Brain | ✅ Complete | 100% |
| 3 | Conflict Resolution UI | ❌ Not Started | 0% |
| 4 | UI Components | ✅ Complete | 100% |
| 5 | Chat Integration | ✅ Complete | 100% |
| 6 | Sidebar Integration | ✅ Complete | 100% |

**Overall Progress**: 90% Complete

---

## API Reference

### Endpoints

#### `GET /api/v1/gather/[projectId]`
List gather items with pagination and filters.

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (max: 20, default: 20)
- `search` (string): Search query
- `sort` (string): Sort order (latest|oldest|a-z|z-a)
- `hasImage` (boolean): Filter by image presence
- `hasDocument` (boolean): Filter by document presence

**Response**:
```json
{
  "items": [...],
  "total": 23,
  "page": 1,
  "pages": 2,
  "hasMore": true
}
```

#### `POST /api/v1/gather/[projectId]`
Create new gather item with AI processing.

**Request Body**:
```json
{
  "content": { /* any JSON object */ },
  "imageUrl": "https://...",  // optional
  "documentUrl": "https://..." // optional
}
```

**Response**:
```json
{
  "success": true,
  "item": { /* gather item */ },
  "duplicates": [
    {
      "id": "xyz789",
      "similarity": 0.92,
      "content": "...",
      "summary": "...",
      "suggestion": "merge"
    }
  ]
}
```

#### `GET /api/v1/gather/[projectId]/[id]`
Get single gather item.

#### `PUT /api/v1/gather/[projectId]/[id]`
Update gather item (triggers full re-validation).

#### `DELETE /api/v1/gather/[projectId]/[id]`
Delete gather item (hard delete).

#### `GET /api/v1/gather/[projectId]/count`
Get count for sidebar badge.

**Response**:
```json
{
  "count": 23,
  "projectId": "abc123"
}
```

#### `POST /api/v1/gather/[projectId]/upload`
Upload file to Cloudflare R2.

**Query Parameters**:
- `type` (string): "image" or "document"

**Form Data**:
- `file`: File to upload

---

## Usage Guide

See [GATHER_QUICK_START.md](../implementation/GATHER_QUICK_START.md) for detailed usage instructions.

---

## Configuration

### Required Environment Variables

```bash
# MongoDB
DATABASE_URI_OPEN=mongodb://localhost:27017

# Cloudflare R2
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-custom-domain.com

# OpenRouter
OPENROUTER_API_KEY=your_api_key
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5

# Brain Service
BRAIN_SERVICE_URL=https://brain.ft.tc
BRAIN_API_KEY=your_brain_api_key
```

---

## Related Documentation

### Implementation Guides
- [Implementation Details](../implementation/gather-page-implementation.md)
- [Quick Start Guide](../implementation/GATHER_QUICK_START.md)
- [Implementation Checklist](../implementation/GATHER_IMPLEMENTATION_CHECKLIST.md)

### Integration Documentation
- [Chat & Sidebar Integration](../implementation/GATHER_CHAT_SIDEBAR_INTEGRATION.md)
- [Gather Buttons in RightOrchestrator](../implementation/GATHER_BUTTONS_RIGHT_ORCHESTRATOR.md) ⭐ NEW
- [Selection Feature Fixes](../implementation/GATHER_SELECTION_FIXES.md) ⭐ NEW
- [Brain Service Integration](../implementation/GATHER_BRAIN_INTEGRATION.md)

### Specifications
- [Gather Page Specification](../idea/pages/gather.md)

---

**Maintained by**: Aladdin Development Team  
**Last Updated**: January 2025

