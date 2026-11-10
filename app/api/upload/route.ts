import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // This is a fallback API when FastAPI backend is not running
    console.log("Using Next.js fallback API - FastAPI backend not available")
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only PDF and DOCX files are allowed." },
        { status: 400 }
      )
    }

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    return NextResponse.json({ 
      success: true, 
      message: `Resume ${file.name} uploaded successfully (using fallback API)`,
      file_id: `mock-${Date.now()}`,
      skills_detected: ["JavaScript", "React", "Node.js", "Python", "SQL", "Git"]
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Next.js fallback API is running. For full functionality, start the FastAPI backend.",
    backend_url: "http://localhost:8000"
  })
}