@echo off
REM EduCenter - Stop backend and frontend dev servers (kills port 5000 / 5173)

echo Stopping EduCenter services...

for %%P in (5000 5173) do (
  for /f "tokens=5" %%A in ('netstat -aon ^| findstr ":%%P " ^| findstr LISTENING') do (
    echo   Killing PID %%A on port %%P
    taskkill /F /PID %%A >nul 2>&1
  )
)

echo Done.
pause
