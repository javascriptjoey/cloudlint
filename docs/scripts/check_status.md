# Check Status Script

**Script Location:** `scripts/check_status.ps1`

## Purpose

This script checks the GitHub Actions status for a specific commit associated with Pull Request #34. It provides a quick overview of all CI/CD checks running on the PR.

## What It Does

1. Queries GitHub API for check runs on a specific commit (hardcoded: `2950de2e5693e2497e35b43c09006f55044b393c`)
2. Displays total count of check runs
3. For each check run, shows:
   - Name
   - Status (queued, in_progress, completed)
   - Conclusion (success, failure, cancelled, etc.)
   - Start and completion timestamps
   - HTML URL for browser viewing

## Usage

```powershell
.\scripts\check_status.ps1
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

Update the header message to reflect the correct PR:

```powershell
Write-Host "=== GitHub Actions Status for PR #YOUR_PR_NUMBER ===" -ForegroundColor Yellow
```

## Output

The script displays:

- Header indicating this is for PR #34
- Total number of check runs
- Detailed status for each check run with clickable URLs

## When to Use

- Quick status check for PR #34
- Verifying all CI checks before requesting review
- Monitoring CI progress on a specific PR
- Debugging CI issues on a particular commit

## Example Output

```
=== GitHub Actions Status for PR #34 ===
Total Check Runs: 4

Name: build-and-test (18.x)
Status: completed
Conclusion: success
Started: 2024-01-15T10:30:00Z
Completed: 2024-01-15T10:35:00Z
HTML URL: https://github.com/javascriptjoey/cloudlint/actions/runs/...
---
Name: build-and-test (20.x)
Status: completed
Conclusion: success
Started: 2024-01-15T10:30:00Z
Completed: 2024-01-15T10:36:00Z
HTML URL: https://github.com/javascriptjoey/cloudlint/actions/runs/...
---
Name: lint
Status: completed
Conclusion: success
Started: 2024-01-15T10:30:00Z
Completed: 2024-01-15T10:32:00Z
HTML URL: https://github.com/javascriptjoey/cloudlint/actions/runs/...
---
Name: type-check
Status: completed
Conclusion: success
Started: 2024-01-15T10:30:00Z
Completed: 2024-01-15T10:33:00Z
HTML URL: https://github.com/javascriptjoey/cloudlint/actions/runs/...
---
```

## Notes

- Hardcoded to a specific commit SHA and PR number
- Provides quick CLI-based status without opening browser
- Useful for automated scripts or CI monitoring
- GitHub API rate limits apply (60 requests/hour unauthenticated)
- Consider parameterizing for reusability across different PRs
