# Secure YAML Processing (Backend)

This document describes the security precautions implemented for YAML parsing and validation.

Key precautions
- Parse timeout: default 5s (configurable via YAML_PARSE_TIMEOUT_MS env or --parse-timeout-ms CLI flag, max 10s)
- Strict size and line limits:
  - Max file size: 2 MiB (2,097,152 bytes)
  - Max lines: 15,000
- Safe parsing defaults:
  - YAML 1.2 core schema with uniqueKeys
  - Disallow anchors/aliases and explicit custom tags via preflight guards
  - Never execute/eval from YAML
- Timeouts and sandboxing:
  - Tool subprocesses (e.g., cfn-lint) run in Docker with --network=none and read-only bind mount
  - Tool runner enforces execution timeouts and kills long-running processes
- MIME/type checks:
  - Only application/yaml, application/x-yaml, text/yaml, text/x-yaml accepted
  - Only .yaml/.yml extensions allowed
- Privacy/sanitization:
  - Do not store raw YAML; avoid logging content; sanitize snippets when necessary

Context7 MCP (to-do placeholders)
- Insert authoritative references for:
  - Safe YAML parsing in Node.js/TS (yaml, js-yaml with FAILSAFE_SCHEMA)
  - DoS protections (billion laughs), recursion depth limits, and timeouts
  - File upload MIME/extension validation guidance
  - Subprocess isolation & sandboxing best practices for Dockerized linters

CLI/validation behavior
- validateYaml(content, opts?): Runs security preflight; parses with safe options; runs yamllint/cfn-lint/spectral when configured.
- validateDirectory(dir): Batch-validates all .yaml/.yml files under dir.

Troubleshooting
- If cfn-lint fails in Docker: ensure Docker Desktop is running; image present; permissions correct. The bind mount is read-only and the container network is disabled.