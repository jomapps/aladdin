/**
 * Multi-Layer Cache System
 * L1: Memory (Map-based)
 * L2: Redis
 * L3: Database fallback
 * Phase 7: Production Polish
 */

import { getRedisCache } from './redis'

interface CacheEntry<T> {
  value: T
  expiry: number
}

interface CacheOptions {
  ttl?: number
  skipL1?: boolean
  skipL2?: boolean
}

export class MultiLayerCache {
  private l1Cache: Map<string, CacheEntry<any>>
  private l2Cache = getRedisCache()
  private l1MaxSize: number
  private l1DefaultTTL: number

  constructor(options: { l1MaxSize?: number; l1DefaultTTL?: number } = {}) {
    this.l1Cache = new Map()
    this.l1MaxSize = options.l1MaxSize || 1000
    this.l1DefaultTTL = options.l1DefaultTTL || 300 // 5 minutes
  }

  /**
   * Get value from cache (L1 -> L2 -> L3)
   */
  async get<T = any>(
    key: string,
    l3Fallback?: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T | null> {
    // Try L1 (memory)
    if (!options?.skipL1) {
      const l1Value = this.getFromL1<T>(key)
      if (l1Value !== null) {
        return l1Value
      }
    }

    // Try L2 (Redis)
    if (!options?.skipL2) {
      const l2Value = await this.l2Cache.get<T>(key)
      if (l2Value !== null) {
        // Warm L1 cache
        this.setInL1(key, l2Value, options?.ttl)
        return l2Value
      }
    }

    // Try L3 (fallback function)
    if (l3Fallback) {
      const l3Value = await l3Fallback()
      if (l3Value !== null) {
        // Warm both L1 and L2
        await this.set(key, l3Value, options)
        return l3Value
      }
    }

    return null
  }

  /**
   * Set value in all cache layers
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    const ttl = options?.ttl

    // Set in L1
    if (!options?.skipL1) {
      this.setInL1(key, value, ttl)
    }

    // Set in L2
    if (!options?.skipL2) {
      await this.l2Cache.set(key, value, { ttl })
    }

    return true
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string): Promise<boolean> {
    this.l1Cache.delete(key)
    await this.l2Cache.delete(key)
    return true
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidate(pattern: string): Promise<number> {
    // L1: Simple pattern matching
    let count = 0
    for (const key of this.l1Cache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.l1Cache.delete(key)
        count++
      }
    }

    // L2: Redis pattern delete
    const l2Count = await this.l2Cache.deletePattern(pattern)

    return count + l2Count
  }

  /**
   * Get from L1 cache
   */
  private getFromL1<T>(key: string): T | null {
    const entry = this.l1Cache.get(key)
    if (!entry) return null

    // Check expiry
    if (entry.expiry < Date.now()) {
      this.l1Cache.delete(key)
      return null
    }

    return entry.value as T
  }

  /**
   * Set in L1 cache with LRU eviction
   */
  private setInL1(key: string, value: any, ttl?: number): void {
    // Evict if at max size
    if (this.l1Cache.size >= this.l1MaxSize) {
      const firstKey = this.l1Cache.keys().next().value
      if (firstKey) {
        this.l1Cache.delete(firstKey)
      }
    }

    const expiry = Date.now() + (ttl || this.l1DefaultTTL) * 1000

    this.l1Cache.set(key, { value, expiry })
  }

  /**
   * Simple pattern matching for cache keys
   */
  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return regex.test(key)
  }

  /**
   * Warm cache with data
   */
  async warm(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    // Warm L1
    for (const entry of entries) {
      this.setInL1(entry.key, entry.value, entry.ttl)
    }

    // Warm L2
    await this.l2Cache.mset(entries)
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    l1: { size: number; maxSize: number }
    l2: Awaited<ReturnType<typeof this.l2Cache.getStats>>
  }> {
    return {
      l1: {
        size: this.l1Cache.size,
        maxSize: this.l1MaxSize,
      },
      l2: await this.l2Cache.getStats(),
    }
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.l1Cache.clear()
    await this.l2Cache.clear()
  }
}

// Singleton instance
let multiLayerCacheInstance: MultiLayerCache | null = null

export function getMultiLayerCache(): MultiLayerCache {
  if (!multiLayerCacheInstance) {
    multiLayerCacheInstance = new MultiLayerCache()
  }
  return multiLayerCacheInstance
}
