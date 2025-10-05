# CloudLint REST API

Base URL: http://localhost:8787

Rate limits (default): 120 requests per 60 seconds per instance. Configure via RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX.

All endpoints support:
- Query `download=1` and optional `filename=...` to trigger file download with appropriate Content-Disposition.
- Query `as=text` to return a copy-to-clipboard-friendly plain text payload (YAML or JSON string).

## POST /validate
Body:
- yaml: string
- options: ValidateOptions (filename, mimeType, provider, spectralRulesetPath, relaxSecurity, allowAnchors, allowAliases, allowedTags)

Response: LintResult JSON with providerSummary.

## POST /autofix
Body:
- yaml: string
- options: AutoFixOptions

Response JSON:
- content: string (fixed YAML)
- fixesApplied: string[]

## POST /suggest
Body:
- yaml: string
- provider?: 'aws'|'azure'|'generic'

Response JSON:
- provider: string
- suggestions: array
- messages: array

## POST /apply-suggestions
Body:
- yaml: string
- indexes: number[]
- provider?: 'aws'|'azure'|'generic'

Response JSON:
- content: string (modified YAML)

## POST /convert
Body: provide exactly one of
- yaml: string  -> returns { json: string }
- json: string  -> returns { yaml: string }

## POST /diff-preview
Body: one of
- { original: string, modified: string }
- { original: string, indexes: number[], provider?: string }
- { original: string, autofixOptions: AutoFixOptions }

Response JSON:
- diff: unified diff
- before: string
- after: string

## POST /schema-validate
Body:
- yaml: string
- schema: object (JSON Schema) or
- schemaUrl: string (will be fetched)

Response JSON:
- ok: boolean
- errors?: array of { instancePath, message, keyword }

Errors use HTTP 400 with `{ error: string }`.