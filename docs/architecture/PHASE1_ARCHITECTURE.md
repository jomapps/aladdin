# Phase 1 Architecture Blueprint - Aladdin Foundation

**Version**: 1.0.0
**Date**: 2025-10-01
**Status**: Ready for Implementation
**Swarm Session**: swarm-1759247953229-friw6kswf

---

## Executive Summary

Phase 1 establishes the foundational architecture for Aladdin's AI movie production platform. This phase focuses on:

1. **PayloadCMS Collections** for curated production data
2. **Dual MongoDB Architecture** (protected + open per-project databases)
3. **Authentication & Route Protection**
4. **Cloudflare R2 Media Storage**
5. **Open Database Infrastructure** for flexible content

**Success Criteria**: Users can create projects, manage content through PayloadCMS admin, and store flexible data in per-project databases.

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 15 Application                        │
│                  (Frontend + Backend Combined)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐              ┌──────────────────────┐    │
│  │  Frontend Routes │              │   PayloadCMS Admin   │    │
│  │  /               │              │   /admin             │    │
│  │  /dashboard/*    │              └──────────────────────┘    │
│  └──────────────────┘                                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            PayloadCMS Collections Layer                  │   │
│  │  • Projects  • Users  • Media  • Conversations          │   │
│  │  • Episodes  • Workflows                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└───────────┬──────────────────────────────┬──────────────────────┘
            │                              │
            ↓                              ↓
┌──────────────────────┐      ┌──────────────────────────┐
│   MongoDB Protected  │      │  MongoDB Open Databases  │
│   (Payload Data)     │      │  (Per-Project)           │
│                      │      │                          │
│ • projects           │      │ • open_[slug]            │
│ • users              │      │   - characters           │
│ • media              │      │   - scenes               │
│ • conversations      │      │   - locations            │
│ • episodes           │      │   - dialogue             │
│ • workflows          │      │   - storyboards          │
└──────────────────────┘      │   - images               │
                              │   - videos               │
                              └──────────────────────────┘
            │
            ↓
┌──────────────────────────────────────────────────────────┐
│              Cloudflare R2 Object Storage                │
│              (Media Files: Images, Videos, Assets)       │
└──────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|----------|
| **Framework** | Next.js | 15.4.4 | Full-stack React framework |
| **CMS** | PayloadCMS | 3.57.0 | Headless CMS with admin UI |
| **Database (Protected)** | MongoDB | 7.x | Structured Payload data |
| **Database (Open)** | MongoDB | 7.x | Flexible per-project data |
| **Storage** | Cloudflare R2 | - | S3-compatible object storage |
| **Runtime** | Node.js | ≥20.9.0 | JavaScript runtime |
| **Package Manager** | pnpm | ≥9 | Fast, efficient package manager |

---

## 2. Data Architecture

### 2.1 Dual Database Strategy

#### Database 1: PayloadCMS Protected Collections

**Connection**: `DATABASE_URI` environment variable
**Purpose**: Curated, well-known schemas with admin UI support

**Collections**:
```
projects         - Core project metadata, settings, team
users            - Authentication, profiles, preferences
media            - File uploads, R2 references, metadata
conversations    - Chat history, messages, agent interactions
episodes         - Series-specific episode structure
workflows        - Pipeline states, quality gates
```

#### Database 2: Open Per-Project Databases

**Connection**: `DATABASE_URI_OPEN` environment variable
**Purpose**: Flexible, schema-less content specific to each project

**Database Naming Pattern**: `open_[project-slug]`

**Example**:
- Project slug: `cyber-detective-2099`
- Database name: `open_cyber-detective-2099`

**Collections** (created dynamically):
```
characters       - Character profiles, relationships, arcs
scenes           - Scene descriptions, blocking, cinematography
locations        - Setting details, atmosphere, geography
dialogue         - Conversation lines, emotion, delivery
storyboards      - Visual composition, shot planning
images           - Generated/reference images metadata
videos           - Generated video clips metadata
props            - Physical objects, significance
costumes         - Character wardrobe, style
worldbuilding    - Lore, rules, history
storynotes       - Ideas, reminders, continuity notes
```

### 2.2 Data Models

#### 2.2.1 Project Collection (PayloadCMS)

```typescript
interface Project {
  // Identity
  id: string                    // Auto-generated
  name: string                  // REQUIRED - Only required field
  slug: string                  // Auto-generated from name (URL-safe)

  // Project Type
  type?: 'movie' | 'series'

  // Production Info
  targetLength?: number         // Minutes
  targetEpisodes?: number       // For series
  genre?: string[]
  logline?: string
  synopsis?: string
  targetAudience?: string
  contentRating?: string

  // Story Development
  initialIdea?: string
  storyPremise?: string
  themes?: string[]
  tone?: string

  // Production Status
  phase?: 'expansion' | 'compacting' | 'complete'
  status?: 'active' | 'paused' | 'archived' | 'complete'
  expansionProgress?: number    // 0-100
  compactingProgress?: number   // 0-100

  // Quality Metrics
  overallQuality?: number       // 0-1
  qualityBreakdown?: {
    story?: number
    characters?: number
    visuals?: number
    technical?: number
  }

  // Team & Access
  owner: Relationship<User>     // Project creator (REQUIRED)
  team?: Array<{
    user: Relationship<User>
    role: 'producer' | 'director' | 'writer' | 'editor' | 'viewer'
    permissions?: string[]
    addedAt: Date
  }>

  // Settings
  settings?: {
    brainValidationRequired?: boolean
    minQualityThreshold?: number
    autoGenerateImages?: boolean
    videoGenerationProvider?: string
    maxBudget?: number
  }

  // Open Database Reference
  openDatabaseName: string      // Auto-generated: "open_[slug]"
  dynamicCollections?: string[] // List of created collections

  // Metadata
  tags?: string[]
  coverImage?: Relationship<Media>
  isPublic?: boolean

  // Timestamps (auto-managed)
  createdAt: Date
  updatedAt: Date
  lastActivityAt?: Date
}
```

#### 2.2.2 Episodes Collection (PayloadCMS)

```typescript
interface Episode {
  // Identity
  name: string                  // REQUIRED

  // Association
  project: Relationship<Project> // REQUIRED
  episodeNumber: number
  seasonNumber?: number

  // Story
  title?: string
  logline?: string
  synopsis?: string

  // Production
  targetLength?: number         // Minutes
  status?: 'outlined' | 'scripted' | 'storyboarded' | 'generated' | 'complete'

  // Quality
  qualityRating?: number        // 0-1

  // Story Structure
  actStructure?: Array<{
    actNumber: number
    description?: string
    sceneCount?: number
  }>

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

#### 2.2.3 Users Collection (PayloadCMS)

```typescript
interface User {
  // Identity (PayloadCMS managed)
  id: string
  email: string                 // REQUIRED, unique
  password: string              // Hashed by PayloadCMS

  // Profile
  name?: string
  firstName?: string
  lastName?: string
  displayName?: string
  avatar?: Relationship<Media>
  bio?: string

  // Usage Stats
  stats?: {
    projectsCreated?: number
    imagesGenerated?: number
    videosGenerated?: number
    brainQueries?: number
    totalApiCalls?: number
  }

  // Preferences
  preferences?: {
    defaultModel?: string
    theme?: 'light' | 'dark' | 'auto'
    notifications?: boolean
    language?: string
  }

  // Timestamps
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}
```

#### 2.2.4 Media Collection (PayloadCMS)

```typescript
interface Media {
  // Identity
  id: string
  filename: string
  url: string                   // Cloudflare R2 CDN URL

  // File Info
  mimeType?: string
  filesize?: number             // Bytes
  width?: number
  height?: number
  duration?: number             // For videos (seconds)

  // Storage
  thumbnailUrl?: string

  // Project Association
  project?: Relationship<Project>

  // Open Database Link
  linkedDocument?: {
    database: string            // e.g., "open_cyber-detective"
    collection: string          // e.g., "characters"
    documentId: string          // Document _id
    field?: string              // Field name
  }

  // Generation Info
  generatedBy?: {
    agent?: string
    prompt?: string
    model?: string
    parameters?: Record<string, any>
  }

  // Metadata
  alt?: string
  caption?: string
  tags?: string[]

  // Upload Info
  uploadedBy?: Relationship<User>

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

#### 2.2.5 Conversations Collection (PayloadCMS)

```typescript
interface Conversation {
  // Identity
  name: string                  // REQUIRED

  // Association
  project: Relationship<Project>
  user?: Relationship<User>

  // Messages (stored as JSON array)
  messages?: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    agentId?: string
  }>

  // Status
  status?: 'active' | 'archived'

  // Timestamps
  createdAt: Date
  updatedAt: Date
  lastMessageAt?: Date
}
```

#### 2.2.6 Workflows Collection (PayloadCMS)

```typescript
interface Workflow {
  // Identity
  name: string                  // REQUIRED

  // Association
  project: Relationship<Project>

  // Current State
  currentPhase?: 'expansion' | 'compacting' | 'complete'

  // Quality Gates
  qualityGates?: Array<{
    name: string
    threshold: number           // 0-1
    passed?: boolean
    evaluatedAt?: Date
  }>

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

#### 2.2.7 Open Database Base Document Structure

**All documents in open databases share this base structure:**

```typescript
interface BaseOpenDocument {
  _id: ObjectId

  // REQUIRED
  name: string                  // ONLY required field

  // Project Binding
  projectId: string             // Links to PayloadCMS Project.id
  collectionName: string        // e.g., "characters"

  // Versioning
  version?: number
  previousVersionId?: string

  // Authorship
  createdBy?: string            // User ID or agent ID
  createdByType?: 'user' | 'agent'
  generatedByAgent?: string
  conversationId?: string
  messageId?: string

  // Quality & Validation
  qualityRating?: number        // 0-1
  qualityDimensions?: {
    coherence?: number
    creativity?: number
    technical?: number
    consistency?: number
    userIntent?: number
  }
  brainValidated?: boolean
  brainValidationResults?: {
    score?: number
    issues?: string[]
    suggestions?: string[]
    relatedContent?: string[]
  }

  // User Approval
  userApproved?: boolean
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'deferred'
  userFeedback?: string

  // Relationships
  relatedDocuments?: Array<{
    collection: string
    documentId: string
    relationship?: string
  }>

  // Tags & Search
  tags?: string[]
  searchableText?: string

  // Timestamps
  createdAt?: Date
  updatedAt?: Date

  // FLEXIBLE CONTENT - Varies by collection type
  content: Record<string, any>
}
```

---

## 3. File Organization & Directory Structure

### 3.1 Project Root Structure

```
/mnt/d/Projects/aladdin/
├── src/                          # Main application source
│   ├── app/                      # Next.js App Router
│   │   ├── (frontend)/          # Public/dashboard routes
│   │   │   ├── page.tsx         # Homepage (login)
│   │   │   ├── layout.tsx       # Frontend layout
│   │   │   └── dashboard/       # Protected dashboard
│   │   │       ├── layout.tsx   # Auth guard
│   │   │       ├── page.tsx     # Dashboard home
│   │   │       └── projects/    # Project management
│   │   ├── (payload)/           # PayloadCMS routes
│   │   │   ├── admin/           # Admin panel
│   │   │   └── api/             # Payload API routes
│   │   └── api/                 # Custom API routes
│   │       └── v1/              # API version 1
│   │           ├── projects/    # Project endpoints
│   │           ├── open-db/     # Open database access
│   │           └── auth/        # Auth endpoints
│   │
│   ├── collections/             # PayloadCMS collections
│   │   ├── Projects.ts          # ✅ TO CREATE
│   │   ├── Episodes.ts          # ✅ TO CREATE
│   │   ├── Conversations.ts     # ✅ TO CREATE
│   │   ├── Workflows.ts         # ✅ TO CREATE
│   │   ├── Users.ts             # ✅ EXISTS
│   │   └── Media.ts             # ✅ EXISTS
│   │
│   ├── lib/                     # Utility libraries
│   │   ├── db/                  # Database utilities
│   │   │   ├── openDatabase.ts  # ✅ TO CREATE - Open DB client
│   │   │   ├── mongodb.ts       # MongoDB connection helpers
│   │   │   └── collections.ts   # Collection management
│   │   ├── auth/                # Authentication helpers
│   │   │   ├── withAuth.ts      # ✅ TO CREATE - Auth middleware
│   │   │   └── session.ts       # Session utilities
│   │   ├── storage/             # Storage utilities
│   │   │   └── r2.ts            # Cloudflare R2 helpers
│   │   └── validators/          # Data validation
│   │       └── schemas.ts       # Validation schemas
│   │
│   ├── components/              # React components
│   │   ├── auth/                # Auth components
│   │   │   └── LoginForm.tsx    # ✅ TO CREATE
│   │   ├── dashboard/           # Dashboard components
│   │   │   ├── ProjectList.tsx  # ✅ TO CREATE
│   │   │   ├── ProjectCard.tsx  # ✅ TO CREATE
│   │   │   └── DashboardNav.tsx # ✅ TO CREATE
│   │   └── ui/                  # Shared UI components
│   │
│   ├── payload.config.ts        # ✅ EXISTS - PayloadCMS config
│   └── payload-types.ts         # Auto-generated types
│
├── tests/                       # Test suites
│   ├── int/                     # Integration tests
│   │   ├── collections.test.ts  # ✅ TO CREATE
│   │   ├── open-database.test.ts # ✅ TO CREATE
│   │   └── media-upload.test.ts # ✅ TO CREATE
│   └── e2e/                     # End-to-end tests
│       └── auth.e2e.spec.ts     # ✅ TO CREATE
│
├── docs/                        # Documentation
│   └── architecture/            # Architecture docs
│       └── PHASE1_ARCHITECTURE.md # THIS FILE
│
├── .env.example                 # ✅ TO CREATE
├── .env                         # Local environment (gitignored)
├── package.json                 # ✅ EXISTS
├── tsconfig.json                # TypeScript config
├── next.config.js               # Next.js config
└── README.md                    # ✅ EXISTS
```

### 3.2 Critical File Organization Rules

**FROM CLAUDE.md**:
1. **NEVER save files to root folder** (working files, docs, tests)
2. **Use appropriate subdirectories**:
   - `/src` - Source code
   - `/tests` - Test files
   - `/docs` - Documentation
   - `/config` - Configuration
   - `/scripts` - Utility scripts
   - `/examples` - Example code

---

## 4. Authentication Architecture

### 4.1 Authentication Strategy

**Approach**: Simple binary authentication (logged in or not)
- **No roles or complex permissions** in Phase 1
- **All authenticated users** have full access
- **Session-based** authentication via PayloadCMS

### 4.2 Route Protection Patterns

#### Homepage (Public with Redirect)

```typescript
// src/app/(frontend)/page.tsx
import { redirect } from 'next/navigation'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import LoginForm from '@/components/auth/LoginForm'

export default async function HomePage() {
  const payload = await getPayloadHMR({ config: configPromise })
  const { user } = await payload.auth({ req })

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full">
        <h1 className="text-4xl font-bold mb-8">Aladdin</h1>
        <p className="text-lg mb-6">AI Movie Production Platform</p>
        <LoginForm />
      </div>
    </main>
  )
}
```

#### Dashboard (Protected with Auth Guard)

```typescript
// src/app/(frontend)/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import DashboardNav from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const payload = await getPayloadHMR({ config: configPromise })
  const { user } = await payload.auth({ req })

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen">
      <DashboardNav user={user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

#### API Route Protection

```typescript
// src/lib/auth/withAuth.ts
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export function withAuth(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    const payload = await getPayloadHMR({ config: configPromise })
    const { user } = await payload.auth({ req })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Attach user to request
    ;(req as any).user = user

    return handler(req, context)
  }
}
```

**Usage**:
```typescript
// src/app/api/v1/projects/route.ts
import { withAuth } from '@/lib/auth/withAuth'

export const POST = withAuth(async (req: NextRequest) => {
  const user = (req as any).user
  const body = await req.json()

  // Create project with authenticated user
  // ...
})
```

---

## 5. Open Database Architecture

### 5.1 Connection Management

```typescript
// src/lib/db/openDatabase.ts
import { MongoClient, Db, Collection } from 'mongodb'

class OpenDatabaseManager {
  private client: MongoClient
  private isConnected: boolean = false

  constructor() {
    const uri = process.env.DATABASE_URI_OPEN || 'mongodb://localhost:27017'
    this.client = new MongoClient(uri)
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect()
      this.isConnected = true
      console.log('✅ Connected to Open MongoDB')
    }
  }

  /**
   * Get database for a specific project
   * Database name format: open_[project-slug]
   */
  async getProjectDatabase(projectSlug: string): Promise<Db> {
    await this.connect()
    const dbName = `open_${projectSlug}`
    return this.client.db(dbName)
  }

  /**
   * Create a new collection with base schema validation
   */
  async createCollection(
    projectSlug: string,
    collectionName: string
  ): Promise<Collection> {
    const db = await this.getProjectDatabase(projectSlug)

    // Check if collection exists
    const collections = await db.listCollections({ name: collectionName }).toArray()
    if (collections.length > 0) {
      return db.collection(collectionName)
    }

    // Create with base validation (only name required)
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'projectId'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'Name is required'
            },
            projectId: {
              bsonType: 'string',
              description: 'Project ID binding is required'
            },
            collectionName: { bsonType: 'string' },
            version: { bsonType: 'number' },
            createdBy: { bsonType: 'string' },
            qualityRating: {
              bsonType: 'number',
              minimum: 0,
              maximum: 1
            },
            brainValidated: { bsonType: 'bool' },
            content: {
              bsonType: 'object',
              description: 'Flexible content structure'
            }
          }
        }
      }
    })

    console.log(`✅ Created collection: ${collectionName} in open_${projectSlug}`)
    return db.collection(collectionName)
  }

  /**
   * Get or create a collection
   */
  async getCollection(
    projectSlug: string,
    collectionName: string
  ): Promise<Collection> {
    const db = await this.getProjectDatabase(projectSlug)

    // Check if exists
    const collections = await db.listCollections({ name: collectionName }).toArray()
    if (collections.length === 0) {
      return this.createCollection(projectSlug, collectionName)
    }

    return db.collection(collectionName)
  }

  /**
   * List all collections for a project
   */
  async listProjectCollections(projectSlug: string): Promise<string[]> {
    const db = await this.getProjectDatabase(projectSlug)
    const collections = await db.listCollections().toArray()
    return collections.map(c => c.name).filter(name => !name.startsWith('system.'))
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.close()
      this.isConnected = false
      console.log('🔌 Disconnected from Open MongoDB')
    }
  }
}

// Singleton instance
export const openDB = new OpenDatabaseManager()

// Helper functions for easy access
export async function getOpenDatabase(projectSlug: string): Promise<Db> {
  return openDB.getProjectDatabase(projectSlug)
}

export async function getOpenCollection(
  projectSlug: string,
  collectionName: string
): Promise<Collection> {
  return openDB.getCollection(projectSlug, collectionName)
}

export async function createOpenCollection(
  projectSlug: string,
  collectionName: string
): Promise<Collection> {
  return openDB.createCollection(projectSlug, collectionName)
}
```

### 5.2 API Endpoints for Open Database Access

```typescript
// src/app/api/v1/open-db/[projectSlug]/[collection]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import { getOpenCollection } from '@/lib/db/openDatabase'

export const GET = withAuth(async (
  req: NextRequest,
  { params }: { params: { projectSlug: string; collection: string } }
) => {
  try {
    const { projectSlug, collection } = params
    const col = await getOpenCollection(projectSlug, collection)

    // Get all documents
    const documents = await col.find({}).toArray()

    return NextResponse.json({ documents })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (
  req: NextRequest,
  { params }: { params: { projectSlug: string; collection: string } }
) => {
  try {
    const { projectSlug, collection } = params
    const body = await req.json()
    const user = (req as any).user

    const col = await getOpenCollection(projectSlug, collection)

    // Prepare document with required fields
    const document = {
      ...body,
      projectId: projectSlug, // Ensure binding
      collectionName: collection,
      createdBy: user.id,
      createdByType: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await col.insertOne(document)

    return NextResponse.json({
      success: true,
      documentId: result.insertedId
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
})
```

---

## 6. Cloudflare R2 Storage Integration

### 6.1 Configuration

**Installation**:
```bash
pnpm add @payloadcms/plugin-cloud-storage @payloadcms/storage-s3
```

**Environment Variables**:
```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_BUCKET=aladdin-media
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### 6.2 Payload Config Integration

```typescript
// src/payload.config.ts (UPDATED)
import { buildConfig } from 'payload'
import { s3Storage } from '@payloadcms/storage-s3'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Collections
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { Episodes } from './collections/Episodes'
import { Conversations } from './collections/Conversations'
import { Workflows } from './collections/Workflows'

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
    Media,
    Projects,
    Episodes,
    Conversations,
    Workflows,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        'media': true, // Enable R2 for media collection
      },
      bucket: process.env.R2_BUCKET!,
      config: {
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        region: 'auto', // Cloudflare R2 uses 'auto'
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      },
    }),
  ],
})
```

### 6.3 Media Collection with Upload Support

```typescript
// src/collections/Media.ts (UPDATED)
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: true, // Enable file uploads

  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      label: 'Project',
    },
    {
      name: 'linkedDocument',
      type: 'group',
      label: 'Linked Document',
      fields: [
        {
          name: 'database',
          type: 'text',
          label: 'Database Name',
        },
        {
          name: 'collection',
          type: 'text',
          label: 'Collection Name',
        },
        {
          name: 'documentId',
          type: 'text',
          label: 'Document ID',
        },
        {
          name: 'field',
          type: 'text',
          label: 'Field Name',
        },
      ],
    },
    {
      name: 'generatedBy',
      type: 'group',
      label: 'Generation Info',
      fields: [
        {
          name: 'agent',
          type: 'text',
          label: 'Agent ID',
        },
        {
          name: 'prompt',
          type: 'textarea',
          label: 'Generation Prompt',
        },
        {
          name: 'model',
          type: 'text',
          label: 'Model Used',
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
  ],
}
```

---

## 7. Testing Strategy

### 7.1 Test Organization

```
tests/
├── int/                        # Integration tests
│   ├── collections.test.ts     # PayloadCMS CRUD operations
│   ├── open-database.test.ts   # Open DB operations
│   ├── media-upload.test.ts    # R2 upload/download
│   └── auth.test.ts            # Authentication flows
│
└── e2e/                        # End-to-end tests
    ├── auth.e2e.spec.ts        # Login/logout flows
    ├── projects.e2e.spec.ts    # Project creation workflow
    └── dashboard.e2e.spec.ts   # Dashboard navigation
```

### 7.2 Integration Test Examples

#### Collections Test

```typescript
// tests/int/collections.test.ts
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { describe, it, expect, beforeAll } from 'vitest'

describe('Projects Collection', () => {
  let payload: any

  beforeAll(async () => {
    payload = await getPayloadHMR({ config: configPromise })
  })

  it('creates project with auto-generated openDatabaseName', async () => {
    const project = await payload.create({
      collection: 'projects',
      data: {
        name: 'Test Project',
        slug: 'test-project',
        owner: 'user_test_id', // Mock user ID
      },
    })

    expect(project.name).toBe('Test Project')
    expect(project.slug).toBe('test-project')
    expect(project.openDatabaseName).toBe('open_test-project')
  })

  it('enforces unique slug constraint', async () => {
    await expect(
      payload.create({
        collection: 'projects',
        data: {
          name: 'Test Project 2',
          slug: 'test-project', // Duplicate slug
          owner: 'user_test_id',
        },
      })
    ).rejects.toThrow()
  })
})
```

#### Open Database Test

```typescript
// tests/int/open-database.test.ts
import { getOpenDatabase, createOpenCollection } from '@/lib/db/openDatabase'
import { describe, it, expect } from 'vitest'

describe('Open Database', () => {
  const testSlug = 'test-project'

  it('creates project-specific database', async () => {
    const db = await getOpenDatabase(testSlug)
    expect(db.databaseName).toBe('open_test-project')
  })

  it('creates collection with validation', async () => {
    const collection = await createOpenCollection(testSlug, 'characters')

    // Try invalid document (missing name)
    await expect(
      collection.insertOne({ invalid: 'data' })
    ).rejects.toThrow()

    // Insert valid document
    const result = await collection.insertOne({
      name: 'Test Character',
      projectId: testSlug,
      collectionName: 'characters',
      content: {
        age: 30,
        role: 'protagonist'
      }
    })

    expect(result.acknowledged).toBe(true)
  })
})
```

#### Media Upload Test

```typescript
// tests/int/media-upload.test.ts
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'
import { describe, it, expect, beforeAll } from 'vitest'

describe('Media Upload to R2', () => {
  let payload: any

  beforeAll(async () => {
    payload = await getPayloadHMR({ config: configPromise })
  })

  it('uploads file to Cloudflare R2', async () => {
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg')

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Test Image',
      },
      file: {
        data: fs.readFileSync(testImagePath),
        mimetype: 'image/jpeg',
        name: 'test-image.jpg',
        size: fs.statSync(testImagePath).size,
      },
    })

    expect(media.url).toContain('r2.dev') // R2 CDN URL
    expect(media.filename).toBe('test-image.jpg')
    expect(media.mimeType).toBe('image/jpeg')
  })
})
```

### 7.3 E2E Test Examples

```typescript
// tests/e2e/auth.e2e.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('redirects to dashboard when logged in', async ({ page }) => {
    await page.goto('/')

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('redirects to homepage when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1')).toContainText('Aladdin')
  })
})
```

---

## 8. Environment Configuration

### 8.1 Environment Variables

Create `.env.example` for reference:

```bash
# .env.example

# Application
NODE_ENV=development
PAYLOAD_SECRET=your-super-secret-key-min-32-chars

# Database - Protected (PayloadCMS)
DATABASE_URI=mongodb://localhost:27017/aladdin

# Database - Open (Per-Project)
DATABASE_URI_OPEN=mongodb://localhost:27017

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_account_id
R2_BUCKET=aladdin-media
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Optional: External Services (Future Phases)
# BRAIN_API_URL=https://brain.ft.tc
# BRAIN_API_KEY=your_brain_api_key
# TASKS_API_URL=https://tasks.ft.tc
```

### 8.2 Local Development `.env`

```bash
# .env (local development)

NODE_ENV=development
PAYLOAD_SECRET=development-secret-key-min-32-characters-long

# Local MongoDB
DATABASE_URI=mongodb://localhost:27017/aladdin
DATABASE_URI_OPEN=mongodb://localhost:27017

# Cloudflare R2 (use your actual credentials)
R2_ACCOUNT_ID=your_account_id
R2_BUCKET=aladdin-media-dev
R2_ACCESS_KEY_ID=your_dev_access_key
R2_SECRET_ACCESS_KEY=your_dev_secret_key
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

---

## 9. Implementation Execution Plan

### 9.1 Implementation Order

**Phase 1A: Core Collections (Week 1-2)**

1. **Create PayloadCMS Collections** (Priority: HIGH)
   ```
   ✅ Collections to create:
   - Projects.ts
   - Episodes.ts
   - Conversations.ts
   - Workflows.ts

   ✅ Update payload.config.ts with new collections
   ✅ Generate TypeScript types: pnpm generate:types
   ```

2. **Implement Authentication Guards** (Priority: HIGH)
   ```
   ✅ Create src/lib/auth/withAuth.ts
   ✅ Update src/app/(frontend)/page.tsx (login page)
   ✅ Create src/app/(frontend)/dashboard/layout.tsx (auth guard)
   ✅ Create src/components/auth/LoginForm.tsx
   ```

3. **Configure Cloudflare R2** (Priority: HIGH)
   ```
   ✅ Install packages: @payloadcms/plugin-cloud-storage @payloadcms/storage-s3
   ✅ Update payload.config.ts with R2 plugin
   ✅ Update Media.ts collection with upload fields
   ✅ Test file upload via admin panel
   ```

**Phase 1B: Open Database Infrastructure (Week 2-3)**

4. **Create Open Database Client** (Priority: HIGH)
   ```
   ✅ Create src/lib/db/openDatabase.ts
   ✅ Implement connection management
   ✅ Implement collection creation with validation
   ✅ Test database creation
   ```

5. **Create Open Database API Endpoints** (Priority: MEDIUM)
   ```
   ✅ Create src/app/api/v1/open-db/[projectSlug]/[collection]/route.ts
   ✅ Implement GET (list documents)
   ✅ Implement POST (create document)
   ✅ Implement PATCH (update document)
   ✅ Implement DELETE (delete document)
   ```

6. **Create Dashboard UI** (Priority: MEDIUM)
   ```
   ✅ Create src/components/dashboard/DashboardNav.tsx
   ✅ Create src/components/dashboard/ProjectList.tsx
   ✅ Create src/components/dashboard/ProjectCard.tsx
   ✅ Create src/app/(frontend)/dashboard/page.tsx
   ✅ Create src/app/(frontend)/dashboard/projects/page.tsx
   ```

**Phase 1C: Testing & Validation (Week 3-4)**

7. **Write Integration Tests** (Priority: HIGH)
   ```
   ✅ Create tests/int/collections.test.ts
   ✅ Create tests/int/open-database.test.ts
   ✅ Create tests/int/media-upload.test.ts
   ✅ Run: pnpm test:int
   ```

8. **Write E2E Tests** (Priority: MEDIUM)
   ```
   ✅ Create tests/e2e/auth.e2e.spec.ts
   ✅ Create tests/e2e/projects.e2e.spec.ts
   ✅ Run: pnpm test:e2e
   ```

9. **Documentation & Cleanup** (Priority: LOW)
   ```
   ✅ Create .env.example
   ✅ Update README.md with setup instructions
   ✅ Verify all tests pass
   ✅ Run build: pnpm build
   ```

### 9.2 Success Criteria Checklist

**Must Pass All**:
- [ ] `pnpm dev` starts server without errors
- [ ] Can create/login user via PayloadCMS admin
- [ ] Protected routes redirect when not logged in
- [ ] Can create project via admin panel
- [ ] Project gets auto-generated `openDatabaseName`
- [ ] Can upload file to Media collection
- [ ] Uploaded file accessible via `media.url` from R2
- [ ] Open database created for new project
- [ ] Can create documents in open collections via API
- [ ] All integration tests pass (`pnpm test:int`)
- [ ] All E2E tests pass (`pnpm test:e2e`)
- [ ] Full build succeeds (`pnpm build`)

---

## 10. Coder Agent Execution Instructions

### 10.1 Execution Workflow

**FOR CODER AGENT:**

1. **Read this architecture document completely**
2. **Follow implementation order** in Section 9.1
3. **Use batch operations** (per CLAUDE.md guidelines):
   - Create all collection files in ONE message
   - Create all auth utilities in ONE message
   - Create all API routes in ONE message
4. **Test after each phase**:
   - Phase 1A: Test collections via admin panel
   - Phase 1B: Test open DB via API
   - Phase 1C: Run all test suites
5. **Store progress in memory**:
   ```bash
   npx claude-flow@alpha hooks post-edit --file "[completed-step]" --memory-key "swarm/coder/progress"
   ```

### 10.2 Implementation Commands

**Step 1: Create Collections**
```bash
# All in one message:
# - Create src/collections/Projects.ts
# - Create src/collections/Episodes.ts
# - Create src/collections/Conversations.ts
# - Create src/collections/Workflows.ts
# - Update src/payload.config.ts

# Then run:
pnpm generate:types
```

**Step 2: Implement Auth**
```bash
# All in one message:
# - Create src/lib/auth/withAuth.ts
# - Update src/app/(frontend)/page.tsx
# - Create src/app/(frontend)/dashboard/layout.tsx
# - Create src/components/auth/LoginForm.tsx
```

**Step 3: Configure R2**
```bash
# Install dependencies
pnpm add @payloadcms/plugin-cloud-storage @payloadcms/storage-s3

# Update payload.config.ts and Media.ts
# Create .env with R2 credentials
```

**Step 4: Open Database**
```bash
# All in one message:
# - Create src/lib/db/openDatabase.ts
# - Create API routes
```

**Step 5: Testing**
```bash
# Run integration tests
pnpm test:int

# Run E2E tests
pnpm test:e2e

# Full test suite
pnpm test
```

### 10.3 Verification Steps

After implementation, verify:

1. **Collections exist in admin**: `http://localhost:3000/admin`
2. **Create test project**: Verify `openDatabaseName` generated
3. **Upload test file**: Verify R2 URL returned
4. **Create open DB document**: Use API endpoint
5. **Run tests**: All green
6. **Build succeeds**: `pnpm build`

---

## 11. Future Phase Integration Points

### 11.1 Phase 2 Preparation

**This architecture provides foundation for**:
- Chat interface integration (Section 2.3 of SPECIFICATION.md)
- AI agent system (@codebuff/sdk)
- Real-time WebSocket connections
- Agent-generated content ingestion

**Integration Points**:
- Conversations collection ready for chat messages
- Open DB ready for agent-generated content
- Media collection ready for AI-generated images/videos

### 11.2 Phase 3 Preparation

**Brain integration hooks**:
- afterChange hooks in collections
- MongoDB change streams in open databases
- Validation pipeline ready

**Submodules ready**:
- `services/brain/` - Neo4j + embeddings service
- `services/task-queue/` - Celery-Redis task queue

---

## 12. Architecture Decision Records (ADRs)

### ADR-001: Dual MongoDB Architecture

**Decision**: Use two MongoDB instances - one for PayloadCMS, one for open databases

**Rationale**:
- Separation of concerns: curated vs flexible data
- PayloadCMS benefits: admin UI, hooks, relationships
- Open DB benefits: schema flexibility, per-project isolation

**Alternatives Considered**:
- Single MongoDB with all collections (rejected: mixing concerns)
- PostgreSQL for structured + MongoDB for flexible (rejected: added complexity)

**Status**: APPROVED

### ADR-002: Simple Binary Authentication

**Decision**: Phase 1 uses logged-in/not-logged-in only

**Rationale**:
- MVP simplicity
- Faster implementation
- Easy to extend later with roles/permissions

**Alternatives Considered**:
- Full RBAC from start (rejected: premature optimization)
- No auth at all (rejected: security requirement)

**Status**: APPROVED

### ADR-003: Cloudflare R2 for Storage

**Decision**: Use Cloudflare R2 (S3-compatible) for media storage

**Rationale**:
- Cost-effective (no egress fees)
- S3-compatible (standard API)
- Global CDN built-in
- PayloadCMS plugin support

**Alternatives Considered**:
- AWS S3 (rejected: higher costs)
- Local filesystem (rejected: not scalable)

**Status**: APPROVED

### ADR-004: File Organization (No Root Files)

**Decision**: All files organized in subdirectories (src/, tests/, docs/, etc.)

**Rationale**:
- Per CLAUDE.md guidelines
- Clean project structure
- Easy navigation
- Clear separation of concerns

**Alternatives Considered**:
- Flat structure (rejected: becomes messy)

**Status**: APPROVED

---

## 13. Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **MongoDB connection issues** | HIGH | LOW | Connection pooling, retry logic, error handling |
| **R2 upload failures** | MEDIUM | LOW | Retry mechanism, fallback storage, error logging |
| **PayloadCMS breaking changes** | MEDIUM | LOW | Pin versions, test before upgrades |
| **Open DB schema conflicts** | LOW | MEDIUM | Base validation, version tracking, migration tools |
| **Authentication bypass** | HIGH | LOW | Thorough testing, security audit, middleware validation |

---

## 14. Performance Considerations

### 14.1 Database Optimization

- **Connection Pooling**: Reuse MongoDB connections
- **Indexes**: Create indexes on frequently queried fields
  - Projects: `slug`, `owner`
  - Open DB: `projectId`, `collectionName`, `name`
- **Query Limits**: Paginate large result sets

### 14.2 Media Storage Optimization

- **CDN Caching**: Leverage Cloudflare R2 CDN
- **Image Optimization**: Use Sharp for resizing
- **Lazy Loading**: Load images on-demand in UI

### 14.3 API Response Time Targets

- **Auth check**: < 50ms
- **Collection read**: < 100ms
- **Open DB query**: < 200ms
- **File upload**: < 2s (depends on file size)

---

## 15. Monitoring & Observability

### 15.1 Logging Strategy

```typescript
// Use structured logging
console.log('✅ Project created', {
  projectId: project.id,
  slug: project.slug,
  userId: user.id,
  timestamp: new Date().toISOString()
})
```

### 15.2 Key Metrics to Track

- Authentication success/failure rates
- Collection CRUD operation latency
- Open DB query performance
- R2 upload success rates
- Error rates by endpoint

---

## 16. Security Considerations

### 16.1 Authentication

- **Secure cookies**: HTTP-only, secure, SameSite
- **Password hashing**: Handled by PayloadCMS (bcrypt)
- **Session expiry**: Configurable timeout

### 16.2 Authorization

- **API route protection**: All endpoints require auth
- **Project ownership**: Verify user owns project
- **Input validation**: Validate all user input

### 16.3 Data Protection

- **Environment variables**: Never commit to git
- **Database access**: Restrict to application only
- **R2 credentials**: Rotate regularly

---

## 17. Documentation & Handoff

### 17.1 Developer Documentation

Create these docs after implementation:
- `/docs/SETUP.md` - Local development setup
- `/docs/API.md` - API endpoint documentation
- `/docs/COLLECTIONS.md` - PayloadCMS collection reference
- `/docs/TESTING.md` - Testing guide

### 17.2 User Documentation

Future phases:
- User guide for dashboard
- Project creation tutorial
- Media upload instructions

---

## 18. Conclusion

This architecture provides a solid foundation for Aladdin's Phase 1 implementation. Key achievements:

✅ **Flexible Data Architecture**: Dual MongoDB setup balances structure and flexibility
✅ **Secure Authentication**: Simple yet secure auth flow
✅ **Scalable Storage**: Cloudflare R2 for cost-effective media hosting
✅ **Clean Organization**: All files properly organized per guidelines
✅ **Testable Design**: Comprehensive test strategy
✅ **Future-Ready**: Clear integration points for Phase 2+

**Next Steps**:
1. Coder agent implements per Section 9 execution plan
2. All tests pass per Section 9.2 success criteria
3. Phase 1 complete, ready for Phase 2 (Chat & Agents)

---

**Document Status**: ✅ COMPLETE - Ready for Implementation
**Architect**: System Architecture Designer Agent
**Session**: swarm-1759247953229-friw6kswf
**Date**: 2025-10-01