# Phase 2: Chat Interface & Basic Agents (Weeks 5-8)

**Goal**: Working chat interface with Master Orchestrator and first department head

---

## Week 5-6: Chat UI

### Task 2.1: Chat Interface Components

**Files to Create**:
```
app/dashboard/project/[id]/chat/page.tsx (Server Component)
app/dashboard/project/[id]/chat/ChatInterface.tsx (Client Component)
app/dashboard/project/[id]/chat/MessageList.tsx
app/dashboard/project/[id]/chat/ContentCard.tsx
```

**Implementation**: See technical docs

**Test**:
```typescript
test('renders chat interface', async ({ page }) => {
  await page.goto('/dashboard/project/test-id/chat')
  await expect(page.locator('textarea')).toBeVisible()
})
```

### Task 2.2: WebSocket Connection

**Files to Create**:
```
app/api/v1/ws/route.ts
src/lib/websocket/server.ts
```

**Test**:
```typescript
test('WebSocket connection established', async () => {
  const ws = new WebSocket('ws://localhost:3000/api/v1/ws')
  await expect(new Promise(resolve => ws.onopen = resolve)).resolves.toBeDefined()
})
```

---

## Week 7-8: Agent Integration

### Task 2.3: Master Orchestrator Agent

**Files to Create**:
```
src/agents/master-orchestrator.ts
src/agents/tools/routeToDepartment.ts
```

**Test**:
```typescript
test('Master Orchestrator routes to Character dept', async () => {
  const result = await runAgent({
    agentId: 'master-orchestrator',
    prompt: 'Create character Sarah',
  })
  
  expect(result.departments).toContain('character')
})
```

### Task 2.4: Character Department Head

**Files to Create**:
```
src/agents/departments/character-head.ts
src/agents/specialists/character-creator.ts
```

**Test**:
```typescript
test('Creates character via chat', async () => {
  const result = await sendMessage({
    conversationId: 'conv_123',
    content: 'Create detective character Sarah',
  })
  
  // Verify character created in open DB
  const db = await getOpenDatabase('test-project')
  const character = await db.collection('characters').findOne({ name: 'Sarah' })
  
  expect(character).toBeDefined()
  expect(character.brainValidated).toBe(true)
})
```

---

## Phase 2 Verification

**Must Pass**:
- [ ] Chat interface loads
- [ ] Can send messages
- [ ] WebSocket receives real-time updates
- [ ] Master Orchestrator spawns
- [ ] Character Department Head spawns
- [ ] Character created in open MongoDB
- [ ] Integration tests pass

**Milestone**: User creates character profile via chat

---

**Next Phase**: [Phase 3 - Brain Integration](./phase-3-brain.md)