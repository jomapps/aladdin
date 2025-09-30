# Phase 8: Advanced Features (Weeks 29-32)

**Goal**: Content cloning, collaboration, and export

---

## Week 29-30: Content Cloning

### Task 8.1: Clone Between Projects

**Files to Create**:
```
app/api/v1/projects/[id]/clone/route.ts
src/lib/clone/cloneContent.ts
```

**Test**:
```typescript
test('clones character to new project', async () => {
  const result = await cloneContent({
    sourceProjectId: 'proj_a',
    targetProjectId: 'proj_b',
    contentType: 'character',
    documentId: 'char_001',
  })
  
  expect(result.newId).toBeDefined()
  expect(result.clonedFrom.projectId).toBe('proj_a')
  
  // Verify independent
  const sourceDb = await getOpenDatabase('proj-a')
  const targetDb = await getOpenDatabase('proj-b')
  
  const source = await sourceDb.collection('characters').findOne({ _id: 'char_001' })
  const cloned = await targetDb.collection('characters').findOne({ _id: result.newId })
  
  expect(cloned._id).not.toBe(source._id)
})
```

---

## Week 31-32: Export & Collaboration

### Task 8.2: Video Export

**Files to Create**:
```
app/api/v1/projects/[id]/export/route.ts
```

**Test**:
```typescript
test('exports project as video file', async () => {
  const result = await exportProject({
    projectId: 'proj_123',
    format: 'mp4',
  })
  
  expect(result.downloadUrl).toBeDefined()
})
```

### Task 8.3: Team Collaboration

**Files to Modify**:
```
src/collections/Projects.ts (add team field)
```

**Test**:
```typescript
test('adds team member to project', async () => {
  const payload = await getPayloadHMR({ config: configPromise })
  
  await payload.update({
    collection: 'projects',
    id: 'proj_123',
    data: {
      team: [
        { user: 'user_456', role: 'editor' },
      ],
    },
  })
  
  const project = await payload.findByID({
    collection: 'projects',
    id: 'proj_123',
  })
  
  expect(project.team).toHaveLength(1)
})
```

---

## Phase 8 Verification

**Must Pass**:
- [ ] Content cloning works
- [ ] Projects remain isolated
- [ ] Export to video functional
- [ ] Team collaboration enabled
- [ ] All features integrated

**Milestone**: Complete end-to-end pipeline ✓

---

**Status**: All Phases Complete - Ready for Production! 🚀