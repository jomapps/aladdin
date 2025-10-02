# Aladdin Documentation Index

**Last Updated**: January 2025
**Project**: Aladdin AI Movie Production Platform
**Architecture**: PayloadCMS 3.x + Next.js 15 + MongoDB + AI Agents

---

## 🚨 CRITICAL: Read This First

### ⭐ **[AGENT_ARCHITECTURE_CLARIFIED.md](./AGENT_ARCHITECTURE_CLARIFIED.md)** - START HERE

**Before reading any architecture documents, understand what's actually implemented:**

- ✅ **@codebuff/sdk** is the ONLY agent framework (fully operational)
- ❌ **LangGraph** is NOT implemented (documentation only)
- ❌ **Domain MCP services** are NOT built (only Brain MCP exists)
- ⚠️ **3 of 50+ agents** configured (framework ready for expansion)

### Related Reality Check Documents:

| Document | Purpose |
|----------|---------|
| [AGENT_ARCHITECTURE_CLARIFIED.md](./AGENT_ARCHITECTURE_CLARIFIED.md) | **Main guide** - What's implemented vs documented |
| [ACTUAL_IMPLEMENTATION_STATUS.md](./ACTUAL_IMPLEMENTATION_STATUS.md) | Detailed component-by-component analysis |
| [IMPLEMENTATION_REALITY_CHECK.md](./IMPLEMENTATION_REALITY_CHECK.md) | Quick reference for developers |
| [idea/NEEDS_CLARIFICATION.md](./idea/NEEDS_CLARIFICATION.md) | Full discrepancy analysis |

**Why This Matters**: Many architecture documents describe future plans as if they were current implementation. These reality check documents clarify what actually exists in the codebase.

---

## 🚀 Quick Start

### For New Developers
1. [Project Overview](./idea/PROJECT_OVERVIEW.md) - Start here to understand the project
2. [Quick Start Database](./QUICK_START_DATABASE.md) - Set up your local environment
3. [Development Phases](./DEVELOPMENT_PHASES.md) - Understand the implementation roadmap

### For Deployment
1. [Deployment Guide - Ubuntu Server](./DEPLOYMENT_GUIDE_UBUNTU.md) - **PRIMARY** deployment guide
2. [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Quick checklist for deployment steps
3. [Deployment Ready Checklist](./DEPLOYMENT_READY_CHECKLIST.md) - Pre-deployment verification

### For API Integration
1. [API Design](./API_DESIGN.md) - Complete API architecture and patterns
2. [Authentication](./AUTHENTICATION.md) - Authentication and authorization system
3. [AI Agent Integration](./AI_AGENT_INTEGRATION.md) - How to integrate with AI agents

---

## 📚 Documentation by Category

### 1. System Architecture

| Document | Purpose | Audience |
|----------|---------|----------|
| [Technical Analysis Report](./TECHNICAL_ANALYSIS_REPORT.md) | Comprehensive technical architecture overview | Architects, Tech Leads |
| [Specification](./SPECIFICATION.md) | System specifications and requirements | All stakeholders |
| [Data Models](./DATA_MODELS.md) | Database schemas and relationships | Backend developers |
| [Database Management](./DATABASE_MANAGEMENT.md) | MongoDB management and best practices | DevOps, Developers |

### 2. AI Agents & Orchestration

| Document | Purpose | Audience |
|----------|---------|----------|
| [Hierarchical Agent Structure](./HIERARCHICAL_AGENT_STRUCTURE.md) | AI agent organization and roles | AI developers, Architects |
| [AI Agent Integration](./AI_AGENT_INTEGRATION.md) | How to integrate with agents | Developers |
| [Qualified Information Pattern](./QUALIFIED_INFORMATION_PATTERN.md) | Data quality and validation patterns | All developers |

#### Agent-Specific Documentation
- [Data Preparation Agent - Final Status](./agents/FINAL_STATUS_REPORT.md) - Production-ready status
- [Configuration System Guide](./agents/configuration-system-guide.md) - Entity-specific configurations
- [Phase 5 Architecture Index](./agents/PHASE_5_INDEX.md) - Configuration system catalog
- [Prompt Engineering Guide](./agents/prompt-engineering-guide.md) - LLM prompt best practices
- [Testing Strategy](./agents/testing-strategy.md) - Agent testing approaches

### 3. Feature-Specific Guides

| Document | Purpose | Audience |
|----------|---------|----------|
| [Video Generation Pipeline](./VIDEO_GENERATION_PIPELINE.md) | Video generation workflow | Developers, Product |
| [Redis Configuration](./REDIS-CONFIGURATION.md) | Redis setup and usage | Backend developers |
| [Accessibility Guide](./accessibility-guide.md) | WCAG compliance and best practices | Frontend developers |

### 4. API Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [API Design](./API_DESIGN.md) | Complete API architecture | Backend developers |
| [Orchestrator API](./api/orchestrator-api.md) | Orchestrator service endpoints | Full-stack developers |
| [Orchestrator Quick Start](./api/orchestrator-quick-start.md) | Quick API integration guide | All developers |
| [Orchestrator Implementation Summary](./api/orchestrator-implementation-summary.md) | Implementation details | Backend developers |

### 5. UI/UX Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [UI README](./ui/README.md) | UI architecture overview | Frontend developers |
| [Components Guide](./ui/COMPONENTS.md) | React component library | Frontend developers |
| [Developer Guide](./ui/DEVELOPER_GUIDE.md) | UI development best practices | Frontend developers |
| [User Guide](./ui/USER_GUIDE.md) | End-user documentation | Product, QA |
| [Quick Start](./ui/QUICK_START.md) | Get started with UI development | New frontend developers |
| [State Management](./ui/STATE_MANAGEMENT.md) | Zustand store architecture | Frontend developers |
| [Performance Guide](./ui/PERFORMANCE.md) | UI optimization techniques | Frontend developers |
| [Testing Guide](./ui/TESTING_GUIDE.md) | UI testing strategies | QA, Frontend developers |

#### UI Implementation Status
- [Completion Summary](./ui/COMPLETION_SUMMARY.md) - What's been accomplished
- [Implementation Status](./ui/IMPLEMENTATION_STATUS.md) - Current progress
- [Implementation Summary](./ui/IMPLEMENTATION_SUMMARY.md) - Feature specifications
- [Architecture Diagrams](./ui/ARCHITECTURE_DIAGRAMS.md) - Visual architecture reference
- [Visual Reference](./ui/VISUAL_REFERENCE.md) - Design system and components

### 6. Testing Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [Dashboard Test Summary](../DASHBOARD_TEST_SUMMARY.md) | Dashboard testing overview | QA |
| [Run Project Test](../RUN_PROJECT_TEST.md) | Testing guide for projects | QA, Developers |
| [Phase Test Strategies](./testing/PHASE*_TEST_STRATEGY.md) | Phase-specific testing plans | QA |
| [E2E Test Summary](./testing/E2E_TEST_SUMMARY.md) | Playwright E2E tests | QA, Developers |
| [E2E Test Results](./testing/E2E_TEST_RESULTS.md) | Latest test results | QA |
| [Mock Data Removal](./testing/MOCK_DATA_REMOVAL_COMPLETE.md) | Real data integration status | Developers |

### 7. Research & Design Decisions

| Document | Purpose | Audience |
|----------|---------|----------|
| [Phase 2 Technical Research](./research/PHASE2_TECHNICAL_RESEARCH.md) | PayloadCMS research | Architects |
| [Phase 3 Brain Research](./research/PHASE3_BRAIN_RESEARCH.md) | Brain service architecture | Backend developers |
| [Phase 4 Departments Research](./research/PHASE4_DEPARTMENTS_RESEARCH.md) | Department system design | Architects |
| [Phase 5 FAL Research](./research/phase-5-fal-research.md) | Image generation research | Developers |
| [Phase 6 Video Research](./research/phase-6-video-research.md) | Video generation research | Developers |
| [Phase 8 Advanced Research](./research/phase-8-advanced-research.md) | Advanced features research | Architects |
| [Dynamic Agents Research](./research/dynamic-agents-research.md) | Dynamic agent system design | AI developers |

### 8. Architecture by Phase

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | [Architecture](./architecture/PHASE1_ARCHITECTURE.md) | ✅ Complete |
| Phase 2 | [Architecture](./architecture/PHASE2_ARCHITECTURE.md) | ✅ Complete |
| Phase 3 | [Architecture](./architecture/PHASE3_ARCHITECTURE.md) | ✅ Complete |
| Phase 3 | [Implementation Status](./architecture/PHASE3_IMPLEMENTATION_STATUS.md) | ✅ Complete |
| Phase 4 | [Architecture](./architecture/PHASE4_ARCHITECTURE.md) | ✅ Complete |
| Phase 5 | [Image Generation](./architecture/phase-5-image-generation.md) | ✅ Complete |
| Phase 6 | [Video Generation](./architecture/phase-6-video-generation.md) | ✅ Complete |
| Phase 7 | [Production Polish](./architecture/phase-7-production-polish.md) | ✅ Complete |
| Phase 8 | [Advanced Features](./architecture/phase-8-advanced-features.md) | ✅ Complete |

---

## 🔍 Finding Documentation

### By Topic

**Authentication & Security**
- [Authentication](./AUTHENTICATION.md)
- [API Design - Security](./API_DESIGN.md#security)

**Data & Database**
- [Data Models](./DATA_MODELS.md)
- [Database Management](./DATABASE_MANAGEMENT.md)
- [Quick Start Database](./QUICK_START_DATABASE.md)

**Deployment & DevOps**
- [Deployment Guide - Ubuntu](./DEPLOYMENT_GUIDE_UBUNTU.md) ⭐ PRIMARY
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Redis Configuration](./REDIS-CONFIGURATION.md)

**AI & Agents**
- [Hierarchical Agent Structure](./HIERARCHICAL_AGENT_STRUCTURE.md)
- [AI Agent Integration](./AI_AGENT_INTEGRATION.md)
- [Agents Directory](./agents/) - All agent-specific docs

**UI & Frontend**
- [UI Directory](./ui/) - All UI documentation
- [Components](./ui/COMPONENTS.md)
- [State Management](./ui/STATE_MANAGEMENT.md)

**Testing**
- [Testing Directory](./testing/) - All testing docs
- [E2E Tests](./testing/E2E_TEST_SUMMARY.md)
- [UI Testing](./ui/TESTING_GUIDE.md)

---

## 📝 Status Documents

### Current Status
- [Daily Status (Oct 1, 2025)](./DAILY_STATUS_2025-10-01.md) - Most recent status
- [Quick Status](../QUICK_STATUS.md) - Project overview
- [Phase 8 Complete](../PHASE_8_COMPLETE.txt) - Phase 8 completion notes
- [Final System Complete](./FINAL_SYSTEM_COMPLETE.md) - System completion status

### Implementation Summaries
- [Implementation Summary](./IMPLEMENTATION-SUMMARY.md) - Overall implementation
- [Phase 8 Implementation Complete](./PHASE_8_IMPLEMENTATION_COMPLETE.md) - Phase 8 details

---

## 🎯 Documentation Standards

### File Naming Conventions
- `UPPERCASE_WITH_UNDERSCORES.md` - Major documentation files
- `lowercase-with-dashes.md` - Supporting documentation
- `PHASE_N_*.md` - Phase-specific documentation
- `*_SUMMARY.md` - Summary documents
- `*_STATUS.md` - Status tracking documents
- `*_COMPLETE.md` - Completion reports

### Document Structure
1. **Title & Metadata** - Date, version, status
2. **Overview** - What this document covers
3. **Main Content** - Organized with clear headings
4. **Examples** - Code examples where applicable
5. **References** - Links to related docs

### Status Indicators
- ✅ Complete
- 🚧 In Progress
- ⏳ Pending
- ❌ Not Started
- ⚠️ Blocked

---

## 🔄 Documentation Updates

**When to Update This Index:**
- New major documentation added
- Documentation reorganized
- Phase completed
- Architecture changes

**How to Update:**
1. Add new document to appropriate category
2. Update status indicators
3. Add cross-references
4. Update "Last Updated" date

---

## 🆘 Getting Help

**Can't find what you need?**
1. Check the category most relevant to your task
2. Use your editor's search across all docs (Ctrl+Shift+F)
3. Check the [Technical Analysis Report](./TECHNICAL_ANALYSIS_REPORT.md) for system overview
4. Review phase-specific architecture docs

**Common Starting Points:**
- **New to Project?** → [Project Overview](./idea/PROJECT_OVERVIEW.md)
- **Need to Deploy?** → [Deployment Guide Ubuntu](./DEPLOYMENT_GUIDE_UBUNTU.md)
- **Working on UI?** → [UI README](./ui/README.md)
- **Integrating Agents?** → [AI Agent Integration](./AI_AGENT_INTEGRATION.md)
- **API Development?** → [API Design](./API_DESIGN.md)
- **Testing?** → [Testing Directory](./testing/)

---

## ⚠️ Important Notes

### Deployment
**Production deployment target is Ubuntu Server with PM2 (NOT Docker)**
- Main application: Ubuntu Server + PM2 + Nginx
- Services (brain, task-queue): Have their own deployment methods
- `docker-compose.yml` in project root: **LOCAL DEVELOPMENT ONLY**

### Services
- **Brain Service** (`services/brain/` or `mcp-brain-service/`): Has own Dockerfile for its deployment
- **Task Queue** (`celery-redis/`): Has own Dockerfile for its deployment
- Main app deployment: Direct to Ubuntu, no containerization

### Documentation Maintenance
- Remove outdated information when found
- Keep deployment references consistent (Ubuntu + PM2 for production)
- Update phase completion status as work progresses
- Date status documents when creating them

---

**Last Review**: October 2, 2025  
**Next Review**: When new phases begin or major features complete
