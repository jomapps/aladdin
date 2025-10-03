# Orchestrator Brain Integration Update

**Date**: 2025-01-03
**Status**: ✅ COMPLETE

---

## Overview

Updated all orchestrator modes (Chat, Query, Uploads) to use the new Brain service `project_id` strategy for proper context isolation.

---

## Changes Made

### 1. Query Mode (`src/lib/orchestrator/queryHandler.ts`)

**Before**:
```typescript
brainClient.searchSimilar({
  query: content,
  projectId,  // Just the projectId
  ...
})
```

**After**:
```typescript
const brainProjectId = `${userId}-${projectId}`
brainClient.searchSimilar({
  query: content,
  projectId: brainProjectId,  // userId-projectId for conversation context
  ...
})
```

**Reason**: Query mode searches within conversation context, which is scoped by user and project.

---

### 2. Uploads Mode (`src/lib/orchestrator/dataHandler.ts`)

**Updated Function**: `checkDuplicates()`

**Before**:
```typescript
async function checkDuplicates(
  content: any,
  summary: string,
  projectId: string,
): Promise<...> {
  const results = await brainClient.searchSimilar({
    query: summary,
    projectId,  // Just the projectId
    ...
  })
}
```

**After**:
```typescript
async function checkDuplicates(
  content: any,
  summary: string,
  projectId: string,
  userId: string,  // ← Added userId parameter
): Promise<...> {
  const brainProjectId = `${userId}-${projectId}`
  const results = await brainClient.searchSimilar({
    query: summary,
    projectId: brainProjectId,  // userId-projectId for conversation context
    ...
  })
}
```

**Reason**: Duplicate detection searches within user's conversation context to avoid false positives from other users' data.

---

### 3. Chat Mode (`src/lib/orchestrator/chatHandler.ts`)

**Before**:
```typescript
const effectiveProjectId = projectId || GLOBAL_PROJECT_ID  // "global"

brainClient.searchSimilar({
  query: content,
  projectId: effectiveProjectId,
  ...
})
```

**After**:
```typescript
// GLOBAL (no project): userId
// Project-specific: userId-projectId
const isProjectContext = !!projectId
const brainProjectId = isProjectContext ? `${userId}-${projectId}` : userId

brainClient.searchSimilar({
  query: content,
  projectId: brainProjectId,
  ...
})
```

**Reason**:
- GLOBAL chat uses `userId` as `project_id` for personal knowledge space
- Project chat uses `userId-projectId` for user-project isolation

---

### 4. Constants Update (`src/lib/brain/constants.ts`)

**Deprecated** `GLOBAL_PROJECT_ID = "global"`

**Added deprecation notice**:
```typescript
/**
 * @deprecated This constant is no longer used. Brain service uses:
 *   - userId for global chat context
 *   - userId-projectId for project-specific chat context
 */
export const GLOBAL_PROJECT_ID = 'global'
```

---

## Brain Project ID Strategy Summary

### For Conversations (All Orchestrator Modes)

| Context | project_id Format | Example |
|---------|------------------|---------|
| GLOBAL (no project) | `userId` | `67a1b2c3d4e5f6g7h8i9j0k1` |
| Project-specific | `userId-projectId` | `67a1b2c3d4e5f6g7h8i9j0k1-68df4dab400c86a6a8cf40c6` |

### For Other Entities (Characters, Scenes, etc.)

| Entity Type | project_id Format | Example |
|------------|------------------|---------|
| All project entities | `projectId` | `68df4dab400c86a6a8cf40c6` |

---

## Benefits

### 1. Context Isolation
- **Chat Mode**: User's GLOBAL conversations don't mix with project conversations
- **Query Mode**: Users only search their own project context
- **Uploads Mode**: Duplicate detection scoped to user's data only

### 2. Multi-User Support
- Multiple users working on same project have separate conversation contexts
- No conversation data leakage between users
- Clean separation of personal vs project knowledge

### 3. Consistency
- All orchestrator modes follow the same Brain project_id strategy
- Aligns with PayloadCMS hook implementation
- Predictable behavior across the application

---

## Testing

### Chat Mode
```bash
# GLOBAL context
POST /api/v1/orchestrator/chat
{
  "content": "What is story structure?",
  "userId": "user_123"
  // No projectId
}
# → Brain searches with project_id = "user_123"

# Project context
POST /api/v1/orchestrator/chat
{
  "content": "Tell me about Aladdin",
  "projectId": "proj_456",
  "userId": "user_123"
}
# → Brain searches with project_id = "user_123-proj_456"
```

### Query Mode
```bash
POST /api/v1/orchestrator/query
{
  "content": "Show me all characters",
  "projectId": "proj_456",
  "userId": "user_123"
}
# → Brain searches with project_id = "user_123-proj_456"
```

### Uploads Mode
```bash
POST /api/v1/orchestrator/data
{
  "content": "Add character Jafar",
  "projectId": "proj_456",
  "userId": "user_123"
}
# → Duplicate check uses project_id = "user_123-proj_456"
```

---

## Related Files

- `src/lib/orchestrator/chatHandler.ts` - Chat mode handler
- `src/lib/orchestrator/queryHandler.ts` - Query mode handler
- `src/lib/orchestrator/dataHandler.ts` - Uploads mode handler
- `src/lib/brain/constants.ts` - Brain service constants
- `src/lib/agents/data-preparation/interceptor.ts` - Brain service interceptor
- `src/lib/agents/data-preparation/payload-hooks.ts` - PayloadCMS hooks

---

## See Also

- [Brain Project ID Strategy](../brain/BRAIN_PROJECT_ID_STRATEGY.md)
- [Chat Brain Integration](../implementation/CHAT_BRAIN_INTEGRATION.md)
- [API Data Structure Fix](../fixes/API_DATA_STRUCTURE_FIX.md)
