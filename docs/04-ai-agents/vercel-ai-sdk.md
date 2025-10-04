# Vercel AI SDK Integration

**Purpose**: Complete guide to Vercel AI SDK implementation in Aladdin  
**Status**: ✅ Current Implementation (replaced Codebuff SDK)  
**Updated**: October 4, 2025

---

## 🎯 Overview

Aladdin uses the **Vercel AI SDK** for all AI operations, providing a unified interface for LLM interactions through OpenRouter. This replaced the previous Codebuff SDK implementation.

### Architecture Flow

```
User Request
    ↓
Handler (chatHandler, queryHandler, etc.)
    ↓
AladdinAgentRunner
    ↓
AIAgentExecutor
    ↓
Vercel AI SDK (generateText/generateObject)
    ↓
OpenRouter API
    ↓
Claude Sonnet 4.5
```

---

## 🛠️ Core Components

### 1. AI Client (`src/lib/ai/client.ts`)

The AI client is configured to use OpenRouter as the provider:

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { openrouter } from '@openrouter/ai-sdk-provider';

// Configure OpenRouter provider
const openrouterProvider = openrouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Aladdin Movie Production',
  },
});

// Model configuration
export const getModel = (modelName?: string) => {
  return openrouterProvider(modelName || process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-sonnet-4.5');
};

// Default model export
export const defaultModel = getModel();
```

### 2. Agent Executor (`src/lib/ai/agent-executor.ts`)

The AIAgentExecutor orchestrates AI operations:

```typescript
import { generateText, generateObject } from 'ai';
import { getModel } from './client';

export class AIAgentExecutor {
  constructor(private payload: any) {}

  async execute(params: {
    agentId: string;
    prompt: string;
    context?: Record<string, any>;
    structuredOutput?: { schema: any };
  }) {
    const { agentId, prompt, context, structuredOutput } = params;
    
    // Get the model
    const model = getModel();
    
    // Convert tools to Vercel AI SDK format
    const tools = this.convertTools(agentId);
    
    try {
      if (structuredOutput) {
        // Generate structured output
        const result = await generateObject({
          model,
          prompt: this.buildPrompt(prompt, context),
          schema: structuredOutput.schema,
          tools,
        });
        
        return {
          success: true,
          data: result.object,
          usage: result.usage,
        };
      } else {
        // Generate text
        const result = await generateText({
          model,
          prompt: this.buildPrompt(prompt, context),
          tools,
        });
        
        return {
          success: true,
          data: result.text,
          usage: result.usage,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  private convertTools(agentId: string) {
    // Convert domain tools to Vercel AI SDK format
    // Implementation details...
  }
  
  private buildPrompt(prompt: string, context?: Record<string, any>) {
    // Build contextual prompt
    // Implementation details...
  }
}
```

### 3. Agent Runner (`src/lib/agents/AladdinAgentRunner.ts`)

The AladdinAgentRunner provides a simplified interface:

```typescript
import { AIAgentExecutor } from '@/lib/ai/agent-executor';

export class AladdinAgentRunner {
  private executor: AIAgentExecutor;
  
  constructor(payload: any) {
    this.executor = new AIAgentExecutor(payload);
  }
  
  async execute(params: {
    agentId: string;
    prompt: string;
    context?: Record<string, any>;
  }) {
    // Create execution record
    const executionRecord = await this.createExecutionRecord(params);
    
    try {
      // Execute with AI SDK
      const result = await this.executor.execute(params);
      
      // Update execution record
      await this.updateExecutionRecord(executionRecord.id, {
        status: 'completed',
        result: result.data,
        usage: result.usage,
      });
      
      return result;
    } catch (error) {
      // Update execution record with error
      await this.updateExecutionRecord(executionRecord.id, {
        status: 'failed',
        error: error.message,
      });
      
      throw error;
    }
  }
  
  private async createExecutionRecord(params: any) {
    // Create execution record in PayloadCMS
    // Implementation details...
  }
  
  private async updateExecutionRecord(id: string, updates: any) {
    // Update execution record in PayloadCMS
    // Implementation details...
  }
}
```

---

## 🤖 Utility Agents

Six utility agents are configured in `src/seed/agents.seed.ts`:

### 1. Chat Assistant
- **Agent ID**: `chat-assistant`
- **Purpose**: General conversation handling
- **Used by**: `chatHandler`

### 2. Query Assistant
- **Agent ID**: `query-assistant`
- **Purpose**: Brain search synthesis
- **Used by**: `queryHandler`

### 3. Data Enricher
- **Agent ID**: `data-enricher`
- **Purpose**: Content enrichment
- **Used by**: `dataHandler`, `aiProcessor`

### 4. Metadata Generator
- **Agent ID**: `metadata-generator`
- **Purpose**: Metadata generation
- **Used by**: Data preparation agents

### 5. Relationship Discoverer
- **Agent ID**: `relationship-discoverer`
- **Purpose**: Relationship mapping
- **Used by**: Data preparation agents

### 6. Quality Scorer
- **Agent ID**: `quality-scorer`
- **Purpose**: Output assessment
- **Used by**: Quality scoring system

---

## 🔄 Migration from Codebuff SDK

### What Changed

1. **Removed Direct LLM Calls**: All direct LLM client calls were removed
2. **Unified Interface**: All AI operations now go through Vercel AI SDK
3. **Agent System**: Utility agents replace direct model calls
4. **Better Error Handling**: Standardized error responses
5. **Type Safety**: Full Zod validation on structured outputs

### Migration Pattern

**Before (WRONG):**
```typescript
import { getLLMClient } from '@/lib/llm/client';

const llm = getLLMClient();
const response = await llm.chat(messages, { temperature, maxTokens });
```

**After (CORRECT):**
```typescript
import { AladdinAgentRunner } from '@/lib/agents/AladdinAgentRunner';

const runner = new AladdinAgentRunner(payload);
const result = await runner.execute({
  agentId: 'chat-assistant',
  prompt: contextualPrompt,
  context: { projectId, userId },
});
```

### Files Migrated

✅ **Core Handlers**
- `src/lib/orchestrator/chatHandler.ts` - Uses `chat-assistant`
- `src/lib/orchestrator/queryHandler.ts` - Uses `query-assistant`
- `src/lib/orchestrator/dataHandler.ts` - Uses `data-enricher`

✅ **Data Processing**
- `src/lib/gather/aiProcessor.ts` - Uses `data-enricher`
- `src/lib/agents/data-preparation/agent.ts` - Uses `data-enricher`
- `src/lib/agents/data-preparation/metadata-generator.ts` - Uses `metadata-generator`
- `src/lib/agents/data-preparation/relationship-discoverer.ts` - Uses `relationship-discoverer`

✅ **Quality Assessment**
- `src/lib/agents/quality/scorer.ts` - Uses `quality-scorer`

❌ **Files Deleted**
- `src/lib/llm/client.ts` - Deprecated direct LLM client
- `src/lib/ai/simple-llm.ts` - Temporary wrapper
- `src/app/api/test-llm/` - Test routes
- `scripts/test-llm-enhancement.js` - Test script

---

## ⚙️ Configuration

### Environment Variables

```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5

# Application URL (for referer header)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Model Configuration

Default model is `anthropic/claude-sonnet-4.5`, but can be overridden:

```typescript
// Use specific model
const model = getModel('anthropic/claude-3-haiku');

// Use environment default
const model = getModel();
```

### Tool Integration

Domain tools are automatically converted to Vercel AI SDK format:

```typescript
const tools = [
  {
    description: 'Search the Brain knowledge graph',
    parameters: z.object({
      query: z.string(),
      projectId: z.string(),
    }),
    execute: async ({ query, projectId }) => {
      // Tool implementation
    },
  },
  // ... more tools
];
```

---

## 🧪 Testing the Integration

### Verification Commands

```bash
# Check no direct LLM calls exist
grep -r "getLLMClient\|from '@/lib/llm" src/
# Should return 0 results

# Check Vercel AI SDK usage
grep -r "from 'ai'" src/lib/
# Should find agent-executor.ts

# Check agent usage
grep -r "AladdinAgentRunner" src/lib/orchestrator/
# Should find handlers using AladdinAgentRunner
```

### Test Cases

```typescript
// Test basic text generation
const result = await runner.execute({
  agentId: 'chat-assistant',
  prompt: 'Hello, world!',
});

// Test structured output
const structuredResult = await runner.execute({
  agentId: 'data-enricher',
  prompt: 'Analyze this character',
  structuredOutput: {
    schema: z.object({
      name: z.string(),
      traits: z.array(z.string()),
      quality: z.number(),
    }),
  },
});

// Test tool usage
const toolResult = await runner.execute({
  agentId: 'query-assistant',
  prompt: 'Search for similar characters',
  context: { projectId: 'abc123' },
});
```

---

## 🚀 Best Practices

### 1. Always Use Agents

Never make direct LLM calls. Always use the agent system:

```typescript
// ✅ Correct
const result = await runner.execute({
  agentId: 'chat-assistant',
  prompt: 'Generate content',
});

// ❌ Wrong
import { generateText } from 'ai';
const result = await generateText({ model, prompt });
```

### 2. Choose the Right Agent

Select the appropriate utility agent for your task:

- **General chat**: `chat-assistant`
- **Brain queries**: `query-assistant`
- **Content enrichment**: `data-enricher`
- **Metadata generation**: `metadata-generator`
- **Relationship mapping**: `relationship-discoverer`
- **Quality scoring**: `quality-scorer`

### 3. Provide Context

Always include relevant context:

```typescript
const result = await runner.execute({
  agentId: 'data-enricher',
  prompt: 'Enhance this character description',
  context: {
    projectId: 'abc123',
    userId: 'user123',
    existingContent: characterData,
  },
});
```

### 4. Handle Errors Gracefully

```typescript
try {
  const result = await runner.execute(params);
  // Handle success
} catch (error) {
  console.error('Agent execution failed:', error);
  // Handle error appropriately
}
```

### 5. Monitor Usage

Track token usage for cost management:

```typescript
const result = await runner.execute(params);
console.log('Token usage:', result.usage);
// { promptTokens: 100, completionTokens: 200, totalTokens: 300 }
```

---

## 🔍 Troubleshooting

### Common Issues

1. **API Key Errors**
   ```
   Error: Invalid OpenRouter API key
   ```
   **Solution**: Verify `OPENROUTER_API_KEY` is set correctly

2. **Model Not Found**
   ```
   Error: Model 'unknown-model' not found
   ```
   **Solution**: Check model name and availability

3. **Tool Execution Failed**
   ```
   Error: Tool execution failed
   ```
   **Solution**: Verify tool implementation and permissions

### Debug Commands

```typescript
// Enable debug logging
process.env.AI_SDK_DEBUG = 'true';

// Check model availability
const model = getModel();
console.log('Model:', model);

// Test simple generation
const test = await generateText({
  model,
  prompt: 'Test message',
});
console.log('Test result:', test);
```

---

## 📚 Related Documentation

- [Agent Framework](./framework.md) - Agent system architecture
- [Agent Configuration](./configuration.md) - Configure custom agents
- [Custom Agents](./custom-agents.md) - Build your own agents
- [System Overview](../02-architecture/system-overview.md) - High-level architecture
- [Technology Stack](../02-architecture/tech-stack.md) - Complete tech overview
- [Quick Start Guide](../01-getting-started/quick-start.md) - Get running locally
- [OpenRouter Documentation](https://openrouter.ai/docs) - LLM provider docs
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs) - SDK reference

---

**Document Version**: 1.0.0  
**Last Updated**: October 4, 2025  
**Status**: ✅ Current Implementation