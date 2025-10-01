# LLM Prompt Engineering Guide
## Phase 5 Configuration Hive Mind - Data Preparation Agent

## Overview

This guide documents the comprehensive prompt template system for the Data Preparation Agent. The system provides production-ready LLM prompts for extracting, analyzing, and enriching metadata from narrative content.

## Architecture

### Prompt Structure

Each entity type has **four prompt stages**:

1. **Analyze** - Initial classification and data quality assessment
2. **Extract** - Detailed metadata extraction according to schema
3. **Summarize** - Create rich, searchable summaries
4. **Relationships** - Identify connections to other entities

### File Organization

```
/src/lib/agents/data-preparation/config/prompts/
├── index.ts                    # Central exports and utilities
├── template-utils.ts           # Rendering and validation utilities
├── character-prompts.ts        # Character entity prompts
├── scene-prompts.ts           # Scene entity prompts
├── location-prompts.ts        # Location entity prompts
├── episode-prompts.ts         # Episode entity prompts
├── dialogue-prompts.ts        # Dialogue entity prompts
└── concept-prompts.ts         # Concept/theme entity prompts
```

## Entity Types

### 1. Character Prompts

**Use Cases:**
- Extract protagonist, antagonist, supporting character metadata
- Analyze character arcs and transformations
- Identify personality traits and story functions
- Map relationship dynamics

**Key Metadata Fields:**
- `characterType`: protagonist | antagonist | supporting | minor
- `archetypePattern`: Hero, Mentor, Trickster, Shadow, etc.
- `personalityTraits`: Array of observable traits
- `narrativeArc`: Character journey/transformation
- `relationshipDynamics`: Connections to other characters

**Example Usage:**
```typescript
import { getPromptTemplate, renderPrompt } from './config/prompts'

const template = getPromptTemplate('character', 'extract')
const prompt = renderPrompt(template, {
  data: characterData,
  context: {
    project: projectInfo,
    payload: payloadData,
    brain: brainData,
    opendb: opendbData,
    related: relatedEntities
  }
})
```

### 2. Scene Prompts

**Use Cases:**
- Classify scene types (action, dialogue, exposition, transition)
- Analyze narrative function and plot significance
- Track character development within scenes
- Identify thematic elements

**Key Metadata Fields:**
- `sceneType`: action | dialogue | exposition | transition
- `narrativeFunction`: Scene's role in story structure
- `characterDevelopment`: Per-character development notes
- `thematicElements`: Themes explored in scene
- `pacing`: slow | medium | fast

### 3. Location Prompts

**Use Cases:**
- Catalog interior/exterior settings
- Capture atmospheric and sensory details
- Map location significance and usage
- Identify symbolic meanings

**Key Metadata Fields:**
- `locationType`: interior | exterior | mixed
- `atmosphere`: Mood and sensory qualities
- `visualElements`: Distinctive visual characteristics
- `soundscape`: Characteristic sounds
- `significance`: Narrative importance

### 4. Episode Prompts

**Use Cases:**
- Structure episode-level narrative arcs
- Track multi-threaded plots (A-story, B-story, C-story)
- Identify character focus per episode
- Map thematic development across series

**Key Metadata Fields:**
- `episodeType`: pilot | regular | finale | special
- `narrativeArc`: Complete episode story
- `plotThreads`: Multiple concurrent storylines
- `characterFocus`: Main character(s) for episode
- `cliffhanger`: Boolean for episode ending type

### 5. Dialogue Prompts

**Use Cases:**
- Analyze dialogue subtext and emotional tone
- Extract quotable lines
- Map character voice and speech patterns
- Identify relationship dynamics in conversation

**Key Metadata Fields:**
- `dialogueType`: exposition | conflict | revelation | character-development
- `subtext`: Underlying meaning
- `characterVoice`: Distinctive speech patterns
- `quotableLines`: Significant memorable lines
- `relationshipDynamics`: What dialogue reveals

### 6. Concept Prompts

**Use Cases:**
- Document themes, motifs, and philosophical ideas
- Track thematic manifestations across narrative
- Map concept-character connections
- Identify visual and symbolic representations

**Key Metadata Fields:**
- `conceptType`: theme | motif | symbol | philosophical-idea
- `scope`: project-wide | arc-specific | episodic | scene-level
- `manifestations`: How concept appears in story
- `visualSymbols`: Visual representations
- `narrativeFunction`: Role in overall story

## Prompt Design Principles

### 1. Context-Awareness

All prompts include project context:
```
PROJECT INFORMATION:
- Name: Project name
- Type: movie | series
- Genre: Array of genres
- Tone: Overall tone
- Themes: Primary themes
- Phase: expansion | compacting | complete
```

### 2. Variable Substitution

Templates use these placeholders:
- `{data}` - The entity data being processed
- `{context.project}` - Project metadata
- `{context.payload}` - Payload CMS data
- `{context.brain}` - Knowledge graph data
- `{context.opendb}` - OpenDB collections
- `{context.related}` - Related entities
- `{metadata}` - Previously extracted metadata

### 3. Output Format Specification

All prompts specify JSON output with exact schema:
```json
{
  "field1": "value",
  "field2": ["array", "values"],
  "field3": {
    "nested": "object"
  }
}
```

### 4. Few-Shot Learning

Extract and relationship prompts include examples:
```typescript
examples: [
  {
    input: { /* example input */ },
    output: { /* expected output */ }
  }
]
```

### 5. Validation Criteria

Each prompt includes validation requirements:
- Required fields and data types
- Value constraints (min/max, enums)
- Quality criteria
- Reasoning requirements

## Usage Guide

### Basic Usage

```typescript
import {
  getPromptTemplate,
  renderPrompt,
  extractJSON
} from '@/lib/agents/data-preparation/config/prompts'

// 1. Get the appropriate prompt
const template = getPromptTemplate('character', 'extract')

// 2. Render with context
const prompt = renderPrompt(template, {
  data: inputData,
  context: contextData
})

// 3. Send to LLM
const response = await llm.generateText({
  model: 'claude-3-5-sonnet-20241022',
  prompt
})

// 4. Extract JSON from response
const metadata = extractJSON(response.text)
```

### Advanced: Custom Context

```typescript
import { buildContextString, buildCompactContext } from './config/prompts'

// Build rich context string
const contextStr = buildContextString(context)

// Or build token-efficient compact context
const compactStr = buildCompactContext(context, 500) // max 500 chars

// Use in prompt
const customPrompt = template.template
  .replace('{data}', JSON.stringify(data))
  .replace('{context}', contextStr)
```

### Validation

```typescript
import { createValidationSection } from './config/prompts'

// Get validation criteria for prompt
const criteria = template.validationCriteria || []
const validationSection = createValidationSection(criteria)

// Append to prompt
const fullPrompt = prompt + '\n\n' + validationSection
```

## Best Practices

### 1. Token Efficiency

- Use `buildCompactContext()` for large datasets
- Consider prompt caching for repeated context
- Trim unnecessary fields from context

### 2. Error Handling

```typescript
try {
  const metadata = extractJSON(response.text)
} catch (error) {
  // Handle malformed JSON
  console.error('Failed to parse LLM response:', error)
  // Retry with validation section appended
}
```

### 3. Confidence Scoring

All analyze and relationship prompts include confidence scores (0.0-1.0):
- Use to filter low-confidence results
- Re-process low-confidence extractions
- Track accuracy over time

### 4. Iterative Refinement

For complex entities, use staged approach:
1. Analyze → determine quality and fields needed
2. Extract → get detailed metadata
3. Summarize → create searchable summary
4. Relationships → identify connections

### 5. Caching Strategy

Cache rendered prompts for entity type + stage combinations:
```typescript
const cacheKey = `prompt:${entityType}:${stage}:${projectId}`
const cachedPrompt = await cache.get(cacheKey)
if (!cachedPrompt) {
  const prompt = renderPrompt(template, context)
  await cache.set(cacheKey, prompt, TTL)
}
```

## LLM Configuration

### Recommended Settings

**Model:** Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)

**Parameters:**
```typescript
{
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,  // Low for consistent extraction
  max_tokens: 4096,  // Sufficient for detailed metadata
  top_p: 0.95
}
```

**For Analysis (higher creativity):**
```typescript
{
  temperature: 0.5,
  max_tokens: 2048
}
```

**For Extraction (consistency):**
```typescript
{
  temperature: 0.2,
  max_tokens: 4096
}
```

### System Messages

Use role-specific system messages:
```typescript
import { createSystemMessage } from './config/prompts'

const systemMsg = createSystemMessage(
  'Narrative Metadata Extraction Specialist',
  [
    'Extract detailed character metadata from narrative content',
    'Analyze story structure and thematic elements',
    'Identify relationships between narrative entities',
    'Provide confidence scores for inferences'
  ]
)
```

## Quality Assurance

### Validation Checklist

For each prompt response:
- [ ] Valid JSON structure
- [ ] All required fields present
- [ ] Field types match schema
- [ ] Enum values are valid
- [ ] Confidence scores between 0-1
- [ ] Reasoning provided where required
- [ ] Arrays have appropriate length
- [ ] Relationships reference valid entities

### Monitoring

Track these metrics:
- Parse success rate (valid JSON)
- Field completion rate
- Average confidence scores
- Relationship accuracy
- Token usage per entity type
- Processing time per stage

## Troubleshooting

### Common Issues

**1. Malformed JSON Response**
- Ensure prompt specifies JSON output clearly
- Use `extractJSON()` utility (handles markdown blocks)
- Add validation section to prompt
- Lower temperature for more consistent formatting

**2. Missing Required Fields**
- Check that schema is clear in prompt
- Provide examples with all fields populated
- Use validation criteria section
- Re-prompt with specific field requirements

**3. Low Confidence Scores**
- Input data may be incomplete
- Context may be insufficient
- Entity type classification may be wrong
- Consider running analyze stage first

**4. Irrelevant Relationships**
- Tighten relationship type definitions
- Require reasoning for each relationship
- Filter by confidence threshold (>0.7)
- Validate against available entities

## Future Enhancements

### Planned Features

1. **Dynamic Prompt Optimization**
   - A/B test prompt variations
   - Automatically refine based on validation failures
   - Personalize prompts per project genre

2. **Multi-Model Support**
   - Adapter pattern for different LLM providers
   - Model-specific prompt optimization
   - Fallback to backup models

3. **Prompt Versioning**
   - Track prompt template versions
   - A/B test improvements
   - Roll back if quality degrades

4. **Active Learning**
   - Collect human feedback on outputs
   - Fine-tune prompts based on corrections
   - Build domain-specific few-shot examples

## Related Documentation

- [Data Preparation Agent Usage Guide](./data-preparation-agent-usage.md)
- [Entity Configuration Reference](../research/3rd-Party-Package-Reference.md/)
- [Phase 5 Configuration Hive Mind](../idea/dynamic-agents.md)

## Support

For issues or questions about prompt templates:
1. Check validation criteria in prompt definition
2. Review examples in prompt files
3. Test with sample data
4. Adjust context provided to prompt
5. Monitor confidence scores and quality
