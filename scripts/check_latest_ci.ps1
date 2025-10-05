$response = Invoke-RestMethod -Uri 'https://api.github.com/repos/javascriptjoey/cloudlint/commits/2e9a81df8ffe7de2318334a38a65728cd775e6a4/check-runs' -Headers @{'Accept'='application/vnd.github.v3+json'}

Write-Host "=== Latest GitHub Actions Status ==="
Write-Host "Total Check Runs: $($response.total_count)"
Write-Host ""

if ($response.check_runs.Count -eq 0) {
    Write-Host "No CI runs found yet. Checking PR status..."
    $prResponse = Invoke-RestMethod -Uri 'https://api.github.com/repos/javascriptjoey/cloudlint/pulls/34' -Headers @{'Accept'='application/vnd.github.v3+json'}
    Write-Host "PR State: $($prResponse.state)"
    Write-Host "Mergeable State: $($prResponse.mergeable_state)" 
} else {
    $response.check_runs | ForEach-Object {
        Write-Host "Name: $($_.name)"
        Write-Host "Status: $($_.status)"
        Write-Host "Conclusion: $($_.conclusion)"
        Write-Host "Started: $($_.started_at)"
        Write-Host "Completed: $($_.completed_at)"
        Write-Host "---"
    }
}