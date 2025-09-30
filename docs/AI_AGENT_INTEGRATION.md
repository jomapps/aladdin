# Aladdin - AI Agent Integration

**Version**: 0.1.0  
**Last Updated**: January 28, 2025  
**Parent Document**: [SPECIFICATION.md](./SPECIFICATION.md)

---

## Overview

Aladdin uses **@codebuff/sdk** to orchestrate 50+ specialized AI agents for movie production. Each agent is a custom-configured LLM with specific prompts, tools, and workflows.

**Key Integration Points:**
- Chat interface drives agent spawning
- Agents interact with PayloadCMS and Open MongoDB
- All agent outputs validated by Brain (Neo4j)
- Quality gates ensure only qualified information persists

---

## 1. @codebuff/sdk Architecture

### 1.1 Core Components

```typescript
import { CodebuffClient, getCustomToolDefinition } from '@codebuff/sdk';

// Initialize client
const codebuff = new CodebuffClient({
  apiKey: process.env.CODEBUFF_API_KEY
});

// Run an agent
const result = await codebuff.run({
  agent: 'character-creator',
  prompt: 'Create a cyberpunk detective character',
  projectFiles: projectContext,
  customToolDefinitions: [tools],
  handleEvent: (event) => {
    // Stream events to chat UI
    sendToChat(event);
  }
});
```

### 1.2 Hierarchical Agent Structure

Aladdin uses a **three-tier hierarchical agent system** mimicking real movie production:

```
┌─────────────────────────────────────────────────┐
│         MASTER ORCHESTRATOR                     │
│   (Decides which departments are involved)      │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴───────────┬─────────────┬────────────┐
        ↓                      ↓             ↓            ↓
┌───────────────┐  ┌───────────────┐  ┌──────────┐  ┌──────────┐
│ CHARACTER     │  │ STORY         │  │ VISUAL   │  │ AUDIO    │
│ DEPARTMENT    │  │ DEPARTMENT    │  │ DEPT     │  │ DEPT     │
│ HEAD          │  │ HEAD          │  │ HEAD     │  │ HEAD     │
└───────┬───────┘  └───────┬───────┘  └────┬─────┘  └────┬─────┘
        │                  │                │             │
   ┌────┴────┐        ┌────┴────┐      ┌───┴────┐    ┌───┴────┐
   ↓         ↓        ↓         ↓      ↓        ↓    ↓        ↓
┌──────┐ ┌───────┐ ┌──────┐ ┌──────┐ ┌─────┐ ┌────┐ ┌────┐ ┌────┐
│Hair  │ │Costume│ │Story │ │World │ │Image│ │Shot│ │Voice│ │SFX │
│Style │ │Design │ │Arc   │ │Build │ │Gen  │ │Plan│ │Gen  │ │    │
└──────┘ └───────┘ └──────┘ └──────┘ └─────┘ └────┘ └────┘ └────┘
  SPECIALIST AGENTS (50+)
```

**Three Agent Levels:**

**1. Master Orchestrator (Fixed Agent)**
- Receives user requests from chat
- Analyzes which departments are needed
- Distributes work to department heads
- Coordinates cross-department workflows
- Aggregates final results

**2. Department Heads (Fixed Agents - 5-7 total)**
- Character Department Head
- Story Department Head
- Visual Department Head
- Audio Department Head
- Production Department Head
- Post-Production Department Head
- Quality Assurance Head

**3. Specialist Agents (On-Demand - 50+)**
- Spawned by department heads as needed
- Execute specific tasks (e.g., hair styling, costume design)
- Report back to their department head
- Can be single-purpose or reusable

### 1.3 Agent Types by Category

**Fixed Agents (Always Running):**
- Master Orchestrator
- 5-7 Department Heads
- Quality Controller
- Brain Interface Agent

**On-Demand Agents (Spawned as Needed):**
- All specialist agents (50+)
- Created and managed by department heads
- Can run in parallel
- Terminated after task completion

---

## 2. Hierarchical Agent Pattern

### 2.1 Request Flow Example

**User Request:** "Create a cyberpunk detective character named Sarah"

```
1. MASTER ORCHESTRATOR receives request
   ├─ Analyzes: Character creation needed
   ├─ Identifies departments: Character, Visual, Audio
   └─ Distributes to department heads

2. CHARACTER DEPARTMENT HEAD
   ├─ Determines relevance: HIGH (primary department)
   ├─ Identifies needed specialists:
   │  ├─ Character Creator (personality, backstory)
   │  ├─ Hair Stylist (hairstyle for cyberpunk detective)
   │  └─ Wardrobe Designer (clothing style)
   ├─ Spawns agents with instructions:
   │  ├─ "Create personality profile for Sarah, a cyberpunk detective"
   │  ├─ "Design hairstyle for female cyberpunk detective in 2099"
   │  └─ "Design outfit for street-smart detective in Neo Tokyo"
   ├─ Receives agent outputs
   ├─ Grades each for quality & relevance (0-1 score)
   └─ Compiles department report

3. VISUAL DEPARTMENT HEAD
   ├─ Determines relevance: MEDIUM (visual reference needed)
   ├─ Identifies needed specialists:
   │  └─ Concept Artist (character visual concept)
   ├─ Spawns agent: "Create visual concept for Sarah based on profile"
   ├─ Grades output
   └─ Compiles department report

4. AUDIO DEPARTMENT HEAD
   ├─ Determines relevance: LOW (not immediately needed)
   └─ Defers to later stage

5. MASTER ORCHESTRATOR
   ├─ Receives department reports
   ├─ Validates with Brain (consistency check)
   ├─ Aggregates into cohesive character profile
   └─ Presents to user: "INGEST, MODIFY, or DISCARD?"
```

### 2.2 Quality Grading at Each Level

**Specialist Agent Output → Department Head:**
```typescript
interface SpecialistOutput {
  agentId: string;
  task: string;
  output: any;
  
  // Self-assessment
  confidence: number;        // 0-1: How confident agent is
  completeness: number;      // 0-1: How complete the output is
}
```

**Department Head Grading:**
```typescript
interface DepartmentGrading {
  specialistAgentId: string;
  output: any;
  
  // Department head grades
  qualityScore: number;      // 0-1: Technical quality
  relevanceScore: number;    // 0-1: Relevance to request
  consistencyScore: number;  // 0-1: Consistency with project
  
  overallScore: number;      // Weighted average
  
  issues: string[];          // Problems found
  suggestions: string[];     // Improvements
  
  decision: 'accept' | 'revise' | 'discard';
}
```

**Master Orchestrator Aggregation:**
```typescript
interface OrchestratorResult {
  departmentReports: DepartmentReport[];
  
  // Cross-department validation
  consistency: number;       // 0-1: Cross-dept consistency
  completeness: number;      // 0-1: All needed info present
  
  // Brain validation
  brainValidated: boolean;
  brainQualityScore: number;
  
  // Final decision
  overallQuality: number;    // 0-1: Final quality rating
  recommendation: 'ingest' | 'modify' | 'discard';
}
```

## 3. Custom Agent Definitions

### 3.1 Master Orchestrator Definition

```typescript
interface AladdinAgentDefinition {
  id: string;                    // e.g., 'character-creator'
  model: string;                 // e.g., 'openai/gpt-5'
  displayName: string;           // Human-readable name
  category: string;              // e.g., 'pre-production'
  
  instructionsPrompt: string;    // System prompt
  
  tools: string[];               // Built-in tool names
  customTools?: CustomTool[];    // Custom tool definitions
  
  // Aladdin-specific
  accessLevel: 'read' | 'write' | 'admin';
  requiresBrainValidation: boolean;
  qualityThreshold: number;      // 0-1
}
```

```typescript
const masterOrchestratorAgent: AladdinAgentDefinition = {
  id: 'master-orchestrator',
  model: 'openai/gpt-5',
  displayName: 'Master Orchestrator',
  category: 'orchestration',
  agentLevel: 'master',
  
  instructionsPrompt: `
You are the Master Orchestrator for Aladdin movie production.

Your role:
1. Analyze user requests from chat
2. Determine which departments are involved
3. Route requests to appropriate department heads
4. Coordinate cross-department workflows
5. Aggregate and validate final results
6. Present unified output to user

Process:
1. Analyze user request intent and scope
2. Identify relevant departments (Character, Story, Visual, Audio, etc.)
3. For each department:
   - Send specific instructions
   - Specify expected output format
   - Set priority and dependencies
4. Wait for department reports
5. Validate cross-department consistency
6. Send to Brain for final validation
7. Present to user with quality scores

IMPORTANT:
- You coordinate but don't execute tasks yourself
- Each department head grades their specialist outputs
- You validate cross-department consistency
- Final Brain validation before user presentation
  `,
  
  tools: ['read_files'],
  customTools: [
    'route_to_department',
    'aggregate_reports',
    'validate_consistency',
    'query_brain',
    'present_to_user'
  ],
  
  accessLevel: 'admin',
  requiresBrainValidation: true,
  qualityThreshold: 0.75
};
```

### 3.2 Department Head Definition (Example: Character Department)

```typescript
const characterDepartmentHead: AladdinAgentDefinition = {
  id: 'character-department-head',
  model: 'openai/gpt-5',
  displayName: 'Character Department Head',
  category: 'department-head',
  agentLevel: 'department',
  department: 'character',
  
  instructionsPrompt: `
You are the Character Department Head in movie production.

Your role:
1. Receive requests from Master Orchestrator
2. Assess relevance to character department (0-1 score)
3. If relevant, identify needed specialist agents
4. Spawn specialists with clear instructions
5. Grade each specialist's output for quality & relevance
6. Compile department report for orchestrator

Specialist Agents Under You:
- Character Creator: Core personality, backstory, arc
- Hair Stylist: Hairstyle design
- Costume Designer: Wardrobe and clothing
- Makeup Artist: Makeup and special effects makeup
- Voice Profile Creator: Voice characteristics
- Character Arc Manager: Development tracking

Grading Criteria:
1. Quality Score (0-1): Technical quality of output
2. Relevance Score (0-1): How relevant to request
3. Consistency Score (0-1): Fits with existing content
4. Overall Score: Weighted average

IMPORTANT:
- Grade each specialist output before accepting
- Request revisions if quality < 0.60
- Only send accepted outputs to orchestrator
- Include your grading rationale in report
  `,
  
  tools: ['read_files'],
  customTools: [
    'assess_relevance',
    'spawn_specialist',
    'grade_output',
    'compile_report',
    'get_department_context'
  ],
  
  accessLevel: 'write',
  requiresBrainValidation: false,  // Orchestrator handles this
  qualityThreshold: 0.60
};
```

### 3.3 Department Head Definition (Example: Image Quality)

```typescript
const imageQualityDepartmentHead: AladdinAgentDefinition = {
  id: 'image-quality-department-head',
  model: 'openai/gpt-5',
  displayName: 'Image Quality Department Head',
  category: 'department-head',
  agentLevel: 'department',
  department: 'image-quality',
  parentDepartment: 'visual',
  
  instructionsPrompt: `
You are the Image Quality Department Head, responsible for creating and managing all reference images.

Your role:
1. Create master reference images for all subjects (characters, locations, props)
2. Generate 360° profiles (12 images at 30° intervals)
3. Write detailed descriptions for each reference image
4. Compose shots using reference images
5. Verify consistency of all generated images
6. Manage reference database

Reference Creation Process:
1. Receive subject (character, location, prop)
2. Generate master reference image (highest quality)
3. Create 360° profile (12 views: 0°, 30°, 60°, ..., 330°)
4. Generate detailed descriptions for each
5. Verify consistency across all views
6. Store in reference database

Composite Shot Generation:
1. Receive shot request (e.g., "character in jacket at location")
2. Check reference availability for all elements
3. Generate missing references if needed
4. Compose shot using references + model (e.g., nano banana)
5. Verify composite against references
6. Deliver if consistent

Consistency Verification:
- Compare new images to reference set
- Check: facial features, proportions, clothing, colors
- Flag inconsistencies
- Request regeneration if quality < threshold
- CRITICAL: Cannot verify views without references (e.g., no back shot = cannot verify back)

IMPORTANT:
- Always maintain reference set completeness
- Generate missing references before composite shots
- Grade all outputs for quality and consistency
- Use detailed descriptions for accurate generation
  `,
  
  tools: ['read_files'],
  customTools: [
    'generate_master_reference',
    'generate_360_profile',
    'describe_image',
    'compose_shot',
    'verify_consistency',
    'check_reference_availability',
    'get_reference_set'
  ],
  
  accessLevel: 'write',
  requiresBrainValidation: false,
  qualityThreshold: 0.75
};
```

### 3.4 Specialist Agent Definition (Example: Hair Stylist)

```typescript
const hairStylistAgent: AladdinAgentDefinition = {
  id: 'hair-stylist-specialist',
  model: 'openai/gpt-5',
  displayName: 'Hair Stylist',
  category: 'specialist',
  agentLevel: 'specialist',
  department: 'character',
  
  instructionsPrompt: `
You are a professional hair stylist for movie character design.

Your role:
1. Receive character context from department head
2. Design hairstyle that fits:
   - Character personality and role
   - Story setting and time period
   - Genre conventions
   - Practical production considerations
3. Provide detailed hairstyle description
4. Self-assess your output confidence

Output format:
{
  hairstyle: {
    style: "Short description",
    length: "long/medium/short",
    color: "Natural or dyed color",
    texture: "straight/wavy/curly",
    maintenance: "High/medium/low",
    distinctiveFeatures: ["Notable aspects"],
    reasoning: "Why this fits the character"
  },
  confidence: 0.85,  // Self-assessment
  completeness: 0.90
}

IMPORTANT:
- Focus only on hairstyle, not other aspects
- Consider character's lifestyle and personality
- Provide production-practical designs
- Be specific and detailed
  `,
  
  tools: [],
  customTools: [
    'get_character_context',
    'search_hairstyle_references'
  ],
  
  accessLevel: 'read',
  requiresBrainValidation: false,  // Department head validates
  qualityThreshold: 0.50  // Lower threshold, dept head filters
};
```

### 2.3 Example: Story Architect Agent

```typescript
const storyArchitectAgent: AladdinAgentDefinition = {
  id: 'story-architect',
  model: 'openai/gpt-5',
  displayName: 'Story Architect',
  category: 'pre-production',
  
  instructionsPrompt: `
You are a master story architect specializing in narrative structure.

Your role:
1. Design overarching narrative arcs
2. Structure episodes and acts
3. Define story beats and pacing
4. Ensure thematic consistency
5. Create compelling dramatic tension

Process:
1. Understand project type (movie vs series)
2. Identify genre conventions and audience expectations
3. Structure story using proven frameworks (Three-Act, Hero's Journey, etc.)
4. Define key story beats and turning points
5. Ensure each scene/episode serves the overall arc

IMPORTANT:
- Query Brain to ensure consistency with existing content
- Use save_story_structure tool to persist your work
- Present structure with quality rating
- Ask user to INGEST, MODIFY, or DISCARD
  `,
  
  tools: ['read_files'],
  customTools: [
    'save_story_structure',
    'query_brain',
    'get_existing_characters',
    'get_project_context'
  ],
  
  accessLevel: 'write',
  requiresBrainValidation: true,
  qualityThreshold: 0.75
};
```

---

## 3. Custom Tools Implementation

### 3.1 Tool Definition Pattern

```typescript
import { getCustomToolDefinition } from '@codebuff/sdk';
import { z } from 'zod/v4';

// Example: Save Character Tool
const saveCharacterTool = getCustomToolDefinition({
  toolName: 'save_character',
  description: 'Save a character to the project database and validate with Brain',
  
  inputSchema: z.object({
    projectId: z.string(),
    name: z.string(),
    content: z.object({
      fullName: z.string().optional(),
      role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']).optional(),
      personality: z.object({
        traits: z.array(z.string()).optional(),
        motivations: z.array(z.string()).optional()
      }).optional(),
      backstory: z.string().optional(),
      appearance: z.object({
        description: z.string().optional()
      }).optional()
    })
  }),
  
  execute: async ({ projectId, name, content }) => {
    // 1. Initial quality check
    const initialCheck = await validateInitialQuality({ name, content });
    
    if (!initialCheck.passes) {
      return [{
        type: 'text',
        value: `Quality check failed: ${initialCheck.issues.join(', ')}\n\nPlease provide more information.`
      }];
    }
    
    // 2. Send to Brain for validation
    const brainValidation = await brain.validate({
      projectId,
      type: 'character',
      data: { name, content }
    });
    
    // 3. Check quality threshold
    if (brainValidation.qualityRating < 0.60) {
      return [{
        type: 'text',
        value: `Quality rating: ${brainValidation.qualityRating.toFixed(2)}\n\nIssues:\n${brainValidation.contradictions.map(c => `- ${c.explanation}`).join('\n')}\n\nSuggestions:\n${brainValidation.suggestions.join('\n')}`
      }];
    }
    
    // 4. Save to Open MongoDB
    const openDb = await getOpenDatabase(projectId);
    const characterId = await openDb.collection('characters').insertOne({
      name,
      projectId,
      content,
      qualityRating: brainValidation.qualityRating,
      brainValidated: true,
      validatedAt: new Date(),
      createdBy: 'character-creator',
      createdByType: 'agent'
    });
    
    // 5. Add to Brain
    await brain.addNode({
      projectId,
      type: 'character',
      id: characterId.insertedId.toString(),
      name,
      embedding: brainValidation.embedding,
      qualityRating: brainValidation.qualityRating
    });
    
    // 6. Return success
    return [{
      type: 'text',
      value: `✓ Character "${name}" saved successfully!\n\nQuality Rating: ${brainValidation.qualityRating.toFixed(2)}/1.00\nBrain Validation: PASSED\n\nReady for next step.`
    }];
  }
});
```

### 3.2 Core Custom Tools

**Project Management Tools:**
```typescript
- get_project_context: Read project metadata from PayloadCMS
- get_project_settings: Read project settings and thresholds
- list_projects: List all accessible projects
```

**Data Access Tools:**
```typescript
- get_characters: Query characters from open database
- get_scenes: Query scenes
- get_locations: Query locations
- search_content: Full-text search across collections
```

**Brain Interaction Tools:**
```typescript
- query_brain: Semantic search in Brain
- validate_content: Validate new content against Brain
- check_consistency: Check for contradictions
- find_related: Find related content
```

**Content Creation Tools:**
```typescript
- save_character: Save character to database
- save_scene: Save scene
- save_location: Save location
- save_dialogue: Save dialogue
- generate_image: Trigger image generation
- generate_video: Trigger video generation
```

**Collaboration Tools:**
```typescript
- send_to_chat: Send message to chat interface
- request_user_input: Ask user a question
- present_options: Show multiple options to user
```

---

## 4. Hierarchical Orchestration Implementation

### 4.1 Complete Workflow Implementation

```typescript
// Master Orchestrator receives user request
const handleUserRequest = async (userPrompt: string, projectId: string) => {
  // 1. Master Orchestrator analyzes request
  const orchestrator = await codebuff.run({
    agent: 'master-orchestrator',
    prompt: userPrompt,
    customToolDefinitions: [
      routeToDepartmentTool,
      validateConsistencyTool,
      queryBrainTool
    ]
  });
  
  // Extract departments needed
  const departmentsNeeded = orchestrator.output.departments;
  // e.g., ['character', 'visual', 'audio']
  
  // 2. Route to department heads in parallel
  const departmentReports = await Promise.all(
    departmentsNeeded.map(dept => 
      runDepartmentHead(dept, orchestrator.output.instructions[dept], projectId)
    )
  );
  
  // 3. Orchestrator aggregates results
  const aggregated = await codebuff.run({
    agent: 'master-orchestrator',
    prompt: `Aggregate these department reports: ${JSON.stringify(departmentReports)}`,
    previousRun: orchestrator,
    customToolDefinitions: [
      aggregateReportsTool,
      validateConsistencyTool,
      queryBrainTool,
      presentToUserTool
    ]
  });
  
  return aggregated;
};

// Department Head processes request
const runDepartmentHead = async (
  departmentName: string,
  instructions: string,
  projectId: string
) => {
  // 1. Department head assesses relevance
  const deptHead = await codebuff.run({
    agent: `${departmentName}-department-head`,
    prompt: instructions,
    customToolDefinitions: [
      assessRelevanceTool,
      spawnSpecialistTool,
      gradeOutputTool
    ]
  });
  
  // Extract relevance and needed specialists
  const relevance = deptHead.output.relevance; // 0-1
  
  if (relevance < 0.3) {
    return {
      department: departmentName,
      relevance,
      status: 'not_relevant',
      outputs: []
    };
  }
  
  const specialistsNeeded = deptHead.output.specialists;
  // e.g., ['hair-stylist', 'costume-designer']
  
  // 2. Spawn specialist agents in parallel
  const specialistOutputs = await Promise.all(
    specialistsNeeded.map(specialist => 
      runSpecialist(
        specialist,
        deptHead.output.specialistInstructions[specialist],
        projectId
      )
    )
  );
  
  // 3. Department head grades each output
  const gradedOutputs = await Promise.all(
    specialistOutputs.map(output => 
      gradeDepartmentOutput(departmentName, output)
    )
  );
  
  // 4. Filter and compile report
  const acceptedOutputs = gradedOutputs.filter(
    g => g.overallScore >= 0.60 && g.decision === 'accept'
  );
  
  return {
    department: departmentName,
    relevance,
    status: 'complete',
    outputs: acceptedOutputs,
    departmentQuality: calculateAverage(acceptedOutputs.map(o => o.overallScore))
  };
};

// Specialist agent executes task
const runSpecialist = async (
  specialistId: string,
  instructions: string,
  projectId: string
) => {
  const result = await codebuff.run({
    agent: specialistId,
    prompt: instructions,
    customToolDefinitions: getSpecialistTools(specialistId)
  });
  
  return {
    specialistId,
    output: result.output,
    confidence: result.output.confidence || 0.5,
    completeness: result.output.completeness || 0.5
  };
};

// Department head grades specialist output
const gradeDepartmentOutput = async (
  departmentName: string,
  specialistOutput: any
) => {
  // Use department head to grade
  const grading = await codebuff.run({
    agent: `${departmentName}-department-head`,
    prompt: `Grade this specialist output: ${JSON.stringify(specialistOutput)}`,
    customToolDefinitions: [gradeOutputTool]
  });
  
  return {
    ...specialistOutput,
    qualityScore: grading.output.qualityScore,
    relevanceScore: grading.output.relevanceScore,
    consistencyScore: grading.output.consistencyScore,
    overallScore: grading.output.overallScore,
    issues: grading.output.issues,
    suggestions: grading.output.suggestions,
    decision: grading.output.decision
  };
};
```

### 4.2 Custom Tools for Hierarchical System

**Route to Department Tool (Master Orchestrator):**
```typescript
const routeToDepartmentTool = getCustomToolDefinition({
  toolName: 'route_to_department',
  description: 'Route a request to specific department head',
  
  inputSchema: z.object({
    department: z.enum(['character', 'story', 'visual', 'audio', 'production']),
    instructions: z.string(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    dependencies: z.array(z.string()).optional()
  }),
  
  execute: async ({ department, instructions, priority, dependencies }) => {
    // Store routing info for execution
    return [{
      type: 'text',
      value: `Routed to ${department} department with ${priority || 'normal'} priority`
    }];
  }
});
```

**Spawn Specialist Tool (Department Head):**
```typescript
const spawnSpecialistTool = getCustomToolDefinition({
  toolName: 'spawn_specialist',
  description: 'Spawn a specialist agent with specific instructions',
  
  inputSchema: z.object({
    specialistId: z.string(),
    instructions: z.string(),
    context: z.object({}).optional(),
    expectedOutput: z.string().optional()
  }),
  
  execute: async ({ specialistId, instructions, context, expectedOutput }) => {
    // Mark specialist for spawning
    return [{
      type: 'text',
      value: `Specialist ${specialistId} will be spawned with instructions`
    }];
  }
});
```

**Grade Output Tool (Department Head):**
```typescript
const gradeOutputTool = getCustomToolDefinition({
  toolName: 'grade_output',
  description: 'Grade specialist output for quality and relevance',
  
  inputSchema: z.object({
    specialistId: z.string(),
    output: z.any(),
    gradingCriteria: z.object({
      quality: z.boolean().optional(),
      relevance: z.boolean().optional(),
      consistency: z.boolean().optional()
    }).optional()
  }),
  
  execute: async ({ specialistId, output, gradingCriteria }) => {
    // Analyze output
    const quality = analyzeQuality(output);
    const relevance = analyzeRelevance(output);
    const consistency = await checkConsistency(output);
    
    const overallScore = (
      quality * 0.4 + 
      relevance * 0.3 + 
      consistency * 0.3
    );
    
    const decision = overallScore >= 0.60 ? 'accept' : 
                    overallScore >= 0.40 ? 'revise' : 'discard';
    
    return [{
      type: 'text',
      value: JSON.stringify({
        qualityScore: quality,
        relevanceScore: relevance,
        consistencyScore: consistency,
        overallScore,
        decision,
        issues: findIssues(output, overallScore),
        suggestions: generateSuggestions(output, overallScore)
      })
    }];
  }
});
```

### 4.3 Department Configuration

```typescript
// Example: Character creation workflow
const createCharacterWorkflow = async (userPrompt: string, projectId: string) => {
  // 1. Character Creator Agent
  const characterResult = await codebuff.run({
    agent: 'character-creator',
    prompt: userPrompt,
    previousRun: null,
    customToolDefinitions: [saveCharacterTool, queryBrainTool]
  });
  
  if (characterResult.status === 'user_needs_to_decide') {
    return characterResult; // Wait for user decision
  }
  
  // 2. Character Designer Agent (visual)
  const designResult = await codebuff.run({
    agent: 'character-designer',
    prompt: `Create visual design for character: ${characterResult.output}`,
    previousRun: characterResult,
    customToolDefinitions: [saveImageTool, generateImageTool]
  });
  
  // 3. Voice Creator Agent
  const voiceResult = await codebuff.run({
    agent: 'voice-creator',
    prompt: `Create voice profile for character: ${characterResult.output}`,
    previousRun: designResult,
    customToolDefinitions: [saveVoiceTool]
  });
  
  return voiceResult;
};
```

### 4.2 Parallel Agent Execution

```typescript
// Example: Generate multiple scene variations
const generateSceneVariations = async (scenePrompt: string, projectId: string) => {
  // Spawn 3 agents in parallel
  const agents = [
    { agent: 'scene-director', prompt: `${scenePrompt} - Focus on action` },
    { agent: 'scene-director', prompt: `${scenePrompt} - Focus on dialogue` },
    { agent: 'scene-director', prompt: `${scenePrompt} - Focus on atmosphere` }
  ];
  
  const results = await Promise.all(
    agents.map(config => codebuff.run({
      ...config,
      customToolDefinitions: [saveTempSceneTool]
    }))
  );
  
  // Send all to Brain for ranking
  const ranked = await brain.rankContent({
    projectId,
    contents: results.map(r => r.output),
    type: 'scene'
  });
  
  return ranked;
};
```

### 4.3 Agent Handoff Pattern

```typescript
// Base agent hands off to specialist
const handleComplexRequest = async (userPrompt: string, projectId: string) => {
  // Base agent analyzes request
  const analysis = await codebuff.run({
    agent: 'base',
    prompt: `Analyze this request and determine which specialist agent should handle it: "${userPrompt}"`,
    customToolDefinitions: [analyzeRequestTool]
  });
  
  // Extract specialist agent ID
  const specialistAgentId = analysis.output.recommendedAgent;
  
  // Hand off to specialist
  const result = await codebuff.run({
    agent: specialistAgentId,
    prompt: userPrompt,
    previousRun: analysis,
    customToolDefinitions: getToolsForAgent(specialistAgentId)
  });
  
  return result;
};
```

---

## 5. Chat-Agent Integration

### 5.1 Chat Message Flow

```typescript
// Chat receives user message
const handleChatMessage = async (message: string, conversationId: string) => {
  // 1. Determine intent
  const intent = await analyzeIntent(message);
  
  // 2. Select appropriate agent
  const agentId = selectAgent(intent);
  
  // 3. Get conversation context
  const conversation = await getConversation(conversationId);
  const projectId = conversation.projectId;
  
  // 4. Prepare project context
  const projectContext = await getProjectContext(projectId);
  
  // 5. Run agent with real-time streaming
  const result = await codebuff.run({
    agent: agentId,
    prompt: message,
    previousRun: conversation.lastAgentRun,
    
    customToolDefinitions: getToolsForAgent(agentId),
    
    // Stream events to chat UI
    handleEvent: (event) => {
      switch (event.type) {
        case 'thinking':
          sendToChat({ type: 'thinking', content: event.content });
          break;
        case 'tool_call':
          sendToChat({ type: 'action', content: `Using ${event.tool}...` });
          break;
        case 'content_preview':
          sendToChat({ type: 'preview', content: event.content });
          break;
      }
    }
  });
  
  // 6. Save to conversation
  await saveToConversation(conversationId, {
    role: 'assistant',
    content: result.output,
    agentId,
    timestamp: new Date()
  });
  
  return result;
};
```

### 5.2 Agent Selection Logic

```typescript
const selectAgent = (intent: Intent): string => {
  // Map intent to agent
  const agentMap: Record<string, string> = {
    'create_character': 'character-creator',
    'create_scene': 'scene-director',
    'create_location': 'environment-designer',
    'write_dialogue': 'dialogue-writer',
    'structure_story': 'story-architect',
    'design_visual': 'concept-artist',
    'generate_image': 'image-generation',
    'generate_video': 'video-generation',
    'review_quality': 'quality-controller'
  };
  
  return agentMap[intent.type] || 'base';
};
```

### 5.3 Real-time Event Streaming

```typescript
// Stream agent events to UI via WebSocket
const streamAgentEvents = (socket: WebSocket, agentRun: AgentRun) => {
  agentRun.handleEvent = (event) => {
    // Transform event for UI
    const uiEvent = {
      type: event.type,
      timestamp: Date.now(),
      data: event.data
    };
    
    // Send to client
    socket.send(JSON.stringify(uiEvent));
    
    // Handle special events
    if (event.type === 'quality_issue') {
      // Present quality issues to user
      socket.send(JSON.stringify({
        type: 'action_required',
        action: 'quality_decision',
        data: event.data,
        options: ['MODIFY', 'DISCARD', 'ACCEPT']
      }));
    }
  };
};
```

---

## 6. Agent Configuration Storage

### 6.1 PayloadCMS AgentConfigs Collection

```typescript
// Store custom agent configurations
const saveAgentConfig = async (config: AladdinAgentDefinition) => {
  await payload.create({
    collection: 'agent-configs',
    data: {
      agentId: config.id,
      displayName: config.displayName,
      description: config.description,
      category: config.category,
      model: config.model,
      instructionsPrompt: config.instructionsPrompt,
      availableTools: config.tools,
      customTools: config.customTools,
      isGlobal: true,
      createdBy: 'system'
    }
  });
};
```

### 6.2 Project-Specific Agent Customization

```typescript
// Users can customize agents per project
const customizeAgent = async (projectId: string, agentId: string, customizations: object) => {
  await payload.create({
    collection: 'agent-configs',
    data: {
      agentId: `${projectId}-${agentId}`,
      displayName: customizations.displayName,
      instructionsPrompt: customizations.instructionsPrompt,
      project: projectId,
      isGlobal: false
    }
  });
};
```

---

## 7. Quality Gates in Agent Workflow

### 7.1 Pre-Agent Quality Check

```typescript
const runAgentWithQualityGates = async (agentConfig: AladdinAgentDefinition, prompt: string) => {
  // 1. Validate input
  const inputCheck = validateInput(prompt);
  if (!inputCheck.valid) {
    return {
      type: 'input_error',
      message: inputCheck.error
    };
  }
  
  // 2. Run agent
  const result = await codebuff.run({
    agent: agentConfig.id,
    prompt,
    customToolDefinitions: getToolsForAgent(agentConfig.id)
  });
  
  // 3. Validate output (if applicable)
  if (agentConfig.requiresBrainValidation) {
    const validation = await brain.validate(result.output);
    
    if (validation.qualityRating < agentConfig.qualityThreshold) {
      return {
        type: 'quality_issue',
        content: result.output,
        qualityRating: validation.qualityRating,
        issues: validation.contradictions,
        suggestions: validation.suggestions
      };
    }
  }
  
  return result;
};
```

---

## 8. Agent Deployment & Scaling

### 8.1 Agent Pool Management

```typescript
// Manage pool of active agents
class AgentPool {
  private agents: Map<string, CodebuffClient> = new Map();
  
  async getAgent(agentId: string): Promise<CodebuffClient> {
    if (!this.agents.has(agentId)) {
      const config = await loadAgentConfig(agentId);
      const client = new CodebuffClient({ apiKey: process.env.CODEBUFF_API_KEY });
      this.agents.set(agentId, client);
    }
    return this.agents.get(agentId)!;
  }
  
  async runAgent(agentId: string, params: RunParams) {
    const client = await this.getAgent(agentId);
    return await client.run(params);
  }
}
```

### 8.2 Rate Limiting & Throttling

```typescript
// Prevent API overload
class RateLimiter {
  private requestCounts: Map<string, number> = new Map();
  private windowMs = 60000; // 1 minute
  private maxRequests = 50;
  
  async checkLimit(userId: string): Promise<boolean> {
    const count = this.requestCounts.get(userId) || 0;
    return count < this.maxRequests;
  }
  
  async incrementCount(userId: string) {
    const count = this.requestCounts.get(userId) || 0;
    this.requestCounts.set(userId, count + 1);
    
    // Reset after window
    setTimeout(() => {
      this.requestCounts.delete(userId);
    }, this.windowMs);
  }
}
```

---

## 9. Error Handling & Retries

### 9.1 Graceful Error Handling

```typescript
const runAgentWithRetry = async (config: AgentConfig, maxRetries = 3) => {
  let attempt = 0;
  let lastError: Error;
  
  while (attempt < maxRetries) {
    try {
      return await codebuff.run(config);
    } catch (error) {
      lastError = error;
      attempt++;
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }
  
  // All retries failed
  return {
    type: 'error',
    message: `Agent failed after ${maxRetries} attempts: ${lastError.message}`
  };
};
```

---

## 10. Implementation Checklist

### Agent Setup
- [ ] Install @codebuff/sdk
- [ ] Configure API keys
- [ ] Define custom agents (50+)
- [ ] Create system prompts for each agent

### Custom Tools
- [ ] Implement save_character tool
- [ ] Implement save_scene tool
- [ ] Implement query_brain tool
- [ ] Implement all core tools

### Integration
- [ ] Connect agents to chat interface
- [ ] Implement real-time event streaming
- [ ] Add quality gates before/after agent runs
- [ ] Store agent configs in PayloadCMS

### Testing
- [ ] Test each agent individually
- [ ] Test agent orchestration workflows
- [ ] Test quality validation pipeline
- [ ] Test error handling and retries

---

**Status**: AI Agent Integration Complete ✓  
**Next**: API Design (Section 3)