# Phase 6: Testing & Monitoring - Detailed Plan

**Version**: 1.0.0  
**Date**: 2025-10-01  
**Status**: 📋 Planning Phase  
**Estimated Duration**: 2-3 weeks  
**Priority**: Recommended

---

## Overview

Phase 6 implements comprehensive testing (unit, integration, E2E) and production monitoring (metrics, logging, alerting) to ensure the Data Preparation Agent is reliable, performant, and observable in production.

---

## Goals

1. **Unit Testing** - Test individual components in isolation
2. **Integration Testing** - Test component interactions
3. **End-to-End Testing** - Test complete workflows
4. **Performance Testing** - Benchmark and load testing
5. **Monitoring** - Real-time metrics and dashboards
6. **Logging** - Structured logging for debugging
7. **Alerting** - Proactive issue detection
8. **Cost Tracking** - Monitor LLM API usage

---

## Part A: Testing Strategy

### 1. Unit Tests

**Framework**: Jest + TypeScript

**Test Coverage Goals**:
- Code coverage: >80%
- Branch coverage: >75%
- Function coverage: >90%

#### Test Files Structure

```
tests/unit/
├── agents/
│   ├── data-preparation/
│   │   ├── agent.test.ts
│   │   ├── context-gatherer.test.ts
│   │   ├── metadata-generator.test.ts
│   │   ├── data-enricher.test.ts
│   │   ├── relationship-discoverer.test.ts
│   │   ├── validator.test.ts
│   │   ├── cache-manager.test.ts
│   │   ├── queue-manager.test.ts
│   │   └── interceptor.test.ts
├── llm/
│   └── client.test.ts
└── brain/
    └── client.test.ts
```

#### Example Unit Tests

```typescript
// tests/unit/agents/data-preparation/metadata-generator.test.ts

import { MetadataGenerator } from '@/lib/agents/data-preparation/metadata-generator'
import { LLMClient } from '@/lib/llm/client'

// Mock LLM client
jest.mock('@/lib/llm/client')

describe('MetadataGenerator', () => {
  let generator: MetadataGenerator
  let mockLLMClient: jest.Mocked<LLMClient>
  
  beforeEach(() => {
    mockLLMClient = new LLMClient({}) as jest.Mocked<LLMClient>
    generator = new MetadataGenerator({
      llmClient: mockLLMClient,
    })
  })
  
  describe('generate', () => {
    it('should generate metadata for character', async () => {
      // Arrange
      const data = {
        name: 'Aladdin',
        description: 'Street-smart hero',
      }
      const context = {
        project: { genre: ['adventure'] },
        payload: { characters: [] },
        brain: { existingEntities: [] },
        openDB: { collections: [] },
      }
      const options = {
        projectId: 'proj_test',
        entityType: 'character',
      }
      
      mockLLMClient.sequence.mockResolvedValue([
        JSON.stringify({ characterType: 'protagonist', role: 'hero' }),
        JSON.stringify({ archetype: 'hero\'s journey' }),
        'Aladdin is a street-smart hero...',
        JSON.stringify([{ type: 'APPEARS_IN', target: 'scene_1' }]),
      ])
      
      // Act
      const result = await generator.generate(data, context, options)
      
      // Assert
      expect(result.metadata).toHaveProperty('characterType', 'protagonist')
      expect(result.metadata).toHaveProperty('role', 'hero')
      expect(result.summary).toContain('Aladdin')
      expect(result.relationshipSuggestions).toHaveLength(1)
      expect(mockLLMClient.sequence).toHaveBeenCalledTimes(1)
    })
    
    it('should handle LLM errors gracefully', async () => {
      // Arrange
      mockLLMClient.sequence.mockRejectedValue(new Error('API error'))
      
      // Act & Assert
      await expect(generator.generate({}, {}, {})).rejects.toThrow('API error')
    })
    
    it('should use cache when available', async () => {
      // Test caching behavior
    })
  })
  
  describe('analyzeEntity', () => {
    it('should determine metadata schema', async () => {
      // Test schema determination
    })
  })
})
```

```typescript
// tests/unit/agents/data-preparation/cache-manager.test.ts

import { CacheManager } from '@/lib/agents/data-preparation/cache-manager'
import Redis from 'ioredis'

jest.mock('ioredis')

describe('CacheManager', () => {
  let cache: CacheManager
  let mockRedis: jest.Mocked<Redis>
  
  beforeEach(() => {
    mockRedis = new Redis() as jest.Mocked<Redis>
    cache = new CacheManager({ redis: mockRedis })
  })
  
  describe('get', () => {
    it('should return cached value', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ test: 'data' }))
      
      const result = await cache.get('test-key')
      
      expect(result).toEqual({ test: 'data' })
      expect(mockRedis.get).toHaveBeenCalledWith('test-key')
    })
    
    it('should return null for missing key', async () => {
      mockRedis.get.mockResolvedValue(null)
      
      const result = await cache.get('missing-key')
      
      expect(result).toBeNull()
    })
    
    it('should use memory cache as fallback', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis down'))
      
      // Should not throw, should use memory cache
      const result = await cache.get('test-key')
      expect(result).toBeNull()
    })
  })
  
  describe('set', () => {
    it('should cache value with TTL', async () => {
      await cache.set('test-key', { test: 'data' }, 300)
      
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify({ test: 'data' })
      )
    })
  })
  
  describe('clearPattern', () => {
    it('should clear keys matching pattern', async () => {
      mockRedis.keys.mockResolvedValue(['key1', 'key2'])
      
      await cache.clearPattern('test:*')
      
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2')
    })
  })
})
```

### 2. Integration Tests

**Framework**: Jest + Testcontainers (for Redis, MongoDB)

```typescript
// tests/integration/data-prep-pipeline.test.ts

import { getDataPreparationAgent } from '@/lib/agents/data-preparation'
import { getPayload } from 'payload'
import { GenericContainer } from 'testcontainers'

describe('Data Preparation Pipeline', () => {
  let redisContainer: any
  let mongoContainer: any
  let agent: any
  
  beforeAll(async () => {
    // Start Redis container
    redisContainer = await new GenericContainer('redis:7')
      .withExposedPorts(6379)
      .start()
    
    // Start MongoDB container
    mongoContainer = await new GenericContainer('mongo:7')
      .withExposedPorts(27017)
      .start()
    
    // Initialize agent with test containers
    process.env.REDIS_URL = `redis://localhost:${redisContainer.getMappedPort(6379)}`
    process.env.DATABASE_URI = `mongodb://localhost:${mongoContainer.getMappedPort(27017)}/test`
    
    agent = getDataPreparationAgent()
  })
  
  afterAll(async () => {
    await redisContainer.stop()
    await mongoContainer.stop()
  })
  
  it('should process character end-to-end', async () => {
    const data = {
      name: 'Aladdin',
      description: 'Street-smart hero',
    }
    
    const options = {
      projectId: 'proj_test',
      entityType: 'character',
      sourceCollection: 'characters',
      sourceId: 'char_123',
    }
    
    const result = await agent.prepare(data, options)
    
    expect(result.id).toBeDefined()
    expect(result.type).toBe('character')
    expect(result.metadata).toHaveProperty('characterType')
    expect(result.relationships.length).toBeGreaterThan(0)
  })
  
  it('should cache results', async () => {
    const data = { name: 'Test' }
    const options = { projectId: 'proj_test', entityType: 'character' }
    
    // First call
    const start1 = Date.now()
    await agent.prepare(data, options)
    const duration1 = Date.now() - start1
    
    // Second call (should be cached)
    const start2 = Date.now()
    await agent.prepare(data, options)
    const duration2 = Date.now() - start2
    
    // Cache should be significantly faster
    expect(duration2).toBeLessThan(duration1 * 0.5)
  })
})
```

### 3. End-to-End Tests

**Framework**: Playwright + PayloadCMS

```typescript
// tests/e2e/payloadcms-hooks.test.ts

import { test, expect } from '@playwright/test'

test.describe('PayloadCMS Data Prep Hooks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/admin')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
  })
  
  test('should process project creation', async ({ page }) => {
    // Navigate to projects
    await page.click('text=Projects')
    await page.click('text=Create New')
    
    // Fill form
    await page.fill('[name="name"]', 'Test Movie')
    await page.fill('[name="slug"]', 'test-movie')
    await page.selectOption('[name="type"]', 'movie')
    
    // Save
    await page.click('button:has-text("Save")')
    
    // Wait for success
    await expect(page.locator('text=Saved successfully')).toBeVisible()
    
    // Verify hook was triggered (check console logs or API)
    // This would require custom logging or API endpoint
  })
})
```

### 4. Performance Tests

```typescript
// tests/performance/agent-benchmark.test.ts

import { getDataPreparationAgent } from '@/lib/agents/data-preparation'

describe('Performance Benchmarks', () => {
  const agent = getDataPreparationAgent()
  
  it('should process 100 entities in under 5 minutes', async () => {
    const entities = Array.from({ length: 100 }, (_, i) => ({
      name: `Entity ${i}`,
      description: `Test entity ${i}`,
    }))
    
    const start = Date.now()
    
    await Promise.all(
      entities.map((data, i) =>
        agent.prepare(data, {
          projectId: 'proj_test',
          entityType: 'character',
          sourceId: `char_${i}`,
        })
      )
    )
    
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(5 * 60 * 1000) // 5 minutes
    console.log(`Processed 100 entities in ${duration}ms`)
  })
  
  it('should handle concurrent requests', async () => {
    // Test with 50 concurrent requests
    const requests = Array.from({ length: 50 }, () =>
      agent.prepare({ name: 'Test' }, { projectId: 'proj_test', entityType: 'character' })
    )
    
    const start = Date.now()
    await Promise.all(requests)
    const duration = Date.now() - start
    
    console.log(`50 concurrent requests completed in ${duration}ms`)
    expect(duration).toBeLessThan(30000) // 30 seconds
  })
})
```

---

## Part B: Monitoring Strategy

### 1. Metrics Collection

**Tools**: Prometheus + Grafana

#### Metrics to Track

```typescript
// src/lib/agents/data-preparation/metrics.ts

import { Counter, Histogram, Gauge } from 'prom-client'

export const metrics = {
  // Processing metrics
  processedEntities: new Counter({
    name: 'data_prep_entities_processed_total',
    help: 'Total number of entities processed',
    labelNames: ['entity_type', 'project_id', 'status'],
  }),
  
  processingDuration: new Histogram({
    name: 'data_prep_processing_duration_seconds',
    help: 'Time taken to process entities',
    labelNames: ['entity_type', 'stage'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  }),
  
  // LLM metrics
  llmCalls: new Counter({
    name: 'data_prep_llm_calls_total',
    help: 'Total LLM API calls',
    labelNames: ['model', 'status'],
  }),
  
  llmTokens: new Counter({
    name: 'data_prep_llm_tokens_total',
    help: 'Total LLM tokens used',
    labelNames: ['model', 'type'], // type: prompt, completion
  }),
  
  llmCost: new Counter({
    name: 'data_prep_llm_cost_usd',
    help: 'Estimated LLM cost in USD',
    labelNames: ['model'],
  }),
  
  // Cache metrics
  cacheHits: new Counter({
    name: 'data_prep_cache_hits_total',
    help: 'Cache hits',
    labelNames: ['cache_type'], // redis, memory
  }),
  
  cacheMisses: new Counter({
    name: 'data_prep_cache_misses_total',
    help: 'Cache misses',
  }),
  
  cacheSize: new Gauge({
    name: 'data_prep_cache_size_bytes',
    help: 'Cache size in bytes',
    labelNames: ['cache_type'],
  }),
  
  // Queue metrics
  queueDepth: new Gauge({
    name: 'data_prep_queue_depth',
    help: 'Number of jobs in queue',
    labelNames: ['status'], // waiting, active, completed, failed
  }),
  
  queueProcessingTime: new Histogram({
    name: 'data_prep_queue_processing_seconds',
    help: 'Time jobs spend in queue',
    buckets: [1, 5, 10, 30, 60, 300],
  }),
  
  // Error metrics
  errors: new Counter({
    name: 'data_prep_errors_total',
    help: 'Total errors',
    labelNames: ['error_type', 'component'],
  }),
}
```

### 2. Grafana Dashboard

**Dashboard JSON**: `monitoring/grafana/data-prep-agent.json`

**Panels**:
1. **Processing Rate** - Entities/minute
2. **Processing Duration** - P50, P95, P99
3. **LLM Usage** - Calls, tokens, cost
4. **Cache Performance** - Hit rate, size
5. **Queue Depth** - Waiting, active, failed
6. **Error Rate** - Errors/minute by type
7. **Cost Tracking** - Daily LLM spend

### 3. Structured Logging

```typescript
// src/lib/agents/data-preparation/logger.ts

import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'data-prep-agent' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}

// Usage
logger.info('Processing entity', {
  entityType: 'character',
  projectId: 'proj_123',
  duration: 1.5,
})

logger.error('LLM API error', {
  error: error.message,
  model: 'claude-sonnet-4.5',
  retryAttempt: 2,
})
```

### 4. Alerting Rules

**Tool**: Prometheus Alertmanager

```yaml
# monitoring/prometheus/alerts.yml

groups:
  - name: data_prep_agent
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(data_prep_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate in Data Prep Agent"
          description: "Error rate is {{ $value }} errors/sec"
      
      - alert: LLMCostSpike
        expr: rate(data_prep_llm_cost_usd[1h]) > 10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "LLM cost spike detected"
          description: "Cost rate is ${{ $value }}/hour"
      
      - alert: QueueBacklog
        expr: data_prep_queue_depth{status="waiting"} > 1000
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Large queue backlog"
          description: "{{ $value }} jobs waiting in queue"
      
      - alert: CacheMissRate
        expr: rate(data_prep_cache_misses_total[5m]) / rate(data_prep_cache_hits_total[5m]) > 0.5
        for: 10m
        labels:
          severity: info
        annotations:
          summary: "High cache miss rate"
          description: "Cache miss rate is {{ $value }}"
```

---

## Implementation Tasks

### Testing Tasks
- [ ] Set up Jest configuration
- [ ] Write unit tests for all components
- [ ] Set up Testcontainers for integration tests
- [ ] Write integration tests
- [ ] Set up Playwright for E2E tests
- [ ] Write E2E tests
- [ ] Create performance benchmarks
- [ ] Set up CI/CD test pipeline
- [ ] Achieve >80% code coverage

### Monitoring Tasks
- [ ] Set up Prometheus metrics
- [ ] Create Grafana dashboards
- [ ] Implement structured logging
- [ ] Set up log aggregation (ELK/Loki)
- [ ] Configure alerting rules
- [ ] Set up Alertmanager
- [ ] Create runbooks for alerts
- [ ] Implement cost tracking

---

## Timeline

**Week 1**: Unit Tests
- Days 1-3: Core component tests
- Days 4-5: LLM and cache tests

**Week 2**: Integration & E2E Tests
- Days 1-2: Integration tests
- Days 3-4: E2E tests
- Day 5: Performance tests

**Week 3**: Monitoring
- Days 1-2: Metrics and Prometheus
- Days 3-4: Grafana dashboards
- Day 5: Alerting and documentation

---

## Success Criteria

- ✅ >80% code coverage
- ✅ All tests passing in CI/CD
- ✅ Performance benchmarks met
- ✅ Grafana dashboards operational
- ✅ Alerts configured and tested
- ✅ Cost tracking accurate
- ✅ Documentation complete

---

**Status**: Ready for implementation when needed

