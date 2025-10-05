#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run only the failing E2E tests for quick iteration
.DESCRIPTION
    Builds the app, starts the server, and runs only the 3 failing test cases
#>

$ErrorActionPreference = "Stop"

Write-Host "=================================="
Write-Host " Quick Test - Failing Tests Only"
Write-Host "=================================="
Write-Host ""

# Step 1: Stop any running servers
Write-Host "[1/4] Stopping any running servers..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*serve*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Write-Host "      [OK] Servers stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Build
Write-Host "[2/4] Building application..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "      [FAILED] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "      [OK] Build complete" -ForegroundColor Green
Write-Host ""

# Step 3: Start server
Write-Host "[3/4] Starting server..." -ForegroundColor Cyan
$serverProcess = Start-Process -FilePath "npx" -ArgumentList "serve -s dist -l 3001" -PassThru -WindowStyle Hidden
Write-Host "      Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Wait for server to be ready
$maxAttempts = 10
$attempt = 0
$serverReady = $false
while ($attempt -lt $maxAttempts -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
        }
    } catch {
        $attempt++
        Start-Sleep -Seconds 1
    }
}

if (-not $serverReady) {
    Write-Host "      [FAILED] Server did not start" -ForegroundColor Red
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "      [OK] Server ready at http://localhost:3001" -ForegroundColor Green
Write-Host ""

# Step 4: Run only failing tests
Write-Host "[4/4] Running failing tests only..." -ForegroundColor Cyan
Write-Host "      Tests: validate button, convert to JSON, reset button" -ForegroundColor Yellow
Write-Host ""

try {
    npx playwright test tests/e2e/playground-simple.spec.ts --grep "validate button works with YAML content|convert to JSON works|reset button clears content"
    $testExitCode = $LASTEXITCODE
} finally {
    # Cleanup
    Write-Host ""
    Write-Host "[5/5] Cleaning up..." -ForegroundColor Cyan
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "      [OK] Cleanup complete" -ForegroundColor Green
}

Write-Host ""
Write-Host "=================================="
if ($testExitCode -eq 0) {
    Write-Host "[SUCCESS] All tests passed!" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Some tests failed. Check output above." -ForegroundColor Red
}
Write-Host ""

exit $testExitCode
