# CI/CD Pipeline Documentation

This repository uses GitHub Actions for continuous integration and deployment.

## 🚀 Workflows Overview

### 1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Build and Test
- **Matrix Strategy**: Tests on Node.js 18.x and 20.x
- **Steps**:
  - Checkout code
  - Setup Node.js with npm cache
  - Install dependencies (`npm ci`)
  - Run ESLint (`npm run lint`)
  - Build application (`npm run build`)
  - Upload build artifacts (Node 20.x only)

#### Security Checks
- **Dependencies**: Runs after build-and-test
- **Steps**:
  - Security audit (`npm audit`)
  - Check for outdated packages
  - Dependency vulnerability scanning

#### Deploy to GitHub Pages
- **Condition**: Only runs on `main` branch pushes
- **Permissions**: Pages write access
- **Steps**:
  - Build production version
  - Configure GitHub Pages
  - Upload and deploy to Pages

### 2. **Gitflow Automation** (`.github/workflows/gitflow.yml`)

**Triggers:**
- Push to `release/**` or `hotfix/**` branches
- Pull requests to `main` or `develop`

**Jobs:**

#### Branch Validation
- **Purpose**: Enforce Gitflow naming conventions
- **Patterns**:
  - `feature/TICKET-123/description` or `feature/description`
  - `bug/TICKET-123/description` or `bug/description`
  - `release/v1.2.3`
  - `hotfix/TICKET-123/description`

#### Auto-merge Release
- **Trigger**: Push to `release/**` branches
- **Action**: Creates PR from release branch to `main`

#### Branch Synchronization
- **Trigger**: Push to `main` branch
- **Action**: Merges `main` changes back to `develop`

### 3. **Dependency Updates** (`.github/workflows/dependency-update.yml`)

**Triggers:**
- Scheduled: Every Monday at 9 AM UTC
- Manual: `workflow_dispatch`

**Jobs:**
- Check for outdated dependencies
- Update patch and minor versions
- Run tests after updates
- Create PR with dependency updates

## 🔧 Configuration Files

### Vite Configuration (`vite.config.ts`)
```typescript
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/cloudlint/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
})
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

## 🌐 GitHub Pages Deployment

### Setup Steps:
1. **Enable GitHub Pages**:
   - Go to Repository Settings → Pages
   - Source: GitHub Actions
   - Custom domain (optional)

2. **Automatic Deployment**:
   - Every push to `main` triggers deployment
   - Build artifacts uploaded to Pages
   - Live site available at: `https://javascriptjoey.github.io/cloudlint/`

### Deployment Process:
1. Code pushed to `main` branch
2. CI/CD pipeline runs tests and builds
3. Production build created with correct base path
4. Artifacts uploaded to GitHub Pages
5. Site deployed automatically

## 🛡️ Security and Quality

### Automated Checks:
- **ESLint**: Code quality and style enforcement
- **npm audit**: Security vulnerability scanning
- **Dependency updates**: Weekly automated updates
- **Build validation**: Ensures deployable code

### Branch Protection:
- No protection rules (solo developer setup)
- Workflows provide quality gates
- Failed builds prevent deployment

## 📊 Monitoring and Notifications

### Build Status:
- ✅ **Success**: All checks pass, deployment proceeds
- ❌ **Failure**: Issues found, deployment blocked
- 🟡 **In Progress**: Workflows running

### Notifications:
- GitHub notifications for workflow results
- PR status checks show build results
- Email notifications for failed builds (configurable)

## 🔄 Workflow Examples

### Feature Development:
```bash
# 1. Create feature branch
git checkout develop
git checkout -b feature/CL-001/new-component

# 2. Develop and push
git add . && git commit -m "Add new component"
git push origin feature/CL-001/new-component

# 3. Workflows run automatically on push
# 4. Merge to develop when ready
```

### Release Process:
```bash
# 1. Create release branch
git checkout develop
git checkout -b release/v1.1.0

# 2. Update version and push
npm version minor
git push origin release/v1.1.0

# 3. Auto-PR created to main
# 4. Merge PR triggers deployment
# 5. Main synced back to develop
```

### Hotfix Process:
```bash
# 1. Create hotfix from main
git checkout main
git checkout -b hotfix/CL-002/critical-fix

# 2. Fix and push
git add . && git commit -m "Fix critical issue"
git push origin hotfix/CL-002/critical-fix

# 3. Merge to main
# 4. Deployment and sync automatic
```

## 🎯 Best Practices

### Commit Messages:
- Use conventional commits: `feat:`, `fix:`, `chore:`
- Clear, descriptive messages
- Reference ticket numbers when applicable

### Branch Management:
- Follow Gitflow naming conventions
- Keep branches focused and small
- Regular cleanup of merged branches

### Code Quality:
- Fix ESLint warnings before merging
- Ensure builds pass locally first
- Review dependency updates carefully

### Deployment:
- Test in preview environment first
- Monitor deployment status
- Rollback capability via Git history

## 🚨 Troubleshooting

### Common Issues:

#### Build Failures:
- Check ESLint errors: `npm run lint`
- Verify TypeScript compilation: `npm run build`
- Review dependency conflicts

#### Deployment Issues:
- Verify GitHub Pages settings
- Check base path configuration
- Review workflow permissions

#### Branch Validation Failures:
- Follow Gitflow naming conventions
- Check branch name patterns
- Review validation rules in workflow

### Getting Help:
- Check workflow logs in Actions tab
- Review error messages carefully
- Verify repository settings and permissions