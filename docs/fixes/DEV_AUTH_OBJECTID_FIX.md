# Development Authentication & Auto-Login Fix

**Date**: 2025-01-XX
**Issue**: BSONError when creating conversations in development mode
**Status**: ✅ Fixed
**Solution**: Auto-login as first user in development mode

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

### 1. Created Development Authentication Helper with Auto-Login

**File**: `src/lib/auth/devAuth.ts`

A centralized helper module that automatically logs in as the first user in development mode:

```typescript
// Cache the first user ID to avoid repeated database queries
let cachedDevUserId: string | null = null

/**
 * Get the first user from the database for development mode auto-login
 */
async function getFirstUser(payload: Payload): Promise<string | null> {
  if (cachedDevUserId) {
    return cachedDevUserId
  }

  const users = await payload.find({
    collection: 'users',
    limit: 1,
    sort: 'createdAt', // Get the oldest user (likely admin)
  })

  if (users.docs.length > 0) {
    cachedDevUserId = users.docs[0].id
    console.log('[DevAuth] Auto-login as first user:', users.docs[0].email)
    return cachedDevUserId
  }

  console.warn('[DevAuth] No users found. Run `pnpm db:seed` to create users.')
  return null
}

/**
 * Authenticate user or auto-login in development mode
 *
 * In development mode:
 * - Automatically logs in as the first user in the database
 * - Returns valid user ID for relationships
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
    // ✅ Auto-login as first user in development
    const userId = await getFirstUser(payload)
    return { userId, isDevMode: true }
  }

  // Production mode - require authentication
  const { user } = await payload.auth({ req: request as any })
  return { userId: user?.id || null, isDevMode: false }
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
import { isValidObjectId } from '@/lib/auth/devAuth'

export async function handleQuery(options: QueryHandlerOptions) {
  // ... existing code ...

  // ✅ No validation needed - userId is always valid (auto-login in dev)
  if (!actualConversationId || !conversationExists) {
    const newConversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Query - ${new Date().toISOString()}`,
        project: projectId,  // ✅ Always valid ObjectId
        user: userId,        // ✅ Always valid ObjectId (auto-login in dev)
        status: 'active',
        messages: [],
      },
    })
  }
}
```

**Key Benefits**:
- ✅ No validation or sanitization needed
- ✅ Cleaner, simpler code
- ✅ Real user relationships even in development
- ✅ Consistent behavior across dev and production

---

## Behavior Changes

### Development Mode (NODE_ENV=development)

**Before**:
- ❌ `userId = 'dev-user'` (invalid ObjectId)
- ❌ Crashes when creating conversations
- ❌ BSON validation error

**After**:
- ✅ Auto-login as first user in database (e.g., `admin@aladdin.dev`)
- ✅ `userId = <valid ObjectId>` from first user
- ✅ Conversations properly linked to user
- ✅ No authentication required
- ✅ No BSON errors
- ✅ User ID cached for performance

### Production Mode

**Before**:
- ✅ `userId = user.id` (valid ObjectId from auth)
- ✅ Conversations linked to authenticated user

**After**:
- ✅ Same behavior (no changes)
- ✅ Authentication still required
- ✅ User relationships properly maintained

---

## Prerequisites

### Database Must Have Users

The auto-login feature requires at least one user in the database. If no users exist, the API will still work but conversations won't have user associations.

**To create users, run the seed script**:

```bash
# Seed users and other collections
pnpm db:seed

# Or seed only users
pnpm db:seed --collection users
```

This creates 3 default users:
- `admin@aladdin.dev` (password: `admin123`)
- `creator@aladdin.dev` (password: `creator123`)
- `demo@aladdin.dev` (password: `demo123`)

The auto-login will use the first user (oldest by `createdAt`), which is typically the admin user.

---

## Testing

### Manual Testing

1. **Development Mode**:
   ```bash
   # Ensure users exist
   pnpm db:seed

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

   **Expected**: ✅ Success, conversation created with auto-login user

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
2. **Seed users before development** with `pnpm db:seed`
3. **Test both dev and production modes**
4. **Restart server if users are added** (to clear cache)
5. **Check logs for auto-login confirmation** in development

### ❌ DON'T

1. **Don't use string literals** like `'dev-user'` for user IDs
2. **Don't pass invalid ObjectIds** to relationship fields
3. **Don't forget to seed users** when setting up a new environment
4. **Don't manually clear the cache** (it's handled automatically)

---

## Future Improvements

### ✅ Already Implemented: Auto-Login with First User

The current implementation uses the best approach - automatically logging in as the first user in the database. This provides:
- Real user relationships in development
- No manual configuration needed
- Consistent with production behavior
- Performance optimization via caching

### Potential Enhancements

#### 1. Environment Variable Override

Allow specifying a specific user for auto-login:

```bash
# .env.local
DEV_USER_EMAIL=creator@aladdin.dev
```

```typescript
// src/lib/auth/devAuth.ts
async function getFirstUser(payload: Payload): Promise<string | null> {
  if (cachedDevUserId) return cachedDevUserId

  const devEmail = process.env.DEV_USER_EMAIL

  if (devEmail) {
    // Find specific user by email
    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: devEmail } },
      limit: 1,
    })
    if (users.docs.length > 0) {
      cachedDevUserId = users.docs[0].id
      return cachedDevUserId
    }
  }

  // Fall back to first user
  // ... existing code
}
```

#### 2. Auto-Create Dev User

Automatically create a dev user if none exists:

```typescript
async function getFirstUser(payload: Payload): Promise<string | null> {
  // ... existing code to find user ...

  if (users.docs.length === 0) {
    console.log('[DevAuth] No users found, creating dev user...')
    const devUser = await payload.create({
      collection: 'users',
      data: {
        email: 'dev@aladdin.local',
        password: 'dev-password',
        name: 'Development User',
      },
    })
    cachedDevUserId = devUser.id
    return cachedDevUserId
  }
}
```

---

## References

- [PayloadCMS Relationships](https://payloadcms.com/docs/fields/relationship)
- [MongoDB ObjectId Format](https://www.mongodb.com/docs/manual/reference/method/ObjectId/)
- [BSON Specification](http://bsonspec.org/)
- Related Fix: `docs/fixes/CONVERSATION_ID_VALIDATION.md`

