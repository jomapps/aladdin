# OpenRouter Integration with @codebuff/sdk

## Overview

The @codebuff/sdk supports **any OpenRouter model** by configuring the client to use OpenRouter's API endpoint instead of Anthropic's direct API.

## Current vs Required Configuration

### ❌ Current (Anthropic Direct)
```typescript
const client = new CodebuffClient({
  apiKey: process.env.CODEBUFF_API_KEY,
  cwd: cwd || process.cwd(),
})
```

### ✅ Required (OpenRouter)
```typescript
const client = new CodebuffClient({
  apiKey: process.env.OPENROUTER_API_KEY,  // Use OpenRouter API key
  baseURL: process.env.OPENROUTER_BASE_URL, // https://openrouter.ai/api/v1
  cwd: cwd || process.cwd(),
})
```

## Implementation Steps

### 1. Update Environment Variables

Add to `.env`:
```bash
# @codebuff/sdk will use OpenRouter
OPENROUTER_API_KEY=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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Optional: App identification for OpenRouter
OPENROUTER_APP_NAME=Aladdin
OPENROUTER_APP_URL=http://localhost:3000
```

### 2. Update AladdinAgentRunner

**File**: `src/lib/agents/AladdinAgentRunner.ts`

```typescript
constructor(apiKey: string, payload: Payload, cwd?: string) {
  // Use OpenRouter if configured, otherwise fallback to direct Anthropic
  const useOpenRouter = process.env.OPENROUTER_BASE_URL

  this.client = new CodebuffClient({
    apiKey: useOpenRouter
      ? process.env.OPENROUTER_API_KEY || apiKey
      : apiKey,
    baseURL: useOpenRouter
      ? process.env.OPENROUTER_BASE_URL
      : undefined,
    cwd: cwd || process.cwd(),
  })

  this.payload = payload
}
```

### 3. Update AgentPool

**File**: `src/lib/agents/agentPool.ts`

```typescript
constructor() {
  const useOpenRouter = process.env.OPENROUTER_BASE_URL
  const apiKey = useOpenRouter
    ? process.env.OPENROUTER_API_KEY
    : process.env.CODEBUFF_API_KEY

  if (!apiKey) {
    throw new Error(
      useOpenRouter
        ? 'OPENROUTER_API_KEY is required'
        : 'CODEBUFF_API_KEY is required'
    )
  }

  this.client = new CodebuffClient({
    apiKey,
    baseURL: useOpenRouter ? process.env.OPENROUTER_BASE_URL : undefined,
  })

  // Register all agents...
}
```

### 4. Update Orchestrator

**File**: `src/lib/agents/orchestrator.ts`

```typescript
export async function runOrchestrator(userRequest: string, projectSlug: string) {
  const useOpenRouter = process.env.OPENROUTER_BASE_URL
  const apiKey = useOpenRouter
    ? process.env.OPENROUTER_API_KEY
    : process.env.CODEBUFF_API_KEY

  const codebuff = new CodebuffClient({
    apiKey: apiKey || '',
    baseURL: useOpenRouter ? process.env.OPENROUTER_BASE_URL : undefined,
  })

  // Rest of the code...
}
```

### 5. Update Department Runner

**File**: `src/lib/agents/departmentRunner.ts`

```typescript
// All functions that accept CodebuffClient parameter will automatically
// use OpenRouter if the client was initialized with baseURL
// No changes needed in this file!
```

## Model Name Format

### Important: Model Names Must Match OpenRouter Format

When using OpenRouter, agent model names must use the OpenRouter format:

```typescript
// ✅ Correct (OpenRouter format)
model: 'anthropic/claude-sonnet-4.5'
model: 'qwen/qwen3-vl-235b-a22b-thinking'
model: 'google/gemini-2.5-flash'

// ❌ Wrong (Direct Anthropic format)
model: 'claude-3-5-sonnet-20241022'
model: 'claude-sonnet-4.5'
```

**Good news:** We already updated all seed files to use the correct format! ✅

## Benefits of Using OpenRouter

### 1. Access to Multiple Providers
```typescript
// Anthropic models
'anthropic/claude-sonnet-4.5'
'anthropic/claude-3.5-sonnet'
'anthropic/claude-opus-4'

// Google models
'google/gemini-2.5-flash'
'google/gemini-pro-1.5'

// OpenAI models
'openai/gpt-4-turbo'
'openai/gpt-4o'

// Open source models
'qwen/qwen3-vl-235b-a22b-thinking'
'meta-llama/llama-3.3-70b'
'mistralai/mistral-large'
```

### 2. Cost Optimization
- OpenRouter often has better pricing than direct APIs
- Automatic failover to cheaper models when available
- Volume discounts

### 3. Rate Limit Pooling
- Shared rate limits across all models
- Better throughput for high-volume applications

### 4. Unified Billing
- Single invoice for all AI providers
- Simplified accounting and tracking

## Advanced Configuration

### Custom Headers (Optional)

Add app identification to OpenRouter requests:

```typescript
this.client = new CodebuffClient({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
  cwd: cwd || process.cwd(),
  // OpenRouter supports custom headers via fetch options
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_APP_URL || '',
    'X-Title': process.env.OPENROUTER_APP_NAME || 'Aladdin',
  },
})
```

### Model Fallback Strategy

Implement automatic fallback if primary model fails:

```typescript
const agentDefinition = {
  id: agent.agentId,
  model: agent.model,
  // OpenRouter-specific: fallback models
  fallbackModels: [
    process.env.OPENROUTER_BACKUP_MODEL, // qwen/qwen3-vl-235b-a22b-thinking
    'anthropic/claude-3.5-sonnet', // Further fallback
  ],
  displayName: agent.name,
  toolNames: agent.toolNames?.map((t: any) => t.toolName) || [],
  instructionsPrompt: agent.instructionsPrompt,
}
```

## Testing

### 1. Verify Configuration
```bash
# Check environment variables are loaded
npm run dev
# Should see: Using OpenRouter API at https://openrouter.ai/api/v1
```

### 2. Test Agent Execution
```bash
curl -X POST http://localhost:3000/api/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "story-head-001",
    "prompt": "Write a one-sentence story premise"
  }'
```

### 3. Monitor OpenRouter Dashboard
- Visit https://openrouter.ai/activity
- Check API calls are appearing
- Verify correct models are being used
- Monitor costs and token usage

## Troubleshooting

### Issue: "Model not found"
**Cause**: Model name format is incorrect
**Solution**: Ensure model uses OpenRouter format: `provider/model-name`

### Issue: "Invalid API key"
**Cause**: Using CODEBUFF_API_KEY instead of OPENROUTER_API_KEY
**Solution**: Check `.env` has correct OPENROUTER_API_KEY

### Issue: "Base URL not set"
**Cause**: CodebuffClient initialized without baseURL
**Solution**: Ensure OPENROUTER_BASE_URL is in `.env` and passed to client

### Issue: High latency
**Cause**: OpenRouter routing overhead
**Solution**: Use faster models or enable caching:
```typescript
{
  model: 'anthropic/claude-sonnet-4.5',
  temperature: 0, // Enables prompt caching
}
```

## Migration Checklist

- [ ] Add OPENROUTER_API_KEY to `.env`
- [ ] Add OPENROUTER_BASE_URL to `.env`
- [ ] Update AladdinAgentRunner constructor
- [ ] Update AgentPool constructor
- [ ] Update orchestrator.ts
- [ ] Verify all agent models use OpenRouter format
- [ ] Test agent execution
- [ ] Monitor OpenRouter dashboard
- [ ] Update documentation

## Cost Comparison

| Provider | Model | Cost per 1M tokens |
|----------|-------|-------------------|
| Direct Anthropic | Claude Sonnet 3.5 | $3.00 / $15.00 |
| OpenRouter | Claude Sonnet 3.5 | $3.00 / $15.00 |
| OpenRouter | Qwen 3 VL | $0.20 / $0.60 |
| OpenRouter | Gemini 2.5 Flash | $0.15 / $0.60 |

**Savings with current setup:**
- 27 agents on Claude Sonnet 4.5: Premium quality
- 8 agents on Qwen backup: **90% cost reduction** for coordination tasks

## Next Steps

1. **Implement the changes** in the 4 files mentioned
2. **Re-deploy** the application
3. **Monitor** OpenRouter dashboard for usage
4. **Optimize** by moving more agents to cost-effective models where quality permits

---

**Last Updated**: January 2, 2025
**Related Docs**:
- [MODEL_UPDATE_SUMMARY.md](./MODEL_UPDATE_SUMMARY.md)
- [decision-tree.md](./idea/decision-tree.md)
