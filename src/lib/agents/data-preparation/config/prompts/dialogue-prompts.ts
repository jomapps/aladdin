/**
 * Dialogue Entity Prompts
 * LLM prompt templates for dialogue metadata extraction and analysis
 */

import { PromptTemplate } from './template-utils'

export const dialoguePrompts: Record<string, PromptTemplate> = {
  analyze: {
    stage: 'analyze',
    template: `You are analyzing dialogue data for a narrative project.

{context.project}

INPUT DATA:
{data}

TASK: Analyze this dialogue and determine:
1. Dialogue classification (exposition, conflict, revelation, character development)
2. Emotional tone and subtext
3. Narrative function
4. Preliminary metadata structure needed

OUTPUT FORMAT (JSON):
{
  "dialogueType": "exposition | conflict | revelation | character-development | other",
  "emotionalTone": "emotional quality",
  "subtext": "underlying meaning or tension",
  "narrativeFunction": "purpose in story",
  "dataQuality": "high" | "medium" | "low",
  "confidence": 0.0-1.0,
  "recommendedFields": ["field1", "field2"],
  "reasoning": "explanation of classification"
}

VALIDATION CRITERIA:
- dialogueType captures primary function
- emotionalTone is specific and accurate
- subtext reveals deeper meaning
- narrativeFunction is clear`,
    variables: ['data', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Appropriate dialogue type',
      'Specific emotional tone',
      'Meaningful subtext analysis',
      'Clear narrative function'
    ]
  },

  extract: {
    stage: 'extract',
    template: `You are extracting comprehensive metadata for dialogue in a narrative project.

{context.project}

DIALOGUE DATA:
{data}

CONTEXT:
{context.related}

TASK: Extract detailed dialogue metadata according to the schema.

METADATA SCHEMA:
{
  "speaker": "character name",
  "dialogueType": "exposition | conflict | revelation | character-development",
  "emotionalTone": "emotional quality",
  "subtext": "underlying meaning",
  "narrativeFunction": "purpose in story",
  "characterVoice": "distinctive speech patterns",
  "thematicResonance": ["theme1", "theme2"],
  "quotableLines": ["line1", "line2"],
  "relationshipDynamics": "what it reveals about relationships"
}

OUTPUT FORMAT (JSON):
Return ONLY the metadata object with all applicable fields filled.

GUIDELINES:
- Identify speaker and dialogue type
- Capture emotional tone and subtext
- Note narrative function (advance plot, reveal character, etc.)
- Identify distinctive voice/speech patterns
- Connect to thematic elements
- Extract quotable or significant lines
- Analyze what dialogue reveals about relationships

VALIDATION CRITERIA:
- Speaker is identified correctly
- Dialogue type matches content
- Subtext analysis is insightful
- Thematic connections are relevant
- Quotable lines are truly significant`,
    variables: ['data', 'context.project', 'context.related'],
    outputFormat: 'json',
    examples: [
      {
        input: {
          text: '"You think catching him will bring her back?" Chen asked softly. Smith stared at the case file. "No. But maybe I can sleep again."',
          scene: 'Scene 5 - Chen and Smith in car',
          characters: ['Sarah Chen', 'John Smith']
        },
        output: {
          speaker: 'Sarah Chen and John Smith',
          dialogueType: 'character-development',
          emotionalTone: 'Quiet, intimate, painful honesty',
          subtext: 'Chen probing Smith\'s true motivations; Smith admitting guilt drives him',
          narrativeFunction: 'Reveals Smith\'s internal pain and real reason for obsession',
          characterVoice: 'Chen: gentle, direct questions. Smith: terse, revealing vulnerability',
          thematicResonance: ['guilt', 'redemption', 'loss', 'truth'],
          quotableLines: [
            '"You think catching him will bring her back?"',
            '"No. But maybe I can sleep again."'
          ],
          relationshipDynamics: 'Chen creating safe space for Smith to be honest; deepening trust'
        }
      }
    ],
    validationCriteria: [
      'Speakers correctly identified',
      'Type reflects content',
      'Subtext is meaningful',
      'Character voice distinctive',
      'Quotable lines are significant'
    ]
  },

  summarize: {
    stage: 'summarize',
    template: `You are creating a comprehensive summary for dialogue that will be used for search and retrieval.

{context.project}

DIALOGUE DATA:
{data}

EXTRACTED METADATA:
{metadata}

TASK: Create a rich, searchable summary that captures:
1. Speaker(s) and context
2. Content and subtext
3. Emotional quality
4. Narrative and thematic significance
5. Relationship dynamics revealed

The summary should be 75-150 words and optimized for semantic search.

OUTPUT FORMAT (JSON):
{
  "summary": "comprehensive summary text",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "searchTags": ["tag1", "tag2", "tag3"],
  "oneLinePitch": "single sentence dialogue description"
}

GUIDELINES:
- Identify speakers and context
- Capture both content and subtext
- Note emotional quality
- Explain narrative significance
- Highlight thematic resonance
- Note relationship dynamics

VALIDATION CRITERIA:
- Summary is 75-150 words
- Captures content, subtext, significance
- Keywords are relevant
- Tags categorize effectively
- One-line pitch is clear`,
    variables: ['data', 'metadata', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Summary between 75-150 words',
      'Covers speakers, content, subtext, significance',
      '4-8 relevant keywords',
      '2-4 categorical tags',
      'One-line pitch captures essence'
    ]
  },

  relationships: {
    stage: 'relationships',
    template: `You are identifying relationships between this dialogue and other entities in the knowledge graph.

{context.project}

DIALOGUE DATA:
{data}

DIALOGUE METADATA:
{metadata}

AVAILABLE ENTITIES:
{context.related}

TASK: Identify meaningful relationships to other entities.

RELATIONSHIP TYPES:
- spoken_by_character: Character speaks this dialogue
- occurs_in_scene: Dialogue is part of scene
- reveals_concept: Dialogue illuminates concept/theme
- develops_relationship: Dialogue develops character relationship
- references_location: Dialogue mentions or relates to location

OUTPUT FORMAT (JSON):
{
  "relationships": [
    {
      "type": "relationship_type",
      "target": "entity name or ID",
      "targetType": "character | scene | location | concept",
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
- Link to speaking characters
- Connect to containing scene
- Identify thematic concepts revealed
- Note relationship developments
- Reference locations mentioned

VALIDATION CRITERIA:
- All speakers linked
- Scene relationship present
- Thematic connections justified
- Relationship dynamics accurate`,
    variables: ['data', 'metadata', 'context.project', 'context.related'],
    outputFormat: 'json',
    validationCriteria: [
      'Speaker relationships complete',
      'Scene connection present',
      'Thematic links justified',
      'Relationship dynamics clear'
    ]
  }
}
