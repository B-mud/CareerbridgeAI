from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Try to use Supabase router, fall back to SQLite if unavailable
try:
    from app.api.resume_supabase import router as resume_router
    logger.info("✅ Using Supabase for persistence")
except Exception as e:
    logger.warning(f"⚠️ Supabase not available, using SQLite: {e}")
    from app.api.resume import router as resume_router
    from app.database import create_tables
    try:
        create_tables()
        logger.info("✅ SQLite database initialized")
    except Exception as db_error:
        logger.error(f"❌ Database initialization failed: {db_error}")

from app.api.skills import router as skills_router
from app.api.recommendations import router as recommendations_router
from app.api.text_analysis import router as text_router
from app.api.skill_gap import router as skill_gap_router
from app.api.user import router as user_router
from app.api.jobs import router as jobs_router
from app.api.mock_test import router as mock_test_router
from app.api.activity import router as activity_router

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="AI Career Mentor API", version="1.0.0")

# ✅ CORS middleware MUST be added FIRST, before all other middleware
# This ensures CORS headers are added to all responses, including error responses
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods including OPTIONS for preflight
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all response headers to frontend
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(resume_router, prefix="/api/resume", tags=["resume"])
app.include_router(skills_router, prefix="/api/skills", tags=["skills"])
app.include_router(skill_gap_router, prefix="/api/skill-gap", tags=["skill-gap"])
app.include_router(recommendations_router, prefix="/api/recommendations", tags=["recommendations"])
app.include_router(text_router, prefix="/api/resume", tags=["text-analysis"])
app.include_router(user_router, prefix="/api/user", tags=["user"])
app.include_router(jobs_router, prefix="/api/jobs", tags=["jobs"])
app.include_router(mock_test_router, prefix="/api/mock-test", tags=["mock-test"])
app.include_router(activity_router, tags=["activity"])

# ✅ Handle preflight requests (OPTIONS) for all routes
# This is important for CORS to work properly with browsers
@app.options("/{full_path:path}")
async def preflight_handler(full_path: str):
    """
    Handle CORS preflight requests.
    The CORSMiddleware will add appropriate headers automatically.
    """
    return {"message": "OK"}

@app.get("/")
async def root():
    # Check if using Supabase
    using_supabase = os.getenv("SUPABASE_URL") is not None
    
    return {
        "message": "AI Career Mentor API is running",
        "version": "1.0.0",
        "database": "Supabase (PostgreSQL)" if using_supabase else "SQLite (Local)",
        "endpoints": {
            "/api/resume/upload": "POST - Upload resume",
            "/api/resume/analyze/{file_id}": "GET - Analyze resume",
            "/api/skills/trending": "GET - Get trending skills",
            "/docs": "GET - API Documentation"
        }
    }

@app.get("/health")
async def health_check():
    using_supabase = os.getenv("SUPABASE_URL") is not None
    
    # Test Supabase connection if available
    db_status = "connected"
    if using_supabase:
        try:
            from app.database import test_connection
            db_status = "connected" if test_connection() else "disconnected"
        except:
            db_status = "error"
    
    return {
        "status": "healthy",
        "database": db_status,
        "database_type": "Supabase" if using_supabase else "SQLite",
        "ai_analyzer": "ready"
    }

@app.get("/test")
async def test_endpoint():
    return {
        "message": "Test endpoint working",
        "cors": "enabled",
        "timestamp": "2024-01-01T00:00:00Z"
    }

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*60)
    print("🚀 FastAPI server started successfully!")
    print("📍 Server running at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("💡 Frontend should connect to: http://localhost:8000")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")