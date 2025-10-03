Start-Sleep 30

$response = Invoke-RestMethod -Uri 'https://api.github.com/repos/javascriptjoey/cloudlint/commits/2e9a81d83f8bfdb5a02e39cf506e1eace39ce2d1/check-runs' -Headers @{'Accept'='application/vnd.github.v3+json'}

Write-Host "=== NEW GitHub Actions Status for Latest Commit ==="
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