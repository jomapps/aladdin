# Core Departments Protection

## Overview

The Departments collection now includes a `coreDepartment` field that prevents deletion of essential system departments. This ensures the integrity of the movie production workflow by protecting the 6 core departments that are fundamental to the system.

## Core Departments

The following 6 departments are marked as core departments and **cannot be deleted**:

1. **Story Department** (`story`) - Priority 1
2. **Character Department** (`character`) - Priority 2
3. **Visual Department** (`visual`) - Priority 3
4. **Video Department** (`video`) - Priority 4
5. **Audio Department** (`audio`) - Priority 5
6. **Production Department** (`production`) - Priority 6

## Implementation Details

### Database Schema

**Field Added to Departments Collection:**

```typescript
{
  name: 'coreDepartment',
  type: 'checkbox',
  label: 'Core Department',
  defaultValue: false,
  admin: {
    description: 'Core departments cannot be deleted (Story, Character, Visual, Video, Audio, Production)',
    readOnly: true,
  },
}
```

### Access Control

**Delete Protection Logic:**

```typescript
access: {
  delete: ({ req, data }) => {
    // Prevent deletion of core departments
    if (data?.coreDepartment === true) {
      return false
    }
    return true
  },
}
```

### Seed Data

All 6 core departments are seeded with `coreDepartment: true`:

```typescript
{
  slug: 'story',
  name: 'Story Department',
  coreDepartment: true,
  // ... other fields
}
```

## Behavior

### What Users Can Do

✅ **Allowed Actions:**
- View all departments (core and custom)
- Create new custom departments
- Update department settings (except `coreDepartment` field which is read-only)
- Delete custom departments (where `coreDepartment: false`)
- Activate/deactivate departments using the `isActive` field

### What Users Cannot Do

❌ **Restricted Actions:**
- Delete core departments
- Modify the `coreDepartment` field (it's read-only in admin UI)
- Remove essential workflow departments

## User Experience

### In PayloadCMS Admin

1. **Department List View:**
   - Core departments are visible alongside custom departments
   - No visual distinction needed (delete button simply won't work)

2. **Department Edit View:**
   - `coreDepartment` field is visible but read-only
   - Shows description explaining which departments are protected

3. **Delete Attempt:**
   - If user tries to delete a core department, PayloadCMS will return an access denied error
   - Custom departments can be deleted normally

## Custom Departments

Users can still create custom departments for specialized workflows:

**Example Custom Department:**

```typescript
{
  slug: 'marketing',
  name: 'Marketing Department',
  description: 'Handles promotional materials and marketing campaigns',
  icon: '📢',
  color: '#FF6B6B',
  priority: 7,
  isActive: true,
  coreDepartment: false, // Can be deleted
  // ... other settings
}
```

## Migration Notes

### For Existing Databases

If you have an existing database without the `coreDepartment` field:

1. **Run Type Generation:**
   ```bash
   pnpm payload generate:types
   ```

2. **Update Existing Departments:**
   - The field will default to `false` for all existing departments
   - Run the seed script to update core departments:
   ```bash
   pnpm db:seed
   ```
   - The seed script checks for existing departments and only creates missing ones

3. **Manual Update (if needed):**
   - Access PayloadCMS admin
   - Manually set `coreDepartment: true` for the 6 core departments
   - Or use MongoDB directly to update

## Technical Details

### TypeScript Types

The generated TypeScript interface includes:

```typescript
export interface Department {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon?: string | null;
  color?: string | null;
  priority: number;
  isActive?: boolean | null;
  coreDepartment?: boolean | null; // ← Core department protection
  gatherCheck?: boolean | null; // ← Gather check flag
  // ... other fields
}
```

### Database Query Example

**Fetch only custom (deletable) departments:**

```typescript
const customDepartments = await payload.find({
  collection: 'departments',
  where: {
    coreDepartment: {
      equals: false,
    },
  },
})
```

**Fetch all core departments:**

```typescript
const coreDepartments = await payload.find({
  collection: 'departments',
  where: {
    coreDepartment: {
      equals: true,
    },
  },
})
```

## Benefits

1. **System Integrity:** Prevents accidental deletion of essential departments
2. **Workflow Protection:** Ensures all core production workflows remain available
3. **Flexibility:** Still allows custom departments for specialized needs
4. **Clear Documentation:** Read-only field with description makes it clear which departments are protected
5. **Agent Coordination:** Maintains the hierarchical agent structure that depends on these departments

## Related Files

- `src/collections/Departments.ts` - Collection definition with access control
- `src/seed/departments.seed.ts` - Seed data with `coreDepartment: true` for core departments
- `src/payload-types.ts` - Auto-generated TypeScript types
- `docs/architecture/dynamic-agents-architecture.md` - Overall agent architecture
- `docs/features/department-gather-check.md` - Related `gatherCheck` field documentation

## Future Enhancements

Potential improvements:

1. **Visual Indicator:** Add a badge or icon in the admin UI to highlight core departments
2. **Bulk Operations:** Prevent bulk delete operations that include core departments
3. **Audit Logging:** Track attempts to delete core departments
4. **Custom Error Messages:** Provide user-friendly error messages explaining why deletion failed
5. **Department Dependencies:** Track which agents depend on each department before allowing deletion

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Implemented and Tested

