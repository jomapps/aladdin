# Gather Page Implementation Checklist

Based on the specification in `docs/idea/pages/gather.md`

---

## Phase 1: Core Infrastructure ✅ COMPLETE

### Database & Storage ✅
- [x] Create database manager for `aladdin-gather-{projectId}`
- [x] Implement collection schema with validation
- [x] Setup database indexes (projectId, lastUpdated, text search)
- [x] Implement Cloudflare R2 upload service
- [x] Configure R2 bucket structure (`/{projectId}/gather/images|documents/`)
- [x] File naming implementation (`{projectId}-gather-{timestamp}-{filename}`)
- [x] Progress tracking for uploads (backend ready)
- [x] Upload cancellation support (backend ready)

### API Endpoints ✅
- [x] POST `/api/v1/gather/{projectId}` - Create item
- [x] GET `/api/v1/gather/{projectId}` - List items with pagination
- [x] GET `/api/v1/gather/{projectId}/{id}` - Get single item
- [x] PUT `/api/v1/gather/{projectId}/{id}` - Update item
- [x] DELETE `/api/v1/gather/{projectId}/{id}` - Delete item
- [x] GET `/api/v1/gather/{projectId}/count` - Get count for badge
- [x] GET `/api/v1/departments` - Fetch departments sorted by codeDepNumber
- [x] POST `/api/v1/gather/{projectId}/upload` - File upload

### Validation ✅
- [x] Project validation against PayloadCMS
- [x] Database initialization on first access
- [x] User authentication checks
- [x] File type and size validation

### Department Integration ✅
- [x] Fetch departments from PayloadCMS sorted by `codeDepNumber`
- [x] API endpoint returns departments in correct order
- [ ] Display departments in ascending `codeDepNumber` order in UI components
- [ ] Implement department filter/selection with proper ordering
- [ ] Cache department list for performance

---

## Phase 2: AI Processing Pipeline 🟡 PARTIAL

### Vision Processing 🟡
- [x] Image text extraction using `OPENROUTER_VISION_MODE` (mocked)
- [x] PDF text extraction (text-only, no images) (mocked)
- [x] Extracted text editability
- [ ] **TODO**: Actual vision model integration

### Content Enrichment ✅
- [x] Automatic 3-iteration enrichment loop
- [ ] Brain query integration (read-only) - **TODO**
- [x] Model fallback chain (Default → Backup → Vision)
- [ ] Purpose collection (optional user input) - **TODO**

### Summary & Context ✅
- [x] Summary generation (~100 chars, not editable)
- [x] Context generation (detailed paragraph)
- [ ] Project-aware context using Brain queries - **TODO**

### API Endpoints ✅
- [x] POST `/api/v1/gather/{projectId}/upload` - File upload
- [x] POST `/api/v1/gather/{projectId}/process` - AI processing (integrated in create/update)
- [x] DELETE `/api/v1/gather/{projectId}/file` - Remove file reference (integrated in update)

---

## Phase 3: Duplicate Detection & Conflict Resolution ❌ NOT STARTED

### Duplicate Detection ❌
- [ ] Semantic similarity using Brain embeddings
- [ ] Threshold detection (>80%)
- [ ] Conflict identification logic
- [ ] Side-by-side comparison data structure

### Resolution UI ❌
- [ ] Conflict resolver component
- [ ] Merge, Skip, Create New actions
- [ ] Visual diff display (2-column layout)
- [ ] Conflict highlighting

### API Endpoint ❌
- [ ] POST `/api/v1/gather/{projectId}/duplicates` - Check duplicates

---

## Phase 4: UI Components ✅ COMPLETE

### Core Components ✅
- [x] GatherCard component (collapsible, editable)
- [x] GatherList component with pagination
- [ ] FileUploader component with progress - **TODO**
- [ ] ConflictResolver component - **TODO**
- [x] Pagination component (20 per page)
- [x] Search bar with debouncing (300ms)
- [x] Filter controls (date, has image, has document)
- [ ] Department filter/selector (ordered by codeDepNumber) - **TODO**

### Page Implementation ✅
- [x] Gather page route (`/dashboard/project/[id]/gather`)
- [x] Page layout with header, search, filters
- [x] Card list rendering
- [x] Pagination controls
- [x] Empty state UI

### Features ✅
- [x] Expand/collapse animation
- [x] Inline editing mode
- [x] Explicit save button
- [x] Hard delete (no confirmation)
- [x] Image/document preview
- [x] Public URL links (open in new tab)

---

## Phase 5: Chat Integration ❌ NOT STARTED

### Conditional Rendering ❌
- [ ] Route detection for `/gather` and `/project-readiness`
- [ ] "Add to Gather" button (visible only on /gather and /project-readiness)
- [ ] "Add All to Gather" button (visible only on /gather and /project-readiness)

### Selection Mode ❌
- [ ] Selection checkboxes for chat cards
- [x] Zustand store for selection state (implemented, not used yet)
- [ ] "Add Selected" action
- [ ] Cancel selection mode

### Bulk Operation ❌
- [ ] Background job setup (BullMQ)
- [ ] Batch processing (10 items at a time)
- [ ] Progress tracking
- [ ] Duplicate resolution workflow

### API Endpoints ❌
- [ ] POST `/api/v1/gather/{projectId}/add-all` - Start bulk job
- [ ] GET `/api/v1/gather/{projectId}/add-all/{jobId}` - Job status

### State Management ✅
- [x] Zustand store setup
- [x] Selection mode state
- [x] Editing state
- [x] Save/cancel actions

---

## Phase 6: Sidebar & Polish ❌ NOT STARTED

### Sidebar Integration ❌
- [ ] Add "📦 Gather" link to ProjectSidebar
- [ ] Position at top of Quick Actions
- [ ] Count badge implementation
- [ ] Active state styling
- [ ] Count caching (1 minute)

### Error Handling 🟡
- [x] API error handling with retries (basic)
- [x] File upload error messages
- [ ] Duplicate detection failures - **TODO**
- [x] User-friendly error displays

### Testing ❌
- [ ] Unit tests for AI processing
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user workflows
- [ ] Performance testing (pagination, search)

### Documentation ✅
- [x] API documentation
- [x] Component documentation
- [x] User guide for Gather feature
- [x] Developer setup instructions

---

## Summary

### ✅ Completed (Phase 1 + Phase 4)
- Core database and storage infrastructure
- All CRUD API endpoints
- Basic AI processing (with mocked vision)
- Complete UI components (cards, list, pagination)
- State management with Zustand
- Search, filter, and sort functionality

### 🟡 Partially Complete (Phase 2)
- AI processing pipeline (needs Brain integration)
- Vision processing (needs actual model integration)

### ❌ Not Started (Phases 3, 5, 6)
- Duplicate detection and conflict resolution
- Chat integration
- Sidebar integration
- Advanced features (file uploader with progress, department filter)
- Testing suite

---

## Priority Next Steps

1. **Test Current Implementation** ⭐⭐⭐
   - Verify all CRUD operations work
   - Test file uploads (if R2 configured)
   - Test search and filtering

2. **Integrate Brain Service** ⭐⭐⭐
   - Implement duplicate detection
   - Add semantic similarity search
   - Enable conflict resolution

3. **Add Chat Integration** ⭐⭐
   - Conditional buttons in chat
   - Selection mode
   - Bulk operations

4. **Add Sidebar Link** ⭐⭐
   - Update ProjectSidebar component
   - Add count badge
   - Implement caching

5. **Implement Advanced Features** ⭐
   - File uploader with progress bar
   - Conflict resolver UI
   - Department filter
   - Date range filter

---

**Overall Progress**: 45% Complete (Phase 1 & 4 done, Phase 2 partial)  
**Status**: ✅ Ready for Testing and Phase 2 Implementation  
**Last Updated**: January 2025

