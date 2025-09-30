/**
 * Character Department Head Agent Configuration
 * Level 2: Manages all character-related specialists
 */

import type { AladdinAgentDefinition } from '../types'

export const characterDepartmentHead: AladdinAgentDefinition = {
  id: 'character-department-head',
  model: 'openai/gpt-4',
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
4. Overall Score: Weighted average (quality*0.4 + relevance*0.3 + consistency*0.3)

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
    'get_department_context',
    'save_character'
  ],

  accessLevel: 'write',
  requiresBrainValidation: false, // Orchestrator handles this
  qualityThreshold: 0.60
}

export const hairStylistAgent: AladdinAgentDefinition = {
  id: 'hair-stylist-specialist',
  model: 'openai/gpt-4',
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
  confidence: 0.85,
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
  requiresBrainValidation: false,
  qualityThreshold: 0.50
}
