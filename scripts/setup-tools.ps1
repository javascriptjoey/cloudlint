# Cloudlint External Tools Setup Script
# This script installs and configures all required external tools for validation

Write-Host "🔧 Setting up Cloudlint External Tools..." -ForegroundColor Cyan

# Check if Docker is installed and running
Write-Host "`n📦 Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
        
        # Pull required Docker images
        Write-Host "`n🚢 Pulling Docker images..." -ForegroundColor Yellow
        
        $images = @(
            "cytopia/yamllint:latest",
            "giammbo/cfn-lint:latest"
        )
        
        foreach ($image in $images) {
            Write-Host "  Pulling $image..." -ForegroundColor Gray
            docker pull $image
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ $image ready" -ForegroundColor Green
            } else {
                Write-Host "  ❌ Failed to pull $image" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
        Write-Host "   Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Docker not available: $($_.Exception.Message)" -ForegroundColor Red
}

# Check if Node.js tools are available
Write-Host "`n📦 Checking Node.js tools..." -ForegroundColor Yellow

$nodeTools = @(
    @{ name = "yamllint"; command = "yamllint --version"; install = "pip install yamllint" },
    @{ name = "spectral"; command = "npx @stoplight/spectral-cli --version"; install = "npm install -g @stoplight/spectral-cli" },
    @{ name = "prettier"; command = "npx prettier --version"; install = "Already in package.json dependencies" }
)

foreach ($tool in $nodeTools) {
    try {
        $output = Invoke-Expression $tool.command 2>$null
        if ($output) {
            Write-Host "✅ $($tool.name) found: $output" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($tool.name) not found. Install with: $($tool.install)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  $($tool.name) not available. Install with: $($tool.install)" -ForegroundColor Yellow
    }
}

# Create environment configuration template
Write-Host "`n📝 Creating environment template..." -ForegroundColor Yellow
$envTemplate = @"
# Cloudlint Environment Configuration
# Copy this to .env.local and customize as needed

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
"@

$envFile = ".env.template"
$envTemplate | Out-File -FilePath $envFile -Encoding UTF8
Write-Host "✅ Created $envFile" -ForegroundColor Green

# Test backend server startup
Write-Host "`n🧪 Testing backend server..." -ForegroundColor Yellow
Write-Host "Starting backend server for 10 seconds..." -ForegroundColor Gray

$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev:backend
}

Start-Sleep -Seconds 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
    if ($response -eq "ok") {
        Write-Host "✅ Backend server responding correctly" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend server test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue

Write-Host "`n🎉 Tool setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Copy .env.template to .env.local and customize" -ForegroundColor White
Write-Host "2. Run 'npm run dev:backend' to start the backend" -ForegroundColor White  
Write-Host "3. Run 'npm run dev' in another terminal for frontend" -ForegroundColor White