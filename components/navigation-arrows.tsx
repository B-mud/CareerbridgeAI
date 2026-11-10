"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const pageFlow = [
  "/",
  "/get-started", 
  "/resume-upload",
  "/resume-upload/parse-resume",
  "/skills",
  "/dashboard",
  "/dashboard/recommendations"
]

export function NavigationArrows() {
  const router = useRouter()
  const pathname = usePathname()
  
  const currentIndex = pageFlow.findIndex(path => {
    if (path === "/resume-upload/parse-resume") {
      return pathname.startsWith("/resume-upload/parse-resume")
    }
    return pathname === path
  })
  
  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < pageFlow.length - 1 && currentIndex !== -1
  
  const goBack = () => {
    if (canGoBack) {
      router.push(pageFlow[currentIndex - 1])
    }
  }
  
  const goForward = () => {
    if (canGoForward) {
      const nextPath = pageFlow[currentIndex + 1]
      if (nextPath === "/resume-upload/parse-resume") {
        const fileId = localStorage.getItem("resume_file_id")
        if (fileId) {
          router.push(`${nextPath}?fileId=${fileId}`)
        } else {
          router.push("/resume-upload")
        }
      } else {
        router.push(nextPath)
      }
    }
  }
  
  if (pathname === "/" || currentIndex === -1) {
    return null
  }
  
  return (
    <div className="fixed bottom-6 right-6 flex gap-2 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={goBack}
        disabled={!canGoBack}
        className="h-12 w-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="outline" 
        size="icon"
        onClick={goForward}
        disabled={!canGoForward}
        className="h-12 w-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}