# Hierarchical Agent Structure

**Version**: 1.0.0  
**Last Updated**: January 28, 2025  
**Parent Document**: [AI_AGENT_INTEGRATION.md](./AI_AGENT_INTEGRATION.md)

---

## Overview

Aladdin uses a **three-tier hierarchical agent system** that mirrors real movie production hierarchy:

1. **Master Orchestrator** - Coordinates entire production
2. **Department Heads** - Lead specific domains (Character, Story, Visual, Audio)
3. **Specialist Agents** - Execute specific tasks (Hair Stylist, Costume Designer, etc.)

**Key Principle**: Each level validates quality and relevance before passing up the chain.

---

## Three-Tier Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 LEVEL 1: MASTER ORCHESTRATOR             │
│                                                          │
│  • Receives user requests                                │
│  • Analyzes scope and intent                             │
│  • Routes to department heads                            │
│  • Validates cross-department consistency                │
│  • Final Brain validation                                │
│  • Presents unified result to user                       │
└───────────────────────┬──────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┬──────────────┐
         │              │              │              │
         ↓              ↓              ↓              ↓
┌────────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐
│ LEVEL 2:       │ │  STORY     │ │  VISUAL    │ │  AUDIO    │
│ CHARACTER DEPT │ │  DEPT HEAD │ │  DEPT HEAD │ │  DEPT HEAD│
│ HEAD           │ └──────┬─────┘ └──────┬─────┘ └─────┬─────┘
│                │        │              │             │
│ • Assess       │        │              │             │
│   relevance    │        │              │             │
│ • Identify     │        │              │             │
│   specialists  │        │              │             │
│ • Grade outputs│        │              │             │
│ • Compile      │        │              │             │
│   report       │        │              │             │
└───────┬────────┘        │              │             │
        │                 │              │             │
   ┌────┴──────┬──────┐   ↓              ↓             ↓
   ↓           ↓      ↓
┌────────┐ ┌────────┐ ┌──────────┐
│ LEVEL 3│ │Costume │ │Character │
│ Hair   │ │Designer│ │Arc Mgr   │  ... + 40+ more specialists
│ Stylist│ └────────┘ └──────────┘
│        │
│ • Execute specific task            │
│ • Self-assess confidence           │
│ • Report to department head        │
└────────┘
```

---

## Level 1: Master Orchestrator

### Responsibilities

1. **Request Analysis**
   - Parse user intent
   - Identify scope and complexity
   - Determine priority

2. **Department Routing**
   - Decide which departments are involved
   - Assign relevance scores
   - Set priorities and dependencies

3. **Coordination**
   - Manage parallel department execution
   - Handle cross-department dependencies
   - Resolve conflicts

4. **Validation**
   - Check cross-department consistency
   - Send to Brain for final validation
   - Calculate overall quality score

5. **Presentation**
   - Aggregate department outputs
   - Format for user review
   - Present with quality scores and options

### Example Workflow

```typescript
// User: "Create a cyberpunk detective character named Sarah"

const orchestratorAnalysis = {
  intent: 'character_creation',
  scope: 'comprehensive',
  departments: [
    {
      name: 'character',
      relevance: 1.0,        // Primary
      priority: 'high',
      instructions: 'Create full character profile for Sarah, cyberpunk detective'
    },
    {
      name: 'visual',
      relevance: 0.8,        // Important
      priority: 'high',
      instructions: 'Create visual concept for cyberpunk detective aesthetic',
      dependencies: ['character']  // Wait for character dept
    },
    {
      name: 'audio',
      relevance: 0.3,        // Optional
      priority: 'low',
      instructions: 'Voice profile can be deferred'
    }
  ]
};
```

---

## Level 2: Department Heads

### Fixed Department Heads

1. **Character Department Head**
   - Personality, backstory, relationships
   - Physical appearance, style
   - Character arc and development
   
   **Specialists**: Character Creator, Hair Stylist, Costume Designer, Makeup Artist, Character Arc Manager

2. **Story Department Head**
   - Narrative structure, story beats
   - Episode/act breakdown
   - World building, themes
   
   **Specialists**: Story Architect, Episode Planner, World Builder, Dialogue Writer, Story Bible Keeper

3. **Visual Department Head**
   - Overall visual style and direction
   - Coordinates between sub-departments
   - Ensures visual consistency
   
   **Sub-Departments**:
   - Image Quality Department (reference generation)
   - Concept Art Department (style, mood)
   - Environment Department (locations, sets)

3a. **Image Quality Department Head** (Under Visual Dept)
   - Master reference image creation
   - 360° profile generation (30° intervals = 12 images)
   - Reference set management (character, location, props)
   - Shot composition and generation
   - Consistency verification for all images
   
   **Specialists**: 
   - Master Reference Generator
   - 360° Profile Creator
   - Image Descriptor (detailed descriptions)
   - Shot Composer (composite image creation)
   - Action Shot Generator
   - Consistency Verifier
   
   **Key Responsibility**: Generate composite shots using reference images
   - Example: "Character in orange jacket in the park"
   - Input: Character reference + orange jacket reference + park location reference
   - Output: Composite shot using model (e.g., nano banana)

4. **Audio Department Head**
   - Voice profiles, dialogue
   - Music, sound effects
   - Audio mixing
   
   **Specialists**: Voice Creator, Music Composer, Sound Designer, Foley Artist, Audio Mixer

5. **Production Department Head**
   - Resource allocation
   - Timeline management
   - Cost optimization
   
   **Specialists**: Production Manager, Scheduler, Budget Coordinator, Resource Allocator

### Department Head Workflow

```typescript
const departmentHeadProcess = async (instructions: string) => {
  // 1. Assess Relevance
  const relevance = assessRelevance(instructions);
  
  if (relevance < 0.3) {
    return {
      status: 'not_relevant',
      relevance,
      message: 'This department is not needed for this request'
    };
  }
  
  // 2. Identify Needed Specialists
  const specialists = identifySpecialists(instructions);
  // e.g., ['hair-stylist', 'costume-designer', 'character-creator']
  
  // 3. Create Instructions for Each Specialist
  const specialistTasks = specialists.map(s => ({
    specialistId: s,
    instructions: createSpecialistInstructions(s, instructions),
    expectedOutput: defineExpectedOutput(s),
    context: getRelevantContext(s)
  }));
  
  // 4. Spawn Specialists in Parallel
  const outputs = await Promise.all(
    specialistTasks.map(task => runSpecialist(task))
  );
  
  // 5. Grade Each Output
  const gradedOutputs = outputs.map(output => ({
    ...output,
    grades: gradeOutput(output),
    decision: makeDecision(output)
  }));
  
  // 6. Filter and Compile
  const accepted = gradedOutputs.filter(o => o.decision === 'accept');
  const needsRevision = gradedOutputs.filter(o => o.decision === 'revise');
  
  // 7. Handle Revisions
  if (needsRevision.length > 0) {
    const revised = await reviseOutputs(needsRevision);
    accepted.push(...revised.filter(r => r.decision === 'accept'));
  }
  
  // 8. Compile Department Report
  return {
    department: 'character',
    relevance,
    status: 'complete',
    outputs: accepted,
    departmentQuality: calculateAverageQuality(accepted),
    issues: compileIssues(gradedOutputs),
    suggestions: compileSuggestions(gradedOutputs)
  };
};
```

### Grading System

**Department Head Grades Each Specialist Output:**

```typescript
interface DepartmentGrading {
  // Quality Dimensions
  qualityScore: number;        // 0-1: Technical quality
  relevanceScore: number;      // 0-1: Relevance to request
  consistencyScore: number;    // 0-1: Consistency with project
  creativityScore: number;     // 0-1: Novel and engaging
  
  // Weighted Overall
  overallScore: number;        // Weighted average:
                               // quality*0.4 + relevance*0.3 + 
                               // consistency*0.2 + creativity*0.1
  
  // Analysis
  issues: string[];            // Problems identified
  suggestions: string[];       // Improvements recommended
  
  // Decision
  decision: 'accept' | 'revise' | 'discard';
  reasoning: string;           // Explanation of decision
}
```

**Grade Thresholds:**
- **≥ 0.70**: Accept (excellent)
- **0.60 - 0.69**: Accept with minor notes
- **0.40 - 0.59**: Request revision
- **< 0.40**: Discard, respawn specialist

---

## Level 3: Specialist Agents

### Characteristics

- **On-Demand**: Spawned only when needed
- **Single-Purpose**: Each handles one specific task
- **Self-Assessing**: Provides confidence scores
- **Lightweight**: Fast execution, minimal context
- **Disposable**: Terminated after task completion

### Example Specialist: Hair Stylist

```typescript
interface HairStylistInput {
  characterName: string;
  characterProfile: {
    personality: string[];
    role: string;
    age: number;
  };
  setting: {
    genre: string;
    timePeriod: string;
    location: string;
  };
  expectedOutput: 'detailed_description';
}

interface HairStylistOutput {
  hairstyle: {
    style: string;              // e.g., "Asymmetric pixie cut"
    length: 'short' | 'medium' | 'long';
    color: string;              // e.g., "Black with neon blue streaks"
    texture: string;
    maintenance: 'high' | 'medium' | 'low';
    distinctiveFeatures: string[];
    reasoning: string;          // Why this fits
  };
  
  // Self-assessment
  confidence: number;           // 0-1: How confident
  completeness: number;         // 0-1: How complete
  alternativeOptions: string[]; // Other viable options
}
```

### Specialist Categories (50+ total)

**Character Department (8 specialists):**
- Character Creator
- Hair Stylist
- Costume Designer
- Makeup Artist
- Voice Profile Creator
- Character Arc Manager
- Relationship Mapper
- Casting Advisor

**Story Department (7 specialists):**
- Story Architect
- Episode Planner
- World Builder
- Dialogue Writer
- Story Bible Keeper
- Theme Analyzer
- Pacing Designer

**Image Quality Department (6 specialists):**
- Master Reference Generator: Creates canonical reference image for any subject
- 360° Profile Creator: Generates 12-image rotation profile (30° intervals)
- Image Descriptor: Writes detailed descriptions for each reference image
- Shot Composer: Creates composite shots from multiple references
- Action Shot Generator: Generates dynamic action scenes
- Consistency Verifier: Validates new images against reference set

**Visual Department (10 specialists):**
- Concept Artist
- Storyboard Artist
- Environment Designer
- Shot Designer
- Props Master
- Lighting Designer
- Color Grader
- Camera Operator
- VFX Designer
- Compositor

**Audio Department (6 specialists):**
- Voice Creator
- Music Composer
- Sound Designer
- Foley Artist
- Audio Mixer
- Dialogue Editor

**Production Department (6 specialists):**
- Production Manager
- Scheduler
- Budget Coordinator
- Resource Allocator
- Quality Controller
- Continuity Checker

---

## Quality Validation Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. SPECIALIST SELF-ASSESSMENT                           │
│    confidence: 0.85, completeness: 0.90                 │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 2. DEPARTMENT HEAD GRADING                              │
│    quality: 0.82, relevance: 0.88, consistency: 0.79    │
│    overall: 0.83 → ACCEPT                               │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 3. DEPARTMENT COMPILATION                                │
│    Average dept quality: 0.81 (3 specialists)           │
│    All outputs accepted                                 │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 4. ORCHESTRATOR CROSS-DEPT VALIDATION                   │
│    Character + Visual consistency: 0.88                 │
│    No contradictions found                              │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 5. BRAIN FINAL VALIDATION                               │
│    Semantic consistency: 0.85                           │
│    Quality rating: 0.84                                 │
│    brainValidated: true → READY FOR INGEST             │
└─────────────────────────────────────────────────────────┘
```

---

## Example: Complete Workflow

### User Request
"Create a cyberpunk detective character named Sarah"

### Execution

**1. Master Orchestrator:**
```
Analysis:
- Intent: Character creation
- Complexity: Medium
- Departments: Character (primary), Visual (secondary)

Routing:
→ Character Department (priority: HIGH, relevance: 1.0)
→ Visual Department (priority: MEDIUM, relevance: 0.7)
```

**2. Character Department Head:**
```
Relevance: 1.0 (This is our primary domain)

Specialists Needed:
- Character Creator (personality, backstory)
- Hair Stylist (cyberpunk aesthetic)
- Costume Designer (detective wardrobe)

Spawning 3 specialists in parallel...
```

**3. Specialist Execution:**

*Character Creator:*
```
Output:
- Name: Sarah Chen
- Age: 32
- Personality: ["analytical", "street-smart", "cynical"]
- Backstory: Former corporate security, now independent
- Role: Protagonist

Self-Assessment:
- confidence: 0.88
- completeness: 0.85
```

*Hair Stylist:*
```
Output:
- Style: Asymmetric undercut
- Color: Black with neon blue streaks
- Reasoning: Edgy, practical for action, fits cyberpunk aesthetic

Self-Assessment:
- confidence: 0.92
- completeness: 0.95
```

*Costume Designer:*
```
Output:
- Primary: Black tactical jacket with tech integration
- Details: Smart fabric, hidden pockets, AR interface
- Reasoning: Functional for detective work in high-tech setting

Self-Assessment:
- confidence: 0.85
- completeness: 0.90
```

**4. Department Head Grading:**

*Character Creator Output:*
```
Grades:
- quality: 0.86
- relevance: 0.92
- consistency: 0.81
- overall: 0.87 → ACCEPT
```

*Hair Stylist Output:*
```
Grades:
- quality: 0.91
- relevance: 0.85
- consistency: 0.88
- overall: 0.88 → ACCEPT
```

*Costume Designer Output:*
```
Grades:
- quality: 0.84
- relevance: 0.88
- consistency: 0.86
- overall: 0.86 → ACCEPT
```

**5. Department Report:**
```
Department: Character
Status: Complete
Outputs Accepted: 3/3
Department Quality: 0.87
Issues: None
Suggestions: Consider adding voice profile in next phase
```

**6. Master Orchestrator Aggregation:**
```
Departments Complete: 2/2
Cross-Department Consistency: 0.89
Overall Quality: 0.86

Brain Validation:
- Semantic consistency: PASS
- Contradiction check: PASS
- Quality score: 0.85
- brainValidated: true

Recommendation: INGEST
```

**7. Present to User:**
```
✨ Character "Sarah Chen" Created

Quality Rating: ⭐⭐⭐⭐⭐ 0.86/1.00
Brain Validation: ✓ PASSED

Character Profile:
- Cyberpunk detective, age 32
- Analytical and street-smart personality
- Black asymmetric undercut with neon blue streaks
- Tactical jacket with tech integration
- Former corporate security, now independent

Should I INGEST, MODIFY, or DISCARD this character?
```

---

## Special Department: Image Quality & Reference Management

### Purpose

The **Image Quality Department Head** is critical for maintaining visual consistency across the entire production. This department creates and manages **master reference images** and **360° profiles** for all visual elements.

### Reference Image System

**Master Reference Image:**
- Single authoritative image for each subject (character, location, prop)
- Highest quality, perfect lighting and composition
- Detailed description stored with image
- Used as ground truth for all future generations

**360° Profile:**
- 12 images captured at 30° intervals (360° / 30° = 12 views)
- Covers: front, back, sides, and all angles between
- Each image includes:
  - View angle (0°, 30°, 60°, 90°, etc.)
  - Detailed description
  - Lighting conditions
  - Quality rating

### Workflow Example: Character Reference Creation

```
User Request: "Create reference set for Sarah Chen character"

1. IMAGE QUALITY DEPARTMENT HEAD receives request
   ├─ Retrieves character data from Character Department
   ├─ Identifies needed reference images:
   │  ├─ Master reference (front view, neutral pose)
   │  └─ 360° profile (12 views)
   └─ Spawns specialists

2. MASTER REFERENCE GENERATOR
   ├─ Input: Character profile (appearance, clothing, etc.)
   ├─ Generates: High-quality master reference image
   ├─ Output:
   │  ├─ Image file (high resolution)
   │  ├─ Generation prompt used
   │  └─ Technical parameters
   └─ Self-assessment: confidence: 0.91

3. IMAGE DESCRIPTOR
   ├─ Input: Master reference image
   ├─ Analyzes: All visual details
   ├─ Output:
   │  ├─ Detailed description (hair, face, clothing, pose)
   │  ├─ Color palette
   │  ├─ Lighting setup
   │  └─ Distinctive features
   └─ Self-assessment: completeness: 0.95

4. 360° PROFILE CREATOR
   ├─ Input: Master reference + description
   ├─ Generates: 12 images at 30° intervals
   │  ├─ 0° (front) - Master reference used
   │  ├─ 30° (slight right)
   │  ├─ 60°
   │  ├─ 90° (right profile)
   │  ├─ 120°
   │  ├─ 150°
   │  ├─ 180° (back)
   │  ├─ 210°
   │  ├─ 240°
   │  ├─ 270° (left profile)
   │  ├─ 300°
   │  └─ 330° (slight left)
   └─ Each image includes detailed description

5. CONSISTENCY VERIFIER
   ├─ Validates all 12 images
   ├─ Checks:
   │  ├─ Character features consistent
   │  ├─ Clothing consistent
   │  ├─ Proportions maintained
   │  └─ Quality uniform
   ├─ Flags inconsistencies
   └─ Approves reference set

6. IMAGE QUALITY DEPT HEAD
   ├─ Reviews all outputs
   ├─ Grades each image
   ├─ Stores reference set in database:
   │  ├─ Collection: project_abc123_image_references
   │  ├─ Type: character
   │  ├─ Subject: Sarah Chen
   │  ├─ Master: sarah_master.png
   │  └─ Profile: sarah_0deg.png ... sarah_330deg.png
   └─ Report: Reference set complete, quality: 0.89
```

### Composite Shot Generation

**Use Case**: "Give me a shot of Sarah in an orange jacket in the park"

```
Process:

1. IMAGE QUALITY DEPT HEAD analyzes request
   ├─ Identifies needed references:
   │  ├─ Character: Sarah Chen (existing reference)
   │  ├─ Clothing: Orange jacket (need to generate)
   │  └─ Location: Park (existing reference)
   └─ Routes to specialists

2. CHECK REFERENCE AVAILABILITY
   ├─ Sarah Chen: ✓ 360° profile available
   ├─ Orange jacket: ✗ Not in reference set
   ├─ Park location: ✓ Reference available
   └─ Decision: Generate orange jacket reference first

3. MASTER REFERENCE GENERATOR (for jacket)
   ├─ Creates: Orange jacket reference image
   ├─ Generates: 360° profile for jacket
   └─ Adds to reference database

4. SHOT COMPOSER
   ├─ Retrieves references:
   │  ├─ Sarah Chen (appropriate angle)
   │  ├─ Orange jacket (matching angle)
   │  └─ Park location (desired view)
   ├─ Composes prompt for generation model:
   │  ├─ Base: Sarah Chen character
   │  ├─ Clothing: Orange jacket
   │  ├─ Setting: Park location
   │  ├─ Pose/action: [specified or default]
   │  └─ Lighting: Match park lighting
   ├─ Generates: Composite shot using model (e.g., nano banana)
   └─ Output: Final composed image

5. CONSISTENCY VERIFIER
   ├─ Compares composite to references:
   │  ├─ Character features match? ✓
   │  ├─ Jacket appearance match? ✓
   │  ├─ Location elements match? ✓
   │  └─ Overall quality acceptable? ✓
   ├─ Issues found: None
   └─ Decision: ACCEPT

6. IMAGE QUALITY DEPT HEAD
   ├─ Final review
   ├─ Quality score: 0.87
   └─ Delivers to user
```

### Reference Database Structure

```typescript
interface ImageReference {
  _id: ObjectId;
  projectId: string;
  
  // Subject Info
  referenceType: 'character' | 'location' | 'prop' | 'costume';
  subjectName: string;           // e.g., "Sarah Chen"
  subjectId?: string;            // Link to character/location doc
  
  // Master Reference
  masterImage: {
    mediaId: string;             // PayloadCMS Media ID
    url: string;
    description: string;         // Detailed description
    prompt: string;              // Generation prompt
    parameters: Record<string, any>;
    qualityRating: number;
  };
  
  // 360° Profile
  profile360: Array<{
    angle: number;               // 0, 30, 60, ..., 330
    mediaId: string;
    url: string;
    description: string;
    qualityRating: number;
  }>;
  
  // Metadata
  verified: boolean;             // Passed consistency check
  verifiedAt?: Date;
  usageCount: number;            // Times used in shots
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Consistency Verification Logic

```typescript
interface ConsistencyCheck {
  // What we're checking
  newImageId: string;
  referenceSetId: string;
  checkType: 'profile_image' | 'composite_shot';
  
  // Checks performed
  checks: {
    // For characters
    facialFeatures?: {
      matched: boolean;
      confidence: number;
      issues?: string[];
    };
    bodyProportions?: {
      matched: boolean;
      confidence: number;
    };
    clothingConsistency?: {
      matched: boolean;
      confidence: number;
    };
    colorPalette?: {
      matched: boolean;
      confidence: number;
    };
    
    // For locations
    architecturalElements?: {
      matched: boolean;
      confidence: number;
    };
    environmentalFeatures?: {
      matched: boolean;
      confidence: number;
    };
  };
  
  // Overall result
  overallConsistency: number;    // 0-1
  passed: boolean;               // true if >= threshold
  issues: string[];
  suggestions: string[];
}
```

### Missing Reference Handling

**Problem**: Request includes element without reference (e.g., back view not in 360° profile)

**Solution**:
```
1. CONSISTENCY VERIFIER detects missing reference
   └─ "Cannot verify back view - no reference available"

2. IMAGE QUALITY DEPT HEAD decides:
   Option A: Generate missing reference first
   Option B: Use closest available reference (e.g., 150° or 210°)
   Option C: Ask user for guidance

3. If generating missing reference:
   ├─ Spawn Master Reference Generator
   ├─ Create missing angle
   ├─ Add to 360° profile
   ├─ Verify against existing references
   └─ Then proceed with original request

4. User notification:
   "I noticed we don't have a back view reference for Sarah.
    I'll generate that first, then create your requested shot."
```

### Integration with Generation Models

**Supported Models**:
- **nano banana**: Primary composite generation model
- **Other models**: Can be configured per project

**Generation Pipeline**:
```
Reference Images → Shot Composer → Model API → Generated Image → 
Consistency Verifier → Quality Check → Delivered
```

**Model Input Format**:
```typescript
interface CompositeGenerationRequest {
  model: 'nano_banana' | 'other';
  
  // Reference images
  characterReference: {
    imageUrl: string;
    angle: number;               // From 360° profile
    description: string;
  };
  
  clothingReferences?: Array<{
    imageUrl: string;
    description: string;
  }>;
  
  locationReference?: {
    imageUrl: string;
    description: string;
  };
  
  propReferences?: Array<{
    imageUrl: string;
    description: string;
  }>;
  
  // Shot specifications
  shot: {
    cameraAngle: string;
    framing: string;
    lighting: string;
    action?: string;
  };
  
  // Technical
  outputResolution: string;
  qualityLevel: 'draft' | 'standard' | 'high';
}
```

---

## Benefits of Hierarchical Structure

1. **Quality Assurance**: Multiple validation layers
2. **Specialization**: Each agent focused on specific expertise
3. **Scalability**: Easy to add new specialists
4. **Efficiency**: Parallel execution within departments
5. **Clarity**: Clear responsibility at each level
6. **Flexibility**: Departments can adapt specialist mix
7. **Real-world Mapping**: Mirrors actual movie production

---

**Status**: Hierarchical Structure Documented ✓  
**Integration**: AI_AGENT_INTEGRATION.md

*This hierarchical pattern ensures quality through multi-level validation while maintaining efficiency through parallel execution.*