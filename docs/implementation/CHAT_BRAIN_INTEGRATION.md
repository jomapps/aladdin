# Chat Tab Brain Service Integration

**Status**: ✅ Complete
**Date**: 2025-10-03
**Feature**: Chat tab now queries Brain service for context-aware responses

## Overview

The Chat tab in the AI orchestrator now integrates with the Brain knowledge graph service to provide intelligent, context-aware responses based on project data or global knowledge.

## Implementation Details

### 1. Brain Constants (`src/lib/brain/constants.ts`)

```typescript
export const GLOBAL_PROJECT_ID = 'global'
export const DEFAULT_SIMILARITY_THRESHOLD = 0.6
export const DEFAULT_SEARCH_LIMIT = 10
```

**Purpose**: Define shared constants for Brain service integration, including the special "global" project key for non-project queries.

### 2. Chat Handler Enhancement (`src/lib/orchestrator/chatHandler.ts`)

**Changes**:
- Added `projectId?: string` parameter to `ChatHandlerOptions`
- Integrated Brain service via `getBrainClient().searchSimilar()`
- Query logic:
  - If `projectId` provided → search project-specific knowledge graph
  - If no `projectId` → search using `GLOBAL_PROJECT_ID` for general knowledge
- Brain results injected into LLM system prompt as context
- Different system prompts for project vs global mode
- Metadata tracking of Brain results count

**Key Code**:
```typescript
const effectiveProjectId = projectId || GLOBAL_PROJECT_ID
const isProjectContext = !!projectId

// Query Brain for context
const brainResults = await brainClient.searchSimilar({
  query: content,
  projectId: effectiveProjectId,
  limit: DEFAULT_SEARCH_LIMIT,
  threshold: DEFAULT_SIMILARITY_THRESHOLD,
})

// Include in system prompt
const systemPrompt = isProjectContext
  ? `You are a helpful AI assistant for a movie production project...
     ${brainContext}`
  : `You are a helpful AI assistant for creative professionals...
     ${brainContext}`
```

### 3. API Route Update (`src/app/api/v1/orchestrator/chat/route.ts`)

**Changes**:
- Accepts optional `projectId` in request body
- Validates project exists if `projectId` provided
- Passes `projectId` to `handleChat()` function

**Request Format**:
```typescript
// With project context
POST /api/v1/orchestrator/chat
{
  "content": "Tell me about the main character",
  "projectId": "abc123",
  "conversationId": "xyz789"  // optional
}

// Global context (no project)
POST /api/v1/orchestrator/chat
{
  "content": "How do I structure a three-act story?",
  "conversationId": "xyz789"  // optional
}
```

### 4. UI Enhancement (`src/components/layout/RightOrchestrator/modes/ChatMode.tsx`)

**Visual Improvements**:
- Added "Powered by Brain Knowledge Graph" status indicator with green dot
- Added info box explaining Brain context-aware capabilities
- Clear visual feedback that chat uses knowledge graph

## Usage Flow

```
┌─────────────────┐
│  User Message   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│   Chat API Route        │
│ - Parse projectId       │
│ - Validate project      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│     Chat Handler                │
│ - Use projectId || "global"     │
│ - Query Brain service           │
│ - Get semantic search results   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Brain Service                 │
│ - Search knowledge graph        │
│ - Return characters, scenes,    │
│   locations, etc.               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   LLM (Claude)                  │
│ - Receives Brain context        │
│ - Generates response using      │
│   knowledge graph data          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│  User Response  │
└─────────────────┘
```

## Key Features

### Project Mode (with projectId)
- Queries project-specific knowledge graph
- Returns characters, scenes, locations, props from the project
- LLM receives project context in system prompt
- Responses are tailored to the specific project

### Global Mode (no projectId)
- Uses special `GLOBAL_PROJECT_ID = "global"`
- Queries general creative knowledge
- Can be used for non-project-specific questions
- Future: Can store general storytelling patterns, templates, etc.

## Testing

**Recommended Tests**:

1. **With Project Context**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/orchestrator/chat \
     -H "Content-Type: application/json" \
     -d '{
       "content": "Tell me about Aladdin",
       "projectId": "670e23c5c3b5f54c8c8b9f01"
     }'
   ```

2. **Global Context**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/orchestrator/chat \
     -H "Content-Type: application/json" \
     -d '{
       "content": "What is the hero journey structure?"
     }'
   ```

## Files Modified

1. ✅ `src/lib/brain/constants.ts` (new file)
2. ✅ `src/lib/orchestrator/chatHandler.ts`
3. ✅ `src/app/api/v1/orchestrator/chat/route.ts`
4. ✅ `src/components/layout/RightOrchestrator/modes/ChatMode.tsx`

## Benefits

- **Context-Aware Responses**: Chat uses actual project data from knowledge graph
- **Seamless Integration**: Reuses existing Brain service infrastructure
- **Dual Mode Support**: Works with or without project context
- **Graceful Degradation**: Falls back to LLM-only if Brain service unavailable
- **Scalable Architecture**: Global mode enables future general knowledge base

## Future Enhancements

- [ ] Add Brain result count to UI
- [ ] Show Brain sources in chat responses (like citations)
- [ ] Allow users to toggle Brain context on/off
- [ ] Implement caching for frequently queried Brain results
- [ ] Add Brain query analytics and metrics
- [ ] Populate global knowledge base with storytelling patterns

## Related Documentation

- [Query Mode Brain Integration](./GATHER_BRAIN_INTEGRATION.md)
- [Brain Service Architecture](../architecture/PHASE3_ARCHITECTURE.md)
- [Brain API Client](../../src/lib/brain/client.ts)
