$response = Invoke-RestMethod -Uri 'https://api.github.com/repos/javascriptjoey/cloudlint/commits/2e9a81df8ffe7de2318334a38a65728cd775e6a4/check-runs' -Headers @{'Accept'='application/vnd.github.v3+json'}

# Find the failed build job
$failedJob = $response.check_runs | Where-Object { $_.name -eq "build-and-test (20.x)" -and $_.conclusion -eq "failure" }

if ($failedJob) {
    Write-Host "=== Failed Job Details ==="
    Write-Host "Job ID: $($failedJob.id)"
    Write-Host "HTML URL: $($failedJob.html_url)"
    
    # Get detailed job info
    $jobDetails = Invoke-RestMethod -Uri $failedJob.url -Headers @{'Accept'='application/vnd.github.v3+json'}
    
    Write-Host ""
    Write-Host "=== Steps Summary ==="
    $jobDetails.steps | ForEach-Object {
        Write-Host "$($_.number). $($_.name) - Status: $($_.status) - Conclusion: $($_.conclusion)"
    }
    
    Write-Host ""
    Write-Host "=== Failed Steps ==="
    $jobDetails.steps | Where-Object { $_.conclusion -eq "failure" } | ForEach-Object {
        Write-Host "FAILED: $($_.number). $($_.name)"
    }
}