@echo off
REM Quick Start Script for Supabase Integration
REM Run this script to set up and test the complete integration

echo ============================================================
echo     AI Career Mentor - Supabase Integration Setup
echo ============================================================
echo.

cd backend

echo [Step 1/5] Installing dependencies...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

echo [Step 2/5] Checking environment variables...
if not exist .env (
    echo ❌ ERROR: .env file not found!
    echo Please create backend\.env with your Supabase credentials
    pause
    exit /b 1
)
echo ✅ .env file found
echo.

echo [Step 3/5] Testing Supabase connection...
python test_supabase.py
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ WARNING: Supabase connection test failed
    echo.
    echo Possible reasons:
    echo 1. SQL schema not run in Supabase (run supabase_schema.sql)
    echo 2. Invalid credentials in .env file
    echo 3. Supabase project is paused or inactive
    echo.
    echo The backend will fall back to SQLite if Supabase is unavailable.
    echo Press any key to continue with SQLite fallback, or Ctrl+C to stop...
    pause
)
echo.

echo [Step 4/5] Starting backend server...
echo.
echo ============================================================
echo 🚀 Backend will start on http://localhost:8000
echo 📚 API docs available at http://localhost:8000/docs
echo 🔍 Health check at http://localhost:8000/health
echo ============================================================
echo.
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn main:app --reload --port 8000

pause
