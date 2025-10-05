# Check New CI Script

**Script Location:** `scripts/check_new_ci.ps1`

## Purpose

This script waits for and then checks the status of GitHub Actions CI runs for a newly pushed commit. It's designed to be run immediately after pushing code to monitor when CI starts and track its progress.

## What It Does

1. Waits 30 seconds to allow GitHub Actions to initialize
2. Queries GitHub API for check runs on a specific commit (hardcoded: `2e9a81d83f8bfdb5a02e39cf506e1eace39ce2d1`)
3. Displays comprehensive status for all check runs including:
   - Name
   - Status (queued, in_progress, completed)
   - Conclusion (success, failure, etc.)
   - Start and completion timestamps
   - HTML URL for browser viewing

## Usage

```powershell
.\scripts\check_new_ci.ps1
```

Typically run after pushing a commit:

```powershell
git push origin feature-branch
.\scripts\check_new_ci.ps1
```

## Prerequisites

- PowerShell 5.1 or higher
- Internet connection to access GitHub API
- No authentication required (uses public API)

## Configuration

To check a different commit:

```powershell
$response = Invoke-RestMethod -Uri 'https://api.github.com/repos/javascriptjoey/cloudlint/commits/YOUR_COMMIT_SHA/check-runs' -Headers @{'Accept'='application/vnd.github.v3+json'}
```

To adjust the wait time:

```powershell
Start-Sleep 30  # Change to desired seconds
```

## Output

The script displays:

- Total number of check runs found
- Detailed information for each check run
- Direct links to view runs in GitHub

## When to Use

- After pushing a new commit to verify CI starts
- Monitoring initial CI status without browser
- Automating CI status checks in deployment workflows
- Verifying all expected checks are triggered

## Example Output

```
=== NEW GitHub Actions Status for Latest Commit ===
Total Check Runs: 3

Name: build-and-test (18.x)
Status: in_progress
Conclusion: null
Started: 2024-01-15T10:30:00Z
Completed: null
HTML URL: https://github.com/javascriptjoey/cloudlint/actions/runs/...
---
Name: build-and-test (20.x)
Status: queued
Conclusion: null
Started: null
Completed: null
HTML URL: https://github.com/javascriptjoey/cloudlint/actions/runs/...
---
Name: lint
Status: completed
Conclusion: success
Started: 2024-01-15T10:30:00Z
Completed: 2024-01-15T10:32:00Z
HTML URL: https://github.com/javascriptjoey/cloudlint/actions/runs/...
---
```

## Notes

- Includes a 30-second delay to allow GitHub Actions to initialize
- Hardcoded to a specific commit SHA
- Useful for automated workflows and CI monitoring
- Can be modified to poll repeatedly until completion
- GitHub API rate limits apply
