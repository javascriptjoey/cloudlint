# Gitflow Workflow for Cloudlint

This repository follows the Gitflow branching model for organized development and continuous delivery.

## 🌿 Branch Structure

### Long-lived Branches

#### `main`
- **Purpose**: Production-ready code
- **Protection**: ✅ Protected (requires PR approval)
- **Deployment**: Automatically deployed to production
- **Source**: Only accepts merges from `release/*` and `hotfix/*` branches

#### `develop`
- **Purpose**: Integration branch for features ready for next release
- **Protection**: ✅ Protected (requires PR approval)
- **Source**: Accepts merges from `feature/*` and `bug/*` branches

### Short-lived Branches

#### `feature/*`
- **Purpose**: New feature development
- **Naming**: `feature/<ticket-number>/<short-description>`
- **Source**: Created from `develop`
- **Target**: Merged back to `develop`
- **Example**: `feature/CL-123/dark-mode-toggle`

#### `bug/*`
- **Purpose**: Low-priority bug fixes (can wait for next release)
- **Naming**: `bug/<ticket-number>/<short-description>`
- **Source**: Created from `develop`
- **Target**: Merged back to `develop`
- **Example**: `bug/CL-456/fix-button-alignment`

#### `release/*`
- **Purpose**: Prepare code for production release
- **Naming**: `release/<version-number>`
- **Source**: Created from `develop`
- **Target**: Merged to `main`, then `main` merged back to `develop`
- **Example**: `release/v1.2.0`

#### `hotfix/*`
- **Purpose**: Critical bug fixes that can't wait for next release
- **Naming**: `hotfix/<ticket-number>/<short-description>`
- **Source**: Created from `main`
- **Target**: Merged to `main`, then `main` merged back to `develop`
- **Example**: `hotfix/CL-789/security-vulnerability`

## 🚀 Workflow Examples

### Adding a New Feature
```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/CL-123/add-user-authentication

# 2. Develop and commit changes
git add .
git commit -m "Add user authentication system"
git push origin feature/CL-123/add-user-authentication

# 3. Merge directly to develop (or create PR for documentation)
git checkout develop
git merge feature/CL-123/add-user-authentication
git push origin develop

# 4. Delete feature branch
git branch -d feature/CL-123/add-user-authentication
git push origin --delete feature/CL-123/add-user-authentication
```

### Creating a Release
```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Update version numbers, changelog, etc.
git add .
git commit -m "Prepare release v1.2.0"
git push origin release/v1.2.0

# 3. Merge to main branch
git checkout main
git merge release/v1.2.0
git push origin main

# 4. Merge main back to develop to sync branches
git checkout develop
git merge main
git push origin develop

# 5. Delete release branch
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0
```

### Emergency Hotfix
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/CL-789/fix-security-issue

# 2. Fix the critical issue
git add .
git commit -m "Fix critical security vulnerability"
git push origin hotfix/CL-789/fix-security-issue

# 3. Merge to main branch
git checkout main
git merge hotfix/CL-789/fix-security-issue
git push origin main

# 4. Merge main back to develop to sync branches
git checkout develop
git merge main
git push origin develop

# 5. Delete hotfix branch
git branch -d hotfix/CL-789/fix-security-issue
git push origin --delete hotfix/CL-789/fix-security-issue
```

## 🛡️ Branch Protection Rules

**Solo Developer Setup** - No branch protection rules:
- ✅ Direct pushes allowed (you have admin access)
- ✅ Force pushes allowed (use with caution)
- ✅ Pull requests optional (recommended for documentation)
- ✅ Full admin control over all branches

## 🎯 Feature Flags

For continuous delivery, use feature flags to:
- Deploy partial features safely
- Control feature rollout
- Enable/disable features without code changes
- Test features in production with limited users

## 📋 Best Practices

1. **Always create branches from the correct source**:
   - Features/bugs: from `develop`
   - Releases: from `develop`
   - Hotfixes: from `main`

2. **Keep branches focused and small**:
   - One feature per branch
   - Regular commits with clear messages
   - Frequent pushes to remote

3. **Use descriptive branch names**:
   - Include ticket number
   - Brief description of work
   - Follow naming conventions

4. **Clean up after merging**:
   - Delete merged feature branches
   - Keep repository clean

5. **Sync branches regularly**:
   - After release merges, sync `main` → `develop`
   - After hotfix merges, sync `main` → `develop`

## 🔄 Continuous Integration

- All PRs trigger automated tests
- Code quality checks on every commit
- Automated deployment from `main` to production
- Staging deployments from `release/*` branches