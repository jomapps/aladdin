/**
 * Prompt Customization Examples
 *
 * This file shows how to customize LLM prompts for entity-specific
 * metadata generation, relationship discovery, and summarization.
 */

import { getConfigManager } from '../index'
import type { EntityConfig } from '../types'

/**
 * Example 1: Horror Movie Character Prompts
 *
 * Custom prompts for horror genre characters
 */
const horrorCharacterConfig: EntityConfig = {
  entityType: 'character',
  requiredFields: ['id', 'name', 'description'],
  optionalFields: ['age', 'occupation', 'personality'],
  contextSources: ['payload', 'brain', 'project'],

  metadataFields: [
    {
      name: 'survivalLikelihood',
      type: 'string',
      description: 'How likely is this character to survive',
      required: true,
    },
    {
      name: 'horrorArchetype',
      type: 'string',
      description: 'Horror movie archetype',
      required: true,
    },
    {
      name: 'fearProfile',
      type: 'object',
      description: 'What scares this character',
      required: false,
    },
  ],

  relationshipTypes: [],
  validationRules: [],

  enrichmentStrategy: {
    level: 'comprehensive',
    contextGathering: {
      includeRelatedCharacters: true,
      includeRelatedScenes: true,
    },
    metadataGeneration: {
      enabled: true,
      temperature: 0.4, // Higher for creative horror insights
      maxTokens: 2000,
    },
    relationshipDiscovery: {
      enabled: true,
    },
  },

  llmPromptConfig: {
    // Custom metadata prompt for horror characters
    metadataPromptTemplate: `You are analyzing a character in a HORROR {{projectType}}.

PROJECT: {{projectName}}
SUBGENRE: {{projectGenre}}
THEMES: {{projectThemes}}

CHARACTER DATA:
{{data}}

Generate horror-specific metadata:

1. SURVIVAL LIKELIHOOD: Rate on scale (doomed, unlikely, possible, likely, final-girl)
   - Consider: moral compass, intelligence, physical capability, narrative role

2. HORROR ARCHETYPE: Identify classic horror role
   - Options: final-girl, jock, nerd, skeptic, believer, token, red-herring, killer
   - Justify your choice based on character traits

3. FEAR PROFILE: What terrifies this character most?
   - Phobias, psychological vulnerabilities, past traumas
   - How the horror exploits these fears

4. DEATH SCENE POTENTIAL: If they die, how?
   - Foreshadowing elements in character description
   - Ironic or thematic death possibilities

5. CHARACTER FLAWS: Fatal flaws for horror context
   - What mistake will they make?
   - How does this serve the horror narrative?

Return JSON with fields: survivalLikelihood, horrorArchetype, fearProfile, deathScenePotential, fatalFlaws, horrorNarrativeRole

Be creative but grounded in character details.`,

    // Custom relationship prompt
    relationshipPromptTemplate: `Identify horror-specific relationships and dynamics.

CHARACTER:
{{data}}

OTHER CHARACTERS:
{{characters}}

Horror relationship types:
- VICTIM_OF: Character targeted by another
- PROTECTS: Character tries to save another
- DOUBTS: Character doesn't believe another
- TRUSTS_UNWISELY: Character trusts someone they shouldn't
- ROMANTIC_TENSION: Romance that will complicate survival
- COMIC_RELIEF_FOR: Provides levity (often dies first)
- SURVIVOR_BOND: Characters who might both survive

Consider:
- Who will betray whom?
- Who will sacrifice for whom?
- Who will be isolated/picked off?
- Who forms survival alliances?

Return JSON array with horror-specific relationship context.`,

    // Custom summary prompt
    summaryPromptTemplate: `Create a searchable horror character summary.

CHARACTER: {{name}}
ROLE: {{characterType}}
PROJECT: {{projectName}}

Details:
{{data}}

Horror Context:
{{context}}

Write a 3-sentence summary:
1. Who they are and their role
2. Their survival prospects and archetype
3. Their key relationships and fears

Include horror keywords: survivor, victim, terror, fear, death, sacrifice, etc.`,
  },
}

/**
 * Example 2: Sci-Fi Technology Prompts
 *
 * Custom prompts for sci-fi technology entities
 */
const sciFiTechnologyConfig: EntityConfig = {
  entityType: 'technology',
  requiredFields: ['id', 'name', 'description'],
  optionalFields: ['type', 'capabilities', 'limitations'],
  contextSources: ['payload', 'brain', 'project'],

  metadataFields: [
    {
      name: 'techLevel',
      type: 'string',
      description: 'Technology advancement level',
      required: true,
    },
    {
      name: 'scienceAccuracy',
      type: 'string',
      description: 'How scientifically accurate',
      required: true,
    },
    {
      name: 'narrativeFunction',
      type: 'string',
      description: 'How technology serves the plot',
      required: true,
    },
  ],

  relationshipTypes: [],
  validationRules: [],

  enrichmentStrategy: {
    level: 'comprehensive',
    contextGathering: {
      includeRelatedCharacters: true,
      includeProjectThemes: true,
    },
    metadataGeneration: {
      enabled: true,
      temperature: 0.3, // Lower for technical accuracy
      maxTokens: 1800,
    },
    relationshipDiscovery: {
      enabled: true,
    },
  },

  llmPromptConfig: {
    metadataPromptTemplate: `Analyze this technology in a sci-fi context.

PROJECT: {{projectName}}
SCI-FI SUBGENRE: {{projectGenre}}
THEMES: {{projectThemes}}

TECHNOLOGY:
{{data}}

Generate sci-fi specific metadata:

1. TECH LEVEL: Classification
   - Current: Based on real science
   - Near-Future: 20-50 years out
   - Far-Future: 50-200 years
   - Speculative: Beyond known physics
   - Impossible: Breaks known laws

2. SCIENCE ACCURACY: Rate realism
   - Hard Sci-Fi: Scientifically plausible
   - Medium: Some speculative elements
   - Soft Sci-Fi: Science as backdrop
   - Science Fantasy: Magic disguised as tech

3. NARRATIVE FUNCTION: Story purpose
   - MacGuffin: Drives plot
   - World-Building: Establishes setting
   - Character Tool: Enables protagonist
   - Thematic Symbol: Represents ideas
   - Conflict Source: Creates problems

4. TECHNOLOGICAL IMPLICATIONS:
   - Social impact in story world
   - Ethical questions raised
   - Potential misuse/dangers
   - Connection to themes

5. TECHNICAL SPECIFICATIONS:
   - How it works (in-universe)
   - Limitations/constraints
   - Required infrastructure
   - Power source/requirements

Return JSON: techLevel, scienceAccuracy, narrativeFunction, implications, specifications, thematicConnection`,
  },
}

/**
 * Example 3: Romance Character Prompts
 *
 * Prompts focused on romantic relationships and emotional arcs
 */
const romanceCharacterConfig: EntityConfig = {
  entityType: 'character',
  requiredFields: ['id', 'name', 'description'],
  optionalFields: [],
  contextSources: ['payload', 'brain', 'project'],

  metadataFields: [
    {
      name: 'romanticRole',
      type: 'string',
      description: 'Role in romance (lead, love interest, rival)',
      required: true,
    },
    {
      name: 'emotionalArc',
      type: 'string',
      description: 'Emotional journey',
      required: true,
    },
    {
      name: 'loveLanguage',
      type: 'string',
      description: 'How they express love',
      required: false,
    },
  ],

  relationshipTypes: [],
  validationRules: [],

  enrichmentStrategy: {
    level: 'comprehensive',
    contextGathering: {
      includeRelatedCharacters: true,
    },
    metadataGeneration: {
      enabled: true,
      temperature: 0.5, // Higher for emotional insights
      maxTokens: 1500,
    },
    relationshipDiscovery: {
      enabled: true,
    },
  },

  llmPromptConfig: {
    metadataPromptTemplate: `Analyze this character in a ROMANCE story.

PROJECT: {{projectName}}
ROMANCE SUBGENRE: {{projectGenre}}

CHARACTER:
{{data}}

Generate romance-specific insights:

1. ROMANTIC ROLE:
   - Lead: Main character seeking love
   - Love Interest: The romantic partner
   - Rival: Competing for affection
   - Mentor: Guides others' romance
   - Obstacle: Stands between lovers

2. EMOTIONAL ARC:
   - Starting state (closed off, hopeful, wounded, etc.)
   - Transformation needed
   - Vulnerability to overcome
   - How they'll change by story end

3. LOVE LANGUAGE: How they show affection
   - Words of affirmation
   - Acts of service
   - Receiving gifts
   - Quality time
   - Physical touch

4. ROMANTIC OBSTACLES:
   - Internal barriers (fear, trauma, beliefs)
   - External barriers (circumstances, other people)
   - Character flaws affecting romance
   - Growth needed to find love

5. CHEMISTRY FACTORS:
   - What makes them attractive?
   - What makes them vulnerable?
   - Their romantic appeal
   - Potential for conflict/tension

Return JSON: romanticRole, emotionalArc, loveLanguage, obstacles, chemistryFactors, vulnerabilities`,

    relationshipPromptTemplate: `Identify romance relationships and dynamics.

CHARACTER:
{{data}}

OTHER CHARACTERS:
{{characters}}

Romance relationship types:
- LOVES: Romantic attraction
- RIVAL_FOR: Competing for same person
- FRIEND_ZONE: Platonic but could be more
- PAST_RELATIONSHIP: Former lovers
- WILL_FALL_FOR: Not yet but will
- FAMILY_OPPOSES: Family against relationship
- WINGMAN: Helps their romance

Focus on:
- Romantic chemistry potential
- Love triangles
- Slow-burn possibilities
- Friends-to-lovers opportunities
- Second chance romance
- Forbidden love elements

Include confidence scores for romantic relationships.`,
  },
}

/**
 * Example 4: Minimal Prompt (Fast Processing)
 *
 * Optimized prompts for speed over depth
 */
const minimalPromptConfig: EntityConfig = {
  entityType: 'quick_note',
  requiredFields: ['id', 'content'],
  optionalFields: [],
  contextSources: ['project'],

  metadataFields: [
    {
      name: 'category',
      type: 'string',
      description: 'Note category',
      required: true,
    },
  ],

  relationshipTypes: [],
  validationRules: [],

  enrichmentStrategy: {
    level: 'minimal',
    contextGathering: {
      includeRelatedCharacters: false,
      includeRelatedScenes: false,
    },
    metadataGeneration: {
      enabled: true,
      temperature: 0.2,
      maxTokens: 300, // Minimal tokens
    },
    relationshipDiscovery: {
      enabled: false, // Skip for speed
    },
  },

  llmPromptConfig: {
    metadataPromptTemplate: `Categorize this note quickly.

NOTE: {{data}}

Return JSON with ONE field:
{ "category": "story_idea" | "character_note" | "scene_note" | "technical_note" | "other" }`,

    summaryPromptTemplate: `Create 1-sentence summary of: {{data}}`,
  },
}

/**
 * Example 5: Context-Aware Variable Substitution
 */
export function createDynamicPrompt(
  baseTemplate: string,
  entityData: any,
  context: any
): string {
  // Variable substitution examples
  const variables = {
    // Basic entity info
    entityName: entityData.name || 'Unknown',
    entityType: entityData.type || 'Unknown',
    entityDescription: entityData.description || '',

    // Project context
    projectName: context.project?.name || 'Unknown Project',
    projectType: context.project?.type || 'movie',
    projectGenre: context.project?.genre?.join(', ') || 'unknown',
    projectThemes: context.project?.themes?.join(', ') || 'unknown',
    projectTone: context.project?.tone || 'unknown',

    // Related entities
    characters: context.payload?.characters?.map((c: any) => c.name).join(', ') || 'none',
    scenes: context.payload?.scenes?.length || 0,
    locations: context.payload?.locations?.length || 0,

    // Full data dumps
    data: JSON.stringify(entityData, null, 2),
    context: JSON.stringify(context, null, 2),
  }

  // Replace variables
  let result = baseTemplate
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, String(value))
  }

  return result
}

/**
 * How to register and use custom prompts
 */
export function registerCustomPrompts() {
  const configManager = getConfigManager()

  // Register horror character prompts
  configManager.registerEntityConfig(horrorCharacterConfig)

  // Register sci-fi technology prompts
  configManager.registerEntityConfig(sciFiTechnologyConfig)

  // Register romance prompts
  configManager.registerEntityConfig(romanceCharacterConfig)

  // Register minimal prompts
  configManager.registerEntityConfig(minimalPromptConfig)

  console.log('[Prompts] Registered custom prompt configurations')
}

/**
 * Usage Example
 */
export async function useCustomPrompts() {
  const { getDataPreparationAgent } = await import('../../agent')

  // 1. Register prompts
  registerCustomPrompts()

  // 2. Prepare a horror character
  const agent = getDataPreparationAgent()

  const horrorCharacter = {
    id: 'char_001',
    name: 'Jessica Miller',
    description: 'A skeptical college student who doesn\'t believe in the supernatural',
    age: 19,
    occupation: 'Psychology major',
    personality: ['skeptical', 'intelligent', 'stubborn'],
  }

  // Agent will use horror-specific prompts automatically
  const document = await agent.prepare(horrorCharacter, {
    projectId: 'horror-001',
    entityType: 'character',
  })

  console.log('Horror character metadata:', {
    survivalLikelihood: document.metadata.survivalLikelihood,
    horrorArchetype: document.metadata.horrorArchetype,
    fearProfile: document.metadata.fearProfile,
  })
}

/**
 * Tips for Writing Effective Prompts
 */
export const promptWritingTips = {
  metadata: {
    structure: 'Use clear numbered sections for different metadata aspects',
    specificity: 'Be specific about what you want (e.g., "Rate on scale 1-10" vs "Rate")',
    context: 'Include project genre, themes, tone for contextual generation',
    format: 'Always specify return format (JSON with field names)',
    examples: 'Provide examples of good responses in the prompt',
  },

  relationships: {
    types: 'List all possible relationship types relevant to entity',
    bidirectional: 'Consider if relationships work both ways',
    confidence: 'Ask for confidence scores (0-1) for each relationship',
    reasoning: 'Request reasoning for why relationship exists',
    context: 'Provide list of available entities to relate to',
  },

  summary: {
    length: 'Specify exact length (e.g., "2-3 sentences")',
    keywords: 'Ask for specific keywords to include',
    searchability: 'Emphasize searchability for brain service',
    style: 'Specify tone (formal, casual, descriptive)',
    structure: 'Provide structure (e.g., "Sentence 1: who, Sentence 2: what, Sentence 3: why")',
  },

  optimization: {
    tokens: 'Keep prompts concise - each word costs tokens',
    temperature: 'Lower temp (0.2-0.3) for factual, higher (0.4-0.6) for creative',
    maxTokens: 'Set appropriate limits based on expected response size',
    fallbacks: 'Agent falls back to defaults if custom prompt fails',
  },
}
