@echo off
REM ============================================
REM MongoDB Embedded Server Starter
REM ============================================
echo ========================================
echo   Starting MongoDB Local Server
echo ========================================

REM Create data folder if not exists
if not exist "C:\data\db" mkdir "C:\data\db"

REM Try common MongoDB locations
set MONGO_PATH=

if exist "C:\mongodb\bin\mongod.exe" set MONGO_PATH=C:\mongodb\bin\mongod.exe
if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" set MONGO_PATH="C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
if exist "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" set MONGO_PATH="C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
if exist "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" set MONGO_PATH="C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"

if "%MONGO_PATH%"=="" (
  echo.
  echo [ERROR] MongoDB not found in common locations!
  echo.
  echo Please install MongoDB from:
  echo   https://www.mongodb.com/try/download/community
  echo.
  echo OR download ZIP and extract to C:\mongodb\
  echo.
  pause
  exit /b 1
)

echo Found MongoDB at: %MONGO_PATH%
echo Starting server on port 27017...
echo Data folder: C:\data\db
echo.
echo ========================================
echo   MongoDB is running! Don't close this window.
echo ========================================
echo.

"%MONGO_PATH%" --dbpath C:\data\db

pause
