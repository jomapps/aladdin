/**
 * Location Entity Prompts
 * LLM prompt templates for location metadata extraction and analysis
 */

import { PromptTemplate } from './template-utils'

export const locationPrompts: Record<string, PromptTemplate> = {
  analyze: {
    stage: 'analyze',
    template: `You are analyzing location data for a narrative project.

{context.project}

INPUT DATA:
{data}

TASK: Analyze this location and determine:
1. Location classification (interior, exterior, mixed)
2. Narrative significance in the story
3. Atmospheric qualities
4. Preliminary metadata structure needed

OUTPUT FORMAT (JSON):
{
  "locationType": "interior" | "exterior" | "mixed",
  "significance": "low" | "medium" | "high",
  "atmosphere": "atmospheric description",
  "dataQuality": "high" | "medium" | "low",
  "confidence": 0.0-1.0,
  "recommendedFields": ["field1", "field2"],
  "reasoning": "explanation of classification"
}

VALIDATION CRITERIA:
- locationType must be one of three valid types
- significance should reflect narrative importance
- atmosphere should be evocative and specific
- reasoning should justify the classification`,
    variables: ['data', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Valid locationType',
      'Appropriate significance level',
      'Evocative atmosphere description',
      'Clear reasoning'
    ]
  },

  extract: {
    stage: 'extract',
    template: `You are extracting comprehensive metadata for a location in a narrative project.

{context.project}

LOCATION DATA:
{data}

CONTEXT:
{context.related}

EXISTING LOCATIONS: {context.brain}

TASK: Extract detailed location metadata according to the schema.

METADATA SCHEMA:
{
  "locationType": "interior | exterior | mixed",
  "atmosphere": "mood and feeling of location",
  "significance": "low | medium | high",
  "timeOfDay": "when location is typically seen",
  "weather": "typical weather conditions (if exterior)",
  "soundscape": "characteristic sounds",
  "visualElements": ["element1", "element2"],
  "sceneCount": number (if known)
}

OUTPUT FORMAT (JSON):
Return ONLY the metadata object with all applicable fields filled.

GUIDELINES:
- Classify as interior, exterior, or mixed space
- Describe atmosphere using sensory details
- Rate significance based on narrative role
- Note typical time of day when shown
- Describe weather if exterior or visible through windows
- Identify characteristic soundscape
- List 4-8 distinctive visual elements
- Count approximate scene appearances if data available

VALIDATION CRITERIA:
- Location type matches description
- Atmosphere is vivid and specific
- Significance reflects narrative importance
- Visual elements are concrete and distinctive
- Soundscape enhances atmospheric understanding`,
    variables: ['data', 'context.project', 'context.related', 'context.brain'],
    outputFormat: 'json',
    examples: [
      {
        input: {
          name: 'Smith\'s Apartment',
          description: 'Small, cluttered detective\'s apartment',
          notes: 'Where Smith lives alone, surrounded by case files'
        },
        output: {
          locationType: 'interior',
          atmosphere: 'Isolated, claustrophobic, obsessive; mirrors Smith\'s mental state',
          significance: 'high',
          timeOfDay: 'late night / early morning',
          weather: 'n/a',
          soundscape: 'Police radio static, city noise through thin walls, ticking clock',
          visualElements: [
            'Case files covering walls',
            'Unmade bed in corner',
            'Single window with broken blinds',
            'Police radio on kitchen counter',
            'Empty whiskey bottles',
            'Photos pinned to makeshift investigation board'
          ],
          sceneCount: 12
        }
      }
    ],
    validationCriteria: [
      'Location type is accurate',
      'Atmosphere uses sensory details',
      'Significance justified by narrative role',
      'Visual elements are specific',
      'Soundscape enhances atmosphere'
    ]
  },

  summarize: {
    stage: 'summarize',
    template: `You are creating a comprehensive summary for a location that will be used for search and retrieval.

{context.project}

LOCATION DATA:
{data}

EXTRACTED METADATA:
{metadata}

TASK: Create a rich, searchable summary that captures:
1. Physical description and spatial qualities
2. Atmospheric characteristics
3. Narrative significance
4. Sensory details (visual, auditory)
5. Thematic or symbolic meaning

The summary should be 100-200 words and optimized for semantic search.

OUTPUT FORMAT (JSON):
{
  "summary": "comprehensive summary text",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "searchTags": ["tag1", "tag2", "tag3"],
  "oneLinePitch": "single sentence location description"
}

GUIDELINES:
- Paint a vivid picture with sensory details
- Convey atmosphere and mood
- Explain narrative significance
- Include distinctive visual elements
- Note symbolic or thematic meaning
- Make it searchable and evocative

VALIDATION CRITERIA:
- Summary is 100-200 words
- Includes physical, atmospheric, narrative elements
- Keywords capture key qualities
- Search tags categorize effectively
- One-line pitch is evocative`,
    variables: ['data', 'metadata', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Summary between 100-200 words',
      'Vivid sensory description',
      '5-8 relevant keywords',
      '3-5 categorical tags',
      'One-line pitch captures essence'
    ]
  },

  relationships: {
    stage: 'relationships',
    template: `You are identifying relationships between this location and other entities in the knowledge graph.

{context.project}

LOCATION DATA:
{data}

LOCATION METADATA:
{metadata}

AVAILABLE ENTITIES:
{context.related}

TASK: Identify meaningful relationships to other entities.

RELATIONSHIP TYPES:
- associated_with_character: Character has connection to location
- hosts_scene: Scene takes place at this location
- represents_concept: Location symbolizes or embodies concept/theme
- featured_in_episode: Location appears in episode
- spatially_adjacent: Near or connected to another location

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
- Link to characters associated with location
- Connect to all scenes that occur there
- Identify symbolic or thematic meanings
- Note spatial relationships to other locations
- Prioritize narratively significant connections

VALIDATION CRITERIA:
- All scenes at location are linked
- Character associations are justified
- Thematic connections are meaningful
- Spatial relationships are accurate
- Confidence reflects evidence strength`,
    variables: ['data', 'metadata', 'context.project', 'context.related'],
    outputFormat: 'json',
    validationCriteria: [
      'Scene relationships are complete',
      'Character associations are meaningful',
      'Symbolic connections are justified',
      'Spatial relationships are logical',
      'Significance levels are appropriate'
    ]
  }
}
