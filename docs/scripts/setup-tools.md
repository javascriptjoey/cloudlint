# Setup Tools Script

**Script Location:** `scripts/setup-tools.ps1`

## Purpose

This script installs and configures all required external tools for Cloudlint validation, including Docker images, Node.js tools, and environment configuration. It's the first script to run when setting up a new development environment.

## What It Does

1. **Docker Verification**: Checks if Docker is installed and running
2. **Docker Image Pull**: Downloads required validation tool images:
   - `cytopia/yamllint:latest` - YAML linting
   - `giammbo/cfn-lint:latest` - CloudFormation validation
3. **Node.js Tools Check**: Verifies availability of:
   - yamllint (Python-based)
   - Spectral (OpenAPI/AsyncAPI linting)
   - Prettier (code formatting)
4. **Environment Template**: Creates `.env.template` with configuration options
5. **Backend Test**: Starts backend server briefly to verify it works

## Usage

```powershell
.\scripts\setup-tools.ps1
```

## Prerequisites

- PowerShell 5.1 or higher
- Docker Desktop installed and running (for Docker-based tools)
- Node.js and npm installed
- Internet connection for downloading Docker images

## What Gets Installed

### Docker Images

- **cytopia/yamllint**: YAML syntax and style validation
- **giammbo/cfn-lint**: AWS CloudFormation template validation

### Node.js Tools (Checked)

- **yamllint**: Python-based YAML linter
- **Spectral**: API specification linting
- **Prettier**: Code formatting (included in package.json)

## Output

The script provides:

- Docker installation status
- Docker image pull progress
- Node.js tool availability status
- Environment template creation confirmation
- Backend server test results

## Example Output

```
🔧 Setting up Cloudlint External Tools...

📦 Checking Docker...
✅ Docker found: Docker version 24.0.6, build ed223bc

🚢 Pulling Docker images...
  Pulling cytopia/yamllint:latest...
  ✅ cytopia/yamllint:latest ready
  Pulling giammbo/cfn-lint:latest...
  ✅ giammbo/cfn-lint:latest ready

📦 Checking Node.js tools...
✅ yamllint found: yamllint 1.32.0
✅ spectral found: 6.11.0
✅ prettier found: 3.1.0

📝 Creating environment template...
✅ Created .env.template

🧪 Testing backend server...
Starting backend server for 10 seconds...
✅ Backend server responding correctly

🎉 Tool setup complete!

Next steps:
1. Copy .env.template to .env.local and customize
2. Run 'npm run dev:backend' to start the backend
3. Run 'npm run dev' in another terminal for frontend
```

## Environment Template

The script creates `.env.template` with these configuration options:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# External Tool Paths (optional - Docker fallbacks available)
# YAMLLINT_PATH=yamllint
# SPECTRAL_PATH=npx @stoplight/spectral-cli

# Schema Paths (optional)
# AZURE_PIPELINES_SCHEMA_PATH=./schemas/azure-pipelines.json
# CFN_SPEC_PATH=./schemas/cfn-spec.json
# SPECTRAL_RULESET=./schemas/spectral-ruleset.yaml

# Rate Limiting (requests per minute)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120

# Security Settings
# CORS_ORIGIN=http://localhost:5173
# RELAXED_SECURITY=false
```

## When to Use

- Initial project setup for new developers
- After cloning the repository
- When Docker images need updating
- After system reinstall or environment reset
- When troubleshooting tool availability issues

## Troubleshooting

**Issue**: Docker not found

- **Solution**: Install Docker Desktop from https://www.docker.com/products/docker-desktop

**Issue**: Docker image pull fails

- **Solution**: Check internet connection and Docker daemon status

**Issue**: yamllint not found

- **Solution**: Install with `pip install yamllint`

**Issue**: Backend server test fails

- **Solution**: Check if port 3001 is available, run `restart-clean.ps1`

## Post-Setup Steps

1. Copy `.env.template` to `.env.local`
2. Customize environment variables as needed
3. Run `npm install` to install Node.js dependencies
4. Start development servers:
   - Terminal 1: `npm run dev:backend`
   - Terminal 2: `npm run dev`

## Notes

- Safe to run multiple times (idempotent)
- Docker images are cached after first pull
- Backend server test runs for 10 seconds only
- Creates template file, doesn't overwrite existing `.env.local`
- Provides fallback options if tools aren't available
