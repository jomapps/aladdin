# Department Process Flow

**Date**: January 2025  
**Status**: ✅ **COMPLETE** - Process flow order defined

---

## Overview

The Aladdin movie production system follows a structured 7-step process flow, with each core department assigned a specific `codeDepNumber` that determines its execution order in the production pipeline.

---

## Process Flow Order

```
Story (1) → Character (2) → Visual (3) → Image Quality (4) → Video (5) → Audio (6) → Production (7)
```

---

## Department Process Steps

| Step | Department | codeDepNumber | gatherCheck | Description |
|------|------------|---------------|-------------|-------------|
| **1** | **Story** | 1 | ✅ true | Narrative development, plot structure, themes |
| **2** | **Character** | 2 | ✅ true | Character profiles, arcs, relationships |
| **3** | **Visual** | 3 | ✅ true | Art direction, cinematography, composition |
| **4** | **Image Quality** | 4 | ✅ true | Visual consistency, master references, quality control |
| **5** | **Video** | 5 | ✅ true | Video editing, VFX, post-production |
| **6** | **Audio** | 6 | ✅ true | Sound design, music, dialogue mixing |
| **7** | **Production** | 7 | ✅ true | Project management, coordination, delivery |

**Note**: The `codeDepNumber` field replaces the old `priority` field. They were redundant and served the same purpose.

---

## Field Definitions

### **codeDepNumber**
- **Type**: Number (0-100)
- **Default**: 0 (not in process flow)
- **Purpose**: Defines the step number in the production process flow
- **Core Departments**: 1-7 (Story through Production)
- **Non-Core Departments**: 0 (not part of main flow)

### **gatherCheck**
- **Type**: Boolean
- **Default**: false
- **Purpose**: Enables gather check for department coordination
- **Core Departments**: true (all 7 core departments)
- **Non-Core Departments**: false

### **coreDepartment**
- **Type**: Boolean
- **Default**: false
- **Purpose**: Marks department as core (cannot be deleted)
- **Core Departments**: true (all 7 core departments)
- **Non-Core Departments**: false

---

## Process Flow Details

### **Step 1: Story Department** (codeDepNumber: 1)
**Purpose**: Foundation of the production
- Develops narrative structure and plot
- Creates story arcs and themes
- Establishes world and setting
- Defines pacing and rhythm

**Output**: Story documents, plot structure, episode outlines

---

### **Step 2: Character Department** (codeDepNumber: 2)
**Purpose**: Brings characters to life
- Creates character profiles and psychology
- Develops character arcs and relationships
- Designs costumes, makeup, and voice profiles
- Establishes character consistency

**Output**: Character profiles, relationship maps, visual designs

---

### **Step 3: Visual Department** (codeDepNumber: 3)
**Purpose**: Defines visual style and aesthetics
- Creates art direction and visual style guide
- Designs cinematography and lighting
- Develops color palettes and composition
- Plans camera angles and movements

**Output**: Visual style guide, storyboards, shot descriptions

---

### **Step 4: Image Quality Department** (codeDepNumber: 4)
**Purpose**: Ensures visual consistency and quality
- Generates master reference images
- Creates 360° character profiles
- Verifies image consistency across scenes
- Maintains quality standards

**Output**: Master references, consistency reports, quality metrics

---

### **Step 5: Video Department** (codeDepNumber: 5)
**Purpose**: Assembles and edits video content
- Edits scenes and sequences
- Integrates VFX and transitions
- Manages pacing and timing
- Coordinates post-production

**Output**: Edited video sequences, VFX integration, final cuts

---

### **Step 6: Audio Department** (codeDepNumber: 6)
**Purpose**: Creates immersive audio experience
- Designs sound effects and ambience
- Composes music and score
- Mixes dialogue and voice
- Creates foley and audio layers

**Output**: Audio tracks, music, sound effects, mixed audio

---

### **Step 7: Production Department** (codeDepNumber: 7)
**Purpose**: Coordinates and delivers final product
- Manages project timeline and resources
- Coordinates cross-department workflow
- Tracks budget and quality
- Delivers final product

**Output**: Project reports, delivery packages, final assets

---

## Gather Check System

All core departments have `gatherCheck: true`, which enables:
- **Pre-execution validation**: Checks if previous steps are complete
- **Data gathering**: Collects outputs from previous departments
- **Context building**: Builds comprehensive context for current step
- **Quality gates**: Ensures quality standards before proceeding

### Gather Check Flow
```
Story (gather: ✅) 
  ↓ [Story complete?]
Character (gather: ✅)
  ↓ [Story + Character complete?]
Visual (gather: ✅)
  ↓ [Story + Character + Visual complete?]
Image Quality (gather: ✅)
  ↓ [All previous complete?]
Video (gather: ✅)
  ↓ [All previous complete?]
Audio (gather: ✅)
  ↓ [All previous complete?]
Production (gather: ✅)
  ↓ [All complete?]
Final Delivery
```

---

## Schema Definition

### Collection: `departments`

```typescript
{
  codeDepNumber: {
    type: 'number',
    required: true,
    label: 'Department Process Step Number',
    defaultValue: 0,
    min: 0,
    max: 100,
    admin: {
      description: 'Process flow step number (0=not in flow, 1=Story, 2=Character, 3=Visual, 4=Image Quality, 5=Video, 6=Audio, 7=Production)'
    }
  },
  gatherCheck: {
    type: 'checkbox',
    label: 'Gather Check',
    defaultValue: false,
    admin: {
      description: 'Enable gather check for this department (true for all core departments)'
    }
  },
  coreDepartment: {
    type: 'checkbox',
    label: 'Core Department',
    defaultValue: false,
    admin: {
      description: 'Core departments cannot be deleted (Story, Character, Visual, Video, Audio, Production, Image Quality)',
      readOnly: true
    }
  }
}
```

---

## Seed Data

All 7 core departments are seeded with correct `codeDepNumber` and `gatherCheck` values:

```typescript
// src/seed/departments.seed.ts
export const departmentsSeedData = [
  { slug: 'story', codeDepNumber: 1, gatherCheck: true, coreDepartment: true },
  { slug: 'character', codeDepNumber: 2, gatherCheck: true, coreDepartment: true },
  { slug: 'visual', codeDepNumber: 3, gatherCheck: true, coreDepartment: true },
  { slug: 'image-quality', codeDepNumber: 4, gatherCheck: true, coreDepartment: true },
  { slug: 'video', codeDepNumber: 5, gatherCheck: true, coreDepartment: true },
  { slug: 'audio', codeDepNumber: 6, gatherCheck: true, coreDepartment: true },
  { slug: 'production', codeDepNumber: 7, gatherCheck: true, coreDepartment: true },
]
```

---

## Usage Examples

### Query Departments by Process Order
```typescript
// Get departments in process flow order
const departments = await payload.find({
  collection: 'departments',
  where: {
    codeDepNumber: {
      greater_than: 0
    }
  },
  sort: 'codeDepNumber'
})

// Result: [Story, Character, Visual, Image Quality, Video, Audio, Production]
```

### Check if Department Requires Gather Check
```typescript
const department = await payload.findByID({
  collection: 'departments',
  id: departmentId
})

if (department.gatherCheck) {
  // Gather data from previous departments
  const previousDepts = await payload.find({
    collection: 'departments',
    where: {
      codeDepNumber: {
        less_than: department.codeDepNumber
      }
    },
    sort: 'codeDepNumber'
  })
  
  // Validate all previous steps are complete
  // Gather outputs from previous departments
  // Build context for current department
}
```

### Get Next Department in Flow
```typescript
const currentDept = await payload.findByID({
  collection: 'departments',
  id: currentDeptId
})

const nextDept = await payload.find({
  collection: 'departments',
  where: {
    codeDepNumber: {
      equals: currentDept.codeDepNumber + 1
    }
  },
  limit: 1
})
```

---

## Implementation Status

- ✅ Schema updated with `codeDepNumber` field
- ✅ Seed data updated with correct values
- ✅ All core departments have `gatherCheck: true`
- ✅ Process flow order defined (1-7)
- ✅ Documentation complete

---

## Related Files

- **Schema**: `src/collections/Departments.ts`
- **Seed Data**: `src/seed/departments.seed.ts`
- **Agent System**: `docs/idea/AI_AGENT_SYSTEM.md`
- **Agent Implementation**: `docs/AGENT_IMPLEMENTATION_STATUS.md`

---

## Next Steps

1. ⏳ Implement gather check logic in department execution
2. ⏳ Create process flow visualization in UI
3. ⏳ Add progress tracking across departments
4. ⏳ Implement quality gates between steps
5. ⏳ Add department dependency validation

