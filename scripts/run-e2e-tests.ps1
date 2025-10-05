#!/usr/bin/env pwsh
# E2E Testing Script for Cloudlint
# This script handles the complete E2E testing workflow

Write-Host "==================================" -ForegroundColor Cyan
Write-Host " Cloudlint E2E Testing Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any running Node processes
Write-Host "[1/5] Stopping any running servers..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null | Out-Null
Start-Sleep -Seconds 3
Write-Host "      [OK] Servers stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Build the application
Write-Host "[2/5] Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "      [ERROR] Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "      [OK] Build complete" -ForegroundColor Green
Write-Host ""

# Step 3: Start server with static file serving
Write-Host "[3/5] Starting server with static files..." -ForegroundColor Yellow
$env:SERVE_STATIC = '1'
$env:PORT = '3001'
$env:NODE_ENV = 'test'

# Start server in background
$serverJob = Start-Job -ScriptBlock {
    param($workDir)
    Set-Location $workDir
    $env:SERVE_STATIC = '1'
    $env:PORT = '3001'
    $env:NODE_ENV = 'test'
    npm run start:server
} -ArgumentList $PWD

# Wait for server to be ready
Write-Host "      Waiting for server to start..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
        }
    } catch {
        $attempt++
    }
}

if (-not $serverReady) {
    Write-Host "      [ERROR] Server failed to start!" -ForegroundColor Red
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

Write-Host "      [OK] Server ready at http://localhost:3001" -ForegroundColor Green
Write-Host ""

# Step 4: Run E2E tests
Write-Host "[4/5] Running E2E tests..." -ForegroundColor Yellow
Write-Host ""

npm run e2e

$testExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan

# Step 5: Cleanup
Write-Host "[5/5] Cleaning up..." -ForegroundColor Yellow
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue
taskkill /F /IM node.exe 2>$null | Out-Null
Write-Host "      [OK] Cleanup complete" -ForegroundColor Green
Write-Host ""

# Final result
if ($testExitCode -eq 0) {
    Write-Host "[SUCCESS] All E2E tests passed!" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Some E2E tests failed. Check the output above." -ForegroundColor Red
}

Write-Host ""
Write-Host "View detailed report: npx playwright show-report" -ForegroundColor Cyan

exit $testExitCode
