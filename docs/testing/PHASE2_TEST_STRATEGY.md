# Phase 2 Test Strategy - Aladdin Platform

**Version**: 1.0.0
**Date**: 2025-10-01
**Agent**: Tester (Hive Mind Swarm)
**Status**: Ready for Implementation
**Phase**: Chat Interface & Basic Agents (Weeks 5-8)

---

## Executive Summary

This document outlines the comprehensive testing strategy for Phase 2 (Chat Interface & Basic Agents) of the Aladdin AI movie production platform. The strategy ensures 80%+ overall coverage with 95%+ coverage on critical agent orchestration paths and end-to-end character creation workflows.

### Coverage Goals
- **Overall Coverage**: 80%+
- **Critical Paths (Agent Orchestration)**: 95%+
- **WebSocket Integration**: 90%+
- **Custom Tool Execution**: 90%+
- **E2E Workflows**: 100% (Chat to Character Creation)

### Key Test Focus Areas
1. Chat UI component interactions and real-time updates
2. WebSocket connection reliability and reconnection
3. Master Orchestrator routing logic
4. Department Head grading and specialist spawning
5. Custom tool execution (@codebuff/sdk integration)
6. Quality gate validation
7. Complete character creation workflow via chat

---

## 1. Test Architecture

### 1.1 Test Pyramid for Phase 2

```
                  /\
                 /E2E\           <- 20% - Chat to character creation flows
                /------\
               / Agent \          <- 40% - Agent orchestration & tools
              /----------\
             / WebSocket \        <- 25% - Real-time communication
            /--------------\
           /   Component    \     <- 15% - UI components
          /------------------\
```

### 1.2 Test Categories

| Category | Framework | Location | Purpose |
|----------|-----------|----------|---------|
| Unit | Vitest | `tests/unit/` | Custom tools, utilities |
| Integration | Vitest | `tests/int/` | Agent workflows, WebSocket |
| Component | Vitest + Testing Library | `tests/comp/` | Chat UI components |
| E2E | Playwright | `tests/e2e/` | Complete user workflows |
| Agent | Vitest (Mocked SDK) | `tests/agent/` | Agent orchestration |
| Fixtures | N/A | `tests/fixtures/` | Mock agent responses |

---

## 2. Phase 2 Test Requirements

### 2.1 Chat Interface Testing

#### 2.1.1 Chat Components

**File**: `tests/comp/chat/ChatInterface.comp.spec.tsx`

**Test Cases**:
- ✅ Chat interface renders with message input
- ✅ Textarea expands with multi-line input
- ✅ Send button enabled when message present
- ✅ Send button disabled when message empty
- ✅ Message sent on button click
- ✅ Message sent on Enter key
- ✅ Shift+Enter adds new line (doesn't send)
- ✅ Loading state displayed during agent processing
- ✅ Error state displayed on agent failure
- ✅ Scrolls to bottom on new message
- ✅ Auto-focus on textarea after send

**Coverage Target**: 90%

---

#### 2.1.2 Message List Components

**File**: `tests/comp/chat/MessageList.comp.spec.tsx`

**Test Cases**:
- ✅ Renders empty state when no messages
- ✅ Renders user messages correctly
- ✅ Renders assistant messages correctly
- ✅ Renders system messages (agent actions)
- ✅ Displays timestamps
- ✅ Groups consecutive messages by role
- ✅ Renders ContentCard for structured output
- ✅ Renders quality scores for agent outputs
- ✅ Displays "thinking" indicator during processing
- ✅ Auto-scroll behavior on new messages
- ✅ Preserves scroll position when viewing history

**Coverage Target**: 85%

---

#### 2.1.3 Content Card Components

**File**: `tests/comp/chat/ContentCard.comp.spec.tsx`

**Test Cases**:
- ✅ Renders character data card
- ✅ Displays quality score with visual indicator
- ✅ Shows INGEST/MODIFY/DISCARD buttons
- ✅ INGEST button triggers save action
- ✅ MODIFY button opens edit interface
- ✅ DISCARD button confirms before discarding
- ✅ Displays Brain validation status
- ✅ Shows issues and suggestions
- ✅ Expandable/collapsible details
- ✅ Copy JSON button functionality

**Coverage Target**: 90%

---

### 2.2 WebSocket Testing

#### 2.2.1 WebSocket Connection

**File**: `tests/int/websocket/connection.int.spec.ts`

**Test Cases**:
- ✅ WebSocket connection established on mount
- ✅ Connection uses correct URL format
- ✅ Authentication token sent in connection
- ✅ Connection retry on failure (exponential backoff)
- ✅ Maximum retry attempts respected (5 retries)
- ✅ Connection closed on unmount
- ✅ Heartbeat/ping-pong for keep-alive
- ✅ Connection status updates UI
- ✅ Reconnection preserves conversation context

**Coverage Target**: 95%

**Retry Logic**:
```typescript
Attempt 1: Immediate
Attempt 2: 1s delay
Attempt 3: 2s delay
Attempt 4: 4s delay
Attempt 5: 8s delay
Max attempts: 5
```

---

#### 2.2.2 WebSocket Message Handling

**File**: `tests/int/websocket/messages.int.spec.ts`

**Test Cases**:
- ✅ Receive user message echo
- ✅ Receive agent thinking events
- ✅ Receive agent tool_call events
- ✅ Receive agent content_preview events
- ✅ Receive final agent response
- ✅ Receive error messages
- ✅ Handle malformed messages gracefully
- ✅ Message ordering preserved
- ✅ Large message handling (chunked)
- ✅ Binary message handling (attachments)

**Coverage Target**: 90%

**Event Types**:
```typescript
interface WebSocketEvent {
  type: 'user_message' | 'agent_thinking' | 'tool_call' |
        'content_preview' | 'agent_response' | 'error';
  data: any;
  timestamp: number;
  conversationId: string;
}
```

---

#### 2.2.3 Real-time Streaming

**File**: `tests/int/websocket/streaming.int.spec.ts`

**Test Cases**:
- ✅ Stream agent response tokens progressively
- ✅ Stream tool call events in real-time
- ✅ Stream quality validation results
- ✅ Stream department head reports
- ✅ Update UI incrementally during streaming
- ✅ Handle stream interruption
- ✅ Handle stream cancellation by user
- ✅ Stream completion event received

**Coverage Target**: 90%

---

### 2.3 Agent Orchestration Testing

#### 2.3.1 Master Orchestrator

**File**: `tests/agent/orchestrator/master.agent.spec.ts`

**Test Cases**:
- ✅ Analyzes user intent correctly
- ✅ Routes to Character Department for character creation
- ✅ Routes to Story Department for story tasks
- ✅ Routes to Visual Department for visual tasks
- ✅ Routes to multiple departments for complex requests
- ✅ Assigns relevance scores to departments
- ✅ Sets priorities correctly
- ✅ Handles department dependencies
- ✅ Aggregates department reports
- ✅ Validates cross-department consistency
- ✅ Sends to Brain for final validation
- ✅ Formats output for user presentation
- ✅ Handles department failures gracefully

**Coverage Target**: 95%

**Mock Strategy**:
```typescript
// Mock @codebuff/sdk
vi.mock('@codebuff/sdk', () => ({
  CodebuffClient: vi.fn(() => ({
    run: vi.fn((config) => mockAgentRun(config))
  })),
  getCustomToolDefinition: vi.fn((def) => def)
}))
```

---

#### 2.3.2 Character Department Head

**File**: `tests/agent/departments/character-head.agent.spec.ts`

**Test Cases**:
- ✅ Assesses relevance to character requests (score 0-1)
- ✅ Returns low relevance for non-character requests
- ✅ Identifies needed specialists correctly
- ✅ Spawns Character Creator for personality
- ✅ Spawns Hair Stylist for hairstyle
- ✅ Spawns Costume Designer for wardrobe
- ✅ Spawns multiple specialists in parallel
- ✅ Grades specialist outputs (quality, relevance, consistency)
- ✅ Accepts high-quality outputs (>= 0.70)
- ✅ Requests revision for medium-quality (0.40-0.59)
- ✅ Discards low-quality outputs (< 0.40)
- ✅ Compiles department report with all outputs
- ✅ Calculates department quality score
- ✅ Includes issues and suggestions in report

**Coverage Target**: 95%

**Grading Thresholds**:
```typescript
overallScore >= 0.70 → ACCEPT
overallScore >= 0.60 → ACCEPT (with notes)
overallScore >= 0.40 → REVISE
overallScore < 0.40 → DISCARD
```

---

#### 2.3.3 Specialist Agents

**File**: `tests/agent/specialists/character-creator.agent.spec.ts`

**Test Cases**:
- ✅ Creates character with required fields
- ✅ Generates personality traits
- ✅ Creates backstory
- ✅ Defines character role
- ✅ Self-assesses confidence score
- ✅ Self-assesses completeness score
- ✅ Uses context from department head
- ✅ Respects genre and setting constraints
- ✅ Output format matches expected schema

**Coverage Target**: 85%

---

**File**: `tests/agent/specialists/hair-stylist.agent.spec.ts`

**Test Cases**:
- ✅ Designs hairstyle based on character
- ✅ Considers genre appropriateness
- ✅ Provides detailed description
- ✅ Includes practical considerations
- ✅ Self-assesses output
- ✅ Provides reasoning for design choices
- ✅ Suggests alternative options

**Coverage Target**: 85%

---

#### 2.3.4 Quality Grading System

**File**: `tests/agent/grading/grading-system.agent.spec.ts`

**Test Cases**:
- ✅ Calculates quality score (0-1)
- ✅ Calculates relevance score (0-1)
- ✅ Calculates consistency score (0-1)
- ✅ Calculates creativity score (0-1)
- ✅ Weighted average: quality*0.4 + relevance*0.3 + consistency*0.2 + creativity*0.1
- ✅ Identifies issues in output
- ✅ Generates improvement suggestions
- ✅ Makes accept/revise/discard decision
- ✅ Provides reasoning for decision

**Coverage Target**: 95%

---

### 2.4 Custom Tool Testing

#### 2.4.1 Route to Department Tool

**File**: `tests/agent/tools/route-department.tool.spec.ts`

**Test Cases**:
- ✅ Tool definition schema validation
- ✅ Routes to character department
- ✅ Routes to story department
- ✅ Routes to visual department
- ✅ Routes to audio department
- ✅ Routes to production department
- ✅ Sets priority levels (high, medium, low)
- ✅ Sets department dependencies
- ✅ Returns routing confirmation

**Coverage Target**: 90%

---

#### 2.4.2 Spawn Specialist Tool

**File**: `tests/agent/tools/spawn-specialist.tool.spec.ts`

**Test Cases**:
- ✅ Tool definition schema validation
- ✅ Spawns specialist with instructions
- ✅ Passes context to specialist
- ✅ Sets expected output format
- ✅ Returns spawn confirmation
- ✅ Handles invalid specialist IDs
- ✅ Validates instruction format

**Coverage Target**: 90%

---

#### 2.4.3 Grade Output Tool

**File**: `tests/agent/tools/grade-output.tool.spec.ts`

**Test Cases**:
- ✅ Tool definition schema validation
- ✅ Grades specialist output
- ✅ Calculates all score dimensions
- ✅ Generates issues list
- ✅ Generates suggestions list
- ✅ Makes decision (accept/revise/discard)
- ✅ Returns structured grading report

**Coverage Target**: 95%

---

#### 2.4.4 Save Character Tool

**File**: `tests/agent/tools/save-character.tool.spec.ts`

**Test Cases**:
- ✅ Tool definition schema validation
- ✅ Validates character data before save
- ✅ Sends to Brain for validation
- ✅ Checks quality threshold (>= 0.60)
- ✅ Rejects low-quality characters
- ✅ Saves to open MongoDB on acceptance
- ✅ Adds node to Brain graph
- ✅ Returns success with quality score
- ✅ Handles Brain validation failures
- ✅ Handles database save failures

**Coverage Target**: 95%

---

#### 2.4.5 Query Brain Tool

**File**: `tests/agent/tools/query-brain.tool.spec.ts`

**Test Cases**:
- ✅ Tool definition schema validation
- ✅ Queries Brain for semantic similarity
- ✅ Finds related content
- ✅ Checks for contradictions
- ✅ Returns consistency scores
- ✅ Handles empty results
- ✅ Handles Brain connection failures

**Coverage Target**: 85%

---

### 2.5 Quality Gate Testing

#### 2.5.1 Initial Quality Check

**File**: `tests/int/quality/initial-check.int.spec.ts`

**Test Cases**:
- ✅ Validates required fields present
- ✅ Validates field types
- ✅ Validates field lengths
- ✅ Checks for minimum information completeness
- ✅ Returns pass/fail with issues
- ✅ Provides actionable error messages

**Coverage Target**: 90%

---

#### 2.5.2 Brain Validation

**File**: `tests/int/quality/brain-validation.int.spec.ts`

**Test Cases**:
- ✅ Sends data to Brain for validation
- ✅ Receives quality rating (0-1)
- ✅ Receives contradiction list
- ✅ Receives consistency score
- ✅ Receives improvement suggestions
- ✅ Handles Brain service failures
- ✅ Falls back gracefully when Brain unavailable
- ✅ Retries on transient failures (3 attempts)

**Coverage Target**: 90%

**Mock Brain Service**:
```typescript
interface BrainValidationResponse {
  qualityRating: number;
  consistencyScore: number;
  contradictions: Array<{
    field: string;
    issue: string;
    explanation: string;
  }>;
  suggestions: string[];
  embedding: number[];
  brainValidated: boolean;
}
```

---

#### 2.5.3 Quality Gate Thresholds

**File**: `tests/int/quality/thresholds.int.spec.ts`

**Test Cases**:
- ✅ Agent threshold (0.50) for specialist self-assessment
- ✅ Department threshold (0.60) for department head acceptance
- ✅ Orchestrator threshold (0.75) for master orchestrator
- ✅ Brain threshold (0.60) for final validation
- ✅ Blocks content below threshold
- ✅ Allows content above threshold
- ✅ Provides feedback for rejected content

**Coverage Target**: 95%

---

### 2.6 E2E Workflow Testing

#### 2.6.1 Complete Character Creation Flow

**File**: `tests/e2e/character-creation.e2e.spec.ts`

**Test Cases**:
- ✅ User logs into dashboard
- ✅ User creates new project
- ✅ User navigates to project chat
- ✅ User sends message: "Create character Sarah"
- ✅ WebSocket connection established
- ✅ Master Orchestrator receives message
- ✅ Master Orchestrator routes to Character Department
- ✅ Character Department Head spawns specialists
- ✅ Specialists execute in parallel
- ✅ Department Head grades outputs
- ✅ Master Orchestrator validates with Brain
- ✅ Chat displays character creation card
- ✅ Character card shows quality score
- ✅ Character card shows INGEST/MODIFY/DISCARD buttons
- ✅ User clicks INGEST
- ✅ Character saved to open MongoDB
- ✅ Character added to Brain graph
- ✅ Success confirmation displayed
- ✅ Character appears in project content

**Coverage Target**: 100%

**Expected Flow Time**: < 30 seconds

---

#### 2.6.2 Complex Character Creation

**File**: `tests/e2e/complex-character.e2e.spec.ts`

**Test Cases**:
- ✅ User sends: "Create a cyberpunk detective character named Sarah Chen"
- ✅ Master Orchestrator routes to Character + Visual departments
- ✅ Character Department creates personality, hairstyle, wardrobe
- ✅ Visual Department creates concept art
- ✅ Both departments report back
- ✅ Cross-department consistency validated
- ✅ Brain validates complete character
- ✅ User presented with comprehensive character profile
- ✅ User ingests character
- ✅ Both departments' outputs saved correctly

**Coverage Target**: 100%

---

#### 2.6.3 Quality Gate Rejection

**File**: `tests/e2e/quality-rejection.e2e.spec.ts`

**Test Cases**:
- ✅ User sends vague request: "Create character"
- ✅ Initial quality check fails (missing name)
- ✅ Chat displays error with suggestions
- ✅ User provides more details: "Create detective character named Sarah"
- ✅ Agents execute workflow
- ✅ Brain rates quality below threshold (simulated)
- ✅ Chat displays quality issues and suggestions
- ✅ User can modify or discard
- ✅ User modifies: "Add more personality traits"
- ✅ Agents reprocess with additional context
- ✅ Quality improves above threshold
- ✅ User successfully ingests

**Coverage Target**: 100%

---

#### 2.6.4 Real-time Streaming Experience

**File**: `tests/e2e/streaming.e2e.spec.ts`

**Test Cases**:
- ✅ User sends character creation request
- ✅ Chat displays "thinking" indicator immediately
- ✅ Master Orchestrator analysis streamed
- ✅ Department routing events displayed
- ✅ Specialist spawning events displayed
- ✅ Each specialist completion event displayed
- ✅ Grading results streamed as completed
- ✅ Brain validation status displayed
- ✅ Final character card rendered progressively
- ✅ No jarring UI updates (smooth transitions)
- ✅ User can see progress throughout workflow

**Coverage Target**: 95%

---

#### 2.6.5 Error Handling & Recovery

**File**: `tests/e2e/error-recovery.e2e.spec.ts`

**Test Cases**:
- ✅ WebSocket disconnects during processing
- ✅ WebSocket reconnects automatically
- ✅ Conversation state preserved
- ✅ Agent run continues after reconnection
- ✅ Agent run fails (timeout)
- ✅ Error message displayed to user
- ✅ User can retry operation
- ✅ Database save fails
- ✅ Transaction rolled back
- ✅ User notified of failure
- ✅ Brain service unavailable
- ✅ Graceful degradation (skip Brain validation)
- ✅ User notified of degraded mode

**Coverage Target**: 90%

---

## 3. Test Data & Fixtures

### 3.1 Agent Response Fixtures

**Directory**: `tests/fixtures/agents/`

#### Files:
- `master-orchestrator.fixture.ts` - Mock orchestrator responses
- `character-department.fixture.ts` - Mock department head responses
- `character-creator.fixture.ts` - Mock specialist responses
- `hair-stylist.fixture.ts` - Mock specialist responses
- `costume-designer.fixture.ts` - Mock specialist responses
- `brain-validation.fixture.ts` - Mock Brain API responses

### 3.2 Fixture Example: Character Department Response

```typescript
// tests/fixtures/agents/character-department.fixture.ts

export const mockCharacterDepartmentResponse = () => ({
  department: 'character',
  relevance: 0.95,
  status: 'complete',
  outputs: [
    {
      specialistId: 'character-creator',
      output: {
        name: 'Sarah Chen',
        age: 32,
        role: 'protagonist',
        personality: {
          traits: ['analytical', 'street-smart', 'cynical'],
          motivations: ['justice', 'redemption']
        },
        backstory: 'Former corporate security analyst...',
      },
      confidence: 0.88,
      completeness: 0.85,
      qualityScore: 0.86,
      relevanceScore: 0.92,
      consistencyScore: 0.81,
      overallScore: 0.87,
      decision: 'accept'
    },
    {
      specialistId: 'hair-stylist',
      output: {
        hairstyle: {
          style: 'Asymmetric undercut',
          length: 'short',
          color: 'Black with neon blue streaks',
          texture: 'straight',
          maintenance: 'low',
          distinctiveFeatures: ['Shaved right side', 'Long left sweep'],
          reasoning: 'Edgy, practical for action, fits cyberpunk aesthetic'
        }
      },
      confidence: 0.92,
      completeness: 0.95,
      qualityScore: 0.91,
      relevanceScore: 0.85,
      consistencyScore: 0.88,
      overallScore: 0.88,
      decision: 'accept'
    },
    {
      specialistId: 'costume-designer',
      output: {
        outfit: {
          primary: 'Black tactical jacket',
          details: 'Smart fabric, hidden pockets, AR interface',
          accessories: ['Smart glasses', 'Fingerless gloves'],
          reasoning: 'Functional for detective work in high-tech setting'
        }
      },
      confidence: 0.85,
      completeness: 0.90,
      qualityScore: 0.84,
      relevanceScore: 0.88,
      consistencyScore: 0.86,
      overallScore: 0.86,
      decision: 'accept'
    }
  ],
  departmentQuality: 0.87,
  issues: [],
  suggestions: ['Consider adding voice profile in next phase']
})

export const mockLowQualityDepartmentResponse = () => ({
  department: 'character',
  relevance: 0.95,
  status: 'complete',
  outputs: [
    {
      specialistId: 'character-creator',
      output: {
        name: 'Sarah',
        // Missing critical fields
      },
      confidence: 0.45,
      completeness: 0.35,
      qualityScore: 0.40,
      relevanceScore: 0.50,
      consistencyScore: 0.30,
      overallScore: 0.42,
      decision: 'revise',
      issues: [
        'Missing personality traits',
        'Backstory too brief',
        'No character role defined'
      ],
      suggestions: [
        'Add at least 3 personality traits',
        'Expand backstory to 2-3 sentences',
        'Define character role (protagonist/antagonist/supporting)'
      ]
    }
  ],
  departmentQuality: 0.42,
  issues: ['Character profile incomplete'],
  suggestions: ['Provide more character details']
})
```

### 3.3 Fixture: Brain Validation

```typescript
// tests/fixtures/agents/brain-validation.fixture.ts

export const mockBrainValidationSuccess = () => ({
  qualityRating: 0.85,
  consistencyScore: 0.88,
  contradictions: [],
  suggestions: [],
  embedding: Array(1536).fill(0).map(() => Math.random()),
  brainValidated: true
})

export const mockBrainValidationFailure = () => ({
  qualityRating: 0.45,
  consistencyScore: 0.50,
  contradictions: [
    {
      field: 'personality',
      issue: 'Contradictory traits',
      explanation: 'Character described as both "outgoing" and "extremely introverted"'
    },
    {
      field: 'backstory',
      issue: 'Timeline inconsistency',
      explanation: 'Age does not match career timeline (32 years old, 20 years experience)'
    }
  ],
  suggestions: [
    'Clarify personality traits to avoid contradictions',
    'Adjust age or career timeline for consistency',
    'Add more specific motivations'
  ],
  embedding: Array(1536).fill(0).map(() => Math.random()),
  brainValidated: false
})
```

---

## 4. Test Utilities

### 4.1 Mock @codebuff/sdk

**File**: `tests/utils/mock-codebuff.ts`

```typescript
import { vi } from 'vitest'

export const createMockCodebuffClient = () => {
  const mockRun = vi.fn(async (config) => {
    // Simulate agent execution
    const agentId = config.agent

    // Return mock response based on agent type
    if (agentId === 'master-orchestrator') {
      return mockMasterOrchestratorResponse()
    } else if (agentId.includes('department-head')) {
      return mockDepartmentHeadResponse(agentId)
    } else {
      return mockSpecialistResponse(agentId)
    }
  })

  return {
    run: mockRun
  }
}

export const mockCodebuffSDK = () => {
  vi.mock('@codebuff/sdk', () => ({
    CodebuffClient: vi.fn(() => createMockCodebuffClient()),
    getCustomToolDefinition: vi.fn((def) => def)
  }))
}
```

### 4.2 WebSocket Test Utilities

**File**: `tests/utils/websocket-helper.ts`

```typescript
import { WebSocket, Server } from 'ws'

export class MockWebSocketServer {
  private wss: Server
  private clients: Set<WebSocket> = new Set()

  constructor(port: number = 3001) {
    this.wss = new Server({ port })

    this.wss.on('connection', (ws) => {
      this.clients.add(ws)

      ws.on('message', (data) => {
        this.handleMessage(ws, data)
      })

      ws.on('close', () => {
        this.clients.delete(ws)
      })
    })
  }

  handleMessage(ws: WebSocket, data: any) {
    // Echo or process message
    const message = JSON.parse(data.toString())

    // Simulate agent processing
    this.simulateAgentEvents(ws, message)
  }

  simulateAgentEvents(ws: WebSocket, message: any) {
    // Send thinking event
    ws.send(JSON.stringify({
      type: 'agent_thinking',
      data: { message: 'Analyzing request...' },
      timestamp: Date.now()
    }))

    // Send tool call event
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'tool_call',
        data: { tool: 'route_to_department', args: { department: 'character' } },
        timestamp: Date.now()
      }))
    }, 100)

    // Send final response
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'agent_response',
        data: mockCharacterDepartmentResponse(),
        timestamp: Date.now()
      }))
    }, 500)
  }

  close() {
    this.wss.close()
  }
}
```

### 4.3 Agent Test Utilities

**File**: `tests/utils/agent-helper.ts`

```typescript
export const runMockAgent = async (agentId: string, prompt: string) => {
  // Simulate agent execution with fixtures
  const fixtures = await import(`../fixtures/agents/${agentId}.fixture`)
  return fixtures.mockAgentResponse()
}

export const validateAgentOutput = (output: any, schema: any) => {
  // Validate output against expected schema
  // Return validation errors if any
}

export const calculateGradingScore = (output: any) => {
  // Simulate department head grading logic
  const quality = analyzeQuality(output)
  const relevance = analyzeRelevance(output)
  const consistency = analyzeConsistency(output)
  const creativity = analyzeCreativity(output)

  return {
    qualityScore: quality,
    relevanceScore: relevance,
    consistencyScore: consistency,
    creativityScore: creativity,
    overallScore: quality * 0.4 + relevance * 0.3 + consistency * 0.2 + creativity * 0.1
  }
}
```

---

## 5. Test Execution Plan

### 5.1 Local Development

```bash
# Run all Phase 2 tests
pnpm test:phase2

# Run agent tests only
pnpm test:agent

# Run WebSocket tests only
pnpm test:ws

# Run component tests only
pnpm test:comp

# Run E2E tests only
pnpm test:e2e:phase2

# Run specific test file
pnpm test tests/agent/orchestrator/master.agent.spec.ts

# Run with coverage
pnpm test:phase2 --coverage

# Watch mode
pnpm test:agent --watch
```

### 5.2 Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "vitest",
    "test:phase2": "vitest run tests/{agent,comp,int}/**/*.spec.ts",
    "test:agent": "vitest run tests/agent/**/*.spec.ts",
    "test:ws": "vitest run tests/int/websocket/**/*.spec.ts",
    "test:comp": "vitest run tests/comp/**/*.spec.tsx",
    "test:e2e:phase2": "playwright test tests/e2e/character-creation.e2e.spec.ts tests/e2e/streaming.e2e.spec.ts",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 5.3 CI/CD Pipeline

```yaml
# .github/workflows/test-phase2.yml
name: Phase 2 Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    paths:
      - 'src/agents/**'
      - 'src/app/**/chat/**'
      - 'src/lib/websocket/**'
      - 'tests/agent/**'
      - 'tests/comp/chat/**'
      - 'tests/e2e/character-creation.e2e.spec.ts'

jobs:
  test-phase2:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install

      # Agent tests (mocked SDK)
      - name: Run Agent Tests
        run: pnpm test:agent
        env:
          CODEBUFF_API_KEY: test-key

      # WebSocket tests
      - name: Run WebSocket Tests
        run: pnpm test:ws

      # Component tests
      - name: Run Component Tests
        run: pnpm test:comp

      # E2E tests
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Run E2E Tests
        run: pnpm test:e2e:phase2
        env:
          DATABASE_URI_PROTECTED: mongodb://localhost:27017/aladdin_test
          DATABASE_URI_OPEN: mongodb://localhost:27017/aladdin_open_test
          CODEBUFF_API_KEY: ${{ secrets.CODEBUFF_API_KEY }}

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          flags: phase2
```

---

## 6. Coverage Requirements

### 6.1 Minimum Coverage Thresholds

```typescript
// vitest.config.mts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        // Overall
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80,

        // Critical paths (agent orchestration)
        'src/agents/**/*.ts': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95
        },

        // WebSocket
        'src/lib/websocket/**/*.ts': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        },

        // Custom tools
        'src/agents/tools/**/*.ts': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        }
      },
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.*',
        '.next/',
        'src/collections/**' // Covered in Phase 1
      ]
    }
  }
})
```

### 6.2 Critical Path Coverage (95%+ Required)

**Must Have 95%+ Coverage**:
- Master Orchestrator routing logic
- Department Head grading system
- Custom tool execution (save_character, route_to_department)
- Quality gate validation
- Brain validation flow
- WebSocket message handling
- Character creation E2E workflow

**Must Have 90%+ Coverage**:
- All specialist agents
- WebSocket connection/reconnection
- Real-time streaming
- Chat UI components

**Must Have 85%+ Coverage**:
- Error handling and recovery
- Edge case scenarios
- UI interactions

---

## 7. Test Implementation Checklist

### 7.1 Setup Phase
- [ ] Create test directory structure for Phase 2
- [ ] Setup agent test framework (mocked @codebuff/sdk)
- [ ] Create mock WebSocket server
- [ ] Create agent response fixtures
- [ ] Create Brain validation mocks
- [ ] Setup component testing with Testing Library
- [ ] Configure Playwright for Phase 2 E2E tests

### 7.2 Agent Tests
- [ ] Master Orchestrator routing tests
- [ ] Character Department Head tests
- [ ] Character Creator specialist tests
- [ ] Hair Stylist specialist tests
- [ ] Costume Designer specialist tests
- [ ] Grading system tests
- [ ] Custom tool tests (all tools)

### 7.3 WebSocket Tests
- [ ] Connection establishment tests
- [ ] Connection retry logic tests
- [ ] Message handling tests
- [ ] Real-time streaming tests
- [ ] Reconnection tests

### 7.4 Component Tests
- [ ] ChatInterface component tests
- [ ] MessageList component tests
- [ ] ContentCard component tests
- [ ] Loading states tests
- [ ] Error states tests

### 7.5 E2E Tests
- [ ] Complete character creation flow
- [ ] Complex character creation (multi-department)
- [ ] Quality gate rejection and recovery
- [ ] Real-time streaming experience
- [ ] Error handling and recovery

### 7.6 Quality Gates
- [ ] All tests passing
- [ ] 80%+ overall coverage
- [ ] 95%+ critical path coverage
- [ ] 90%+ WebSocket coverage
- [ ] 100% E2E workflow coverage
- [ ] CI/CD pipeline green
- [ ] Manual QA verification

---

## 8. Test Maintenance Guidelines

### 8.1 Writing Agent Tests

**Best Practices**:
1. Mock @codebuff/sdk, don't make real API calls
2. Use fixtures for consistent agent responses
3. Test agent decision logic, not SDK internals
4. Validate output schemas match expectations
5. Test error handling for agent failures
6. Clean up agent run state after each test

**Example Pattern**:
```typescript
describe('Master Orchestrator', () => {
  beforeEach(() => {
    mockCodebuffSDK()
  })

  it('routes character creation to Character Department', async () => {
    const result = await runAgent('master-orchestrator', 'Create character Sarah')

    expect(result.departments).toContain('character')
    expect(result.departments).toHaveLength(1)
    expect(result.routing.character.relevance).toBeGreaterThan(0.9)
  })
})
```

### 8.2 Writing WebSocket Tests

**Best Practices**:
1. Use mock WebSocket server for tests
2. Test connection lifecycle (open, message, close)
3. Test reconnection logic explicitly
4. Test message ordering
5. Test error handling
6. Clean up connections in afterEach

### 8.3 Writing Component Tests

**Best Practices**:
1. Use Testing Library (not Enzyme)
2. Test user interactions, not implementation
3. Mock WebSocket connections
4. Mock agent responses
5. Test loading and error states
6. Test accessibility (aria-labels, keyboard nav)

---

## 9. Known Issues & Limitations

### 9.1 Current Limitations
- @codebuff/sdk is mocked (no real agent execution in tests)
- Brain service is mocked (no real semantic validation)
- WebSocket server is mocked in tests
- Agent response times are instant (not realistic)

### 9.2 Future Enhancements
- Integration tests with real @codebuff/sdk (staging environment)
- Load testing for concurrent agent spawning
- Performance benchmarks for agent response times
- Visual regression testing for chat UI
- Accessibility audit automation
- Agent conversation context memory tests
- Multi-user concurrent chat tests

---

## 10. Success Metrics

### 10.1 Phase 2 Verification Criteria

**All tests must pass**:
```bash
✅ Agent Tests: Master Orchestrator routing
✅ Agent Tests: Character Department Head grading
✅ Agent Tests: Specialist agent execution
✅ Agent Tests: Custom tool execution
✅ Agent Tests: Quality grading system
✅ WebSocket Tests: Connection and reconnection
✅ WebSocket Tests: Message handling
✅ WebSocket Tests: Real-time streaming
✅ Component Tests: Chat UI interactions
✅ E2E Tests: Complete character creation flow
✅ E2E Tests: Quality gate validation
✅ E2E Tests: Error handling
✅ Coverage: 80%+ overall
✅ Coverage: 95%+ critical paths (agent orchestration)
✅ Coverage: 90%+ WebSocket
✅ Coverage: 100% E2E workflows
```

### 10.2 Phase 2 Completion Criteria

**Phase 2 Complete When**:
1. ✅ Chat interface renders and sends messages
2. ✅ WebSocket connection established and stable
3. ✅ Master Orchestrator spawns on message
4. ✅ Character Department Head spawns specialists
5. ✅ Specialists execute and return outputs
6. ✅ Department Head grades outputs correctly
7. ✅ Master Orchestrator validates with Brain
8. ✅ Character saved to open MongoDB
9. ✅ All test suites pass consistently
10. ✅ Coverage thresholds met
11. ✅ CI/CD pipeline green
12. ✅ Manual QA verification complete
13. ✅ User can create character via chat end-to-end

---

## Appendix A: Test File Structure

```
tests/
├── fixtures/
│   ├── agents/
│   │   ├── master-orchestrator.fixture.ts
│   │   ├── character-department.fixture.ts
│   │   ├── character-creator.fixture.ts
│   │   ├── hair-stylist.fixture.ts
│   │   ├── costume-designer.fixture.ts
│   │   └── brain-validation.fixture.ts
│   └── websocket/
│       └── messages.fixture.ts
│
├── utils/
│   ├── mock-codebuff.ts
│   ├── websocket-helper.ts
│   ├── agent-helper.ts
│   └── brain-mock.ts
│
├── agent/
│   ├── orchestrator/
│   │   └── master.agent.spec.ts
│   ├── departments/
│   │   ├── character-head.agent.spec.ts
│   │   └── story-head.agent.spec.ts
│   ├── specialists/
│   │   ├── character-creator.agent.spec.ts
│   │   ├── hair-stylist.agent.spec.ts
│   │   └── costume-designer.agent.spec.ts
│   ├── grading/
│   │   └── grading-system.agent.spec.ts
│   └── tools/
│       ├── route-department.tool.spec.ts
│       ├── spawn-specialist.tool.spec.ts
│       ├── grade-output.tool.spec.ts
│       ├── save-character.tool.spec.ts
│       └── query-brain.tool.spec.ts
│
├── int/
│   ├── websocket/
│   │   ├── connection.int.spec.ts
│   │   ├── messages.int.spec.ts
│   │   └── streaming.int.spec.ts
│   └── quality/
│       ├── initial-check.int.spec.ts
│       ├── brain-validation.int.spec.ts
│       └── thresholds.int.spec.ts
│
├── comp/
│   └── chat/
│       ├── ChatInterface.comp.spec.tsx
│       ├── MessageList.comp.spec.tsx
│       └── ContentCard.comp.spec.tsx
│
└── e2e/
    ├── character-creation.e2e.spec.ts
    ├── complex-character.e2e.spec.ts
    ├── quality-rejection.e2e.spec.ts
    ├── streaming.e2e.spec.ts
    └── error-recovery.e2e.spec.ts
```

---

## Appendix B: Environment Setup

### Test Environment Variables

```bash
# test.env (Phase 2)
DATABASE_URI_PROTECTED=mongodb://localhost:27017/aladdin_test
DATABASE_URI_OPEN=mongodb://localhost:27017/aladdin_open_test
PAYLOAD_SECRET=test-secret-key
NODE_ENV=test

# @codebuff/sdk (mocked in tests, but needed for E2E)
CODEBUFF_API_KEY=test-codebuff-key

# Brain service (mocked in tests)
BRAIN_SERVICE_URL=http://localhost:7474
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=test-password

# WebSocket (test server)
WS_PORT=3001
```

---

## Appendix C: Agent Response Schemas

### Master Orchestrator Output Schema

```typescript
interface MasterOrchestratorOutput {
  intent: string;
  scope: 'simple' | 'comprehensive' | 'complex';
  departments: Array<{
    name: 'character' | 'story' | 'visual' | 'audio' | 'production';
    relevance: number; // 0-1
    priority: 'high' | 'medium' | 'low';
    instructions: string;
    dependencies?: string[]; // Other departments
  }>;
  routing: Record<string, {
    relevance: number;
    priority: string;
    instructions: string;
  }>;
}
```

### Department Head Output Schema

```typescript
interface DepartmentHeadOutput {
  department: string;
  relevance: number; // 0-1
  status: 'not_relevant' | 'complete' | 'failed';
  outputs: Array<{
    specialistId: string;
    output: any; // Specialist-specific
    confidence: number;
    completeness: number;
    qualityScore: number;
    relevanceScore: number;
    consistencyScore: number;
    creativityScore: number;
    overallScore: number;
    decision: 'accept' | 'revise' | 'discard';
    issues?: string[];
    suggestions?: string[];
  }>;
  departmentQuality: number;
  issues: string[];
  suggestions: string[];
}
```

### Specialist Output Schema

```typescript
interface SpecialistOutput {
  // Specialist-specific output
  // Example for Character Creator:
  name: string;
  age?: number;
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  personality?: {
    traits: string[];
    motivations: string[];
  };
  backstory?: string;

  // Self-assessment
  confidence: number; // 0-1
  completeness: number; // 0-1
}
```

---

**Document Status**: ✅ Complete and Ready for Implementation
**Next Step**: Implementation of Phase 2 test suites
**Estimated Implementation Time**: 3-4 days for full test suite
**Dependencies**: Phase 1 test infrastructure, @codebuff/sdk integration

**Coordination**: Store test strategy in memory for swarm access
