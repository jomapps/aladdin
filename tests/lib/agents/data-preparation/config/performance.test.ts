/**
 * Configuration Performance Tests
 * Tests for configuration loading, caching, and performance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { EntityConfig, AgentConfig } from '@/lib/agents/data-preparation/types'

// Mock Redis cache
class MockRedisCache {
  private cache: Map<string, { value: any; expires: number }> = new Map()

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000
    })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Mock ConfigManager with caching
class CachedConfigManager {
  private configs: Map<string, EntityConfig> = new Map()
  private cache: MockRedisCache
  private stats = {
    hits: 0,
    misses: 0,
    loads: 0
  }

  constructor(private agentConfig: AgentConfig, cache: MockRedisCache) {
    this.cache = cache
  }

  async register(type: string, config: EntityConfig): Promise<void> {
    this.configs.set(type, config)
    await this.cache.set(`config:${type}`, config, 3600)
    this.stats.loads++
  }

  async get(type: string): Promise<EntityConfig | undefined> {
    // Try cache first
    const cached = await this.cache.get(`config:${type}`)
    if (cached) {
      this.stats.hits++
      return cached
    }

    // Try memory
    const config = this.configs.get(type)
    if (config) {
      this.stats.misses++
      await this.cache.set(`config:${type}`, config, 3600)
      return config
    }

    this.stats.misses++
    return undefined
  }

  getStats() {
    return { ...this.stats }
  }

  resetStats() {
    this.stats = { hits: 0, misses: 0, loads: 0 }
  }
}

describe('Configuration Performance', () => {
  let cache: MockRedisCache
  let agentConfig: AgentConfig

  beforeEach(() => {
    cache = new MockRedisCache()
    agentConfig = {
      llm: {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        defaultModel: 'test-model'
      },
      brain: {
        apiUrl: 'https://brain.test.com',
        apiKey: 'brain-key'
      },
      redis: {
        url: 'redis://localhost:6379'
      },
      cache: {
        projectContextTTL: 300,
        documentTTL: 3600,
        entityTTL: 1800
      },
      queue: {
        concurrency: 5,
        maxRetries: 3
      },
      features: {
        enableCaching: true,
        enableQueue: true,
        enableValidation: true,
        enableRelationshipDiscovery: true
      }
    }
  })

  describe('Configuration Loading', () => {
    it('should load configuration quickly', async () => {
      const manager = new CachedConfigManager(agentConfig, cache)

      const config: EntityConfig = {
        type: 'character',
        requiredFields: ['name'],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'standard'
      }

      const start = performance.now()
      await manager.register('character', config)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10)
    })

    it('should load multiple configurations efficiently', async () => {
      const manager = new CachedConfigManager(agentConfig, cache)

      const configs: Record<string, EntityConfig> = {
        character: {
          type: 'character',
          requiredFields: ['name'],
          contextSources: ['project'],
          relationshipRules: [],
          enrichmentStrategy: 'comprehensive'
        },
        scene: {
          type: 'scene',
          requiredFields: ['name'],
          contextSources: ['project'],
          relationshipRules: [],
          enrichmentStrategy: 'standard'
        },
        location: {
          type: 'location',
          requiredFields: ['name'],
          contextSources: ['project'],
          relationshipRules: [],
          enrichmentStrategy: 'minimal'
        }
      }

      const start = performance.now()
      for (const [type, config] of Object.entries(configs)) {
        await manager.register(type, config)
      }
      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
      expect(manager.getStats().loads).toBe(3)
    })

    it('should handle 100 configurations under 500ms', async () => {
      const manager = new CachedConfigManager(agentConfig, cache)

      const start = performance.now()

      for (let i = 0; i < 100; i++) {
        await manager.register(`entity${i}`, {
          type: `entity${i}`,
          requiredFields: ['name'],
          contextSources: ['project'],
          relationshipRules: [],
          enrichmentStrategy: 'standard'
        })
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(500)
      expect(manager.getStats().loads).toBe(100)
    })
  })

  describe('Cache Effectiveness', () => {
    it('should cache configuration after first access', async () => {
      const manager = new CachedConfigManager(agentConfig, cache)

      const config: EntityConfig = {
        type: 'character',
        requiredFields: ['name'],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'standard'
      }

      await manager.register('character', config)
      manager.resetStats()

      // First access - should be cache miss
      await manager.get('character')
      expect(manager.getStats().misses).toBe(1)
      expect(manager.getStats().hits).toBe(0)

      manager.resetStats()

      // Second access - should be cache hit
      await manager.get('character')
      expect(manager.getStats().hits).toBe(1)
      expect(manager.getStats().misses).toBe(0)
    })

    it('should achieve high cache hit rate', async () => {
      const manager = new CachedConfigManager(agentConfig, cache)

      await manager.register('character', {
        type: 'character',
        requiredFields: ['name'],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'standard'
      })

      manager.resetStats()

      // Access same config 100 times
      for (let i = 0; i < 100; i++) {
        await manager.get('character')
      }

      const stats = manager.getStats()
      const hitRate = stats.hits / (stats.hits + stats.misses)

      expect(hitRate).toBeGreaterThan(0.95) // >95% hit rate
    })

    it('should handle cache expiration', async () => {
      const shortCache = new MockRedisCache()
      const manager = new CachedConfigManager(agentConfig, shortCache)

      const config: EntityConfig = {
        type: 'test',
        requiredFields: ['name'],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'standard'
      }

      await manager.register('test', config)

      // Manually expire cache
      await shortCache.set('config:test', config, -1)

      const result = await manager.get('test')

      expect(result).toBeDefined()
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory with many configs', () => {
      const manager = new CachedConfigManager(agentConfig, cache)
      const initialMemory = process.memoryUsage().heapUsed

      // Register many configs
      for (let i = 0; i < 1000; i++) {
        manager.register(`entity${i}`, {
          type: `entity${i}`,
          requiredFields: ['name'],
          contextSources: ['project'],
          relationshipRules: [],
          enrichmentStrategy: 'standard'
        })
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Should use less than 10MB for 1000 configs
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('should handle large configuration objects', async () => {
      const manager = new CachedConfigManager(agentConfig, cache)

      const largeConfig: EntityConfig = {
        type: 'character',
        requiredFields: Array.from({ length: 100 }, (_, i) => `field${i}`),
        contextSources: ['project', 'payload', 'brain', 'opendb'],
        relationshipRules: Array.from({ length: 50 }, (_, i) => ({
          type: `RELATIONSHIP_${i}`,
          targetType: 'character',
          auto: false
        })),
        enrichmentStrategy: 'comprehensive',
        validationRules: Array.from({ length: 100 }, (_, i) => ({
          field: `field${i}`,
          rule: 'required' as const,
          message: `Field ${i} is required`
        }))
      }

      const initialSize = cache.size()

      await manager.register('character', largeConfig)

      const finalSize = cache.size()

      expect(finalSize).toBe(initialSize + 1)
    })
  })

  describe('Concurrent Access', () => {
    it('should handle concurrent reads', async () => {
      const manager = new CachedConfigManager(agentConfig, cache)

      await manager.register('character', {
        type: 'character',
        requiredFields: ['name'],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'standard'
      })

      const start = performance.now()

      // Simulate 100 concurrent reads
      const promises = Array.from({ length: 100 }, () => manager.get('character'))
      const results = await Promise.all(promises)

      const duration = performance.now() - start

      expect(results).toHaveLength(100)
      expect(results.every(r => r?.type === 'character')).toBe(true)
      expect(duration).toBeLessThan(100)
    })

    it('should handle concurrent writes', async () => {
      const manager = new CachedConfigManager(agentConfig, cache)

      const start = performance.now()

      // Simulate 100 concurrent writes
      const promises = Array.from({ length: 100 }, (_, i) =>
        manager.register(`entity${i}`, {
          type: `entity${i}`,
          requiredFields: ['name'],
          contextSources: ['project'],
          relationshipRules: [],
          enrichmentStrategy: 'standard'
        })
      )

      await Promise.all(promises)

      const duration = performance.now() - start

      expect(duration).toBeLessThan(500)
      expect(manager.getStats().loads).toBe(100)
    })
  })

  describe('Validation Performance', () => {
    it('should validate data quickly', () => {
      const config: EntityConfig = {
        type: 'character',
        requiredFields: ['name', 'description'],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'standard',
        validationRules: [
          { field: 'name', rule: 'required', message: 'Name required' },
          { field: 'name', rule: 'minLength', value: 2, message: 'Min 2 chars' },
          { field: 'description', rule: 'required', message: 'Description required' }
        ]
      }

      const data = {
        name: 'John Doe',
        description: 'A hero'
      }

      const start = performance.now()

      for (let i = 0; i < 1000; i++) {
        validate(config, data)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // 1000 validations under 100ms
    })

    it('should validate complex rules efficiently', () => {
      const config: EntityConfig = {
        type: 'test',
        requiredFields: Array.from({ length: 50 }, (_, i) => `field${i}`),
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'standard',
        validationRules: Array.from({ length: 50 }, (_, i) => ({
          field: `field${i}`,
          rule: 'required' as const,
          message: `Field ${i} required`
        }))
      }

      const data = Object.fromEntries(
        Array.from({ length: 50 }, (_, i) => [`field${i}`, `value${i}`])
      )

      const start = performance.now()
      const result = validate(config, data)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10)
      expect(result.valid).toBe(true)
    })
  })

  describe('Prompt Template Performance', () => {
    it('should substitute variables quickly', () => {
      const template = 'Character {{name}} in {{project}} ({{genre}}) - {{description}}'
      const variables = {
        name: 'John Doe',
        project: 'Test Movie',
        genre: 'Action',
        description: 'A brave hero fighting evil'
      }

      const start = performance.now()

      for (let i = 0; i < 10000; i++) {
        substituteVariables(template, variables)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // 10k substitutions under 100ms
    })

    it('should handle large templates efficiently', () => {
      const template = `
Analyze character {{name}} in {{project}}.

${'{{description}} '.repeat(100)}

Provide analysis for {{count}} aspects.
      `.trim()

      const variables = {
        name: 'Hero',
        project: 'Epic',
        description: 'Brave warrior',
        count: 50
      }

      const start = performance.now()
      const result = substituteVariables(template, variables)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10)
      expect(result).not.toContain('{{')
    })
  })

  describe('Benchmarks', () => {
    it('should report configuration operations performance', async () => {
      const manager = new CachedConfigManager(agentConfig, cache)

      const benchmarks = {
        register: 0,
        get: 0,
        cachedGet: 0
      }

      // Benchmark register
      const registerStart = performance.now()
      await manager.register('test', {
        type: 'test',
        requiredFields: ['name'],
        contextSources: ['project'],
        relationshipRules: [],
        enrichmentStrategy: 'standard'
      })
      benchmarks.register = performance.now() - registerStart

      // Benchmark first get (miss)
      manager.resetStats()
      const getStart = performance.now()
      await manager.get('test')
      benchmarks.get = performance.now() - getStart

      // Benchmark cached get (hit)
      manager.resetStats()
      const cachedStart = performance.now()
      await manager.get('test')
      benchmarks.cachedGet = performance.now() - cachedStart

      console.log('Configuration Benchmarks:', benchmarks)

      expect(benchmarks.register).toBeLessThan(10)
      expect(benchmarks.get).toBeLessThan(5)
      expect(benchmarks.cachedGet).toBeLessThan(2)
      expect(benchmarks.cachedGet).toBeLessThan(benchmarks.get)
    })
  })
})

// Helper functions
function validate(config: EntityConfig, data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  config.requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`Missing ${field}`)
    }
  })

  config.validationRules?.forEach(rule => {
    if (rule.rule === 'required' && !data[rule.field]) {
      errors.push(rule.message)
    }
    if (rule.rule === 'minLength' && data[rule.field]?.length < rule.value) {
      errors.push(rule.message)
    }
  })

  return { valid: errors.length === 0, errors }
}

function substituteVariables(template: string, variables: Record<string, any>): string {
  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  }, template)
}
