"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface ParsedResume {
  name: string
  role: string
  skills: string[]
  experience: string
  summary: string
  skill_scores: Record<string, number>
  recommendations: string[]
}

export default function TestParsePage() {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ParsedResume | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    console.log("📤 Sending resume parse request to backend...")
    console.log("Name:", name)
    console.log("Role:", role)
    console.log("Resume text length:", resumeText.length)

    try {
      const response = await fetch("http://localhost:8000/api/resume/parse-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          role,
          resume_text: resumeText,
        }),
      })

      console.log("📥 Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to parse resume")
      }

      const data = await response.json()
      console.log("✅ Resume parsed successfully!")
      console.log("Data:", data)
      
      setResult(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse resume"
      console.error("❌ Error:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fillSampleData = () => {
    setName("John Doe")
    setRole("Software Engineer")
    setResumeText(`John Doe
Email: john.doe@example.com | Phone: (555) 123-4567
LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe

SUMMARY
Passionate Software Engineer with 2 years of experience in full-stack development. 
Proficient in Python, JavaScript, and modern web technologies. Strong problem-solving 
skills and experience working in agile teams.

EXPERIENCE

Software Developer | Tech Solutions Inc. | Jan 2022 - Present
- Developed and maintained web applications using React and Node.js
- Implemented RESTful APIs with Python and Flask
- Worked with PostgreSQL databases and Redis caching
- Collaborated with cross-functional teams using Agile methodologies
- Utilized Docker for containerization and AWS for cloud deployment

Intern Developer | StartupXYZ | Jun 2021 - Dec 2021
- Built frontend components using React and TypeScript
- Assisted in backend development with Node.js and Express
- Participated in code reviews and unit testing

EDUCATION
Bachelor of Science in Computer Science | University of Technology | 2021
- GPA: 3.8/4.0
- Relevant Coursework: Data Structures, Algorithms, Database Systems, Web Development

TECHNICAL SKILLS
- Programming Languages: Python, JavaScript, TypeScript, Java
- Frontend: React, HTML, CSS, Redux, Next.js
- Backend: Node.js, Express, Django, Flask
- Databases: PostgreSQL, MongoDB, MySQL, Redis
- Tools & Platforms: Git, Docker, AWS, Jenkins, CI/CD
- Methodologies: Agile, Scrum, Test-Driven Development

PROJECTS
E-Commerce Platform
- Built a full-stack e-commerce application using MERN stack
- Implemented user authentication, payment processing, and order management
- Deployed on AWS with automated CI/CD pipeline

Task Management App
- Created a collaborative task management tool with React and Firebase
- Integrated real-time updates and push notifications
- Achieved 1000+ active users within first month

CERTIFICATIONS
- AWS Certified Developer Associate
- MongoDB Certified Developer`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Test Resume Parser API</h1>
            <p className="text-muted-foreground">
              Test the new /parse-resume endpoint that dynamically extracts skills and generates recommendations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Resume Input</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Target Role/Interest</Label>
                    <Input
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g., Software Engineer, Data Scientist"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="resume">Resume Text</Label>
                    <Textarea
                      id="resume"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume text here..."
                      className="min-h-[300px] font-mono text-sm"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        "Parse Resume"
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={fillSampleData}>
                      Fill Sample
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Results Display */}
            <div className="space-y-4">
              {error && (
                <Card className="border-red-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="h-5 w-5" />
                      Error
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600">{error}</p>
                  </CardContent>
                </Card>
              )}

              {result && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        Parse Successful
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{result.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p className="font-medium">{result.role}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Experience</p>
                        <p className="font-medium">{result.experience}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Summary</p>
                        <p className="text-sm">{result.summary}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Skills Detected ({result.skills.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {result.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill} ({result.skill_scores[skill] || 50}%)
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-medium text-primary">{index + 1}</span>
                            </span>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              )}

              {!result && !error && !loading && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <p>Results will appear here after parsing</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
