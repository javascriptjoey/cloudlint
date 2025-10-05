# Check Job Details Script

**Script Location:** `scripts/check_job_details.ps1`

## Purpose

This script retrieves detailed information about GitHub Actions check runs for a specific commit. It's particularly useful for identifying and analyzing failed build jobs in CI/CD pipelines.

## What It Does

1. Queries GitHub API for all check runs associated with a specific commit (hardcoded: `2e9a81df8ffe7de2318334a38a65728cd775e6a4`)
2. Filters for the specific failed job: `build-and-test (20.x)`
3. Retrieves detailed job information including:
   - Job ID and HTML URL
   - All steps with their status and conclusion
   - Specifically highlights failed steps

## Usage

```powershell
.\scripts\check_job_details.ps1
```

## Prerequisites

- PowerShell 5.1 or higher
- Internet connection to access GitHub API
- No authentication required (uses public API)

## Configuration

To check a different commit:

1. Open `scripts/check_job_details.ps1`
2. Update the commit SHA in the API URL:
   ```powershell
   $response = Invoke-RestMethod -Uri 'https://api.github.com/repos/javascriptjoey/cloudlint/commits/YOUR_COMMIT_SHA/check-runs' -Headers @{'Accept'='application/vnd.github.v3+json'}
   ```

To check a different job name, modify the filter:

```powershell
$failedJob = $response.check_runs | Where-Object { $_.name -eq "YOUR_JOB_NAME" -and $_.conclusion -eq "failure" }
```

## Output

The script displays:

- Job ID and GitHub URL
- Complete steps summary with status for each step
- Highlighted list of failed steps only

## When to Use

- Debugging specific commit failures in CI/CD
- Understanding which steps failed in a multi-step workflow
- Analyzing build failures for specific Node.js versions
- Gathering diagnostic information for issue reports

## Example Output

```
=== Failed Job Details ===
Job ID: 51844312605
HTML URL: https://github.com/javascriptjoey/cloudlint/runs/...

=== Steps Summary ===
1. Set up job - Status: completed - Conclusion: success
2. Checkout - Status: completed - Conclusion: success
3. Setup Node.js - Status: completed - Conclusion: success
4. Install dependencies - Status: completed - Conclusion: success
5. Run tests - Status: completed - Conclusion: failure
6. Upload coverage - Status: completed - Conclusion: skipped

=== Failed Steps ===
FAILED: 5. Run tests
```

## Notes

- Hardcoded to a specific commit SHA and job name
- Useful for post-mortem analysis of CI failures
- Can be extended to check multiple jobs or commits
- GitHub API rate limits apply (60 requests/hour unauthenticated)
