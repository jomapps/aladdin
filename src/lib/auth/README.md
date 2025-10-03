# Authentication Library

Centralized authentication utilities for the Aladdin application.

## Overview

This directory contains authentication helpers that provide consistent authentication handling across development and production environments.

## Files

### `devAuth.ts`

Development authentication helper with auto-login functionality.

**Key Features**:
- ✅ Auto-login as first user in development mode
- ✅ Caches user ID for performance
- ✅ Validates MongoDB ObjectIds
- ✅ Consistent API across dev and production

## Usage

### In API Routes

```typescript
import { authenticateRequest } from '@/lib/auth/devAuth'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config: await configPromise })
  const { userId, isDevMode } = await authenticateRequest(request, payload)

  // In production, require authentication
  if (!isDevMode && !userId) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' }, 
      { status: 401 }
    )
  }

  // userId is now:
  // - Valid ObjectId from first user (in development)
  // - Valid ObjectId from authenticated user (in production)
  // - null (if no users exist in dev, or not authenticated in prod)
}
```

### ObjectId Validation

```typescript
import { isValidObjectId, validateObjectId } from '@/lib/auth/devAuth'

// Check if a string is a valid MongoDB ObjectId
if (isValidObjectId(someId)) {
  // Use the ID
}

// Validate and sanitize an ID (returns undefined if invalid)
const validId = validateObjectId(someId, 'fieldName')
```

## Development Mode Behavior

### Auto-Login Process

1. **First Request**: Queries database for first user (sorted by `createdAt`)
2. **Caching**: Stores user ID in memory for subsequent requests
3. **Logging**: Logs the auto-login user email for debugging
4. **Fallback**: Returns `null` if no users exist (with warning)

### Prerequisites

**Users must exist in the database**. Run the seed script to create default users:

```bash
# Seed all collections (includes users)
pnpm db:seed

# Or seed only users
pnpm db:seed --collection users
```

This creates 3 default users:
- `admin@aladdin.dev` (password: `admin123`) - **Used for auto-login**
- `creator@aladdin.dev` (password: `creator123`)
- `demo@aladdin.dev` (password: `demo123`)

### Cache Management

The user ID is cached in memory (`cachedDevUserId`). To clear the cache:
- **Restart the development server**
- Cache is automatically cleared on server restart

## Production Mode Behavior

### Standard Authentication

1. **Session Validation**: Uses PayloadCMS `auth()` method
2. **User Extraction**: Returns authenticated user's ID
3. **No Caching**: Each request validates the session
4. **Strict Mode**: Returns `null` if not authenticated

## API Reference

### `authenticateRequest(request, payload)`

Authenticate user or auto-login in development mode.

**Parameters**:
- `request: NextRequest` - Next.js request object
- `payload: Payload` - PayloadCMS instance

**Returns**: `Promise<AuthResult>`
```typescript
interface AuthResult {
  userId: string | null  // User ID or null
  isDevMode: boolean     // True if in development mode
}
```

**Behavior**:
- **Development**: Auto-login as first user
- **Production**: Validate session and return user ID

### `isValidObjectId(id)`

Validate MongoDB ObjectId format.

**Parameters**:
- `id: string` - String to validate

**Returns**: `boolean`
- `true` if valid ObjectId (24 hex characters)
- `false` otherwise

### `validateObjectId(id, fieldName)`

Validate and sanitize an ObjectId for use in relationships.

**Parameters**:
- `id: string | null | undefined` - ID to validate
- `fieldName: string` - Field name for logging

**Returns**: `string | undefined`
- Valid ObjectId string if valid
- `undefined` if invalid or null

**Side Effects**:
- Logs warning if ID is invalid

## Examples

### Complete API Route Example

```typescript
// src/app/api/v1/orchestrator/query/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { authenticateRequest } from '@/lib/auth/devAuth'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const payload = await getPayload({ config: await configPromise })
    const { userId, isDevMode } = await authenticateRequest(request, payload)

    if (!isDevMode && !userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' }, 
        { status: 401 }
      )
    }

    // 2. Parse request
    const body = await request.json()
    const { content, projectId } = body

    // 3. Create conversation with valid user ID
    const conversation = await payload.create({
      collection: 'conversations',
      data: {
        name: `Query - ${new Date().toISOString()}`,
        project: projectId,
        user: userId,  // ✅ Always valid ObjectId
        status: 'active',
      },
    })

    return NextResponse.json({ success: true, conversation })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
```

## Troubleshooting

### "No users found in database"

**Problem**: Warning logged on first request in development mode.

**Solution**: Run the seed script to create users:
```bash
pnpm db:seed
```

### Conversations not linked to user

**Problem**: Conversations have `user: null` in development.

**Cause**: No users exist in the database.

**Solution**: Seed the database and restart the server:
```bash
pnpm db:seed
pnpm dev
```

### Wrong user being used

**Problem**: Auto-login uses unexpected user.

**Cause**: First user (by `createdAt`) is selected.

**Solution**: 
1. Check which user was created first
2. Or implement environment variable override (see Future Improvements in docs)

## Related Documentation

- [Development Authentication Fix](../../../docs/fixes/DEV_AUTH_OBJECTID_FIX.md)
- [Database Seeding Guide](../../../docs/DATABASE_SEEDING.md)
- [PayloadCMS Authentication](https://payloadcms.com/docs/authentication/overview)

## Best Practices

### ✅ DO

- Use `authenticateRequest` in all API routes
- Seed users before starting development
- Check logs for auto-login confirmation
- Restart server after adding users

### ❌ DON'T

- Don't use string literals like `'dev-user'` for user IDs
- Don't pass invalid ObjectIds to relationship fields
- Don't forget to seed users in new environments
- Don't manually manipulate the cache

