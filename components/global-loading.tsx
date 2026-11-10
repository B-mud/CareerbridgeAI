"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export function GlobalLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Show loading on route change
    console.log("🔄 [GlobalLoading] Route change detected:", pathname)
    setIsLoading(true)
    
    // Hide loading after animation
    const timeout = setTimeout(() => {
      setIsLoading(false)
      console.log("✅ [GlobalLoading] Loading complete")
    }, 600)

    return () => clearTimeout(timeout)
  }, [pathname])

  if (!isLoading) return null

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md transition-opacity duration-300"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
