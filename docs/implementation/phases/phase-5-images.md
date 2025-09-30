# Phase 5: Image Generation (Weeks 17-20)

**Goal**: Image Quality Department with 360° profile generation

---

## Week 17-18: Reference System

### Task 5.1: Master Reference Generator

**Files to Create**:
```
src/agents/specialists/master-reference-generator.ts
src/lib/fal/generateImage.ts
```

**Test**:
```typescript
test('generates master reference image', async () => {
  const result = await generateMasterReference({
    subjectType: 'character',
    subjectId: 'char_001',
    description: 'Cyberpunk detective Sarah',
  })
  
  expect(result.mediaId).toBeDefined()
  expect(result.url).toContain('r2.dev')
})
```

### Task 5.2: 360° Profile Creator

**Files to Create**:
```
src/agents/specialists/profile-360-creator.ts
```

**Test**:
```typescript
test('generates 360° profile (12 images)', async () => {
  const result = await generate360Profile({
    masterReferenceId: 'media_789',
    subjectId: 'char_001',
  })
  
  expect(result.images).toHaveLength(12)
  result.images.forEach((img, i) => {
    expect(img.angle).toBe(i * 30)
  })
})
```

---

## Week 19-20: Shot Composition

### Task 5.3: Composite Shot Generation

**Files to Create**:
```
src/agents/specialists/shot-composer.ts
app/api/v1/projects/[id]/images/generate/composite/route.ts
```

**Test**:
```typescript
test('generates composite shot', async () => {
  const result = await generateCompositeShot({
    description: 'Sarah in orange jacket in park',
    references: {
      character: 'ref_sarah_001',
      clothing: ['ref_jacket_001'],
      location: 'ref_park_001',
    },
  })
  
  expect(result.imageUrl).toBeDefined()
  expect(result.consistencyScore).toBeGreaterThan(0.7)
})
```

### Task 5.4: Consistency Verifier

**Files to Create**:
```
src/agents/specialists/consistency-verifier.ts
```

**Test**:
```typescript
test('verifies image consistency', async () => {
  const result = await verifyConsistency({
    newImageId: 'img_new_001',
    referenceSetId: 'ref_sarah_001',
  })
  
  expect(result.overallConsistency).toBeGreaterThan(0)
  expect(result.passed).toBe(true)
})
```

---

## Phase 5 Verification

**Must Pass**:
- [ ] Master reference generation works
- [ ] 360° profiles (12 images) generated
- [ ] Composite shots using references
- [ ] Consistency verification functional
- [ ] All images stored in R2

**Milestone**: Generate character with 360° profile

---
**Next Phase**: [Phase 6 - Video Generation](./phase-6-videos.md)