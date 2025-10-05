# Cloudlint Advanced Functional Tests Runner
# Automatically manages server lifecycle for advanced test suites

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Cloudlint Advanced Functional Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running servers and clean up port
Write-Host "[1/5] Stopping any running servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill any process using port 3001
$portProcesses = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $portProcesses) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 3
Write-Host "      [OK] Servers stopped and port cleaned" -ForegroundColor Green
Write-Host ""

# Step 2: Build the application
Write-Host "[2/5] Building application..." -ForegroundColor Yellow
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "      [ERROR] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "      [OK] Build complete" -ForegroundColor Green
Write-Host ""

# Step 3: Start the server
Write-Host "[3/5] Starting server with static files..." -ForegroundColor Yellow

# Start server in background using the custom Express server on port 3001
$env:SERVE_STATIC = "1"
$env:PORT = "3001"
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:SERVE_STATIC = "1"
    $env:PORT = "3001"
    npm run start:server
}

# Wait for server to be ready
Write-Host "      Waiting for server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 8

$maxAttempts = 40
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
        }
    } catch {
        Start-Sleep -Seconds 1
        $attempt++
    }
}

if (-not $serverReady) {
    Write-Host "      [ERROR] Server failed to start after $maxAttempts attempts" -ForegroundColor Red
    Write-Host "      Check if port 3001 is available" -ForegroundColor Yellow
    Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job -Job $serverJob -Force -ErrorAction SilentlyContinue
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "      [OK] Server ready at http://localhost:3001" -ForegroundColor Green
Write-Host ""

# Step 4: Run advanced tests
Write-Host "[4/5] Running Advanced Functional Tests..." -ForegroundColor Yellow
Write-Host "      This includes: Performance, Contract, Visual, Mobile, Accessibility, Security, Edge Cases" -ForegroundColor Gray
Write-Host ""

npm run e2e:advanced

$testExitCode = $LASTEXITCODE

Write-Host ""

# Step 5: Cleanup
Write-Host "[5/5] Cleaning up..." -ForegroundColor Yellow
Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
Remove-Job -Job $serverJob -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "      [OK] Cleanup complete" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan

if ($testExitCode -eq 0) {
    Write-Host "[SUCCESS] All advanced tests passed!" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "View detailed report: npx playwright show-report" -ForegroundColor Cyan
} else {
    Write-Host "[FAILED] Some tests failed. See output above." -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    Write-Host "View detailed report: npx playwright show-report" -ForegroundColor Cyan
}

Write-Host ""

exit $testExitCode
