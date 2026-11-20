@echo off
setlocal
cd /d "%~dp0"

echo Starting BullishHammer web app for local testing...
where npm >nul 2>nul
if errorlevel 1 (
    echo npm was not found. Please install Node.js and try again.
    pause
    exit /b 1
)

if not exist "node_modules\next" (
    echo Installing workspace dependencies...
    call npm install
    if errorlevel 1 (
        echo Dependency installation failed.
        pause
        exit /b 1
    )
)

start "BullishHammer" http://localhost:3000
call npm run dev --prefix web -- --hostname 0.0.0.0 --port 3000

if errorlevel 1 (
    echo Failed to start the local test server.
    pause
    exit /b 1
)
