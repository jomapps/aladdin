/**
 * Redis Cache Layer
 * Phase 7: Production Polish
 */

import Redis from 'ioredis'

interface CacheOptions {
  ttl?: number // Time to live in seconds
  namespace?: string
}

export class RedisCache {
  private client: Redis
  private defaultTTL: number
  private namespace: string

  constructor(options: { url?: string; defaultTTL?: number; namespace?: string } = {}) {
    const redisUrl = options.url || process.env.REDIS_URL || 'redis://localhost:6379'

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          return true
        }
        return false
      },
    })

    this.defaultTTL = options.defaultTTL || 3600 // 1 hour default
    this.namespace = options.namespace || 'aladdin'

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err)
    })

    this.client.on('connect', () => {
      console.log('✅ Redis connected')
    })
  }

  /**
   * Generate namespaced key
   */
  private getKey(key: string): string {
    return `${this.namespace}:${key}`
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(this.getKey(key))
      if (!value) return null

      return JSON.parse(value) as T
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)
      const ttl = options?.ttl || this.defaultTTL
      const fullKey = this.getKey(key)

      if (ttl > 0) {
        await this.client.setex(fullKey, ttl, serialized)
      } else {
        await this.client.set(fullKey, serialized)
      }

      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.client.del(this.getKey(key))
      return true
    } catch (error) {
      console.error('Redis delete error:', error)
      return false
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(this.getKey(pattern))
      if (keys.length === 0) return 0

      await this.client.del(...keys)
      return keys.length
    } catch (error) {
      console.error('Redis deletePattern error:', error)
      return 0
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(this.getKey(key))
      return result === 1
    } catch (error) {
      console.error('Redis exists error:', error)
      return false
    }
  }

  /**
   * Get remaining TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(this.getKey(key))
    } catch (error) {
      console.error('Redis ttl error:', error)
      return -1
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await this.client.incrby(this.getKey(key), by)
    } catch (error) {
      console.error('Redis increment error:', error)
      return 0
    }
  }

  /**
   * Get multiple values at once
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map((k) => this.getKey(k))
      const values = await this.client.mget(...fullKeys)

      return values.map((v) => {
        if (!v) return null
        try {
          return JSON.parse(v) as T
        } catch {
          return null
        }
      })
    } catch (error) {
      console.error('Redis mget error:', error)
      return keys.map(() => null)
    }
  }

  /**
   * Set multiple values at once
   */
  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline()

      for (const entry of entries) {
        const serialized = JSON.stringify(entry.value)
        const fullKey = this.getKey(entry.key)
        const ttl = entry.ttl || this.defaultTTL

        if (ttl > 0) {
          pipeline.setex(fullKey, ttl, serialized)
        } else {
          pipeline.set(fullKey, serialized)
        }
      }

      await pipeline.exec()
      return true
    } catch (error) {
      console.error('Redis mset error:', error)
      return false
    }
  }

  /**
   * Clear all keys in namespace
   */
  async clear(): Promise<number> {
    return this.deletePattern('*')
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean
    keyCount: number
    memoryUsed: string
  }> {
    try {
      const info = await this.client.info('memory')
      const keyCount = await this.client.dbsize()

      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/)
      const memoryUsed = memoryMatch ? memoryMatch[1] : 'unknown'

      return {
        connected: this.client.status === 'ready',
        keyCount,
        memoryUsed,
      }
    } catch (error) {
      console.error('Redis getStats error:', error)
      return {
        connected: false,
        keyCount: 0,
        memoryUsed: 'unknown',
      }
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    await this.client.quit()
  }
}

// Singleton instance
let cacheInstance: RedisCache | null = null

export function getRedisCache(): RedisCache {
  if (!cacheInstance) {
    cacheInstance = new RedisCache()
  }
  return cacheInstance
}
