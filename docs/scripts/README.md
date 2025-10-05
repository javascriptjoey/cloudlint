# Cloudlint PowerShell Scripts Documentation

This directory contains comprehensive documentation for all PowerShell scripts used in the Cloudlint project. All scripts are located in the `scripts/` folder at the repository root.

## Quick Reference

### Testing Scripts

| Script                   | Purpose                                               | Documentation                        |
| ------------------------ | ----------------------------------------------------- | ------------------------------------ |
| `run-all-tests.ps1`      | Complete test suite (unit, build, type-check, lint)   | [View Docs](./run-all-tests.md)      |
| `run-e2e-tests.ps1`      | End-to-end browser tests with Playwright              | [View Docs](./run-e2e-tests.md)      |
| `run-advanced-tests.ps1` | Advanced tests (performance, accessibility, security) | [View Docs](./run-advanced-tests.md) |

### Development Scripts

| Script              | Purpose                                         | Documentation                   |
| ------------------- | ----------------------------------------------- | ------------------------------- |
| `setup-tools.ps1`   | Install and configure external validation tools | [View Docs](./setup-tools.md)   |
| `restart-clean.ps1` | Clean restart by killing all Node processes     | [View Docs](./restart-clean.md) |

### CI/CD Monitoring Scripts

| Script                  | Purpose                                  | Documentation                       |
| ----------------------- | ---------------------------------------- | ----------------------------------- |
| `check_status.ps1`      | Check GitHub Actions status for PR #34   | [View Docs](./check_status.md)      |
| `check_latest_ci.ps1`   | Monitor latest CI runs for a commit      | [View Docs](./check_latest_ci.md)   |
| `check_new_ci.ps1`      | Wait and check CI status for new commits | [View Docs](./check_new_ci.md)      |
| `check_failed_job.ps1`  | Get details about a specific failed job  | [View Docs](./check_failed_job.md)  |
| `check_job_details.ps1` | Analyze check runs and identify failures | [View Docs](./check_job_details.md) |

### Documentation Scripts

| Script           | Purpose                                | Documentation                |
| ---------------- | -------------------------------------- | ---------------------------- |
| `audit-docs.ps1` | Audit all markdown documentation files | [View Docs](./audit-docs.md) |

## Common Workflows

### Initial Setup

```powershell
# 1. Setup external tools
.\scripts\setup-tools.ps1

# 2. Copy environment template
Copy-Item .env.template .env.local

# 3. Install dependencies
npm install
```

### Before Committing

```powershell
# Run complete test suite
.\scripts\run-all-tests.ps1

# If all pass, commit your changes
git add .
git commit -m "Your message"
```

### Before Merging PR

```powershell
# 1. Run all tests
.\scripts\run-all-tests.ps1

# 2. Run E2E tests
.\scripts\run-e2e-tests.ps1

# 3. Run advanced tests
.\scripts\run-advanced-tests.ps1
```

### Troubleshooting Development Environment

```powershell
# Clean restart all Node processes
.\scripts\restart-clean.ps1

# Then restart your dev servers
# Terminal 1:
npm run dev:backend

# Terminal 2:
npm run dev
```

### Monitoring CI/CD

```powershell
# After pushing a commit
git push origin feature-branch
.\scripts\check_new_ci.ps1

# Check specific PR status
.\scripts\check_status.ps1

# Investigate failures
.\scripts\check_failed_job.ps1
```

## Script Categories

### Testing Scripts

These scripts validate code quality, functionality, and user experience:

- **run-all-tests.ps1**: Comprehensive validation (unit, build, types, lint)
- **run-e2e-tests.ps1**: Browser-based end-to-end testing
- **run-advanced-tests.ps1**: Performance, accessibility, security testing

### Development Scripts

These scripts help set up and maintain the development environment:

- **setup-tools.ps1**: One-time setup for external tools
- **restart-clean.ps1**: Clean slate for development servers

### CI/CD Scripts

These scripts monitor and debug GitHub Actions workflows:

- **check_status.ps1**: Quick PR status check
- **check_latest_ci.ps1**: Monitor CI progress
- **check_new_ci.ps1**: Wait for new CI runs
- **check_failed_job.ps1**: Debug specific failures
- **check_job_details.ps1**: Detailed failure analysis

### Documentation Scripts

These scripts help maintain documentation quality:

- **audit-docs.ps1**: Inventory all markdown files

## Prerequisites

All scripts require:

- **PowerShell**: Version 5.1 or higher
- **Node.js**: Version 18.x or 20.x
- **npm**: Latest version

Additional requirements for specific scripts:

- **Docker Desktop**: Required for `setup-tools.ps1`
- **Playwright**: Required for E2E and advanced tests (`npx playwright install`)

## Best Practices

1. **Run tests before committing**: Use `run-all-tests.ps1` to catch issues early
2. **Clean environment**: Use `restart-clean.ps1` when experiencing port conflicts
3. **Monitor CI**: Use CI monitoring scripts to track build status
4. **Document changes**: Update script documentation when modifying scripts
5. **Test locally**: Run E2E tests locally before pushing to avoid CI failures

## Exit Codes

All scripts follow standard exit code conventions:

- `0`: Success
- `1`: Failure or error
- Non-zero: Specific error codes from underlying tools

## Getting Help

For detailed information about any script:

1. Read the corresponding `.md` file in this directory
2. Open the script in `scripts/` folder to see inline comments
3. Check the "Troubleshooting" section in each documentation file

## Contributing

When adding new scripts:

1. Place the `.ps1` file in the `scripts/` folder
2. Create corresponding `.md` documentation in `docs/scripts/`
3. Update this README with the new script reference
4. Follow the existing documentation format
5. Include usage examples and troubleshooting tips

## Notes

- All scripts are designed to be run from the repository root
- Scripts use color-coded output for better readability
- Most scripts include automatic cleanup on failure
- CI monitoring scripts use GitHub's public API (no auth required)
