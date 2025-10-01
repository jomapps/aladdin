# Quality Scorer Usage Guide

The Quality Scoring system provides multi-dimensional assessment of agent outputs using LLM-based evaluation.

## Overview

Quality assessment evaluates agent outputs across 6 dimensions:
- **Confidence** (0-100): Content quality, grammar, clarity, structure
- **Completeness** (0-100): Task completion, thoroughness, detail
- **Relevance** (0-100): Task relevance, addresses prompt, stays on topic
- **Consistency** (0-100): Matches established facts, character traits, story direction
- **Creativity** (0-100): Original ideas, compelling narrative (story/character departments)
- **Technical** (0-100): Technical standards, feasibility (video/audio/visual departments)

## Quick Start

```typescript
import { createQualityScorer } from '@/lib/agents/quality'

// Create scorer instance
const scorer = createQualityScorer({
  enableCache: true,
  cacheTTL: 3600, // 1 hour
})

// Assess quality
const assessment = await scorer.assessQuality({
  content: agentOutput,
  departmentId: 'story',
  task: 'Create compelling opening scene',
  expectedOutcome: 'Strong narrative hook that engages audience',
  projectContext: {
    genre: 'thriller',
    setting: 'modern urban',
    tone: 'dark and suspenseful',
  },
})

// Check result
console.log('Overall Score:', assessment.overallScore)
console.log('Decision:', assessment.decision)
console.log('Feedback:', assessment.suggestions)

// Handle decision
switch (assessment.decision) {
  case 'REJECT':
    // Critical issues - regenerate with different approach
    console.error('Critical issues:', assessment.issues)
    break
  case 'RETRY':
    // Needs improvement - regenerate with feedback
    console.warn('Needs revision:', assessment.suggestions)
    break
  case 'ACCEPT':
    // Meets standards - proceed
    console.log('Accepted with minor suggestions:', assessment.suggestions)
    break
  case 'EXEMPLARY':
    // Exceptional quality - use as example
    console.log('Exemplary output!')
    break
}
```

## Department-Specific Scoring

Different departments have different quality priorities:

### Story Department
```typescript
const assessment = await scorer.assessQuality({
  content: storyOutput,
  departmentId: 'story',
  task: 'Develop Act 2 plot points',
  expectedOutcome: 'Compelling story progression with rising tension',
})

// Story weights: Creativity 25%, Consistency 25%, Completeness 20%
// Emphasizes narrative creativity and story coherence
```

### Character Department
```typescript
const assessment = await scorer.assessQuality({
  content: characterProfile,
  departmentId: 'character',
  task: 'Create protagonist character profile',
  expectedOutcome: 'Well-rounded character with clear motivations',
  projectContext: {
    existingCharacters: [...],
    storyThemes: [...],
  },
})

// Character weights: Consistency 30%, Completeness 25%, Creativity 20%
// Emphasizes character consistency and development
```

### Visual Department
```typescript
const assessment = await scorer.assessQuality({
  content: visualDesign,
  departmentId: 'visual',
  task: 'Design key scene visual style',
  expectedOutcome: 'Cohesive visual aesthetic matching story tone',
})

// Visual weights: Technical 30%, Creativity 25%, Consistency 20%
// Emphasizes technical quality and visual creativity
```

### Video Department
```typescript
const assessment = await scorer.assessQuality({
  content: videoSpecifications,
  departmentId: 'video',
  task: 'Define video production specs',
  expectedOutcome: 'Production-ready video specifications',
})

// Video weights: Technical 35%, Completeness 25%, Consistency 20%
// Emphasizes technical standards and completeness
```

### Audio Department
```typescript
const assessment = await scorer.assessQuality({
  content: audioDesign,
  departmentId: 'audio',
  task: 'Create sound design for scene',
  expectedOutcome: 'Immersive audio environment',
})

// Audio weights: Technical 40%, Completeness 25%, Consistency 20%
// Emphasizes technical audio quality above all
```

### Production Department
```typescript
const assessment = await scorer.assessQuality({
  content: productionPlan,
  departmentId: 'production',
  task: 'Develop production schedule',
  expectedOutcome: 'Comprehensive production timeline',
})

// Production weights: Technical 30%, Completeness 30%, Relevance 20%
// Emphasizes completeness and production standards
```

## Quality Decisions

The system makes decisions based on threshold rules:

### REJECT (< 60)
Critical issues, output cannot be used. Requires complete regeneration.

```typescript
if (assessment.decision === 'REJECT') {
  console.error('Critical quality issues:')
  assessment.issues.forEach(issue => console.error(`- ${issue}`))

  // Regenerate with different approach
  await regenerateWithDifferentPrompt()
}
```

### RETRY (60-74)
Needs improvement. Request revision with specific feedback.

```typescript
if (assessment.decision === 'RETRY') {
  console.warn('Quality below threshold. Requesting revision...')
  console.warn('Issues:', assessment.issues)
  console.warn('Suggestions:', assessment.suggestions)

  // Regenerate with feedback
  await regenerateWithFeedback({
    issues: assessment.issues,
    suggestions: assessment.suggestions,
  })
}
```

### ACCEPT (75-89)
Meets standards. Output approved, minor improvements optional.

```typescript
if (assessment.decision === 'ACCEPT') {
  console.log('Output approved!')

  if (assessment.suggestions.length > 0) {
    console.log('Optional improvements:', assessment.suggestions)
  }

  // Proceed with output
  await ingestOutput(content)
}
```

### EXEMPLARY (90-100)
Exceptional quality. Can be used as example for future tasks.

```typescript
if (assessment.decision === 'EXEMPLARY') {
  console.log('Exceptional quality achieved!')

  // Store as example
  await storeAsExample({
    content,
    assessment,
    departmentId: 'story',
  })

  // Proceed with output
  await ingestOutput(content)
}
```

## Advanced Features

### Quick Check
Fast quality check without detailed dimensions:

```typescript
const quickScore = await scorer.quickCheck(content, 'story')

if (quickScore >= 75) {
  // Proceed to full assessment
  const fullAssessment = await scorer.assessQuality({
    content,
    departmentId: 'story',
  })
}
```

### Consistency-Only Check
Check consistency with existing project data:

```typescript
const consistencyScore = await scorer.checkConsistency(
  newCharacterProfile,
  {
    existingCharacters: project.characters,
    storyArcs: project.storyArcs,
    worldRules: project.worldBuilding,
  },
  'character'
)

if (consistencyScore < 75) {
  console.warn('Consistency issues detected')
}
```

### Caching
Quality assessments are cached to avoid redundant LLM calls:

```typescript
// First call - hits LLM
const assessment1 = await scorer.assessQuality({
  content,
  departmentId: 'story',
  cacheKey: 'story-scene-001', // Optional custom key
})

// Second call with same content - uses cache
const assessment2 = await scorer.assessQuality({
  content,
  departmentId: 'story',
  cacheKey: 'story-scene-001',
})

// Clear cache when needed
await scorer.clearCache('story-scene-001')
await scorer.clearCache() // Clear all
```

### Cache Statistics
Monitor cache performance:

```typescript
const stats = await scorer.getCacheStats()

console.log('Total cached assessments:', stats.totalKeys)
console.log('By department:', stats.keysByDepartment)
```

## Integration with Agent Execution

### Department Head Review
```typescript
class DepartmentHead {
  private scorer: QualityScorer

  async reviewSpecialistOutput(
    specialistId: string,
    output: string,
    task: string
  ): Promise<ReviewResult> {
    const assessment = await this.scorer.assessQuality({
      content: output,
      departmentId: this.departmentId,
      task,
      level: 'specialist',
    })

    // Emit event
    this.eventEmitter.emit('specialist-reviewed', {
      specialistId,
      assessment,
    })

    if (assessment.decision === 'REJECT' || assessment.decision === 'RETRY') {
      // Request revision
      return {
        approved: false,
        feedback: {
          issues: assessment.issues,
          suggestions: assessment.suggestions,
        },
      }
    }

    return {
      approved: true,
      qualityScore: assessment.overallScore,
    }
  }
}
```

### Orchestrator Final Review
```typescript
class DynamicAgentOrchestrator {
  private scorer: QualityScorer

  async validateFinalOutput(
    departmentOutputs: DepartmentOutput[]
  ): Promise<ValidationResult> {
    // Aggregate department scores
    const scores = await Promise.all(
      departmentOutputs.map(async (dept) => {
        const assessment = await this.scorer.assessQuality({
          content: JSON.stringify(dept.outputs),
          departmentId: dept.id,
          level: 'department',
        })
        return assessment.overallScore
      })
    )

    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length

    return {
      overallQuality: overallScore,
      recommendation: overallScore >= 75 ? 'ingest' : 'revision',
    }
  }
}
```

## Best Practices

1. **Always provide context**: Include task description and expected outcome for better assessment
2. **Use project context**: Pass existing project data for consistency checking
3. **Cache wisely**: Use custom cache keys for deterministic content
4. **Monitor decisions**: Track REJECT/RETRY rates to improve agent prompts
5. **Store exemplary outputs**: Use high-quality outputs as examples for future tasks
6. **Review thresholds**: Adjust department weights if needed for your use case

## Configuration

### Custom Configuration
```typescript
const scorer = createQualityScorer({
  enableCache: true,
  cacheTTL: 7200, // 2 hours
  temperature: 0.2, // Lower = more consistent
  maxTokens: 2000,
})
```

### Environment Variables
```bash
# Redis (for caching)
REDIS_URL=redis://localhost:6379

# LLM Configuration
OPENROUTER_API_KEY=your_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
```

## Error Handling

```typescript
try {
  const assessment = await scorer.assessQuality({
    content,
    departmentId: 'story',
  })
} catch (error) {
  console.error('Quality assessment failed:', error)

  // Fallback to simple validation
  const isValid = await simpleValidation(content)

  if (!isValid) {
    throw new Error('Output validation failed')
  }
}
```

## Performance

- **LLM calls**: ~1-3 seconds per assessment
- **Cache hits**: ~10ms
- **Quick checks**: ~500ms
- **Consistency checks**: ~1 second

## Related Documentation

- [Dynamic Agents Architecture](/docs/architecture/dynamic-agents-architecture.md)
- [Data Preparation Agent](/docs/agents/data-preparation-agent-usage.md)
- [LLM Client](/src/lib/llm/client.ts)
