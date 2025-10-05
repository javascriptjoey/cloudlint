$response = Invoke-RestMethod -Uri 'https://api.github.com/repos/javascriptjoey/cloudlint/commits/2950de2e5693e2497e35b43c09006f55044b393c/check-runs' -Headers @{'Accept'='application/vnd.github.v3+json'}

Write-Host "=== GitHub Actions Status for PR #34 ==="
Write-Host "Total Check Runs: $($response.total_count)"
Write-Host ""

$response.check_runs | ForEach-Object {
    Write-Host "Name: $($_.name)"
    Write-Host "Status: $($_.status)"
    Write-Host "Conclusion: $($_.conclusion)"
    Write-Host "Started: $($_.started_at)"
    Write-Host "Completed: $($_.completed_at)"
    Write-Host "HTML URL: $($_.html_url)"
    Write-Host "---"
}