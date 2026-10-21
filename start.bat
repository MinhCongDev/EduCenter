@echo off
REM EduCenter - Start both backend and frontend in separate windows
REM Usage: double-click start.bat

echo ============================================
echo  Starting EduCenter (Backend + Frontend)
echo ============================================

REM Start backend in new window
start "EduCenter-Backend" cmd /k "cd /d C:\Users\admin\Downloads\WDP\EduCenter-main\backend && npm run dev"

REM Wait 3s for backend to start first
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "EduCenter-Frontend" cmd /k "cd /d C:\Users\admin\Downloads\WDP\EduCenter-main\frontend && npm run dev"

echo.
echo Both services starting in separate windows.
echo   Backend  -> http://localhost:5000
echo   Frontend -> http://localhost:5173
echo.
echo Close those windows to stop the services.
pause
