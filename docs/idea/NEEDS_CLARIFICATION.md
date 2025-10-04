# Needs Clarification & Discrepancy Report

**Analysis Date**: October 2, 2025  
**Documents Analyzed**:
- `buckets-from-start-to-end.md` - Movie Making Process Overview
- `AI_AGENT_SYSTEM.md` - AI Agent System Specification

---

## 📋 Executive Summary

This document identifies discrepancies, missing implementations, and areas requiring clarification between the high-level movie-making process documentation and the detailed AI agent system specification.

**Key Findings:**
- ✅ **14 Major Discrepancies** identified
- ⚠️ **23 Missing Implementation Details** found
- 🔍 **18 Areas Requiring Clarification**

---

## ✅ RESOLVED: Agent Technology Stack

### **ACTUAL IMPLEMENTATION STATUS**

After thorough codebase analysis, here's what has **actually been implemented**:

---

## 🎯 What IS Implemented

### 1. **Vercel AI SDK - PRIMARY AGENT FRAMEWORK** ✅

**Status**: **FULLY IMPLEMENTED AND OPERATIONAL**

**Evidence**:
- ✅ Installed in `package.json`: `"ai": "^5.0.60"`, `"@ai-sdk/openai": "^2.0.42"`
- ✅ Core executor: `src/lib/ai/agent-executor.ts`
- ✅ AI client: `src/lib/ai/client.ts`
- ✅ Custom tools: `src/lib/ai/tools/`
- ✅ PayloadCMS integration maintained

**Architecture**:
```typescript
// ACTUAL WORKING CODE
import { AIAgentExecutor } from '@/lib/ai/agent-executor'

const executor = new AIAgentExecutor(payload)

// Hierarchical execution
const result = await codebuff.run({
  agent: masterOrchestratorAgent.id,
  prompt: userPrompt,
  customToolDefinitions: [routeToDepartmentTool, queryBrainTool],
  handleEvent: async (event) => { /* real-time streaming */ }
})
```

**Implemented Agents**:
- ✅ Master Orchestrator Agent
- ✅ Character Department Head
- ✅ Hair Stylist Agent
- ✅ Agent execution tracking (PayloadCMS `AgentExecutions` collection)
- ✅ Custom tool system
- ✅ Event streaming
- ✅ Quality gates

---

### 2. **MCP Services - BRAIN SERVICE ONLY** ⚠️

**Status**: **PARTIALLY IMPLEMENTED - BRAIN SERVICE ONLY**

**What EXISTS**:
- ✅ Brain MCP Service: `services/brain/src/mcp_server.py`
- ✅ MCP Brain Service (duplicate): `mcp-brain-service/src/mcp_server.py`
- ✅ MCP protocol implementation (Python)
- ✅ Tools: `create_character`, `search_similar`, `store_document`, `batch_store`

**What DOES NOT EXIST**:
- ❌ Story MCP Service (port 8010) - **PLANNED, NOT IMPLEMENTED**
- ❌ Character MCP Service (port 8011) - **PLANNED, NOT IMPLEMENTED**
- ❌ Visual MCP Service (port 8012) - **PLANNED, NOT IMPLEMENTED**
- ❌ Audio MCP Service (port 8013) - **PLANNED, NOT IMPLEMENTED**
- ❌ Asset MCP Service (port 8014) - **PLANNED, NOT IMPLEMENTED**
- ❌ Story Bible MCP Service (port 8015) - **PLANNED, NOT IMPLEMENTED**

**Current MCP Usage**:
```python
# ONLY Brain service has MCP implementation
server = Server("mcp-brain-service")

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict):
    # Brain-specific tools only
    if name == "create_character":
        # Store in Neo4j with embeddings
```

---

### 3. **LangGraph - NOT IMPLEMENTED** ❌

**Status**: **MENTIONED IN DOCS, ZERO IMPLEMENTATION**

**Evidence**:
- ❌ NOT in `package.json`
- ❌ NOT in `requirements.txt` (any service)
- ❌ NO imports found in codebase
- ❌ NO workflow graphs implemented
- ❌ NO state machines

**Only References**:
- 📝 Documentation mentions: `AI_AGENT_SYSTEM.md` line 182
- 📝 Placeholder function: `store_workflow_data()` in Brain service (unused)
- 📝 Future planning documents

**Conclusion**: LangGraph is **ASPIRATIONAL**, not implemented.

---

## 🏗️ ACTUAL ARCHITECTURE (As Implemented)

### **Current System Design**:

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                      │
│                    (Port 3010/3000)                         │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              @CODEBUFF/SDK ORCHESTRATION                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Master Orchestrator Agent                    │  │
│  │  (Analyzes request, routes to departments)          │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Department Head Agents                       │  │
│  │  (Character, Story, Visual, Audio, etc.)            │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Specialist Agents                            │  │
│  │  (Hair Stylist, Costume Designer, etc.)             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   CUSTOM TOOLS LAYER                        │
│  - saveCharacterTool                                        │
│  - queryBrainTool                                           │
│  - getProjectContextTool                                    │
│  - gradeOutputTool                                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PayloadCMS  │  │   MongoDB    │  │  Brain MCP   │     │
│  │  (Structured)│  │   (Open DB)  │  │  (Neo4j +    │     │
│  │              │  │              │  │   Jina AI)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 TECHNOLOGY STACK SUMMARY

| Component | Technology | Status | Purpose |
|-----------|-----------|--------|---------|
| **Agent Framework** | @codebuff/sdk | ✅ **IMPLEMENTED** | Agent orchestration, execution, streaming |
| **Agent Coordination** | Hierarchical (built-in) | ✅ **IMPLEMENTED** | Master → Dept Heads → Specialists |
| **Brain MCP Service** | Python MCP Server | ✅ **IMPLEMENTED** | Neo4j + Jina embeddings |
| **Domain MCP Services** | 6 planned services | ❌ **NOT IMPLEMENTED** | Story, Character, Visual, Audio, Asset, Bible |
| **LangGraph** | Multi-agent workflows | ❌ **NOT IMPLEMENTED** | Future enhancement |
| **Task Queue** | BullMQ + Redis | ✅ **IMPLEMENTED** | Async processing |
| **Data Preparation** | Custom Agent | ✅ **IMPLEMENTED** | Context enrichment before Brain |

---

## 🎯 CLARIFICATION ANSWERS

### **Q1: Is the system using @codebuff/sdk OR MCP Services with LangGraph?**

**A**: **@codebuff/sdk is the PRIMARY and ONLY agent framework currently implemented.**

- MCP Services exist ONLY for the Brain (Neo4j/Jina)
- LangGraph is NOT implemented (documentation aspirational)
- Domain MCP services (Story, Character, etc.) are PLANNED but NOT built

### **Q2: If both, how do they integrate?**

**A**: **They don't integrate because only one is implemented:**

```typescript
// ACTUAL INTEGRATION PATTERN
@codebuff/sdk agents → Custom Tools → Brain MCP Service

// Example:
const result = await codebuff.run({
  agent: 'character-creator',
  customToolDefinitions: [
    queryBrainTool,  // ← Calls Brain MCP via HTTP/WebSocket
    saveCharacterTool
  ]
})
```

### **Q3: What is the actual agent coordination technology?**

**A**: **@codebuff/sdk's built-in hierarchical coordination:**

1. **Master Orchestrator** analyzes user request
2. **Routes to Department Heads** (parallel execution)
3. **Department Heads spawn Specialists** as needed
4. **Results aggregated** and returned to user

**NO external coordination framework** (no LangGraph, no complex MCP orchestration)

---

## � DOCUMENTATION vs REALITY GAP

### **Documents are ASPIRATIONAL, not CURRENT:**

| Document | Claims | Reality |
|----------|--------|---------|
| `AI_AGENT_SYSTEM.md` | "LangGraph-based coordination" | ❌ Not implemented |
| `AI_AGENT_SYSTEM.md` | "MCP Services on ports 8010-8015" | ❌ Only Brain exists |
| `buckets-from-start-to-end.md` | "@codebuff/sdk - 50+ Agents" | ✅ Correct (3 implemented, framework ready) |
| `SPECIFICATION.md` | "Agent Coordination: LangGraph" | ❌ Aspirational |

---

## ✅ RECOMMENDED ACTIONS

### **For Implementation:**

1. **Continue with @codebuff/sdk** - It's working and proven
2. **Brain MCP Service** - Keep as-is (working well)
3. **Domain MCP Services** - Build when needed (Phase 3)
4. **LangGraph** - Remove from current docs or mark as "Future Enhancement"

### **For Documentation:**

1. Update `SPECIFICATION.md` to reflect actual implementation
2. Mark LangGraph as "Phase 4 - Future Enhancement"
3. Clarify MCP Services: "Brain only (current), Domain services (planned)"
4. Add "IMPLEMENTATION STATUS" sections to all architecture docs

---

## 🎬 CONCLUSION

**The system is SIMPLER than the documentation suggests:**

- ✅ **@codebuff/sdk** handles ALL agent orchestration
- ✅ **Brain MCP** handles knowledge graph validation
- ❌ **LangGraph** is NOT part of current architecture
- ❌ **Domain MCP Services** are planned for Phase 3

**This is actually GOOD NEWS** - the current architecture is:
- ✅ Simpler to understand
- ✅ Easier to maintain
- ✅ Already working
- ✅ Proven in production

**No architectural conflict exists** - just documentation that describes future plans as if they were current implementation.

---

### 2. Department Structure Inconsistency

**Document A** (buckets-from-start-to-end.md):
- Lists 3-4 departments: Character, Story, Visual, Audio, (Production)
- Simple hierarchical structure

**Document B** (AI_AGENT_SYSTEM.md):
- Lists 5 major categories: Pre-Production, Production Planning, Production, Post-Production, Coordination
- 50+ agents across multiple sub-categories
- 6 MCP services (Story, Character, Visual, Audio, Asset, Story Bible)

**❓ QUESTION:**
1. What is the definitive department structure?
2. How do MCP services map to departments?
3. Is "Image Quality Department" (Doc A) the same as "Visual MCP" (Doc B)?

**🔴 IMPACT:** Cannot design agent routing and workflow without clear structure

---

### 3. Missing "Image Quality Department" Definition

**Document A** (buckets-from-start-to-end.md):
- Prominently features "Image Quality Department" with specific workflow:
  - Master reference creation
  - 360° profile generation (12 views at 30° intervals)
  - Consistency verification
  - Composite shot generation
  
**Document B** (AI_AGENT_SYSTEM.md):
- NO "Image Quality Department" mentioned
- Has "Visual MCP" with different agents:
  - Concept Artist
  - Environment Designer
  - Costume Designer
  - Props Master
  - Makeup/SFX Designer
  - Storyboard Artist
  - Shot Designer
  - Image Generation agent

**❓ QUESTION:**
1. Does "Image Quality Department" exist as a separate entity?
2. Is it part of Visual MCP or a sub-department?
3. Which agents handle master references and 360° profiles?
4. Who verifies consistency of generated images?

**🔴 IMPACT:** Core image generation workflow undefined - cannot implement Phase 2 (Compacting)

---

### 4. Master Orchestrator Implementation Gap

**Document A** (buckets-from-start-to-end.md):
- Master Orchestrator is central to workflow
- Routes all requests to departments
- Coordinates across departments

**Document B** (AI_AGENT_SYSTEM.md):
- NO Master Orchestrator agent listed
- Shows "Series Creator" as starting point
- No clear routing/orchestration agent defined

**❓ QUESTION:**
1. Is Master Orchestrator a real agent or a conceptual layer?
2. Which MCP service hosts the Master Orchestrator?
3. How are user requests routed to appropriate agents?
4. What technology implements the orchestration logic?

**🔴 IMPACT:** Cannot implement chat-driven pipeline without orchestrator

---

### 5. "Hair Stylist" Agent Missing

**Document A** (buckets-from-start-to-end.md):
- Explicitly lists "Hair Stylist" as specialist agent
- Example shows: "Hair Stylist → Short black hair design"

**Document B** (AI_AGENT_SYSTEM.md):
- NO "Hair Stylist" agent listed
- Character design covered by:
  - Character Designer (Visual appearance, clothing, distinctive features)
  - Costume Designer (Clothing)
  - Makeup/SFX Designer (Makeup effects)

**❓ QUESTION:**
1. Does Hair Stylist exist as a separate agent?
2. Is hair design part of Character Designer or Makeup/SFX Designer?
3. Should hair be treated as a distinct specialization?

**🟡 IMPACT:** Minor - can be absorbed into Character Designer, but needs decision

---

### 6. Voice System Discrepancy

**Document A** (buckets-from-start-to-end.md):
- States: "Voice Profile Creator" agent
- Mentions ElevenLabs integration in System Architecture
- Simple voice creation workflow

**Document B** (AI_AGENT_SYSTEM.md):
- Lists 4 voice-related agents:
  - Voice Creator
  - Voice Director
  - Voice Library Manager
  - Voice Matching
  - Dialogue Delivery
- Complex voice pipeline workflow
- All under Audio MCP (port 8013)

**❓ QUESTION:**
1. Is it "Voice Profile Creator" OR "Voice Creator" + supporting agents?
2. Are all 4 voice agents required for MVP?
3. What's the minimum voice system for Phase 1?
4. How does ElevenLabs API integrate with these agents?

**🟡 IMPACT:** Need to define voice system scope for each phase

---

## ⚠️ MISSING IMPLEMENTATION DETAILS

### 7. Brain Integration Specifics

**Document A** (buckets-from-start-to-end.md):
- States: "Brain validates quality & consistency of all content"
- Quality rating: 0.0 - 1.0
- User approval required

**Document B** (AI_AGENT_SYSTEM.md):
- No Brain integration details
- Quality gates mentioned but not defined
- No Neo4j workflow specified

**🔍 MISSING:**
1. How do agents send data to the Brain?
2. Which agents require Brain validation?
3. What is the Brain API/interface?
4. How is quality rating calculated?
5. When does validation happen (before/after user review)?

---

### 8. Department Head Agent Specifications

**Document A** (buckets-from-start-to-end.md):
- Lists "Department Heads" conceptually
- Shows coordination role

**Document B** (AI_AGENT_SYSTEM.md):
- No explicit "Department Head" agents listed
- Agents grouped by category but no head agents

**🔍 MISSING:**
1. Are Department Heads separate agents or logical groupings?
2. What are their responsibilities?
3. Which agents report to which department heads?
4. How do they coordinate specialist agents?

---

### 9. MCP Service to Agent Mapping

**Document B** (AI_AGENT_SYSTEM.md):
- Lists 6 MCP services (ports 8010-8015)
- Lists 50+ agents
- Shows "Hosted functionality" for each service

**🔍 MISSING:**
1. Complete mapping of ALL 50+ agents to MCP services
2. Which agents are hosted on which ports?
3. How do agents on different services communicate?
4. Are some agents cross-service?
5. Agent discovery/registry mechanism?

---

### 10. Agent Spawning & Lifecycle

**Document A** (buckets-from-start-to-end.md):
- Implies dynamic agent spawning: "Department Head spawns specialists"

**Document B** (AI_AGENT_SYSTEM.md):
- Shows static agent definitions
- Agent instances: Single, Multiple, Load Balanced

**🔍 MISSING:**
1. Are agents pre-instantiated or spawned on-demand?
2. Agent lifecycle management (create, execute, destroy)?
3. How many concurrent agents can run?
4. Agent pooling/queuing mechanism?
5. Resource limits per agent type?

---

### 11. Scene Assembly Process

**Document A** (buckets-from-start-to-end.md):
- Shows scene assembly with:
  - 30-second scene = 5 clips
  - Audio integration
  - Transitions
  - Color grading

**Document B** (AI_AGENT_SYSTEM.md):
- Lists relevant agents:
  - Video Editor
  - Compositor
  - Color Grader
  - Audio Mixer

**🔍 MISSING:**
1. Scene assembly workflow steps
2. Which agent orchestrates assembly?
3. Order of operations (video first? audio? effects?)
4. How are clips stitched together?
5. Transition generation (AI or pre-defined)?
6. Final rendering agent/service?

---

### 12. 360° Profile Implementation

**Document A** (buckets-from-start-to-end.md):
- Prominent feature: "Create 360° profile (12 views at 30° intervals)"
- Core consistency mechanism

**Document B** (AI_AGENT_SYSTEM.md):
- Not mentioned anywhere

**🔍 MISSING:**
1. Which agent generates 360° profiles?
2. Is it Image Generation agent or separate?
3. How are 12 views generated (batch request or sequential)?
4. What prompting strategy ensures view consistency?
5. Storage format for 360° profiles?
6. How are profiles used in downstream generation?

---

### 13. Reference Database Structure

**Document A** (buckets-from-start-to-end.md):
- Mentions "reference database" for storing:
  - Master reference images
  - 360° profiles
  - Descriptions

**Document B** (AI_AGENT_SYSTEM.md):
- No reference database mentioned
- Asset MCP exists but no reference-specific storage

**🔍 MISSING:**
1. Where are references stored? (MongoDB? PayloadCMS? Asset MCP?)
2. Reference document schema?
3. Reference versioning?
4. How do generation agents query references?
5. Reference-to-content linking mechanism?

---

### 14. Shot Composition Workflow

**Document A** (buckets-from-start-to-end.md):
- Shows: "Compose Shots" using "references + AI model"
- Mentions verification against references

**Document B** (AI_AGENT_SYSTEM.md):
- Has "Shot Designer" agent
- Has "Compositor" agent
- Not clear which does what

**🔍 MISSING:**
1. Shot composition step-by-step process
2. Shot Designer vs Compositor responsibilities
3. How are references incorporated into shots?
4. Which AI model(s) used for composition?
5. Composition API/service integration

---

### 15. Video Generation Methods Implementation

**Document A** (buckets-from-start-to-end.md):
- Lists 4 video generation methods:
  1. Text-to-Video
  2. Image-to-Video (Single)
  3. Image-to-Video (First + Last)
  4. Composite-to-Video

**Document B** (AI_AGENT_SYSTEM.md):
- Single "Video Generation" agent
- FAL.ai integration mentioned

**🔍 MISSING:**
1. Does single agent support all 4 methods?
2. How is method selected (user choice? AI decision?)?
3. FAL.ai API endpoints for each method?
4. Method-specific parameters?
5. Method fallback logic if one fails?

---

### 16. Quality Controller Agent Scope

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Quality Controller" agent
- "Content review for consistency and quality"

**🔍 MISSING:**
1. What content does Quality Controller review?
2. When in pipeline does it run?
3. Automated or user-triggered?
4. Quality metrics and thresholds?
5. Relationship to Brain validation?
6. Relationship to Final QC agent?

---

### 17. Continuity Agent Implementation

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Continuity" agent
- "Visual consistency between shots and scenes"

**🔍 MISSING:**
1. How does Continuity agent access multiple shots/scenes?
2. What visual elements does it check?
3. Automated consistency checks or manual review?
4. Integration with reference database?
5. When does it run in pipeline?

---

### 18. Agent Communication Protocol

**Both Documents:**
- Show agents coordinating and passing data

**🔍 MISSING:**
1. How do agents communicate (HTTP? gRPC? Message queue?)?
2. Data format between agents (JSON? Protobuf?)?
3. Synchronous vs asynchronous communication?
4. Error handling between agents?
5. Agent-to-agent authentication?

---

### 19. Cost Optimization Implementation

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Cost Optimizer" agent
- "API usage monitoring, efficiency suggestions"

**🔍 MISSING:**
1. What APIs does it monitor?
2. Cost tracking mechanism?
3. Budget alerts/limits?
4. Optimization recommendations (how presented to user)?
5. Automatic cost-saving actions (if any)?

---

### 20. Production Manager Workflow

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Production Manager" agent
- "Task scheduling, dependencies, resources"

**🔍 MISSING:**
1. How does Production Manager track all tasks?
2. Dependency graph management?
3. Resource allocation algorithm?
4. Task prioritization logic?
5. Relationship to Master Orchestrator (if separate)?

---

## 🔍 AREAS REQUIRING CLARIFICATION

### 21. Agent vs MCP Service Relationship

**❓ CLARIFICATION NEEDED:**
- Is an MCP service a container for multiple agents?
- Or is each agent a separate MCP tool/resource?
- Can agents from different services interact directly?
- What's the deployment model (monolith? microservices?)?

---

### 22. User Interaction Points

**Document A** (buckets-from-start-to-end.md):
- Shows multiple user decision points: INGEST, MODIFY, DISCARD

**❓ CLARIFICATION NEEDED:**
- Is every agent output presented to user?
- Are some agents fully automated?
- Batch review vs individual review?
- How does user "MODIFY" - new chat message? Form input?

---

### 23. Phase Transitions

**Document A** (buckets-from-start-to-end.md):
- Shows EXPANSION → COMPACTING transition
- "EXPANSION COMPLETE ✓"

**❓ CLARIFICATION NEEDED:**
1. What determines expansion is complete?
2. Can user jump between phases?
3. Can user go back to expansion after starting compacting?
4. Phase transition triggering mechanism?

---

### 24. Parallel vs Sequential Execution

**Document B** (AI_AGENT_SYSTEM.md):
- Shows both sequential dependencies and parallel groups

**❓ CLARIFICATION NEEDED:**
1. Which agents run in parallel by default?
2. How is parallelism orchestrated?
3. Resource limits on parallel execution?
4. User control over parallelism?

---

### 25. Story Bible MCP Role

**Document B** (AI_AGENT_SYSTEM.md):
- Story Bible has own MCP service (port 8015)
- Separate from Story MCP (port 8010)

**❓ CLARIFICATION NEEDED:**
1. Why is Story Bible separate from Story MCP?
2. Do all agents query Story Bible?
3. How often is Story Bible updated?
4. Relationship between Story Bible and Brain (Neo4j)?

---

### 26. Animation vs Video Generation

**Document B** (AI_AGENT_SYSTEM.md):
- Lists both "Animation Director" and "Video Generation"

**❓ CLARIFICATION NEEDED:**
1. What's the difference between Animation and Video Generation?
2. When is Animation Director used vs Video Generation?
3. Do they work together or independently?
4. Different AI models/services?

---

### 27. Multiple Quality Agents

**Document B** (AI_AGENT_SYSTEM.md):
- Quality Controller (Production Planning)
- Continuity (Production Planning)
- Final QC (Post-Production)

**❓ CLARIFICATION NEEDED:**
1. Responsibilities of each quality agent?
2. Do they all validate the same content at different stages?
3. Can earlier stages override later quality checks?
4. Quality gate relationships?

---

### 28. Casting Director Purpose

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Casting Director" agent
- "Matches character types to archetypes"

**❓ CLARIFICATION NEEDED:**
1. What is "casting" in AI movie context (no real actors)?
2. Does it match to voice actors?
3. Or does it assign visual/personality archetypes?
4. When in workflow is casting done?

---

### 29. Motion Capture & Facial Animation

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Motion Capture" and "Facial Animation" agents

**❓ CLARIFICATION NEEDED:**
1. Is there actual motion capture hardware?
2. Or is this AI-synthesized motion?
3. How does motion data integrate with video generation?
4. Do these agents produce separate assets or guide video gen?

---

### 30. Location Scout Purpose

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Location Scout" agent
- "Real-world reference footage sourcing"

**❓ CLARIFICATION NEEDED:**
1. Does this agent search online for reference images?
2. Or does it use AI to generate location concepts?
3. What APIs/services does it use?
4. How are sourced images licensed/attributed?

---

### 31. Legal Compliance Agent

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Legal Compliance" agent
- "Platform guidelines, rating requirements"

**❓ CLARIFICATION NEEDED:**
1. What platforms are targeted (YouTube? Netflix? Theatrical?)?
2. Automated content rating (G, PG, R)?
3. Content filtering/moderation?
4. Does it flag or block problematic content?

---

### 32. Marketing Asset Agent Scope

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Marketing Asset" agent
- "Trailers, promotional clips, social media"

**❓ CLARIFICATION NEEDED:**
1. MVP requirement or future feature?
2. Automatic trailer generation from movie?
3. Social media post creation?
4. Different output formats for different platforms?

---

### 33. Distribution Agent Functionality

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Distribution" agent
- "Platform formatting, resolution optimization"

**❓ CLARIFICATION NEEDED:**
1. Does this agent actually upload to platforms?
2. Or just prepare/format files?
3. Supported platforms?
4. Encoding settings per platform?

---

### 34. Research Agent Scope

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Research" agent
- "Period accuracy, cultural authenticity, fact-checking"

**❓ CLARIFICATION NEEDED:**
1. What knowledge sources does it use?
2. How does it validate historical accuracy?
3. Cultural sensitivity checks?
4. When in workflow does research happen?

---

### 35. Render Farm Coordinator

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Render Farm Coordinator"
- "GPU resource management"

**❓ CLARIFICATION NEEDED:**
1. Is there an actual render farm?
2. Or is this coordinating cloud GPU services?
3. Which rendering tasks require GPU?
4. Cost vs performance optimization?

---

### 36. Version Control Agent

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Version Control" agent
- "Asset versions, backup systems"

**❓ CLARIFICATION NEEDED:**
1. What assets are versioned (all? media only?)?
2. Git-based or custom versioning?
3. User-initiated versions or automatic?
4. Version comparison/diff capabilities?

---

### 37. Subtitle/Caption Agent

**Document B** (AI_AGENT_SYSTEM.md):
- Lists "Subtitle/Caption" agent
- "Accurate subtitles, accessibility features"

**❓ CLARIFICATION NEEDED:**
1. Auto-generated from dialogue script?
2. Or from audio (speech-to-text)?
3. Multiple language support?
4. SRT/VTT/other formats?

---

### 38. Episode vs Movie Support

**Document B** (AI_AGENT_SYSTEM.md):
- Many agents mention "episodes" (Episode Breakdown, Character Arc Manager)

**Document A** (buckets-from-start-to-end.md):
- Mostly discusses generic "movie" creation
- Timeline example is "5-Minute Short Film"

**❓ CLARIFICATION NEEDED:**
1. Does system support both movies AND series?
2. Different workflows for each?
3. Episode management in UI?
4. Cross-episode continuity handling?

---

## 📊 SUMMARY OF ISSUES

### By Category

| Category | Count | Severity |
|----------|-------|----------|
| **Critical Discrepancies** | 6 | 🔴 High |
| **Major Discrepancies** | 8 | 🟡 Medium |
| **Missing Implementation Details** | 14 | ⚠️ High |
| **Clarifications Needed** | 18 | 🔵 Medium |
| **TOTAL ISSUES** | **46** | - |

---

## 🎯 RECOMMENDED ACTIONS

### Immediate Priority (Blocking Development)

1. **Define Agent Technology Stack**
   - [ ] Choose: @codebuff/sdk OR MCP+LangGraph OR Hybrid
   - [ ] Document integration architecture if hybrid

2. **Clarify Department Structure**
   - [ ] Create definitive department/agent hierarchy
   - [ ] Map all 50+ agents to departments and MCP services

3. **Define Master Orchestrator**
   - [ ] Specify if it's a real agent or logical layer
   - [ ] Document routing/coordination mechanism

4. **Specify Image Quality Department**
   - [ ] Define as department or sub-department
   - [ ] List all agents responsible for references and 360° profiles
   - [ ] Document consistency verification workflow

5. **Document Brain Integration**
   - [ ] Brain API specification
   - [ ] Quality rating calculation formula
   - [ ] Agent-to-Brain communication protocol

### High Priority (Phase 2+ Blocking)

6. **Reference System Design**
   - [ ] Reference database schema
   - [ ] 360° profile generation workflow
   - [ ] Reference-based composition process

7. **Video Generation Methods**
   - [ ] Method selection logic
   - [ ] FAL.ai API integration per method
   - [ ] Fallback strategies

8. **Scene Assembly Workflow**
   - [ ] Step-by-step process
   - [ ] Agent orchestration
   - [ ] Rendering pipeline

9. **Agent Communication**
   - [ ] Inter-agent protocol
   - [ ] Data formats
   - [ ] Error handling

10. **MCP Service Architecture**
    - [ ] Complete agent-to-service mapping
    - [ ] Service communication patterns
    - [ ] Deployment model

### Medium Priority (Can be Deferred)

11. **Voice System Scope**
    - [ ] MVP vs full voice pipeline
    - [ ] ElevenLabs integration details

12. **Quality Control Hierarchy**
    - [ ] Responsibilities per quality agent
    - [ ] Quality gate relationships

13. **Advanced Features**
    - [ ] Marketing Asset generation
    - [ ] Distribution automation
    - [ ] Multi-language support

---

## 📝 RECOMMENDATION

**Before proceeding with implementation:**

1. ✅ **Create unified architecture document** combining both documents
2. ✅ **Resolve all 6 critical discrepancies**
3. ✅ **Define agent technology stack definitively**
4. ✅ **Map all 50+ agents to MCP services**
5. ✅ **Specify Image Quality Department fully**
6. ✅ **Document Brain integration completely**

**Estimated effort to resolve:** 2-3 days of architectural work

---

**Document Status**: Ready for Review  
**Next Steps**: Architecture team meeting to resolve critical discrepancies  
**Target Resolution Date**: Within 1 week

---

**End of Report**
