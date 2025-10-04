# Clear Gather Feature

## Overview

The Clear Gather feature allows users to completely reset a project's gather database by deleting all gather items from both MongoDB and the Brain service. This is useful when starting fresh with new story content or cleaning up test data.

## User Interface

### Location
The clear button appears in the Gather page header, next to the item count.

### Visual Design
- **Icon**: Red trash icon (Trash2 from lucide-react)
- **Size**: Small (h-4 w-4)
- **Color**: Red-400 with hover effect to red-300
- **Background**: Ghost variant with red-500/10 hover background
- **Visibility**: Only shown when there are items to delete (data.total > 0)

### Button Placement
```
┌─────────────────────────────────────────────────────────┐
│ Gather                                                   │
│ Unqualified Content Collection for Project Name         │
│                                                          │
│                     Items: 42 [🗑️]  [⚡ Automated Gather]│
└─────────────────────────────────────────────────────────┘
```

## User Flow

### 1. Click Trash Icon
User clicks the small red trash icon next to the item count.

### 2. Confirmation Dialog
A browser confirmation dialog appears with:
```
⚠️ WARNING: This will permanently delete ALL gather data for this project!

This includes:
• 42 gather items from MongoDB
• All associated data from Brain service

This action CANNOT be undone!

Are you sure you want to continue?
```

### 3. Processing
If confirmed:
- Button becomes disabled
- Toast notification: "Clearing all gather data..."
- API call to `/api/v1/gather/[projectId]/clear`

### 4. Success
- Toast notification: "Successfully cleared X gather items and Y brain nodes"
- Page automatically refetches to show empty state
- Button disappears (since total is now 0)

### 5. Error Handling
- **Partial Success**: "Partially cleared: X gather items, Y brain nodes. Some errors occurred."
- **Complete Failure**: "Failed to clear gather data"

## Technical Implementation

### API Endpoint

**Endpoint**: `DELETE /api/v1/gather/[projectId]/clear`

**Authentication**: Required (auto-login in development mode using `devAuth`)

**Process**:
1. Validates project exists
2. Fetches all gather items (up to 1000)
3. Deletes each item from Brain service (ignores 404 errors)
4. Drops the entire MongoDB gather collection for the project
5. Returns deletion counts and any errors

**Response**:
```typescript
{
  success: boolean
  message: string
  deleted: {
    gather: number    // Items deleted from MongoDB
    brain: number     // Nodes deleted from Brain service
  }
  errors?: string[]   // Optional array of error messages
}
```

**Status Codes**:
- `200 OK` - Complete success
- `207 Multi-Status` - Partial success (some errors occurred)
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Unexpected error

### Brain Service Integration

The feature uses the Brain API's delete endpoint:
```
DELETE https://brain.ft.tc/api/v1/nodes/{node_id}?project_id={project_id}
```

**Error Handling**:
- 404 errors are ignored (node might not exist in brain)
- Other errors are logged but don't stop the process
- All errors are collected and returned in the response

### MongoDB Operations

The feature drops the entire gather collection:
```typescript
const gatherDb = client.db(`aladdin-gather-${projectId}`)
await gatherDb.collection('gather').drop()
```

This is more efficient than deleting items one by one and ensures complete cleanup.

## Files Modified

### 1. API Route
**File**: `src/app/api/v1/gather/[projectId]/clear/route.ts`
- New DELETE endpoint for clearing gather data
- Handles MongoDB and Brain service deletion
- Returns detailed results with error handling

### 2. Gather Page Client
**File**: `src/app/(frontend)/dashboard/project/[id]/gather/GatherPageClient.tsx`
- Added Trash2 icon import
- Added `isClearing` state
- Added `handleClearGather` function
- Added trash button in header (only visible when items exist)

### 3. Brain Client
**File**: `src/lib/brain/client.ts`
- Updated `deleteNode` method to support `projectId` parameter
- Sends `project_id` as query parameter to Brain API

### 4. Brain Types
**File**: `src/lib/brain/types.ts`
- Added optional `projectId` field to `DeleteNodeRequest` interface

## Usage Examples

### User Scenario 1: Starting Fresh
1. User has been testing with sample data
2. Wants to start with real story content
3. Clicks trash icon → Confirms deletion
4. All test data is removed
5. User can now add real story content via chat

### User Scenario 2: Changing Story Direction
1. User has developed "Aladdin and the 40 Thieves" content
2. Decides to pivot to a different story
3. Clicks trash icon → Confirms deletion
4. All old story content is removed
5. User can start fresh with new story

### User Scenario 3: Cleaning Up AI Enhancement Suggestions
1. AI Enhancement created meta-suggestions instead of actual content
2. User wants to remove these and add real story content
3. Clicks trash icon → Confirms deletion
4. All suggestions are removed
5. User can add actual story content

## Safety Features

### 1. Confirmation Dialog
- Clear warning message
- Shows exact count of items to be deleted
- Emphasizes action cannot be undone
- Requires explicit user confirmation

### 2. Visual Feedback
- Button disabled during operation
- Toast notifications at each stage
- Automatic page refresh to show results

### 3. Error Handling
- Partial success is reported (some items deleted)
- Errors are logged and returned to user
- Operation continues even if some deletions fail

### 4. Conditional Visibility
- Button only appears when there are items to delete
- Prevents accidental clicks on empty database

## Testing Checklist

- [ ] Button appears when gather has items
- [ ] Button hidden when gather is empty
- [ ] Confirmation dialog shows correct item count
- [ ] Cancel button works (no deletion)
- [ ] Confirm button triggers deletion
- [ ] Toast notifications appear at each stage
- [ ] MongoDB gather collection is dropped
- [ ] Brain nodes are deleted
- [ ] Page refetches after deletion
- [ ] Button disappears after successful deletion
- [ ] Error handling works for partial failures
- [ ] Unauthorized users cannot delete
- [ ] Invalid project ID returns 404

## Future Enhancements

### 1. Selective Deletion
- Delete by department
- Delete by date range
- Delete automated vs manual items

### 2. Backup Before Delete
- Create backup before deletion
- Allow restore from backup
- Export gather data as JSON

### 3. Soft Delete
- Mark items as deleted instead of removing
- Allow undo within time window
- Permanent deletion after grace period

### 4. Batch Operations
- Select multiple items to delete
- Bulk delete with checkboxes
- Delete all except selected

## Related Documentation

- [Gather Page Documentation](../idea/pages/gather.md)
- [Brain Service Integration](../implementation/GATHER_BRAIN_INTEGRATION.md)
- [Brain API Documentation](../mcp-brain-service/how-to-use.md)
- [Gather Database Schema](../../src/lib/db/gatherDatabase.ts)

