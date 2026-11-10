@echo off
echo ========================================
echo   AI Career Mentor - Starting System
echo ========================================
echo.

echo [1/2] Starting Backend Server...
cd backend
start cmd /k "venv\Scripts\activate && python main.py"
cd ..

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server...
start cmd /k "npm run dev"

echo.
echo ========================================
echo   System Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit this window...
pause >nul
