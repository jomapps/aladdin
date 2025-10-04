# Qualification System Refactoring - AladdinAgentRunner Integration

## Overview
Successfully refactored the qualification system to use `AladdinAgentRunner` instead of direct LLM calls, ensuring consistency with the rest of the Aladdin platform.

## Changes Made

### 1. **orchestrator.ts** - Main Orchestrator File

#### Added Imports
```typescript
import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner';
import { getPayloadClient } from '@/lib/payload';
```

#### Refactored Functions

##### `executeWorldDepartment()`
- **Agent Used**: `story-head-001` (Story Department Head for world building)
- **Changes**:
  - Initialize PayloadCMS client
  - Create AladdinAgentRunner instance with OpenRouter API key
  - Load world department agent from CMS using slug query
  - Build comprehensive context prompt with gather data
  - Execute agent with proper context (projectId, conversationId, metadata)
  - Process agent output and merge with qualified data
  - Store agent results in `agent_qualified` field

##### `executeVisualDepartment()`
- **Agent Used**: `visual-head-001` (Visual Department Head)
- **Changes**:
  - Initialize PayloadCMS client and AladdinAgentRunner
  - Load visual department agent from CMS
  - Build visual qualification context prompt
  - Execute agent for visual guidelines generation
  - Merge agent output with qualified data
  - Store results with visual guidelines metadata

##### `executePhaseB()` - Story Department
- **Agent Used**: `story-head-001` (Story Department Head)
- **Changes**:
  - Load story department agent from CMS
  - Build comprehensive context with Phase A results (character, world, visual data)
  - Execute agent with full context for screenplay generation
  - Process and store qualified data with screenplay output
  - Include context data in metadata

##### `executeCharacterDepartment()`
- **No Changes Required**: Already uses specialized `CharacterDepartment` class for 360° image generation pipeline
- Uses FAL.ai services directly for image generation (not LLM-based)

#### Updated Data Processing Functions

##### `processWorldData()`
```typescript
function processWorldData(data: any[], agentOutput?: any): any[] {
  return data.map(item => ({
    ...item,
    qualified: true,
    qualified_at: new Date().toISOString(),
    agent_qualified: agentOutput ? {
      storyBible: agentOutput,
      processedBy: 'story-head-001'
    } : undefined
  }));
}
```

##### `processVisualData()`
```typescript
function processVisualData(data: any[], agentOutput?: any): any[] {
  return data.map(item => ({
    ...item,
    qualified: true,
    qualified_at: new Date().toISOString(),
    agent_qualified: agentOutput ? {
      visualGuidelines: agentOutput,
      processedBy: 'visual-head-001'
    } : undefined
  }));
}
```

##### `processStoryData()`
```typescript
function processStoryData(data: any[], context: { characterData?: any[], worldData?: any[] }, agentOutput?: any): any[] {
  return data.map(item => ({
    ...item,
    qualified: true,
    qualified_at: new Date().toISOString(),
    context_applied: true,
    agent_qualified: agentOutput ? {
      screenplay: agentOutput,
      processedBy: 'story-head-001',
      contextData: context
    } : undefined
  }));
}
```

### 2. **types.ts** - Type Definitions

#### Added Agent-Related Types
```typescript
import type { AgentExecutionContext as BaseAgentExecutionContext, AgentExecutionResult } from '@/lib/agents/AladdinAgentRunner'

/**
 * Extended agent execution context for qualification
 */
export interface QualificationAgentContext extends BaseAgentExecutionContext {
  gatherDbName?: string
  qualifiedDbName?: string
  phase?: 'character' | 'world-building' | 'visual-design' | 'story-development' | 'other'
}

/**
 * Agent execution result for qualification tasks
 */
export interface QualificationAgentResult extends AgentExecutionResult {
  department: string
  qualifiedData?: any
}
```

## Agent Mapping

| Department | Agent ID | Agent Name | Purpose |
|------------|----------|------------|---------|
| **World** | `story-head-001` | Story Department Head | Generates story bible, world rules, locations, timeline |
| **Visual** | `visual-head-001` | Visual Department Head | Creates visual guidelines, color palettes, style guide |
| **Story** | `story-head-001` | Story Department Head | Generates screenplay and scene breakdowns with context |
| **Character** | N/A (specialized pipeline) | CharacterDepartment class | 360° image generation using FAL.ai |

## Execution Flow

### Phase A (Parallel)
1. **Character**: Uses `CharacterDepartment` class → FAL.ai pipeline
2. **World**: Uses `AladdinAgentRunner` → `story-head-001` agent
3. **Visual**: Uses `AladdinAgentRunner` → `visual-head-001` agent

### Phase B (Sequential - depends on Phase A)
1. **Story**: Uses `AladdinAgentRunner` → `story-head-001` agent
   - Receives character, world, and visual data from Phase A
   - Generates screenplay with full context

### Phase C (Parallel - Other Departments)
1. Uses generic processing (no agent execution currently)

### Phase D (Brain Ingestion)
1. Ingests all qualified data to brain service

## Benefits of Refactoring

1. ✅ **Consistency**: All LLM interactions now go through AladdinAgentRunner
2. ✅ **Auditability**: Agent executions are tracked in `agent-executions` collection
3. ✅ **Metrics**: Performance metrics automatically updated for each agent
4. ✅ **Retry Logic**: Built-in retry mechanism with exponential backoff
5. ✅ **Event Streaming**: Support for real-time execution events
6. ✅ **Tool Loading**: Automatic loading of department-specific tools from CMS
7. ✅ **Centralized Configuration**: Agents configured in PayloadCMS, not hardcoded
8. ✅ **Token Tracking**: Automatic token usage tracking and cost estimation

## Data Structure Enhancements

Each qualified data entry now includes:

```typescript
{
  // Original gather data fields
  ...item,

  // Qualification metadata
  qualified: true,
  qualified_at: "2025-10-04T12:30:00.000Z",
  context_applied: true, // for story phase

  // Agent execution results
  agent_qualified: {
    storyBible?: any,           // for world
    visualGuidelines?: any,     // for visual
    screenplay?: any,           // for story
    processedBy: "agent-id",    // which agent processed it
    contextData?: any           // Phase A context for story
  }
}
```

## Testing Requirements

Before deploying to production:

1. ✅ Verify agent IDs exist in PayloadCMS:
   - `story-head-001` (for world and story)
   - `visual-head-001` (for visual)

2. ✅ Test each phase execution:
   - Phase A: Character, World, Visual (parallel)
   - Phase B: Story (with Phase A context)
   - Phase C: Other departments
   - Phase D: Brain ingestion

3. ✅ Verify data structure in qualified database:
   - Check `agent_qualified` field presence
   - Verify agent outputs are properly merged

4. ✅ Check agent execution audit trail:
   - Query `agent-executions` collection
   - Verify execution metrics and events

## Environment Variables Required

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
FAL_KEY=your_fal_key
BRAIN_SERVICE_API_KEY=your_brain_key
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
```

## Migration Notes

- **No Breaking Changes**: The API routes remain unchanged
- **Database Schema**: No schema changes required
- **Backward Compatibility**: Old qualified data without `agent_qualified` field will still work
- **Character Department**: No changes to existing 360° image pipeline

## Next Steps

1. Monitor agent execution performance in production
2. Fine-tune agent prompts based on output quality
3. Consider adding more specialized agents for Phase C departments
4. Implement quality scoring based on agent outputs
5. Add visualization for agent execution metrics

## Files Modified

1. `/src/lib/qualification/orchestrator.ts` - Main orchestrator logic
2. `/src/lib/qualification/types.ts` - Type definitions
3. `/docs/refactoring/qualification-agent-runner-refactor.md` - This documentation

## Files Reviewed (No Changes)

1. `/src/lib/qualification/characterDepartment.ts` - Uses specialized image pipeline
2. `/src/app/api/projects/[id]/qualify/route.ts` - API route unchanged

---

**Refactoring Completed**: 2025-10-04
**Specialist**: Qualification System Refactoring Specialist
