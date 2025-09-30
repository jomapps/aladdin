# Phase 3: Brain Integration (Weeks 9-12)

**Goal**: Integrate existing Brain service and Celery-Redis task queue

**Note**: Brain and Celery-Redis are already implemented as external services. This phase focuses on integration.

---

## Week 9-10: Add Services as Submodules

### Task 3.1: Add Git Submodules

**Commands**:
```bash
# Add Brain service as submodule (mcp-brain-service)
git submodule add https://github.com/[your-org]/mcp-brain-service services/brain

# Add Celery-Redis task queue as submodule
git submodule add https://github.com/[your-org]/celery-redis services/task-queue

# Initialize
git submodule update --init --recursive
```

**Files to Create**:
```
docker-compose.yml (orchestrate all services)
src/lib/brain/client.ts (Brain API client)
src/lib/tasks/client.ts (Celery client)
```

**Test**:
```bash
# Test live Brain service
curl https://brain.ft.tc/health

# Test live Tasks service
curl https://tasks.ft.tc/health

# Or start local services with Docker
docker-compose up -d
curl http://localhost:8000/health
redis-cli ping
```

### Task 3.2: Integrate Brain Client

**Files to Create**:
```
src/lib/brain/client.ts
app/api/v1/projects/[id]/brain/validate/route.ts
```

**Implementation**:
```typescript
// src/lib/brain/client.ts
const BRAIN_API_URL = process.env.BRAIN_API_URL || 'http://localhost:8000'

export async function validateContent({
  projectId,
  type,
  data,
}: {
  projectId: string
  type: string
  data: any
}) {
  const response = await fetch(`${BRAIN_API_URL}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BRAIN_API_KEY}`,
    },
    body: JSON.stringify({ projectId, type, data }),
  })
  
  return response.json()
}
```

**Test**:
```typescript
test('validates via Brain service', async () => {
  const result = await validateContent({
    projectId: 'test',
    type: 'character',
    data: { name: 'Sarah', content: {} },
  })
  
  expect(result.qualityRating).toBeGreaterThan(0)
  expect(result.brainValidated).toBe(true)
})
```

---

## Week 11-12: Integration

### Task 3.3: PayloadCMS Hooks to Brain

**Files to Modify**:
```
src/collections/Projects.ts (add afterChange hook)
```

**Test**:
```typescript
test('project changes sent to Brain', async () => {
  const payload = await getPayloadHMR({ config: configPromise })
  
  const project = await payload.create({
    collection: 'projects',
    data: { name: 'Test', slug: 'test', owner: 'user_id' },
  })
  
  // Verify node in Neo4j
  const brain = await getBrainClient()
  const result = await brain.run(
    'MATCH (p:Project {id: $id}) RETURN p',
    { id: project.id }
  )
  
  expect(result.records.length).toBe(1)
})
```

### Task 3.4: MongoDB Change Streams with Celery

**Files to Create**:
```
src/lib/brain/changeStreams.ts
src/lib/tasks/client.ts
```

**Implementation**:
```typescript
// src/lib/tasks/client.ts
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.REDIS_URL,
})

export async function enqueueValidation(data: any) {
  await redis.connect()
  
  await redis.lpush('celery', JSON.stringify({
    task: 'brain.validate',
    args: [data],
  }))
  
  await redis.disconnect()
}

// src/lib/brain/changeStreams.ts
import { getOpenDatabase } from '@/lib/db/openDatabase'
import { enqueueValidation } from '@/lib/tasks/client'

export async function watchChanges(projectSlug: string) {
  const db = await getOpenDatabase(projectSlug)
  
  const changeStream = db.watch()
  
  changeStream.on('change', async (change) => {
    if (change.operationType === 'insert' || change.operationType === 'update') {
      // Enqueue for Brain validation via Celery
      await enqueueValidation({
        projectId: projectSlug,
        document: change.fullDocument,
      })
    }
  })
}
```

**Test**:
```typescript
test('change stream enqueues to Celery', async () => {
  const db = await getOpenDatabase('test-project')
  
  await db.collection('characters').insertOne({
    name: 'Sarah',
    projectId: 'proj_123',
  })
  
  // Verify task enqueued in Redis
  const redis = createClient({ url: process.env.REDIS_URL })
  await redis.connect()
  const taskCount = await redis.llen('celery')
  expect(taskCount).toBeGreaterThan(0)
})
```

---

## Phase 3 Verification

**Must Pass**:
- [ ] Git submodules added and initialized
- [ ] Docker Compose starts all services
- [ ] Brain service accessible via HTTP
- [ ] Redis accessible
- [ ] Brain client validates content
- [ ] Celery tasks enqueued
- [ ] PayloadCMS hooks send to Brain
- [ ] MongoDB change streams enqueue tasks
- [ ] All content validated by Brain service

**Milestone**: All content has quality scores from Brain

---

**Next Phase**: [Phase 4 - Multi-Department Agents](./phase-4-departments.md)