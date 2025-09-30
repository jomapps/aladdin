# Phase 1: Foundation (Weeks 1-4)

**Goal**: Establish Next.js + PayloadCMS + MongoDB foundation

---

## Week 1-2: Project Setup

### Task 1.1: Initialize Next.js Project ✓ (DONE)

**Status**: Already complete

**Verification**:
```bash
pnpm dev
# App should run on http://localhost:3000
```

### Task 1.2: Configure PayloadCMS Collections

**Description**: Create Projects, Episodes, Conversations, Workflows collections

**Files to Create**:
```
src/collections/Projects.ts
src/collections/Episodes.ts
src/collections/Conversations.ts
src/collections/Workflows.ts
```

**Implementation**:

1. **Projects Collection**:
```typescript
// src/collections/Projects.ts
import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Movie', value: 'movie' },
        { label: 'Series', value: 'series' },
      ],
    },
    {
      name: 'phase',
      type: 'select',
      options: [
        { label: 'Expansion', value: 'expansion' },
        { label: 'Compacting', value: 'compacting' },
        { label: 'Complete', value: 'complete' },
      ],
      defaultValue: 'expansion',
    },
    {
      name: 'openDatabaseName',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.openDatabaseName) {
          data.openDatabaseName = `open_${data.slug}`
        }
        return data
      },
    ],
  },
}
```

2. **Update payload.config.ts**:
```typescript
// src/payload.config.ts
import { Projects } from './collections/Projects'
import { Episodes } from './collections/Episodes'
import { Conversations } from './collections/Conversations'
import { Workflows } from './collections/Workflows'

export default buildConfig({
  collections: [
    Users,
    Media,
    Projects,
    Episodes,
    Conversations,
    Workflows,
  ],
  // ... rest of config
})
```

**Test**:
```typescript
// tests/int/collections.test.ts
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

describe('Collections', () => {
  let payload
  
  beforeAll(async () => {
    payload = await getPayloadHMR({ config: configPromise })
  })
  
  it('creates a project with auto-generated openDatabaseName', async () => {
    const project = await payload.create({
      collection: 'projects',
      data: {
        name: 'Test Project',
        slug: 'test-project',
        owner: 'user_id_here',
      },
    })
    
    expect(project.openDatabaseName).toBe('open_test-project')
  })
})
```

**Run Test**:
```bash
pnpm test:int
```

---

### Task 1.3: Cloudflare R2 Storage Integration

**Description**: Configure S3-compatible storage for Media uploads

**Installation**:
```bash
pnpm add @payloadcms/plugin-cloud-storage @payloadcms/storage-s3
```

**Environment Variables**:
```bash
# Add to .env
R2_ACCOUNT_ID=your_account_id
R2_BUCKET=aladdin-media
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

**Configuration**:
```typescript
// src/payload.config.ts
import { s3Storage } from '@payloadcms/storage-s3'

export default buildConfig({
  // ... existing config
  plugins: [
    s3Storage({
      collections: {
        'media': true,
      },
      bucket: process.env.R2_BUCKET!,
      config: {
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      },
    }),
  ],
})
```

**Test**:
```typescript
// tests/int/media-upload.test.ts
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import fs from 'fs'

describe('Media Upload', () => {
  it('uploads file to R2', async () => {
    const payload = await getPayloadHMR({ config: configPromise })
    
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Test image',
      },
      file: {
        data: fs.readFileSync('./test-files/sample.jpg'),
        mimetype: 'image/jpeg',
        name: 'sample.jpg',
        size: 1024,
      },
    })
    
    expect(media.url).toContain('r2.dev')
    expect(media.filename).toBe('sample.jpg')
  })
})
```

**Verification**:
1. Upload file via PayloadCMS admin panel
2. Check file appears in R2 bucket
3. Verify `media.url` is accessible

---

## Week 3-4: Database Architecture

### Task 1.4: Open MongoDB Connection Setup

**Description**: Create utility to connect to per-project open databases

**Files to Create**:
```
src/lib/db/openDatabase.ts
```

**Implementation**:
```typescript
// src/lib/db/openDatabase.ts
import { MongoClient } from 'mongodb'

const mongoClient = new MongoClient(process.env.DATABASE_URI_OPEN || 'mongodb://localhost:27017')

let isConnected = false

export async function getOpenDatabase(projectSlug: string) {
  if (!isConnected) {
    await mongoClient.connect()
    isConnected = true
  }
  
  const dbName = `open_${projectSlug}`
  return mongoClient.db(dbName)
}

export async function createCollection(
  projectSlug: string,
  collectionName: string
) {
  const db = await getOpenDatabase(projectSlug)
  
  // Create collection with validation
  await db.createCollection(collectionName, {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'projectId'],
        properties: {
          name: { bsonType: 'string' },
          projectId: { bsonType: 'string' },
        },
      },
    },
  })
  
  return db.collection(collectionName)
}
```

**Test**:
```typescript
// tests/int/open-database.test.ts
import { getOpenDatabase, createCollection } from '@/lib/db/openDatabase'

describe('Open Database', () => {
  const testSlug = 'test-project'
  
  it('creates project-specific database', async () => {
    const db = await getOpenDatabase(testSlug)
    expect(db.databaseName).toBe('open_test-project')
  })
  
  it('creates collection with validation', async () => {
    const collection = await createCollection(testSlug, 'characters')
    
    // Try to insert document without required fields
    await expect(
      collection.insertOne({ invalid: 'data' })
    ).rejects.toThrow()
    
    // Insert valid document
    const result = await collection.insertOne({
      name: 'Test Character',
      projectId: 'proj_123',
    })
    
    expect(result.acknowledged).toBe(true)
  })
})
```

**Run Test**:
```bash
pnpm test:int
```

---

### Task 1.5: Protected Routes

**Description**: Implement authentication check on dashboard routes

**Files to Modify**:
```
app/page.tsx
app/dashboard/layout.tsx
```

**Implementation**:

```typescript
// app/page.tsx
import { redirect } from 'next/navigation'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import LoginForm from './LoginForm'

export default async function HomePage() {
  const payload = await getPayloadHMR({ config: configPromise })
  const { user } = await payload.auth({ req })
  
  if (user) {
    redirect('/dashboard')
  }
  
  return (
    <main>
      <h1>Aladdin - AI Movie Production</h1>
      <LoginForm />
    </main>
  )
}
```

```typescript
// app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

export default async function DashboardLayout({ children }) {
  const payload = await getPayloadHMR({ config: configPromise })
  const { user } = await payload.auth({ req })
  
  if (!user) {
    redirect('/')
  }
  
  return (
    <div className="dashboard">
      <nav>{/* Navigation */}</nav>
      <main>{children}</main>
    </div>
  )
}
```

**Test**:
```typescript
// tests/e2e/auth.e2e.spec.ts
import { test, expect } from '@playwright/test'

test('redirects to dashboard when logged in', async ({ page }) => {
  // Login first
  await page.goto('/')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button[type="submit"]')
  
  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard')
})

test('redirects to homepage when not logged in', async ({ page }) => {
  await page.goto('/dashboard')
  
  // Should redirect to login
  await expect(page).toHaveURL('/')
})
```

**Run Test**:
```bash
pnpm test:e2e
```

---

## Phase 1 Verification Checklist

**Must Pass All**:
- [ ] `pnpm dev` starts server without errors
- [ ] Can create/login user via PayloadCMS admin
- [ ] Protected routes redirect when not logged in
- [ ] Can create project via admin panel
- [ ] Project gets auto-generated `openDatabaseName`
- [ ] Can upload file to Media collection
- [ ] Uploaded file accessible via `media.url` from R2
- [ ] All integration tests pass
- [ ] All E2E tests pass

**Verification Command**:
```bash
pnpm test
# All tests should pass
```

---

**Phase Status**: Ready for Implementation  
**Next Phase**: [Phase 2 - Chat & Agents](./phase-2-chat-agents.md)