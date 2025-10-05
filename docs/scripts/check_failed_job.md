# Check Failed Job Script

**Script Location:** `scripts/check_failed_job.ps1`

## Purpose

This script retrieves detailed information about a specific failed GitHub Actions job. It's designed for debugging CI/CD pipeline failures by providing comprehensive job execution details.

## What It Does

1. Queries the GitHub API for a specific job ID (hardcoded: `51844312605`)
2. Retrieves job metadata including:
   - Job name
   - Status and conclusion
   - Start and completion timestamps
   - HTML URL for browser viewing
3. Lists all steps in the job with their individual status and conclusion

## Usage

```powershell
.\scripts\check_failed_job.ps1
```

## Prerequisites

- PowerShell 5.1 or higher
- Internet connection to access GitHub API
- No authentication required (uses public API)

## Configuration

The script currently targets a specific job ID. To check a different job:

1. Open `scripts/check_failed_job.ps1`
2. Modify the job ID in the API URL:
   ```powershell
   $response = Invoke-RestMethod -Uri 'https://api.github.com/repos/javascriptjoey/cloudlint/actions/jobs/YOUR_JOB_ID' -Headers @{'Accept'='application/vnd.github.v3+json'}
   ```

## Output

The script displays:

- Job name and overall status
- Execution timeline (started/completed times)
- Link to view the job in GitHub
- Detailed step-by-step breakdown with status for each step

## When to Use

- Investigating specific CI/CD job failures
- Understanding which step in a workflow failed
- Gathering information for bug reports or troubleshooting
- Analyzing job execution patterns

## Example Output

```
=== Failed Job Details ===
Name: build-and-test (20.x)
Status: completed
Conclusion: failure
Started: 2024-01-15T10:30:00Z
Completed: 2024-01-15T10:35:00Z
HTML URL: https://github.com/javascriptjoey/cloudlint/actions/runs/...

=== Steps ===
1. Set up job - Status: completed - Conclusion: success
2. Checkout - Status: completed - Conclusion: success
3. Setup Node.js - Status: completed - Conclusion: success
4. Install dependencies - Status: completed - Conclusion: success
5. Run tests - Status: completed - Conclusion: failure
```

## Notes

- This script is hardcoded to a specific job ID and should be updated for different investigations
- Consider creating a parameterized version for reusability
- GitHub API has rate limits (60 requests/hour for unauthenticated requests)
