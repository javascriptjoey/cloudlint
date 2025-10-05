$response = Invoke-RestMethod -Uri 'https://api.github.com/repos/javascriptjoey/cloudlint/actions/jobs/51844312605' -Headers @{'Accept'='application/vnd.github.v3+json'}

Write-Host "=== Failed Job Details ==="
Write-Host "Name: $($response.name)"
Write-Host "Status: $($response.status)"
Write-Host "Conclusion: $($response.conclusion)"
Write-Host "Started: $($response.started_at)"
Write-Host "Completed: $($response.completed_at)"
Write-Host "HTML URL: $($response.html_url)"
Write-Host ""
Write-Host "=== Steps ==="
$response.steps | ForEach-Object {
    Write-Host "$($_.number). $($_.name) - Status: $($_.status) - Conclusion: $($_.conclusion)"
}