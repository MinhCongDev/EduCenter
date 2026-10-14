# ============================================
# Install MongoDB Local - PowerShell Script
# ============================================
# Run as Administrator!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MongoDB Local Installation Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as administrator'" -ForegroundColor Yellow
    pause
    exit
}

# Check if MongoDB already installed
$commonPaths = @(
    "C:\mongodb\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
)

$found = $false
foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        Write-Host "[OK] MongoDB found at: $path" -ForegroundColor Green
        $found = $true
        break
    }
}

if (-not $found) {
    Write-Host "[INFO] MongoDB not found. Starting download..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  MANUAL INSTALLATION REQUIRED" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please follow these steps:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Open browser: " -NoNewline -ForegroundColor White
    Write-Host "https://www.mongodb.com/try/download/community" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Select:" -ForegroundColor White
    Write-Host "   - Version: 7.0.x (current)" -ForegroundColor Gray
    Write-Host "   - Platform: Windows x64" -ForegroundColor Gray
    Write-Host "   - Package: MSI" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Download and run the installer" -ForegroundColor White
    Write-Host ""
    Write-Host "4. During installation:" -ForegroundColor White
    Write-Host "   - Choose 'Complete' setup" -ForegroundColor Gray
    Write-Host "   - [IMPORTANT] Tick 'Install MongoDB as a Service'" -ForegroundColor Gray
    Write-Host "   - Service Name: MongoDB Server" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. After installation completes, run this script again" -ForegroundColor White
    Write-Host ""

    # Open browser
    Start-Process "https://www.mongodb.com/try/download/community"

    Read-Host "Press Enter after installation is complete..."
}

# Create data directory
Write-Host ""
Write-Host "[INFO] Creating data directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "C:\data\db" | Out-Null
Write-Host "[OK] Created C:\data\db" -ForegroundColor Green

# Try to start MongoDB as service
Write-Host ""
Write-Host "[INFO] Trying to start MongoDB service..." -ForegroundColor Yellow

try {
    Start-Service -Name "MongoDB" -ErrorAction Stop
    Write-Host "[OK] MongoDB service started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  MongoDB is running on port 27017!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not start MongoDB as service" -ForegroundColor Yellow
    Write-Host "[INFO] Trying to start manually..." -ForegroundColor Yellow
    Write-Host ""

    # Find mongod.exe
    $mongodPath = $null
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $mongodPath = $path
            break
        }
    }

    if ($mongodPath) {
        Write-Host "[INFO] Starting: $mongodPath" -ForegroundColor Cyan
        Write-Host "[INFO] A new window will open. DO NOT CLOSE IT." -ForegroundColor Yellow
        Start-Process -FilePath $mongodPath -ArgumentList "--dbpath", "C:\data\db" -WindowStyle Normal
        Start-Sleep -Seconds 3
        Write-Host "[OK] MongoDB should be running now" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] mongod.exe not found!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to your backend terminal" -ForegroundColor White
Write-Host "2. Press Ctrl+C to stop current backend" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host "4. If OK, run: npm run seed" -ForegroundColor White
Write-Host "5. Login at: http://localhost:5173/login" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
