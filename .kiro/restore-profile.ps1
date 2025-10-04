# Restore Complete PowerShell Profile
$profileContent = @'
function Invoke-Local-H2 {$npmPrefix = npm prefix -s; Invoke-Expression "$npmPrefix\node_modules\.bin\shopify.ps1 hydrogen $Args"}; Set-Alias -Name h2 -Value Invoke-Local-H2

# Import the Chocolatey Profile
$ChocolateyProfile = "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
if (Test-Path($ChocolateyProfile)) {
  Import-Module "$ChocolateyProfile"
}

# ============================================================================
# AWESOME COLORFUL TERMINAL WITH GIT BRANCH & EMOJIS
# ============================================================================

function Get-GitBranch {
    try {
        $branch = git rev-parse --abbrev-ref HEAD 2>$null
        if ($branch) {
            $status = git status --porcelain 2>$null
            $emoji = if ($status) { "👻" } else { "✨" }
            return " $emoji ($branch)"
        }
    } catch {
        return ""
    }
    return ""
}

function prompt {
    $lastSuccess = $?
    
    # Get current location
    $currentPath = $PWD.Path
    $homePath = $HOME
    $displayPath = $currentPath.Replace($homePath, "~")
    
    # Get git branch
    $gitBranch = Get-GitBranch
    
    # Status emoji
    $statusEmoji = if ($lastSuccess) { "✅" } else { "❌" }
    
    # Time
    $time = Get-Date -Format "HH:mm:ss"
    
    # Build prompt with colors
    Write-Host ""
    Write-Host "╭─" -NoNewline -ForegroundColor DarkGray
    Write-Host " 🚀 " -NoNewline -ForegroundColor Cyan
    Write-Host "$env:USERNAME" -NoNewline -ForegroundColor Green
    Write-Host " @ " -NoNewline -ForegroundColor DarkGray
    Write-Host "$env:COMPUTERNAME" -NoNewline -ForegroundColor Yellow
    Write-Host " 📁 " -NoNewline -ForegroundColor Cyan
    Write-Host "$displayPath" -NoNewline -ForegroundColor Blue
    
    if ($gitBranch) {
        Write-Host "$gitBranch" -NoNewline -ForegroundColor Magenta
    }
    
    Write-Host " 🕐 " -NoNewline -ForegroundColor Cyan
    Write-Host "$time" -NoNewline -ForegroundColor DarkGray
    Write-Host " $statusEmoji" -ForegroundColor White
    
    Write-Host "╰─" -NoNewline -ForegroundColor DarkGray
    Write-Host "❯" -NoNewline -ForegroundColor Cyan
    return ""
}

# Enhanced Git Aliases with Ghost Emojis
function git-status-ghost {
    Write-Host ""
    Write-Host "👻 Git Status:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    git status
}
Set-Alias -Name gst -Value git-status-ghost

function git-log-ghost {
    Write-Host ""
    Write-Host "📜 Git Log:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    git log --oneline --graph --decorate --all -10
}
Set-Alias -Name glog -Value git-log-ghost

function git-branch-ghost {
    Write-Host ""
    Write-Host "🌿 Git Branches:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    git branch -a
}
Set-Alias -Name gbr -Value git-branch-ghost

function git-commit-ghost {
    Write-Host ""
    Write-Host "💾 Git Commit:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    git commit $args
}
Set-Alias -Name gcom -Value git-commit-ghost

function git-push-ghost {
    Write-Host ""
    Write-Host "🚀 Git Push:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    git push $args
}
Set-Alias -Name gpush -Value git-push-ghost

function git-pull-ghost {
    Write-Host ""
    Write-Host "⬇️ Git Pull:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    git pull $args
}
Set-Alias -Name gpull -Value git-pull-ghost

function git-add-ghost {
    Write-Host ""
    Write-Host "➕ Git Add:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    git add $args
}
Set-Alias -Name gadd -Value git-add-ghost

# Quick navigation
function .. { Set-Location .. }
function ... { Set-Location ..\.. }
function .... { Set-Location ..\..\.. }

# List with colors
function ll { Get-ChildItem -Force | Format-Table -AutoSize }
function la { Get-ChildItem -Force }

# Clear with style
function cls-ghost {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                              ║" -ForegroundColor Cyan
    Write-Host "║              👻 AWESOME GHOST TERMINAL 👻                   ║" -ForegroundColor Cyan
    Write-Host "║                                                              ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✨ Quick Commands:" -ForegroundColor Yellow
    Write-Host "  gst    - 👻 Git status" -ForegroundColor Gray
    Write-Host "  glog   - 📜 Git log with graph" -ForegroundColor Gray
    Write-Host "  gbr    - 🌿 Git branches" -ForegroundColor Gray
    Write-Host "  gadd   - ➕ Git add" -ForegroundColor Gray
    Write-Host "  gcom   - 💾 Git commit" -ForegroundColor Gray
    Write-Host "  gpush  - 🚀 Git push" -ForegroundColor Gray
    Write-Host "  gpull  - ⬇️ Git pull" -ForegroundColor Gray
    Write-Host "  ll     - 📋 List files" -ForegroundColor Gray
    Write-Host "  ..     - ⬆️ Go up one directory" -ForegroundColor Gray
    Write-Host ""
}
Set-Alias -Name c -Value cls-ghost

# Welcome message
Write-Host "👻 AWESOME GHOST TERMINAL" -ForegroundColor Cyan
Write-Host "Git branch will show with ghost emoji when you have changes" -ForegroundColor Yellow
Write-Host "Type c to see all quick commands" -ForegroundColor Gray
Write-Host ""

# Set cursor to blinking green line
$ESC = [char]27
Write-Host "$ESC[5 q" -NoNewline  # Blinking bar cursor
'@

# Save to profile
$profileContent | Out-File -FilePath $PROFILE -Encoding UTF8 -Force

Write-Host ""
Write-Host "✅ PowerShell Profile Restored!" -ForegroundColor Green
Write-Host ""
Write-Host "All features restored:" -ForegroundColor Cyan
Write-Host "  ✅ Colorful prompt with emojis" -ForegroundColor Gray
Write-Host "  ✅ Git branch indicators (👻/✨)" -ForegroundColor Gray
Write-Host "  ✅ All git commands (gst, glog, gbr, etc.)" -ForegroundColor Gray
Write-Host "  ✅ Navigation shortcuts (.., ..., ....)" -ForegroundColor Gray
Write-Host "  ✅ Utility commands (ll, la, c)" -ForegroundColor Gray
Write-Host "  ✅ Welcome message with ghost emoji" -ForegroundColor Gray
Write-Host "  ✅ Green blinking cursor" -ForegroundColor Gray
Write-Host ""
Write-Host "Restart your terminal to see all features!" -ForegroundColor Yellow
