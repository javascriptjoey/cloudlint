# YAML Tooling (Validation and Auto-fix)

This document describes setup and usage for YAML validation in this repo.

Tools
- yamllint (general YAML): prefer local pip install; Docker fallback (cytopia/yamllint)
- cfn-lint (CloudFormation): prefer Docker ghcr.io/aws-cloudformation/cfn-lint:latest; pip fallback
- Azure Pipelines (schema-based checks): built-in analyzer using Azure Pipelines schema (JSON Schema Store)
- Spectral CLI (@stoplight/spectral-cli): npm devDependency

MCP integration
- Use Context7 MCP to fetch authoritative install/config guidance for yamllint and cfn-lint.
  - MCP Placeholder: Insert curated instructions and tips from Context7 here.
- Use local Spectral MCP to evolve `.spectral.yaml` rules.
  - MCP Placeholder: Insert recommended rules and schema validations here.

Installation
- yamllint (Windows, per-user):
  - py -m pip install --user yamllint
  - Add %APPDATA%\Python\Python313\Scripts to PATH for yamllint.exe
- cfn-lint (Docker preferred):
  - Start Docker Desktop
  - docker pull ghcr.io/aws-cloudformation/cfn-lint:latest
- Spectral:
  - Already installed as devDependency; run via `npx spectral ...`

Usage
- Validate a YAML file:
  - PowerShell:
    - $env:YAML_FILE = "path\\to\\file.yaml"; npm run yaml:validate
- Auto-fix (Prettier + optional Spectral fix):
  - $env:YAML_FILE = "path\\to\\file.yaml"; npm run yaml:fix
- Suggestions (interactive) for provider-aware fixes (AWS CFN, Azure Pipelines):
  - $env:YAML_FILE = "path\\to\\file.yaml"; npm run yaml:suggest
  - Auto-detects provider. Override with --provider aws|azure or env PROVIDER=aws|azure
    - Example: tsx src/backend/yaml/cli.ts suggest --provider azure
- Disable Docker-based cfn-lint temporarily:
  - $env:DISABLE_CFN_LINT = "1"; npm run yaml:validate

Examples
- Docker cfn-lint (PowerShell):
  - $CWD = (Get-Location).Path
  - docker run --rm -v "${CWD}:/data" giammbo/cfn-lint:latest /data/tests/backend/yaml/fixtures/complex-cdk.yaml
- CFN fixture:
  - $env:YAML_FILE = "tests\\backend\\yaml\\fixtures\\complex-cdk.yaml"; npm run yaml:validate
- General YAML fixture:
  - $env:YAML_FILE = "tests\\backend\\yaml\\fixtures\\complex-general.yaml"; npm run yaml:validate
  - $env:YAML_FILE = "tests\\backend\\yaml\\fixtures\\complex-general.yaml"; npm run yaml:fix

Security
- Parse timeout defaults to 5s; override via env YAML_PARSE_TIMEOUT_MS or CLI flag --parse-timeout-ms (max 10s).
- See docs/secure-yaml.md for enforced limits (2 MiB, 15k lines), MIME/type checks, disallowed anchors/tags, and Docker sandboxing.

Schema updates (keeping specs up to date)
- Script: npm run schemas:fetch
  - Downloads latest Azure Pipelines schema to schemas/azure-pipelines.json
  - Downloads latest AWS CloudFormation Resource Specification to schemas/cfn-spec.json
  - Options: SCHEMAS_OUT_DIR or --out-dir to change destination
- Use at runtime:
  - Set CFN_SPEC_PATH=scripts/cfn-spec.json (or absolute path)
  - Set AZURE_PIPELINES_SCHEMA_PATH=scripts/azure-pipelines.json
- Override sources via env:
  - CFN_SPEC_URL, AZURE_PIPELINES_SCHEMA_URL
- CI suggestion: add a step to run schemas:fetch and export CFN_SPEC_PATH/AZURE_PIPELINES_SCHEMA_PATH into the environment for subsequent steps.
- Optional: set PROVIDER=aws|azure to force provider selection during suggest.

Troubleshooting
- Docker not reachable:
  - Ensure Docker Desktop is running; re-run `docker --version` and `docker info`.
- yamllint not found:
  - Confirm PATH includes %APPDATA%\Python\Python313\Scripts or use full path to yamllint.exe
- Spectral issues:
  - Check version: `npx spectral --version`; update devDependency if needed.

