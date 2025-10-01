/**
 * Scene Entity Prompts
 * LLM prompt templates for scene metadata extraction and analysis
 */

import { PromptTemplate } from './template-utils'

export const scenePrompts: Record<string, PromptTemplate> = {
  analyze: {
    stage: 'analyze',
    template: `You are analyzing scene data for a narrative project.

{context.project}

INPUT DATA:
{data}

TASK: Analyze this scene and determine:
1. Scene classification (action, dialogue, exposition, transition)
2. Narrative function in the story structure
3. Plot significance level
4. Preliminary metadata structure needed

OUTPUT FORMAT (JSON):
{
  "sceneType": "action" | "dialogue" | "exposition" | "transition",
  "narrativeFunction": "scene's purpose in story",
  "plotSignificance": "low" | "medium" | "high",
  "emotionalTone": "primary emotional quality",
  "dataQuality": "high" | "medium" | "low",
  "confidence": 0.0-1.0,
  "recommendedFields": ["field1", "field2"],
  "reasoning": "explanation of classification"
}

VALIDATION CRITERIA:
- sceneType must be one of the four valid types
- narrativeFunction must be specific (max 150 chars)
- plotSignificance should reflect story impact
- emotionalTone should be clear and specific`,
    variables: ['data', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Valid sceneType from allowed values',
      'Clear narrative function',
      'Appropriate plot significance',
      'Specific emotional tone',
      'Reasoning supports classification'
    ]
  },

  extract: {
    stage: 'extract',
    template: `You are extracting comprehensive metadata for a scene in a narrative project.

{context.project}

SCENE DATA:
{data}

CONTEXT:
{context.related}

EXISTING SCENES: {context.brain}

TASK: Extract detailed scene metadata according to the schema.

METADATA SCHEMA:
{
  "sceneType": "action | dialogue | exposition | transition",
  "narrativeFunction": "scene's role in story structure",
  "emotionalTone": "primary emotional quality",
  "plotSignificance": "low | medium | high",
  "characterDevelopment": {
    "characterName": "how character develops in this scene"
  },
  "thematicElements": ["theme1", "theme2"],
  "continuityNotes": "important continuity information",
  "visualStyle": "visual/cinematographic approach",
  "pacing": "slow | medium | fast"
}

OUTPUT FORMAT (JSON):
Return ONLY the metadata object with all applicable fields filled.

GUIDELINES:
- Identify primary scene type (action, dialogue, exposition, transition)
- Describe narrative function (setup, conflict, revelation, resolution, etc.)
- Assess emotional tone (tense, intimate, chaotic, contemplative, etc.)
- Rate plot significance based on story impact
- Note character development for each character in scene
- Identify thematic elements that emerge
- Document important continuity details
- Describe visual/cinematographic style
- Assess pacing relative to surrounding scenes

VALIDATION CRITERIA:
- All required fields present
- Scene type matches content
- Narrative function is specific and clear
- Character development notes reference actual characters
- Thematic elements connect to project themes
- Pacing assessment is justified`,
    variables: ['data', 'context.project', 'context.related', 'context.brain'],
    outputFormat: 'json',
    examples: [
      {
        input: {
          number: 23,
          description: 'Detective Smith confronts his former partner about the cover-up',
          setting: 'Abandoned warehouse, night',
          action: 'Tense confrontation leading to physical altercation'
        },
        output: {
          sceneType: 'action',
          narrativeFunction: 'Major revelation and conflict escalation',
          emotionalTone: 'Tense, confrontational, betrayal',
          plotSignificance: 'high',
          characterDevelopment: {
            'John Smith': 'Faces his past, chooses truth over loyalty',
            'Marcus Reed': 'Desperation revealed, loses moral high ground'
          },
          thematicElements: ['betrayal', 'truth vs loyalty', 'corruption'],
          continuityNotes: 'Smith sustains shoulder injury, Reed flees with evidence file',
          visualStyle: 'Dark, noir lighting, handheld camera for intensity',
          pacing: 'fast'
        }
      }
    ],
    validationCriteria: [
      'Scene type matches described action',
      'Narrative function explains story purpose',
      'Emotional tone is specific and appropriate',
      'Character development for all scene participants',
      'Thematic elements are relevant',
      'Continuity notes capture important details'
    ]
  },

  summarize: {
    stage: 'summarize',
    template: `You are creating a comprehensive summary for a scene that will be used for search and retrieval.

{context.project}

SCENE DATA:
{data}

EXTRACTED METADATA:
{metadata}

TASK: Create a rich, searchable summary that captures:
1. Scene setting and participants
2. Primary action and narrative function
3. Emotional tone and atmosphere
4. Character development moments
5. Plot significance and thematic elements

The summary should be 100-250 words and optimized for semantic search.

OUTPUT FORMAT (JSON):
{
  "summary": "comprehensive summary text",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "searchTags": ["tag1", "tag2", "tag3"],
  "oneLinePitch": "single sentence scene description"
}

GUIDELINES:
- Describe what happens and why it matters
- Include setting, characters, and key action
- Note emotional quality and atmosphere
- Highlight character development
- Connect to larger plot and themes
- Use vivid, specific language

VALIDATION CRITERIA:
- Summary is 100-250 words
- Covers setting, action, emotion, significance
- Keywords capture key elements
- Search tags categorize appropriately
- One-line pitch is clear and evocative`,
    variables: ['data', 'metadata', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Summary between 100-250 words',
      'Includes setting, action, tone, development',
      '5-8 relevant keywords',
      '3-5 categorical search tags',
      'One-line pitch captures essence'
    ]
  },

  relationships: {
    stage: 'relationships',
    template: `You are identifying relationships between this scene and other entities in the knowledge graph.

{context.project}

SCENE DATA:
{data}

SCENE METADATA:
{metadata}

AVAILABLE ENTITIES:
{context.related}

TASK: Identify meaningful relationships to other entities.

RELATIONSHIP TYPES:
- character_appears: Character appears in this scene
- takes_place_at: Scene occurs at a location
- develops_concept: Scene develops or explores a concept/theme
- part_of_episode: Scene belongs to an episode
- follows_scene: Narrative sequence relationship
- parallels_scene: Thematic or structural parallel

OUTPUT FORMAT (JSON):
{
  "relationships": [
    {
      "type": "relationship_type",
      "target": "entity name or ID",
      "targetType": "character | scene | location | concept | episode",
      "properties": {
        "nature": "description of relationship",
        "significance": "low | medium | high",
        "details": "additional context"
      },
      "confidence": 0.0-1.0,
      "reasoning": "why this relationship exists"
    }
  ]
}

GUIDELINES:
- Identify all characters who appear in the scene
- Connect to location where scene takes place
- Link to thematic concepts the scene explores
- Note narrative sequence relationships
- Identify structural or thematic parallels
- Prioritize high-impact relationships

VALIDATION CRITERIA:
- All scene participants identified
- Location relationship present if applicable
- Thematic connections are justified
- Confidence scores reflect evidence
- Reasoning is clear and specific`,
    variables: ['data', 'metadata', 'context.project', 'context.related'],
    outputFormat: 'json',
    validationCriteria: [
      'All characters in scene are linked',
      'Location relationship exists',
      'Thematic connections are relevant',
      'Sequence relationships are logical',
      'Confidence scores are appropriate'
    ]
  }
}
