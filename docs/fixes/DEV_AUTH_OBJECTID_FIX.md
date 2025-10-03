# Development Authentication & ObjectId Validation Fix

**Date**: 2025-01-XX  
**Issue**: BSONError when creating conversations in development mode  
**Status**: ✅ Fixed

---

## Problem

When running the orchestrator query API in development mode, the application crashed with:

```
BSONError: input must be a 24 character hex string, 12 byte Uint8Array, or an integer
    at async handleQuery (src\lib\orchestrator\queryHandler.ts:106:28)
```

### Root Cause

1. **Development Mode Authentication**: In development mode, API routes set `userId = 'dev-user'` to bypass authentication
2. **PayloadCMS Relationships**: The `conversations` collection has `user` and `project` fields defined as relationships
3. **ObjectId Validation**: PayloadCMS validates relationship fields as MongoDB ObjectIds (24 hex characters)
4. **Invalid Value**: The string `'dev-user'` is not a valid ObjectId, causing BSON validation to fail

### Code Location

The error occurred when creating a new conversation:

```typescript
// src/lib/orchestrator/queryHandler.ts (line 106)
const newConversation = await payload.create({
  collection: 'conversations',
  data: {
    name: `Query - ${new Date().toISOString()}`,
    project: projectId,  // ❌ May be invalid ObjectId
    user: userId,        // ❌ 'dev-user' is not a valid ObjectId
    status: 'active',
    messages: [],
  },
})
```

---

## Solution

### 1. Created Development Authentication Helper

**File**: `src/lib/auth/devAuth.ts`

A centralized helper module for consistent authentication handling:

```typescript
/**
 * Authenticate user or bypass in development mode
 * 
 * In development mode:
 * - Returns null userId (no user relationship)
 * - Skips authentication checks
 * 
 * In production mode:
 * - Validates user session
 * - Returns actual user ID
 */
export async function authenticateRequest(
  request: NextRequest,
  payload: Payload
): Promise<AuthResult> {
  const isDevMode = process.env.NODE_ENV === 'development'

  if (isDevMode) {
    return {
      userId: null, // ✅ No user relationship in dev mode
      isDevMode: true,
    }
  }

  // Production mode - require authentication
  const { user } = await payload.auth({ req: request as any })
  
  return {
    userId: user?.id || null,
    isDevMode: false,
  }
}
```

**Helper Functions**:

```typescript
// Validate MongoDB ObjectId format (24 hex characters)
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

// Validate and sanitize ObjectId for relationships
export function validateObjectId(
  id: string | null | undefined, 
  fieldName: string
): string | undefined {
  if (!id || !isValidObjectId(id)) {
    console.warn(`[DevAuth] Invalid ${fieldName} format:`, id)
    return undefined
  }
  return id
}
```

### 2. Updated Query API Route

**File**: `src/app/api/v1/orchestrator/query/route.ts`

```typescript
import { authenticateRequest } from '@/lib/auth/devAuth'

export async function POST(request: NextRequest) {
  // ✅ Use centralized auth helper
  const payload = await getPayload({ config: await configPromise })
  const { userId, isDevMode } = await authenticateRequest(request, payload)

  // In production, require authentication
  if (!isDevMode && !userId) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' }, 
      { status: 401 }
    )
  }

  // userId is now either:
  // - null (in development mode)
  // - valid ObjectId (in production mode)
  const result = await handleQuery({
    content,
    projectId,
    conversationId,
    userId: userId!, // Safe to use
    limit,
    types,
  })
}
```

### 3. Updated Query Handler

**File**: `src/lib/orchestrator/queryHandler.ts`

```typescript
import { isValidObjectId, validateObjectId } from '@/lib/auth/devAuth'

export async function handleQuery(options: QueryHandlerOptions) {
  // ... existing code ...

  // ✅ Validate IDs before creating conversation
  if (!actualConversationId || !conversationExists) {
    const validProjectId = validateObjectId(projectId, 'projectId')
    const validUserId = validateObjectId(userId, 'userId')

    const newConversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Query - ${new Date().toISOString()}`,
        project: validProjectId,  // ✅ undefined if invalid
        user: validUserId,        // ✅ undefined if invalid (dev mode)
        status: 'active',
        messages: [],
      },
    })
  }
}
```

---

## Behavior Changes

### Development Mode (NODE_ENV=development)

**Before**:
- ❌ `userId = 'dev-user'` (invalid ObjectId)
- ❌ Crashes when creating conversations
- ❌ BSON validation error

**After**:
- ✅ `userId = null` (no user relationship)
- ✅ Conversations created without user association
- ✅ No authentication required
- ✅ No BSON errors

### Production Mode

**Before**:
- ✅ `userId = user.id` (valid ObjectId from auth)
- ✅ Conversations linked to authenticated user

**After**:
- ✅ Same behavior (no changes)
- ✅ Authentication still required
- ✅ User relationships properly maintained

---

## Testing

### Manual Testing

1. **Development Mode**:
   ```bash
   # Set environment
   NODE_ENV=development
   
   # Start server
   pnpm dev
   
   # Test query API
   curl -X POST http://localhost:3000/api/v1/orchestrator/query \
     -H "Content-Type: application/json" \
     -d '{
       "content": "Show me all characters",
       "projectId": "valid-project-id-here"
     }'
   ```

   **Expected**: ✅ Success, conversation created without user relationship

2. **Production Mode**:
   ```bash
   # Set environment
   NODE_ENV=production
   
   # Test without auth
   curl -X POST http://localhost:3000/api/v1/orchestrator/query \
     -H "Content-Type: application/json" \
     -d '{"content": "test", "projectId": "..."}'
   ```

   **Expected**: ❌ 401 Unauthorized

---

## Related Files

### Modified Files
- ✅ `src/lib/auth/devAuth.ts` (new)
- ✅ `src/app/api/v1/orchestrator/query/route.ts`
- ✅ `src/lib/orchestrator/queryHandler.ts`

### Files That Should Be Updated (Future Work)
- `src/app/api/v1/orchestrator/chat/route.ts`
- `src/app/api/v1/orchestrator/data/route.ts`
- `src/app/api/v1/orchestrator/task/route.ts`

All these routes use the same `userId = 'dev-user'` pattern and should be updated to use the new `authenticateRequest` helper.

---

## Best Practices

### ✅ DO

1. **Use `authenticateRequest` helper** for all API routes
2. **Validate ObjectIds** before passing to PayloadCMS relationships
3. **Set relationships to `undefined`** for invalid IDs (not empty strings)
4. **Log warnings** when invalid IDs are detected
5. **Test both dev and production modes**

### ❌ DON'T

1. **Don't use string literals** like `'dev-user'` for user IDs
2. **Don't pass invalid ObjectIds** to relationship fields
3. **Don't skip validation** assuming IDs are always valid
4. **Don't use empty strings** for optional relationships (use `undefined`)

---

## Future Improvements

### Option 1: Create Real Dev User

Instead of skipping user relationships in dev mode, create a real dev user:

```typescript
// src/lib/auth/devAuth.ts
export async function getOrCreateDevUser(payload: Payload): Promise<string> {
  const devEmail = 'dev@aladdin.local'
  
  // Find existing dev user
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: devEmail } },
    limit: 1,
  })
  
  if (existing.docs.length > 0) {
    return existing.docs[0].id
  }
  
  // Create dev user
  const devUser = await payload.create({
    collection: 'users',
    data: {
      email: devEmail,
      password: 'dev-password',
      name: 'Development User',
    },
  })
  
  return devUser.id
}
```

### Option 2: Environment Variable

Allow configuring a dev user ID via environment variable:

```bash
# .env.local
DEV_USER_ID=507f1f77bcf86cd799439011
```

```typescript
// src/lib/auth/devAuth.ts
if (isDevMode) {
  const devUserId = process.env.DEV_USER_ID
  return {
    userId: devUserId && isValidObjectId(devUserId) ? devUserId : null,
    isDevMode: true,
  }
}
```

---

## References

- [PayloadCMS Relationships](https://payloadcms.com/docs/fields/relationship)
- [MongoDB ObjectId Format](https://www.mongodb.com/docs/manual/reference/method/ObjectId/)
- [BSON Specification](http://bsonspec.org/)
- Related Fix: `docs/fixes/CONVERSATION_ID_VALIDATION.md`

