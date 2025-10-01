/**
 * Concept Entity Prompts
 * LLM prompt templates for concept/theme metadata extraction and analysis
 */

import { PromptTemplate } from './template-utils'

export const conceptPrompts: Record<string, PromptTemplate> = {
  analyze: {
    stage: 'analyze',
    template: `You are analyzing concept/theme data for a narrative project.

{context.project}

INPUT DATA:
{data}

TASK: Analyze this concept and determine:
1. Concept classification (theme, motif, symbol, philosophical idea)
2. Scope and significance in narrative
3. How it manifests in the story
4. Preliminary metadata structure needed

OUTPUT FORMAT (JSON):
{
  "conceptType": "theme | motif | symbol | philosophical-idea | other",
  "scope": "project-wide | arc-specific | episodic | scene-level",
  "significance": "low | medium | high",
  "manifestation": "how concept appears in story",
  "dataQuality": "high" | "medium" | "low",
  "confidence": 0.0-1.0,
  "recommendedFields": ["field1", "field2"],
  "reasoning": "explanation of classification"
}

VALIDATION CRITERIA:
- conceptType accurately categorizes the concept
- scope reflects how widely it appears
- significance matches narrative importance
- manifestation describes concrete expression`,
    variables: ['data', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Accurate concept type',
      'Appropriate scope',
      'Justified significance',
      'Clear manifestation description'
    ]
  },

  extract: {
    stage: 'extract',
    template: `You are extracting comprehensive metadata for a concept/theme in a narrative project.

{context.project}

CONCEPT DATA:
{data}

CONTEXT:
{context.related}

EXISTING CONCEPTS: {context.brain}

TASK: Extract detailed concept metadata according to the schema.

METADATA SCHEMA:
{
  "conceptType": "theme | motif | symbol | philosophical-idea",
  "scope": "project-wide | arc-specific | episodic | scene-level",
  "significance": "low | medium | high",
  "description": "clear explanation of concept",
  "manifestations": ["how it appears 1", "how it appears 2"],
  "characterConnections": ["character1", "character2"],
  "thematicRelationships": ["related theme1", "related theme2"],
  "visualSymbols": ["symbol1", "symbol2"],
  "narrativeFunction": "role in story"
}

OUTPUT FORMAT (JSON):
Return ONLY the metadata object with all applicable fields filled.

GUIDELINES:
- Classify concept type (theme, motif, symbol, idea)
- Determine scope (how widely it appears)
- Rate significance to overall narrative
- Provide clear description of the concept
- List 3-6 concrete manifestations in story
- Identify characters connected to concept
- Note related or contrasting themes
- Identify visual symbols representing concept
- Explain narrative function

VALIDATION CRITERIA:
- Concept type is appropriate
- Scope matches appearance frequency
- Description is clear and specific
- Manifestations are concrete examples
- Character connections are meaningful`,
    variables: ['data', 'context.project', 'context.related', 'context.brain'],
    outputFormat: 'json',
    examples: [
      {
        input: {
          name: 'Redemption through Truth',
          notes: 'Central theme - characters must face truth to find redemption'
        },
        output: {
          conceptType: 'theme',
          scope: 'project-wide',
          significance: 'high',
          description: 'The idea that redemption can only come through confronting and accepting truth, no matter how painful',
          manifestations: [
            'Smith must face truth about past case failure',
            'Reed\'s lies prevent his redemption',
            'Chen\'s honesty enables her growth',
            'The killer\'s twisted truth-telling',
            'Truth as both weapon and healing force'
          ],
          characterConnections: [
            'John Smith - protagonist\'s entire arc',
            'Marcus Reed - cautionary tale of avoiding truth',
            'Sarah Chen - embodies honest approach'
          ],
          thematicRelationships: [
            'guilt and punishment',
            'lies and corruption',
            'justice vs. vengeance'
          ],
          visualSymbols: [
            'Mirrors and reflections',
            'Light breaking through darkness',
            'Case files as physical truth'
          ],
          narrativeFunction: 'Primary thematic driver; creates character conflicts and resolutions'
        }
      }
    ],
    validationCriteria: [
      'Type matches concept nature',
      'Scope is accurate',
      'Manifestations are specific',
      'Character connections exist',
      'Visual symbols are meaningful'
    ]
  },

  summarize: {
    stage: 'summarize',
    template: `You are creating a comprehensive summary for a concept/theme that will be used for search and retrieval.

{context.project}

CONCEPT DATA:
{data}

EXTRACTED METADATA:
{metadata}

TASK: Create a rich, searchable summary that captures:
1. What the concept is and means
2. How it manifests in the narrative
3. Character and plot connections
4. Thematic significance
5. Visual and symbolic representations

The summary should be 100-200 words and optimized for semantic search.

OUTPUT FORMAT (JSON):
{
  "summary": "comprehensive summary text",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "searchTags": ["tag1", "tag2", "tag3"],
  "oneLinePitch": "single sentence concept description"
}

GUIDELINES:
- Define the concept clearly
- Describe how it appears in story
- Connect to characters and plot
- Explain thematic significance
- Note symbolic representations
- Make it searchable and insightful

VALIDATION CRITERIA:
- Summary is 100-200 words
- Clear definition and manifestation
- Keywords capture essence
- Tags categorize effectively
- One-line pitch is insightful`,
    variables: ['data', 'metadata', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Summary between 100-200 words',
      'Clear concept definition',
      '5-8 relevant keywords',
      '3-5 categorical tags',
      'Insightful one-line pitch'
    ]
  },

  relationships: {
    stage: 'relationships',
    template: `You are identifying relationships between this concept and other entities in the knowledge graph.

{context.project}

CONCEPT DATA:
{data}

CONCEPT METADATA:
{metadata}

AVAILABLE ENTITIES:
{context.related}

TASK: Identify meaningful relationships to other entities.

RELATIONSHIP TYPES:
- embodied_by_character: Character embodies or represents concept
- explored_in_scene: Scene explores or demonstrates concept
- symbolized_by_location: Location symbolizes concept
- related_to_concept: Connection to another concept/theme
- developed_in_episode: Episode focuses on concept

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
- Link to characters who embody concept
- Connect to scenes that explore it
- Identify symbolic locations
- Note related/contrasting concepts
- Track episode-level development

VALIDATION CRITERIA:
- Character embodiments are meaningful
- Scene connections are specific
- Concept relationships are logical
- Symbolic connections justified`,
    variables: ['data', 'metadata', 'context.project', 'context.related'],
    outputFormat: 'json',
    validationCriteria: [
      'Character connections meaningful',
      'Scene explorations specific',
      'Concept relationships logical',
      'Symbolic links justified'
    ]
  }
}
