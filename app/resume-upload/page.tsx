"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { UploadForm } from "@/components/upload-form"
import { PageTransition } from "@/components/page-transition"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { SessionManager, UserProfile } from "@/lib/session-manager"

export default function ResumeUploadPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const router = useRouter()

  useEffect(() => {
    const profile = SessionManager.getUserProfile()
    setUserProfile(profile)
  }, [])

  return (
    <PageTransition>
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16">
          {!userProfile && (
            <div className="max-w-2xl mx-auto text-center mb-8 p-6 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-2">
                Complete Your Profile First
              </h2>
              <p className="text-orange-700 dark:text-orange-300 mb-4">
                To get personalized recommendations, please complete your profile first.
              </p>
              <Button asChild>
                <Link href="/get-started">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Complete Profile
                </Link>
              </Button>
            </div>
          )}
          
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {userProfile?.name ? `Hi ${userProfile.name}! Upload Your Resume` : 'Upload Your Resume'}
            </h1>
            <p className="text-xl text-muted-foreground">
              {userProfile?.profession 
                ? `Let's analyze your ${userProfile.profession} resume and find opportunities to grow`
                : 'Upload your resume to get AI-powered skill analysis and career recommendations'
              }
            </p>
            {userProfile && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  We'll personalize your analysis based on your interests in {userProfile.interests?.slice(0, 2).join(' and ')}
                  {(userProfile.interests?.length || 0) > 2 && ` and ${(userProfile.interests?.length || 0) - 2} more areas`}
                </p>
              </div>
            )}
          </div>
          <UploadForm />
        </div>
      </main>
    </PageTransition>
  )
}