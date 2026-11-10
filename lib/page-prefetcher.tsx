/**
 * Page Prefetcher - Intelligent prefetching of navigation links
 * and sequential data loading for faster page transitions
 */

import { useEffect, useCallback, useRef } from 'react'

interface PrefetchLink {
  href: string
  dataFetchers?: Array<() => Promise<any>>
}

class PagePrefetcher {
  private prefetchedLinks: Set<string> = new Set()
  private pendingRequests: Map<string, Promise<any>> = new Map()

  /**
   * Prefetch a page and its data in the background
   */
  async prefetch(options: PrefetchLink): Promise<void> {
    if (this.prefetchedLinks.has(options.href)) {
      return
    }

    try {
      // Prefetch data fetchers if provided
      if (options.dataFetchers) {
        const dataPromises = options.dataFetchers.map(fetcher => 
          fetcher().catch(err => {
            console.warn(`Prefetch data failed for ${options.href}:`, err)
            return null
          })
        )
        this.pendingRequests.set(options.href, Promise.all(dataPromises))
      }

      this.prefetchedLinks.add(options.href)
    } catch (error) {
      console.error('Prefetch error:', error)
    }
  }

  /**
   * Get prefetched data for a page
   */
  async getPrefetchedData(href: string): Promise<any[] | null> {
    return this.pendingRequests.get(href) || null
  }

  /**
   * Clear prefetch cache
   */
  clear(): void {
    this.prefetchedLinks.clear()
    this.pendingRequests.clear()
  }

  /**
   * Get prefetch status (for debugging)
   */
  getStatus() {
    return {
      prefetched: this.prefetchedLinks.size,
      pending: this.pendingRequests.size
    }
  }
}

export const pagePrefetcher = new PagePrefetcher()

/**
 * Hook to trigger prefetch on hover
 */
export function usePrefetchOnHover(links: PrefetchLink[]) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleMouseEnter = useCallback((link: PrefetchLink) => {
    // Debounce prefetch by 100ms to avoid prefetching on quick hovers
    timeoutRef.current = setTimeout(() => {
      pagePrefetcher.prefetch(link)
    }, 100)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { handleMouseEnter, handleMouseLeave }
}

/**
 * Prefetch link component with built-in hover prefetching
 */
'use client'

import Link, { LinkProps } from 'next/link'
import { ReactNode } from 'react'

interface PrefetchLinkProps extends LinkProps {
  children: ReactNode
  className?: string
  dataFetchers?: Array<() => Promise<any>>
  onPrefetch?: () => void
}

export function PrefetchLink({ 
  dataFetchers, 
  onPrefetch,
  ...props 
}: PrefetchLinkProps) {
  const handleMouseEnter = useCallback(async () => {
    const href = typeof props.href === 'string' ? props.href : props.href.toString()
    await pagePrefetcher.prefetch({ href, dataFetchers })
    onPrefetch?.()
  }, [dataFetchers, onPrefetch, props.href])

  return (
    <Link {...props} onMouseEnter={handleMouseEnter} />
  )
}
