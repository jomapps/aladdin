# Project API Type Fix

**Date**: 2025-10-01  
**Issue**: Type mismatch in project creation - genre field error  
**Status**: ✅ Fixed

---

## Problem

Project creation was failing with error:
```
TypeError: Cannot create property 'genre' on string 'action'
```

### Root Causes

1. **Genre Field Type Mismatch**
   - API was sending: `genre: "action"` (string)
   - PayloadCMS expects: `genre: [{ genre: "action" }]` (array of objects)

2. **Incorrect Field Mapping**
   - API was using `description` field
   - PayloadCMS schema uses `logline` field

3. **Unnecessary User Association**
   - API was trying to set `owner` and `team` fields
   - These fields don't exist in the schema
   - Authentication is only for access control, not project ownership

---

## Solution

### 1. Fixed Genre Field Format

**Before:**
```typescript
genre: genre ? [genre] : []  // ❌ Array of strings
```

**After:**
```typescript
// Prepare genre array (PayloadCMS expects array of objects with 'genre' field)
const genreArray = genre && genre.trim() 
  ? [{ genre: genre.trim() }] 
  : []

// Use in data
genre: genreArray  // ✅ Array of objects
```

### 2. Fixed Field Mapping

**Before:**
```typescript
data: {
  description: description?.trim() || '',  // ❌ Wrong field
}
```

**After:**
```typescript
data: {
  logline: description?.trim() || '',  // ✅ Correct field
}
```

### 3. Removed User Association

**Before:**
```typescript
data: {
  owner: user.id,           // ❌ Field doesn't exist
  team: [{                  // ❌ Field doesn't exist
    user: user.id,
    role: 'owner',
  }],
}
```

**After:**
```typescript
data: {
  // No owner or team fields
  // Authentication is just for access control
}
```

### 4. Fixed GET Endpoint

**Before:**
```typescript
// Fetch projects where user is owner or team member
const projects = await payload.find({
  collection: 'projects',
  where: {
    or: [
      { owner: { equals: user.id } },      // ❌ Field doesn't exist
      { 'team.user': { equals: user.id } }, // ❌ Field doesn't exist
    ],
  },
})
```

**After:**
```typescript
// Fetch all projects (no user filtering - authentication is just for access)
const projects = await payload.find({
  collection: 'projects',
  page,
  limit,
  sort: '-createdAt',
})
```

---

## PayloadCMS Schema Reference

### Genre Field Structure

```typescript
{
  name: 'genre',
  type: 'array',
  label: 'Genres',
  fields: [
    {
      name: 'genre',
      type: 'text',
    },
  ],
}
```

**Expected Data Format:**
```typescript
genre: [
  { genre: 'Fantasy' },
  { genre: 'Adventure' },
  { genre: 'Action' }
]
```

### Project Fields Used

```typescript
{
  name: 'name',        // Project name (required)
  slug: 'slug',        // Auto-generated URL slug
  logline: 'logline',  // One-sentence pitch (description)
  type: 'type',        // 'movie' or 'series'
  genre: 'genre',      // Array of genre objects
  status: 'status',    // 'active', 'paused', 'archived', 'complete'
  phase: 'phase',      // 'expansion', 'compacting', 'complete'
}
```

### No User Association

The Projects collection does NOT have:
- ❌ `owner` field
- ❌ `team` field
- ❌ `createdBy` field

**Why?**
- Human users only authenticate for access
- Projects are managed by AI agents
- Departments have AI heads, not human owners
- No concept of human team members

---

## Updated API Behavior

### POST /api/v1/projects

**Request:**
```json
{
  "name": "Aladdin Remake",
  "description": "A modern retelling of the classic tale",
  "type": "movie",
  "genre": "Fantasy"
}
```

**Response (201):**
```json
{
  "id": "proj_123",
  "name": "Aladdin Remake",
  "slug": "aladdin-remake",
  "logline": "A modern retelling of the classic tale",
  "type": "movie",
  "status": "active",
  "phase": "expansion",
  "createdAt": "2025-10-01T12:00:00Z"
}
```

### GET /api/v1/projects

**Request:**
```
GET /api/v1/projects?page=1&limit=10
```

**Response:**
```json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "Aladdin Remake",
      "slug": "aladdin-remake",
      "type": "movie",
      "status": "active",
      "phase": "expansion",
      "createdAt": "2025-10-01T12:00:00Z"
    }
  ],
  "totalPages": 1,
  "totalDocs": 1,
  "page": 1,
  "hasNextPage": false,
  "hasPrevPage": false
}
```

---

## Architecture Notes

### Authentication vs Authorization

**Authentication (Current):**
- ✅ User logs in with email/password
- ✅ Gets authenticated session
- ✅ Can access the application

**What Authentication Does NOT Do:**
- ❌ Associate projects with users
- ❌ Create user ownership
- ❌ Manage team membership
- ❌ Control project access per user

**Why?**
- Projects are AI-driven, not user-driven
- All authenticated users can see all projects
- Departments are managed by AI agents
- Human users are observers/directors, not owners

### AI Agent System

**Departments:**
- Story Department (AI Head)
- Character Department (AI Head)
- Visual Department (AI Head)
- Audio Department (AI Head)
- Production Department (AI Head)

**Team:**
- Team = AI Agents
- Each department has AI agents
- No human team members
- Humans authenticate to access, not to own

---

## Testing

### Test Project Creation

1. **Open Dashboard**
   ```
   http://localhost:3000/dashboard
   ```

2. **Click "Create Project"**

3. **Fill Form:**
   - Name: "Test Movie"
   - Type: "Movie"
   - Genre: "Action"
   - Description: "A test project"

4. **Submit**

5. **Expected Result:**
   - ✅ Project created successfully
   - ✅ Toast notification appears
   - ✅ Redirects to project page
   - ✅ No errors in console

### Verify in Database

```javascript
// Check genre format
{
  name: "Test Movie",
  genre: [
    { genre: "Action" }  // ✅ Correct format
  ]
}
```

---

## Files Modified

1. ✅ `src/app/api/v1/projects/route.ts`
   - Fixed genre array format
   - Changed `description` to `logline`
   - Removed `owner` and `team` fields
   - Removed user filtering in GET endpoint

---

## Status

**Current State**: ✅ **WORKING**

- Project creation works correctly
- Genre field properly formatted
- No user association
- All projects visible to authenticated users

**Ready for**: Production use

---

## Key Takeaways

1. **PayloadCMS Array Fields**
   - Array fields with nested objects need proper structure
   - `genre: [{ genre: "value" }]` not `genre: ["value"]`

2. **Field Names Matter**
   - Use exact field names from schema
   - `logline` not `description`

3. **No User Ownership**
   - Projects are not owned by users
   - Authentication is for access only
   - AI agents manage projects

4. **Schema-First Development**
   - Always check PayloadCMS schema first
   - Match API data structure to schema
   - Don't assume field names or types

