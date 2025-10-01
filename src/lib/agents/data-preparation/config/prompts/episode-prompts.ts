/**
 * Episode Entity Prompts
 * LLM prompt templates for episode metadata extraction and analysis
 */

import { PromptTemplate } from './template-utils'

export const episodePrompts: Record<string, PromptTemplate> = {
  analyze: {
    stage: 'analyze',
    template: `You are analyzing episode data for a narrative project.

{context.project}

INPUT DATA:
{data}

TASK: Analyze this episode and determine:
1. Episode classification (pilot, regular, finale, special)
2. Narrative arc and structure
3. Primary thematic focus
4. Preliminary metadata structure needed

OUTPUT FORMAT (JSON):
{
  "episodeType": "pilot" | "regular" | "finale" | "special",
  "narrativeArc": "episode's story arc",
  "thematicFocus": ["theme1", "theme2"],
  "dataQuality": "high" | "medium" | "low",
  "confidence": 0.0-1.0,
  "recommendedFields": ["field1", "field2"],
  "reasoning": "explanation of classification"
}

VALIDATION CRITERIA:
- episodeType must be one of four valid types
- narrativeArc should describe episode's story
- thematicFocus should align with project themes
- reasoning should justify classification`,
    variables: ['data', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Valid episodeType',
      'Clear narrative arc',
      'Relevant thematic focus',
      'Justified reasoning'
    ]
  },

  extract: {
    stage: 'extract',
    template: `You are extracting comprehensive metadata for an episode in a series project.

{context.project}

EPISODE DATA:
{data}

CONTEXT:
{context.related}

EXISTING EPISODES: {context.brain}

TASK: Extract detailed episode metadata according to the schema.

METADATA SCHEMA:
{
  "episodeType": "pilot | regular | finale | special",
  "narrativeArc": "episode's complete story arc",
  "thematicFocus": ["theme1", "theme2"],
  "characterFocus": ["character1", "character2"],
  "plotThreads": ["thread1", "thread2"],
  "cliffhanger": true | false,
  "emotionalTone": "overall emotional quality"
}

OUTPUT FORMAT (JSON):
Return ONLY the metadata object with all applicable fields filled.

GUIDELINES:
- Classify episode type (pilot, regular, finale, special)
- Describe the complete narrative arc of the episode
- Identify 2-4 primary thematic elements
- List main character focuses (1-3 characters)
- Track 2-5 plot threads (A-story, B-story, etc.)
- Note if episode ends on cliffhanger
- Capture overall emotional tone

VALIDATION CRITERIA:
- Episode type matches content and position
- Narrative arc is complete and clear
- Thematic focus aligns with project
- Character focus lists actual characters
- Plot threads are distinct and identifiable
- Emotional tone captures episode feeling`,
    variables: ['data', 'context.project', 'context.related', 'context.brain'],
    outputFormat: 'json',
    examples: [
      {
        input: {
          number: 1,
          title: 'The First Case',
          synopsis: 'Detective Smith returns to work after suspension and takes on a new murder case',
          notes: 'Introduces main characters and central mystery'
        },
        output: {
          episodeType: 'pilot',
          narrativeArc: 'Smith returns to work, partners with Chen, discovers first victim connected to his past case, commits to investigation despite warnings',
          thematicFocus: ['redemption', 'guilt', 'second chances', 'partnership'],
          characterFocus: ['John Smith', 'Sarah Chen'],
          plotThreads: [
            'A-story: New murder investigation begins',
            'B-story: Smith-Chen partnership formation',
            'C-story: Hints of larger conspiracy'
          ],
          cliffhanger: true,
          emotionalTone: 'Dark, tense, cautiously hopeful'
        }
      }
    ],
    validationCriteria: [
      'Episode type is appropriate',
      'Narrative arc covers beginning to end',
      'Themes connect to project',
      'Character focus lists key characters',
      'Plot threads are identifiable',
      'Cliffhanger status is accurate'
    ]
  },

  summarize: {
    stage: 'summarize',
    template: `You are creating a comprehensive summary for an episode that will be used for search and retrieval.

{context.project}

EPISODE DATA:
{data}

EXTRACTED METADATA:
{metadata}

TASK: Create a rich, searchable summary that captures:
1. Episode number/title and type
2. Complete narrative arc
3. Character development and focus
4. Plot threads and their progression
5. Thematic elements and emotional tone

The summary should be 150-300 words and optimized for semantic search.

OUTPUT FORMAT (JSON):
{
  "summary": "comprehensive summary text",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "searchTags": ["tag1", "tag2", "tag3"],
  "oneLinePitch": "single sentence episode description"
}

GUIDELINES:
- Describe the complete episode arc
- Highlight character development moments
- Track plot thread progression
- Note thematic exploration
- Capture emotional journey
- Include key scenes or moments
- Make it spoiler-informative for production use

VALIDATION CRITERIA:
- Summary is 150-300 words
- Covers arc, characters, themes, tone
- Keywords capture key elements
- Search tags categorize effectively
- One-line pitch is compelling`,
    variables: ['data', 'metadata', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Summary between 150-300 words',
      'Complete arc coverage',
      '6-10 relevant keywords',
      '3-6 categorical tags',
      'One-line pitch captures essence'
    ]
  },

  relationships: {
    stage: 'relationships',
    template: `You are identifying relationships between this episode and other entities in the knowledge graph.

{context.project}

EPISODE DATA:
{data}

EPISODE METADATA:
{metadata}

AVAILABLE ENTITIES:
{context.related}

TASK: Identify meaningful relationships to other entities.

RELATIONSHIP TYPES:
- features_character: Character appears or is featured in episode
- contains_scene: Scene is part of this episode
- uses_location: Location appears in episode
- develops_concept: Episode explores or develops concept/theme
- follows_episode: Narrative sequence (previous episode)
- precedes_episode: Narrative sequence (next episode)
- arc_connection: Connected to multi-episode arc

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
- Link all featured characters
- Connect all scenes in episode
- Identify key locations used
- Note thematic concepts explored
- Establish episode sequence relationships
- Track multi-episode arc connections

VALIDATION CRITERIA:
- All episode characters linked
- All episode scenes connected
- Location usage is accurate
- Thematic connections justified
- Sequence relationships correct`,
    variables: ['data', 'metadata', 'context.project', 'context.related'],
    outputFormat: 'json',
    validationCriteria: [
      'Character relationships complete',
      'Scene relationships accurate',
      'Location usage tracked',
      'Sequence relationships correct',
      'Arc connections identified'
    ]
  }
}
