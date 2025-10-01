/**
 * Character Entity Prompts
 * LLM prompt templates for character metadata extraction and analysis
 */

import { PromptTemplate } from './template-utils'

export const characterPrompts: Record<string, PromptTemplate> = {
  analyze: {
    stage: 'analyze',
    template: `You are analyzing character data for a narrative project.

{context.project}

INPUT DATA:
{data}

TASK: Analyze this character and determine:
1. Character classification (protagonist, antagonist, supporting, minor)
2. Core role in the narrative
3. Archetype pattern (if applicable)
4. Preliminary metadata structure needed

OUTPUT FORMAT (JSON):
{
  "characterType": "protagonist" | "antagonist" | "supporting" | "minor",
  "role": "brief role description",
  "archetypePattern": "archetype name or null",
  "dataQuality": "high" | "medium" | "low",
  "confidence": 0.0-1.0,
  "recommendedFields": ["field1", "field2"],
  "reasoning": "explanation of classification"
}

VALIDATION CRITERIA:
- characterType must be one of the four valid types
- role must be clear and specific (max 100 chars)
- confidence should reflect data quality and clarity
- reasoning should explain key classification factors`,
    variables: ['data', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Valid characterType from allowed values',
      'Clear, concise role description',
      'Confidence score between 0 and 1',
      'Reasoning provided for classification'
    ]
  },

  extract: {
    stage: 'extract',
    template: `You are extracting comprehensive metadata for a character in a narrative project.

{context.project}

CHARACTER DATA:
{data}

CONTEXT:
{context.related}

EXISTING ENTITIES IN KNOWLEDGE GRAPH:
- Total characters: {context.brain}

TASK: Extract detailed character metadata according to the schema.

METADATA SCHEMA:
{
  "characterType": "protagonist | antagonist | supporting | minor",
  "role": "character's role in story",
  "archetypePattern": "archetype (Hero, Mentor, Trickster, etc.)",
  "visualSignature": "distinctive visual characteristics",
  "personalityTraits": ["trait1", "trait2", "trait3"],
  "storyFunction": "narrative purpose",
  "thematicConnection": "connection to project themes",
  "narrativeArc": "character's journey/transformation",
  "emotionalJourney": "emotional development",
  "relationshipDynamics": {
    "characterName": "nature of relationship"
  }
}

OUTPUT FORMAT (JSON):
Return ONLY the metadata object with all applicable fields filled.

GUIDELINES:
- Use project themes and tone to inform analysis
- Identify 3-7 core personality traits
- Connect character to broader narrative themes
- Consider character's function in the story structure
- Identify key relationships with other characters
- Describe any character transformation/arc

VALIDATION CRITERIA:
- All required fields present
- Personality traits are specific and observable
- Story function is clear and purposeful
- Narrative arc describes transformation (if any)
- Relationship dynamics reference actual characters`,
    variables: ['data', 'context.project', 'context.related', 'context.brain'],
    outputFormat: 'json',
    examples: [
      {
        input: {
          name: 'John Smith',
          description: 'A weary detective haunted by past failures',
          notes: 'Main character, solving the central mystery'
        },
        output: {
          characterType: 'protagonist',
          role: 'Homicide detective investigating serial murders',
          archetypePattern: 'Wounded Warrior',
          visualSignature: 'Rumpled coat, tired eyes, stubbled jaw',
          personalityTraits: ['determined', 'guilt-ridden', 'analytical', 'empathetic', 'isolated'],
          storyFunction: 'Drive investigation, embody themes of redemption',
          thematicConnection: 'Represents guilt and the search for redemption',
          narrativeArc: 'From isolated guilt to accepting help and healing',
          emotionalJourney: 'Grief and isolation → connection → redemption',
          relationshipDynamics: {
            'Sarah Chen': 'Partner who challenges his isolation',
            'The Killer': 'Mirror of his own guilt and darkness'
          }
        }
      }
    ],
    validationCriteria: [
      'All required fields present and populated',
      'Personality traits are specific and behavioral',
      'Story function connects to narrative purpose',
      'Thematic connection aligns with project themes',
      'Narrative arc shows transformation or development'
    ]
  },

  summarize: {
    stage: 'summarize',
    template: `You are creating a comprehensive summary for a character that will be used for search and retrieval.

{context.project}

CHARACTER DATA:
{data}

EXTRACTED METADATA:
{metadata}

TASK: Create a rich, searchable summary that captures:
1. Character identity and role
2. Key personality traits and visual characteristics
3. Narrative function and thematic significance
4. Relationship dynamics
5. Character arc/journey

The summary should be 150-300 words and optimized for semantic search.

OUTPUT FORMAT (JSON):
{
  "summary": "comprehensive summary text",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "searchTags": ["tag1", "tag2", "tag3"],
  "oneLinePitch": "single sentence character description"
}

GUIDELINES:
- Write in clear, descriptive prose
- Include specific details (visual, behavioral, thematic)
- Use project-relevant terminology
- Make connections to story themes
- Highlight what makes this character unique
- Include character's emotional/narrative journey

EXAMPLE OUTPUT:
{
  "summary": "Detective John Smith is the weary protagonist haunted by a case that destroyed his career three years ago. A Wounded Warrior archetype, he embodies the project's themes of guilt and redemption. Visually distinctive with his rumpled coat and tired eyes, Smith is determined yet guilt-ridden, analytical yet empathetic. His narrative arc tracks his journey from isolated self-punishment to accepting help and finding redemption. His relationship with partner Sarah Chen challenges his isolation, while his cat-and-mouse game with the killer forces him to confront his own darkness. Smith's emotional journey moves from grief through connection to ultimate redemption.",
  "keywords": ["detective", "guilt", "redemption", "investigation", "trauma", "transformation"],
  "searchTags": ["protagonist", "wounded-warrior", "law-enforcement", "psychological", "character-arc"],
  "oneLinePitch": "A guilt-ridden detective seeking redemption through solving the case that haunts him."
}

VALIDATION CRITERIA:
- Summary is 150-300 words
- Includes character role, traits, function, and arc
- Keywords are relevant and specific
- Search tags categorize the character effectively
- One-line pitch is clear and compelling`,
    variables: ['data', 'metadata', 'context.project'],
    outputFormat: 'json',
    validationCriteria: [
      'Summary between 150-300 words',
      'Includes identity, traits, function, relationships, arc',
      '6-10 relevant keywords',
      '3-6 categorical search tags',
      'One-line pitch is concise and clear'
    ]
  },

  relationships: {
    stage: 'relationships',
    template: `You are identifying relationships between this character and other entities in the knowledge graph.

{context.project}

CHARACTER DATA:
{data}

CHARACTER METADATA:
{metadata}

AVAILABLE ENTITIES:
{context.related}

EXISTING KNOWLEDGE GRAPH:
{context.brain}

TASK: Identify meaningful relationships to other entities (characters, scenes, locations, concepts, episodes).

RELATIONSHIP TYPES:
- character_interaction: Direct interaction with another character
- appears_in_scene: Character appears in a scene
- associated_with_location: Character has connection to a location
- embodies_concept: Character represents or embodies a concept/theme
- featured_in_episode: Character appears in an episode
- character_arc_relates_to: Character development tied to concept/theme

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
- Only suggest relationships supported by the data
- Prioritize high-significance relationships
- Include confidence scores based on evidence
- Explain reasoning for each relationship
- Consider both direct and thematic connections
- Look for narrative function relationships

VALIDATION CRITERIA:
- Each relationship has a valid type
- Target entities exist in available entities
- Confidence scores are justified
- Reasoning is clear and evidence-based
- Relationships serve narrative or thematic purpose`,
    variables: ['data', 'metadata', 'context.project', 'context.related', 'context.brain'],
    outputFormat: 'json',
    examples: [
      {
        input: {
          character: 'Detective John Smith',
          metadata: { role: 'protagonist', thematicConnection: 'guilt and redemption' }
        },
        output: {
          relationships: [
            {
              type: 'character_interaction',
              target: 'Sarah Chen',
              targetType: 'character',
              properties: {
                nature: 'Professional partnership evolving into friendship',
                significance: 'high',
                details: 'Chen challenges Smith\'s isolation and guilt'
              },
              confidence: 0.95,
              reasoning: 'Explicitly stated partnership with clear character development impact'
            },
            {
              type: 'embodies_concept',
              target: 'Redemption Arc',
              targetType: 'concept',
              properties: {
                nature: 'Central character embodies redemption theme',
                significance: 'high',
                details: 'Character arc is the primary vehicle for redemption theme'
              },
              confidence: 0.9,
              reasoning: 'Character metadata explicitly connects to redemption theme'
            }
          ]
        }
      }
    ],
    validationCriteria: [
      'All relationships have valid types',
      'Target entities are from available entities',
      'Confidence scores between 0 and 1',
      'Reasoning supports the relationship claim',
      'Significance levels are appropriate'
    ]
  }
}
