# Conversation ID Validation Fix

**Date**: 2025-10-03  
**Status**: ✅ Complete  
**Priority**: Critical

## Problem

Invalid MongoDB ObjectIds were being passed to PayloadCMS, causing:
- `BSONError: input must be a 24 character hex string`
- 404 conversation not found errors
- Chat messages stuck in "thinking" state without responses
- Corrupted localStorage data from Zustand persist

## Root Cause

1. **No validation** of conversationId format before database queries
2. **Invalid IDs persisted** in localStorage via Zustand's persist middleware
3. **No fallback** when conversationId was invalid - code tried to use it anyway
4. **Multiple entry points** without consistent validation

## Solution

Implemented **three-layer validation pattern** across frontend and backend:

### 1. Backend Validation (Query Handler)

**File**: `src/lib/orchestrator/queryHandler.ts`

```typescript
// Validate conversationId format (MongoDB ObjectId is 24 hex chars)
const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id)

if (conversationId && isValidObjectId(conversationId)) {
  try {
    const conversation = await payload.findByID({
      collection: 'conversations',
      id: conversationId,
    })
    // ... load conversation
  } catch (error) {
    console.warn('[QueryHandler] Failed to load conversation:', error)
    actualConversationId = undefined
  }
} else if (conversationId) {
  console.warn('[QueryHandler] Invalid conversationId format:', conversationId)
  actualConversationId = undefined
}

// Create new conversation if invalid or missing
if (!actualConversationId || !conversationExists) {
  const newConversation = await payload.create({
    collection: 'conversations',
    data: { /* ... */ }
  })
  actualConversationId = newConversation.id.toString()
}
```

### 2. Frontend Hook Validation

**File**: `src/hooks/orchestrator/useOrchestratorChat.ts`

```typescript
// Validate before sending to API
const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id)
const validConversationId =
  conversationId && isValidObjectId(conversationId) ? conversationId : undefined

// Clear invalid IDs from store
if (conversationId && !validConversationId) {
  console.warn('[useOrchestratorChat] Clearing invalid conversationId:', conversationId)
  setConversationId('')
}

// Send only valid IDs to backend
body: JSON.stringify({
  content,
  projectId: options.projectId,
  conversationId: validConversationId,
  mode,
})
```

### 3. Store Protection

**File**: `src/stores/orchestratorStore.ts`

```typescript
setConversationId: (id) => {
  // Validate MongoDB ObjectId format (24 hex chars) or allow null/empty
  const isValidObjectId = (str: string) => /^[0-9a-fA-F]{24}$/. test(str)
  if (id && !isValidObjectId(id)) {
    console.warn('[OrchestratorStore] Invalid conversationId format, ignoring:', id)
    return
  }
  set({ conversationId: id || null })
}
```

### 4. API Route Validation

Added validation to all API routes that accept conversationId:

**Files**:
- `src/app/api/v1/chat/[conversationId]/route.ts`
- `src/app/api/v1/chat/[conversationId]/stream/route.ts`
- `src/app/api/orchestrator/history/route.ts`

```typescript
// Validate conversationId format (MongoDB ObjectId is 24 hex chars)
const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id)
if (!isValidObjectId(conversationId)) {
  return NextResponse.json(
    { error: 'Invalid conversation ID format', code: 'VALIDATION_ERROR' },
    { status: 400 }
  )
}
```

## MongoDB ObjectId Format

- **Length**: Exactly 24 characters
- **Characters**: Hexadecimal (0-9, a-f, A-F)
- **Regex**: `/^[0-9a-fA-F]{24}$/`
- **Example**: `68df4dab400c86a6a8cf40c6`

## Benefits

✅ **No more BSON errors** - Invalid ObjectIds caught before reaching MongoDB  
✅ **No more 404 conversation errors** - New conversations auto-created  
✅ **No more stuck "thinking" state** - Messages get proper responses  
✅ **Persistent storage protection** - Invalid IDs can't corrupt localStorage  
✅ **Better error messages** - Clear logging shows what's happening  
✅ **Consistent validation** - Same pattern across all entry points  

## Testing

1. **Fresh database** - Works with no existing conversations
2. **Invalid ID in localStorage** - Automatically cleared and new conversation created
3. **Valid existing conversation** - Loads correctly
4. **Malformed ID from API** - Returns 400 with clear error message

## Related Files

### Modified
- `src/lib/orchestrator/queryHandler.ts` - Backend validation
- `src/hooks/orchestrator/useOrchestratorChat.ts` - Frontend validation
- `src/stores/orchestratorStore.ts` - Store protection
- `src/app/api/v1/chat/[conversationId]/route.ts` - API validation
- `src/app/api/v1/chat/[conversationId]/stream/route.ts` - Stream validation
- `src/app/api/orchestrator/history/route.ts` - History validation

### Documentation
- `docs/fixes/CONVERSATION_ID_VALIDATION.md` - This file
- `.env.reference.md` - Environment variable reference

## Future Improvements

1. **Centralized validation utility** - Extract validation function to shared utility
2. **TypeScript branded types** - Use branded types for validated ObjectIds
3. **Zod schema validation** - Add Zod schemas for API request validation
4. **Conversation cleanup** - Periodic cleanup of orphaned conversations

## Notes

- This fix is critical for first-time app usage when database is empty
- Validation happens at all three layers: store, hook, and backend
- Invalid IDs are logged but don't crash the application
- New conversations are created automatically when needed

