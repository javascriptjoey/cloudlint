# Documentation Audit Script
# This script will help audit all markdown files

Write-Host "==================================" -ForegroundColor Cyan
Write-Host " Documentation Audit Starting" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Get all markdown files (excluding node_modules, .git, test-results)
$mdFiles = Get-ChildItem -Path . -Filter *.md -Recurse -File | 
    Where-Object { 
        $_.FullName -notlike '*node_modules*' -and 
        $_.FullName -notlike '*\.git*' -and
        $_.FullName -notlike '*test-results*'
    }

Write-Host "Found $($mdFiles.Count) markdown files to audit" -ForegroundColor Green
Write-Host ""

# Categorize by location
$rootFiles = $mdFiles | Where-Object { $_.Directory.Name -eq 'cloudlint' }
$docsFiles = $mdFiles | Where-Object { $_.FullName -like '*\docs\*' }
$kiroFiles = $mdFiles | Where-Object { $_.FullName -like '*\.kiro\*' }

Write-Host "Root Level Files: $($rootFiles.Count)" -ForegroundColor Yellow
$rootFiles | ForEach-Object { Write-Host "  - $($_.Name)" }

Write-Host ""
Write-Host "Docs Folder Files: $($docsFiles.Count)" -ForegroundColor Yellow
$docsFiles | ForEach-Object { 
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")
    Write-Host "  - $relativePath"
}

Write-Host ""
Write-Host "Kiro Folder Files: $($kiroFiles.Count)" -ForegroundColor Yellow
$kiroFiles | ForEach-Object { Write-Host "  - $($_.Name)" }

Write-Host ""
Write-Host "Audit complete!" -ForegroundColor Green
