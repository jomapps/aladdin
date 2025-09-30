# Phase 4: Multi-Department Agents (Weeks 13-16)

**Goal**: All department heads and 20+ specialists operational

---

## Week 13-14: Department Heads

### Task 4.1: Story Department Head

**Files to Create**:
```
src/agents/departments/story-head.ts
src/agents/specialists/story-architect.ts
src/agents/specialists/episode-planner.ts
```

**Test**:
```typescript
test('Story Department creates narrative structure', async () => {
  const result = await runDepartmentHead({
    department: 'story',
    instructions: 'Create story structure for cyberpunk series',
  })
  
  expect(result.outputs).toHaveLength(2) // From 2 specialists
  expect(result.departmentQuality).toBeGreaterThan(0.7)
})
```

### Task 4.2: Visual Department Head

**Files to Create**:
```
src/agents/departments/visual-head.ts
src/agents/departments/image-quality-head.ts
```

**Test**: Similar pattern

### Task 4.3: Audio Department Head

**Files to Create**:
```
src/agents/departments/audio-head.ts
```

---

## Week 15-16: Specialists

### Task 4.4: Character Specialists (10+)

**Files to Create**:
```
src/agents/specialists/hair-stylist.ts
src/agents/specialists/costume-designer.ts
src/agents/specialists/makeup-artist.ts
src/agents/specialists/voice-profile-creator.ts
```

**Test**:
```typescript
test('Hair Stylist specialist generates hairstyle', async () => {
  const result = await runSpecialist({
    specialistId: 'hair-stylist',
    instructions: 'Design hairstyle for cyberpunk detective',
  })
  
  expect(result.output.hairstyle).toBeDefined()
  expect(result.confidence).toBeGreaterThan(0.5)
})
```

### Task 4.5: Department Grading System

**Files to Create**:
```
src/lib/agents/grading.ts
```

**Test**:
```typescript
test('Department head grades specialist output', async () => {
  const output = { /* specialist output */ }
  
  const grade = await gradeOutput({
    departmentName: 'character',
    specialistOutput: output,
  })
  
  expect(grade.qualityScore).toBeDefined()
  expect(grade.decision).toMatch(/accept|revise|discard/)
})
```

---

## Phase 4 Verification

**Must Pass**:
- [ ] All 5-7 department heads operational
- [ ] 20+ specialists working
- [ ] Department grading functional
- [ ] Parallel specialist execution
- [ ] Character + story workflow complete

**Milestone**: Create character with story via chat

---

**Next Phase**: [Phase 5 - Image Generation](./phase-5-images.md)