# Departments Collection Changelog

## Recent Updates

### ✅ Added `gatherCheck` Field (Latest)

**Date:** 2025-01-XX

**Changes:**
- Added `gatherCheck` checkbox field to Departments collection
- Default value: `false`
- Fully editable in admin UI
- All 6 core departments seeded with `gatherCheck: false`

**Purpose:**
- Marks departments for gathering/collection operations
- Enables workflow automation and data collection features
- Provides flexibility for department-specific processing

**Files Modified:**
- `src/collections/Departments.ts` - Added field definition
- `src/seed/departments.seed.ts` - Added `gatherCheck: false` to all departments
- `src/payload-types.ts` - Auto-generated types updated

**Documentation:**
- Created `docs/features/department-gather-check.md`
- Updated `docs/features/department-fields-summary.md`

**TypeScript Type:**
```typescript
gatherCheck?: boolean | null
```

---

### ✅ Added `coreDepartment` Field

**Date:** 2025-01-XX

**Changes:**
- Added `coreDepartment` checkbox field to Departments collection
- Default value: `false`
- Read-only in admin UI
- Implements delete protection for core departments
- 6 core departments marked with `coreDepartment: true`

**Purpose:**
- Prevents accidental deletion of essential system departments
- Protects workflow integrity
- Maintains hierarchical agent structure

**Core Departments Protected:**
1. Story Department (`story`)
2. Character Department (`character`)
3. Visual Department (`visual`)
4. Video Department (`video`)
5. Audio Department (`audio`)
6. Production Department (`production`)

**Files Modified:**
- `src/collections/Departments.ts` - Added field and delete access control
- `src/seed/departments.seed.ts` - Added `coreDepartment: true` to core departments
- `src/payload-types.ts` - Auto-generated types updated

**Documentation:**
- Created `docs/features/core-departments-protection.md`
- Created `tests/departments/core-department-protection.test.ts`

**Access Control:**
```typescript
delete: ({ req, data }) => {
  if (data?.coreDepartment === true) {
    return false
  }
  return true
}
```

**TypeScript Type:**
```typescript
coreDepartment?: boolean | null
```

---

## Field Comparison

| Field | Type | Default | Editable | Purpose |
|-------|------|---------|----------|---------|
| `isActive` | checkbox | `true` | ✅ Yes | Enable/disable department |
| `coreDepartment` | checkbox | `false` | ❌ No (read-only) | Protect from deletion |
| `gatherCheck` | checkbox | `false` | ✅ Yes | Mark for gathering operations |

## Migration Guide

### For Existing Databases

**Step 1: Generate Types**
```bash
pnpm payload generate:types
```

**Step 2: Run Seed Script**
```bash
pnpm db:seed
```

**Step 3: Verify Changes**
```bash
# Check that types are updated
grep "coreDepartment\|gatherCheck" src/payload-types.ts

# Verify seed data
# Check PayloadCMS admin UI for the new fields
```

### Manual Database Update (if needed)

If the seed script doesn't update existing departments:

```typescript
import { getPayload } from 'payload'
import config from './src/payload.config'

const payload = await getPayload({ config })

// Update core departments
const coreSlugs = ['story', 'character', 'visual', 'video', 'audio', 'production']

for (const slug of coreSlugs) {
  const dept = await payload.find({
    collection: 'departments',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (dept.docs.length > 0) {
    await payload.update({
      collection: 'departments',
      id: dept.docs[0].id,
      data: {
        coreDepartment: true,
        gatherCheck: false,
      },
    })
  }
}

// Update custom departments
const customDepts = await payload.find({
  collection: 'departments',
  where: {
    slug: { not_in: coreSlugs },
  },
})

for (const dept of customDepts.docs) {
  await payload.update({
    collection: 'departments',
    id: dept.id,
    data: {
      coreDepartment: false,
      gatherCheck: false,
    },
  })
}
```

## Testing

### Run Tests

```bash
# Run department protection tests
pnpm test tests/departments/core-department-protection.test.ts

# Run all tests
pnpm test
```

### Manual Testing Checklist

- [ ] Verify `coreDepartment` field appears in admin UI (read-only)
- [ ] Verify `gatherCheck` field appears in admin UI (editable)
- [ ] Attempt to delete a core department (should fail)
- [ ] Successfully delete a custom department
- [ ] Toggle `gatherCheck` on a department (should succeed)
- [ ] Verify TypeScript types are correct
- [ ] Check that seed script runs without errors

## API Changes

### REST API

**New fields in responses:**
```json
{
  "id": "dept-123",
  "slug": "story",
  "name": "Story Department",
  "isActive": true,
  "coreDepartment": true,
  "gatherCheck": false,
  ...
}
```

**Query by new fields:**
```bash
# Get departments with gather check enabled
GET /api/departments?where[gatherCheck][equals]=true

# Get core departments
GET /api/departments?where[coreDepartment][equals]=true

# Get custom (deletable) departments
GET /api/departments?where[coreDepartment][equals]=false
```

### GraphQL

**Updated schema:**
```graphql
type Department {
  id: ID!
  slug: String!
  name: String!
  isActive: Boolean
  coreDepartment: Boolean
  gatherCheck: Boolean
  # ... other fields
}
```

**Query examples:**
```graphql
# Get departments with gather check
query {
  Departments(where: { gatherCheck: { equals: true } }) {
    docs {
      id
      name
      gatherCheck
    }
  }
}

# Get core departments
query {
  Departments(where: { coreDepartment: { equals: true } }) {
    docs {
      id
      name
      coreDepartment
    }
  }
}
```

## Breaking Changes

**None.** Both fields are optional and default to `false`, ensuring backward compatibility.

## Future Enhancements

### Planned Features

1. **Gather Metadata Field**
   - Store gathering configuration per department
   - Track last gather timestamp
   - Store gather status

2. **Department Dependencies**
   - Track which agents depend on each department
   - Prevent deletion if agents exist
   - Show dependency graph

3. **Audit Logging**
   - Log all department changes
   - Track who enabled/disabled gather check
   - Monitor deletion attempts on core departments

4. **Visual Indicators**
   - Badge for core departments in admin UI
   - Icon for departments with gather check enabled
   - Color coding by status

5. **Bulk Operations**
   - Bulk enable/disable gather check
   - Bulk activate/deactivate departments
   - Export/import department configurations

## Related Documentation

- [Core Departments Protection](./features/core-departments-protection.md)
- [Department Gather Check](./features/department-gather-check.md)
- [Department Fields Summary](./features/department-fields-summary.md)
- [Dynamic Agents Architecture](./architecture/dynamic-agents-architecture.md)

## Support

For questions or issues:
1. Check the documentation in `docs/features/`
2. Review test files in `tests/departments/`
3. Examine seed data in `src/seed/departments.seed.ts`
4. Check collection definition in `src/collections/Departments.ts`

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Production Ready

