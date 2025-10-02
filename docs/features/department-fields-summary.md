# Department Fields Summary

## Overview

This document provides a comprehensive overview of all fields in the Departments collection, with special focus on the recently added `coreDepartment` and `gatherCheck` fields.

## Complete Field List

### Identity Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ Yes | Auto-generated unique identifier |
| `slug` | text | ✅ Yes | Unique slug (e.g., "story", "character") |
| `name` | text | ✅ Yes | Display name (e.g., "Story Department") |
| `description` | textarea | ✅ Yes | Purpose and responsibilities |

### Visual Identity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `icon` | text | ❌ No | Emoji or icon identifier (e.g., "📖") |
| `color` | text | ❌ No | Hex color for UI (e.g., "#8B5CF6") |

### Execution & Status

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `priority` | number | ✅ Yes | 5 | Execution order (1-10, lower = higher priority) |
| `isActive` | checkbox | ❌ No | `true` | Whether department is active |
| `coreDepartment` | checkbox | ❌ No | `false` | **Core departments cannot be deleted** |
| `gatherCheck` | checkbox | ❌ No | `false` | **Enable gather check for this department** |

### AI Model Configuration

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `defaultModel` | text | ❌ No | `anthropic/claude-sonnet-4.5` | Default AI model for agents |
| `maxAgentSteps` | number | ❌ No | 20 | Maximum steps for agent execution |

### Coordination Settings (Group)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `allowParallelExecution` | checkbox | `true` | Allow specialists to run in parallel |
| `requiresDepartmentHeadReview` | checkbox | `true` | All outputs must be reviewed by department head |
| `minQualityThreshold` | number | 80 | Minimum quality score (0-100) for approval |
| `maxRetries` | number | 3 | Maximum retry attempts for failed executions |

### Performance Metrics (Group - Read-Only)

| Field | Type | Description |
|-------|------|-------------|
| `totalExecutions` | number | Total number of executions |
| `successfulExecutions` | number | Number of successful executions |
| `averageQualityScore` | number | Average quality score (0-100) |
| `averageExecutionTime` | number | Average execution time in milliseconds |

### Timestamps (Auto-Generated)

| Field | Type | Description |
|-------|------|-------------|
| `createdAt` | date | Timestamp when department was created |
| `updatedAt` | date | Timestamp when department was last updated |

## Special Fields Deep Dive

### 1. coreDepartment (Protection Field)

**Purpose:** Prevents deletion of essential system departments

**Characteristics:**
- ✅ Default: `false`
- 🔒 Read-only in admin UI
- 🛡️ Blocks delete operations when `true`
- 📌 Set to `true` for 6 core departments

**Core Departments:**
1. Story Department (`story`)
2. Character Department (`character`)
3. Visual Department (`visual`)
4. Video Department (`video`)
5. Audio Department (`audio`)
6. Production Department (`production`)

**Access Control:**
```typescript
delete: ({ req, data }) => {
  if (data?.coreDepartment === true) {
    return false // Prevent deletion
  }
  return true
}
```

**Documentation:** See [core-departments-protection.md](./core-departments-protection.md)

### 2. gatherCheck (Workflow Flag)

**Purpose:** Marks departments for gathering/collection operations

**Characteristics:**
- ✅ Default: `false`
- ✏️ Fully editable in admin UI
- 🔄 Can be toggled at any time
- 🎯 Used for workflow automation

**Use Cases:**
- Data collection workflows
- Reporting & analytics
- Workflow automation
- Quality assurance
- Integration points

**Example Usage:**
```typescript
// Find departments with gather check enabled
const gatherDepartments = await payload.find({
  collection: 'departments',
  where: {
    gatherCheck: { equals: true },
  },
})
```

**Documentation:** See [department-gather-check.md](./department-gather-check.md)

## Field Combinations

### Common Patterns

**1. Core Active Department:**
```typescript
{
  slug: 'story',
  isActive: true,
  coreDepartment: true,
  gatherCheck: false,
}
```

**2. Custom Department with Gathering:**
```typescript
{
  slug: 'marketing',
  isActive: true,
  coreDepartment: false,
  gatherCheck: true,
}
```

**3. Inactive Core Department:**
```typescript
{
  slug: 'audio',
  isActive: false,      // Temporarily disabled
  coreDepartment: true, // Still protected from deletion
  gatherCheck: false,
}
```

**4. Custom Department (Deletable):**
```typescript
{
  slug: 'research',
  isActive: true,
  coreDepartment: false, // Can be deleted
  gatherCheck: false,
}
```

## Query Examples

### Find Active Core Departments

```typescript
const activeCoreDeparts = await payload.find({
  collection: 'departments',
  where: {
    and: [
      { isActive: { equals: true } },
      { coreDepartment: { equals: true } },
    ],
  },
})
```

### Find Departments with Gather Check

```typescript
const gatherDepartments = await payload.find({
  collection: 'departments',
  where: {
    and: [
      { isActive: { equals: true } },
      { gatherCheck: { equals: true } },
    ],
  },
})
```

### Find Custom (Deletable) Departments

```typescript
const customDepartments = await payload.find({
  collection: 'departments',
  where: {
    coreDepartment: { equals: false },
  },
})
```

### Find Departments by Process Flow Order

```typescript
const earlyProcessDepts = await payload.find({
  collection: 'departments',
  where: {
    and: [
      { isActive: { equals: true } },
      { codeDepNumber: { less_than_equal: 3 } },
    ],
  },
  sort: 'codeDepNumber',
})
```

## Field Validation Rules

### Slug Validation

```typescript
validate: (value) => {
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    return 'Slug must start with lowercase letter and contain only lowercase letters, numbers, and hyphens'
  }
  return true
}
```

### Color Validation

```typescript
validate: (value) => {
  if (value && !/^#[0-9A-F]{6}$/i.test(value)) {
    return 'Color must be a valid hex color (e.g., #8B5CF6)'
  }
  return true
}
```

### Priority Range

- **Min:** 1
- **Max:** 10
- **Default:** 5

### Max Agent Steps Range

- **Min:** 1
- **Max:** 100
- **Default:** 20

## Admin UI Behavior

### Editable Fields

✅ **Can be edited by users:**
- `name`, `description`
- `icon`, `color`
- `priority`
- `isActive`
- `gatherCheck` ← Fully editable
- `defaultModel`, `maxAgentSteps`
- All coordination settings

### Read-Only Fields

🔒 **Cannot be edited by users:**
- `id` (auto-generated)
- `slug` (unique identifier)
- `coreDepartment` ← Read-only
- All performance metrics
- `createdAt`, `updatedAt` (auto-managed)

## TypeScript Interface

```typescript
export interface Department {
  id: string
  slug: string
  name: string
  description: string
  icon?: string | null
  color?: string | null
  codeDepNumber: number
  isActive?: boolean | null
  coreDepartment?: boolean | null
  gatherCheck?: boolean | null
  defaultModel?: string | null
  maxAgentSteps?: number | null
  coordinationSettings?: {
    allowParallelExecution?: boolean | null
    requiresDepartmentHeadReview?: boolean | null
    minQualityThreshold?: number | null
    maxRetries?: number | null
  }
  performance?: {
    totalExecutions?: number | null
    successfulExecutions?: number | null
    averageQualityScore?: number | null
    averageExecutionTime?: number | null
  }
  updatedAt: string
  createdAt: string
}
```

## Best Practices

1. **Core Departments:** Never attempt to delete core departments
2. **Gather Check:** Use consistently across your application
3. **Priority:** Keep priorities unique for clear execution order
4. **Active Status:** Use `isActive` to temporarily disable departments
5. **Performance Metrics:** Monitor regularly for optimization opportunities
6. **Coordination Settings:** Adjust based on department complexity
7. **Model Selection:** Choose appropriate AI models for department needs

## Related Documentation

- [Core Departments Protection](./core-departments-protection.md)
- [Department Gather Check](./department-gather-check.md)
- [Dynamic Agents Architecture](../architecture/dynamic-agents-architecture.md)

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Complete Reference

