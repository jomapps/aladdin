# Dynamic Agents for Aladdin - Enhanced Implementation

**Version**: 1.0.0
**Last Updated**: January 28, 2025
**Parent Document**: [SPECIFICATION.md](./SPECIFICATION.md)

---

## Executive Summary

Aladdin's dynamic AI agent system creates a hierarchical movie production pipeline where **Department Heads** coordinate **Specialist Agents** to produce high-quality content. This system is fully configurable through PayloadCMS collections and integrates with @codebuff/sdk for agent execution.

### Key Features
- 🏢 **Department-based Organization**: Story, Character, Visual, Video, Audio, Production
- 👑 **Department Head Leadership**: One head per department coordinates specialists
- 🔄 **Dynamic Agent Spawning**: Agents created/modified through CMS
- 📊 **Real-time Monitoring**: Live agent status and output tracking
- 🎯 **Quality Assurance**: Multi-stage review and approval process
- 📝 **Complete Audit Trail**: All inputs, outputs, and decisions logged

---

## 1. System Architecture

### 1.1 Hierarchical Structure
```
Master Orchestrator
    ↓
Department Heads (6 departments)
    ↓
Specialist Agents (3-8 per department)
    ↓
Content Output
```

### 1.2 Communication Flow
```
User Request → Master Orchestrator → Department Head → Specialists → Department Head → Orchestrator → User
```

### 1.3 Working Stages
1. **Request Analysis** - Orchestrator analyzes and routes requests
2. **Department Assignment** - Relevant department heads activated
3. **Specialist Delegation** - Department heads spawn required specialists
4. **Content Creation** - Specialists produce outputs
5. **Department Review** - Department heads review and approve/reject
6. **Final Integration** - Orchestrator compiles final result
7. **Quality Audit** - Complete audit trail generated

---

## 2. PayloadCMS Collections Schema

### 2.1 Departments Collection

**Purpose**: Define organizational departments for movie production

**Fields**:
```typescript
{
  slug: string (unique, required) // e.g., "story", "character", "visual"
  name: string (required) // Display name
  description: text (required) // Department purpose
  icon: string // Emoji or icon identifier
  color: string // Hex color for UI
  priority: number // Execution order (1-10)
  isActive: boolean (default: true)

  // @codebuff/sdk Integration
  defaultModel: string // e.g., "anthropic/claude-3.5-sonnet"
  maxAgentSteps: number (default: 20)

  // Metadata
  createdAt: date
  updatedAt: date
}
```

**Seed Data**:
```json
[
  {
    "slug": "story",
    "name": "Story Department",
    "description": "Develops narrative structure, plot, themes, and story arcs",
    "icon": "📖",
    "color": "#8B5CF6",
    "priority": 1,
    "defaultModel": "anthropic/claude-3.5-sonnet"
  },
  {
    "slug": "character",
    "name": "Character Department",
    "description": "Creates character profiles, development arcs, and relationships",
    "icon": "👤",
    "color": "#EC4899",
    "priority": 2,
    "defaultModel": "anthropic/claude-3.5-sonnet"
  },
  {
    "slug": "visual",
    "name": "Visual Department",
    "description": "Designs visual style, cinematography, and art direction",
    "icon": "🎨",
    "color": "#F59E0B",
    "priority": 3,
    "defaultModel": "anthropic/claude-3.5-sonnet"
  },
  {
    "slug": "video",
    "name": "Video Department",
    "description": "Handles video production, editing, and post-production",
    "icon": "🎬",
    "color": "#10B981",
    "priority": 4,
    "defaultModel": "anthropic/claude-3.5-sonnet"
  },
  {
    "slug": "audio",
    "name": "Audio Department",
    "description": "Manages sound design, music, dialogue, and audio mixing",
    "icon": "🔊",
    "color": "#3B82F6",
    "priority": 5,
    "defaultModel": "anthropic/claude-3.5-sonnet"
  },
  {
    "slug": "production",
    "name": "Production Department",
    "description": "Coordinates overall production, scheduling, and resource management",
    "icon": "🎯",
    "color": "#EF4444",
    "priority": 6,
    "defaultModel": "anthropic/claude-3.5-sonnet"
  }
]
```

---

### 2.2 Agents Collection

**Purpose**: Define individual AI agents with their capabilities and configurations

**Fields**:
```typescript
{
  // Basic Info
  agentId: string (unique, required) // e.g., "story-head-001"
  name: string (required) // Display name
  description: text (required)

  // Department Relationship
  department: relationship (Departments, required)
  isDepartmentHead: boolean (default: false)

  // @codebuff/sdk Configuration
  model: string (required) // e.g., "anthropic/claude-3.5-sonnet"
  instructionsPrompt: text (required) // Core system prompt
  toolNames: array<string> // Custom tools this agent can use
  maxAgentSteps: number (default: 20)

  // Capabilities
  specialization: string // e.g., "dialogue", "plot-structure"
  skills: array<string> // e.g., ["character-development", "conflict-resolution"]

  // Status & Performance
  isActive: boolean (default: true)
  successRate: number (0-100)
  averageExecutionTime: number // milliseconds
  totalExecutions: number (default: 0)

  // Quality Control
  requiresReview: boolean (default: true)
  qualityThreshold: number (0-100, default: 80)

  // Metadata
  createdAt: date
  updatedAt: date
  lastExecutedAt: date
}
```

**Validation Rules**:
- Only ONE agent per department can have `isDepartmentHead: true`
- Department heads MUST have `requiresReview: false`
- Specialist agents MUST have `requiresReview: true`

---

### 2.3 Agent Executions Collection

**Purpose**: Track all agent executions for audit and monitoring

**Fields**:
```typescript
{
  executionId: string (unique, auto-generated)

  // Agent Info
  agent: relationship (Agents, required)
  department: relationship (Departments, required)

  // Execution Context
  project: relationship (Projects, required)
  episode: relationship (Episodes, optional)
  conversationId: string // Link to conversation

  // Input/Output
  prompt: text (required) // User/system prompt
  params: json // Additional parameters
  output: json // Agent output

  // @codebuff/sdk State
  runState: json // Complete RunState from SDK
  events: array<json> // All events during execution

  // Performance Metrics
  status: enum ["pending", "running", "completed", "failed", "cancelled"]
  startedAt: date
  completedAt: date
  executionTime: number // milliseconds
  tokenUsage: json // { input, output, total }

  // Quality Metrics
  qualityScore: number (0-100)
  reviewStatus: enum ["pending", "approved", "rejected", "revision-needed"]
  reviewedBy: relationship (Agents, optional) // Department head
  reviewNotes: text

  // Error Handling
  error: json // Error details if failed
  retryCount: number (default: 0)

  // Metadata
  createdAt: date
  updatedAt: date
}
```

---

### 2.4 Custom Tools Collection

**Purpose**: Define reusable custom tools for agents

**Fields**:
```typescript
{
  toolName: string (unique, required)
  displayName: string (required)
  description: text (required)

  // Tool Configuration
  inputSchema: json (required) // Zod schema as JSON
  exampleInputs: array<json>

  // Implementation
  executeFunction: text (required) // JavaScript function code

  // Availability
  departments: array<relationship (Departments)> // Which departments can use
  isGlobal: boolean (default: false) // Available to all agents

  // Status
  isActive: boolean (default: true)
  version: string (default: "1.0.0")

  // Metadata
  createdAt: date
  updatedAt: date
}
```

---

## 3. @codebuff/sdk Integration

### 3.1 Agent Definition Mapping

**How PayloadCMS Agents → @codebuff/sdk AgentDefinition**:

```typescript
import { CodebuffClient } from '@codebuff/sdk'
import type { AgentDefinition } from '@codebuff/sdk'

// Convert PayloadCMS Agent to SDK AgentDefinition
function createAgentDefinition(agent: Agent): AgentDefinition {
  return {
    id: agent.agentId,
    model: agent.model,
    displayName: agent.name,
    toolNames: agent.toolNames || [],
    instructionsPrompt: agent.instructionsPrompt,
    // Additional SDK properties can be added
  }
}
```

### 3.2 Dynamic Agent Execution

**Core execution flow**:

```typescript
import { CodebuffClient, getCustomToolDefinition } from '@codebuff/sdk'

class AladdinAgentRunner {
  private client: CodebuffClient

  constructor(apiKey: string) {
    this.client = new CodebuffClient({
      apiKey,
      cwd: process.cwd(),
    })
  }

  async executeAgent(
    agentId: string,
    prompt: string,
    context: {
      projectId: string
      episodeId?: string
      conversationId: string
      previousRun?: any
    }
  ) {
    // 1. Fetch agent from PayloadCMS
    const agent = await payload.findByID({
      collection: 'agents',
      id: agentId,
    })

    // 2. Fetch custom tools for this agent
    const tools = await this.loadCustomTools(agent)

    // 3. Create agent definition
    const agentDefinition = createAgentDefinition(agent)

    // 4. Track execution
    const execution = await payload.create({
      collection: 'agent-executions',
      data: {
        agent: agent.id,
        department: agent.department,
        project: context.projectId,
        episode: context.episodeId,
        conversationId: context.conversationId,
        prompt,
        status: 'running',
        startedAt: new Date(),
      },
    })

    // 5. Execute with @codebuff/sdk
    try {
      const result = await this.client.run({
        agent: agent.agentId,
        prompt,
        agentDefinitions: [agentDefinition],
        customToolDefinitions: tools,
        previousRun: context.previousRun,
        maxAgentSteps: agent.maxAgentSteps,
        handleEvent: (event) => {
          // Real-time event streaming
          this.handleAgentEvent(execution.id, event)
        },
      })

      // 6. Update execution with results
      await payload.update({
        collection: 'agent-executions',
        id: execution.id,
        data: {
          status: 'completed',
          completedAt: new Date(),
          output: result.output,
          runState: result,
          executionTime: Date.now() - execution.startedAt.getTime(),
        },
      })

      return result

    } catch (error) {
      // Handle errors
      await payload.update({
        collection: 'agent-executions',
        id: execution.id,
        data: {
          status: 'failed',
          error: { message: error.message, stack: error.stack },
          completedAt: new Date(),
        },
      })
      throw error
    }
  }

  private async loadCustomTools(agent: Agent) {
    const tools = await payload.find({
      collection: 'custom-tools',
      where: {
        or: [
          { isGlobal: { equals: true } },
          { departments: { contains: agent.department } },
        ],
        isActive: { equals: true },
      },
    })

    return tools.docs.map(tool =>
      getCustomToolDefinition({
        toolName: tool.toolName,
        description: tool.description,
        inputSchema: parseZodSchema(tool.inputSchema),
        exampleInputs: tool.exampleInputs,
        execute: new Function('return ' + tool.executeFunction)(),
      })
    )
  }

  private handleAgentEvent(executionId: string, event: any) {
    // Store event in database
    payload.update({
      collection: 'agent-executions',
      id: executionId,
      data: {
        events: { push: event },
      },
    })

    // Emit real-time update via WebSocket
    io.to(`execution:${executionId}`).emit('agent-event', event)
  }
}
```


---

## 4. Department Head Workflow

### 4.1 Request Processing

**Department Head Responsibilities**:
1. Receive request from Master Orchestrator
2. Analyze requirements and complexity
3. Determine which specialist agents to spawn
4. Delegate tasks to specialists
5. Review specialist outputs
6. Synthesize final department output
7. Return to orchestrator

**Implementation**:

```typescript
class DepartmentHeadAgent {
  async processRequest(request: {
    prompt: string
    context: any
    projectId: string
  }) {
    // 1. Analyze request
    const analysis = await this.analyzeRequest(request.prompt)

    // 2. Determine required specialists
    const specialists = await this.selectSpecialists(analysis)

    // 3. Spawn specialist agents in parallel
    const specialistResults = await Promise.all(
      specialists.map(specialist =>
        this.spawnSpecialist(specialist, request)
      )
    )

    // 4. Review all outputs
    const reviewedResults = await this.reviewOutputs(specialistResults)

    // 5. Synthesize final output
    const finalOutput = await this.synthesizeOutput(reviewedResults)

    // 6. Quality check
    const qualityScore = await this.assessQuality(finalOutput)

    return {
      output: finalOutput,
      qualityScore,
      specialists: specialistResults,
      metadata: {
        analysisTime: analysis.time,
        specialistsUsed: specialists.length,
        totalExecutionTime: Date.now() - request.startTime,
      },
    }
  }

  private async selectSpecialists(analysis: any) {
    // Query PayloadCMS for relevant specialists
    const specialists = await payload.find({
      collection: 'agents',
      where: {
        department: { equals: this.departmentId },
        isDepartmentHead: { equals: false },
        isActive: { equals: true },
        skills: { in: analysis.requiredSkills },
      },
      sort: '-successRate',
      limit: 5,
    })

    return specialists.docs
  }
}
```

---

## 5. Communication & Display System

### 5.1 Real-time Event Streaming

**WebSocket Events**:

```typescript
// Event types emitted during agent execution
type AgentEvent =
  | { type: 'agent-start', agentId: string, timestamp: Date }
  | { type: 'agent-thinking', agentId: string, message: string }
  | { type: 'tool-call', agentId: string, toolName: string, input: any }
  | { type: 'tool-result', agentId: string, toolName: string, output: any }
  | { type: 'agent-response', agentId: string, content: string }
  | { type: 'agent-complete', agentId: string, output: any }
  | { type: 'agent-error', agentId: string, error: any }
  | { type: 'quality-check', agentId: string, score: number }
  | { type: 'review-status', agentId: string, status: string }

// Frontend subscription
socket.on('agent-event', (event: AgentEvent) => {
  switch (event.type) {
    case 'agent-start':
      updateUI({ status: 'running', agent: event.agentId })
      break
    case 'agent-thinking':
      showThinkingIndicator(event.agentId, event.message)
      break
    case 'tool-call':
      logToolExecution(event.agentId, event.toolName)
      break
    // ... handle other events
  }
})
```

### 5.2 UI Components

**Agent Status Dashboard**:

```typescript
// Real-time agent status display
interface AgentStatusProps {
  executionId: string
}

function AgentStatusDashboard({ executionId }: AgentStatusProps) {
  const [execution, setExecution] = useState<AgentExecution>()
  const [events, setEvents] = useState<AgentEvent[]>([])

  useEffect(() => {
    // Subscribe to real-time updates
    socket.emit('subscribe-execution', executionId)

    socket.on('agent-event', (event) => {
      setEvents(prev => [...prev, event])
    })

    return () => {
      socket.emit('unsubscribe-execution', executionId)
    }
  }, [executionId])

  return (
    <div className="agent-dashboard">
      {/* Agent Info */}
      <AgentCard agent={execution.agent} />

      {/* Progress Timeline */}
      <Timeline events={events} />

      {/* Live Output Stream */}
      <OutputStream events={events.filter(e => e.type === 'agent-response')} />

      {/* Tool Calls Log */}
      <ToolCallsLog events={events.filter(e => e.type === 'tool-call')} />

      {/* Quality Metrics */}
      <QualityMetrics score={execution.qualityScore} />
    </div>
  )
}
```

**Department Overview**:

```typescript
function DepartmentDashboard({ departmentId }: { departmentId: string }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [activeExecutions, setActiveExecutions] = useState<AgentExecution[]>([])

  return (
    <div className="department-dashboard">
      {/* Department Header */}
      <DepartmentHeader department={department} />

      {/* Department Head Status */}
      <DepartmentHeadCard
        agent={agents.find(a => a.isDepartmentHead)}
        activeExecutions={activeExecutions.filter(e => e.agent.isDepartmentHead)}
      />

      {/* Specialist Agents Grid */}
      <div className="specialists-grid">
        {agents.filter(a => !a.isDepartmentHead).map(agent => (
          <SpecialistCard
            key={agent.id}
            agent={agent}
            executions={activeExecutions.filter(e => e.agent.id === agent.id)}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <RecentActivity departmentId={departmentId} />
    </div>
  )
}
```

---

## 6. Audit Trail System

### 6.1 Complete Input/Output Logging

**Every agent execution captures**:
- ✅ Original user prompt
- ✅ Agent instructions used
- ✅ All tool calls and results
- ✅ Intermediate thinking steps
- ✅ Final output
- ✅ Quality scores
- ✅ Review decisions
- ✅ Token usage
- ✅ Execution time
- ✅ Error logs (if any)

### 6.2 Audit Query API

```typescript
// Query audit trail
async function queryAuditTrail(filters: {
  projectId?: string
  departmentId?: string
  agentId?: string
  dateRange?: { start: Date, end: Date }
  status?: string
  minQualityScore?: number
}) {
  const executions = await payload.find({
    collection: 'agent-executions',
    where: {
      ...(filters.projectId && { project: { equals: filters.projectId } }),
      ...(filters.departmentId && { department: { equals: filters.departmentId } }),
      ...(filters.agentId && { agent: { equals: filters.agentId } }),
      ...(filters.status && { status: { equals: filters.status } }),
      ...(filters.minQualityScore && {
        qualityScore: { greater_than_equal: filters.minQualityScore }
      }),
    },
    sort: '-createdAt',
    limit: 100,
  })

  return executions.docs
}

// Export audit report
async function exportAuditReport(projectId: string, format: 'json' | 'csv' | 'pdf') {
  const executions = await queryAuditTrail({ projectId })

  switch (format) {
    case 'json':
      return JSON.stringify(executions, null, 2)
    case 'csv':
      return convertToCSV(executions)
    case 'pdf':
      return generatePDFReport(executions)
  }
}
```

### 6.3 Audit UI Components

```typescript
function AuditTrailViewer({ projectId }: { projectId: string }) {
  return (
    <div className="audit-trail">
      {/* Filters */}
      <AuditFilters />

      {/* Timeline View */}
      <ExecutionTimeline executions={executions} />

      {/* Detailed Execution View */}
      <ExecutionDetails
        execution={selectedExecution}
        showEvents={true}
        showToolCalls={true}
        showReviews={true}
      />

      {/* Export Options */}
      <ExportButton formats={['json', 'csv', 'pdf']} />
    </div>
  )
}
```

---

## 7. High-Quality Prompts

### 7.1 Master Orchestrator Prompt

```markdown
# Master Orchestrator Agent

You are the Master Orchestrator for Aladdin AI Movie Production Platform. Your role is to coordinate all department heads to produce high-quality movie content.

## Core Responsibilities
1. Analyze incoming user requests and determine scope
2. Route requests to appropriate department heads
3. Coordinate multi-department workflows
4. Synthesize outputs from all departments
5. Ensure quality and consistency across all content
6. Manage project timeline and dependencies

## Decision Framework
- **Single Department**: Route directly to department head
- **Multiple Departments**: Create coordinated workflow with dependencies
- **Complex Projects**: Break down into phases and coordinate sequentially

## Quality Standards
- All outputs must meet minimum 80% quality threshold
- Department head reviews are mandatory
- Cross-department consistency must be maintained
- User feedback must be incorporated iteratively

## Communication Style
- Clear, professional, and concise
- Provide progress updates at each stage
- Explain decisions and reasoning
- Ask clarifying questions when requirements are ambiguous

## Context Awareness
- Always consider the full project context
- Reference previous decisions and outputs
- Maintain narrative consistency
- Respect established character traits and story arcs
```

### 7.2 Story Department Head Prompt

```markdown
# Story Department Head

You are the Head of the Story Department for Aladdin AI Movie Production. You coordinate all narrative development and ensure story quality.

## Core Responsibilities
1. Analyze story requests and break down into components
2. Delegate to specialist agents (plot, dialogue, theme, structure)
3. Review all specialist outputs for narrative consistency
4. Synthesize cohesive story elements
5. Ensure adherence to storytelling best practices

## Specialist Coordination
- **Plot Specialist**: Story structure, beats, turning points
- **Dialogue Specialist**: Character voice, conversations, subtext
- **Theme Specialist**: Underlying messages, symbolism, motifs
- **Structure Specialist**: Act breaks, pacing, scene sequencing

## Quality Criteria
- ✅ Clear three-act structure (or appropriate alternative)
- ✅ Compelling character arcs
- ✅ Consistent tone and voice
- ✅ Proper pacing and tension
- ✅ Satisfying resolution
- ✅ Thematic coherence

## Review Process
1. Check each specialist output against quality criteria
2. Identify inconsistencies or gaps
3. Request revisions if quality < 80%
4. Synthesize approved outputs into cohesive narrative
5. Provide detailed feedback for improvements

## Output Format
Always structure your output as:
- **Summary**: Brief overview of story elements
- **Detailed Content**: Full narrative content
- **Quality Assessment**: Scores and justification
- **Recommendations**: Suggestions for improvement
```

### 7.3 Character Department Head Prompt

```markdown
# Character Department Head

You are the Head of the Character Department for Aladdin AI Movie Production. You oversee all character development and ensure character consistency.

## Core Responsibilities
1. Analyze character requests and requirements
2. Delegate to specialists (profiles, arcs, relationships, psychology)
3. Review specialist outputs for character consistency
4. Ensure characters serve the story effectively
5. Maintain character database and continuity

## Specialist Coordination
- **Profile Specialist**: Physical traits, background, personality
- **Arc Specialist**: Character growth, transformation, journey
- **Relationship Specialist**: Dynamics, conflicts, connections
- **Psychology Specialist**: Motivations, fears, desires, flaws

## Quality Criteria
- ✅ Well-defined personality traits
- ✅ Clear motivations and goals
- ✅ Believable character arc
- ✅ Consistent behavior and voice
- ✅ Meaningful relationships
- ✅ Compelling flaws and strengths

## Character Consistency Rules
- Track all character decisions and traits
- Flag contradictions immediately
- Reference character database for continuity
- Ensure dialogue matches established voice
- Maintain relationship dynamics

## Output Format
- **Character Profile**: Complete character sheet
- **Development Arc**: Journey from start to end
- **Key Relationships**: Dynamics with other characters
- **Quality Metrics**: Consistency and depth scores
- **Continuity Notes**: Important traits to maintain
```

### 7.4 Specialist Agent Prompts

**Plot Structure Specialist**:
```markdown
# Plot Structure Specialist

You are an expert in narrative structure and plot development.

## Expertise
- Three-act structure
- Hero's journey
- Save the Cat beat sheet
- Plot points and turning points
- Pacing and tension

## Task Approach
1. Analyze story requirements
2. Identify key plot points
3. Structure narrative beats
4. Ensure proper pacing
5. Create compelling conflicts

## Output Requirements
- Clear act breaks
- Major plot points identified
- Tension curve mapped
- Pacing notes
- Structural recommendations
```

**Dialogue Specialist**:
```markdown
# Dialogue Specialist

You are an expert in writing natural, character-driven dialogue.

## Expertise
- Character voice differentiation
- Subtext and implication
- Conflict through dialogue
- Natural speech patterns
- Emotional authenticity

## Task Approach
1. Understand character voices
2. Identify scene objectives
3. Write authentic dialogue
4. Layer in subtext
5. Ensure each line serves purpose

## Quality Standards
- Each character has distinct voice
- Dialogue reveals character
- Subtext adds depth
- Natural flow and rhythm
- Advances plot or character
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create PayloadCMS collections (Departments, Agents, Executions, Tools)
- [ ] Seed initial department data
- [ ] Install and configure @codebuff/sdk
- [ ] Create base agent runner class
- [ ] Implement agent definition mapping

### Phase 2: Core Execution (Week 3-4)
- [ ] Implement dynamic agent execution
- [ ] Create custom tool system
- [ ] Build event streaming infrastructure
- [ ] Implement error handling and retries
- [ ] Create execution tracking system

### Phase 3: Department Heads (Week 5-6)
- [ ] Implement department head workflow
- [ ] Create specialist selection logic
- [ ] Build review and approval system
- [ ] Implement quality scoring
- [ ] Create synthesis logic

### Phase 4: UI & Monitoring (Week 7-8)
- [ ] Build agent status dashboard
- [ ] Create department overview pages
- [ ] Implement real-time event display
- [ ] Build execution timeline view
- [ ] Create quality metrics visualization

### Phase 5: Audit & Reporting (Week 9-10)
- [ ] Implement complete audit trail
- [ ] Build audit query API
- [ ] Create audit trail viewer UI
- [ ] Implement export functionality
- [ ] Build analytics dashboard

### Phase 6: Optimization (Week 11-12)
- [ ] Performance optimization
- [ ] Caching strategies
- [ ] Parallel execution improvements
- [ ] Token usage optimization
- [ ] Quality threshold tuning

---

## 9. Key Questions & Decisions

### 9.1 Agent Execution

**Q1: Should agents run sequentially or in parallel?**
- **Department Heads**: Sequential (analyze → delegate → review → synthesize)
- **Specialists**: Parallel (all specialists can run simultaneously)
- **Cross-Department**: Depends on dependencies (story before character, etc.)

**Q2: How to handle agent failures?**
- Automatic retry up to 3 times
- Exponential backoff between retries
- Fallback to simpler model if primary fails
- Manual intervention option for critical failures

**Q3: How to manage token costs?**
- Set per-agent token limits
- Use cheaper models for simple tasks
- Cache common outputs
- Implement token usage tracking and alerts

### 9.2 Quality Control

**Q4: What defines "quality" for each department?**
- Story: Narrative coherence, pacing, structure (80%+ threshold)
- Character: Consistency, depth, believability (80%+ threshold)
- Visual: Style consistency, technical feasibility (85%+ threshold)
- Video: Production quality, editing flow (85%+ threshold)
- Audio: Sound quality, mixing balance (90%+ threshold)
- Production: Timeline adherence, resource efficiency (75%+ threshold)

**Q5: Who reviews department head outputs?**
- Master Orchestrator performs final review
- Cross-department consistency checks
- User feedback incorporated iteratively
- Quality metrics tracked over time

### 9.3 Communication

**Q6: How granular should real-time updates be?**
- **High Priority**: Agent start/complete, errors, quality scores
- **Medium Priority**: Tool calls, major decisions, reviews
- **Low Priority**: Thinking steps, minor iterations
- **User Configurable**: Allow users to set verbosity level

**Q7: How to display multi-agent workflows?**
- Hierarchical tree view (orchestrator → heads → specialists)
- Timeline view (chronological execution)
- Dependency graph (show relationships)
- Live status indicators (running, completed, failed)

---

## 10. Success Metrics

### 10.1 Performance Metrics
- **Execution Time**: Average time per agent type
- **Success Rate**: % of successful completions
- **Token Efficiency**: Tokens per output quality point
- **Parallel Efficiency**: Time saved through parallelization

### 10.2 Quality Metrics
- **Quality Scores**: Average scores by department
- **Review Pass Rate**: % approved on first review
- **User Satisfaction**: Feedback ratings
- **Consistency Score**: Cross-department coherence

### 10.3 System Metrics
- **Uptime**: System availability
- **Error Rate**: % of failed executions
- **Response Time**: Time to first output
- **Scalability**: Concurrent agent capacity

---

## 11. Next Steps

1. **Review & Approve**: Review this document and provide feedback
2. **Create Collections**: Implement PayloadCMS collections
3. **Seed Data**: Add initial departments and agents
4. **Install SDK**: Set up @codebuff/sdk integration
5. **Build Runner**: Create agent execution infrastructure
6. **Test Flow**: Run end-to-end test with one department
7. **Iterate**: Refine based on results
8. **Scale**: Add remaining departments and specialists

---

**Questions for You**:

1. **Agent Models**: Should all agents use Claude 3.5 Sonnet, or mix models based on task complexity?
2. **Custom Tools**: What specific tools do you want agents to have access to? (e.g., database queries, file operations, API calls)
3. **Review Process**: Should department heads auto-approve outputs above quality threshold, or always require manual review?
4. **Execution Context**: How much project context should be passed to each agent? (full project vs. relevant subset)
5. **Specialist Count**: How many specialists per department? (current plan: 3-8, configurable)
6. **Token Limits**: What's the maximum token budget per agent execution?
7. **Caching Strategy**: Should we cache common agent outputs (e.g., character profiles)?
8. **User Control**: How much control should users have over agent selection and execution?

Please provide your feedback and answers to these questions so we can proceed with implementation! 🚀