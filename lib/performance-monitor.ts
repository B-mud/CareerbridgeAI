/**
 * Performance Monitoring - Track and log page performance metrics
 * Helps identify bottlenecks and optimize load times
 */

'use client'

import { useEffect, useCallback } from 'react'

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private marks: Map<string, number> = new Map()
  private readonly MAX_METRICS = 100

  /**
   * Start measuring a metric
   */
  mark(label: string): void {
    this.marks.set(label, performance.now())
  }

  /**
   * End measuring and record metric
   */
  measure(
    label: string,
    metadata?: Record<string, any>
  ): number | null {
    const startTime = this.marks.get(label)
    if (!startTime) {
      console.warn(`No mark found for label: ${label}`)
      return null
    }

    const duration = performance.now() - startTime
    
    this.metrics.push({
      name: label,
      duration,
      timestamp: Date.now(),
      metadata
    })

    // Keep metrics bounded
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }

    this.marks.delete(label)
    
    // Log slow operations (>1s)
    if (duration > 1000) {
      console.warn(`Slow operation: ${label} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  /**
   * Get all recorded metrics
   */
  getMetrics() {
    return [...this.metrics]
  }

  /**
   * Get average duration for a metric
   */
  getAverageDuration(name: string): number {
    const matching = this.metrics.filter(m => m.name === name)
    if (matching.length === 0) return 0
    return matching.reduce((sum, m) => sum + m.duration, 0) / matching.length
  }

  /**
   * Get performance summary
   */
  getSummary() {
    if (this.metrics.length === 0) {
      return { averageLoadTime: 0, slowestOperation: null, fastestOperation: null }
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    const averageLoadTime = totalDuration / this.metrics.length
    const slowestOperation = this.metrics.reduce((max, m) => 
      m.duration > max.duration ? m : max
    )
    const fastestOperation = this.metrics.reduce((min, m) => 
      m.duration < min.duration ? m : min
    )

    return {
      averageLoadTime: averageLoadTime.toFixed(2),
      slowestOperation: {
        name: slowestOperation.name,
        duration: slowestOperation.duration.toFixed(2)
      },
      fastestOperation: {
        name: fastestOperation.name,
        duration: fastestOperation.duration.toFixed(2)
      },
      totalMetrics: this.metrics.length
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.marks.clear()
  }

  /**
   * Report metrics to analytics (optional)
   */
  async reportMetrics(endpoint: string): Promise<void> {
    try {
      const summary = this.getSummary()
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: this.metrics, summary })
      })
    } catch (error) {
      console.error('Failed to report metrics:', error)
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * Hook to measure component render time
 */
export function useMeasureRender(componentName: string) {
  useEffect(() => {
    performanceMonitor.mark(`render-${componentName}`)
    
    return () => {
      performanceMonitor.measure(`render-${componentName}`, {
        component: componentName
      })
    }
  }, [componentName])
}

/**
 * Hook to measure async operation duration
 */
export function useMeasureAsync(label: string) {
  return useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    performanceMonitor.mark(label)
    try {
      const result = await fn()
      performanceMonitor.measure(label, { success: true })
      return result
    } catch (error) {
      performanceMonitor.measure(label, { success: false, error: String(error) })
      throw error
    }
  }, [label])
}
