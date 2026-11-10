'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Skeleton loaders for better perceived performance
 * Shows placeholder animations while content is loading
 */

export function ChartSkeleton() {
  return (
    <div className="w-full h-64 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg animate-pulse" />
  )
}

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
        <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}

export function RoadmapSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-muted/50 rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted/30 rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-muted/30 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TabsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-5 w-40 bg-muted rounded animate-pulse mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-muted/50 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-pulse"
        >
          <div className="flex-1">
            <div className="h-4 w-32 bg-muted rounded mb-2" />
            <div className="h-3 w-48 bg-muted/50 rounded" />
          </div>
          <div className="h-8 w-20 bg-muted rounded" />
        </div>
      ))}
    </div>
  )
}
