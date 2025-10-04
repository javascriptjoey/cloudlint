# Fix PowerShell Profile Welcome Message
$profilePath = $PROFILE

# Read current profile
$lines = Get-Content $profilePath

# Find and replace welcome section
$newLines = @()
$skipMode = $false

foreach ($line in $lines) {
    if ($line -match "# Welcome message") {
        # Add new welcome section
        $newLines += "# Welcome message"
        $newLines += 'Write-Host ([char]0xD83D + [char]0xDC7B + " AWESOME GHOST TERMINAL") -ForegroundColor Cyan'
        $newLines += 'Write-Host "Git branch will show with ghost emoji when you have changes" -ForegroundColor Yellow'
        $newLines += 'Write-Host "Type c to see all quick commands" -ForegroundColor Gray'
        $newLines += ""
        $skipMode = $true
        continue
    }
    
    # Skip old welcome lines and blank lines after
    if ($skipMode) {
        if ($line.Trim() -eq "" -or $line -match "Write-Host.*AWESOME" -or $line -match "Write-Host.*Git branch" -or $line -match "Write-Host.*Type") {
            continue
        } else {
            $skipMode = $false
        }
    }
    
    $newLines += $line
}

# Save updated profile
$newLines | Out-File -FilePath $profilePath -Encoding UTF8 -Force

Write-Host ""
Write-Host "Profile fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "Restart your terminal to see the clean welcome message!" -ForegroundColor Yellow
