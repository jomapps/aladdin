# Migration: Removed `priority` Field, Using `codeDepNumber` Only

**Date**: January 2025  
**Status**: ✅ **COMPLETE**

---

## Summary

Removed the redundant `priority` field from the Departments collection. The `codeDepNumber` field now serves as the single source of truth for department execution order.

---

## Problem

The Departments collection had two fields serving the same purpose:
- **`priority`**: Execution order (1-10, lower = higher priority)
- **`codeDepNumber`**: Process flow step number (1-7 for core departments)

Both fields had identical values and were used for the same purpose - defining the execution order of departments in the production pipeline.

---

## Solution

**Removed `priority` field entirely** and use only `codeDepNumber` for:
- Process flow ordering
- Department execution sequence
- UI display order
- Query sorting

---

## Changes Made

### **1. Collection Schema** ✅
**File**: `src/collections/Departments.ts`

**Before**:
```typescript
{
  name: 'priority',
  type: 'number',
  required: true,
  label: 'Execution Priority',
  defaultValue: 5,
  min: 1,
  max: 10,
}
{
  name: 'codeDepNumber',
  type: 'number',
  required: true,
  label: 'Department Process Step Number',
  defaultValue: 0,
  min: 0,
  max: 100,
}
```

**After**:
```typescript
{
  name: 'codeDepNumber',
  type: 'number',
  required: true,
  label: 'Process Flow Order',
  defaultValue: 0,
  min: 0,
  max: 100,
  admin: {
    description: 'Process flow step number (0=not in flow, 1-7=core departments)'
  }
}
```

**Admin UI**:
- Changed `defaultColumns` from `['name', 'slug', 'priority', 'isActive']`
- To `['name', 'slug', 'codeDepNumber', 'isActive']`

---

### **2. Seed Data** ✅
**File**: `src/seed/departments.seed.ts`

Removed `priority` field from all 7 department entries:

**Before**:
```typescript
{
  slug: 'story',
  name: 'Story Department',
  priority: 1,
  codeDepNumber: 1,
  // ...
}
```

**After**:
```typescript
{
  slug: 'story',
  name: 'Story Department',
  codeDepNumber: 1,
  // ...
}
```

---

### **3. TypeScript Types** ✅
**File**: `src/payload-types.ts`

Regenerated types using `pnpm payload generate:types`

**Before**:
```typescript
export interface Department {
  priority: number;
  codeDepNumber: number;
  // ...
}
```

**After**:
```typescript
export interface Department {
  codeDepNumber: number;
  // ...
}
```

---

### **4. Component Updates** ✅

#### **DepartmentDashboard.tsx**
```typescript
// Before
interface Department {
  priority: number
}

// After
interface Department {
  codeDepNumber: number
}
```

---

### **5. API Route Updates** ✅

#### **quality/metrics/route.ts**
```typescript
// Before
const departmentsResult = await payload.find({
  collection: 'departments',
  sort: 'priority',
})

// After
const departmentsResult = await payload.find({
  collection: 'departments',
  sort: 'codeDepNumber',
})
```

---

### **6. Documentation Updates** ✅

Updated all documentation files:
- ✅ `docs/DEPARTMENT_PROCESS_FLOW.md`
- ✅ `docs/features/department-fields-summary.md`
- ✅ `docs/features/core-departments-protection.md`
- ✅ `docs/research/dynamic-agents-research.md`

---

## Migration Guide

### **For Existing Databases**

If you have an existing database with the `priority` field:

#### **Option 1: Clean Migration (Recommended)**
```bash
# 1. Backup existing data
pnpm db:backup

# 2. Clean database
pnpm db:clean

# 3. Re-seed with new schema
pnpm db:seed
```

#### **Option 2: Manual Migration**
```typescript
// 1. Copy priority values to codeDepNumber
const departments = await payload.find({
  collection: 'departments',
  limit: 1000,
})

for (const dept of departments.docs) {
  await payload.update({
    collection: 'departments',
    id: dept.id,
    data: {
      codeDepNumber: dept.priority || 0,
    },
  })
}

// 2. Regenerate types
// Run: pnpm payload generate:types

// 3. The priority field will be ignored (no longer in schema)
```

---

## Query Pattern Changes

### **Before** (using `priority`)
```typescript
// Sort by priority
const departments = await payload.find({
  collection: 'departments',
  sort: 'priority',
})

// Filter by priority
const highPriority = await payload.find({
  collection: 'departments',
  where: {
    priority: { less_than_equal: 3 }
  },
})
```

### **After** (using `codeDepNumber`)
```typescript
// Sort by process flow order
const departments = await payload.find({
  collection: 'departments',
  sort: 'codeDepNumber',
})

// Filter by process flow order
const earlyProcess = await payload.find({
  collection: 'departments',
  where: {
    codeDepNumber: { less_than_equal: 3 }
  },
})
```

---

## Benefits

1. **Eliminates Redundancy**: Single field for execution order
2. **Clearer Semantics**: `codeDepNumber` explicitly indicates process flow step
3. **Simpler Schema**: Fewer fields to maintain
4. **Consistent Naming**: Aligns with process flow terminology
5. **Reduced Confusion**: No ambiguity about which field to use

---

## Breaking Changes

### **TypeScript Types**
- `Department.priority` no longer exists
- Use `Department.codeDepNumber` instead

### **Database Queries**
- Cannot sort by `priority` field
- Use `codeDepNumber` for sorting

### **Seed Data**
- `priority` field removed from all seed data
- Only `codeDepNumber` is used

---

## Verification

### **Check Schema**
```bash
# Verify collection schema
cat src/collections/Departments.ts | grep -A 10 "codeDepNumber"
```

### **Check Types**
```bash
# Verify generated types
cat src/payload-types.ts | grep -A 5 "interface Department"
```

### **Check Seed Data**
```bash
# Verify seed data has no priority field
cat src/seed/departments.seed.ts | grep "priority"
# Should return nothing
```

### **Test Database**
```bash
# Clean and re-seed
pnpm db:clean
pnpm db:seed

# Verify departments created correctly
# Check PayloadCMS admin UI at http://localhost:3010/admin
```

---

## Files Modified

### **Schema & Types**
- ✅ `src/collections/Departments.ts`
- ✅ `src/payload-types.ts` (regenerated)

### **Seed Data**
- ✅ `src/seed/departments.seed.ts`

### **Components**
- ✅ `src/components/agents/DepartmentDashboard.tsx`

### **API Routes**
- ✅ `src/app/api/v1/projects/[id]/quality/metrics/route.ts`

### **Documentation**
- ✅ `docs/DEPARTMENT_PROCESS_FLOW.md`
- ✅ `docs/features/department-fields-summary.md`
- ✅ `docs/features/core-departments-protection.md`
- ✅ `docs/research/dynamic-agents-research.md`
- ✅ `docs/PRIORITY_TO_CODEDEPNUMBER_MIGRATION.md` (new)

---

## Related Documentation

- **Process Flow**: `docs/DEPARTMENT_PROCESS_FLOW.md`
- **Field Summary**: `docs/features/department-fields-summary.md`
- **Core Protection**: `docs/features/core-departments-protection.md`

---

## Notes

- The `priority` field in `src/lib/agents/scheduler.ts` refers to **task priority** (critical/high/medium/low), not department priority. This is a different concept and was not changed.
- The `priority` field in `src/agents/tools/routeToDepartment.ts` also refers to **task priority**, not department priority.

---

## Status

✅ **COMPLETE** - All changes implemented and tested
- Schema updated
- Seed data updated
- Types regenerated
- Components updated
- API routes updated
- Documentation updated

