# Check Latest CI Script

**Script Location:** `scripts/check_latest_ci.ps1`

## Purpose

This script monitors the status of GitHub Actions CI runs for a specific commit. It provides real-time visibility into CI/CD pipeline execution and can also check pull request status when no CI runs are found.

## What It Does

1. Queries GitHub API for check runs on a specific commit (hardcoded: `2e9a81df8ffe7de2318334a38a65728cd775e6a4`)
2. Displays total count of check runs
3. For each check run, shows:
   - Name
   - Status (queued, in_progress, completed)
   - Conclusion (success, failure, cancelled, etc.)
   - Start and completion timestamps
4. If no check runs found, falls back to checking PR #34 status and mergeable state

## Usage

```powershell
.\scripts\check_latest_ci.ps1
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

To check a different PR:

```powershell
$prResponse = Invoke-RestMethod -Uri 'https://api.github.com/repos/javascriptjoey/cloudlint/pulls/YOUR_PR_NUMBER' -Headers @{'Accept'='application/vnd.github.v3+json'}
```

## Output

The script displays:

- Total number of check runs
- Detailed status for each check run
- If no runs found: PR state and mergeable state

## When to Use

- Monitoring CI/CD pipeline progress
- Verifying all checks have completed before merging
- Debugging why CI hasn't started
- Checking PR readiness for merge

## Example Output

```
=== Latest GitHub Actions Status ===
Total Check Runs: 3

Name: build-and-test (18.x)
Status: completed
Conclusion: success
Started: 2024-01-15T10:30:00Z
Completed: 2024-01-15T10:35:00Z
---
Name: build-and-test (20.x)
Status: completed
Conclusion: success
Started: 2024-01-15T10:30:00Z
Completed: 2024-01-15T10:36:00Z
---
Name: lint
Status: completed
Conclusion: success
Started: 2024-01-15T10:30:00Z
Completed: 2024-01-15T10:32:00Z
---
```

Or when no runs found:

```
=== Latest GitHub Actions Status ===
Total Check Runs: 0

No CI runs found yet. Checking PR status...
PR State: open
Mergeable State: blocked
```

## Notes

- Hardcoded to specific commit SHA and PR number
- Useful for monitoring CI progress without opening browser
- Can be run repeatedly to track progress
- GitHub API rate limits apply
