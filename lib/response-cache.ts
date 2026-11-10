/**
 * Response Cache Manager - Caches API responses to reduce network requests
 * and improve page load times with intelligent TTL management
 */

'use client'

import { useState, useEffect } from 'react'

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly MAX_CACHE_SIZE = 50
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get cached response if valid (not expired)
   */
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if cache expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set response in cache with TTL
   */
  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    // Simple LRU: remove oldest when cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Clear entire cache or by pattern
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Prefetch and cache data
   */
  async prefetch(
    key: string,
    fetcher: () => Promise<any>,
    ttl?: number
  ): Promise<any> {
    const cached = this.get(key)
    if (cached) return cached

    try {
      const data = await fetcher()
      this.set(key, data, ttl)
      return data
    } catch (error) {
      console.error(`Prefetch failed for ${key}:`, error)
      return null
    }
  }

  /**
   * Get cache stats (for debugging)
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE
    }
  }
}

// Export singleton instance
export const responseCache = new ResponseCache()

/**
 * Custom hook for cached fetch with automatic invalidation
 */
export function useCachedFetch(
  url: string,
  options?: {
    ttl?: number
    skip?: boolean
    onSuccess?: (data: any) => void
    onError?: (error: any) => void
  }
) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    if (options?.skip) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // Check cache first
        const cached = responseCache.get(url)
        if (cached) {
          setData(cached)
          options?.onSuccess?.(cached)
          setLoading(false)
          return
        }

        // Fetch fresh data
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const result = await response.json()
        responseCache.set(url, result, options?.ttl)
        setData(result)
        options?.onSuccess?.(result)
      } catch (err) {
        setError(err)
        options?.onError?.(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url, options])

  return { data, loading, error }
}
