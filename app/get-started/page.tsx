"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SessionManager } from "@/lib/session-manager"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageTransition } from "@/components/page-transition"
import { User, Heart, ArrowRight } from "lucide-react"

const professions = [
  "Software Engineer",
  "Data Scientist", 
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Product Manager",
  "UI/UX Designer",
  "Mobile Developer",
  "Machine Learning Engineer",
  "Cybersecurity Specialist",
  "Cloud Architect",
  "Student",
  "Other"
]

const interests = [
  { id: "web-dev", label: "Web Development", icon: "💻", color: "bg-blue-100 dark:bg-blue-900" },
  { id: "mobile-dev", label: "Mobile Development", icon: "📱", color: "bg-green-100 dark:bg-green-900" },
  { id: "data-science", label: "Data Science", icon: "📊", color: "bg-purple-100 dark:bg-purple-900" },
  { id: "ai-ml", label: "AI & Machine Learning", icon: "🤖", color: "bg-red-100 dark:bg-red-900" },
  { id: "cloud", label: "Cloud Computing", icon: "☁️", color: "bg-cyan-100 dark:bg-cyan-900" },
  { id: "devops", label: "DevOps", icon: "⚙️", color: "bg-orange-100 dark:bg-orange-900" },
  { id: "cybersecurity", label: "Cybersecurity", icon: "🔒", color: "bg-yellow-100 dark:bg-yellow-900" },
  { id: "blockchain", label: "Blockchain", icon: "⛓️", color: "bg-indigo-100 dark:bg-indigo-900" },
  { id: "game-dev", label: "Game Development", icon: "🎮", color: "bg-pink-100 dark:bg-pink-900" },
  { id: "ui-ux", label: "UI/UX Design", icon: "🎨", color: "bg-teal-100 dark:bg-teal-900" },
  { id: "product-mgmt", label: "Product Management", icon: "📋", color: "bg-lime-100 dark:bg-lime-900" },
  { id: "startup", label: "Entrepreneurship", icon: "🚀", color: "bg-rose-100 dark:bg-rose-900" }
]

export default function GetStartedPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    profession: "",
    experience: "",
    interests: [] as string[]
  })

  useEffect(() => {
    // Load existing profile if available and not expired
    const existingProfile = SessionManager.getUserProfile()
    if (existingProfile) {
      setFormData({
        name: existingProfile.name,
        age: existingProfile.age,
        profession: existingProfile.profession,
        experience: existingProfile.experience,
        interests: existingProfile.interests
      })
    }
  }, [])

  const handleInterestToggle = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }))
  }

  const handleSubmit = () => {
    const profileData = {
      ...formData,
      created_at: new Date().toISOString(),
      session_id: Date.now().toString()
    }
    SessionManager.saveUserProfile(profileData)
    router.push("/resume-upload")
  }

  const isFormValid = formData.name && formData.age && formData.profession && formData.interests.length > 0

  return (
    <PageTransition>
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Let's Get to Know You! 👋
              </h1>
              <p className="text-xl text-muted-foreground">
                Tell us about yourself to get personalized career recommendations
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter your age"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profession">Current Profession</Label>
                    <Select value={formData.profession} onValueChange={(value) => setFormData(prev => ({ ...prev, profession: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your profession" />
                      </SelectTrigger>
                      <SelectContent>
                        {professions.map((profession) => (
                          <SelectItem key={profession} value={profession}>
                            {profession}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Fresh Graduate / No Experience</SelectItem>
                        <SelectItem value="1-2">1-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    Your Interests
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select areas you're passionate about (choose at least one)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {interests.map((interest) => (
                      <div
                        key={interest.id}
                        onClick={() => handleInterestToggle(interest.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                          formData.interests.includes(interest.id)
                            ? `${interest.color} border-primary shadow-md`
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">{interest.icon}</div>
                          <div className="text-sm font-medium text-foreground">
                            {interest.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <span className="text-sm font-medium">Personal Details</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <span className="text-sm text-muted-foreground">Resume Upload</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <span className="text-sm text-muted-foreground">Analysis</span>
                </div>
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={!isFormValid}
                size="lg"
                className="px-8"
              >
                Continue to Resume Upload
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {!isFormValid && (
                <p className="text-sm text-muted-foreground mt-2">
                  Please fill in all details and select at least one interest
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  )
}