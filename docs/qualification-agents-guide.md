# Qualification Agents Guide

## Overview

The Qualification Agents are specialized AI agents designed to replace direct LLM calls in the qualification workflow. These agents are properly defined in PayloadCMS and work with the existing AladdinAgentRunner infrastructure.

## Agent Definitions

### 1. Character Department Agent
**Slug:** `character-department-agent`
**Purpose:** Generates comprehensive 360° character reference sheets

**Capabilities:**
- Physical appearance and design specifications
- Personality traits and psychological profiles
- Character backstory and development arcs
- Visual design elements and color associations
- Character relationship mapping

**Output Format:** JSON with characters array, relationships, and department notes

### 2. World Department Agent
**Slug:** `world-department-agent`
**Purpose:** Creates comprehensive story bibles and world building documentation

**Capabilities:**
- Geography and location design
- World rules and physical/magical systems
- Historical timelines and major events
- Cultural societies and belief systems
- Visual identity and aesthetic direction

**Output Format:** JSON with world structure, rules, history, culture, and conflicts

### 3. Story Department Agent
**Slug:** `story-department-agent`
**Purpose:** Generates screenplay format scripts and scene breakdowns

**Capabilities:**
- Professional screenplay formatting
- Three-act structure implementation
- Scene-by-scene breakdown with dialogue
- Character arc tracking
- Visual storytelling elements

**Output Format:** JSON with properly formatted screenplay scenes, character arcs, and themes

### 4. Visual Department Agent
**Slug:** `visual-department-agent`
**Purpose:** Creates comprehensive visual style guides

**Capabilities:**
- Color palette design with hex codes
- Cinematography and camera work guidelines
- Lighting approach and mood creation
- Character visual signatures
- Location design and atmospheric elements
- Post-production direction

**Output Format:** JSON with complete visual identity, color theory, cinematography notes, and technical specs

### 5. Evaluation Agent
**Slug:** `evaluation-agent`
**Purpose:** Evaluates all department outputs and ensures quality

**Capabilities:**
- Department-specific quality scoring
- Gap analysis and inconsistency detection
- Cross-department alignment verification
- Production readiness assessment
- Actionable recommendations

**Output Format:** JSON with scores, analysis, recommendations, and next steps

## Installation

### Automatic Seeding (Recommended)

The qualification agents are automatically seeded when you run the full database seed:

```bash
npm run db:seed
```

### Standalone Seeding

To seed only the qualification agents without affecting other data:

```bash
npm run seed:qualification-agents
```

This will:
1. Load agent definitions from `seeds/qualification-agents.json`
2. Create or update the 5 qualification agents
3. Link agents to their respective departments
4. Verify all agents are properly configured

## Usage with AladdinAgentRunner

### Basic Usage

```typescript
import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'

// Initialize runner
const runner = new AladdinAgentRunner({
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
})

// Run character department agent
const characterResult = await runner.runBySlug({
  agentSlug: 'character-department-agent',
  input: projectData,
  context: {
    projectId: project.id,
    userId: user.id
  }
})

// The result will be properly structured JSON
const characters = JSON.parse(characterResult.output)
```

### Qualification Workflow Integration

```typescript
// Example: Full qualification workflow
async function runQualificationWorkflow(projectId: string) {
  const runner = new AladdinAgentRunner({ baseUrl: process.env.NEXT_PUBLIC_BASE_URL })

  // 1. Character Department
  const characterOutput = await runner.runBySlug({
    agentSlug: 'character-department-agent',
    input: projectData
  })

  // 2. World Department
  const worldOutput = await runner.runBySlug({
    agentSlug: 'world-department-agent',
    input: { ...projectData, characters: characterOutput.output }
  })

  // 3. Story Department
  const storyOutput = await runner.runBySlug({
    agentSlug: 'story-department-agent',
    input: {
      ...projectData,
      characters: characterOutput.output,
      world: worldOutput.output
    }
  })

  // 4. Visual Department
  const visualOutput = await runner.runBySlug({
    agentSlug: 'visual-department-agent',
    input: {
      ...projectData,
      characters: characterOutput.output,
      world: worldOutput.output,
      story: storyOutput.output
    }
  })

  // 5. Evaluation
  const evaluation = await runner.runBySlug({
    agentSlug: 'evaluation-agent',
    input: {
      projectBrief: projectData,
      characterOutput: characterOutput.output,
      worldOutput: worldOutput.output,
      storyOutput: storyOutput.output,
      visualOutput: visualOutput.output
    }
  })

  return {
    character: JSON.parse(characterOutput.output),
    world: JSON.parse(worldOutput.output),
    story: JSON.parse(storyOutput.output),
    visual: JSON.parse(visualOutput.output),
    evaluation: JSON.parse(evaluation.output)
  }
}
```

## Agent Configuration

### Model Settings

All qualification agents use:
- **Model:** `anthropic/claude-sonnet-4.5` (via OpenRouter)
- **Temperature:** 0.2-0.4 (depending on creativity requirements)
- **Max Tokens:** 8000-12000 (depending on output complexity)

### System Prompts

Each agent has a comprehensive system prompt that includes:
- Role and expertise definition
- Input format expectations
- Output JSON structure requirements
- Quality standards and best practices
- Error handling instructions

### Department Linkage

Agents are automatically linked to their respective departments:
- Character Department Agent → `character-department`
- World Department Agent → `world-department`
- Story Department Agent → `story-department`
- Visual Department Agent → `visual-department`
- Evaluation Agent → `evaluation`

## Verification

To verify that all qualification agents are properly configured:

```typescript
import { verifyQualificationAgents } from '@/seed/qualification-agents.seed'
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
const isValid = await verifyQualificationAgents(payload)

if (isValid) {
  console.log('✅ All qualification agents are properly configured')
} else {
  console.error('❌ Some agents are missing or misconfigured')
}
```

## Customization

### Modifying Agent Definitions

1. Edit `seeds/qualification-agents.json`
2. Update agent properties (name, systemPrompt, temperature, etc.)
3. Run the seed script: `npm run seed:qualification-agents`

### Adding New Agents

1. Add agent definition to `seeds/qualification-agents.json`
2. Update the seed script if needed
3. Run `npm run seed:qualification-agents`

### Updating System Prompts

System prompts can be updated to:
- Refine output format requirements
- Add new quality standards
- Include additional context or examples
- Improve error handling

Simply edit the `systemPrompt` field in the JSON and re-run the seed.

## Troubleshooting

### Agent Not Found
```
Error: Agent with slug 'character-department-agent' not found
```
**Solution:** Run `npm run seed:qualification-agents`

### Invalid JSON Output
```
Error: Unexpected token in JSON
```
**Solution:** The agent's system prompt enforces JSON output. Check that the prompt includes clear JSON structure requirements.

### Department Not Linked
```
Warning: Department not found: character-department
```
**Solution:** Ensure departments are seeded first with `npm run db:seed`

### Model Not Available
```
Error: Model 'anthropic/claude-sonnet-4.5' not found
```
**Solution:** Verify OpenRouter configuration and API key in environment variables.

## Best Practices

1. **Always seed departments first** before seeding agents
2. **Use the verification function** after seeding to ensure proper configuration
3. **Parse JSON outputs** to validate structure before using in application
4. **Handle errors gracefully** as LLM outputs may occasionally fail validation
5. **Monitor token usage** to stay within budget constraints
6. **Version control agent definitions** to track changes over time

## Related Files

- **Agent Definitions:** `/seeds/qualification-agents.json`
- **Seed Script:** `/src/seed/qualification-agents.seed.ts`
- **Standalone Runner:** `/scripts/seed-qualification-agents.ts`
- **Main Seed:** `/src/seed/index.ts`
- **Agent Runner:** `/src/lib/agents/AladdinAgentRunner.ts`

## Next Steps

1. Review agents in PayloadCMS admin: `/admin/collections/agents`
2. Test agents individually with AladdinAgentRunner
3. Integrate agents into qualification workflow
4. Monitor performance and adjust system prompts as needed
5. Collect feedback and iterate on agent definitions
