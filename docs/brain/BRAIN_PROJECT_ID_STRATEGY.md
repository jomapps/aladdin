# Brain Service Project ID Strategy

**Date**: 2025-01-03  
**Status**: ✅ IMPLEMENTED

---

## 🎯 Overview

This document defines how `project_id` is determined when storing data in the Brain service, with special handling for conversations to enable both GLOBAL and project-specific chat contexts.

---

## 📋 Project ID Rules

### General Entities (Characters, Scenes, Episodes, etc.)

**Rule**: Use the actual PayloadCMS `projectId`

```typescript
project_id = projectId  // e.g., "68df4dab400c86a6a8cf40c6"
```

**Purpose**: Isolate project intelligence by project. Each project's entities are stored separately in the knowledge graph.

**Collections**: `projects`, `episodes`, `workflows`, `departments`, `agents`, etc.

---

### Conversations (Chat Context)

**Rule**: Use `userId` or `userId-projectId` depending on context

#### Scenario 1: GLOBAL Chat (No Project Selected)

```typescript
project_id = userId  // e.g., "67a1b2c3d4e5f6g7h8i9j0k1"
```

**When**:
- User is on a page without a project context
- Conversation has `project: null` or `project: undefined`
- User is chatting from the global dashboard

**Purpose**: Create a personal knowledge space for the user across all projects

**UI Indicator**: Shows "GLOBAL" label in AI Assistant header

#### Scenario 2: Project-Specific Chat

```typescript
project_id = `${userId}-${projectId}`  
// e.g., "67a1b2c3d4e5f6g7h8i9j0k1-68df4dab400c86a6a8cf40c6"
```

**When**:
- User is on a project page
- Conversation has `project: projectId`
- User is chatting within a specific project context

**Purpose**: Isolate conversation context per user per project

**UI Indicator**: Shows project name in AI Assistant header

---

## 🔧 Implementation

### 1. Brain Service Interceptor

**File**: `src/lib/agents/data-preparation/interceptor.ts`

```typescript
/**
 * Get brain project_id for conversations
 * - No project: userId (GLOBAL chat)
 * - With project: userId-projectId (project-specific chat)
 */
private getConversationBrainProjectId(data: any, options: PrepareOptions): string {
  const userId = options.userId
  const projectId = data.project || options.projectId

  if (!userId) {
    throw new Error('userId is required for conversation storage')
  }

  // If no project or project is the userId itself, use GLOBAL context
  if (!projectId || projectId === userId) {
    return userId
  }

  // Project-specific context
  return `${userId}-${projectId}`
}
```

**Logic**:
1. Check if entity type is `conversations`
2. Call `getConversationBrainProjectId()` to determine the correct `project_id`
3. Override `options.projectId` with the computed value
4. Continue with normal data preparation flow

### 2. Payload Hooks

**File**: `src/lib/agents/data-preparation/payload-hooks.ts`

**Changes**:
- Allow `projectId` to be `null` for conversations (GLOBAL chat)
- Require `userId` for all conversations
- Pass both `projectId` and `userId` to the interceptor

```typescript
// For conversations, projectId can be null (GLOBAL chat)
if (!projectId && collectionSlug !== 'conversations') {
  console.warn(`[DataPrepHook] No project ID found for ${collectionSlug}:${doc.id}`)
  return doc
}

// For conversations, userId is required
if (collectionSlug === 'conversations' && !req.user?.id) {
  console.warn(`[DataPrepHook] No user ID found for conversation:${doc.id}`)
  return doc
}
```

### 3. UI Component

**File**: `src/components/layout/RightOrchestrator/index.tsx`

**Changes**:
- Show "GLOBAL" label when `projectName` is not provided
- Style "GLOBAL" label distinctly (blue, bold)
- Add animations for visual importance

**GLOBAL Label** (with ping + pulse animation):
```tsx
<span className="relative inline-flex items-center">
  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
  <span className="relative inline-flex font-bold text-blue-600 dark:text-blue-400 animate-pulse">
    GLOBAL
  </span>
</span>
```

**Project Name** (with pulse animation):
```tsx
<span className="font-semibold text-zinc-600 dark:text-zinc-300 animate-pulse">
  {projectName}
</span>
```

**Animation Effects**:
- `animate-ping`: Expanding circle effect (GLOBAL only)
- `animate-pulse`: Fade in/out effect (both GLOBAL and project name)

---

## 🎨 User Experience

### Visual Indicators

#### GLOBAL Chat
```
┌─────────────────────────────┐
│ AI Assistant      ⚡GLOBAL⚡ │  ← Blue, bold, pulsing with ping effect
├─────────────────────────────┤
│ [Chat Mode Selector]        │
│                             │
│ Chat messages...            │
└─────────────────────────────┘
```

**Animation**:
- Text pulses (fade in/out)
- Background ping effect (expanding circle)
- Blue color (#2563eb / #60a5fa)

#### Project Chat
```
┌─────────────────────────────┐
│ AI Assistant    My Movie    │  ← Gray, pulsing
├─────────────────────────────┤
│ [Chat Mode Selector]        │
│                             │
│ Chat messages...            │
└─────────────────────────────┘
```

**Animation**:
- Subtle pulse effect
- Gray color (#52525b / #d4d4d8)

---

## 🧠 Brain Service Context Isolation

### Query Behavior

When querying the Brain service for context:

#### GLOBAL Chat Query
```typescript
brainClient.searchSimilar({
  project_id: userId,  // Returns all user's GLOBAL conversations
  query: "user question"
})
```

**Returns**: Only conversations from GLOBAL context (no project)

#### Project Chat Query
```typescript
brainClient.searchSimilar({
  project_id: `${userId}-${projectId}`,  // Returns user's conversations for this project
  query: "user question"
})
```

**Returns**: Only conversations from this specific user-project combination

---

## 📊 Examples

### Example 1: User Creates GLOBAL Conversation

**Scenario**: User opens AI chat from global dashboard

**PayloadCMS Document**:
```json
{
  "id": "conv_123",
  "name": "Chat - 2025-01-03",
  "project": null,
  "user": "user_456",
  "messages": [...]
}
```

**Brain Storage**:
```json
{
  "id": "conversations_conv_123_user_456",
  "type": "conversations",
  "project_id": "user_456",  // ← GLOBAL context
  "text": "...",
  "metadata": {...}
}
```

### Example 2: User Creates Project Conversation

**Scenario**: User opens AI chat from project page

**PayloadCMS Document**:
```json
{
  "id": "conv_789",
  "name": "Query - 2025-01-03",
  "project": "proj_abc",
  "user": "user_456",
  "messages": [...]
}
```

**Brain Storage**:
```json
{
  "id": "conversations_conv_789_user_456-proj_abc",
  "type": "conversations",
  "project_id": "user_456-proj_abc",  // ← Project-specific context
  "text": "...",
  "metadata": {...}
}
```

---

## 🔍 Benefits

### 1. Context Isolation
- GLOBAL conversations don't pollute project-specific context
- Project conversations are isolated per user
- Multiple users can work on the same project without context mixing

### 2. Personalization
- Each user has their own GLOBAL knowledge space
- User-specific insights are preserved across projects

### 3. Scalability
- Clear separation of concerns
- Easy to query specific contexts
- Efficient brain service queries

### 4. User Experience
- Clear visual indicator of context (GLOBAL vs Project)
- Predictable behavior
- No confusion about which context is active

---

## 🧪 Testing Checklist

- [x] GLOBAL chat creates conversations with `project_id = userId`
- [x] Project chat creates conversations with `project_id = userId-projectId`
- [x] UI shows "GLOBAL" label when no project selected
- [x] UI shows project name when project selected
- [x] Brain queries return correct context
- [x] Multiple users don't see each other's conversations
- [x] Switching between projects changes context correctly

---

## 📝 Related Files

- `src/lib/agents/data-preparation/interceptor.ts` - Brain service interceptor
- `src/lib/agents/data-preparation/payload-hooks.ts` - PayloadCMS hooks
- `src/components/layout/RightOrchestrator/index.tsx` - UI component
- `src/lib/orchestrator/queryHandler.ts` - Query handler
- `src/lib/orchestrator/chatHandler.ts` - Chat handler
- `src/lib/orchestrator/taskHandler.ts` - Task handler
- `src/lib/orchestrator/dataHandler.ts` - Data handler

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Team Conversations**: Add `team_id` to project_id for team-wide context
2. **Conversation Sharing**: Allow users to share GLOBAL conversations
3. **Context Switching**: Quick toggle between GLOBAL and project contexts
4. **Context Analytics**: Track which context is used most
5. **Context Migration**: Tools to move conversations between contexts

---

## 📚 See Also

- [Data Preparation Agent Technical Spec](../agents/data-preparation-agent-technical-spec.md)
- [Brain Service Integration](../brain/BRAIN_SERVICE_INTEGRATION.md)
- [AI Chat Redesign](../ui/AI_CHAT_REDESIGN.md)

