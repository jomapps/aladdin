# Departments Collection Changelog

## Recent Updates

### ✅ Added Project Readiness System

**Date:** 2025-10-02

**Changes:**
- Implemented comprehensive Project Readiness evaluation system
- Added sequential department evaluation workflow (1→7)
- Created threshold-based gating mechanism
- Integrated with gather database for evaluation data
- Built tasks.ft.tc (Celery-Redis) integration for long-running evaluations
- Created 7 new API routes for project readiness
- Implemented Zustand store with 30-second polling
- Built complete UI components for evaluation progress tracking

**New Collections:**
- `project-readiness` - Stores department evaluation results with status, rating, issues, and suggestions

**New API Routes:**
- `GET /api/v1/project-readiness/{projectId}` - Get all department evaluations
- `POST /api/v1/project-readiness/{projectId}/evaluate` - Submit department evaluation
- `GET /api/v1/project-readiness/{projectId}/task/{taskId}/status` - Check task status
- `POST /api/v1/project-readiness/{projectId}/department/{departmentId}/sync` - Sync evaluation results
- `DELETE /api/v1/project-readiness/{projectId}/task/{taskId}/cancel` - Cancel evaluation
- `POST /api/webhooks/evaluation-complete` - Webhook for task completion
- `GET /api/v1/gather/{projectId}/count` - Get gather item count

**New UI Components:**
- `DepartmentCard.tsx` - Main card with collapsible results, threshold validation
- `AnimatedProgress.tsx` - Animated progress with elapsed time
- `ReadinessOverview.tsx` - Overall project readiness score display

**Key Features:**
- Sequential evaluation (departments 1→7 in strict order)
- Threshold gating (previous department must meet threshold)
- Department 1 always enabled to start the flow
- 30-second client-side polling for real-time updates
- Webhook callbacks for task completion notifications
- Comprehensive error handling and validation

**Department Integration:**
- Uses `codeDepNumber` field for sequential ordering
- Leverages `threshold` field for quality gating
- Integrates with gather databases (`aladdin-gather-{projectId}`)
- Filters gather data by department relevancy

**Documentation:**
- [Complete Specification](./idea/pages/project-readiness.md)
- [Environment Setup](./PROJECT_READINESS_ENV.md)
- [Implementation Guide](./PROJECT_READINESS_IMPLEMENTATION.md)
- [Department Process Flow](./DEPARTMENT_PROCESS_FLOW.md) - Updated with Project Readiness integration

**Files Created:** 18 new files, 2 modified, 3 documentation files

**Environment Variables Required:**
```bash
TASKS_FT_TC_API_URL=https://tasks.ft.tc
TASKS_FT_TC_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Migration Steps:**
1. Add environment variables to `.env`
2. Run `pnpm payload generate:types` to update TypeScript types
3. Run `pnpm db:seed` to ensure core departments exist
4. Verify navigation link appears in project sidebar
5. Test evaluation workflow on gather page

---

### ✅ Updated AI Models to Claude Sonnet 4.5 & Qwen (Latest)

**Date:** 2025-01-02

**Changes:**
- Updated all agent and department models to use OpenRouter configuration
- Replaced `anthropic/claude-3.5-sonnet` → `anthropic/claude-sonnet-4.5` (27 agents, 5 departments)
- Replaced `anthropic/claude-3-haiku` → `qwen/qwen3-vl-235b-a22b-thinking` (8 agents, 1 department)
- Updated all documentation to reflect new model names

**Purpose:**
- Align with current OpenRouter API model availability
- Use latest Claude Sonnet 4.5 for improved quality and performance
- Implement Qwen backup model for cost-effective operations
- Future-proof model configuration

**Files Modified:**
- `src/seed/departments.seed.ts` - Updated defaultModel for all departments
- `src/seed/agents.seed.ts` - Updated model for all 35 agents
- `docs/**/*.md` - Updated all documentation references

**Model Distribution:**
- **Primary Model**: `anthropic/claude-sonnet-4.5`
  - All department heads (6)
  - Most specialist agents (21)
  - Story, Character, Visual, Video, Audio departments

- **Backup Model**: `qwen/qwen3-vl-235b-a22b-thinking`
  - Production department (coordination tasks)
  - Post-production specialists (8 agents)
  - Lower-priority, cost-effective operations

**Environment Variables:**
```bash
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_BACKUP_MODEL=qwen/qwen3-vl-235b-a22b-thinking
OPENROUTER_VISION_MODE=google/gemini-2.5-flash
```

**Migration Steps:**
1. Run `npm run seed` to update existing agents/departments
2. Verify model configuration in PayloadCMS admin
3. Test agent execution with new models

---

### ✅ Added `gatherCheck` Field

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

