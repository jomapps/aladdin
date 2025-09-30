# Phase 6: Video Generation (Weeks 21-24)

**Goal**: Video generation with scene assembly

---

## Week 21-22: Video Generation Methods

### Task 6.1: Text-to-Video

**Files to Create**:
```
src/lib/fal/generateVideo.ts
app/api/v1/projects/[id]/videos/generate/route.ts
```

**Test**:
```typescript
test('generates video from text', async () => {
  const result = await generateVideo({
    method: 'text-to-video',
    prompt: 'Cyberpunk detective walks in rain',
    duration: 7,
  })
  
  expect(result.videoUrl).toBeDefined()
  expect(result.duration).toBeLessThanOrEqual(7)
})
```

### Task 6.2: Image-to-Video

**Test**:
```typescript
test('generates video from image', async () => {
  const result = await generateVideo({
    method: 'image-to-video',
    sourceImage: 'media_789',
    prompt: 'Character turns head',
    duration: 5,
  })
  
  expect(result.videoUrl).toBeDefined()
})
```

### Task 6.3: First-Last Frame

**Test**: Similar pattern

### Task 6.4: Composite-to-Video

**Test**:
```typescript
test('generates video from composite', async () => {
  const result = await generateVideo({
    method: 'composite-to-video',
    compositeImage: 'img_comp_001',
    action: 'Sarah walks forward',
  })
  
  expect(result.videoUrl).toBeDefined()
})
```

---

## Week 23-24: Scene Assembly

### Task 6.5: Multi-Clip Assembly

**Files to Create**:
```
src/lib/video/assembleScene.ts
```

**Test**:
```typescript
test('assembles 30s scene from 5 clips', async () => {
  const clips = [
    { duration: 7, url: 'clip1.mp4' },
    { duration: 7, url: 'clip2.mp4' },
    { duration: 7, url: 'clip3.mp4' },
    { duration: 7, url: 'clip4.mp4' },
    { duration: 2, url: 'clip5.mp4' },
  ]
  
  const result = await assembleScene({
    sceneId: 'scene_005',
    clips,
  })
  
  expect(result.duration).toBe(30)
  expect(result.videoUrl).toBeDefined()
})
```

---

## Phase 6 Verification

**Must Pass**:
- [ ] All 4 generation methods work
- [ ] Videos ≤ 7 seconds
- [ ] Scene assembly functional
- [ ] Videos stored in R2
- [ ] Quality verification works

**Milestone**: Generate complete 30s scene

---

**Next Phase**: [Phase 7 - Polish](./phase-7-polish.md)