# Kiro Terminal Background Setup Script
Write-Host ""
Write-Host "KIRO TERMINAL BACKGROUND SETUP" -ForegroundColor Cyan
Write-Host ""

$wtSettingsPath = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
$backgroundImagePath = "$HOME\.kiro\terminal-background\ghost_image.png"
$backgroundDir = "$HOME\.kiro\terminal-background"

# Check Windows Terminal
if (-not (Test-Path $wtSettingsPath)) {
    Write-Host "[ERROR] Windows Terminal not found!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Windows Terminal found" -ForegroundColor Green

# Create directory
if (-not (Test-Path $backgroundDir)) {
    New-Item -ItemType Directory -Path $backgroundDir -Force | Out-Null
    Write-Host "[OK] Created background directory" -ForegroundColor Green
}

# Read settings
Write-Host "[INFO] Reading settings..." -ForegroundColor Cyan
$settings = Get-Content $wtSettingsPath -Raw | ConvertFrom-Json

# Backup
$backupPath = "$wtSettingsPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $wtSettingsPath $backupPath
Write-Host "[OK] Backup created: $backupPath" -ForegroundColor Green

# Configure
Write-Host "[INFO] Configuring background..." -ForegroundColor Cyan
$psProfile = $settings.profiles.list | Where-Object { $_.name -eq "Windows PowerShell" }

if ($psProfile) {
    $psProfile | Add-Member -NotePropertyName "backgroundImage" -NotePropertyValue $backgroundImagePath -Force
    $psProfile | Add-Member -NotePropertyName "backgroundImageOpacity" -NotePropertyValue 0.08 -Force
    $psProfile | Add-Member -NotePropertyName "backgroundImageStretchMode" -NotePropertyValue "uniform" -Force
    $psProfile | Add-Member -NotePropertyName "backgroundImageAlignment" -NotePropertyValue "center" -Force
    $psProfile | Add-Member -NotePropertyName "useAcrylic" -NotePropertyValue $true -Force
    $psProfile | Add-Member -NotePropertyName "acrylicOpacity" -NotePropertyValue 0.85 -Force
    Write-Host "[OK] Background configured (image scaled proportionally)" -ForegroundColor Green
}

# Save
Write-Host "[INFO] Saving settings..." -ForegroundColor Cyan
$settings | ConvertTo-Json -Depth 10 | Set-Content $wtSettingsPath -Encoding UTF8

Write-Host ""
Write-Host "[SUCCESS] CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host ""

# Check image
if (-not (Test-Path $backgroundImagePath)) {
    Write-Host "[NEXT STEP] Add your background image" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Save image to: $backgroundImagePath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Recommendations:" -ForegroundColor Cyan
    Write-Host "   - PNG with transparency" -ForegroundColor Gray
    Write-Host "   - 800x800 pixels" -ForegroundColor Gray
    Write-Host "   - Light gray ghost or Kiro logo" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "[OK] Background image found!" -ForegroundColor Green
}

Write-Host "Restart Windows Terminal to see changes" -ForegroundColor Cyan
Write-Host ""
Write-Host "Settings configured:" -ForegroundColor Yellow
Write-Host "   - Background opacity: 8% (very subtle)" -ForegroundColor Gray
Write-Host "   - Acrylic effect: 85%" -ForegroundColor Gray
Write-Host "   - Image alignment: Center" -ForegroundColor Gray
Write-Host "   - Image size: Scaled proportionally (uniform)" -ForegroundColor Gray
Write-Host ""
