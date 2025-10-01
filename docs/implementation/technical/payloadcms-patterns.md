# PayloadCMS Technical Patterns

**Version**: 1.0.0  
**Last Updated**: January 28, 2025

---

## 1. Collection Import Pattern

### Recommended Structure

```
src/
├── collections/
│   ├── Projects.ts
│   ├── Users.ts
│   ├── Media.ts
│   ├── Conversations.ts
│   └── index.ts (optional)
└── payload.config.ts
```

### Collection Definition

**Individual Collection File**:
```typescript
// src/collections/Projects.ts
import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
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
  ],
}
```

### Import in Config

**Main Configuration File**:
```typescript
// src/payload.config.ts
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

// Import collections
import { Users } from './collections/Users'
import { Projects } from './collections/Projects'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Projects,
    Media,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
})
```

**CRITICAL**: Use `type` import for `CollectionConfig` to avoid runtime issues.

---

## 2. Config Import and Payload Instantiation

### Pattern 1: Server Components (Next.js App Router)

**CORRECT (PayloadCMS v3)**: Use `getPayload` from 'payload'

```typescript
// app/dashboard/projects/page.tsx
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function ProjectsPage() {
  const payload = await getPayload({ config: await configPromise })

  const projects = await payload.find({
    collection: 'projects',
    limit: 20,
  })

  return <div>{/* Render projects */}</div>
}
```

### Pattern 2: API Routes

```typescript
// app/api/v1/projects/route.ts
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config: await configPromise })

  const projects = await payload.find({
    collection: 'projects',
  })

  return NextResponse.json(projects)
}
```

### ⚠️ DEPRECATED: Do NOT use `getPayloadHMR`

```typescript
// ❌ WRONG - This is deprecated in PayloadCMS v3
import { getPayloadHMR } from '@payloadcms/next/utilities'
const payload = await getPayloadHMR({ config: configPromise })

// ✅ CORRECT - Use this instead
import { getPayload } from 'payload'
const payload = await getPayload({ config: await configPromise })
```

### Pattern 3: Using `onInit` Hook

```typescript
// src/payload.config.ts
export default buildConfig({
  // ... other config
  onInit: async (payload) => {
    payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    
    // Access payload instance for initialization tasks
    // e.g., seed database, setup connections, etc.
  },
})
```

### Config File Location

**IMPORTANT**: Create `payload-config.ts` at project root for import alias:

```typescript
// payload-config.ts (root level)
import config from './src/payload.config'
export default config
```

This allows importing as `@payload-config` from anywhere.

---

## 3. Cloudflare R2 Storage Integration

### Installation

```bash
pnpm add @payloadcms/plugin-cloud-storage @payloadcms/storage-s3
```

### Configuration

**Environment Variables**:
```bash
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_BUCKET=aladdin-media
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_PUBLIC_URL=https://pub-xxx.r2.dev  # Or custom domain
```

**Payload Config**:
```typescript
// src/payload.config.ts
import { buildConfig } from 'payload'
import { s3Storage } from '@payloadcms/storage-s3'
import { Media } from './collections/Media'

export default buildConfig({
  collections: [Media],
  plugins: [
    s3Storage({
      collections: {
        'media': true,  // Enable for media collection
      },
      bucket: process.env.R2_BUCKET!,
      config: {
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        region: 'auto',  // Cloudflare R2 uses 'auto'
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      },
    }),
  ],
})
```

### Media Collection with Upload

```typescript
// src/collections/Media.ts
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: true,  // Enable upload
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
}
```

**IMPORTANT**: When `upload: true` is set, PayloadCMS automatically:
- Uploads files to configured storage (R2)
- Stores file metadata in database
- Generates image variants/sizes
- Provides `url` field for accessing files

### Accessing Uploaded Files

```typescript
// Files automatically get url field
const media = await payload.findByID({
  collection: 'media',
  id: 'media_123',
})

console.log(media.url)  // https://pub-xxx.r2.dev/filename.jpg
```

---

## 4. Common Patterns

### Hooks Pattern

```typescript
// src/collections/Projects.ts
import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        // Send to Brain
        if (operation === 'create' || operation === 'update') {
          await sendToBrain(doc)
        }
      },
    ],
  },
  fields: [/* ... */],
}
```

### Access Control Pattern

```typescript
export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    read: () => true,     // All authenticated users can read
    create: () => true,   // All authenticated users can create
    update: () => true,
    delete: () => true,
  },
  fields: [/* ... */],
}
```

### Relationship Pattern

```typescript
export const Projects: CollectionConfig = {
  slug: 'projects',
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
```

---

## 5. Testing Patterns

### Test Collection CRUD

```typescript
// tests/int/collections.test.ts
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

describe('Projects Collection', () => {
  let payload
  
  beforeAll(async () => {
    payload = await getPayloadHMR({ config: configPromise })
  })
  
  it('creates a project', async () => {
    const project = await payload.create({
      collection: 'projects',
      data: {
        name: 'Test Project',
        slug: 'test-project',
      },
    })
    
    expect(project.name).toBe('Test Project')
  })
})
```

---

## 6. Git Submodules for External Services

### Adding Brain as Submodule

```bash
# Add Brain repository as submodule
git submodule add <brain-repo-url> services/brain

# Add Celery-Redis task queue as submodule
git submodule add <celery-redis-repo-url> services/task-queue

# Initialize submodules
git submodule update --init --recursive
```

### Directory Structure

```
aladdin/
├── src/                    # Main Next.js app
├── services/
│   ├── brain/             # Brain submodule (Neo4j + embeddings)
│   └── task-queue/        # Celery-Redis submodule
├── docker-compose.yml     # Orchestrate all services
└── .env
```

### Integration Pattern

**Brain Endpoint Integration**:
```typescript
// src/lib/brain/client.ts
const BRAIN_API_URL = process.env.BRAIN_API_URL || 'http://localhost:8000'

export async function validateContent(data: any) {
  const response = await fetch(`${BRAIN_API_URL}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  return response.json()
}
```

**Celery Task Queue Integration**:
```typescript
// src/lib/tasks/client.ts
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

export async function enqueueTask(taskName: string, args: any) {
  await redis.connect()
  
  // Enqueue task for Celery worker
  await redis.lpush('celery', JSON.stringify({
    task: taskName,
    args: [args],
    kwargs: {},
  }))
  
  await redis.disconnect()
}
```

### Environment Variables

```bash
# Brain Service (Live or Local)
BRAIN_API_URL=https://brain.ft.tc  # Live service
# BRAIN_API_URL=http://localhost:8000  # Local development
BRAIN_API_KEY=your_brain_api_key

# Celery-Redis Task Queue (Live or Local)
TASKS_API_URL=https://tasks.ft.tc  # Live service
# REDIS_URL=redis://localhost:6379  # Local development
# CELERY_BROKER_URL=redis://localhost:6379/0
# CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

### Docker Compose Integration

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
      - brain
      - redis
    environment:
      - DATABASE_URI=mongodb://mongodb:27017/aladdin
      - BRAIN_API_URL=http://brain:8000
      - REDIS_URL=redis://redis:6379

  brain:
    build: ./services/brain
    ports:
      - "8000:8000"
    depends_on:
      - neo4j

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery-worker:
    build: ./services/task-queue
    depends_on:
      - redis
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"

  neo4j:
    image: neo4j:5
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/password
```

---

**Status**: PayloadCMS Patterns Documented ✓