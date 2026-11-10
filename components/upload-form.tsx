"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { SessionManager } from "@/lib/session-manager"
import { useAuth } from "@/lib/auth-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, CheckCircle, AlertCircle, Type, X, Loader2 } from "lucide-react"
import { ErrorPopup } from "@/components/error-popup"
import { LoadingScreen } from "@/components/loading-screen"

export function UploadForm() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<"file" | "text">("file")
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (selectedFile: File) => {
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Only PDF and DOCX files are supported")
      setShowErrorPopup(true)
      return
    }

    setError("")
    setFile(selectedFile)
    setUploadMethod("file")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileChange(selectedFile)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file && !resumeText.trim()) {
      setError("Please upload a file or paste your resume text")
      setShowErrorPopup(true)
      return
    }

    setUploading(true)
    setError("")

    try {
      // Get JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError("Please sign in to upload your resume")
        setShowErrorPopup(true)
        setUploading(false)
        return
      }

      const token = session.access_token
      
      let response: Response
      let result: any
      
      if (uploadMethod === "file" && file) {
        const formData = new FormData()
        formData.append("file", file)
        // Role will be auto-extracted by Gemini - no need to send target_role
        
        // Call FastAPI backend with JWT token
        response = await fetch("http://localhost:8000/api/resume/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData,
          mode: "cors"
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || `Backend error: ${response.status}`)
        }
        
        result = await response.json()
      } else {
        // Handle text input
        const textData = {
          resume_text: resumeText,
          target_role: targetRole || "software_engineer"
        }
        
        response = await fetch("http://localhost:8000/api/resume/analyze-text", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(textData),
          mode: "cors"
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || `Backend error: ${response.status}`)
        }
        
        result = await response.json()
      }

      if (result.success) {
        setSuccess(true)
        setFile(null)
        setResumeText("")
        
        if (result.analysis) {
          // Add file_id to analysis so it can be matched later
          const analysisToSave = {
            ...result.analysis,
            file_id: result.file_id
          }
          SessionManager.saveResumeAnalysis(analysisToSave)
        }
        
        if (result.file_id) {
          SessionManager.saveFileId(result.file_id)
          setTimeout(() => {
            router.push(`/resume-upload/parse-resume?fileId=${result.file_id}`)
          }, 1500)
        }
      } else {
        throw new Error(result.message || "Upload failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed. Please try again."
      setError(errorMessage)
      setShowErrorPopup(true)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {uploading && (
        <LoadingScreen 
          message="Analyzing Your Resume" 
          submessage="Our AI is reading through your experience and skills..."
        />
      )}
      
      <ErrorPopup
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        message={error}
        onRetry={() => {
          setShowErrorPopup(false)
          setError("")
        }}
      />
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-green-600 font-medium mb-4">Resume analyzed successfully!</p>
              <p className="text-muted-foreground text-sm">Redirecting to results...</p>
            </div>
          ) : (
            <>
              {/* Upload Method Tabs */}
              <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "file" | "text")} role="tablist" aria-label="Resume upload method">
                <TabsList className="grid w-full grid-cols-2" role="presentation">
                  <TabsTrigger value="file" className="flex items-center gap-2" role="tab" aria-selected={uploadMethod === "file"} aria-controls="file-panel">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2" role="tab" aria-selected={uploadMethod === "text"} aria-controls="text-panel">
                    <Type className="h-4 w-4" aria-hidden="true" />
                    Paste Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4" role="tabpanel" id="file-panel" aria-labelledby="file-trigger">
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      dragActive 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Drop zone for resume file upload"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        fileInputRef.current?.click()
                      }
                    }}
                  >
                    <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors ${
                      dragActive ? "text-primary" : "text-muted-foreground"
                    }`} aria-hidden="true" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleInputChange}
                      className="hidden"
                      aria-label="File input for resume upload"
                    />
                    <div className="space-y-2">
                      <p className="text-primary hover:text-primary/80 font-medium">
                        {dragActive ? "Drop your resume here" : "Click to select or drag & drop your resume"}
                      </p>
                      <p className="text-sm text-muted-foreground">PDF or DOCX files only • Max 10MB</p>
                    </div>
                  </div>

                  {file && (
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg" role="status" aria-live="polite">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-green-600" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">{file.name}</p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setFile(null)} 
                        variant="ghost" 
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="text" className="space-y-4" role="tabpanel" id="text-panel" aria-labelledby="text-trigger">
                  <div className="space-y-2">
                    <Label htmlFor="resume-text">Paste Your Resume Text</Label>
                    <Textarea
                      id="resume-text"
                      placeholder="Paste your complete resume text here..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="min-h-[200px] resize-none"
                      aria-label="Resume text input"
                      aria-describedby="resume-text-help"
                    />
                    <p className="text-sm text-muted-foreground" id="resume-text-help">
                      {resumeText.length} characters • Include all sections: contact, experience, education, skills
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg" role="alert" aria-live="assertive">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={uploading || (!file && !resumeText.trim())}
                className="w-full transition-all duration-200 hover:scale-105 hover:shadow-lg"
                size="lg"
                aria-label="Analyze resume"
                aria-busy={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                    Analyze Resume
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}