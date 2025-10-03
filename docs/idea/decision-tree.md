# Aladdin Agent Decision Tree - Complete Workflow

**Version**: 2.0
**Last Updated**: January 2025
**Status**: Implementation Ready

---

## 📋 Executive Summary

This document defines the complete decision flow for Aladdin's hierarchical AI agent system. The workflow orchestrates movie production through a **Master Orchestrator → Department Heads → Specialists** hierarchy with quality gates, retry mechanisms, and intelligent synthesis.

### Key Principles

1. **Master Orchestrator** has NO retry capability - if it fails, it fails with "unable to generate" message
2. **Department Heads** have 3 retries with feedback loop
3. **Specialists** use agent-specific `passingThreshold` (default: 60%)
4. **Parallel execution** at both department and specialist levels
5. **Synthesis approach**: Create new output inspired by all specialist outputs

---

## 🎯 High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER REQUEST                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              MASTER ORCHESTRATOR                            │
│  • Analyzes request using DepartmentRouter                  │
│  • Calculates relevance scores (keyword-based)              │
│  • Identifies primary + supporting departments               │
│  • Determines execution mode (single/parallel/sequential)   │
│  • NO RETRY - Fails with "unable to generate"              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│           DEPARTMENT HEAD(S) [Up to 3 retries]              │
│  1. Analyze request complexity (simple/moderate/complex)    │
│  2. Decide if specialists needed                            │
│  3. Route to specialists OR handle directly                 │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ↓                         ↓
┌─────────────────────┐    ┌─────────────────────┐
│  HEAD HANDLES       │    │  SPAWN SPECIALISTS  │
│  DIRECTLY           │    │  (Parallel)         │
│  (Simple tasks)     │    │  (Complex tasks)    │
└─────────────────────┘    └──────────┬──────────┘
            │                         │
            │                         ↓
            │              ┌─────────────────────────────────┐
            │              │  SPECIALISTS RUN IN PARALLEL    │
            │              │  • Each has passingThreshold    │
            │              │  • Up to 3 retries per agent    │
            │              │  • Feedback: original prompt +  │
            │              │    "what failed" + suggestions  │
            │              └──────────┬──────────────────────┘
            │                         │
            │                         ↓
            │              ┌─────────────────────────────────┐
            │              │  DEPARTMENT HEAD REVIEW         │
            │              │  • Grade each specialist output │
            │              │  • Filter by passingThreshold   │
            │              └──────────┬──────────────────────┘
            │                         │
            └─────────────┬───────────┘
                          │
                          ↓
            ┌─────────────────────────────────────┐
            │  SYNTHESIS (Department Head)        │
            │  • Receive all approved outputs     │
            │  • Create NEW inspired output       │
            │  • NOT simple merge/concatenation   │
            └──────────────┬──────────────────────┘
                          │
                          ↓
            ┌─────────────────────────────────────┐
            │  QUALITY ASSESSMENT                 │
            │  • Calculate weighted score         │
            │  • 60% approval rate                │
            │  • 40% avg specialist scores        │
            └──────────────┬──────────────────────┘
                          │
                          ↓
            ┌─────────────────────────────────────┐
            │  DEPARTMENT REPORT                  │
            │  • Final output                     │
            │  • Quality scores                   │
            │  • Specialist summaries             │
            │  • Metadata (execution time, etc.)  │
            └──────────────┬──────────────────────┘
                          │
                          ↓
            ┌─────────────────────────────────────┐
            │  MASTER ORCHESTRATOR AGGREGATION    │
            │  • Combine department outputs       │
            │  • Cross-department validation      │
            │  • Present unified result to user   │
            └─────────────────────────────────────┘
```

---

## 🔀 Decision Points & Logic

### 1. Master Orchestrator Routing Decision

**Location**: `src/lib/agents/coordination/departmentRouter.ts`
**Who decides**: Master Orchestrator using DepartmentRouter
**When**: On every user request

```typescript
// Step 1: Calculate relevance scores (keyword-based)
const scores = calculateRelevanceScores(request)
// Returns: { department, relevance (0-1), priority, reason }

// Step 2: Identify departments
const primary = scores[0].department // Highest score
const supporting = scores.filter(s => s.relevance > 0.3) // > 30% threshold

// Step 3: Determine execution mode
if (supporting.length === 0) → 'single'
else if (hasDependencies) → 'sequential'
else → 'parallel'

// Step 4: Build dependency graph
// Example: visual depends on [character, story]
```

**Routing Examples**:
- "Create character Aladdin" → CHARACTER (primary only)
- "Design story episode 1" → STORY (primary), CHARACTER (supporting)
- "Generate scene with dialogue" → STORY (primary), CHARACTER + VISUAL + AUDIO (supporting)

### 2. Department Head Decision: Specialists Needed?

**Location**: `src/lib/agents/DepartmentHeadAgent.ts:119`
**Who decides**: Department Head via request analysis
**When**: After receiving routed request

```typescript
// Analyze complexity
const analysis = analyzeRequest(prompt)
// Returns: { complexity: 'simple' | 'moderate' | 'complex', requiredSkills, estimatedSpecialists }

// Decision logic
if (request.requiresSpecialists === false) → Handle directly
else if (analysis.complexity === 'simple') → Handle directly
else → Spawn specialists

// Complexity heuristics:
// simple: wordCount < 50, no complex terms
// moderate: wordCount 50-100 OR has multiple parts
// complex: wordCount > 100 OR complex terms OR multiple parts
```

### 3. Specialist Selection Logic

**Location**: `src/lib/agents/DepartmentHeadAgent.ts:263`
**Criteria**: Skills match + performance metrics

```typescript
// Query specialists by:
// 1. Same department
// 2. NOT department head
// 3. isActive = true
// 4. Skills match requiredSkills (if any)
// 5. Sort by success rate (descending)
// 6. Limit to estimatedSpecialists count
```

### 4. Grading & Threshold Logic

**passingThreshold Field**: `src/collections/Agents.ts:303`
- Default: **60%** (0-100 scale)
- Per-agent configurable in PayloadCMS
- **If 0 or missing**: Everything passes

**Grading Calculation**: `src/agents/tools/gradeOutput.ts:30`
```typescript
overallScore = (
  quality * 0.4 +      // 40% weight
  relevance * 0.3 +    // 30% weight
  consistency * 0.3    // 30% weight
)

// Convert to percentage
scorePercentage = overallScore * 100

// Decision logic
if (scorePercentage >= passingThreshold) → 'accept'
else if (scorePercentage >= (passingThreshold - 20)) → 'revise'
else → 'discard'
```

### 5. Retry Mechanism with Feedback

**Location**: `src/lib/agents/DepartmentHeadAgent.ts:318`
**Max Retries**: 3 (configurable per agent: `executionSettings.maxRetries`)
**Applies to**: Specialists only (Department Heads have 3 retries, Master has 0)

```typescript
// Retry loop
for (attempt = 0; attempt <= maxRetries; attempt++) {

  // Build prompt with feedback
  if (attempt === 0) {
    prompt = originalPrompt
  } else {
    prompt = `
      ORIGINAL REQUEST: ${originalPrompt}

      PREVIOUS ATTEMPT FAILED: ${lastResult.output}

      FEEDBACK FROM PREVIOUS ATTEMPTS:
      ${feedbackHistory.join('\n')}

      INSTRUCTIONS:
      Retry with improvements. Focus on quality, relevance, consistency.
    `
  }

  // Execute
  result = executeAgent(specialist, prompt, context)

  // Check threshold
  if (passingThreshold === 0 || result.qualityScore >= passingThreshold) {
    return SUCCESS
  }

  // Prepare for next retry
  feedbackHistory.push(
    `Quality score ${result.qualityScore} below threshold ${passingThreshold}.
     Improve quality, relevance, and consistency.`
  )
}

// All retries exhausted
return FAILED
```

**Feedback Structure**:
1. Original prompt (unchanged)
2. Previous failed output (for context)
3. Specific feedback: "Quality score X below threshold Y. Improve Z."

### 6. Department Head Review Logic

**Location**: `src/lib/agents/DepartmentHeadAgent.ts:422`
**When**: After all specialists complete (or after each retry)

```typescript
// Individual grading
for (each specialistResult) {
  qualityScore = result.qualityScore || 75

  // If no threshold set, auto-approve
  if (passingThreshold === 0) {
    reviewStatus = 'approved'
    reviewNotes = 'Auto-approved (no threshold set)'
  }
  // Below threshold
  else if (qualityScore < passingThreshold) {
    reviewStatus = 'rejected'
    reviewNotes = `Score ${qualityScore} below threshold ${passingThreshold}`
  }
  // Close to threshold (within 10 points)
  else if (qualityScore < passingThreshold + 10) {
    reviewStatus = 'revision-needed'
    reviewNotes = `Score ${qualityScore} acceptable but could improve`
  }
  // Well above threshold
  else {
    reviewStatus = 'approved'
    reviewNotes = 'Approved by department head'
  }
}
```

### 7. Synthesis Process

**Location**: `src/lib/agents/DepartmentHeadAgent.ts:397`
**Approach**: Create NEW output inspired by all approved outputs

```typescript
// Filter approved only
approvedResults = specialistResults.filter(r => r.reviewStatus === 'approved')

// Build synthesis prompt
synthesisPrompt = `
  Original request: ${originalPrompt}

  You are the department head. Review and synthesize the following
  specialist outputs into a cohesive final result:

  ## Specialist 1: ${specialist1.name} (${specialist1.specialization})
  Quality Score: ${specialist1.qualityScore}
  Output: ${specialist1.output}

  ## Specialist 2: ...

  Please synthesize these outputs into a cohesive, high-quality
  final result that addresses the original request.
`

// Department Head executes synthesis
finalResult = departmentHead.execute(synthesisPrompt)
```

**Key Point**: Department Head **creates a new output** inspired by specialists, NOT simple concatenation or picking the best.

### 8. Final Quality Assessment

**Location**: `src/lib/agents/DepartmentHeadAgent.ts:421`

```typescript
if (specialistResults.length === 0) {
  // Head-only execution
  qualityScore = 85 // Default
} else {
  // Calculate from specialist results
  approvalRate = (approvedCount / totalCount) * 100
  avgSpecialistScore = sum(specialistScores) / totalCount

  // Weighted average
  qualityScore = Math.round(
    approvalRate * 0.6 +           // 60% weight on approval rate
    avgSpecialistScore * 0.4       // 40% weight on avg scores
  )
}
```

### 9. Department Report Format

**Location**: `src/lib/agents/DepartmentHeadAgent.ts:164`
**Returns**: DepartmentHeadResult

```typescript
{
  departmentId: "dept-story",
  departmentName: "Story Department",
  headExecutionId: "exec-12345",

  // Final synthesized output
  output: { ... },

  // Overall quality score (0-100)
  qualityScore: 87,

  // All specialist results (approved + rejected)
  specialistResults: [
    {
      agentId: "story-dialogue-specialist",
      agentName: "Dialogue Specialist",
      specialization: "dialogue",
      output: { ... },
      qualityScore: 92,
      executionTime: 1234,
      reviewStatus: "approved",
      reviewNotes: "Approved after 1 retry"
    },
    // ... more specialists
  ],

  // Execution metadata
  metadata: {
    analysisTime: 123,
    specialistsUsed: 3,
    totalExecutionTime: 5678,
    successfulSpecialists: 2,
    failedSpecialists: 1
  }
}
```

---

## 🔄 Parallel Execution Scope

### Within Department (Specialist Level)

**Location**: `src/lib/agents/DepartmentHeadAgent.ts:298`

```typescript
// Specialists execute in parallel
const executions = specialists.map(specialist =>
  executeSpecialistWithRetry(specialist, prompt, context)
)
const results = await Promise.all(executions)
```

### Across Departments (Department Level)

**Location**: `src/agents/masterOrchestrator.ts:51`
**Mode: PARALLEL**

```typescript
// Independent departments run simultaneously
if (executionMode === 'parallel') {
  const departmentPromises = [
    executeDepartment('character', request),
    executeDepartment('visual', request),
    executeDepartment('audio', request)
  ]
  const results = await Promise.all(departmentPromises)
}
```

**Mode: SEQUENTIAL**

```typescript
// Dependent departments run in order
if (executionMode === 'sequential') {
  const characterResult = await executeDepartment('character', request)
  const visualResult = await executeDepartment('visual', request, {
    dependencies: [characterResult]
  })
  const audioResult = await executeDepartment('audio', request, {
    dependencies: [characterResult]
  })
}
```

---

## 🚨 Error Handling & Edge Cases

### 1. Master Orchestrator Failure
- **No retry** - Fails immediately
- Returns: "Unable to generate content"
- User sees error message

### 2. Department Head Failure (After 3 Retries)
- Mark department as failed
- Continue with other departments (if parallel)
- Final result includes partial data + error report

### 3. All Specialists Fail
- Department Head receives empty specialist results
- Department Head generates output directly
- Quality score defaults to 85 (head-only execution)

### 4. Synthesis Failure
- Retry synthesis up to 3 times
- If still fails: return best specialist output
- Flag as "partial synthesis failure" in report

### 5. Threshold = 0 (No Quality Gate)
- All outputs auto-approved
- reviewNotes: "Auto-approved (no threshold set)"
- Useful for experimental/draft mode

---

## 📊 Configuration Summary

### Agent-Level Settings (PayloadCMS)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `passingThreshold` | number (0-100) | 60 | Min score to pass. 0 = auto-pass |
| `executionSettings.maxRetries` | number | 3 | Max retry attempts |
| `executionSettings.timeout` | number (seconds) | 300 | Max execution time |
| `executionSettings.temperature` | number (0-2) | 0.7 | LLM creativity |

### Department-Level Settings

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `coordinationSettings.minQualityThreshold` | number | 80 | Fallback if agent has no passingThreshold |
| `coordinationSettings.maxRetries` | number | 3 | Department-level retry limit |
| `coordinationSettings.allowParallelExecution` | boolean | true | Enable parallel specialists |

---

## 🔍 Code Reference Map

| Component | File | Key Functions |
|-----------|------|---------------|
| Master Orchestrator | `src/agents/masterOrchestrator.ts` | Routing, coordination |
| Department Router | `src/lib/agents/coordination/departmentRouter.ts` | `routeRequest()`, `calculateRelevanceScores()` |
| Department Head | `src/lib/agents/DepartmentHeadAgent.ts` | `processRequest()`, `executeSpecialistWithRetry()` |
| Grading Tool | `src/agents/tools/gradeOutput.ts` | `analyzeQuality()`, `analyzeRelevance()` |
| Agent Collection | `src/collections/Agents.ts` | Schema with passingThreshold |
| Department Collection | `src/collections/Departments.ts` | Schema with coordination settings |

---

## 🎯 Threshold Decision Matrix

| Scenario | passingThreshold | Result |
|----------|------------------|--------|
| Agent has threshold 70 | 70 | Uses 70% |
| Agent has 0 | 0 | Auto-passes everything |
| Agent missing, Dept has 80 | 80 | Falls back to department 80% |
| Agent missing, Dept missing | 60 | Uses default 60% |

---

## 📈 Quality Calculation Examples

**Example 1: High Quality Specialists**
```
Specialist 1: 95% approved
Specialist 2: 88% approved
Specialist 3: 92% approved

approvalRate = (3/3) * 100 = 100%
avgScore = (95 + 88 + 92) / 3 = 91.67%
finalScore = (100 * 0.6) + (91.67 * 0.4) = 60 + 36.67 = 96.67% ✅
```

**Example 2: Mixed Quality**
```
Specialist 1: 45% rejected
Specialist 2: 78% approved
Specialist 3: 82% approved

approvalRate = (2/3) * 100 = 66.67%
avgScore = (45 + 78 + 82) / 3 = 68.33%
finalScore = (66.67 * 0.6) + (68.33 * 0.4) = 40 + 27.33 = 67.33% ✅
```

**Example 3: All Failed**
```
Specialist 1: 35% rejected
Specialist 2: 42% rejected
Specialist 3: 38% rejected

approvalRate = (0/3) * 100 = 0%
avgScore = (35 + 42 + 38) / 3 = 38.33%
finalScore = (0 * 0.6) + (38.33 * 0.4) = 0 + 15.33 = 15.33% ❌

→ Department Head handles directly (quality defaults to 85%)
```

---

## 🔄 Complete Workflow Example

**User Request**: "Create a dramatic opening scene with Aladdin stealing bread"

### Step 1: Master Orchestrator Analysis
```typescript
Relevance Scores:
- STORY: 0.85 (keywords: scene, dramatic, opening)
- CHARACTER: 0.65 (keywords: Aladdin, stealing)
- VISUAL: 0.50 (keywords: scene, opening)
- AUDIO: 0.35 (keywords: dramatic)
- IMAGE_QUALITY: 0.15
- PRODUCTION: 0.10

Primary: STORY
Supporting: CHARACTER, VISUAL, AUDIO
Execution Mode: SEQUENTIAL (visual depends on character)
```

### Step 2: Department Execution Order
```
1. CHARACTER (parallel start) → Defines Aladdin's traits
2. STORY (parallel start) → Creates narrative structure
3. AUDIO (parallel start) → Plans sound design
4. VISUAL (after character) → Designs based on Aladdin's appearance
```

### Step 3: Character Department
```
Complexity Analysis: "moderate" (50 words, character focus)
Decision: Spawn 2 specialists

Specialists Selected:
1. character-appearance-specialist (passingThreshold: 65)
2. character-personality-specialist (passingThreshold: 60)

Parallel Execution:
- Appearance specialist: Attempt 1 → 58% (below 65) → Retry with feedback
                        Attempt 2 → 72% → APPROVED
- Personality specialist: Attempt 1 → 87% → APPROVED

Department Head Review:
- Appearance: 72% → revision-needed (within 10 of threshold)
- Personality: 87% → approved

Synthesis:
"Create cohesive character profile from these outputs..."
→ Department Head generates integrated Aladdin profile

Quality Score: (2/2 * 100) * 0.6 + (79.5) * 0.4 = 60 + 31.8 = 91.8%
```

### Step 4: Master Orchestrator Aggregation
```
Received:
- CHARACTER: 91.8% ✅
- STORY: 88.5% ✅
- VISUAL: 82.0% ✅
- AUDIO: 76.5% ✅

Cross-department validation: PASSED
Consistency check: PASSED

Final Output:
{
  scene: "Aladdin's dramatic bread theft",
  character: { ... },
  narrative: { ... },
  visual: { ... },
  audio: { ... },
  overallQuality: 87.2%
}
```

---

## 📝 Implementation Checklist

- [x] passingThreshold field in Agents collection (default 60)
- [x] Dynamic threshold resolution (agent → department → default)
- [x] Retry mechanism with feedback loop (up to 3 retries)
- [x] Feedback structure: original + "what failed" + suggestions
- [x] Parallel specialist execution
- [x] Department Head synthesis (create new inspired output)
- [x] Quality assessment with weighted scoring
- [x] Department report with metadata
- [ ] Master Orchestrator aggregation (Phase 2)
- [ ] Cross-department validation (Phase 3)
- [ ] Brain integration for consistency checks (Phase 3)

---

## 🚀 Future Enhancements

1. **Dynamic Threshold Adjustment**: Learn optimal thresholds per agent based on historical performance
2. **Specialist Recommendation**: ML-based specialist selection beyond keyword matching
3. **Advanced Synthesis**: Multi-round synthesis with iterative refinement
4. **Conflict Resolution**: Automated resolution of contradictory specialist outputs
5. **Streaming Responses**: Real-time UI updates as specialists complete
6. **Cost Optimization**: Smart batching and caching for token efficiency

---

**This document is the authoritative source for understanding Aladdin's agent decision workflow.**

*Last verified against codebase: January 2025*
