# Story Department Refactoring

## Summary
Successfully refactored the Story Department to use the `@codebuff/sdk` architecture with `AladdinAgentRunner`.

## Changes Made

### 1. Replaced Direct LLM Calls with AladdinAgentRunner

**Before:**
```typescript
import { getLLMClient } from '@/lib/llm/client'

export class StoryDepartment {
  private llm = getLLMClient()

  private async generateScreenplay(...) {
    return await this.llm.completeJSON<Screenplay>(prompt, {...})
  }
}
```

**After:**
```typescript
import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner'

export class StoryDepartment {
  private payload: any
  private runner: AladdinAgentRunner | null = null

  private async initializeRunner(): Promise<AladdinAgentRunner> {
    if (!this.runner) {
      this.payload = await getPayload({ config })
      const apiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY
      this.runner = new AladdinAgentRunner(apiKey, this.payload)
    }
    return this.runner
  }
}
```

### 2. Screenplay Generation with Agent Runner

The `generateScreenplay()` method now:
- Queries PayloadCMS for story agents (`story-screenplay-agent` or `story-department-agent`)
- Executes via `AladdinAgentRunner` instead of direct LLM calls
- Tracks execution in agent-executions collection
- Provides conversation context with `conversationId: story-screenplay-{projectSlug}`
- Includes metadata: department, phase, and story bible title

### 3. Scene Breakdown with Agent Runner

The `breakScreenplayIntoScenes()` method now:
- Queries PayloadCMS for scene breakdown agents (`scene-breakdown-agent` or `story-department-agent`)
- Executes via `AladdinAgentRunner` with proper context
- Tracks execution with `conversationId: story-scenes-{projectSlug}`
- Includes metadata: department, phase, and screenplay title

### 4. Updated Method Signatures

**Standalone function signature changed:**
```typescript
// Before
export async function breakScreenplayIntoScenes(
  screenplay: Screenplay,
  storyBible: StoryBible
): Promise<Scene[]>

// After
export async function breakScreenplayIntoScenes(
  screenplay: Screenplay,
  storyBible: StoryBible,
  projectId: string,      // NEW: Required for agent execution
  projectSlug: string     // NEW: Required for agent execution
): Promise<Scene[]>
```

## Architecture Benefits

### 1. Agent Management
- All story department operations now use registered agents from PayloadCMS
- Agents can be configured, versioned, and updated without code changes
- Performance metrics automatically tracked for each agent

### 2. Execution Tracking
- All screenplay generation and scene breakdown operations logged in `agent-executions`
- Execution history includes: prompt, output, token usage, errors, timing
- Audit trail for debugging and quality assurance

### 3. Conversation Context
- Each operation has a unique conversation ID for thread continuity
- Metadata tracks department, phase, and related content
- Enables better context understanding across executions

### 4. Tool Integration
- Agents can use custom tools registered in PayloadCMS
- Tools automatically loaded based on agent configuration
- Dynamic tool execution without code changes

### 5. Error Handling & Retries
- Automatic retry logic with exponential backoff
- Retry count tracking in execution records
- Configurable max retries per agent

## Required Agent Definitions

To use the refactored Story Department, create these agents in PayloadCMS:

### 1. Story Screenplay Agent
- **Slug:** `story-screenplay-agent`
- **Agent ID:** `story-screenplay-001` (or custom)
- **Model:** `claude-3-5-sonnet-20241022` (or preferred)
- **Department:** Story Department
- **Instructions:** Master screenwriter specializing in professional screenplay format
- **Active:** true

### 2. Scene Breakdown Agent
- **Slug:** `scene-breakdown-agent`
- **Agent ID:** `scene-breakdown-001` (or custom)
- **Model:** `claude-3-5-sonnet-20241022` (or preferred)
- **Department:** Story Department
- **Instructions:** Film editor specializing in scene breakdown for AI video generation
- **Active:** true

**Alternative:** A single `story-department-agent` can handle both tasks if configured properly.

## Migration Notes

### Breaking Changes
- The standalone `breakScreenplayIntoScenes()` function now requires `projectId` and `projectSlug` parameters
- Any code calling this function must be updated

### Environment Variables
Ensure one of these is set:
- `OPENROUTER_API_KEY` (preferred for OpenRouter)
- `ANTHROPIC_API_KEY` (for direct Anthropic API)

### Database Requirements
- PayloadCMS must have `agents`, `departments`, and `agent-executions` collections
- Agents must be properly configured and active

## Testing Recommendations

1. **Agent Creation:** Verify story agents exist in PayloadCMS
2. **API Keys:** Test with both OpenRouter and Anthropic configurations
3. **Execution Tracking:** Verify executions are logged correctly
4. **Output Parsing:** Ensure JSON parsing handles both string and object outputs
5. **Error Handling:** Test with invalid agent configurations
6. **Retry Logic:** Verify retry behavior on failures

## Future Enhancements

1. **Custom Tools:** Add screenplay-specific tools (format validation, scene timing calculator)
2. **Multi-Agent Collaboration:** Use multiple specialized agents for different screenplay aspects
3. **Quality Scoring:** Implement automatic quality assessment for generated screenplays
4. **Streaming Support:** Add real-time event streaming for long screenplay generation
5. **Template Support:** Create screenplay templates for different genres

## Files Modified

- `/src/lib/qualification/storyDepartment.ts` - Complete refactor to use AladdinAgentRunner

## Related Documentation

- [AladdinAgentRunner Documentation](/docs/agents/AladdinAgentRunner.md)
- [Agent System Architecture](/docs/architecture/agent-system.md)
- [Codebuff SDK Integration](/docs/integration/codebuff-sdk.md)
