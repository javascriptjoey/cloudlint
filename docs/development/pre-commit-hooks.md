# Pre-Commit Hooks Guide

This document explains the pre-commit hooks setup in Cloudlint using Husky and lint-staged.

## Overview

Pre-commit hooks automatically run quality checks before code is committed, ensuring:

- Code style consistency
- No linting errors
- Type safety
- All tests pass before pushing

## Tools Used

### Husky

- **Purpose:** Manages Git hooks in a developer-friendly way
- **Version:** Latest (v9+)
- **Documentation:** https://typicode.github.io/husky/

### lint-staged

- **Purpose:** Runs linters only on staged files for faster execution
- **Version:** Latest
- **Documentation:** https://github.com/lint-staged/lint-staged

## Hooks Configuration

### Pre-Commit Hook

**Location:** `.husky/pre-commit`

**What it does:**

- Runs `lint-staged` on all staged files
- Applies ESLint fixes automatically
- Formats code with Prettier
- Prevents commit if any checks fail

**Files checked:**

- TypeScript/JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`)
- JSON files (`.json`)
- Markdown files (`.md`)
- YAML files (`.yml`, `.yaml`)
- CSS files (`.css`, `.scss`)

### Pre-Push Hook

**Location:** `.husky/pre-push`

**What it does:**

- Runs TypeScript type checking
- Runs all unit tests
- Prevents push if any checks fail

## lint-staged Configuration

**Location:** `.lintstagedrc.json`

```json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "*.{css,scss}": ["prettier --write"],
  "package.json": ["prettier --write"]
}
```

### Configuration Breakdown

#### TypeScript/JavaScript Files

```json
"*.{js,jsx,ts,tsx}": [
  "eslint --fix --max-warnings=0",
  "prettier --write"
]
```

- Runs ESLint with auto-fix
- Fails if any warnings remain (`--max-warnings=0`)
- Formats code with Prettier

#### JSON/Markdown/YAML Files

```json
"*.{json,md,yml,yaml}": [
  "prettier --write"
]
```

- Formats with Prettier only
- No linting (Prettier handles formatting)

#### CSS Files

```json
"*.{css,scss}": [
  "prettier --write"
]
```

- Formats CSS/SCSS with Prettier

## Usage

### Normal Workflow

Pre-commit hooks run automatically:

```bash
# Stage your changes
git add .

# Commit (hooks run automatically)
git commit -m "Your commit message"

# Push (pre-push hook runs automatically)
git push
```

### Skipping Hooks (Not Recommended)

If you absolutely need to skip hooks:

```bash
# Skip pre-commit hook
git commit -m "Your message" --no-verify

# Skip pre-push hook
git push --no-verify
```

**Warning:** Only skip hooks when absolutely necessary (e.g., emergency hotfix). Always run checks manually afterward.

### Temporarily Disable All Hooks

```bash
# Disable for one command
HUSKY=0 git commit -m "Your message"

# Disable globally (not recommended)
export HUSKY=0
```

## Installation

Hooks are automatically installed when you run:

```bash
npm install
```

This triggers the `prepare` script in `package.json`:

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

### Manual Installation

If hooks aren't working:

```bash
# Reinstall Husky
npx husky install

# Verify hooks are installed
ls -la .husky/
```

## Troubleshooting

### Hooks Not Running

**Problem:** Commits succeed without running hooks

**Solutions:**

1. **Check if Husky is installed:**

   ```bash
   npx husky --version
   ```

2. **Verify Git hooks path:**

   ```bash
   git config core.hooksPath
   ```

   Should output: `.husky`

3. **Reinstall hooks:**

   ```bash
   npm run prepare
   ```

4. **Check if hooks are disabled:**
   ```bash
   echo $HUSKY
   ```
   Should be empty or `1`

### Hooks Fail on Windows

**Problem:** Hooks fail with "command not found" errors

**Solutions:**

1. **Use Git Bash or WSL** instead of CMD/PowerShell

2. **Update hook scripts** to use Windows-compatible commands

3. **Check Node.js is in PATH:**
   ```bash
   node --version
   npm --version
   ```

### lint-staged Fails

**Problem:** lint-staged reports errors

**Solutions:**

1. **Run linters manually** to see detailed errors:

   ```bash
   npm run lint
   npm run type-check
   ```

2. **Fix errors** before committing

3. **Check lint-staged config:**
   ```bash
   npx lint-staged --debug
   ```

### Slow Hook Execution

**Problem:** Hooks take too long to run

**Solutions:**

1. **lint-staged only runs on staged files** (already optimized)

2. **Reduce pre-push checks** if needed:

   ```bash
   # Edit .husky/pre-push
   # Comment out slow tests
   ```

3. **Use `--no-verify` sparingly** for quick commits

## CI/CD Integration

### Disable Hooks in CI

Hooks are automatically disabled in CI environments:

```yaml
# .github/workflows/ci.yml
env:
  HUSKY: 0 # Disable hooks in CI
```

This prevents duplicate checks (CI runs its own checks).

### Why Disable in CI?

- CI already runs comprehensive checks
- Hooks are for local development
- Prevents unnecessary overhead

## Best Practices

### Do's ✅

- **Let hooks run** - they catch issues early
- **Fix issues immediately** - don't skip hooks
- **Keep hooks fast** - only essential checks
- **Run full tests locally** before pushing
- **Update hooks** when adding new tools

### Don'ts ❌

- **Don't skip hooks regularly** - defeats the purpose
- **Don't add slow checks** to pre-commit
- **Don't commit broken code** with `--no-verify`
- **Don't disable hooks globally** - only per-command if needed

## Customization

### Adding New Checks

To add new checks to pre-commit:

1. **Edit `.lintstagedrc.json`:**

   ```json
   {
     "*.ts": ["eslint --fix", "your-custom-check"]
   }
   ```

2. **Test the hook:**
   ```bash
   git add .
   git commit -m "test"
   ```

### Adding New Hooks

To add new Git hooks:

1. **Create hook file:**

   ```bash
   echo "your-command" > .husky/commit-msg
   ```

2. **Make it executable:**

   ```bash
   chmod +x .husky/commit-msg
   ```

3. **Test the hook:**
   ```bash
   git commit -m "test message"
   ```

### Modifying Existing Hooks

Edit hook files directly:

```bash
# Edit pre-commit hook
nano .husky/pre-commit

# Edit pre-push hook
nano .husky/pre-push
```

## Performance Optimization

### Current Performance

- **Pre-commit:** ~2-5 seconds (only staged files)
- **Pre-push:** ~30-60 seconds (full type-check + tests)

### Optimization Tips

1. **lint-staged is already optimized** - only checks staged files

2. **Pre-push can be optimized:**

   ```bash
   # Only run affected tests
   npm run test:run -- --changed
   ```

3. **Use `--no-verify` for WIP commits:**
   ```bash
   git commit -m "WIP" --no-verify
   # Then run checks manually before pushing
   ```

## Hook Lifecycle

### Pre-Commit

```
1. Developer runs: git commit
2. Git triggers: .husky/pre-commit
3. Hook runs: npx lint-staged
4. lint-staged runs: ESLint + Prettier on staged files
5. If all pass: Commit succeeds
6. If any fail: Commit aborted
```

### Pre-Push

```
1. Developer runs: git push
2. Git triggers: .husky/pre-push
3. Hook runs: npm run type-check
4. Hook runs: npm run test:run
5. If all pass: Push succeeds
6. If any fail: Push aborted
```

## Related Documentation

- [ESLint Configuration](../configuration/eslint.md)
- [Prettier Configuration](../configuration/prettier.md)
- [TypeScript Configuration](../configuration/typescript.md)
- [Testing Guide](../testing.md)

## External Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/lint-staged/lint-staged)
- [Git Hooks Documentation](https://git-scm.com/docs/githooks)

## Changelog

### 2025-10-04: Initial Setup

- Added Husky v9 for Git hooks management
- Added lint-staged for efficient linting
- Configured pre-commit hook with ESLint + Prettier
- Configured pre-push hook with type-check + tests
- Created comprehensive documentation

---

**Last Updated:** 2025-10-04  
**Maintained By:** Cloudlint Development Team
