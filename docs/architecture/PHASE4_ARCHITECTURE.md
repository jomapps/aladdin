# Phase 4 Multi-Department Architecture

**Architect**: System Architecture Designer
**Date**: 2025-10-01
**Status**: Design Complete
**Phase**: 4 - Multi-Department Agents (50+ Agents)

---

## Executive Summary

Phase 4 extends the single-department system (Phase 2) into a complete multi-department agent hierarchy with 50+ specialized agents organized across 6 core departments. This architecture enables parallel processing of complex creative workflows while maintaining quality validation at every level.

### Key Innovations

1. **6-Department Structure**: Character, Story, Visual, Image Quality, Audio, Production
2. **50+ Specialist Agents**: On-demand spawning with agent pooling
3. **Cross-Department Coordination**: Dependency resolution and shared context
4. **Parallel Execution**: Within and across departments
5. **Quality Validation Pipeline**: Specialist → Department → Orchestrator → Brain
6. **Resource Management**: Agent pooling, timeout management, memory optimization

---

## System Architecture

### Hierarchical Structure

```
Level 1: Master Orchestrator (1 agent)
         ├─ Multi-department routing
         ├─ Cross-department coordination
         ├─ Dependency resolution
         └─ Final quality validation

Level 2: Department Heads (6 agents)
         ├─ Specialist agent spawning
         ├─ Department-specific grading
         ├─ Result aggregation
         └─ Department quality validation

Level 3: Specialist Agents (50+ agents)
         ├─ Task-specific execution
         ├─ Self-assessment
         ├─ Output generation
         └─ Context retrieval
```

### Department Organization

```
src/agents/
├── masterOrchestrator.ts         # Level 1: Coordinator
├── departments/
│   ├── characterHead.ts          # Level 2: Character Department
│   ├── storyHead.ts              # Level 2: Story Department
│   ├── visualHead.ts             # Level 2: Visual Department
│   ├── imageQualityHead.ts       # Level 2: Image Quality Department
│   ├── audioHead.ts              # Level 2: Audio Department
│   └── productionHead.ts         # Level 2: Production Department
├── specialists/
│   ├── character/                # 8 specialists
│   ├── story/                    # 7 specialists
│   ├── visual/                   # 10 specialists
│   ├── imageQuality/             # 6 specialists
│   ├── audio/                    # 6 specialists
│   └── production/               # 6 specialists
└── coordination/
    ├── departmentRouter.ts       # Multi-department routing
    ├── dependencyResolver.ts     # Cross-department dependencies
    ├── resultAggregator.ts       # Result compilation
    └── agentPool.ts              # Agent lifecycle management
```

---

## Department Definitions

### 1. Character Department

**Department Head**: `characterHead.ts` (existing)

**Responsibilities**:
- Character design and development
- Physical appearance and styling
- Voice and personality traits
- Character arc tracking

**Specialist Agents** (8 total):

| Agent ID | Display Name | Responsibility | Model |
|----------|-------------|----------------|-------|
| `character-creator` | Character Creator | Core personality, backstory, arc | gpt-4 |
| `hair-stylist` | Hair Stylist | Hairstyle design | gpt-4 |
| `costume-designer` | Costume Designer | Wardrobe and clothing | gpt-4 |
| `makeup-artist` | Makeup Artist | Makeup and special effects | gpt-4 |
| `voice-profile-creator` | Voice Profile Creator | Voice characteristics | gpt-4 |
| `character-arc-manager` | Character Arc Manager | Development tracking | gpt-4 |
| `relationship-mapper` | Relationship Mapper | Character relationships | gpt-4o-mini |
| `dialogue-stylist` | Dialogue Stylist | Speech patterns and vocabulary | gpt-4 |

**Grading Criteria**:
- Quality Score: Technical execution (40%)
- Relevance Score: Alignment with request (30%)
- Consistency Score: Fits existing content (30%)
- Threshold: 0.60

**Custom Tools**:
- `assess_relevance`: Determine if request is character-related
- `spawn_specialist`: Launch specialist agents
- `grade_output`: Evaluate specialist work
- `compile_report`: Aggregate department results
- `get_department_context`: Retrieve character data
- `save_character`: Persist character data

---

### 2. Story Department

**Department Head**: `storyHead.ts` (new)

**Responsibilities**:
- Narrative structure and plot development
- Story arcs and episode planning
- Theme and motif tracking
- Continuity management

**Specialist Agents** (7 total):

| Agent ID | Display Name | Responsibility | Model |
|----------|-------------|----------------|-------|
| `story-architect` | Story Architect | Overall narrative structure | gpt-4 |
| `episode-planner` | Episode Planner | Episode breakdown and pacing | gpt-4 |
| `plot-weaver` | Plot Weaver | Plot threads and subplots | gpt-4 |
| `theme-tracker` | Theme Tracker | Thematic elements | gpt-4o-mini |
| `dialogue-writer` | Dialogue Writer | Scene dialogue | gpt-4 |
| `continuity-checker` | Continuity Checker | Story consistency | gpt-4o-mini |
| `world-builder` | World Builder | Setting and environment | gpt-4 |

**Grading Criteria**:
- Narrative Coherence: Story logic and flow (35%)
- Character Integration: Character consistency (25%)
- Pacing Score: Timing and rhythm (20%)
- Originality Score: Creative elements (20%)
- Threshold: 0.65

**Custom Tools**:
- `assess_story_relevance`: Determine story-related requests
- `spawn_story_specialist`: Launch story specialists
- `grade_narrative_output`: Evaluate story work
- `check_plot_continuity`: Validate story consistency
- `get_story_context`: Retrieve narrative data
- `save_story_element`: Persist story data

---

### 3. Visual Department

**Department Head**: `visualHead.ts` (new)

**Responsibilities**:
- Visual style and cinematography
- Shot composition and framing
- Lighting and color grading
- Visual effects planning

**Specialist Agents** (10 total):

| Agent ID | Display Name | Responsibility | Model |
|----------|-------------|----------------|-------|
| `cinematographer` | Cinematographer | Shot composition and camera | gpt-4 |
| `lighting-designer` | Lighting Designer | Lighting setup and mood | gpt-4 |
| `color-grader` | Color Grader | Color palette and grading | gpt-4 |
| `production-designer` | Production Designer | Set and environment design | gpt-4 |
| `vfx-supervisor` | VFX Supervisor | Visual effects planning | gpt-4 |
| `storyboard-artist` | Storyboard Artist | Scene visualization | gpt-4 |
| `camera-operator` | Camera Operator | Camera movement and angles | gpt-4o-mini |
| `prop-master` | Prop Master | Props and set dressing | gpt-4o-mini |
| `location-scout` | Location Scout | Setting and location | gpt-4o-mini |
| `visual-continuity` | Visual Continuity | Visual consistency tracking | gpt-4o-mini |

**Grading Criteria**:
- Technical Quality: Professional execution (40%)
- Artistic Merit: Creative vision (30%)
- Production Feasibility: Can it be built? (20%)
- Visual Consistency: Style coherence (10%)
- Threshold: 0.70

**Custom Tools**:
- `assess_visual_relevance`: Determine visual requests
- `spawn_visual_specialist`: Launch visual specialists
- `grade_visual_output`: Evaluate visual work
- `validate_production_feasibility`: Check buildability
- `get_visual_context`: Retrieve visual references
- `save_visual_element`: Persist visual data

---

### 4. Image Quality Department

**Department Head**: `imageQualityHead.ts` (new)

**Responsibilities**:
- Image generation quality control
- Prompt engineering and optimization
- Style consistency validation
- Image enhancement and refinement

**Specialist Agents** (6 total):

| Agent ID | Display Name | Responsibility | Model |
|----------|-------------|----------------|-------|
| `prompt-engineer` | Prompt Engineer | Optimal prompt creation | gpt-4 |
| `style-validator` | Style Validator | Style consistency checking | gpt-4 |
| `image-enhancer` | Image Enhancer | Image quality improvement | gpt-4o-mini |
| `composition-critic` | Composition Critic | Visual composition analysis | gpt-4 |
| `detail-inspector` | Detail Inspector | Fine detail validation | gpt-4o-mini |
| `brand-consistency` | Brand Consistency | Visual brand alignment | gpt-4o-mini |

**Grading Criteria**:
- Prompt Quality: Effectiveness of prompts (35%)
- Style Consistency: Visual coherence (30%)
- Technical Quality: Image specifications (25%)
- Brand Alignment: Aladdin visual style (10%)
- Threshold: 0.75

**Custom Tools**:
- `assess_image_quality_relevance`: Determine image quality needs
- `spawn_image_quality_specialist`: Launch specialists
- `grade_image_quality_output`: Evaluate quality work
- `validate_style_consistency`: Check visual coherence
- `optimize_prompt`: Enhance image prompts
- `save_quality_metrics`: Persist quality data

---

### 5. Audio Department

**Department Head**: `audioHead.ts` (new)

**Responsibilities**:
- Sound design and music
- Voice direction and audio quality
- Audio effects and mixing
- Soundscape creation

**Specialist Agents** (6 total):

| Agent ID | Display Name | Responsibility | Model |
|----------|-------------|----------------|-------|
| `sound-designer` | Sound Designer | Sound effects and foley | gpt-4 |
| `music-supervisor` | Music Supervisor | Music selection and composition | gpt-4 |
| `voice-director` | Voice Director | Voice acting direction | gpt-4 |
| `audio-mixer` | Audio Mixer | Audio balance and mixing | gpt-4o-mini |
| `soundscape-creator` | Soundscape Creator | Ambient audio design | gpt-4o-mini |
| `dialogue-editor` | Dialogue Editor | Dialogue quality and clarity | gpt-4o-mini |

**Grading Criteria**:
- Audio Quality: Technical excellence (40%)
- Creative Merit: Artistic value (30%)
- Character Fit: Matches character (20%)
- Production Feasibility: Can it be created? (10%)
- Threshold: 0.65

**Custom Tools**:
- `assess_audio_relevance`: Determine audio requests
- `spawn_audio_specialist`: Launch audio specialists
- `grade_audio_output`: Evaluate audio work
- `validate_audio_feasibility`: Check production viability
- `get_audio_context`: Retrieve audio references
- `save_audio_element`: Persist audio data

---

### 6. Production Department

**Department Head**: `productionHead.ts` (new)

**Responsibilities**:
- Production planning and scheduling
- Resource allocation and budgeting
- Technical feasibility validation
- Quality assurance and delivery

**Specialist Agents** (6 total):

| Agent ID | Display Name | Responsibility | Model |
|----------|-------------|----------------|-------|
| `production-planner` | Production Planner | Production scheduling | gpt-4o-mini |
| `budget-manager` | Budget Manager | Cost estimation | gpt-4o-mini |
| `technical-director` | Technical Director | Technical feasibility | gpt-4 |
| `qa-specialist` | QA Specialist | Quality validation | gpt-4 |
| `asset-coordinator` | Asset Coordinator | Asset management | gpt-4o-mini |
| `delivery-manager` | Delivery Manager | Final delivery coordination | gpt-4o-mini |

**Grading Criteria**:
- Feasibility Score: Can it be done? (40%)
- Resource Efficiency: Optimal resource use (30%)
- Timeline Accuracy: Realistic scheduling (20%)
- Risk Assessment: Identified risks (10%)
- Threshold: 0.60

**Custom Tools**:
- `assess_production_relevance`: Determine production requests
- `spawn_production_specialist`: Launch specialists
- `grade_production_output`: Evaluate production work
- `validate_feasibility`: Check production viability
- `estimate_resources`: Calculate resource needs
- `save_production_plan`: Persist production data

---

## Master Orchestrator Updates

### Enhanced Capabilities

**File**: `src/agents/masterOrchestrator.ts`

**New Responsibilities**:

1. **Multi-Department Routing**
   - Analyze user requests for multiple department involvement
   - Route to 1-6 departments based on request complexity
   - Assign priority levels (critical, high, medium, low)

2. **Dependency Management**
   - Identify cross-department dependencies
   - Ensure sequential execution where needed (e.g., Character → Visual)
   - Enable parallel execution where possible (e.g., Audio + Visual)

3. **Cross-Department Coordination**
   - Share context between departments
   - Validate cross-department consistency
   - Resolve conflicts between department outputs

4. **Result Aggregation**
   - Collect outputs from all departments
   - Validate overall quality and consistency
   - Generate unified user presentation

**Updated Instruction Prompt**:

```typescript
instructionsPrompt: `
You are the Master Orchestrator for Aladdin movie production.

Your role:
1. Analyze user requests from chat
2. Determine which departments are involved (1-6 departments)
3. Route requests to appropriate department heads with priorities
4. Identify and manage cross-department dependencies
5. Coordinate parallel and sequential execution
6. Aggregate and validate final results across all departments
7. Present unified output to user

Process:
1. ANALYZE REQUEST
   - Identify intent and scope
   - Determine relevant departments:
     * Character: Character design, styling, personality
     * Story: Narrative, plot, dialogue, world-building
     * Visual: Cinematography, lighting, composition, VFX
     * Image Quality: Prompt engineering, style validation
     * Audio: Sound design, music, voice direction
     * Production: Planning, budgeting, feasibility, QA

2. PLAN EXECUTION
   - Assign priorities (critical/high/medium/low)
   - Identify dependencies:
     * Character must complete before Visual (appearance needed)
     * Story must complete before Visual (scene context needed)
     * Audio can run parallel with Visual
     * Image Quality validates after Visual
     * Production validates feasibility throughout

3. ROUTE TO DEPARTMENTS
   - Send specific instructions to each department
   - Include dependency information
   - Specify expected output format
   - Set quality thresholds

4. COORDINATE EXECUTION
   - Launch independent departments in parallel
   - Wait for dependencies before launching dependent departments
   - Monitor progress across all departments
   - Handle partial failures gracefully

5. AGGREGATE RESULTS
   - Collect all department reports
   - Validate cross-department consistency:
     * Character appearance matches Visual descriptions
     * Story dialogue matches Character voice profiles
     * Audio direction matches Character personality
     * Visual style matches Image Quality standards

6. VALIDATE QUALITY
   - Send aggregated results to Brain for final validation
   - Check overall quality score (must be > 0.75)
   - Identify any inconsistencies or issues

7. PRESENT TO USER
   - Format unified output with:
     * Summary of all department contributions
     * Quality scores per department
     * Overall quality score
     * Any issues or recommendations
   - Ask user: INGEST, MODIFY, or DISCARD?

IMPORTANT:
- You coordinate but don't execute tasks yourself
- Each department head grades their specialist outputs
- You validate cross-department consistency
- Final Brain validation before user presentation
- Handle 1-6 departments in a single request
- Enable maximum parallelization while respecting dependencies
`,

customTools: [
  'route_to_departments',      // Multi-department routing
  'resolve_dependencies',       // Dependency management
  'aggregate_reports',          // Result compilation
  'validate_consistency',       // Cross-department validation
  'query_brain',                // Final quality validation
  'present_to_user'             // User presentation
]
```

---

## Cross-Department Coordination

### Department Router

**File**: `src/agents/coordination/departmentRouter.ts`

**Purpose**: Route requests to multiple departments with priority and dependency management

**Key Functions**:

```typescript
interface RoutingDecision {
  departments: DepartmentAssignment[]
  executionPlan: ExecutionPlan
  dependencies: DependencyGraph
}

interface DepartmentAssignment {
  departmentId: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  instructions: string
  expectedOutputFormat: object
  qualityThreshold: number
  dependencies: string[]  // Department IDs that must complete first
}

interface ExecutionPlan {
  phases: ExecutionPhase[]
  estimatedDuration: number
  maxParallelism: number
}

interface ExecutionPhase {
  phaseNumber: number
  departments: string[]  // Run in parallel
  waitFor: string[]      // Previous phase dependencies
}

// Example routing decision
const routingDecision: RoutingDecision = {
  departments: [
    {
      departmentId: 'character',
      priority: 'critical',
      instructions: 'Create cyberpunk detective character',
      expectedOutputFormat: { /* character schema */ },
      qualityThreshold: 0.70,
      dependencies: []  // No dependencies, can start immediately
    },
    {
      departmentId: 'story',
      priority: 'high',
      instructions: 'Create episode 1 plot for detective',
      expectedOutputFormat: { /* story schema */ },
      qualityThreshold: 0.65,
      dependencies: ['character']  // Needs character first
    },
    {
      departmentId: 'visual',
      priority: 'high',
      instructions: 'Design visual style for detective scenes',
      expectedOutputFormat: { /* visual schema */ },
      qualityThreshold: 0.70,
      dependencies: ['character', 'story']  // Needs both
    },
    {
      departmentId: 'audio',
      priority: 'medium',
      instructions: 'Create soundscape for cyberpunk setting',
      expectedOutputFormat: { /* audio schema */ },
      qualityThreshold: 0.65,
      dependencies: ['story']  // Needs story context
    }
  ],
  executionPlan: {
    phases: [
      {
        phaseNumber: 1,
        departments: ['character'],  // Solo execution
        waitFor: []
      },
      {
        phaseNumber: 2,
        departments: ['story'],  // Solo execution
        waitFor: ['character']
      },
      {
        phaseNumber: 3,
        departments: ['visual', 'audio'],  // Parallel execution
        waitFor: ['story']
      }
    ],
    estimatedDuration: 180,  // seconds
    maxParallelism: 2
  },
  dependencies: {
    // Dependency graph for visualization
    nodes: ['character', 'story', 'visual', 'audio'],
    edges: [
      { from: 'character', to: 'story' },
      { from: 'character', to: 'visual' },
      { from: 'story', to: 'visual' },
      { from: 'story', to: 'audio' }
    ]
  }
}
```

**Routing Algorithm**:

1. **Analyze Request**: Parse user input for department keywords
2. **Assign Departments**: Select 1-6 relevant departments
3. **Build Dependency Graph**: Identify required execution order
4. **Create Execution Plan**: Group into parallel phases
5. **Return Routing Decision**: Send to orchestrator

---

### Dependency Resolver

**File**: `src/agents/coordination/dependencyResolver.ts`

**Purpose**: Resolve cross-department dependencies and manage execution flow

**Key Functions**:

```typescript
interface DependencyGraph {
  nodes: string[]  // Department IDs
  edges: DependencyEdge[]
}

interface DependencyEdge {
  from: string  // Source department
  to: string    // Dependent department
  reason: string
  dataRequired: string[]
}

class DependencyResolver {
  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(graph: DependencyGraph): boolean {
    // Topological sort algorithm
    // Returns true if circular dependency detected
  }

  /**
   * Create execution phases from dependency graph
   */
  createExecutionPhases(graph: DependencyGraph): ExecutionPhase[] {
    // Group departments into phases
    // Phase N can only start after Phase N-1 completes
    // Within a phase, all departments run in parallel
  }

  /**
   * Wait for dependencies to complete
   */
  async waitForDependencies(
    departmentId: string,
    dependencies: string[],
    timeout: number = 300000  // 5 minutes
  ): Promise<DepartmentReport[]> {
    // Poll for dependency completion
    // Return dependency outputs once available
    // Throw error on timeout
  }

  /**
   * Share context between departments
   */
  shareContext(
    fromDepartment: string,
    toDepartment: string,
    context: any
  ): void {
    // Store context for dependent department to retrieve
  }
}

// Dependency rules
const DEPENDENCY_RULES = {
  'visual': {
    requires: ['character', 'story'],
    reason: 'Visual needs character appearance and scene context',
    dataRequired: ['character.appearance', 'story.scenes']
  },
  'audio': {
    requires: ['character', 'story'],
    reason: 'Audio needs character voice and scene context',
    dataRequired: ['character.voiceProfile', 'story.dialogue']
  },
  'imageQuality': {
    requires: ['visual'],
    reason: 'Image quality validates visual outputs',
    dataRequired: ['visual.style', 'visual.composition']
  },
  'production': {
    requires: ['character', 'story', 'visual', 'audio'],
    reason: 'Production validates feasibility of all departments',
    dataRequired: ['*.all']
  }
}
```

---

### Result Aggregator

**File**: `src/agents/coordination/resultAggregator.ts`

**Purpose**: Compile outputs from multiple departments into unified result

**Key Functions**:

```typescript
interface AggregatedResult {
  departments: DepartmentReport[]
  crossDepartmentValidation: CrossDepartmentValidation
  overallQuality: number
  issues: Issue[]
  recommendations: string[]
  userPresentation: UserPresentation
}

interface CrossDepartmentValidation {
  characterVisualConsistency: number  // Do character and visual match?
  storyDialogueConsistency: number    // Does dialogue match character?
  visualAudioAlignment: number        // Do visual and audio complement?
  styleConsistency: number            // Is visual style coherent?
  productionFeasibility: number       // Can this be produced?

  overallConsistency: number
  inconsistencies: Inconsistency[]
}

interface Inconsistency {
  departments: string[]
  issue: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  suggestion: string
}

class ResultAggregator {
  /**
   * Aggregate all department reports
   */
  async aggregateDepartmentReports(
    reports: DepartmentReport[]
  ): Promise<AggregatedResult> {
    // Compile all outputs
    // Validate cross-department consistency
    // Calculate overall quality
    // Generate user presentation
  }

  /**
   * Validate cross-department consistency
   */
  validateConsistency(
    reports: DepartmentReport[]
  ): CrossDepartmentValidation {
    // Check character-visual consistency
    // Check story-dialogue consistency
    // Check visual-audio alignment
    // Identify inconsistencies
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallQuality(
    reports: DepartmentReport[],
    consistency: CrossDepartmentValidation
  ): number {
    // Weighted average of department scores
    // Penalty for inconsistencies
    // Bonus for high consistency
  }

  /**
   * Format for user presentation
   */
  formatUserPresentation(
    result: AggregatedResult
  ): UserPresentation {
    // Create readable summary
    // Include quality scores
    // Show department contributions
    // Present issues and recommendations
  }
}

// Consistency validation rules
const CONSISTENCY_RULES = {
  characterVisual: {
    check: (char: any, visual: any) => {
      // Compare character appearance with visual descriptions
      return compareAppearance(char.appearance, visual.characterDesign)
    },
    weight: 0.25
  },
  storyDialogue: {
    check: (char: any, story: any) => {
      // Compare character voice with dialogue style
      return compareDialogueStyle(char.voiceProfile, story.dialogue)
    },
    weight: 0.20
  },
  visualAudio: {
    check: (visual: any, audio: any) => {
      // Check visual-audio complementarity
      return checkAudioVisualSync(visual.mood, audio.soundscape)
    },
    weight: 0.20
  },
  styleConsistency: {
    check: (visual: any, imageQuality: any) => {
      // Validate visual style coherence
      return validateStyleAlignment(visual.style, imageQuality.standards)
    },
    weight: 0.20
  },
  productionFeasibility: {
    check: (allReports: any[], production: any) => {
      // Validate overall production feasibility
      return validateFeasibility(allReports, production.constraints)
    },
    weight: 0.15
  }
}
```

---

## Agent Pool Management

### Agent Lifecycle

**File**: `src/agents/coordination/agentPool.ts`

**Purpose**: Manage 50+ specialist agents efficiently with pooling and reuse

**Key Concepts**:

1. **Agent Pooling**: Reuse specialist agents instead of creating new ones
2. **Lazy Initialization**: Only create agents when first needed
3. **Timeout Management**: Terminate idle agents after timeout
4. **Memory Management**: Limit concurrent agents to prevent memory issues
5. **Health Monitoring**: Track agent performance and errors

**Implementation**:

```typescript
interface AgentPoolConfig {
  maxConcurrentAgents: number  // Max agents running simultaneously
  agentIdleTimeout: number     // Terminate after N ms of inactivity
  agentMaxLifetime: number     // Force restart after N ms
  enablePooling: boolean       // Reuse agents vs create new
  healthCheckInterval: number  // Health check frequency
}

class AgentPool {
  private agents: Map<string, PooledAgent> = new Map()
  private activeAgents: Set<string> = new Set()
  private config: AgentPoolConfig

  constructor(config: AgentPoolConfig) {
    this.config = config
    this.startHealthMonitoring()
  }

  /**
   * Get or create specialist agent
   */
  async getAgent(specialistId: string): Promise<PooledAgent> {
    // Check pool for existing agent
    if (this.config.enablePooling && this.agents.has(specialistId)) {
      const agent = this.agents.get(specialistId)!
      if (agent.isHealthy()) {
        agent.resetIdleTimer()
        this.activeAgents.add(specialistId)
        return agent
      }
    }

    // Create new agent if needed
    if (this.activeAgents.size >= this.config.maxConcurrentAgents) {
      await this.waitForAvailableSlot()
    }

    const agent = await this.createAgent(specialistId)
    this.agents.set(specialistId, agent)
    this.activeAgents.add(specialistId)
    return agent
  }

  /**
   * Release agent back to pool
   */
  releaseAgent(specialistId: string): void {
    this.activeAgents.delete(specialistId)

    if (this.config.enablePooling) {
      // Keep in pool for reuse
      const agent = this.agents.get(specialistId)
      if (agent) {
        agent.startIdleTimer(this.config.agentIdleTimeout)
      }
    } else {
      // Terminate immediately
      this.terminateAgent(specialistId)
    }
  }

  /**
   * Terminate idle agents
   */
  private cleanupIdleAgents(): void {
    const now = Date.now()
    for (const [id, agent] of this.agents.entries()) {
      if (agent.isIdle() && (now - agent.lastUsed) > this.config.agentIdleTimeout) {
        this.terminateAgent(id)
      }
    }
  }

  /**
   * Monitor agent health
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.cleanupIdleAgents()
      this.checkAgentHealth()
    }, this.config.healthCheckInterval)
  }
}

interface PooledAgent {
  id: string
  instance: any  // Actual agent instance
  createdAt: number
  lastUsed: number
  executionCount: number
  errorCount: number

  isHealthy(): boolean
  isIdle(): boolean
  resetIdleTimer(): void
  startIdleTimer(timeout: number): void
}

// Pool configuration
const AGENT_POOL_CONFIG: AgentPoolConfig = {
  maxConcurrentAgents: 20,     // Max 20 agents running at once
  agentIdleTimeout: 60000,     // Terminate after 60s idle
  agentMaxLifetime: 1800000,   // Force restart after 30 minutes
  enablePooling: true,         // Enable agent reuse
  healthCheckInterval: 10000   // Check health every 10s
}
```

---

## Quality Validation Pipeline

### Multi-Level Validation

```
User Request
    ↓
Master Orchestrator (Route to departments)
    ↓
Department Heads (Spawn specialists)
    ↓
Specialist Agents (Self-assessment)
    ↓ [Output + Confidence + Completeness]
    ↓
Department Heads (Grade outputs)
    ↓ [Quality + Relevance + Consistency scores]
    ↓
Master Orchestrator (Aggregate + Cross-validate)
    ↓ [Cross-department consistency validation]
    ↓
Brain Service (Final validation)
    ↓ [Brand alignment + Quality validation]
    ↓
User (INGEST / MODIFY / DISCARD decision)
```

### Quality Thresholds

| Level | Agent Type | Threshold | Action if Below |
|-------|-----------|-----------|-----------------|
| 3 | Specialist | 0.50 | Revise with feedback |
| 2 | Department Head | 0.60-0.75 | Request specialist revision |
| 1 | Master Orchestrator | 0.75 | Send back to department |
| 0 | Brain Service | 0.80 | Recommend MODIFY to user |

---

## Performance Optimization

### Parallel Execution Strategy

**Within Department** (Horizontal Parallelism):
- All specialists within a department run in parallel
- Example: Character department spawns 8 specialists simultaneously
- Limited by `maxConcurrentAgents` in agent pool

**Across Departments** (Vertical Parallelism):
- Independent departments run in parallel
- Example: Audio + Image Quality can run together
- Dependent departments run sequentially (Character → Visual)

**Execution Flow Example**:

```
Request: "Create cyberpunk detective with episode 1"

Phase 1 (Sequential):
  ├─ Character Department (8 specialists in parallel)
  └─ Wait for Character completion...

Phase 2 (Sequential):
  ├─ Story Department (7 specialists in parallel)
  └─ Wait for Story completion...

Phase 3 (Parallel):
  ├─ Visual Department (10 specialists in parallel)
  └─ Audio Department (6 specialists in parallel)
  └─ Wait for both completions...

Phase 4 (Sequential):
  ├─ Image Quality Department (6 specialists in parallel)
  └─ Wait for Image Quality completion...

Phase 5 (Sequential):
  ├─ Production Department (6 specialists in parallel)
  └─ Wait for Production completion...

Aggregate → Brain Validation → User Presentation

Total Specialists: 43 agents
Execution Time: ~3-5 minutes (vs 20+ minutes sequential)
Parallelization: 4.5x speedup
```

### Resource Management

**Memory Optimization**:
- Agent pooling reduces memory footprint
- Lazy initialization of specialists
- Idle agent cleanup
- Maximum 20 concurrent agents

**Timeout Management**:
- Specialist timeout: 60 seconds per task
- Department timeout: 5 minutes total
- Orchestrator timeout: 10 minutes overall
- Graceful degradation on partial failures

**Error Handling**:
- Specialist failure: Continue with available outputs
- Department failure: Mark as incomplete, continue with other departments
- Orchestrator failure: Return partial results with warning
- Brain validation failure: Present to user with quality warning

---

## Cross-Department Communication

### Shared Context System

**File**: `src/agents/coordination/sharedContext.ts`

**Purpose**: Enable departments to share data and context

```typescript
interface SharedContext {
  requestId: string
  userRequest: string
  departments: Map<string, DepartmentContext>
  globalMetadata: any
}

interface DepartmentContext {
  departmentId: string
  status: 'pending' | 'in_progress' | 'complete' | 'failed'
  outputs: any[]
  sharedData: any  // Data available to other departments
  startedAt: number
  completedAt?: number
}

class SharedContextManager {
  private contexts: Map<string, SharedContext> = new Map()

  /**
   * Create context for new request
   */
  createContext(requestId: string, userRequest: string): SharedContext {
    const context: SharedContext = {
      requestId,
      userRequest,
      departments: new Map(),
      globalMetadata: {}
    }
    this.contexts.set(requestId, context)
    return context
  }

  /**
   * Share data from one department to others
   */
  shareData(
    requestId: string,
    fromDepartment: string,
    data: any
  ): void {
    const context = this.contexts.get(requestId)
    if (!context) return

    const deptContext = context.departments.get(fromDepartment)
    if (deptContext) {
      deptContext.sharedData = data
    }
  }

  /**
   * Retrieve shared data from dependency
   */
  getSharedData(
    requestId: string,
    fromDepartment: string
  ): any {
    const context = this.contexts.get(requestId)
    if (!context) return null

    const deptContext = context.departments.get(fromDepartment)
    return deptContext?.sharedData
  }

  /**
   * Check if department dependencies are complete
   */
  areDependenciesComplete(
    requestId: string,
    dependencies: string[]
  ): boolean {
    const context = this.contexts.get(requestId)
    if (!context) return false

    return dependencies.every(dep => {
      const deptContext = context.departments.get(dep)
      return deptContext?.status === 'complete'
    })
  }
}
```

### Message Passing Protocol

```typescript
interface DepartmentMessage {
  from: string       // Source department
  to: string         // Target department
  type: 'data' | 'request' | 'notification'
  payload: any
  timestamp: number
}

// Example: Character department shares data with Visual
const message: DepartmentMessage = {
  from: 'character',
  to: 'visual',
  type: 'data',
  payload: {
    characterAppearance: {
      height: '6\'2"',
      build: 'athletic',
      hair: { style: 'short', color: 'black' },
      clothing: { style: 'cyberpunk detective coat' }
    }
  },
  timestamp: Date.now()
}
```

---

## Integration with Phase 2 & Phase 3

### Phase 2 Integration (Chat & Agents)

**Existing**:
- Master Orchestrator (Level 1)
- Character Department Head (Level 2)
- Character specialists (Level 3)
- Custom tools infrastructure

**Phase 4 Additions**:
- 5 new department heads
- 42+ new specialists
- Enhanced orchestrator routing
- Cross-department coordination

**Migration Path**:
1. Keep existing Character department unchanged
2. Add new department heads in parallel
3. Update Master Orchestrator with multi-department routing
4. Test with single department first, then multi-department

### Phase 3 Integration (Brain Service)

**Brain Validation Flow**:

```typescript
// Master Orchestrator sends aggregated results to Brain
const brainValidation = await queryBrain({
  type: 'validate_aggregated_result',
  data: {
    departments: aggregatedResult.departments,
    crossDepartmentConsistency: aggregatedResult.crossDepartmentValidation,
    overallQuality: aggregatedResult.overallQuality
  }
})

// Brain returns validation
interface BrainValidation {
  validated: boolean
  qualityScore: number
  brandAlignment: number
  issues: string[]
  recommendations: string[]
  decision: 'ingest' | 'modify' | 'discard'
}
```

**Brain Storage**:
- Each department report stored in Brain vector database
- Cross-department relationships indexed
- Quality scores tracked over time
- Learning from user INGEST/MODIFY/DISCARD decisions

---

## File Structure Summary

```
src/
├── agents/
│   ├── types.ts (update with new departments)
│   ├── masterOrchestrator.ts (update for multi-dept)
│   │
│   ├── departments/
│   │   ├── characterHead.ts (existing - Phase 2)
│   │   ├── storyHead.ts (new)
│   │   ├── visualHead.ts (new)
│   │   ├── imageQualityHead.ts (new)
│   │   ├── audioHead.ts (new)
│   │   └── productionHead.ts (new)
│   │
│   ├── specialists/
│   │   ├── character/ (8 agents)
│   │   │   ├── characterCreator.ts (existing)
│   │   │   ├── hairStylist.ts (existing)
│   │   │   ├── costumeDesigner.ts (new)
│   │   │   ├── makeupArtist.ts (new)
│   │   │   ├── voiceProfileCreator.ts (new)
│   │   │   ├── characterArcManager.ts (new)
│   │   │   ├── relationshipMapper.ts (new)
│   │   │   └── dialogueStylist.ts (new)
│   │   │
│   │   ├── story/ (7 agents)
│   │   │   ├── storyArchitect.ts (new)
│   │   │   ├── episodePlanner.ts (new)
│   │   │   ├── plotWeaver.ts (new)
│   │   │   ├── themeTracker.ts (new)
│   │   │   ├── dialogueWriter.ts (new)
│   │   │   ├── continuityChecker.ts (new)
│   │   │   └── worldBuilder.ts (new)
│   │   │
│   │   ├── visual/ (10 agents)
│   │   │   ├── cinematographer.ts (new)
│   │   │   ├── lightingDesigner.ts (new)
│   │   │   ├── colorGrader.ts (new)
│   │   │   ├── productionDesigner.ts (new)
│   │   │   ├── vfxSupervisor.ts (new)
│   │   │   ├── storyboardArtist.ts (new)
│   │   │   ├── cameraOperator.ts (new)
│   │   │   ├── propMaster.ts (new)
│   │   │   ├── locationScout.ts (new)
│   │   │   └── visualContinuity.ts (new)
│   │   │
│   │   ├── imageQuality/ (6 agents)
│   │   │   ├── promptEngineer.ts (new)
│   │   │   ├── styleValidator.ts (new)
│   │   │   ├── imageEnhancer.ts (new)
│   │   │   ├── compositionCritic.ts (new)
│   │   │   ├── detailInspector.ts (new)
│   │   │   └── brandConsistency.ts (new)
│   │   │
│   │   ├── audio/ (6 agents)
│   │   │   ├── soundDesigner.ts (new)
│   │   │   ├── musicSupervisor.ts (new)
│   │   │   ├── voiceDirector.ts (new)
│   │   │   ├── audioMixer.ts (new)
│   │   │   ├── soundscapeCreator.ts (new)
│   │   │   └── dialogueEditor.ts (new)
│   │   │
│   │   └── production/ (6 agents)
│   │       ├── productionPlanner.ts (new)
│   │       ├── budgetManager.ts (new)
│   │       ├── technicalDirector.ts (new)
│   │       ├── qaSpecialist.ts (new)
│   │       ├── assetCoordinator.ts (new)
│   │       └── deliveryManager.ts (new)
│   │
│   ├── coordination/
│   │   ├── departmentRouter.ts (new)
│   │   ├── dependencyResolver.ts (new)
│   │   ├── resultAggregator.ts (new)
│   │   ├── agentPool.ts (new)
│   │   └── sharedContext.ts (new)
│   │
│   └── tools/
│       ├── routeToDepartment.ts (update to routeToDepartments)
│       ├── gradeOutput.ts (existing)
│       ├── queryBrain.ts (update for aggregated results)
│       ├── resolveDependencies.ts (new)
│       ├── aggregateReports.ts (new)
│       ├── validateConsistency.ts (new)
│       └── presentToUser.ts (new)
│
└── lib/
    └── agents/
        ├── grading.ts (existing)
        ├── pooling.ts (new)
        └── coordination.ts (new)
```

**File Count**:
- Department Heads: 6 files (1 existing + 5 new)
- Specialists: 43 files (2 existing + 41 new)
- Coordination: 5 files (all new)
- Tools: 7 files (3 existing updated + 4 new)
- **Total New Files**: 55 files

---

## Dependency Graph Visualization

```
User Request
    │
    ▼
Master Orchestrator
    │
    ├─────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
    │                 │              │              │              │              │
    ▼                 ▼              ▼              ▼              ▼              ▼
Character Dept    Story Dept    Visual Dept   Image Qual.     Audio Dept    Production
    │                 │              │              │              │              │
    │                 │              │              │              │              │
    │◄────────────────┘              │              │              │              │
    │                                │              │              │              │
    │◄───────────────────────────────┘              │              │              │
    │                                               │              │              │
    │                                               │              │              │
    │◄──────────────────────────────────────────────┘              │              │
    │                                                              │              │
    │◄─────────────────────────────────────────────────────────────┘              │
    │                                                                             │
    │◄────────────────────────────────────────────────────────────────────────────┘
    │
    ▼
All Outputs Aggregated
    │
    ▼
Cross-Department Validation
    │
    ▼
Brain Service Validation
    │
    ▼
User Presentation

Legend:
  ── Sequential dependency (must wait)
  │  Parallel execution (can run together)
```

---

## Implementation Strategy

### Week 13-14: Department Heads

**Priority 1**: Story Department (Critical for narrative)
1. Create `storyHead.ts` with 7 specialist definitions
2. Implement story-specific grading criteria
3. Test with simple story request

**Priority 2**: Visual Department (Critical for image generation)
1. Create `visualHead.ts` with 10 specialist definitions
2. Implement visual-specific grading criteria
3. Test with character visual request

**Priority 3**: Audio, Image Quality, Production (Support departments)
1. Create remaining 3 department heads
2. Implement department-specific grading
3. Test individually

### Week 15-16: Specialists & Coordination

**Priority 1**: Core Specialists (15 most-used agents)
1. Character: Creator, Hair, Costume, Voice (4)
2. Story: Architect, Planner, Dialogue (3)
3. Visual: Cinematographer, Lighting, Production Designer (3)
4. Image Quality: Prompt Engineer, Style Validator (2)
5. Audio: Sound Designer, Voice Director (2)
6. Production: Technical Director (1)

**Priority 2**: Coordination Infrastructure
1. Department Router (multi-department routing)
2. Dependency Resolver (execution planning)
3. Result Aggregator (output compilation)
4. Agent Pool (resource management)
5. Shared Context (data sharing)

**Priority 3**: Remaining Specialists (28 support agents)
1. Fill out all 6 departments
2. Test parallel execution within departments
3. Test cross-department workflows

### Week 16: Integration & Testing

**Integration Tests**:
1. Single department (Character only)
2. Two departments with dependency (Character → Visual)
3. Two departments parallel (Audio + Visual)
4. Three departments (Character → Story → Visual)
5. All six departments

**Performance Tests**:
1. Measure execution time vs sequential
2. Validate parallelization gains
3. Test agent pool efficiency
4. Stress test with 20+ concurrent agents

**Quality Tests**:
1. Validate grading at all levels
2. Test cross-department consistency
3. Verify Brain integration
4. Test user presentation format

---

## Architecture Decision Records

### ADR-001: Agent Pooling Strategy

**Decision**: Implement agent pooling with lazy initialization

**Context**: 50+ specialist agents could create memory pressure if all initialized upfront

**Options**:
1. Create all agents on startup (simple but memory-intensive)
2. Create agents on-demand and destroy (no memory but slow)
3. Agent pooling with idle cleanup (balanced)

**Choice**: Option 3 (Agent pooling)

**Rationale**:
- Reduces memory footprint (max 20 concurrent agents)
- Improves performance through agent reuse
- Provides graceful degradation under load
- Enables monitoring and health checks

**Trade-offs**:
- Added complexity in pool management
- Requires timeout and cleanup logic
- Potential for state leakage between uses (mitigated by reset logic)

---

### ADR-002: Execution Strategy

**Decision**: Hybrid parallel-sequential execution based on dependencies

**Context**: Some departments depend on others, some can run independently

**Options**:
1. Full sequential execution (slow but simple)
2. Full parallel execution (fast but inconsistent)
3. Hybrid with dependency resolution (optimal)

**Choice**: Option 3 (Hybrid)

**Rationale**:
- Maximizes parallelization where possible
- Respects data dependencies (Character → Visual)
- Provides 4-5x speedup vs sequential
- Maintains data consistency

**Trade-offs**:
- Requires dependency graph management
- More complex orchestration logic
- Potential for deadlocks (mitigated by timeout)

---

### ADR-003: Quality Validation Approach

**Decision**: Multi-level validation (Specialist → Department → Orchestrator → Brain)

**Context**: Need quality control without centralized bottleneck

**Options**:
1. Brain validates everything (slow, centralized)
2. Specialists self-validate only (fast but unreliable)
3. Multi-level validation pyramid (balanced)

**Choice**: Option 3 (Multi-level pyramid)

**Rationale**:
- Specialists catch obvious issues early (self-assessment)
- Department heads ensure relevance and consistency
- Orchestrator validates cross-department alignment
- Brain provides final brand validation
- Faster feedback loops at lower levels

**Trade-offs**:
- More validation overhead
- Potential for conflicting grades
- Requires clear threshold definitions

---

### ADR-004: Cross-Department Communication

**Decision**: Shared context with message passing

**Context**: Departments need to share data (e.g., Character → Visual)

**Options**:
1. Direct department-to-department calls (tightly coupled)
2. Central orchestrator mediates everything (slow)
3. Shared context with async messages (decoupled)

**Choice**: Option 3 (Shared context)

**Rationale**:
- Decouples departments (no direct dependencies)
- Enables parallel execution
- Provides clear data contracts
- Supports monitoring and debugging

**Trade-offs**:
- Requires context manager infrastructure
- Potential for data staleness
- More complex debugging (async)

---

### ADR-005: Department Granularity

**Decision**: 6 departments vs 10+ micro-departments

**Context**: Balance between specialization and coordination overhead

**Options**:
1. 3 mega-departments (Character, Creative, Technical) - too coarse
2. 10+ micro-departments (one per function) - too granular
3. 6 balanced departments - optimal

**Choice**: Option 3 (6 departments)

**Rationale**:
- Each department has clear, focused responsibility
- Manageable number of coordination points
- Aligns with movie production structure
- Allows future expansion if needed

**Departments**:
1. Character (identity and styling)
2. Story (narrative and plot)
3. Visual (cinematography and production design)
4. Image Quality (validation and enhancement)
5. Audio (sound and music)
6. Production (planning and QA)

---

## Performance Targets

### Execution Time

| Complexity | Departments | Specialists | Sequential | Parallel | Speedup |
|-----------|-------------|-------------|-----------|----------|---------|
| Simple | 1 | 3-5 | 45s | 15s | 3x |
| Medium | 2-3 | 10-15 | 180s | 45s | 4x |
| Complex | 4-6 | 30-43 | 600s | 120s | 5x |

### Quality Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Specialist Quality | > 0.50 | Self-assessment scores |
| Department Quality | > 0.60 | Department head grading |
| Cross-Dept Consistency | > 0.75 | Consistency validation |
| Brain Validation | > 0.80 | Final quality score |
| User Satisfaction | > 85% | INGEST rate |

### Resource Limits

| Resource | Limit | Rationale |
|----------|-------|-----------|
| Concurrent Agents | 20 | Memory management |
| Agent Idle Timeout | 60s | Resource cleanup |
| Department Timeout | 5min | Prevent hangs |
| Request Timeout | 10min | Overall execution limit |
| Memory per Agent | 50MB | Prevent memory leaks |

---

## Testing Strategy

### Unit Tests

**Department Heads** (6 tests):
- Test specialist spawning logic
- Test grading criteria application
- Test relevance assessment
- Test report compilation

**Specialists** (43 tests):
- Test output format compliance
- Test self-assessment accuracy
- Test context retrieval
- Test confidence scoring

**Coordination** (5 tests):
- Test routing decisions
- Test dependency resolution
- Test result aggregation
- Test agent pooling
- Test shared context

### Integration Tests

**Single Department**:
```typescript
test('Character department creates complete character', async () => {
  const result = await masterOrchestrator.processRequest({
    request: 'Create cyberpunk detective character'
  })

  expect(result.departmentReports).toHaveLength(1)
  expect(result.departmentReports[0].department).toBe('character')
  expect(result.departmentReports[0].outputs.length).toBeGreaterThan(3)
  expect(result.overallQuality).toBeGreaterThan(0.70)
})
```

**Two Departments with Dependency**:
```typescript
test('Visual waits for Character before executing', async () => {
  const result = await masterOrchestrator.processRequest({
    request: 'Create character and design their visual appearance'
  })

  expect(result.departmentReports).toHaveLength(2)

  const characterReport = result.departmentReports.find(r => r.department === 'character')
  const visualReport = result.departmentReports.find(r => r.department === 'visual')

  expect(characterReport.completedAt).toBeLessThan(visualReport.startedAt)
  expect(result.crossDepartmentValidation.characterVisualConsistency).toBeGreaterThan(0.75)
})
```

**Multi-Department Parallel**:
```typescript
test('Independent departments execute in parallel', async () => {
  const startTime = Date.now()

  const result = await masterOrchestrator.processRequest({
    request: 'Create character with story, visuals, and audio'
  })

  const executionTime = Date.now() - startTime

  // Should be faster than sequential execution
  expect(executionTime).toBeLessThan(180000) // 3 minutes
  expect(result.departmentReports).toHaveLength(4) // Character, Story, Visual, Audio
})
```

### Performance Tests

**Concurrent Agent Limit**:
```typescript
test('Agent pool limits concurrent agents to 20', async () => {
  const pool = new AgentPool(AGENT_POOL_CONFIG)

  const promises = Array(30).fill(null).map((_, i) =>
    pool.getAgent(`specialist-${i}`)
  )

  await Promise.all(promises)

  expect(pool.activeAgents.size).toBeLessThanOrEqual(20)
})
```

**Memory Usage**:
```typescript
test('Memory usage stays under limit with 50 agents', async () => {
  const initialMemory = process.memoryUsage().heapUsed

  // Create all 50+ specialists
  const result = await masterOrchestrator.processRequest({
    request: 'Create complete production with all departments'
  })

  const finalMemory = process.memoryUsage().heapUsed
  const memoryIncrease = finalMemory - initialMemory

  expect(memoryIncrease).toBeLessThan(1024 * 1024 * 500) // 500MB limit
})
```

---

## Migration Path from Phase 2

### Phase 2 State (Current)
- ✅ Master Orchestrator (basic routing)
- ✅ Character Department Head
- ✅ 2 Character Specialists (Creator, Hair Stylist)
- ✅ Custom tools infrastructure
- ✅ Basic grading system

### Phase 4 Migration Steps

**Step 1**: Add Story Department (Week 13)
1. Create `storyHead.ts`
2. Create 7 story specialists
3. Update Master Orchestrator to route to Story
4. Test Character + Story workflow

**Step 2**: Add Visual Department (Week 13)
1. Create `visualHead.ts`
2. Create 10 visual specialists
3. Update dependency resolver (Character → Visual)
4. Test Character → Visual workflow

**Step 3**: Add Support Departments (Week 14)
1. Create Audio, Image Quality, Production heads
2. Create remaining specialists
3. Update routing for all 6 departments
4. Test multi-department workflows

**Step 4**: Add Coordination (Week 15)
1. Implement department router
2. Implement dependency resolver
3. Implement result aggregator
4. Implement agent pool
5. Test parallel execution

**Step 5**: Integration & Optimization (Week 16)
1. Integrate with Brain service
2. Performance optimization
3. End-to-end testing
4. Documentation updates

### Backwards Compatibility

**Guaranteed**:
- Existing Character department continues to work
- Single-department requests work as before
- Grading system remains compatible
- Custom tools API unchanged

**Enhanced**:
- Master Orchestrator handles multi-department routing
- Character department can coordinate with Visual
- Quality validation more comprehensive
- User presentations richer

---

## Future Extensibility

### Phase 5 Integration (Image Generation)

**Image Quality Department Role**:
- Validate generated images
- Optimize prompts for image models
- Ensure style consistency
- Enhance image quality

**Integration Points**:
```typescript
// Visual department creates image specifications
const visualOutput = await visualDepartment.process(request)

// Image Quality validates and optimizes
const imageQualityOutput = await imageQualityDepartment.process({
  visualSpecs: visualOutput,
  imageModel: 'stable-diffusion-xl'
})

// Generate image with optimized prompt
const generatedImage = await generateImage({
  prompt: imageQualityOutput.optimizedPrompt,
  style: imageQualityOutput.styleParameters
})
```

### Phase 6 Integration (Video Generation)

**Production Department Role**:
- Validate video feasibility
- Plan shot sequences
- Coordinate video generation pipeline
- Quality control for video outputs

### Phase 7+ (Advanced Features)

**Potential New Departments**:
- Marketing Department (trailers, promotional content)
- Localization Department (translations, cultural adaptation)
- Distribution Department (platform optimization, delivery)

**Scaling Considerations**:
- Department federation (multiple Master Orchestrators)
- Cross-project coordination (shared characters across shows)
- Learning from past productions (improve grading over time)

---

## Conclusion

Phase 4 architecture provides a robust, scalable foundation for multi-department agent orchestration with 50+ specialists. Key innovations include:

1. **Balanced Department Structure**: 6 departments with clear responsibilities
2. **Efficient Resource Management**: Agent pooling with 20 concurrent limit
3. **Optimal Execution Strategy**: Hybrid parallel-sequential execution (4-5x speedup)
4. **Comprehensive Quality Validation**: Multi-level pyramid (Specialist → Dept → Orchestrator → Brain)
5. **Flexible Coordination**: Dependency resolution with shared context
6. **Future-Proof Design**: Extensible to Phase 5+ with image/video generation

This architecture enables complex creative workflows like "Create a cyberpunk detective character with story, visuals, and audio" to execute in 2-3 minutes with high quality validation at every level.

---

**Next Steps**:
1. Review and approve architecture
2. Begin Week 13 implementation (Story + Visual departments)
3. Create detailed implementation tasks
4. Set up testing infrastructure
5. Begin parallel development of core specialists

**Architecture Status**: ✅ DESIGN COMPLETE - Ready for Implementation
