/**
 * Dialogue Entity Configuration
 *
 * Comprehensive configuration for dialogue entity processing including
 * metadata schemas, LLM prompts, relationship rules, and quality thresholds.
 */

import type { EntityConfig } from '../types'

/**
 * Dialogue entity configuration
 *
 * Defines how dialogue entities are processed, validated, and enriched
 * with metadata and relationships.
 */
export const dialogueConfig: EntityConfig = {
  // Entity identification
  entityType: 'dialogue',
  collectionSlug: 'dialogues',

  // Metadata configuration
  metadata: {
    required: ['speaker', 'dialogueType'],
    optional: [
      'emotionalState',
      'subtext',
      'narrativePurpose',
      'characterVoice',
      'tonality',
      'contextualImportance',
      'wordCount',
      'timestamp',
      'deliveryNotes',
      'culturalReferences',
      'thematicConnection',
    ],
    schema: {
      speaker: {
        type: 'string',
        required: true,
      },
      dialogueType: {
        type: 'string',
        required: true,
        validation: (v) => ['dialogue', 'monologue', 'voiceover', 'internal', 'aside'].includes(v),
      },
      emotionalState: {
        type: 'string',
        required: false,
      },
      subtext: {
        type: 'string',
        required: false,
      },
      narrativePurpose: {
        type: 'string',
        required: false,
      },
      characterVoice: {
        type: 'string',
        required: false,
      },
      tonality: {
        type: 'string',
        required: false,
      },
      contextualImportance: {
        type: 'string',
        required: false,
        validation: (v) => !v || ['low', 'medium', 'high', 'critical'].includes(v),
      },
      wordCount: {
        type: 'number',
        required: false,
        validation: (v) => !v || (v >= 0),
      },
      timestamp: {
        type: 'string',
        required: false,
      },
      deliveryNotes: {
        type: 'string',
        required: false,
      },
      culturalReferences: {
        type: 'array',
        required: false,
      },
      thematicConnection: {
        type: 'string',
        required: false,
      },
    },
    defaults: {
      dialogueType: 'dialogue',
      contextualImportance: 'medium',
    },
  },

  // LLM configuration
  llm: {
    prompts: {
      analyze: `You are analyzing dialogue for a {projectType} project with the following context:

Project: {projectName}
Genre: {projectGenre}
Themes: {projectThemes}
Tone: {projectTone}

Dialogue Data:
{data}

Analyze this dialogue and determine:
1. Dialogue Type: Is this dialogue, monologue, voiceover, internal thought, or aside?
2. Speaker: Who is speaking? (character name or narrator)
3. Emotional State: What emotional state is the speaker in?
4. Subtext: What is the underlying meaning or subtext?
5. Narrative Purpose: What function does this dialogue serve in the story?

Consider the character's voice, the scene context, and narrative function.
Provide your analysis in JSON format with fields: dialogueType, speaker, emotionalState, subtext, narrativePurpose.`,

      extract: `You are extracting detailed metadata for dialogue in a {projectType} project.

Project Context: {projectName} ({projectGenre})
Dialogue: {data}

Extract the following metadata:

REQUIRED:
- speaker: Character name or "Narrator"
- dialogueType: dialogue | monologue | voiceover | internal | aside

OPTIONAL:
- emotionalState: Speaker's emotional state
- subtext: Underlying meaning or implications
- narrativePurpose: Function in advancing story or character
- characterVoice: Distinctive voice characteristics
- tonality: Tone of delivery (serious, comedic, sarcastic, etc.)
- contextualImportance: low | medium | high | critical
- wordCount: Number of words in dialogue
- timestamp: Time position in scene
- deliveryNotes: Performance or delivery instructions
- culturalReferences: Array of cultural or literary references
- thematicConnection: Connection to project themes

Focus on narrative function and character voice.
Return as JSON with all applicable fields.`,

      summarize: `Create a comprehensive summary for this dialogue optimized for search and retrieval.

Dialogue Data: {data}
Metadata: {metadata}

Generate a summary that includes:
1. Speaker and dialogue type
2. Context within the scene
3. Key content and message
4. Emotional state and subtext
5. Narrative purpose and importance
6. Character voice characteristics
7. Thematic significance

The summary should be 100-150 words and capture all essential information for quick reference.
Focus on searchable keywords and narrative importance.`,

      relationships: `Identify and analyze relationships for this dialogue.

Dialogue: {data}
Project Context: {context}

Consider the following relationship types:
- SPOKEN_BY: Character who speaks this dialogue
- PART_OF_SCENE: Scene containing this dialogue
- ADDRESSED_TO: Character(s) being addressed
- REFERENCES: Characters, concepts, or events referenced
- REVEALS: Information or character traits revealed
- RESPONDS_TO: Previous dialogue this responds to
- FOLLOWED_BY: Next dialogue in sequence

For each relationship identified:
1. Determine the relationship type
2. Identify the target entity (character, scene, dialogue, concept)
3. Calculate confidence score (0.0-1.0)
4. Provide reasoning for the relationship

Return as JSON array with fields: type, target, targetType, confidence, reasoning.`,
    },
    temperature: 0.7,
    maxTokens: 1800,
  },

  // Relationship configuration
  relationships: {
    allowed: [
      { type: 'SPOKEN_BY', targetType: 'character' },
      { type: 'PART_OF_SCENE', targetType: 'scene' },
      { type: 'ADDRESSED_TO', targetType: 'character' },
      { type: 'REFERENCES', targetType: 'character' },
      { type: 'REFERENCES', targetType: 'concept' },
      { type: 'REVEALS', targetType: 'concept' },
      { type: 'RESPONDS_TO', targetType: 'dialogue' },
      { type: 'FOLLOWED_BY', targetType: 'dialogue' },
      { type: 'PART_OF_EPISODE', targetType: 'episode' },
    ],
    autoDiscover: true,
    confidenceThreshold: 0.7,
  },

  // Quality configuration
  quality: {
    minimumScore: 0.55,
    requiredFields: ['text', 'speaker'],
    validationRules: [
      {
        field: 'text',
        rule: (v) => v && typeof v === 'string' && v.length > 0,
        message: 'Dialogue text is required and must be a non-empty string',
      },
      {
        field: 'speaker',
        rule: (v) => v && typeof v === 'string' && v.length > 0,
        message: 'Speaker is required and must be a non-empty string',
      },
      {
        field: 'dialogueType',
        rule: (v, doc) => !v || ['dialogue', 'monologue', 'voiceover', 'internal', 'aside'].includes(v),
        message: 'Dialogue type must be one of: dialogue, monologue, voiceover, internal, aside',
      },
      {
        field: 'contextualImportance',
        rule: (v, doc) => !v || ['low', 'medium', 'high', 'critical'].includes(v),
        message: 'Contextual importance must be one of: low, medium, high, critical',
      },
    ],
  },

  // Processing configuration
  processing: {
    async: true, // Dialogue processing can be async
    priority: 'normal',
    cacheTTL: 1200, // 20 minutes
    retryAttempts: 2,
  },

  // Feature flags
  features: {
    enableLLM: true,
    enableCache: true,
    enableQueue: true,
    enableValidation: true,
    enableRelationships: true,
  },
}
