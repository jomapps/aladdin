/**
 * Cache Manager - Redis-based caching for agent operations
 */

import Redis from 'ioredis'
import type { CacheEntry } from './types'

export class CacheManager {
  private redis: Redis
  private cacheTTLs: {
    projectContextTTL: number
    documentTTL: number
    entityTTL: number
  }
  private memoryCache: Map<string, CacheEntry> = new Map()
  private isConnected: boolean = false

  constructor(
    redisConfig: { url: string },
    cacheTTLs: { projectContextTTL: number; documentTTL: number; entityTTL: number },
  ) {
    this.cacheTTLs = cacheTTLs

    // Initialize Redis client
    this.redis = new Redis(redisConfig.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    // Handle connection events
    this.redis.on('connect', () => {
      console.log('[CacheManager] Connected to Redis')
      this.isConnected = true
    })

    this.redis.on('error', (err) => {
      console.error('[CacheManager] Redis error:', err)
      this.isConnected = false
    })

    this.redis.on('close', () => {
      console.log('[CacheManager] Redis connection closed')
      this.isConnected = false
    })
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    // Check memory cache first
    const cached = this.memoryCache.get(key)
    if (cached) {
      // Check if expired
      if (Date.now() - cached.timestamp < cached.ttl * 1000) {
        console.log('[CacheManager] Memory cache hit:', key)
        return cached.data as T
      } else {
        // Expired, remove from cache
        this.memoryCache.delete(key)
      }
    }

    // Check Redis cache if connected
    if (this.isConnected) {
      try {
        const value = await this.redis.get(key)
        if (value) {
          console.log('[CacheManager] Redis cache hit:', key)
          const parsed = JSON.parse(value) as T

          // Store in memory cache for faster access
          this.memoryCache.set(key, {
            data: parsed,
            timestamp: Date.now(),
            ttl: this.cacheTTLs.entityTTL, // Default TTL
          })

          return parsed
        }
      } catch (error) {
        console.error('[CacheManager] Error getting from Redis:', error)
      }
    }

    return null
  }

  /**
   * Set value in cache
   */
  async set<T = any>(key: string, value: T, ttl: number): Promise<void> {
    // Store in memory cache
    this.memoryCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    })

    // Store in Redis cache if connected
    if (this.isConnected) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(value))
        console.log('[CacheManager] Cached in Redis:', key, `(TTL: ${ttl}s)`)
      } catch (error) {
        console.error('[CacheManager] Error setting in Redis:', error)
      }
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key)

    if (this.isConnected) {
      try {
        await this.redis.del(key)
        console.log('[CacheManager] Deleted from Redis:', key)
      } catch (error) {
        console.error('[CacheManager] Error deleting from Redis:', error)
      }
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    if (this.isConnected) {
      try {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
          console.log('[CacheManager] Cleared', keys.length, 'keys matching:', pattern)
        }
      } catch (error) {
        console.error('[CacheManager] Error clearing pattern:', error)
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()

    if (this.isConnected) {
      try {
        await this.redis.flushdb()
        console.log('[CacheManager] Cleared all Redis cache')
      } catch (error) {
        console.error('[CacheManager] Error clearing Redis:', error)
      }
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.isConnected) {
      await this.redis.quit()
      console.log('[CacheManager] Redis connection closed')
    }
  }
}
