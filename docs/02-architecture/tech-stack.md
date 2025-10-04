# Technology Stack

**Purpose**: Complete overview of technologies used in Aladdin  
**Updated**: October 4, 2025  
**Version**: 1.0.0

---

## 🎯 Overview

Aladdin is built on a modern, scalable technology stack designed for AI-powered content creation. The architecture prioritizes performance, scalability, and developer experience.

---

## 🖥️ Frontend Stack

### Core Framework
- **Next.js 15.4** - Full-stack React framework
  - App Router for modern routing
  - Server Components for performance
  - API Routes for backend functionality
  - Built-in optimizations

### UI Framework
- **Shadcn/ui** - Production-ready component library
  - Built on Radix UI primitives
  - Accessible by default
  - Customizable themes
  - TypeScript support

### Styling
- **Tailwind CSS 4.1** - Utility-first CSS framework
  - Rapid UI development
  - Consistent design system
  - Responsive utilities
  - Dark mode support

### State Management
- **TanStack Query (React Query) v5** - Data fetching and caching
  - Server state synchronization
  - Background updates
  - Optimistic updates
  - DevTools integration

### Forms
- **React Hook Form** - Performant forms
- **Zod** - TypeScript-first schema validation
  - Type-safe form validation
  - Automatic inference
  - Composable schemas

### Animations
- **Framer Motion** - Production-ready animations
  - Smooth transitions
  - Gesture support
  - Physics-based animations

---

## 🗄️ Backend Stack

### CMS & Data Layer
- **PayloadCMS 3.57** - Headless CMS
  - TypeScript-first
  - Admin panel included
  - Rich relationships
  - Hooks and plugins
  - Local API for server components

### Databases
- **MongoDB 7+** - Primary database
  - Document-oriented storage
  - Flexible schemas
  - Horizontal scaling
  - Aggregation framework

- **Neo4j 5+** - Knowledge graph ("The Brain")
  - Graph database
  - Relationship queries
  - Embedding storage
  - Pattern matching

- **Redis 7+** - Cache and queue
  - In-memory data store
  - Pub/Sub messaging
  - Rate limiting
  - Session storage

### Task Queue
- **BullMQ** - Job queue system
  - Redis-backed
  - Job priorities
  - Delayed jobs
  - Retry mechanisms

---

## 🤖 AI & ML Stack

### AI Framework
- **Vercel AI SDK** - AI integration framework
  - Unified LLM interface
  - Streaming support
  - Tool calling
  - Structured outputs

### LLM Provider
- **OpenRouter** - LLM access layer
  - Multiple model access
  - Load balancing
  - Cost optimization
  - API key management

### Default Model
- **Claude Sonnet 4.5** - Primary LLM
  - High-quality responses
  - Long context window
  - Fast inference
  - Cost-effective

### Media Generation
- **FAL.ai** - Image and video generation
  - Text-to-image (FLUX models)
  - Image-to-video
  - Composite generation
  - Fast inference

- **ElevenLabs** - Voice synthesis
  - Realistic voices
  - Emotion control
  - Multi-language support
  - Custom voice cloning

### Embeddings
- **OpenAI Ada-002** - Text embeddings
  - 1536-dimensional vectors
  - Semantic search
  - Similarity matching
  - Cost-effective

---

## ☁️ Infrastructure & Services

### Storage
- **Cloudflare R2** - Object storage
  - S3-compatible API
  - Built-in CDN
  - No egress fees
  - Global distribution

### Deployment
- **Ubuntu Server** - Production OS
  - Native installation
  - PM2 process management
  - Nginx reverse proxy
  - Let's Encrypt SSL

### Monitoring
- **PM2** - Process management
  - Cluster mode
  - Zero-downtime reloads
  - Log management
  - Monitoring dashboard

---

## 🛠️ Development Tools

### Package Manager
- **pnpm** - Fast, disk space efficient package manager
  - Monorepo support
  - Strict dependencies
  - Fast installations
  - Symlink strategy

### Language & Runtime
- **TypeScript 5.7** - Type-safe JavaScript
  - Static typing
  - Modern features
  - Great IDE support
  - Incremental compilation

- **Node.js 20 LTS** - JavaScript runtime
  - Long-term support
  - Performance improvements
  - ES modules support
  - Native modules

### Testing
- **Vitest** - Unit testing framework
  - Fast test runner
  - TypeScript support
  - Mocking utilities
  - Watch mode

- **Playwright** - End-to-end testing
  - Multi-browser support
  - Mobile testing
  - Visual testing
  - CI/CD integration

### Code Quality
- **ESLint** - JavaScript linting
  - Code consistency
  - Error prevention
  - Auto-fixing
  - Custom rules

- **Prettier** - Code formatting
  - Consistent style
  - Automatic formatting
  - Editor integration
  - Minimal config

---

## 📦 Key Dependencies

### Production Dependencies

```json
{
  "dependencies": {
    "next": "15.4.4",
    "@payloadcms/next": "3.57.0",
    "@payloadcms/db-mongodb": "3.57.0",
    "@payloadcms/ui": "3.57.0",
    "@payloadcms/richtext-lexical": "3.57.0",
    "@payloadcms/storage-s3": "3.57.0",
    "@payloadcms/plugin-cloud-storage": "3.57.0",
    "ai": "^5.0.60",
    "@ai-sdk/openai": "^2.0.42",
    "@openrouter/ai-sdk-provider": "^1.2.0",
    "@fal-ai/serverless-client": "^0.14.0",
    "@elevenlabs/elevenlabs-js": "^2.16.0",
    "mongodb": "^6.20.0",
    "neo4j-driver": "^5.28.0",
    "ioredis": "^5.4.2",
    "bullmq": "^5.59.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "@tanstack/react-query": "^5.90.2",
    "react-hook-form": "^7.63.0",
    "zod": "^3.24.1",
    "tailwindcss": "^4.1.13",
    "@radix-ui/react-*": "latest",
    "framer-motion": "^11.0.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.544.0"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@playwright/test": "1.54.1",
    "@testing-library/react": "16.3.0",
    "vitest": "^3.2.3",
    "typescript": "5.7.3",
    "eslint": "^9.16.0",
    "eslint-config-next": "15.4.4",
    "prettier": "^3.4.2"
  }
}
```

---

## 🏗️ Architecture Decisions

### Why Next.js?
- **Full-stack solution**: Frontend and backend in one framework
- **Performance**: Server components and automatic optimizations
- **Developer Experience**: Great TypeScript support and DX
- **Ecosystem**: Large plugin and component ecosystem

### Why PayloadCMS?
- **TypeScript-first**: Native TypeScript support
- **Flexible**: Can be headless or include admin UI
- **Local API**: Direct database access in server components
- **Extensible**: Plugin system for custom functionality

### Why MongoDB?
- **Flexible Schema**: Perfect for evolving AI-generated content
- **Scalable**: Horizontal scaling with sharding
- **Performance**: Fast reads and writes
- **Ecosystem**: Large tooling and community support

### Why Neo4j?
- **Relationships**: Natural fit for story connections
- **Embeddings**: Native vector storage and similarity search
- **Pattern Matching**: Powerful graph queries
- **Validation**: Consistency checking across content

### Why Vercel AI SDK?
- **Unified Interface**: Single API for multiple LLM providers
- **Streaming Support**: Real-time token streaming
- **Tool Calling**: Built-in function calling support
- **Type Safety**: Full TypeScript support

---

## 🔄 Version Management

### Semantic Versioning
- **Major (X.0.0)**: Breaking changes
- **Minor (X.Y.0)**: New features, backward compatible
- **Patch (X.Y.Z)**: Bug fixes, backward compatible

### Dependency Updates
- **Weekly**: Check for security updates
- **Monthly**: Review minor version updates
- **Quarterly**: Plan major version upgrades

### Lock Files
- **pnpm-lock.yaml**: Exact dependency versions
- **Commit**: Always commit lock file changes
- **Reproducible**: Ensures consistent installs

---

## 🚀 Performance Considerations

### Frontend Optimization
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Automatic font loading
- **Bundle Analysis**: Regular bundle size monitoring

### Backend Optimization
- **Database Indexes**: Optimized query patterns
- **Caching Strategy**: Multi-layer caching (memory, Redis)
- **Connection Pooling**: Database connection reuse
- **Background Jobs**: Long-running tasks in queue

### AI Optimization
- **Token Management**: Efficient prompt engineering
- **Model Selection**: Right model for right task
- **Caching**: Cache AI responses when appropriate
- **Batch Processing**: Group similar requests

---

## 🔒 Security Considerations

### Application Security
- **Input Validation**: Zod schemas for all inputs
- **Authentication**: PayloadCMS built-in auth
- **Authorization**: Role-based access control
- **Rate Limiting**: API endpoint protection

### Infrastructure Security
- **HTTPS**: SSL/TLS encryption everywhere
- **Firewall**: UFW configuration
- **Updates**: Regular security patches
- **Monitoring**: Intrusion detection

### Data Security
- **Encryption**: Data at rest and in transit
- **Backups**: Regular encrypted backups
- **Access Control**: Minimal privilege principle
- **Audit Logs**: Track all data access

---

## 📚 Related Documentation

- [System Overview](./system-overview.md) - High-level architecture
- [Database Architecture](./database.md) - MongoDB and Neo4j details
- [AI Agent System](./agent-system.md) - Agent framework details
- [Vercel AI SDK Integration](../04-ai-agents/vercel-ai-sdk.md) - Current AI implementation
- [Development Workflow](../03-development/workflow.md) - How to contribute
- [Deployment Guide](../07-deployment/ubuntu-deployment.md) - Production setup
- [Quick Start Guide](../01-getting-started/quick-start.md) - Local development
- [API Reference](../06-apis/) - Integration documentation

---

**Document Version**: 1.0.0  
**Last Updated**: October 4, 2025  
**Next Review**: January 4, 2026