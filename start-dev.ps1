# Development startup script for CloudLint
Write-Host "Starting CloudLint Development Environment" -ForegroundColor Green

# Function to start process in new window
function Start-Service {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Args,
        [int]$Port
    )
    
    Write-Host "Starting $Name on port $Port..." -ForegroundColor Yellow
    Start-Process -FilePath $Command -ArgumentList $Args -WindowStyle Normal
    Start-Sleep -Seconds 2
}

# Kill any existing processes on ports 3001, 5173
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
netstat -ano | findstr ":3001" | ForEach-Object { 
    $processId = ($_ -split '\s+')[-1]
    if ($processId -and $processId -ne "0") {
        try { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue } catch {}
    }
}
netstat -ano | findstr ":5173" | ForEach-Object { 
    $processId = ($_ -split '\s+')[-1]
    if ($processId -and $processId -ne "0") {
        try { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue } catch {}
    }
}

Write-Host "Starting Backend Server (Real CloudLint API)..." -ForegroundColor Cyan
$env:PORT = "3001"
Start-Process -FilePath "npm" -ArgumentList "run", "start:server" -WindowStyle Normal

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Starting Frontend Development Server..." -ForegroundColor Cyan  
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal

Write-Host "Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Development environment is starting!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host "Backend API: http://localhost:3001" -ForegroundColor Blue
Write-Host ""
Write-Host "Test the validation fix with this YAML:" -ForegroundColor Magenta
Write-Host "fruits:" -ForegroundColor White
Write-Host "  - apple" -ForegroundColor White  
Write-Host "   - banana  # <-- This should show an error!" -ForegroundColor Red
Write-Host "  - orange" -ForegroundColor White
Write-Host ""
Write-Host "Expected result: Validation should FAIL with indentation error" -ForegroundColor Red
Write-Host "Previous issue: Was incorrectly passing validation" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to open browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:5173"

Write-Host "Development environment ready!" -ForegroundColor Green
