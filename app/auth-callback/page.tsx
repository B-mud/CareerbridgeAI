"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { session } = useAuth()

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!session?.access_token) return

      try {
        // Check if user has a resume in the database
        const response = await fetch('http://localhost:8000/api/resume/latest', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (response.ok) {
          const resumeData = await response.json()
          if (resumeData && resumeData.file_id) {
            // User has a resume, go straight to dashboard
            router.push('/dashboard')
            return
          }
        }
      } catch (err) {
        console.error("Error checking for existing resume:", err)
      }
      
      // No resume found or error occurred, go to get-started
      router.push('/get-started')
    }

    checkUserStatus()
  }, [session, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-semibold">Completing sign in...</h2>
      <p className="text-muted-foreground mt-2">Please wait while we set up your account.</p>
    </div>
  )
}
