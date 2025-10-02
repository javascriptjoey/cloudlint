# Simple CloudLint Development Startup
Write-Host "Starting CloudLint Development Environment..." -ForegroundColor Green

# Kill existing processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Start backend server
Write-Host "Starting Backend Server on port 3001..." -ForegroundColor Cyan
$env:PORT = "3001"
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run start:server" -WindowStyle Normal

Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting Frontend Server on port 5173..." -ForegroundColor Cyan
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "DEVELOPMENT SERVERS STARTING:" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Blue
Write-Host ""
Write-Host "TEST THE VALIDATION FIX:" -ForegroundColor Magenta
Write-Host "Copy this YAML into the editor:" -ForegroundColor Yellow
Write-Host ""
Write-Host "fruits:" -ForegroundColor White
Write-Host "  - apple" -ForegroundColor White
Write-Host "   - banana" -ForegroundColor Red
Write-Host "  - orange" -ForegroundColor White
Write-Host ""
Write-Host "The line with 'banana' has 3 spaces (should be 2)" -ForegroundColor Red
Write-Host "Expected: Validation should FAIL with indentation error" -ForegroundColor Red
Write-Host ""
Write-Host "Opening browser in 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Start-Process "http://localhost:5173"

Write-Host "Development environment ready!" -ForegroundColor Green