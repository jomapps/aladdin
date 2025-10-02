# Department Gather Check

## Overview

The `gatherCheck` field is a boolean flag added to the Departments collection that allows departments to be marked for gathering/collection operations. This field provides flexibility for workflow management and department-specific processing.

## Field Details

**Field Name:** `gatherCheck`  
**Type:** `checkbox` (boolean)  
**Default Value:** `false`  
**Location:** Departments Collection  
**Admin UI:** Editable (not read-only)

## Implementation

### Database Schema

```typescript
{
  name: 'gatherCheck',
  type: 'checkbox',
  label: 'Gather Check',
  defaultValue: false,
  admin: {
    description: 'Enable gather check for this department',
  },
}
```

### TypeScript Interface

```typescript
export interface Department {
  id: string;
  slug: string;
  name: string;
  // ... other fields
  coreDepartment?: boolean | null;
  gatherCheck?: boolean | null;  // ← New field
  defaultModel?: string | null;
  // ... other fields
}
```

## Default Values

All 6 core departments are seeded with `gatherCheck: false`:

- **Story Department** - `gatherCheck: false`
- **Character Department** - `gatherCheck: false`
- **Visual Department** - `gatherCheck: false`
- **Video Department** - `gatherCheck: false`
- **Audio Department** - `gatherCheck: false`
- **Production Department** - `gatherCheck: false`

## Usage Examples

### Query Departments with Gather Check Enabled

```typescript
const gatherDepartments = await payload.find({
  collection: 'departments',
  where: {
    gatherCheck: {
      equals: true,
    },
  },
})
```

### Enable Gather Check for a Department

```typescript
await payload.update({
  collection: 'departments',
  id: departmentId,
  data: {
    gatherCheck: true,
  },
})
```

### Check if Department Has Gather Check

```typescript
const department = await payload.findByID({
  collection: 'departments',
  id: departmentId,
})

if (department.gatherCheck) {
  // Perform gather operations
  console.log(`Gathering data for ${department.name}`)
}
```

### Filter Active Departments with Gather Check

```typescript
const activeDepartmentsWithGather = await payload.find({
  collection: 'departments',
  where: {
    and: [
      {
        isActive: {
          equals: true,
        },
      },
      {
        gatherCheck: {
          equals: true,
        },
      },
    ],
  },
})
```

## Use Cases

The `gatherCheck` field can be used for various purposes:

1. **Data Collection Workflows**
   - Mark departments that need to gather data from external sources
   - Enable batch processing for specific departments

2. **Reporting & Analytics**
   - Identify departments that should be included in data gathering reports
   - Track which departments participate in collection operations

3. **Workflow Automation**
   - Trigger automated gathering processes for marked departments
   - Enable/disable gathering features per department

4. **Quality Assurance**
   - Mark departments that require data validation checks
   - Enable additional verification steps for specific departments

5. **Integration Points**
   - Identify departments that integrate with external systems
   - Control which departments participate in data synchronization

## Admin UI Behavior

### Editing the Field

Unlike `coreDepartment` (which is read-only), the `gatherCheck` field is **fully editable** in the PayloadCMS admin interface:

1. Navigate to **Departments** collection
2. Select a department to edit
3. Toggle the **Gather Check** checkbox
4. Save changes

### Visual Representation

The field appears as a standard checkbox in the admin UI with the label "Gather Check" and description "Enable gather check for this department".

## Comparison with Other Department Fields

| Field | Type | Default | Editable | Purpose |
|-------|------|---------|----------|---------|
| `isActive` | checkbox | `true` | ✅ Yes | Enable/disable department |
| `coreDepartment` | checkbox | `false` | ❌ No (read-only) | Protect core departments from deletion |
| `gatherCheck` | checkbox | `false` | ✅ Yes | Mark departments for gathering operations |

## Integration with Existing Features

### Works With Core Departments

The `gatherCheck` field is independent of `coreDepartment`:

```typescript
// A core department can have gather check enabled
{
  slug: 'story',
  coreDepartment: true,
  gatherCheck: true,  // Can be toggled
}

// A custom department can also have gather check
{
  slug: 'marketing',
  coreDepartment: false,
  gatherCheck: true,  // Can be toggled
}
```

### Works With Active Status

Combine with `isActive` for fine-grained control:

```typescript
// Active department with gather check
{
  isActive: true,
  gatherCheck: true,
}

// Inactive department (gather check ignored)
{
  isActive: false,
  gatherCheck: true,  // Won't be processed if department is inactive
}
```

## API Examples

### REST API

**Get departments with gather check enabled:**

```bash
GET /api/departments?where[gatherCheck][equals]=true
```

**Update gather check:**

```bash
PATCH /api/departments/:id
Content-Type: application/json

{
  "gatherCheck": true
}
```

### GraphQL

**Query departments with gather check:**

```graphql
query {
  Departments(where: { gatherCheck: { equals: true } }) {
    docs {
      id
      name
      slug
      gatherCheck
      isActive
    }
  }
}
```

**Update gather check:**

```graphql
mutation {
  updateDepartment(id: "dept-id", data: { gatherCheck: true }) {
    id
    name
    gatherCheck
  }
}
```

## Migration Notes

### For Existing Databases

When adding this field to an existing database:

1. **Automatic Default:** All existing departments will have `gatherCheck: false` by default
2. **No Breaking Changes:** The field is optional (`gatherCheck?: boolean | null`)
3. **Type Generation:** Run `pnpm payload generate:types` to update TypeScript types
4. **Seed Script:** Running `pnpm db:seed` will add the field to core departments

### Manual Update

If needed, update existing departments manually:

```typescript
// Update all departments to have gatherCheck: false
const departments = await payload.find({
  collection: 'departments',
  limit: 1000,
})

for (const dept of departments.docs) {
  await payload.update({
    collection: 'departments',
    id: dept.id,
    data: {
      gatherCheck: false,
    },
  })
}
```

## Best Practices

1. **Clear Purpose:** Document why a department has `gatherCheck` enabled
2. **Consistent Usage:** Use the field consistently across your application
3. **Combine with isActive:** Always check both `isActive` and `gatherCheck` when processing
4. **Audit Trail:** Consider logging when `gatherCheck` is toggled
5. **Performance:** Index the field if you frequently query by it

## Related Files

- `src/collections/Departments.ts` - Collection definition with `gatherCheck` field
- `src/seed/departments.seed.ts` - Seed data with `gatherCheck: false` for all departments
- `src/payload-types.ts` - Auto-generated TypeScript types
- `docs/features/core-departments-protection.md` - Related feature documentation

## Future Enhancements

Potential improvements:

1. **Gather Metadata:** Add a `gatherMetadata` field to store gathering configuration
2. **Gather History:** Track when gathering operations were last performed
3. **Gather Status:** Add status field (pending, in-progress, completed, failed)
4. **Gather Scheduling:** Add cron-like scheduling for automated gathering
5. **Gather Logs:** Store logs of gathering operations per department

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Implemented and Ready to Use

