# Documentation Audit Script

**Script Location:** `scripts/audit-docs.ps1`

## Purpose

This script performs a comprehensive audit of all Markdown documentation files in the Cloudlint repository. It helps maintain documentation quality by providing visibility into where documentation exists and how it's organized.

## What It Does

1. Scans the entire repository for `.md` files
2. Excludes common non-documentation directories (`node_modules`, `.git`, `test-results`)
3. Categorizes documentation by location:
   - Root level files
   - Files in the `docs/` folder
   - Files in the `.kiro/` folder
4. Displays a color-coded summary with file counts and paths

## Usage

```powershell
.\scripts\audit-docs.ps1
```

## Prerequisites

- PowerShell 5.1 or higher
- Must be run from the repository root directory

## Output

The script provides:

- Total count of markdown files found
- Categorized lists showing:
  - Root level documentation files
  - Documentation in the `docs/` folder (with relative paths)
  - Documentation in the `.kiro/` folder

## When to Use

- Before major documentation updates to understand current state
- During documentation audits or reviews
- When organizing or restructuring documentation
- To verify documentation coverage across the project

## Example Output

```
==================================
 Documentation Audit Starting
==================================

Found 15 markdown files to audit

Root Level Files: 3
  - README.md
  - CHANGELOG.md
  - CONTRIBUTING.md

Docs Folder Files: 10
  - docs\api\README.md
  - docs\architecture\overview.md
  ...

Kiro Folder Files: 2
  - KIRO_TODO.md
  - KIRO_SPEC.md

Audit complete!
```

## Notes

- This is a read-only script that doesn't modify any files
- Useful for documentation maintenance and organization tasks
- Can be extended to check for broken links or outdated content
