"use client"

import { useState, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { SkillBadge } from "@/components/skill-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface SkillAnalysis {
  detected_skills: string[]
  missing_skills: string[]
  skill_scores: Record<string, number>
  recommendations: string[]
}

export default function SkillsPage() {
  const [skillAnalysis, setSkillAnalysis] = useState<SkillAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchSkillAnalysis = useCallback(async () => {
    try {
      // First check if we have stored analysis
      const storedAnalysis = localStorage.getItem("resume_analysis")
      const userProfile = localStorage.getItem("user_profile")
      const fileId = localStorage.getItem("resume_file_id")
      
      if (storedAnalysis) {
        const analysis = JSON.parse(storedAnalysis)
        setSkillAnalysis({
          detected_skills: analysis.detected_skills || [],
          missing_skills: analysis.missing_skills || [],
          skill_scores: analysis.skill_scores || {},
          recommendations: analysis.recommendations || []
        })
        setLoading(false)
        return
      }
      
      if (!fileId) {
        // Generate personalized mock data based on user profile
        const profile = userProfile ? JSON.parse(userProfile) : null
        const mockData = generatePersonalizedMockData(profile)
        setSkillAnalysis(mockData)
        setLoading(false)
        return
      }

      // Try to fetch from backend
      const response = await fetch(`http://localhost:8000/api/resume/full-analysis/${fileId}`)
      
      if (response.ok) {
        const result = await response.json()
        setSkillAnalysis({
          detected_skills: result.detected_skills || [],
          missing_skills: result.missing_skills || [],
          skill_scores: result.skill_scores || {},
          recommendations: result.recommendations || []
        })
      } else {
        throw new Error("Failed to fetch skill analysis")
      }
    } catch (err) {
      setError("Failed to load skill analysis")
      // Fallback to personalized mock data
      const userProfile = localStorage.getItem("user_profile")
      const profile = userProfile ? JSON.parse(userProfile) : null
      setSkillAnalysis(generatePersonalizedMockData(profile))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkillAnalysis()
  }, [fetchSkillAnalysis])

  const generatePersonalizedMockData = (profile: any) => {
    const baseSkills = ["Communication", "Problem Solving", "Teamwork"]
    let detectedSkills = [...baseSkills]
    let missingSkills: string[] = []
    let recommendations: string[] = []
    
    if (profile?.profession?.includes("Software") || profile?.profession?.includes("Developer")) {
      detectedSkills.push("JavaScript", "HTML", "CSS", "Git")
      missingSkills = ["TypeScript", "React", "Node.js", "AWS", "Docker"]
      recommendations = [
        "Learn TypeScript for better code quality",
        "Master React for frontend development",
        "Get familiar with cloud platforms like AWS"
      ]
    } else if (profile?.profession?.includes("Data")) {
      detectedSkills.push("Python", "SQL", "Excel")
      missingSkills = ["Machine Learning", "Pandas", "NumPy", "Tableau", "R"]
      recommendations = [
        "Learn machine learning fundamentals",
        "Master data visualization with Tableau",
        "Practice with real datasets on Kaggle"
      ]
    } else if (profile?.profession?.includes("UI") || profile?.profession?.includes("UX")) {
      detectedSkills.push("Design", "Figma", "Adobe Creative Suite")
      missingSkills = ["User Research", "Prototyping", "Usability Testing", "Sketch"]
      recommendations = [
        "Learn user research methodologies",
        "Practice prototyping with advanced tools",
        "Study design systems and accessibility"
      ]
    } else {
      detectedSkills.push("Microsoft Office", "Project Management")
      missingSkills = ["Python", "Data Analysis", "Digital Marketing", "Leadership"]
      recommendations = [
        "Learn basic programming with Python",
        "Develop leadership and management skills",
        "Get certified in your field of expertise"
      ]
    }
    
    // Add skills based on interests
    if (profile?.interests?.includes('web-dev')) {
      if (!detectedSkills.includes('JavaScript')) detectedSkills.push('JavaScript')
      missingSkills = missingSkills.filter(s => s !== 'React')
      if (!detectedSkills.includes('React')) missingSkills.unshift('React')
    }
    
    if (profile?.interests?.includes('ai-ml')) {
      missingSkills = missingSkills.filter(s => s !== 'Machine Learning')
      missingSkills.unshift('Machine Learning', 'TensorFlow')
    }
    
    const skillScores: Record<string, number> = {}
    detectedSkills.forEach(skill => {
      skillScores[skill] = Math.floor(Math.random() * 30) + 70 // 70-100
    })
    
    return {
      detected_skills: detectedSkills,
      missing_skills: missingSkills.slice(0, 8),
      skill_scores: skillScores,
      recommendations: recommendations
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    )
  }
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-foreground">Learning Path</h1>
            <Button onClick={fetchSkillAnalysis} variant="outline">
              Refresh Analysis
            </Button>
          </div>
          
          {error && (
            <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded">
              {error} (Showing sample data)
            </div>
          )}

          {/* Quick Skills Summary */}
          {skillAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Detected Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skillAnalysis?.detected_skills.slice(0, 5).map((skill) => (
                      <SkillBadge key={skill} skill={skill} type="detected" />
                    ))}
                    {skillAnalysis?.detected_skills.length > 5 && (
                      <span className="text-xs text-muted-foreground">+{skillAnalysis.detected_skills.length - 5}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Skills to Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skillAnalysis?.missing_skills.slice(0, 5).map((skill) => (
                      <SkillBadge key={skill} skill={skill} type="missing" />
                    ))}
                    {skillAnalysis?.missing_skills.length > 5 && (
                      <span className="text-xs text-muted-foreground">+{skillAnalysis.missing_skills.length - 5}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Growth Potential</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((skillAnalysis?.detected_skills.length || 0) / ((skillAnalysis?.detected_skills.length || 0) + (skillAnalysis?.missing_skills.length || 0)) * 100) || 60}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Skills mastered</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recommendations */}
          {skillAnalysis?.recommendations && skillAnalysis.recommendations.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {skillAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <span className="text-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}