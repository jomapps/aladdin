# Aladdin Implementation Roadmap V2.0

**Version**: 2.0.0  
**Last Updated**: January 30, 2025  
**Status**: Enhanced Implementation Plan

---

## Executive Summary

This enhanced roadmap incorporates modern web development practices, improved UX patterns, and scalable architecture to build Aladdin as a production-ready AI movie production platform.

### Key Improvements

1. **Modern UI Framework** - Shadcn/ui + Tailwind CSS + Framer Motion
2. **Real-Time Collaboration** - WebSocket-based presence and live updates
3. **Advanced Caching** - Multi-layer caching with smart invalidation
4. **Agent Pool Management** - Reusable agent instances for better performance
5. **Streaming Responses** - Token-by-token streaming for better UX
6. **Optimistic Updates** - Instant UI feedback with rollback
7. **Edge Deployment** - Critical APIs deployed to edge for low latency
8. **Type Safety** - End-to-end TypeScript with Zod validation

---

## Technology Stack (Enhanced)

### Frontend
- **Framework**: Next.js 15.4+ (App Router, Server Components)
- **UI Library**: Shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS 3.4+ with custom design system
- **Animations**: Framer Motion 11+
- **Icons**: Lucide React
- **State Management**: React Query (TanStack Query) v5
- **Forms**: React Hook Form + Zod validation
- **Real-time**: WebSocket (native) or Pusher/Ably

### Backend
- **CMS**: PayloadCMS 3.57+
- **Database**: MongoDB 7+ (dual setup)
- **Cache**: Redis 7+ (multi-layer caching)
- **Search**: Neo4j 5+ (Brain - embeddings)
- **Queue**: Celery + Redis (background jobs)
- **Storage**: Cloudflare R2 (S3-compatible)

### AI/ML
- **Agent Framework**: @codebuff/sdk
- **Image Generation**: FAL.ai, Replicate
- **Video Generation**: RunwayML, Pika Labs
- **Voice**: ElevenLabs
- **Embeddings**: OpenAI Ada-002 or Jina AI

### DevOps
- **Deployment**: Vercel (frontend) + Railway/Fly.io (services)
- **Monitoring**: Sentry, LogRocket
- **Analytics**: PostHog, Plausible
- **CI/CD**: GitHub Actions
- **Testing**: Vitest, Playwright, Testing Library

---

## Phase-by-Phase Implementation

### Phase 1: Modern Foundation (Weeks 1-4)

#### Week 1: Project Setup & UI Framework

**Goals**: 
- Initialize Next.js with modern tooling
- Setup Shadcn/ui component library
- Configure Tailwind CSS design system
- Setup development environment

**Tasks**:

1. **Initialize Project**
   ```bash
   pnpm create next-app@latest aladdin --typescript --tailwind --app
   cd aladdin
   pnpm add @payloadcms/next payload @payloadcms/db-mongodb
   ```

2. **Install UI Dependencies**
   ```bash
   # Shadcn/ui setup
   npx shadcn@latest init
   
   # Install core components
   npx shadcn@latest add button card dialog input textarea
   npx shadcn@latest add dropdown-menu select tabs toast
   npx shadcn@latest add resizable scroll-area separator
   npx shadcn@latest add avatar badge label switch
   
   # Additional libraries
   pnpm add framer-motion lucide-react
   pnpm add @tanstack/react-query @tanstack/react-query-devtools
   pnpm add react-hook-form @hookform/resolvers zod
   pnpm add sonner # Toast notifications
   ```

3. **Configure Design System**
   - Create `tailwind.config.ts` with custom theme
   - Define color palette (primary, accent, quality indicators)
   - Setup typography scale
   - Configure animations

4. **Setup React Query**
   ```typescript
   // app/providers.tsx
   'use client'
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
   
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 60 * 1000,
         refetchOnWindowFocus: false,
       },
     },
   })
   
   export function Providers({ children }) {
     return (
       <QueryClientProvider client={queryClient}>
         {children}
       </QueryClientProvider>
     )
   }
   ```

**Deliverables**:
- ✅ Next.js project with TypeScript
- ✅ Shadcn/ui components installed
- ✅ Custom design system configured
- ✅ React Query setup
- ✅ Development server running

---

#### Week 2: PayloadCMS & Database Setup

**Goals**:
- Configure PayloadCMS with MongoDB
- Create core collections (Projects, Users, Media)
- Setup authentication
- Configure Cloudflare R2 storage

**Tasks**:

1. **PayloadCMS Configuration**
   ```typescript
   // src/payload.config.ts
   import { buildConfig } from 'payload'
   import { mongooseAdapter } from '@payloadcms/db-mongodb'
   import { lexicalEditor } from '@payloadcms/richtext-lexical'
   import { s3Storage } from '@payloadcms/storage-s3'
   
   export default buildConfig({
     admin: {
       user: 'users',
     },
     collections: [
       Users,
       Projects,
       Media,
     ],
     db: mongooseAdapter({
       url: process.env.DATABASE_URI!,
     }),
     editor: lexicalEditor(),
     plugins: [
       s3Storage({
         collections: { media: true },
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

2. **Create Collections**
   - `src/collections/Users.ts` - Authentication
   - `src/collections/Projects.ts` - Project metadata
   - `src/collections/Media.ts` - File uploads
   - `src/collections/Conversations.ts` - Chat history

3. **Setup Open MongoDB Connection**
   ```typescript
   // src/lib/db/openDatabase.ts
   import { MongoClient } from 'mongodb'
   
   const client = new MongoClient(process.env.DATABASE_URI_OPEN!)
   
   export async function getOpenDatabase(projectSlug: string) {
     await client.connect()
     return client.db(`open_${projectSlug}`)
   }
   ```

**Deliverables**:
- ✅ PayloadCMS configured
- ✅ Core collections created
- ✅ Authentication working
- ✅ R2 storage integrated
- ✅ Open MongoDB connection setup

---

#### Week 3: Redis Caching & Real-Time Infrastructure

**Goals**:
- Setup Redis for caching
- Implement multi-layer cache
- Setup WebSocket server
- Create presence system

**Tasks**:

1. **Redis Setup**
   ```bash
   pnpm add ioredis
   ```
   
   ```typescript
   // src/lib/redis.ts
   import Redis from 'ioredis'
   
   export const redis = new Redis(process.env.REDIS_URL!)
   ```

2. **Multi-Layer Cache Manager**
   ```typescript
   // src/lib/cache/CacheManager.ts
   import { LRUCache } from 'lru-cache'
   import { redis } from '@/lib/redis'
   
   const memoryCache = new LRUCache({ max: 500, ttl: 5 * 60 * 1000 })
   
   export class CacheManager {
     async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
       // Check memory cache
       const cached = memoryCache.get(key)
       if (cached) return cached as T
       
       // Check Redis
       const redisCached = await redis.get(key)
       if (redisCached) {
         const data = JSON.parse(redisCached)
         memoryCache.set(key, data)
         return data
       }
       
       // Fetch from source
       const data = await fetcher()
       memoryCache.set(key, data)
       await redis.setex(key, 3600, JSON.stringify(data))
       return data
     }
   }
   ```

3. **WebSocket Server**
   ```typescript
   // app/api/v1/ws/route.ts
   import { presenceManager } from '@/lib/websocket/PresenceManager'
   
   export async function GET(req: Request) {
     // Upgrade to WebSocket
     // Handle presence, cursors, live updates
   }
   ```

**Deliverables**:
- ✅ Redis caching working
- ✅ Multi-layer cache implemented
- ✅ WebSocket server running
- ✅ Presence system functional

---

#### Week 4: Authentication & Protected Routes

**Goals**:
- Implement login/logout flow
- Create protected dashboard routes
- Setup user session management
- Create basic dashboard layout

**Tasks**:

1. **Login Page**
   ```typescript
   // app/page.tsx
   import { redirect } from 'next/navigation'
   import { getPayload } from 'payload'
   import config from '@payload-config'
   
   export default async function HomePage() {
     const payload = await getPayload({ config })
     const { user } = await payload.auth({ req })
     
     if (user) redirect('/dashboard')
     
     return <LoginForm />
   }
   ```

2. **Protected Dashboard Layout**
   ```typescript
   // app/dashboard/layout.tsx
   import { redirect } from 'next/navigation'
   
   export default async function DashboardLayout({ children }) {
     const { user } = await getUser()
     if (!user) redirect('/')
     
     return (
       <div className="flex h-screen">
         <Sidebar />
         <main className="flex-1">{children}</main>
       </div>
     )
   }
   ```

**Deliverables**:
- ✅ Login/logout working
- ✅ Protected routes functional
- ✅ Dashboard layout created
- ✅ User session management

---

### Phase 2: Chat Interface & Agents (Weeks 5-8)

#### Week 5-6: Modern Chat UI

**Goals**:
- Build responsive chat interface
- Implement message streaming
- Create content preview cards
- Add real-time updates

**Key Components**:
- `ChatContainer` - Main chat layout with resizable panels
- `ChatMessages` - Message list with virtualization
- `ChatInput` - Smart input with suggestions
- `ContentPreviewCard` - Rich content cards with actions
- `StreamingMessage` - Token-by-token streaming display

**Deliverables**:
- ✅ Chat interface functional
- ✅ Message streaming working
- ✅ Content cards displaying
- ✅ Real-time updates active

---

#### Week 7-8: Agent Integration

**Goals**:
- Setup @codebuff/sdk
- Implement agent pool management
- Create Master Orchestrator
- Build first department head (Character)

**Key Features**:
- Agent pooling for performance
- Streaming responses
- Error handling with retry
- Cost tracking

**Deliverables**:
- ✅ Agent system working
- ✅ Master Orchestrator functional
- ✅ Character department operational
- ✅ First character created via chat

---

## Continue with remaining phases...

