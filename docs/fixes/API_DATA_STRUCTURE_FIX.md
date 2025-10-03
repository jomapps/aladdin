# API Data Structure Fix

## Issue
React Query hooks were calling incorrect API endpoints and expecting wrong data structures, causing data not to display correctly in the UI.

## Root Cause
1. **Custom API vs PayloadCMS API mismatch**: Some queries were calling `/api/v1/[collection]` endpoints that don't exist, instead of using PayloadCMS's built-in `/api/[collection]` endpoints.
2. **Data structure inconsistency**: The custom `/api/v1/projects` endpoint returns `{ projects: [...] }` while PayloadCMS's standard API returns `{ docs: [...] }`.

## Files Fixed

### 1. Projects Query (`src/lib/react-query/queries/projects.ts`)
**Problem**: API returns `{ projects: [...] }` but interface expects `{ docs: [...] }`

**Solution**: Added data transformation in `fetchProjects()`:
```typescript
const data = await response.json()

// Transform API response to match ProjectListResponse interface
return {
  docs: data.projects || [],
  totalDocs: data.totalDocs || 0,
  limit: data.limit || 10,
  page: data.page || 1,
  totalPages: data.totalPages || 0,
  hasNextPage: data.hasNextPage || false,
  hasPrevPage: data.hasPrevPage || false,
}
```

### 2. Episodes Query (`src/lib/react-query/queries/episodes.ts`)
**Problem**: Calling `/api/v1/episodes` which doesn't exist

**Solution**: Changed to use PayloadCMS built-in API:
- `fetchEpisodes()`: `/api/v1/episodes` → `/api/episodes`
- `fetchEpisode()`: `/api/v1/episodes/${id}` → `/api/episodes/${id}`
- Removed unnecessary data transformation (PayloadCMS returns correct format)

### 3. Characters Query (`src/lib/react-query/queries/characters.ts`)
**Problem**: Calling `/api/v1/characters` which doesn't exist

**Solution**: Changed to use PayloadCMS built-in API:
- `fetchCharacters()`: `/api/v1/characters` → `/api/characters`
- `fetchCharacter()`: `/api/v1/characters/${id}` → `/api/characters/${id}`
- Removed unnecessary data transformation

### 4. Scenes Query (`src/lib/react-query/queries/scenes.ts`)
**Problem**: Calling `/api/v1/scenes` which doesn't exist

**Solution**: Changed to use PayloadCMS built-in API:
- `fetchScenes()`: `/api/v1/scenes` → `/api/scenes`
- `fetchScene()`: `/api/v1/scenes/${id}` → `/api/scenes/${id}`
- Removed unnecessary data transformation

### 5. Conversations Query (`src/lib/react-query/queries/orchestrator.ts`)
**Problem**: Calling `/api/v1/chat/conversation` which only has POST, not GET

**Solution**: Changed to use PayloadCMS built-in API:
- `fetchConversations()`: `/api/v1/chat/conversation` → `/api/conversations`
- `fetchConversation()`: `/api/v1/chat/${id}` → `/api/conversations/${id}`
- Removed unnecessary data transformation

## PayloadCMS API Structure

PayloadCMS automatically provides REST API endpoints for all collections:

### List Endpoint: `GET /api/[collection]`
Returns:
```json
{
  "docs": [...],
  "totalDocs": 10,
  "limit": 10,
  "page": 1,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPrevPage": false
}
```

### Detail Endpoint: `GET /api/[collection]/[id]`
Returns the document directly (not wrapped in an object).

## Custom API Endpoints

When creating custom API endpoints (like `/api/v1/projects`), ensure they return data in a consistent format. If they differ from PayloadCMS's standard format, add transformation logic in the React Query fetch functions.

## Best Practices

1. **Use PayloadCMS built-in APIs** for standard CRUD operations on collections
2. **Only create custom API routes** when you need:
   - Custom business logic
   - Data aggregation from multiple collections
   - Special authentication/authorization
   - Non-standard response formats

3. **When using custom APIs**, either:
   - Match PayloadCMS's response format (`{ docs: [...] }`)
   - Add transformation logic in the fetch function

4. **Always check**:
   - Does the API endpoint exist?
   - What format does it return data in?
   - Does the interface match the actual response?

## Testing Checklist

When adding new React Query hooks:
- [ ] Verify the API endpoint exists
- [ ] Check the response format in browser DevTools
- [ ] Ensure the TypeScript interface matches the response
- [ ] Test with actual data to confirm it displays correctly
- [ ] Add transformation logic if needed

## Collection Slug Compliance (2025-01-03)

### Problem
Data Preparation Agent was failing with 500 errors when trying to query non-existent PayloadCMS collections:
```
Error [APIError]: The collection with slug characters can't be found.
Error [APIError]: The collection with slug scenes can't be found.
Error [APIError]: The collection with slug locations can't be found.
Error [APIError]: The collection with slug concepts can't be found.
```

### Root Cause
The `ContextGatherer` was trying to query collections that exist in **Open MongoDB** (per-project dynamic databases), NOT in PayloadCMS.

**PayloadCMS Collections** (from `src/payload.config.ts`):
- `users`, `media`, `projects`, `episodes`, `conversations`, `workflows`, `activity-logs`, `export-jobs`, `departments`, `agents`, `custom-tools`, `agent-executions`, `project-readiness`

**Open MongoDB Collections** (dynamic per project in `open_[project-slug]` databases):
- `characters`, `scenes`, `locations`, `concepts`

### Solution
Updated `src/lib/agents/data-preparation/context-gatherer.ts`:

1. **`getPayloadContext()`** - Only queries PayloadCMS collections:
   - `episodes`, `conversations`, `workflows`
   - Returns empty arrays for `characters`, `scenes`, `locations`, `concepts`

2. **`getOpenDBContext()`** - Queries Open MongoDB collections:
   - Accepts `projectSlug` instead of `projectId`
   - Queries `characters`, `scenes`, `locations`, `concepts` from Open MongoDB
   - Returns actual data from dynamic collections

3. **`gatherAll()`** - Fetches project context first:
   - Gets project to obtain `slug`
   - Passes `project.slug` to `getOpenDBContext()`

4. **`getRelatedEntities()`** - Uses correct data source:
   - Changed from `context.payload?.characters` to `context.opendb?.characters`
   - Same for scenes, locations

5. **Updated TypeScript types** in `src/lib/agents/data-preparation/types.ts`:
   - `PayloadContext` now includes `episodes`, `conversations`, `workflows`
   - `OpenDBContext` now includes `characters`, `scenes`, `locations`, `concepts`

### Key Pattern
**Always use `getOpenDatabase(projectSlug)` for dynamic collections, never query them via PayloadCMS API.**

## Brain Project ID Strategy (2025-01-03)

### Overview
Implemented streamlined brain service `project_id` strategy for conversations to enable GLOBAL and project-specific chat contexts.

**See**: [Brain Project ID Strategy Documentation](../brain/BRAIN_PROJECT_ID_STRATEGY.md)

### Key Changes

1. **GLOBAL Chat** (no project selected):
   - Brain `project_id` = `userId`
   - UI shows "GLOBAL" label
   - Example: `67a1b2c3d4e5f6g7h8i9j0k1`

2. **Project Chat** (project selected):
   - Brain `project_id` = `userId-projectId`
   - UI shows project name
   - Example: `67a1b2c3d4e5f6g7h8i9j0k1-68df4dab400c86a6a8cf40c6`

3. **Other Entities** (characters, scenes, etc.):
   - Brain `project_id` = `projectId` (unchanged)
   - Example: `68df4dab400c86a6a8cf40c6`

### Implementation Files
- `src/lib/agents/data-preparation/interceptor.ts` - Added `getConversationBrainProjectId()`
- `src/lib/agents/data-preparation/payload-hooks.ts` - Allow null projectId for conversations
- `src/components/layout/RightOrchestrator/index.tsx` - Show "GLOBAL" label

## Related Files

- `/src/lib/react-query/queries/` - All query files
- `/src/app/api/v1/` - Custom API routes
- `/src/app/(payload)/api/` - PayloadCMS generated API routes
- `/src/collections/` - PayloadCMS collection definitions
- `/src/lib/agents/data-preparation/` - Data preparation agent
- `/src/lib/db/openDatabase.ts` - Open MongoDB client
- `/docs/brain/BRAIN_PROJECT_ID_STRATEGY.md` - Brain project ID strategy

