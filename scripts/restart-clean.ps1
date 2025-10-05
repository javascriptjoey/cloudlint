# Clean Restart Script for Cloudlint
# This kills all Node processes and starts fresh

Write-Host "🔄 Cloudlint Clean Restart" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all Node processes
Write-Host "Step 1: Killing all Node processes..." -ForegroundColor Yellow
try {
    $processes = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "Found $($processes.Count) Node process(es)" -ForegroundColor Yellow
        Stop-Process -Name node -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "✅ All Node processes killed" -ForegroundColor Green
    } else {
        Write-Host "✅ No Node processes running" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Error killing processes: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 2: Verifying all processes are stopped..." -ForegroundColor Yellow
$remaining = Get-Process -Name node -ErrorAction SilentlyContinue
if ($remaining) {
    Write-Host "⚠️ Warning: $($remaining.Count) Node process(es) still running" -ForegroundColor Red
    Write-Host "Attempting force kill..." -ForegroundColor Yellow
    taskkill /F /IM node.exe 2>$null
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ All processes stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Clean restart complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Terminal 1: npm run dev:backend" -ForegroundColor White
Write-Host "2. Terminal 2: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Expected backend output:" -ForegroundColor Cyan
Write-Host "  [server] development mode - static file serving disabled" -ForegroundColor Gray
Write-Host ""
