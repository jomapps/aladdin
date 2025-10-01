# Aladdin - API Design Specification

**Version**: 0.2.0  
**Last Updated**: January 28, 2025  
**Parent Document**: [SPECIFICATION.md](./SPECIFICATION.md)

---

## Overview

Aladdin is built on **Next.js 15** with PayloadCMS v3 and uses a hybrid architecture:

### Architecture Principles

1. **Server Components by Default**
   - Use React Server Components (RSC) wherever possible
   - Only use Client Components when user interaction is required
   - Leverage Next.js server-side rendering for optimal performance

2. **PayloadCMS Local API**
   - Use PayloadCMS Local API in Server Components (no HTTP overhead)
   - Direct database access for read operations
   - Hooks automatically triggered on mutations

3. **Simple Authentication**
   - PayloadCMS built-in authentication
   - Two states: logged in or not (no roles/permissions)
   - Login on homepage → Redirect to `/dashboard/*`
   - All dashboard routes protected

4. **API Route Structure**
   - All API routes under `/api/v1/*` for versioning
   - Easy to replace/upgrade in future
   - Consistent route patterns

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **CMS**: PayloadCMS v3
- **Database**: MongoDB
- **Auth**: PayloadCMS authentication
- **Deployment**: Ubuntu Server with PM2

**API Base URL**: `/api/v1`

---

## 1. Authentication (PayloadCMS Built-in)

### Simple Auth Flow

Aladdin uses **PayloadCMS authentication** with a simple logged in/out state:

**No Roles or Permissions**: All authenticated users have full access

### Route Structure

```
/ (homepage)           → Login page if not authenticated
                       → Redirect to /dashboard if authenticated

/dashboard/*          → Protected routes (require authentication)
  /dashboard          → Main dashboard
  /dashboard/projects → Projects list
  /dashboard/project/[id] → Project detail

/api/v1/*             → API routes (use PayloadCMS auth middleware)
```

### Authentication Implementation

**1. Login (Homepage)**
```typescript
// app/page.tsx (Server Component)
import { redirect } from 'next/navigation';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import LoginForm from './LoginForm';  // Client Component

export default async function HomePage() {
  const payload = await getPayloadHMR({ config: configPromise });
  const { user } = await payload.auth({ req });
  
  // If already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }
  
  return <LoginForm />;
}
```

```typescript
// app/LoginForm.tsx (Client Component)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}
```

**2. Protected Dashboard Layout**
```typescript
// app/dashboard/layout.tsx (Server Component)
import { redirect } from 'next/navigation';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const payload = await getPayloadHMR({ config: configPromise });
  const { user } = await payload.auth({ req });
  
  // Redirect to homepage if not authenticated
  if (!user) {
    redirect('/');
  }
  
  return (
    <div>
      <nav>{/* Dashboard nav */}</nav>
      {children}
    </div>
  );
}
```

**3. Logout**
```typescript
// app/dashboard/LogoutButton.tsx (Client Component)
'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

### Auth API Routes

**Login Route**
```typescript
// app/api/v1/auth/login/route.ts
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  
  const payload = await getPayloadHMR({ config: configPromise });
  
  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    });
    
    return NextResponse.json({
      success: true,
      user: result.user
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }
}
```

**Logout Route**
```typescript
// app/api/v1/auth/logout/route.ts
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const payload = await getPayloadHMR({ config: configPromise });
  
  await payload.logout({ req });
  
  return NextResponse.json({ success: true });
}
```

---

## 2. Server Components with PayloadCMS Local API

### 2.1 Using Local API in Server Components

**Best Practice**: Use PayloadCMS Local API in Server Components for direct database access

```typescript
// app/dashboard/projects/page.tsx (Server Component)
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import ProjectsList from './ProjectsList';  // Client Component if interactive

export default async function ProjectsPage() {
  const payload = await getPayloadHMR({ config: configPromise });
  
  // Direct database query - no HTTP overhead
  const projects = await payload.find({
    collection: 'projects',
    limit: 20,
    sort: '-createdAt'
  });
  
  return <ProjectsList projects={projects.docs} />;
}
```

**When to Use Client Components**:
- Forms with user input
- Interactive UI (buttons, modals, etc.)
- Real-time updates (WebSocket)
- State management (useState, useEffect)

**When to Use Server Components**:
- Data fetching
- Reading from database
- Static content
- Layout components

### 2.2 Example: Server + Client Component Pattern

```typescript
// app/dashboard/project/[id]/page.tsx (Server Component)
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import ProjectEditor from './ProjectEditor';  // Client Component

export default async function ProjectDetailPage({
  params
}: {
  params: { id: string }
}) {
  const payload = await getPayloadHMR({ config: configPromise });
  
  // Fetch project data server-side
  const project = await payload.findByID({
    collection: 'projects',
    id: params.id
  });
  
  // Fetch characters from open MongoDB
  const db = payload.db;
  const openDb = db.connection.useDb(`open_${project.slug}`);
  const characters = await openDb.collection('characters')
    .find({ projectId: project.id })
    .toArray();
  
  // Pass data to Client Component
  return (
    <div>
      <h1>{project.name}</h1>
      <ProjectEditor 
        project={project} 
        characters={characters} 
      />
    </div>
  );
}
```

```typescript
// app/dashboard/project/[id]/ProjectEditor.tsx (Client Component)
'use client';

import { useState } from 'react';

interface Props {
  project: any;
  characters: any[];
}

export default function ProjectEditor({ project, characters }: Props) {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  
  // Interactive UI with state
  return (
    <div>
      {characters.map(char => (
        <button
          key={char._id}
          onClick={() => setSelectedCharacter(char)}
        >
          {char.name}
        </button>
      ))}
      {selectedCharacter && <CharacterDetail character={selectedCharacter} />}
    </div>
  );
}
```

## 3. REST API Routes (under /api/v1/*)

### 3.1 Projects

**Create Project**
```
POST /api/v1/projects

Request:
{
  "name": "Cyberpunk Detective",
  "type": "series",
  "genre": ["sci-fi", "thriller"],
  "logline": "A detective in 2099 Neo Tokyo"
}

Response:
{
  "id": "proj_abc123",
  "name": "Cyberpunk Detective",
  "slug": "cyberpunk-detective",
  "type": "series",
  "phase": "expansion",
  "status": "active",
  "openDatabaseName": "open_cyberpunk-detective",
  "createdAt": "2025-01-28T10:00:00Z"
}
```

**Get Project**
```
GET /api/v1/projects/{projectId}

Response:
{
  "id": "proj_abc123",
  "name": "Cyberpunk Detective",
  "slug": "cyberpunk-detective",
  "type": "series",
  "phase": "expansion",
  "expansionProgress": 75,
  "overallQuality": 0.84,
  "owner": { /* User object */ },
  "team": [ /* Team members */ ]
}
```

**List Projects**
```
GET /api/v1/projects?status=active&limit=20&offset=0

Response:
{
  "projects": [ /* Project objects */ ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

### 3.2 Chat / Conversations

**Create Conversation**
```
POST /api/v1/projects/{projectId}/conversations

Request:
{
  "name": "Main Production Chat"
}

Response:
{
  "id": "conv_456",
  "projectId": "proj_abc123",
  "name": "Main Production Chat",
  "status": "active",
  "createdAt": "2025-01-28T10:00:00Z"
}
```

**Send Message**
```
POST /api/v1/conversations/{conversationId}/messages

Request:
{
  "content": "Create a cyberpunk detective character named Sarah"
}

Response:
{
  "messageId": "msg_789",
  "role": "user",
  "content": "Create a cyberpunk detective character named Sarah",
  "timestamp": "2025-01-28T10:05:00Z",
  "agentJobId": "job_xyz"  // For tracking agent execution
}
```

**Get Conversation History**
```
GET /api/v1/conversations/{conversationId}/messages?limit=50&before=msg_789

Response:
{
  "messages": [
    {
      "id": "msg_789",
      "role": "user",
      "content": "Create a character...",
      "timestamp": "2025-01-28T10:05:00Z"
    },
    {
      "id": "msg_790",
      "role": "assistant",
      "content": "I'll create that character...",
      "agentId": "character-creator",
      "contentCards": [ /* Rich content */ ],
      "timestamp": "2025-01-28T10:05:15Z"
    }
  ],
  "hasMore": true
}
```

### 3.3 Dynamic Content (Open MongoDB)

**Generic endpoint for any collection:**

**Create Document**
```
POST /api/v1/projects/{projectId}/content/{collectionType}

Request:
{
  "name": "Sarah Chen",
  "content": {
    "role": "protagonist",
    "personality": {
      "traits": ["analytical", "street-smart"]
    }
  }
}

Response:
{
  "_id": "char_001",
  "projectId": "proj_abc123",
  "collectionType": "character",
  "name": "Sarah Chen",
  "qualityRating": 0.87,
  "brainValidated": true,
  "createdAt": "2025-01-28T10:06:00Z"
}
```

**Get Document**
```
GET /api/v1/projects/{projectId}/content/{collectionType}/{documentId}

Response:
{
  "_id": "char_001",
  "name": "Sarah Chen",
  "content": { /* Full content */ },
  "qualityRating": 0.87,
  "brainValidated": true
}
```

**List Documents**
```
GET /api/v1/projects/{projectId}/content/{collectionType}?limit=20&offset=0

Response:
{
  "documents": [ /* Document objects */ ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

**Update Document**
```
PATCH /api/v1/projects/{projectId}/content/{collectionType}/{documentId}

Request:
{
  "content": {
    "age": 33  // Partial update
  }
}

Response:
{
  "_id": "char_001",
  "name": "Sarah Chen",
  "content": { /* Updated content */ },
  "updatedAt": "2025-01-28T10:07:00Z"
}
```

### 3.4 Brain / Validation

**Validate Content**
```
POST /api/v1/projects/{projectId}/brain/validate

Request:
{
  "type": "character",
  "data": {
    "name": "Sarah Chen",
    "content": { /* Content to validate */ }
  }
}

Response:
{
  "qualityRating": 0.87,
  "qualityDimensions": {
    "coherence": 0.89,
    "creativity": 0.85,
    "technical": 0.88,
    "consistency": 0.86,
    "userIntent": 0.90
  },
  "brainValidated": true,
  "contradictions": [],
  "suggestions": [
    "Consider adding more backstory details"
  ],
  "relatedContent": [
    {"type": "character", "id": "char_002", "similarity": 0.75}
  ]
}
```

**Semantic Search**
```
POST /api/v1/projects/{projectId}/brain/search

Request:
{
  "query": "detective characters with tech skills",
  "types": ["character"],
  "limit": 10
}

Response:
{
  "results": [
    {
      "type": "character",
      "id": "char_001",
      "name": "Sarah Chen",
      "similarity": 0.92,
      "snippet": "Former corporate security, tech-savvy detective"
    }
  ]
}
```

### 3.5 Media / Assets

**Upload File**
```
POST /api/v1/media/upload

Content-Type: multipart/form-data

Request:
{
  file: [binary data],
  projectId: "proj_abc123",
  linkedDocument: {
    collection: "characters",
    documentId: "char_001",
    field: "portraitImage"
  }
}

Response:
{
  "id": "media_789",
  "filename": "sarah_portrait.png",
  "url": "https://cdn.aladdin.com/proj_abc123/sarah_portrait.png",
  "mimeType": "image/png",
  "filesize": 1024000,
  "width": 1024,
  "height": 1024
}
```

### 3.6 Image Generation

**Generate Master Reference**
```
POST /api/v1/projects/{projectId}/images/generate/reference

Request:
{
  "subjectType": "character",
  "subjectId": "char_001",
  "subjectName": "Sarah Chen",
  "description": "Cyberpunk detective, 32 years old...",
  "style": "photorealistic"
}

Response:
{
  "jobId": "job_img_001",
  "status": "queued",
  "estimatedTime": 30  // seconds
}
```

**Generate 360° Profile**
```
POST /api/v1/projects/{projectId}/images/generate/profile360

Request:
{
  "subjectType": "character",
  "subjectId": "char_001",
  "masterReferenceId": "media_789"
}

Response:
{
  "jobId": "job_prof_001",
  "status": "queued",
  "estimatedTime": 180  // seconds for all 12 images
}
```

**Generate Composite Shot**
```
POST /api/v1/projects/{projectId}/images/generate/composite

Request:
{
  "description": "Sarah in orange jacket in the park",
  "references": {
    "character": "char_001",
    "clothing": ["jacket_orange_001"],
    "location": "location_park_001"
  },
  "shot": {
    "cameraAngle": "medium",
    "lighting": "natural daylight"
  },
  "model": "nano_banana"
}

Response:
{
  "jobId": "job_comp_001",
  "status": "queued",
  "estimatedTime": 45
}
```

**Check Generation Status**
```
GET /api/v1/jobs/{jobId}

Response:
{
  "jobId": "job_img_001",
  "type": "image_generation",
  "status": "complete",
  "result": {
    "mediaId": "media_790",
    "url": "https://cdn.aladdin.com/...",
    "qualityRating": 0.89
  },
  "createdAt": "2025-01-28T10:10:00Z",
  "completedAt": "2025-01-28T10:10:25Z"
}
```

---

## 4. GraphQL API

### Schema

```graphql
type Query {
  # Projects
  project(id: ID!): Project
  projects(status: ProjectStatus, limit: Int, offset: Int): ProjectConnection
  
  # Content
  character(projectId: ID!, id: ID!): Character
  characters(projectId: ID!, limit: Int): [Character!]!
  scene(projectId: ID!, id: ID!): Scene
  scenes(projectId: ID!, limit: Int): [Scene!]!
  
  # Brain
  brainSearch(projectId: ID!, query: String!, types: [ContentType!]): [BrainSearchResult!]!
  
  # Conversations
  conversation(id: ID!): Conversation
  messages(conversationId: ID!, limit: Int, before: ID): MessageConnection
}

type Mutation {
  # Projects
  createProject(input: CreateProjectInput!): Project!
  updateProject(id: ID!, input: UpdateProjectInput!): Project!
  
  # Conversations
  createConversation(projectId: ID!, name: String!): Conversation!
  sendMessage(conversationId: ID!, content: String!): Message!
  
  # Content
  createCharacter(projectId: ID!, input: CharacterInput!): Character!
  updateCharacter(projectId: ID!, id: ID!, input: CharacterInput!): Character!
  
  # Images
  generateReference(projectId: ID!, input: GenerateReferenceInput!): ImageJob!
  generateComposite(projectId: ID!, input: GenerateCompositeInput!): ImageJob!
}

type Subscription {
  # Real-time updates
  conversationUpdated(conversationId: ID!): ConversationUpdate!
  agentStatus(jobId: ID!): AgentStatusUpdate!
  imageGenerationStatus(jobId: ID!): ImageJobUpdate!
}

type Project {
  id: ID!
  name: String!
  slug: String!
  type: ProjectType!
  phase: ProjectPhase!
  status: ProjectStatus!
  expansionProgress: Float!
  compactingProgress: Float!
  overallQuality: Float
  owner: User!
  team: [TeamMember!]!
  createdAt: DateTime!
}

type Character {
  _id: ID!
  projectId: ID!
  name: String!
  content: CharacterContent!
  qualityRating: Float
  brainValidated: Boolean!
  createdAt: DateTime!
}

type Message {
  id: ID!
  role: MessageRole!
  content: String!
  agentId: String
  contentCards: [ContentCard!]
  timestamp: DateTime!
}

enum ProjectType {
  MOVIE
  SERIES
}

enum ProjectPhase {
  EXPANSION
  COMPACTING
  COMPLETE
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

### Example Queries

**Get Project with Characters**
```graphql
query GetProjectWithCharacters($projectId: ID!) {
  project(id: $projectId) {
    id
    name
    phase
    overallQuality
  }
  characters(projectId: $projectId, limit: 10) {
    _id
    name
    content {
      role
      personality {
        traits
      }
    }
    qualityRating
  }
}
```

**Create Character**
```graphql
mutation CreateCharacter($projectId: ID!, $input: CharacterInput!) {
  createCharacter(projectId: $projectId, input: $input) {
    _id
    name
    qualityRating
    brainValidated
  }
}
```

---

## 5. WebSocket API

### Connection

```javascript
const ws = new WebSocket('wss://api.aladdin.com/api/v1/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  token: 'eyJhbGc...'
}));
```

### Message Types

**Subscribe to Conversation**
```json
{
  "type": "subscribe",
  "channel": "conversation",
  "conversationId": "conv_456"
}
```

**Agent Status Updates**
```json
{
  "type": "agent_status",
  "jobId": "job_xyz",
  "status": "running",
  "agent": "character-creator",
  "event": {
    "type": "thinking",
    "content": "Analyzing character profile..."
  },
  "timestamp": "2025-01-28T10:05:05Z"
}
```

**Content Preview**
```json
{
  "type": "content_preview",
  "conversationId": "conv_456",
  "content": {
    "type": "character",
    "data": {
      "name": "Sarah Chen",
      "role": "protagonist"
    },
    "qualityRating": 0.87,
    "brainValidated": true
  },
  "actions": ["ingest", "modify", "discard"],
  "timestamp": "2025-01-28T10:05:20Z"
}
```

**Message Complete**
```json
{
  "type": "message_complete",
  "conversationId": "conv_456",
  "messageId": "msg_790",
  "content": "Character profile created successfully!",
  "timestamp": "2025-01-28T10:05:30Z"
}
```

**Image Generation Progress**
```json
{
  "type": "image_generation_progress",
  "jobId": "job_img_001",
  "status": "processing",
  "progress": 0.65,
  "message": "Generating image...",
  "timestamp": "2025-01-28T10:10:15Z"
}
```

---

## 6. Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid project type",
    "details": {
      "field": "type",
      "expected": ["movie", "series"],
      "received": "invalid"
    },
    "requestId": "req_abc123"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing auth token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `BRAIN_VALIDATION_FAILED` | 422 | Content failed Brain validation |
| `AGENT_ERROR` | 500 | Agent execution failed |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 7. Rate Limiting

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1643392800
```

**Limits by Tier:**
- Free: 100 requests/hour
- Pro: 1000 requests/hour
- Enterprise: 10000 requests/hour

---

## 8. Pagination

**Cursor-based pagination:**
```
GET /api/v1/projects/{projectId}/content/characters?limit=20&cursor=eyJpZCI6ImNoYXJfMDIwIn0

Response:
{
  "documents": [ /* Characters */ ],
  "pageInfo": {
    "hasNextPage": true,
    "hasPreviousPage": false,
    "startCursor": "eyJpZCI6ImNoYXJfMDAxIn0",
    "endCursor": "eyJpZCI6ImNoYXJfMDIwIn0"
  }
}
```

---

**Status**: API Design Complete ✓  
**Next**: Authentication & Authorization (Section 4)