# Restart Clean Script

**Script Location:** `scripts/restart-clean.ps1`

## Purpose

This script performs a clean restart of the Cloudlint development environment by terminating all Node.js processes. It's essential for resolving port conflicts, clearing stuck processes, and ensuring a fresh development environment.

## What It Does

1. Identifies all running Node.js processes
2. Forcefully terminates all Node processes
3. Waits to ensure processes are fully stopped
4. Verifies no Node processes remain running
5. Uses `taskkill` as a fallback if processes persist
6. Provides clear next steps for restarting the development servers

## Usage

```powershell
.\scripts\restart-clean.ps1
```

## Prerequisites

- PowerShell 5.1 or higher
- Windows operating system (uses `taskkill`)
- Administrator privileges may be required for force-killing processes

## When to Use

- Port 3001 or 5173 is already in use
- Development servers are unresponsive
- After making configuration changes that require a clean restart
- When experiencing "EADDRINUSE" errors
- Before running E2E tests that need clean ports
- When switching between development and production modes

## Output

The script provides:

- Count of Node processes found
- Confirmation of process termination
- Warnings if processes couldn't be stopped
- Clear instructions for next steps

## Example Output

```
🔄 Cloudlint Clean Restart
=========================

Step 1: Killing all Node processes...
Found 3 Node process(es)
✅ All Node processes killed

Step 2: Verifying all processes are stopped...
✅ All processes stopped

✅ Clean restart complete!

Next steps:
1. Terminal 1: npm run dev:backend
2. Terminal 2: npm run dev

Expected backend output:
  [server] development mode - static file serving disabled
```

## Process Flow

1. **Detection**: Finds all `node.exe` processes
2. **Termination**: Uses `Stop-Process -Force` for graceful termination
3. **Verification**: Checks if any processes remain
4. **Fallback**: Uses `taskkill /F /IM node.exe` if needed
5. **Guidance**: Provides next steps for developers

## Safety Notes

- This script forcefully terminates ALL Node.js processes on your system
- Any unsaved work in Node-based applications will be lost
- Use with caution if running other Node applications
- Does not affect non-Node processes

## Common Issues

**Issue**: "Access Denied" errors

- **Solution**: Run PowerShell as Administrator

**Issue**: Processes still running after script

- **Solution**: Manually run `taskkill /F /IM node.exe` as Administrator

**Issue**: Port still in use after running script

- **Solution**: Wait 5-10 seconds for OS to release ports, then retry

## Integration with Development Workflow

This script is commonly used before:

- Running E2E tests (`run-e2e-tests.ps1`)
- Running advanced tests (`run-advanced-tests.ps1`)
- Switching between development modes
- Troubleshooting development server issues

## Notes

- Safe to run multiple times
- No data loss risk (only terminates processes)
- Recommended before running test suites
- Part of the standard troubleshooting workflow
