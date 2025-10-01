# Phase 4 Multi-Department Agents - Comprehensive Test Strategy

**Version**: 1.0.0
**Created**: 2025-10-01
**Agent**: Tester (QA Specialist)
**Status**: Complete
**Phase**: 4 - Multi-Department Agents

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Test Coverage Areas](#test-coverage-areas)
4. [Test Categories & Priorities](#test-categories--priorities)
5. [Detailed Test Cases (320+)](#detailed-test-cases-320)
6. [Mock & Fixture Strategies](#mock--fixture-strategies)
7. [Performance Benchmarks](#performance-benchmarks)
8. [Quality Metrics & Coverage Targets](#quality-metrics--coverage-targets)
9. [Verification Criteria](#verification-criteria)
10. [Test Execution Strategy](#test-execution-strategy)

---

## Executive Summary

### Scope

Phase 4 introduces the complete hierarchical agent system with:
- **Master Orchestrator**: Single coordination agent
- **5 Department Heads**: Character, Story, Visual, Image Quality, Audio, Production
- **34+ Specialist Agents**: Domain-specific task executors
- **Parallel execution**: Within departments
- **Cross-department dependencies**: Sequential coordination
- **Quality grading**: Department heads evaluate specialist outputs

### Coverage Targets

- **Overall Coverage**: 88%+ (lines, statements, branches)
- **Department Coordination Logic**: 98%+
- **Specialist Execution**: 95%+
- **Cross-Department Workflows**: 92%+
- **Performance Tests**: 100% of critical paths

### Test Counts

- **Unit Tests**: 140+ test cases
- **Integration Tests**: 95+ test cases
- **E2E Tests**: 45+ test cases
- **Performance Tests**: 25+ benchmarks
- **Cross-Department Tests**: 20+ workflows

**Total**: 325+ test cases

---

## Architecture Overview

### Three-Tier Hierarchy

```
┌─────────────────────────────────────────────┐
│   LEVEL 1: Master Orchestrator              │
│   - Routes to departments                   │
│   - Validates cross-dept consistency        │
│   - Final Brain validation                  │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┼──────────────┬───────────────┬────────────┐
    │              │              │               │            │
    ▼              ▼              ▼               ▼            ▼
┌─────────┐  ┌─────────┐  ┌────────────┐  ┌──────────┐  ┌────────────┐
│Character│  │  Story  │  │   Visual   │  │  Audio   │  │ Production │
│  Dept   │  │  Dept   │  │   Dept     │  │  Dept    │  │   Dept     │
│  Head   │  │  Head   │  │   Head     │  │  Head    │  │   Head     │
└────┬────┘  └────┬────┘  └─────┬──────┘  └────┬─────┘  └─────┬──────┘
     │            │              │              │              │
     │            │              └──────┬───────┘              │
     │            │                     │                      │
     │            │              ┌──────────────┐              │
     │            │              │Image Quality │              │
     │            │              │Dept Head     │              │
     │            │              └──────┬───────┘              │
     │            │                     │                      │
  ┌──┴─────┬──────┴───┬─────────┬──────┴──────┬───────┬───────┴────┐
  ▼        ▼          ▼         ▼             ▼       ▼            ▼
┌────┐  ┌────┐    ┌────┐    ┌────────┐   ┌────┐   ┌────┐      ┌────┐
│Hair│  │Char│    │Story│    │Master  │   │Voice│  │Prod│      │... │
│Sty │  │Arc │    │Arch │    │Ref Gen │   │Crea│  │Mgr │      │+34 │
│list│  │Mgr │    │tect │    │        │   │tor │  │    │      │more│
└────┘  └────┘    └────┘    └────────┘   └────┘   └────┘      └────┘

LEVEL 2: 6 Department Heads
LEVEL 3: 34+ Specialist Agents
```

### Department Structure

| Department | Head Agent | Specialist Count | Key Specialists |
|------------|-----------|------------------|-----------------|
| Character | `character-department-head` | 8 | Hair Stylist, Costume Designer, Makeup Artist, Character Creator, Voice Profile, Arc Manager, Relationship Mapper, Casting Advisor |
| Story | `story-department-head` | 7 | Story Architect, Episode Planner, World Builder, Dialogue Writer, Story Bible Keeper, Theme Analyzer, Pacing Designer |
| Visual | `visual-department-head` | 10 | Concept Artist, Storyboard Artist, Environment Designer, Shot Designer, Props Master, Lighting Designer, Color Grader, Camera Operator, VFX Designer, Compositor |
| Image Quality | `image-quality-department-head` | 6 | Master Reference Generator, 360° Profile Creator, Image Descriptor, Shot Composer, Action Shot Generator, Consistency Verifier |
| Audio | `audio-department-head` | 6 | Voice Creator, Music Composer, Sound Designer, Foley Artist, Audio Mixer, Dialogue Editor |
| Production | `production-department-head` | 5 | Production Manager, Scheduler, Budget Coordinator, Resource Allocator, Quality Controller |

**Total**: 6 Department Heads + 42 Specialists = 48 Agents

---

## Test Coverage Areas

### 1. Master Orchestrator Tests
**Priority**: Critical
**Coverage Target**: 98%

#### Test Scenarios
- Request analysis (intent, scope, complexity)
- Department routing logic (priority, dependencies)
- Cross-department consistency validation
- Brain validation integration
- Final aggregation and presentation
- Error handling (department failures)
- Concurrent department execution
- Dependency resolution

### 2. Department Head Tests
**Priority**: Critical
**Coverage Target**: 95%

#### Test Scenarios (Per Department)
- Relevance assessment (0.0-1.0 scoring)
- Specialist selection logic
- Parallel specialist spawning
- Output grading (quality, relevance, consistency)
- Decision making (accept/revise/discard)
- Department report compilation
- Revision workflows
- Resource management

### 3. Specialist Agent Tests
**Priority**: High
**Coverage Target**: 90%

#### Test Scenarios (Per Specialist)
- Input validation
- Task execution
- Self-assessment (confidence, completeness)
- Output format validation
- Error handling
- Timeout handling
- Resource constraints
- Context awareness

### 4. Cross-Department Coordination
**Priority**: Critical
**Coverage Target**: 95%

#### Test Scenarios
- Sequential dependencies (Visual waits for Character)
- Parallel independent departments
- Dependency cycle detection
- Timeout cascade handling
- Partial failure recovery
- Consistency across departments
- Data sharing between departments

### 5. Grading System Tests
**Priority**: Critical
**Coverage Target**: 98%

#### Test Scenarios
- Quality scoring (0.0-1.0)
- Relevance scoring
- Consistency scoring
- Overall weighted score calculation
- Threshold enforcement (≥ 0.60 default)
- Issue detection
- Suggestion generation
- Decision reasoning

### 6. Multi-Department Workflows
**Priority**: Critical
**Coverage Target**: 92%

#### Test Scenarios
- Character creation (Character + Visual + Audio)
- Scene creation (Story + Visual + Image Quality)
- 360° reference generation (Image Quality alone)
- Composite shot creation (Image Quality + Visual)
- Episode planning (Story + Production)
- Full production workflow (all departments)

---

## Test Categories & Priorities

### Priority 1: Critical (Must Pass for Release)

1. Master Orchestrator routing logic
2. Department head specialist selection
3. Parallel specialist execution within departments
4. Department head grading system
5. Cross-department dependency resolution
6. E2E character creation workflow
7. E2E scene creation workflow
8. Performance: 50+ concurrent agents
9. Brain validation integration
10. Error recovery mechanisms

### Priority 2: High (Should Pass)

1. Individual specialist agent tests (34+)
2. Department report compilation
3. Revision workflows
4. Image Quality 360° profile generation
5. Composite shot generation
6. Advanced cross-department workflows
7. Resource management under load
8. Performance optimization tests

### Priority 3: Medium (Nice to Have)

1. Advanced grading heuristics
2. Specialist self-learning
3. Department optimization
4. Cost tracking
5. Advanced analytics

---

## Detailed Test Cases (320+)

### A. Master Orchestrator Tests (30 cases)

#### A1. Request Analysis (10 cases)

```typescript
// TEST-ORCH-001: Analyze character creation request
describe('Master Orchestrator - Request Analysis', () => {
  it('should identify character creation intent', async () => {
    // Given: User request "Create a cyberpunk detective named Sarah"
    const request = {
      userPrompt: "Create a cyberpunk detective named Sarah",
      projectId: "proj-123"
    }

    // When: Orchestrator analyzes request
    const analysis = await orchestrator.analyzeRequest(request)

    // Then: Identifies correct intent and departments
    expect(analysis.intent).toBe('character_creation')
    expect(analysis.scope).toBe('comprehensive')
    expect(analysis.departments).toContain('character')
    expect(analysis.departments).toContain('visual')
    expect(analysis.priority).toBe('high')
  })

  // TEST-ORCH-002: Identify scene creation request
  // TEST-ORCH-003: Multi-department request (character + scene)
  // TEST-ORCH-004: Low-relevance department filtering
  // TEST-ORCH-005: Priority assignment logic
  // TEST-ORCH-006: Complexity assessment
  // TEST-ORCH-007: Ambiguous request handling
  // TEST-ORCH-008: Empty/invalid request handling
  // TEST-ORCH-009: Large batch request (10+ items)
  // TEST-ORCH-010: Context awareness (project history)
})
```

#### A2. Department Routing (10 cases)

```typescript
// TEST-ORCH-011: Route to character department
describe('Master Orchestrator - Department Routing', () => {
  it('should route to character department with high priority', async () => {
    // Given: Character creation request
    const analysis = {
      intent: 'character_creation',
      departments: ['character', 'visual']
    }

    // When: Routing performed
    const routing = await orchestrator.routeToDepartments(analysis)

    // Then: Character department has priority
    expect(routing).toEqual([
      {
        department: 'character',
        relevance: 1.0,
        priority: 'high',
        instructions: expect.stringContaining('Create character'),
        dependencies: []
      },
      {
        department: 'visual',
        relevance: 0.7,
        priority: 'medium',
        instructions: expect.stringContaining('visual concept'),
        dependencies: ['character']  // Waits for character dept
      }
    ])
  })

  // TEST-ORCH-012: Sequential dependency routing
  // TEST-ORCH-013: Parallel routing (no dependencies)
  // TEST-ORCH-014: Dependency cycle detection
  // TEST-ORCH-015: Relevance threshold filtering (< 0.3 excluded)
  // TEST-ORCH-016: Custom routing rules
  // TEST-ORCH-017: Override department selection
  // TEST-ORCH-018: Emergency routing (high priority)
  // TEST-ORCH-019: Batch routing optimization
  // TEST-ORCH-020: Routing error handling
})
```

#### A3. Cross-Department Validation (10 cases)

```typescript
// TEST-ORCH-021: Validate consistency across departments
describe('Master Orchestrator - Cross-Department Validation', () => {
  it('should validate consistency between character and visual departments', async () => {
    // Given: Character and Visual department outputs
    const departmentReports = [
      {
        department: 'character',
        outputs: [{
          output: { hair: 'black undercut', clothing: 'tactical jacket' }
        }]
      },
      {
        department: 'visual',
        outputs: [{
          output: { appearance: 'black hair, tactical outfit' }
        }]
      }
    ]

    // When: Cross-department validation performed
    const validation = await orchestrator.validateConsistency(departmentReports)

    // Then: High consistency score
    expect(validation.consistency).toBeGreaterThan(0.85)
    expect(validation.contradictions).toHaveLength(0)
  })

  // TEST-ORCH-022: Detect contradictions (age mismatch)
  // TEST-ORCH-023: Detect timeline inconsistencies
  // TEST-ORCH-024: Handle missing department outputs
  // TEST-ORCH-025: Aggregate quality scores
  // TEST-ORCH-026: Brain validation integration
  // TEST-ORCH-027: Final recommendation logic
  // TEST-ORCH-028: Presentation formatting
  // TEST-ORCH-029: User notification structure
  // TEST-ORCH-030: Rollback on validation failure
})
```

### B. Department Head Tests (60 cases, 10 per department)

#### B1. Character Department Head (10 cases)

```typescript
// TEST-DEPT-CHAR-001: Assess relevance for character request
describe('Character Department Head', () => {
  it('should assess high relevance for character creation', async () => {
    // Given: Character creation instructions
    const instructions = "Create a cyberpunk detective named Sarah"

    // When: Department head assesses relevance
    const relevance = await characterDept.assessRelevance(instructions)

    // Then: High relevance score
    expect(relevance).toBeGreaterThan(0.9)
    expect(relevance).toBeLessThanOrEqual(1.0)
  })

  // TEST-DEPT-CHAR-002: Low relevance for scene creation
  it('should assess low relevance for scene creation', async () => {
    const instructions = "Create a sunset scene in a park"
    const relevance = await characterDept.assessRelevance(instructions)

    expect(relevance).toBeLessThan(0.3)
  })

  // TEST-DEPT-CHAR-003: Select appropriate specialists
  it('should select hair stylist, costume designer, character creator', async () => {
    const instructions = "Create character with unique style"
    const specialists = await characterDept.selectSpecialists(instructions)

    expect(specialists).toContain('hair-stylist-specialist')
    expect(specialists).toContain('costume-designer-specialist')
    expect(specialists).toContain('character-creator-specialist')
    expect(specialists.length).toBeGreaterThan(2)
  })

  // TEST-DEPT-CHAR-004: Parallel specialist execution
  // TEST-DEPT-CHAR-005: Grade specialist outputs
  // TEST-DEPT-CHAR-006: Accept high quality output (score ≥ 0.70)
  // TEST-DEPT-CHAR-007: Reject low quality output (score < 0.40)
  // TEST-DEPT-CHAR-008: Request revision (0.40 - 0.59)
  // TEST-DEPT-CHAR-009: Compile department report
  // TEST-DEPT-CHAR-010: Handle specialist failure
})
```

#### B2. Story Department Head (10 cases)

```typescript
// TEST-DEPT-STORY-001: Relevance for story request
// TEST-DEPT-STORY-002: Select story architect specialist
// TEST-DEPT-STORY-003: Select episode planner
// TEST-DEPT-STORY-004: Parallel story specialist execution
// TEST-DEPT-STORY-005: Grade story outputs
// TEST-DEPT-STORY-006: Story consistency validation
// TEST-DEPT-STORY-007: Timeline coherence check
// TEST-DEPT-STORY-008: Character arc validation
// TEST-DEPT-STORY-009: World building consistency
// TEST-DEPT-STORY-010: Story department report
```

#### B3. Visual Department Head (10 cases)

```typescript
// TEST-DEPT-VISUAL-001: Relevance for visual request
// TEST-DEPT-VISUAL-002: Select concept artist
// TEST-DEPT-VISUAL-003: Select environment designer
// TEST-DEPT-VISUAL-004: Coordinate with Image Quality dept
// TEST-DEPT-VISUAL-005: Visual consistency check
// TEST-DEPT-VISUAL-006: Style guide enforcement
// TEST-DEPT-VISUAL-007: Color palette consistency
// TEST-DEPT-VISUAL-008: Lighting coherence
// TEST-DEPT-VISUAL-009: Composition quality
// TEST-DEPT-VISUAL-010: Visual department report
```

#### B4. Image Quality Department Head (10 cases)

```typescript
// TEST-DEPT-IMAGE-001: Master reference generation
describe('Image Quality Department Head', () => {
  it('should generate master reference image for character', async () => {
    // Given: Character data from Character Department
    const characterData = {
      name: 'Sarah Chen',
      appearance: 'black undercut, tactical jacket',
      age: 32
    }

    // When: Master reference generated
    const result = await imageQualityDept.generateMasterReference({
      type: 'character',
      data: characterData
    })

    // Then: High-quality reference created
    expect(result.masterImage).toBeDefined()
    expect(result.quality).toBeGreaterThan(0.85)
    expect(result.description).toContain('black undercut')
    expect(result.mediaId).toBeDefined()
  })

  // TEST-DEPT-IMAGE-002: 360° profile generation (12 images)
  it('should generate 12-image 360° profile', async () => {
    const masterRef = { imageUrl: 'master.png', description: 'Character' }
    const profile = await imageQualityDept.generate360Profile(masterRef)

    expect(profile.images).toHaveLength(12)
    expect(profile.images[0].angle).toBe(0)
    expect(profile.images[11].angle).toBe(330)
    expect(profile.verified).toBe(true)
  })

  // TEST-DEPT-IMAGE-003: Composite shot generation
  // TEST-DEPT-IMAGE-004: Consistency verification
  // TEST-DEPT-IMAGE-005: Reference database storage
  // TEST-DEPT-IMAGE-006: Missing reference handling
  // TEST-DEPT-IMAGE-007: Image descriptor specialist
  // TEST-DEPT-IMAGE-008: Action shot generation
  // TEST-DEPT-IMAGE-009: Quality rating
  // TEST-DEPT-IMAGE-010: Image Quality dept report
})
```

#### B5. Audio Department Head (10 cases)

```typescript
// TEST-DEPT-AUDIO-001: Relevance for audio request
// TEST-DEPT-AUDIO-002: Voice profile creation
// TEST-DEPT-AUDIO-003: Music composition
// TEST-DEPT-AUDIO-004: Sound design
// TEST-DEPT-AUDIO-005: Audio mixing
// TEST-DEPT-AUDIO-006: Voice-character consistency
// TEST-DEPT-AUDIO-007: Audio quality grading
// TEST-DEPT-AUDIO-008: Sync with visual timing
// TEST-DEPT-AUDIO-009: Audio format validation
// TEST-DEPT-AUDIO-010: Audio department report
```

#### B6. Production Department Head (10 cases)

```typescript
// TEST-DEPT-PROD-001: Resource allocation
// TEST-DEPT-PROD-002: Timeline management
// TEST-DEPT-PROD-003: Budget tracking
// TEST-DEPT-PROD-004: Quality control checks
// TEST-DEPT-PROD-005: Dependency scheduling
// TEST-DEPT-PROD-006: Bottleneck detection
// TEST-DEPT-PROD-007: Resource optimization
// TEST-DEPT-PROD-008: Progress tracking
// TEST-DEPT-PROD-009: Risk assessment
// TEST-DEPT-PROD-010: Production report
```

### C. Specialist Agent Tests (70 cases, 2-3 per key specialist)

#### C1. Character Specialists (16 cases)

```typescript
// TEST-SPEC-HAIR-001: Hair stylist generates hairstyle
describe('Hair Stylist Specialist', () => {
  it('should generate cyberpunk hairstyle for detective', async () => {
    // Given: Character profile
    const context = {
      characterName: 'Sarah Chen',
      role: 'detective',
      setting: { genre: 'cyberpunk', timePeriod: '2080s' }
    }

    // When: Hair stylist executes
    const result = await runSpecialist({
      specialistId: 'hair-stylist-specialist',
      instructions: 'Design hairstyle for cyberpunk detective',
      context
    })

    // Then: Hairstyle output with self-assessment
    expect(result.output.hairstyle).toBeDefined()
    expect(result.output.hairstyle.style).toContain('undercut')
    expect(result.confidence).toBeGreaterThan(0.7)
    expect(result.completeness).toBeGreaterThan(0.8)
  })

  // TEST-SPEC-HAIR-002: Hair stylist self-assessment accuracy
})

// TEST-SPEC-COSTUME-001: Costume designer creates outfit
// TEST-SPEC-COSTUME-002: Costume designer considers setting

// TEST-SPEC-MAKEUP-001: Makeup artist designs makeup
// TEST-SPEC-MAKEUP-002: Makeup artist considers character age

// TEST-SPEC-CHAR-CREATOR-001: Character creator builds personality
// TEST-SPEC-CHAR-CREATOR-002: Character creator generates backstory

// TEST-SPEC-VOICE-001: Voice profile creator defines voice
// TEST-SPEC-VOICE-002: Voice profile matches personality

// TEST-SPEC-ARC-001: Character arc manager creates development
// TEST-SPEC-ARC-002: Arc manager validates timeline

// TEST-SPEC-RELATION-001: Relationship mapper defines connections
// TEST-SPEC-RELATION-002: Relationship consistency check

// TEST-SPEC-CASTING-001: Casting advisor suggests actors
// TEST-SPEC-CASTING-002: Casting advisor considers budget
```

#### C2. Story Specialists (14 cases)

```typescript
// TEST-SPEC-STORY-ARCH-001: Story architect creates structure
// TEST-SPEC-STORY-ARCH-002: Story architect defines acts

// TEST-SPEC-EPISODE-001: Episode planner breaks down episodes
// TEST-SPEC-EPISODE-002: Episode planner balances pacing

// TEST-SPEC-WORLD-001: World builder creates setting
// TEST-SPEC-WORLD-002: World builder maintains consistency

// TEST-SPEC-DIALOGUE-001: Dialogue writer creates conversations
// TEST-SPEC-DIALOGUE-002: Dialogue matches character voice

// TEST-SPEC-BIBLE-001: Story bible keeper documents canon
// TEST-SPEC-BIBLE-002: Bible keeper detects contradictions

// TEST-SPEC-THEME-001: Theme analyzer identifies themes
// TEST-SPEC-THEME-002: Theme analyzer tracks motifs

// TEST-SPEC-PACING-001: Pacing designer optimizes flow
// TEST-SPEC-PACING-002: Pacing designer balances tension
```

#### C3. Image Quality Specialists (12 cases)

```typescript
// TEST-SPEC-MASTER-REF-001: Master reference generator creates reference
// TEST-SPEC-MASTER-REF-002: Master reference quality validation

// TEST-SPEC-360-001: 360° profile creator generates 12 images
// TEST-SPEC-360-002: 360° consistency across angles

// TEST-SPEC-IMAGE-DESC-001: Image descriptor writes detailed description
// TEST-SPEC-IMAGE-DESC-002: Image descriptor identifies key features

// TEST-SPEC-SHOT-COMP-001: Shot composer creates composite
// TEST-SPEC-SHOT-COMP-002: Shot composer uses references

// TEST-SPEC-ACTION-001: Action shot generator creates dynamic scene
// TEST-SPEC-ACTION-002: Action maintains character consistency

// TEST-SPEC-CONSISTENCY-001: Consistency verifier validates images
// TEST-SPEC-CONSISTENCY-002: Consistency verifier flags issues
```

#### C4. Visual Specialists (10 cases)

```typescript
// TEST-SPEC-CONCEPT-001: Concept artist creates style frames
// TEST-SPEC-ENVIRONMENT-001: Environment designer creates locations
// TEST-SPEC-PROPS-001: Props master designs objects
// TEST-SPEC-LIGHTING-001: Lighting designer sets mood
// TEST-SPEC-COLOR-001: Color grader maintains palette
// TEST-SPEC-CAMERA-001: Camera operator plans shots
// TEST-SPEC-VFX-001: VFX designer creates effects
// TEST-SPEC-COMPOSITOR-001: Compositor assembles elements
// TEST-SPEC-STORYBOARD-001: Storyboard artist creates boards
// TEST-SPEC-SHOT-DESIGNER-001: Shot designer plans composition
```

#### C5. Audio Specialists (12 cases)

```typescript
// TEST-SPEC-VOICE-CREATOR-001: Voice creator designs voice
// TEST-SPEC-MUSIC-001: Music composer creates score
// TEST-SPEC-SOUND-DESIGN-001: Sound designer creates effects
// TEST-SPEC-FOLEY-001: Foley artist creates sounds
// TEST-SPEC-AUDIO-MIX-001: Audio mixer balances levels
// TEST-SPEC-DIALOGUE-EDIT-001: Dialogue editor cleans audio
// ... (6 more specialist tests)
```

#### C6. Production Specialists (6 cases)

```typescript
// TEST-SPEC-PROD-MGR-001: Production manager allocates resources
// TEST-SPEC-SCHEDULER-001: Scheduler creates timeline
// TEST-SPEC-BUDGET-001: Budget coordinator tracks costs
// TEST-SPEC-RESOURCE-001: Resource allocator optimizes usage
// TEST-SPEC-QUALITY-CTRL-001: Quality controller validates
// TEST-SPEC-CONTINUITY-001: Continuity checker detects errors
```

### D. Grading System Tests (35 cases)

#### D1. Quality Scoring (10 cases)

```typescript
// TEST-GRADE-001: High quality output (≥ 0.80)
describe('Department Grading System', () => {
  it('should score high quality hairstyle output ≥ 0.80', async () => {
    // Given: High quality specialist output
    const specialistOutput = {
      agentId: 'hair-stylist-specialist',
      output: {
        hairstyle: {
          style: 'Asymmetric undercut with precision-cut edges',
          color: 'Jet black with subtle blue-black highlights',
          texture: 'Sleek on shaved sides, slightly tousled on top',
          maintenance: 'medium',
          reasoning: 'Combines professional polish with rebellious edge...'
        }
      },
      confidence: 0.92,
      completeness: 0.95
    }

    // When: Department head grades output
    const grading = await gradeSpecialistOutput(
      client,
      'character-department-head',
      specialistOutput
    )

    // Then: High quality score
    expect(grading.qualityScore).toBeGreaterThanOrEqual(0.80)
    expect(grading.overallScore).toBeGreaterThanOrEqual(0.80)
    expect(grading.decision).toBe('accept')
  })

  // TEST-GRADE-002: Medium quality (0.60 - 0.79)
  // TEST-GRADE-003: Low quality (< 0.60)
  // TEST-GRADE-004: Quality score calculation formula
  // TEST-GRADE-005: Empty output handling
  // TEST-GRADE-006: Partial output scoring
  // TEST-GRADE-007: Confidence weight in quality
  // TEST-GRADE-008: Completeness weight in quality
  // TEST-GRADE-009: Quality score caching
  // TEST-GRADE-010: Quality trend tracking
})
```

#### D2. Relevance Scoring (10 cases)

```typescript
// TEST-GRADE-011: High relevance to request
// TEST-GRADE-012: Low relevance to request
// TEST-GRADE-013: Relevance calculation formula
// TEST-GRADE-014: Context awareness in relevance
// TEST-GRADE-015: Keyword matching
// TEST-GRADE-016: Semantic similarity
// TEST-GRADE-017: Relevance threshold (0.60)
// TEST-GRADE-018: Irrelevant output filtering
// TEST-GRADE-019: Relevance scoring consistency
// TEST-GRADE-020: Multi-aspect relevance
```

#### D3. Decision Logic (10 cases)

```typescript
// TEST-GRADE-021: Accept decision (overall ≥ 0.70)
describe('Grading Decision Logic', () => {
  it('should decide ACCEPT for overall score ≥ 0.70', async () => {
    const grading = {
      qualityScore: 0.82,
      relevanceScore: 0.88,
      consistencyScore: 0.79,
      overallScore: 0.83
    }

    const decision = makeDecision(grading)

    expect(decision).toBe('accept')
    expect(grading.reasoning).toContain('quality standards')
  })

  // TEST-GRADE-022: Revise decision (0.40 - 0.69)
  it('should decide REVISE for overall score 0.40-0.69', async () => {
    const grading = { overallScore: 0.55 }
    const decision = makeDecision(grading)

    expect(decision).toBe('revise')
  })

  // TEST-GRADE-023: Discard decision (< 0.40)
  // TEST-GRADE-024: Decision threshold customization
  // TEST-GRADE-025: Issue-based decision override
  // TEST-GRADE-026: Critical issue detection
  // TEST-GRADE-027: Decision reasoning generation
  // TEST-GRADE-028: Multi-criteria decision
  // TEST-GRADE-029: Subjective quality adjustment
  // TEST-GRADE-030: Department-specific thresholds
})
```

#### D4. Suggestion Generation (5 cases)

```typescript
// TEST-GRADE-031: Generate improvement suggestions
// TEST-GRADE-032: Prioritize suggestions by impact
// TEST-GRADE-033: Context-specific suggestions
// TEST-GRADE-034: Actionable suggestion format
// TEST-GRADE-035: Suggestion tracking
```

### E. Cross-Department Coordination Tests (40 cases)

#### E1. Sequential Dependencies (15 cases)

```typescript
// TEST-COORD-001: Visual waits for Character department
describe('Cross-Department Dependencies', () => {
  it('should execute Character before Visual department', async () => {
    // Given: Request requiring both departments
    const request = "Create character Sarah with visual concept"

    // When: Master orchestrator routes with dependencies
    const execution = await orchestrator.execute({
      departments: [
        { name: 'character', dependencies: [] },
        { name: 'visual', dependencies: ['character'] }
      ]
    })

    // Then: Character completes before Visual starts
    expect(execution.timeline).toEqual([
      { department: 'character', startTime: expect.any(Date), endTime: expect.any(Date) },
      { department: 'visual', startTime: expect.any(Date), endTime: expect.any(Date) }
    ])
    expect(execution.timeline[0].endTime.getTime())
      .toBeLessThan(execution.timeline[1].startTime.getTime())
  })

  // TEST-COORD-002: Audio waits for Character + Visual
  // TEST-COORD-003: Image Quality depends on Character
  // TEST-COORD-004: Production depends on all departments
  // TEST-COORD-005: Multi-level dependencies
  // TEST-COORD-006: Dependency timeout handling
  // TEST-COORD-007: Partial dependency satisfaction
  // TEST-COORD-008: Dependency cycle detection
  // TEST-COORD-009: Conditional dependencies
  // TEST-COORD-010: Dynamic dependency adjustment
  // TEST-COORD-011: Dependency error propagation
  // TEST-COORD-012: Dependency data passing
  // TEST-COORD-013: Dependency version control
  // TEST-COORD-014: Dependency caching
  // TEST-COORD-015: Dependency visualization
})
```

#### E2. Parallel Execution (10 cases)

```typescript
// TEST-COORD-016: Independent departments run in parallel
describe('Parallel Department Execution', () => {
  it('should run Character and Story departments in parallel', async () => {
    // Given: Two independent departments
    const routing = [
      { department: 'character', dependencies: [] },
      { department: 'story', dependencies: [] }
    ]

    // When: Executed
    const start = Date.now()
    const results = await orchestrator.executeParallel(routing)
    const duration = Date.now() - start

    // Then: Execute concurrently (< 1.5x single dept time)
    const singleDeptTime = 2000 // Assume 2s per department
    expect(duration).toBeLessThan(singleDeptTime * 1.5)
    expect(results).toHaveLength(2)
  })

  // TEST-COORD-017: Resource pooling for parallel execution
  // TEST-COORD-018: Parallel execution limits (max 5 departments)
  // TEST-COORD-019: Load balancing across departments
  // TEST-COORD-020: Parallel error isolation
  // TEST-COORD-021: Parallel timeout enforcement
  // TEST-COORD-022: Parallel result aggregation
  // TEST-COORD-023: Parallel progress tracking
  // TEST-COORD-024: Parallel memory management
  // TEST-COORD-025: Parallel department coordination
})
```

#### E3. Data Sharing (10 cases)

```typescript
// TEST-COORD-026: Share character data with visual dept
// TEST-COORD-027: Share scene data with image quality
// TEST-COORD-028: Share timeline with production
// TEST-COORD-029: Data versioning across departments
// TEST-COORD-030: Data conflict resolution
// TEST-COORD-031: Data transformation between departments
// TEST-COORD-032: Data validation on sharing
// TEST-COORD-033: Data access control
// TEST-COORD-034: Data caching for shared access
// TEST-COORD-035: Data consistency enforcement
```

#### E4. Error Handling (5 cases)

```typescript
// TEST-COORD-036: Handle department failure gracefully
// TEST-COORD-037: Partial success handling
// TEST-COORD-038: Rollback on critical failure
// TEST-COORD-039: Error notification to user
// TEST-COORD-040: Recovery strategies
```

### F. End-to-End Workflow Tests (45 cases)

#### F1. Character Creation Workflow (15 cases)

```typescript
// TEST-E2E-CHAR-001: Complete character creation (5 departments)
describe('E2E Character Creation Workflow', () => {
  it('should create character through all departments in < 60s', async () => {
    // Given: User request for comprehensive character
    const request = {
      userPrompt: "Create cyberpunk detective Sarah Chen with full visual and audio",
      projectId: "proj-123"
    }

    // When: Full workflow executes
    const startTime = Date.now()
    const result = await executeWorkflow(request)
    const duration = Date.now() - startTime

    // Then: All departments complete successfully
    expect(result.departmentReports).toHaveLength(5) // Character, Story, Visual, Image Quality, Audio
    expect(duration).toBeLessThan(60000) // < 60 seconds

    expect(result.departmentReports[0].department).toBe('character')
    expect(result.departmentReports[0].status).toBe('complete')
    expect(result.departmentReports[0].departmentQuality).toBeGreaterThan(0.7)

    expect(result.brainValidated).toBe(true)
    expect(result.overallQuality).toBeGreaterThan(0.75)
    expect(result.recommendation).toBe('ingest')
  })

  // TEST-E2E-CHAR-002: Character creation with dependencies
  // TEST-E2E-CHAR-003: Character with 360° reference generation
  // TEST-E2E-CHAR-004: Character with voice profile
  // TEST-E2E-CHAR-005: Low quality character rejected
  // TEST-E2E-CHAR-006: Character revision workflow
  // TEST-E2E-CHAR-007: Batch character creation (5 characters)
  // TEST-E2E-CHAR-008: Character with relationships
  // TEST-E2E-CHAR-009: Character deletion cascade
  // TEST-E2E-CHAR-010: Character update workflow
  // TEST-E2E-CHAR-011: Character export
  // TEST-E2E-CHAR-012: Character import
  // TEST-E2E-CHAR-013: Character version history
  // TEST-E2E-CHAR-014: Character conflict resolution
  // TEST-E2E-CHAR-015: Character validation caching
})
```

#### F2. Scene Creation Workflow (10 cases)

```typescript
// TEST-E2E-SCENE-001: Complete scene creation (Story + Visual + Image Quality)
describe('E2E Scene Creation Workflow', () => {
  it('should create scene with composite shots', async () => {
    // Given: Scene request with character and location
    const request = {
      userPrompt: "Create throne room scene with Sarah Chen character",
      projectId: "proj-123",
      context: {
        character: 'Sarah Chen',
        location: 'Throne Room'
      }
    }

    // When: Scene workflow executes
    const result = await executeWorkflow(request)

    // Then: Story, Visual, Image Quality departments complete
    expect(result.departmentReports).toHaveLength(3)
    expect(result.departmentReports.map(r => r.department))
      .toEqual(['story', 'visual', 'image-quality'])

    // Image Quality used character reference
    const imageQualityReport = result.departmentReports[2]
    expect(imageQualityReport.outputs[0].output.compositeShot).toBeDefined()
    expect(imageQualityReport.outputs[0].output.referencesUsed).toContain('Sarah Chen')
  })

  // TEST-E2E-SCENE-002: Scene with new location reference
  // TEST-E2E-SCENE-003: Scene with multiple characters
  // TEST-E2E-SCENE-004: Scene with action shots
  // TEST-E2E-SCENE-005: Scene timeline validation
  // TEST-E2E-SCENE-006: Scene batch creation (episode)
  // TEST-E2E-SCENE-007: Scene update workflow
  // TEST-E2E-SCENE-008: Scene deletion
  // TEST-E2E-SCENE-009: Scene export
  // TEST-E2E-SCENE-010: Scene consistency check
})
```

#### F3. 360° Reference Workflow (5 cases)

```typescript
// TEST-E2E-360-001: Generate 360° character reference
describe('E2E 360° Reference Generation', () => {
  it('should generate 12-image 360° profile for character', async () => {
    // Given: Character data
    const character = { name: 'Sarah Chen', appearance: '...' }

    // When: 360° profile requested
    const result = await generateProfile360(character)

    // Then: 12 images at 30° intervals
    expect(result.profile360.images).toHaveLength(12)
    expect(result.profile360.verified).toBe(true)
    expect(result.profile360.consistency).toBeGreaterThan(0.85)
  })

  // TEST-E2E-360-002: Generate 360° location reference
  // TEST-E2E-360-003: Generate 360° prop reference
  // TEST-E2E-360-004: Update 360° profile
  // TEST-E2E-360-005: Use 360° profile in composite
})
```

#### F4. Composite Shot Workflow (10 cases)

```typescript
// TEST-E2E-COMPOSITE-001: Create composite with existing references
// TEST-E2E-COMPOSITE-002: Generate missing reference first
// TEST-E2E-COMPOSITE-003: Multi-reference composite (character + location + props)
// TEST-E2E-COMPOSITE-004: Composite with specific angle
// TEST-E2E-COMPOSITE-005: Composite with action
// TEST-E2E-COMPOSITE-006: Composite consistency verification
// TEST-E2E-COMPOSITE-007: Composite quality grading
// TEST-E2E-COMPOSITE-008: Batch composite generation
// TEST-E2E-COMPOSITE-009: Composite with lighting adjustment
// TEST-E2E-COMPOSITE-010: Composite with effects
})
```

#### F5. Multi-Department Workflows (5 cases)

```typescript
// TEST-E2E-MULTI-001: Full production workflow (all 6 departments)
// TEST-E2E-MULTI-002: Episode creation workflow
// TEST-E2E-MULTI-003: Project initialization workflow
// TEST-E2E-MULTI-004: Asset generation workflow
// TEST-E2E-MULTI-005: Quality control workflow
```

### G. Performance & Scale Tests (25 cases)

#### G1. Concurrent Agent Tests (10 cases)

```typescript
// TEST-PERF-001: 50 concurrent specialist agents
describe('Performance - Concurrent Agents', () => {
  it('should handle 50 concurrent specialists without errors', async () => {
    // Given: 5 departments with 10 specialists each
    const departments = [
      { name: 'character', specialists: 8 },
      { name: 'story', specialists: 7 },
      { name: 'visual', specialists: 10 },
      { name: 'image-quality', specialists: 6 },
      { name: 'audio', specialists: 6 },
      { name: 'production', specialists: 5 }
    ]

    // When: All execute in parallel
    const startTime = Date.now()
    const results = await executeAllDepartments(departments)
    const duration = Date.now() - startTime

    // Then: All complete successfully
    expect(results.totalSpecialistsExecuted).toBe(42)
    expect(results.errors).toHaveLength(0)
    expect(duration).toBeLessThan(30000) // < 30 seconds
  })

  // TEST-PERF-002: Memory usage with 50 agents (< 2GB)
  // TEST-PERF-003: CPU usage optimization (< 80%)
  // TEST-PERF-004: Network bandwidth efficiency
  // TEST-PERF-005: Database connection pooling
  // TEST-PERF-006: Specialist spawn time (< 500ms)
  // TEST-PERF-007: Department coordination overhead
  // TEST-PERF-008: Grading performance (< 200ms per output)
  // TEST-PERF-009: Cross-department data transfer speed
  // TEST-PERF-010: Long-running stability (1 hour)
})
```

#### G2. Throughput Tests (10 cases)

```typescript
// TEST-PERF-011: Character creation throughput (10/min)
// TEST-PERF-012: Scene creation throughput (20/min)
// TEST-PERF-013: 360° profile throughput (5/min)
// TEST-PERF-014: Composite shot throughput (30/min)
// TEST-PERF-015: Department execution throughput
// TEST-PERF-016: Grading throughput (100/min)
// TEST-PERF-017: Specialist execution throughput
// TEST-PERF-018: Brain validation throughput
// TEST-PERF-019: Database write throughput
// TEST-PERF-020: Overall system throughput
```

#### G3. Latency Tests (5 cases)

```typescript
// TEST-PERF-021: Department routing latency (p50, p95, p99)
describe('Performance - Latency Benchmarks', () => {
  it('should route to departments with low latency', async () => {
    // Given: 1000 routing requests
    const latencies = []
    for (let i = 0; i < 1000; i++) {
      const start = performance.now()
      await orchestrator.routeToDepartments(sampleRequest)
      latencies.push(performance.now() - start)
    }

    // Calculate percentiles
    const p50 = percentile(latencies, 50)
    const p95 = percentile(latencies, 95)
    const p99 = percentile(latencies, 99)

    // Then: Low latency targets met
    expect(p50).toBeLessThan(50)   // < 50ms
    expect(p95).toBeLessThan(200)  // < 200ms
    expect(p99).toBeLessThan(500)  // < 500ms
  })

  // TEST-PERF-022: Specialist execution latency
  // TEST-PERF-023: Grading latency
  // TEST-PERF-024: Cross-department communication latency
  // TEST-PERF-025: End-to-end workflow latency
})
```

---

## Mock & Fixture Strategies

### Unit Test Mocking

#### CodebuffClient Mock

```typescript
// tests/fixtures/codebuff-mock.ts
import type { CodebuffClient } from '@codebuff/sdk'

export class MockCodebuffClient {
  private mockResponses: Map<string, any> = new Map()

  constructor() {
    // Pre-configure common responses
    this.mockResponses.set('hair-stylist-specialist', {
      output: {
        hairstyle: {
          style: 'Asymmetric undercut',
          color: 'Black with blue streaks',
          texture: 'Sleek and edgy'
        },
        confidence: 0.92,
        completeness: 0.95
      }
    })

    this.mockResponses.set('character-creator-specialist', {
      output: {
        personality: ['analytical', 'determined', 'street-smart'],
        backstory: 'Former corporate security, now independent detective',
        age: 32
      },
      confidence: 0.88,
      completeness: 0.85
    })
  }

  async run({ agent, prompt, customToolDefinitions }: any) {
    // Return pre-configured mock or default
    const mockResponse = this.mockResponses.get(agent)

    if (mockResponse) {
      return mockResponse
    }

    // Default mock response
    return {
      output: {
        task: prompt,
        result: 'Mock specialist output',
        confidence: 0.75,
        completeness: 0.80
      }
    }
  }

  // Helper to configure specific mock responses
  setMockResponse(agentId: string, response: any) {
    this.mockResponses.set(agentId, response)
  }
}
```

#### Department Runner Mock

```typescript
// tests/fixtures/department-runner-mock.ts
export async function mockRunSpecialistsParallel(
  specialists: Array<{ id: string; instructions: string }>,
  expectedOutputs?: Map<string, any>
): Promise<SpecialistOutput[]> {
  return specialists.map(s => ({
    agentId: s.id,
    task: s.instructions,
    output: expectedOutputs?.get(s.id) || {
      result: `Mock output for ${s.id}`
    },
    confidence: 0.85,
    completeness: 0.90
  }))
}

export async function mockGradeOutputsParallel(
  outputs: SpecialistOutput[]
): Promise<DepartmentGrading[]> {
  return outputs.map(o => ({
    specialistAgentId: o.agentId,
    output: o.output,
    qualityScore: 0.82,
    relevanceScore: 0.88,
    consistencyScore: 0.79,
    overallScore: 0.83,
    issues: [],
    suggestions: [],
    decision: 'accept' as const,
    reasoning: 'Mock grading passed quality thresholds'
  }))
}
```

### Integration Test Fixtures

#### Test Data Fixtures

```typescript
// tests/fixtures/test-data.ts
export const TEST_CHARACTERS = {
  high_quality_cyberpunk_detective: {
    name: "Sarah Chen",
    backstory: "Born into a middle-class family in Neo-Tokyo's manufacturing district, Sarah's path to detective work was forged through tragedy. At age 14, her younger brother disappeared into the city's underground augmentation black market. The corporate-controlled police showed no interest in a case involving a 'lowborn' family. Sarah taught herself hacking, forensics, and street combat over the next decade...",
    personality: ["analytical", "street-smart", "determined", "cynical-but-hopeful"],
    age: 32,
    occupation: "Independent Detective",
    appearance: {
      hair: "Black asymmetric undercut with neon blue streaks",
      clothing: "Black tactical jacket with smart fabric integration",
      height: "5'8\"",
      build: "Athletic and lean"
    }
  },

  medium_quality_character: {
    name: "Marcus Vale",
    backstory: "A former soldier turned mercenary in the wastelands.",
    personality: ["tough", "loyal"],
    age: 38
  },

  low_quality_character: {
    name: "Bob",
    backstory: "A person.",
    personality: []
  }
}

export const TEST_SCENES = {
  throne_room_scene: {
    name: "The Grand Throne Room",
    description: "Massive stone pillars support vaulted ceilings adorned with ancient tapestries depicting legendary battles. Sunlight streams through stained glass windows, casting colorful patterns across the polished marble floor...",
    location: "Thornwood Castle",
    characters: ["Sarah Chen"],
    timeOfDay: "Morning",
    mood: "Tense anticipation"
  }
}

export const TEST_DEPARTMENTS = {
  character_dept_routing: {
    department: 'character',
    relevance: 1.0,
    priority: 'high' as const,
    instructions: 'Create comprehensive character profile for Sarah Chen',
    dependencies: []
  },

  visual_dept_routing: {
    department: 'visual',
    relevance: 0.7,
    priority: 'medium' as const,
    instructions: 'Create visual concept for cyberpunk detective aesthetic',
    dependencies: ['character']
  }
}
```

#### Mock Specialist Outputs

```typescript
// tests/fixtures/specialist-outputs.ts
export const MOCK_SPECIALIST_OUTPUTS = {
  'hair-stylist': {
    agentId: 'hair-stylist-specialist',
    output: {
      hairstyle: {
        style: 'Asymmetric undercut with precision-cut edges',
        length: 'short' as const,
        color: 'Black with electric blue streaks (neon dye)',
        texture: 'Sleek on shaved sides, slightly tousled on top',
        maintenance: 'medium' as const,
        distinctiveFeatures: ['Geometric patterns shaved into undercut', 'Bio-luminescent blue streaks'],
        reasoning: 'Combines professional detective appearance with rebellious cyberpunk aesthetic'
      }
    },
    confidence: 0.92,
    completeness: 0.95
  },

  'costume-designer': {
    agentId: 'costume-designer-specialist',
    output: {
      outfit: {
        primary: 'Black tactical jacket',
        details: 'Smart fabric with integrated AR interface, hidden pockets',
        materials: ['Smart fabric', 'Reinforced carbon fiber panels'],
        functionality: 'Combat-ready, tech-integrated, weather-resistant',
        style: 'Cyberpunk tactical'
      }
    },
    confidence: 0.88,
    completeness: 0.90
  }
}
```

### Performance Test Utilities

```typescript
// tests/utils/performance.ts
export async function measureLatency(
  fn: () => Promise<any>,
  iterations: number = 1000
): Promise<{ p50: number; p95: number; p99: number; max: number }> {
  const latencies: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await fn()
    latencies.push(performance.now() - start)
  }

  latencies.sort((a, b) => a - b)

  return {
    p50: latencies[Math.floor(iterations * 0.50)],
    p95: latencies[Math.floor(iterations * 0.95)],
    p99: latencies[Math.floor(iterations * 0.99)],
    max: latencies[iterations - 1]
  }
}

export async function measureThroughput(
  fn: () => Promise<any>,
  durationMs: number = 60000
): Promise<{ throughput: number; errors: number }> {
  const startTime = Date.now()
  let completed = 0
  let errors = 0

  while (Date.now() - startTime < durationMs) {
    try {
      await fn()
      completed++
    } catch (error) {
      errors++
    }
  }

  const actualDuration = (Date.now() - startTime) / 1000
  return {
    throughput: completed / actualDuration,
    errors
  }
}
```

---

## Performance Benchmarks

### Latency Targets

| Operation | p50 | p95 | p99 | Max |
|-----------|-----|-----|-----|-----|
| Master Orchestrator routing | 50ms | 200ms | 500ms | 1s |
| Department relevance assessment | 100ms | 300ms | 600ms | 1s |
| Specialist agent execution | 1s | 3s | 5s | 10s |
| Department grading | 200ms | 500ms | 1s | 2s |
| Cross-department validation | 300ms | 800ms | 1.5s | 3s |
| 360° profile generation | 10s | 20s | 30s | 45s |
| Composite shot generation | 5s | 10s | 15s | 20s |
| E2E character workflow | 20s | 45s | 60s | 90s |
| E2E scene workflow | 15s | 30s | 45s | 60s |

### Throughput Targets

| Workflow | Throughput | Concurrency |
|----------|------------|-------------|
| Character creation | 10/min | 5 concurrent |
| Scene creation | 20/min | 10 concurrent |
| 360° profile generation | 5/min | 3 concurrent |
| Composite shots | 30/min | 15 concurrent |
| Department executions | 50/min | 25 concurrent |
| Specialist executions | 200/min | 100 concurrent |
| Grading operations | 300/min | 150 concurrent |

### Resource Limits

| Resource | Limit | Alert Threshold |
|----------|-------|-----------------|
| Total memory (50 agents) | 4GB | 3.2GB |
| Memory per agent | 100MB | 80MB |
| CPU usage (all departments) | 80% | 70% |
| Database connections | 50 | 40 |
| Network bandwidth | 200Mbps | 160Mbps |
| Disk I/O | 100MB/s | 80MB/s |

---

## Quality Metrics & Coverage Targets

### Code Coverage

#### Overall Targets
- **Line Coverage**: 88%+
- **Statement Coverage**: 88%+
- **Branch Coverage**: 85%+
- **Function Coverage**: 92%+

#### Component-Specific Targets

| Component | Line Coverage | Branch Coverage |
|-----------|---------------|-----------------|
| Master Orchestrator | 98% | 95% |
| Department Heads | 95% | 92% |
| Department Runner | 95% | 90% |
| Grading System | 98% | 95% |
| Specialist Agents | 90% | 85% |
| Cross-Dept Coordination | 95% | 92% |
| E2E Workflows | 92% | N/A |

### Test Quality Metrics

#### Reliability
- **Flaky Test Rate**: < 0.5%
- **Test Execution Time**: < 8 minutes (full suite)
- **Test Maintainability**: All tests documented

#### Defect Detection
- **Critical Bugs Caught**: 100%
- **High Priority Bugs**: 98%+
- **Regression Detection**: 100%

---

## Verification Criteria

### Phase 4 Completion Checklist

#### Must-Pass Criteria (Blocking)

**Master Orchestrator**
- [ ] **ORCH-001**: Request analysis identifies correct intent
- [ ] **ORCH-002**: Department routing with priorities works
- [ ] **ORCH-003**: Cross-department consistency validation passes
- [ ] **ORCH-004**: Brain integration functional
- [ ] **ORCH-005**: All 30 orchestrator tests pass

**Department Heads**
- [ ] **DEPT-001**: All 6 department heads operational
- [ ] **DEPT-002**: Relevance assessment accurate (± 0.1)
- [ ] **DEPT-003**: Specialist selection logic correct
- [ ] **DEPT-004**: Parallel specialist spawning works
- [ ] **DEPT-005**: Output grading functional
- [ ] **DEPT-006**: All 60 department tests pass (10 per dept)

**Specialist Agents**
- [ ] **SPEC-001**: 34+ specialists operational
- [ ] **SPEC-002**: Self-assessment accurate
- [ ] **SPEC-003**: Output format validation
- [ ] **SPEC-004**: All 70 specialist tests pass

**Grading System**
- [ ] **GRADE-001**: Quality scoring (0.0-1.0) accurate
- [ ] **GRADE-002**: Decision logic correct (accept/revise/discard)
- [ ] **GRADE-003**: Threshold enforcement (≥ 0.60 default)
- [ ] **GRADE-004**: All 35 grading tests pass

**Cross-Department Coordination**
- [ ] **COORD-001**: Sequential dependencies work
- [ ] **COORD-002**: Parallel execution optimized
- [ ] **COORD-003**: Data sharing functional
- [ ] **COORD-004**: All 40 coordination tests pass

**E2E Workflows**
- [ ] **E2E-001**: Character creation workflow (5 depts) < 60s
- [ ] **E2E-002**: Scene creation workflow functional
- [ ] **E2E-003**: 360° profile generation works
- [ ] **E2E-004**: Composite shot generation functional
- [ ] **E2E-005**: All 45 E2E tests pass

**Performance**
- [ ] **PERF-001**: 50 concurrent agents handle successfully
- [ ] **PERF-002**: Character workflow < 60s (p95)
- [ ] **PERF-003**: Memory usage < 4GB total
- [ ] **PERF-004**: All 25 performance tests pass

#### Overall Metrics (Blocking)

- [ ] **COV-001**: Overall code coverage ≥ 88%
- [ ] **COV-002**: Master Orchestrator coverage ≥ 98%
- [ ] **COV-003**: Department Heads coverage ≥ 95%
- [ ] **COV-004**: Grading System coverage ≥ 98%
- [ ] **RELIABILITY-001**: Flaky test rate < 0.5%
- [ ] **RELIABILITY-002**: Test suite execution < 8 minutes
- [ ] **REGRESSION-001**: All Phase 1-3 tests still pass

### Integration Milestones

- [ ] **MILESTONE-1**: All department heads spawn specialists successfully
- [ ] **MILESTONE-2**: Grading system accepts/rejects appropriately
- [ ] **MILESTONE-3**: Cross-department dependencies resolve correctly
- [ ] **MILESTONE-4**: Character creation via chat functional
- [ ] **MILESTONE-5**: Performance targets met under load

---

## Test Execution Strategy

### Test Organization

```
tests/
├── unit/
│   ├── orchestrator/
│   │   ├── request-analysis.test.ts
│   │   ├── department-routing.test.ts
│   │   └── cross-validation.test.ts
│   ├── departments/
│   │   ├── character-head.test.ts
│   │   ├── story-head.test.ts
│   │   ├── visual-head.test.ts
│   │   ├── image-quality-head.test.ts
│   │   ├── audio-head.test.ts
│   │   └── production-head.test.ts
│   ├── specialists/
│   │   ├── character/
│   │   │   ├── hair-stylist.test.ts
│   │   │   ├── costume-designer.test.ts
│   │   │   └── ... (8 specialists)
│   │   ├── story/
│   │   │   └── ... (7 specialists)
│   │   ├── visual/
│   │   │   └── ... (10 specialists)
│   │   ├── image-quality/
│   │   │   └── ... (6 specialists)
│   │   ├── audio/
│   │   │   └── ... (6 specialists)
│   │   └── production/
│   │       └── ... (5 specialists)
│   └── grading/
│       ├── quality-scoring.test.ts
│       ├── relevance-scoring.test.ts
│       └── decision-logic.test.ts
├── integration/
│   ├── cross-department/
│   │   ├── sequential-dependencies.test.ts
│   │   ├── parallel-execution.test.ts
│   │   └── data-sharing.test.ts
│   ├── department-workflows/
│   │   ├── character-workflow.test.ts
│   │   └── image-quality-workflow.test.ts
│   └── agent-coordination/
│       └── multi-agent-execution.test.ts
├── e2e/
│   ├── workflows/
│   │   ├── character-creation.e2e.test.ts
│   │   ├── scene-creation.e2e.test.ts
│   │   ├── 360-profile.e2e.test.ts
│   │   └── composite-shot.e2e.test.ts
│   └── performance/
│       ├── concurrent-agents.perf.test.ts
│       ├── throughput.perf.test.ts
│       └── latency.perf.test.ts
└── fixtures/
    ├── codebuff-mock.ts
    ├── department-runner-mock.ts
    ├── test-data.ts
    └── specialist-outputs.ts
```

### Test Execution Commands

```bash
# Run all Phase 4 tests
pnpm test:phase4

# Run unit tests only
pnpm test:unit:phase4

# Run integration tests
pnpm test:integration:phase4

# Run E2E tests
pnpm test:e2e:phase4

# Run performance tests
pnpm test:perf:phase4

# Run specific department tests
pnpm test tests/unit/departments/character-head.test.ts

# Run with coverage
pnpm test:phase4 --coverage

# Run in watch mode
pnpm test:phase4 --watch
```

### CI/CD Integration

```yaml
# .github/workflows/phase4-tests.yml
name: Phase 4 Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Run Unit Tests
        run: pnpm test:unit:phase4 --coverage

      - name: Run Integration Tests
        run: pnpm test:integration:phase4 --coverage

      - name: Run E2E Tests
        run: pnpm test:e2e:phase4

      - name: Run Performance Tests
        run: pnpm test:perf:phase4

      - name: Coverage Report
        run: |
          pnpm coverage:report
          pnpm coverage:check --lines 88 --branches 85

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
```

---

## Summary

This comprehensive Phase 4 test strategy provides:

1. **325+ test cases** covering all multi-department agent functionality
2. **Detailed test scenarios** for Master Orchestrator, 6 Department Heads, and 34+ Specialists
3. **Mock strategies** for isolated testing with CodebuffClient
4. **Performance benchmarks** with specific targets (< 60s character creation)
5. **Quality metrics** with 88%+ overall coverage, 98%+ for critical components
6. **Clear verification criteria** for Phase 4 completion
7. **Comprehensive E2E workflows** for character, scene, and reference generation

**Estimated Coverage Achievement**: 90% (exceeds 88% target)

**Critical Path Test Count**: 195 (60% of total)

**Ready for Implementation**: ✅

---

**Document Status**: Complete
**Next Steps**: Implement test suites incrementally, starting with Master Orchestrator unit tests, then Department Heads, then Specialists, then E2E workflows.
