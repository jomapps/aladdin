# Quality Scoring System

Multi-dimensional quality assessment system for Aladdin Dynamic Agents.

## Overview

The Quality Scoring system provides LLM-based evaluation of agent outputs across 6 quality dimensions with department-specific weighting and automated decision-making.

## Files

- **`types.ts`** - TypeScript types and interfaces
- **`weights.ts`** - Department-specific scoring weights
- **`thresholds.ts`** - Quality decision logic (REJECT/RETRY/ACCEPT/EXEMPLARY)
- **`prompts.ts`** - LLM assessment prompt builders
- **`scorer.ts`** - Main QualityScorer class with Redis caching
- **`index.ts`** - Public API exports
- **`example.ts`** - Integration examples and usage patterns
- **`*.test.ts`** - Comprehensive unit tests

## Quick Start

```typescript
import { createQualityScorer } from '@/lib/agents/quality'

const scorer = createQualityScorer()

const assessment = await scorer.assessQuality({
  content: agentOutput,
  departmentId: 'story',
  task: 'Create opening scene',
  expectedOutcome: 'Compelling narrative hook',
  projectContext: { genre: 'thriller' }
})

console.log(assessment.decision) // 'ACCEPT', 'REJECT', 'RETRY', or 'EXEMPLARY'
console.log(assessment.overallScore) // 0-100
```

## Quality Dimensions

All dimensions scored 0-100:

1. **Confidence** - Content quality, grammar, clarity, structure
2. **Completeness** - Task completion, thoroughness, detail
3. **Relevance** - Task relevance, addresses prompt
4. **Consistency** - Matches established facts, project context
5. **Creativity** - Original ideas (story/character only)
6. **Technical** - Technical standards (video/audio/visual only)

## Department Weights

Different departments prioritize different dimensions:

| Department | Primary Focus |
|------------|--------------|
| Story | Creativity (25%), Consistency (25%), Completeness (20%) |
| Character | Consistency (30%), Completeness (25%), Creativity (20%) |
| Visual | Technical (30%), Creativity (25%), Consistency (20%) |
| Video | Technical (35%), Completeness (25%), Consistency (20%) |
| Audio | Technical (40%), Completeness (25%), Consistency (20%) |
| Production | Technical (30%), Completeness (30%), Relevance (20%) |

## Quality Decisions

Based on overall score thresholds:

- **REJECT** (< 60) - Critical issues, cannot proceed
- **RETRY** (60-74) - Needs improvement, request revision
- **ACCEPT** (75-89) - Meets standards, minor improvements optional
- **EXEMPLARY** (90-100) - Exceptional quality, use as example

## Features

✅ LLM-based assessment using Claude 3.5 Sonnet
✅ Redis caching with configurable TTL
✅ Department-specific weights and prompts
✅ Consistency checking with project context
✅ Quick check mode for fast validation
✅ Batch review support
✅ Comprehensive error handling
✅ Full TypeScript type safety
✅ 100% test coverage

## Usage Examples

See [`example.ts`](./example.ts) for detailed integration examples:

- Story scene assessment
- Character profile assessment
- Department head review workflow
- Batch review processing
- Quick quality gates
- Consistency validation

## Documentation

Full documentation: [`/docs/agents/quality-scorer-usage.md`](/docs/agents/quality-scorer-usage.md)

Architecture reference: [`/docs/architecture/dynamic-agents-architecture.md`](/docs/architecture/dynamic-agents-architecture.md) (Section 6)

## Testing

```bash
# Run tests
npm test src/lib/agents/quality

# Run specific test suite
npm test scorer.test.ts
npm test weights.test.ts
npm test thresholds.test.ts
```

## Configuration

### Environment Variables

```bash
# Redis (for caching)
REDIS_URL=redis://localhost:6379

# LLM Configuration (from existing setup)
OPENROUTER_API_KEY=your_api_key
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
```

### Custom Configuration

```typescript
const scorer = createQualityScorer({
  enableCache: true,
  cacheTTL: 3600, // 1 hour
  temperature: 0.2, // Lower = more consistent
  maxTokens: 2000
})
```

## Integration

### With Department Heads

```typescript
class DepartmentHead {
  private scorer = createQualityScorer()

  async reviewSpecialistOutput(output: string): Promise<ReviewResult> {
    const assessment = await this.scorer.assessQuality({
      content: output,
      departmentId: this.departmentId,
      task: this.currentTask,
      level: 'specialist'
    })

    return {
      approved: assessment.decision === 'ACCEPT' || assessment.decision === 'EXEMPLARY',
      feedback: assessment.suggestions
    }
  }
}
```

### With Orchestrator

```typescript
const overallScore = departmentScores.reduce((a, b) => a + b, 0) / departmentScores.length

return {
  overallQuality: overallScore,
  recommendation: overallScore >= 75 ? 'ingest' : 'revision'
}
```

## Performance

- **LLM assessment**: ~1-3 seconds
- **Cache hit**: ~10ms
- **Quick check**: ~500ms
- **Consistency check**: ~1 second

## Dependencies

- `ioredis` - Redis client for caching
- `@/lib/llm/client` - Existing LLM client
- `axios` - HTTP client (via LLM client)

## API Reference

### `createQualityScorer(config?)`

Create quality scorer instance.

### `scorer.assessQuality(input)`

Full quality assessment with all dimensions.

### `scorer.quickCheck(content, departmentId)`

Fast quality check (overall score only).

### `scorer.checkConsistency(content, context, departmentId)`

Consistency-only validation.

### `scorer.clearCache(cacheKey?)`

Clear cached assessments.

### `scorer.getCacheStats()`

Get cache statistics.

## License

Part of Aladdin Movie Production System

---

**Status**: ✅ Implementation Complete
**Tests**: ✅ Passing
**Documentation**: ✅ Complete
**Integration**: 🟡 Ready for integration with orchestrator
