# Data Preparation Agent - Troubleshooting Guide

## Table of Contents

1. [Common Issues](#common-issues)
2. [Error Messages](#error-messages)
3. [Debugging Tips](#debugging-tips)
4. [Performance Issues](#performance-issues)
5. [Cache Problems](#cache-problems)
6. [LLM Errors](#llm-errors)
7. [Validation Failures](#validation-failures)
8. [Integration Issues](#integration-issues)

---

## Common Issues

### Issue: "Data is required"

**Error:**
```
Error: Data is required
```

**Cause:** Empty or null data passed to `agent.prepare()`

**Solution:**
```typescript
// ❌ BAD
await agent.prepare(null, options)
await agent.prepare(undefined, options)

// ✅ GOOD
const data = { id: 'char_001', name: 'Sarah', description: '...' }
await agent.prepare(data, options)
```

---

### Issue: "projectId is required"

**Error:**
```
Error: projectId is required
```

**Cause:** Missing `projectId` in options

**Solution:**
```typescript
// ❌ BAD
await agent.prepare(data, {
  entityType: 'character',
  // Missing projectId
})

// ✅ GOOD
await agent.prepare(data, {
  projectId: 'proj_123',
  entityType: 'character',
})
```

---

### Issue: "entityType is required"

**Error:**
```
Error: entityType is required
```

**Cause:** Missing `entityType` in options

**Solution:**
```typescript
// ❌ BAD
await agent.prepare(data, {
  projectId: 'proj_123',
  // Missing entityType
})

// ✅ GOOD
await agent.prepare(data, {
  projectId: 'proj_123',
  entityType: 'character',
})
```

---

### Issue: "Queue feature is disabled"

**Error:**
```
Error: Queue feature is disabled
```

**Cause:** Trying to use `prepareAsync()` when queue is disabled

**Solution:**
```typescript
// Enable queue in config
const agent = new DataPreparationAgent({
  ...defaultConfig,
  features: {
    ...defaultConfig.features,
    enableQueue: true,  // Enable queue
  },
})

// Or use synchronous processing
const document = await agent.prepare(data, options)
```

---

### Issue: Redis Connection Failed

**Error:**
```
[CacheManager] Redis error: Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Cause:** Redis server not running or wrong URL

**Solution:**

1. **Check Redis is running:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start Redis
redis-server
```

2. **Check Redis URL:**
```bash
# .env
REDIS_URL=redis://localhost:6379  # Local
# or
REDIS_URL=redis://user:pass@host:6379  # Remote
```

3. **Fallback:** Agent falls back to memory cache if Redis unavailable

---

### Issue: LLM API Key Missing

**Error:**
```
Error: LLM API key is required
```

**Cause:** Missing or invalid OpenRouter API key

**Solution:**
```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-xxxxxx
```

**Verify:**
```typescript
console.log('API Key:', process.env.OPENROUTER_API_KEY?.substring(0, 10))
```

---

## Error Messages

### Validation Errors

#### "Document ID is required"

**Cause:** Agent failed to generate document ID

**Solution:** Ensure entity has `id` field:
```typescript
const data = {
  id: 'char_001',  // Required
  name: 'Sarah',
  // ...
}
```

#### "Document text is required"

**Cause:** No searchable text generated

**Solution:** Provide `name` or `description`:
```typescript
const data = {
  id: 'char_001',
  name: 'Sarah Chen',  // Used for text
  description: 'A brilliant neuroscientist',  // Or this
}
```

#### "Document text is very short"

**Cause:** Generated text < 10 characters

**Solution:** Provide more descriptive data:
```typescript
// ❌ BAD
const data = { id: '1', name: 'Bob' }  // Only 3 chars

// ✅ GOOD
const data = {
  id: '1',
  name: 'Bob Anderson',
  description: 'A mysterious investigator with a dark past',
}
```

#### "Relationship missing type"

**Cause:** Relationship without type field

**Solution:** This is internal - usually indicates LLM generation issue

**Debug:**
```typescript
// Check relationship suggestions
console.log('Relationships:', metadata.relationshipSuggestions)

// Manually filter invalid relationships
const validRelationships = relationships.filter(r => r.type && r.target)
```

---

### LLM Errors

#### Rate Limit Exceeded

**Error:**
```
Error: Rate limit exceeded. Please try again later.
```

**Solution:**

1. **Wait and retry:**
```typescript
async function prepareWithRetry(data: any, options: PrepareOptions, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await agent.prepare(data, options)
    } catch (error) {
      if (error.message.includes('Rate limit')) {
        const delay = Math.pow(2, i) * 1000  // Exponential backoff
        console.log(`Rate limited, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
  throw new Error('Max retries exceeded')
}
```

2. **Use backup model:**
```bash
# .env
OPENROUTER_BACKUP_MODEL=openai/gpt-3.5-turbo
```

3. **Reduce concurrency:**
```typescript
const agent = new DataPreparationAgent({
  ...defaultConfig,
  queue: {
    concurrency: 3,  // Reduce from 5
    maxRetries: 3,
  },
})
```

#### Invalid API Key

**Error:**
```
Error: Invalid authentication credentials
```

**Solution:**

1. **Check API key format:**
```bash
# Should start with 'sk-or-v1-'
OPENROUTER_API_KEY=sk-or-v1-xxxxxx
```

2. **Verify on OpenRouter:**
- Log in to https://openrouter.ai
- Go to API Keys
- Generate new key if needed

#### Model Not Found

**Error:**
```
Error: Model not found: anthropic/claude-sonnet-4.5
```

**Solution:**

1. **Check model name:**
```bash
# Correct model names
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4-20250514
# or
OPENROUTER_DEFAULT_MODEL=openai/gpt-4
```

2. **List available models:**
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

---

## Debugging Tips

### Enable Debug Logging

```typescript
// Set debug flag
process.env.DEBUG = 'data-prep-agent:*'

// Or use custom logger
class DebugAgent extends DataPreparationAgent {
  async prepare(data: any, options: PrepareOptions) {
    console.log('[DEBUG] Input:', { data, options })

    try {
      const result = await super.prepare(data, options)
      console.log('[DEBUG] Output:', {
        id: result.id,
        metadataFields: Object.keys(result.metadata).length,
        relationships: result.relationships.length,
      })
      return result
    } catch (error) {
      console.error('[DEBUG] Error:', error)
      throw error
    }
  }
}
```

### Inspect Context Gathering

```typescript
// Temporarily expose context
const agent = getDataPreparationAgent()

// Access private contextGatherer (for debugging only)
const context = await agent['contextGatherer'].gatherAll(data, projectId)

console.log('Context:', {
  project: context.project.name,
  characters: context.payload.characters.length,
  scenes: context.payload.scenes.length,
  brainEntities: context.brain.totalCount,
  related: context.related,
})
```

### Check Cache Status

```typescript
// Check if cache is working
const cacheKey = `prep:${projectId}:character:char_001`

const cached = await agent['cache'].get(cacheKey)
console.log('Cached:', cached ? 'Hit' : 'Miss')

// Clear cache for testing
await agent['cache'].clearPattern('prep:*')
```

### Monitor LLM Calls

```typescript
// Track LLM usage
let tokenCount = 0

const originalComplete = agent['llm'].complete.bind(agent['llm'])
agent['llm'].complete = async (prompt: string, options: any) => {
  console.log('[LLM] Prompt length:', prompt.length)
  const result = await originalComplete(prompt, options)
  tokenCount += options.maxTokens || 0
  console.log('[LLM] Total tokens:', tokenCount)
  return result
}
```

---

## Performance Issues

### Slow Processing

**Symptoms:**
- Processing takes > 10 seconds per entity
- High LLM token usage
- Many cache misses

**Solutions:**

1. **Enable Caching:**
```typescript
const agent = new DataPreparationAgent({
  ...defaultConfig,
  features: {
    enableCaching: true,  // Enable
    // ...
  },
})
```

2. **Reduce Context Size:**
```typescript
// Limit PayloadCMS queries
private async getPayloadCollection(payload, collection, projectId) {
  return payload.find({
    collection,
    where: { project: { equals: projectId } },
    limit: 5,  // Reduce from 10
    depth: 0,
  })
}
```

3. **Skip Relationship Discovery:**
```typescript
const agent = new DataPreparationAgent({
  ...defaultConfig,
  features: {
    enableRelationshipDiscovery: false,  // Skip for speed
  },
})
```

4. **Use Async Processing:**
```typescript
// Don't wait for completion
const jobId = await agent.prepareAsync(data, options)
console.log('Queued:', jobId)
// Continue without waiting
```

### High Token Usage

**Symptoms:**
- High OpenRouter costs
- Rate limit errors
- Slow responses

**Solutions:**

1. **Use Cheaper Model:**
```bash
# .env
OPENROUTER_DEFAULT_MODEL=openai/gpt-3.5-turbo  # Cheaper
```

2. **Reduce maxTokens:**
```typescript
// In metadata-generator.ts
const metadata = await this.llm.completeJSON<MetadataSchema>(prompt, {
  temperature: 0.3,
  maxTokens: 500,  // Reduce from 1000
})
```

3. **Cache Aggressively:**
```typescript
cache: {
  projectContextTTL: 3600,   // 1 hour
  documentTTL: 7200,         // 2 hours
  entityTTL: 3600,           // 1 hour
}
```

---

## Cache Problems

### Cache Not Working

**Check:**

1. **Redis Connection:**
```bash
redis-cli ping
# Should return: PONG
```

2. **Cache Feature Flag:**
```typescript
console.log('Cache enabled:', agent.config.features.enableCaching)
```

3. **TTL Values:**
```typescript
console.log('Cache TTLs:', agent.config.cache)
// Should show reasonable values (> 0)
```

### Cache Stale Data

**Symptoms:**
- Old data returned after updates
- Changes not reflected

**Solution:**

1. **Clear Cache:**
```typescript
await agent['cache'].clearPattern('prep:*')
```

2. **Reduce TTL:**
```typescript
cache: {
  projectContextTTL: 60,   // 1 minute
  documentTTL: 300,        // 5 minutes
  entityTTL: 180,          // 3 minutes
}
```

3. **Skip Cache on Demand:**
```typescript
const document = await agent.prepare(data, {
  ...options,
  skipCache: true,  // Force fresh data
})
```

---

## Validation Failures

### How to Debug

```typescript
try {
  const document = await agent.prepare(data, options)
} catch (error) {
  if (error.message.includes('Validation failed')) {
    // Extract validation errors
    const match = error.message.match(/Validation failed: (.+)/)
    const errors = match ? match[1].split(', ') : []

    console.error('Validation errors:')
    errors.forEach(err => console.error('  -', err))

    // Debug the document
    console.log('Document that failed:', {
      id: document?.id,
      type: document?.type,
      textLength: document?.text?.length,
      metadataKeys: document?.metadata ? Object.keys(document.metadata) : [],
      relationshipCount: document?.relationships?.length,
    })
  }
}
```

### Common Fixes

**Missing Required Fields:**
```typescript
// Ensure all required fields
const document = {
  id: 'required',
  type: 'required',
  project_id: 'required',
  text: 'required (10+ chars)',
  metadata: {}, // At least empty object
  relationships: [], // At least empty array
}
```

**Text Too Short:**
```typescript
// Build comprehensive text
const text = [
  data.name,
  data.description,
  data.content,
  metadata.summary,
].filter(Boolean).join('. ')

console.log('Text length:', text.length)  // Should be 10+
```

---

## Integration Issues

### PayloadCMS Hook Not Firing

**Check:**

1. **Hook Registered:**
```typescript
// In collections/characters.ts
import { characterHooks } from '@/lib/agents/data-preparation/payload-hooks'

const Characters: CollectionConfig = {
  slug: 'characters',
  hooks: characterHooks,  // Make sure this is here
  // ...
}
```

2. **Hook Function:**
```typescript
// Add logging
const afterChange: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  console.log('[Hook] Triggered:', { operation, docId: doc.id })

  if (operation === 'create' || operation === 'update') {
    console.log('[Hook] Processing...')
    // ... rest of hook
  }
}
```

### Brain Service Connection Failed

**Error:**
```
Error: Failed to connect to Brain Service
```

**Solutions:**

1. **Check URL:**
```bash
# .env
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
```

2. **Verify API Key:**
```bash
curl https://brain.ft.tc/api/health \
  -H "Authorization: Bearer $BRAIN_SERVICE_API_KEY"
```

3. **Test Connection:**
```typescript
const brainClient = getBrainClient()

try {
  await brainClient.health()
  console.log('Brain Service: Connected')
} catch (error) {
  console.error('Brain Service: Failed', error)
}
```

---

## Getting Help

### Collect Debug Information

```typescript
// Comprehensive debug info
const debugInfo = {
  environment: {
    nodeVersion: process.version,
    env: {
      openrouterKeySet: !!process.env.OPENROUTER_API_KEY,
      brainServiceUrlSet: !!process.env.BRAIN_SERVICE_BASE_URL,
      redisUrlSet: !!process.env.REDIS_URL,
    },
  },
  config: {
    features: agent.config.features,
    cache: agent.config.cache,
    queue: agent.config.queue,
  },
  redis: {
    connected: agent['cache']['isConnected'],
  },
  llm: {
    model: agent.config.llm.defaultModel,
    backupModel: agent.config.llm.backupModel,
  },
}

console.log('Debug Info:', JSON.stringify(debugInfo, null, 2))
```

### Test Minimal Example

```typescript
// Minimal test case
const agent = getDataPreparationAgent()

const testData = {
  id: 'test_001',
  name: 'Test Character',
  description: 'This is a test character for debugging purposes',
}

try {
  const document = await agent.prepare(testData, {
    projectId: 'test_project',
    entityType: 'character',
  })

  console.log('✅ Test passed:', {
    id: document.id,
    textLength: document.text.length,
    metadataFields: Object.keys(document.metadata).length,
    relationships: document.relationships.length,
  })
} catch (error) {
  console.error('❌ Test failed:', error.message)
}
```

---

## See Also

- [Configuration System Guide](/mnt/d/Projects/aladdin/docs/agents/configuration-system-guide.md)
- [Configuration Examples](/mnt/d/Projects/aladdin/docs/agents/configuration-examples.md)
- [Migration Guide](/mnt/d/Projects/aladdin/docs/agents/configuration-migration.md)
