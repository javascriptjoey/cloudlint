import { parseWithTimeout } from './parseSafe'
import { isLikelyCloudFormation, isLikelyAzurePipelines, detectProvider } from './detect'
import type { LintMessage, LintResult, ValidateOptions, ToolRunner, ProviderSummary } from './types'
import { defaultToolRunner } from './toolRunner'
import { preflightContentGuards, validateFileMeta } from './security'
import fs from 'node:fs'

function pushParserError(e: unknown, messages: LintMessage[]) {
  const msg = e instanceof Error ? e.message : String(e)
  messages.push({ source: 'parser', message: msg, severity: 'error' })
}

export async function validateYaml(content: string, options: ValidateOptions = {}): Promise<LintResult> {
  const messages: LintMessage[] = []

  // Security preflight checks (size, lines, anchors/tags, extension/mime)
  const metaIssues = [
    ...validateFileMeta(options.filename, options.mimeType),
    ...preflightContentGuards(content, options.filename),
  ]
  if (metaIssues.length) return { ok: false, messages: metaIssues }

  // Basic parse validation with safe options
  try {
    await parseWithTimeout(content, { timeoutMs: options.parseTimeoutMs })
  } catch (e) {
    pushParserError(e, messages)
    return { ok: false, messages }
  }

  const runner: ToolRunner = options.toolRunner ?? defaultToolRunner

  // yamllint (general YAML)
  // yamllint execution state is internal; no external dependency
  const parseYamllint = (out: string) => {
    if (!out) return
    const lines = out.trim().split(/\r?\n/)
    for (const l of lines) {
      const m = l.match(/^(?:<stdin>|[^:]+):(\d+):(\d+):\s*\[(\w+)\]\s*(.*?)\s*(?:\(([^)]+)\))?$/)
      if (m) {
        messages.push({
          source: 'yamllint',
          line: Number(m[1]),
          column: Number(m[2]),
          severity: m[3] === 'error' ? 'error' : m[3] === 'warning' ? 'warning' : 'info',
          message: m[4],
          ruleId: m[5],
        })
      }
    }
  }
  try {
    const res = await runner.run('yamllint', ['-f', 'parsable', '-'], { input: content })
    if (res.code !== 0) parseYamllint(res.stdout)
  } catch {
    // Fallback to dockerized yamllint (cytopia/yamllint)
    try {
      const res = await runner.run('docker', ['run', '--rm', '-i', 'cytopia/yamllint', 'yamllint', '-f', 'parsable', '-'], { input: content })
      if (res.code !== 0) parseYamllint(res.stdout)
    } catch {
      messages.push({ source: 'yamllint', message: 'yamllint not available; skipped', severity: 'info' })
    }
  }

  // cfn-lint (CloudFormation), only if CFN detected or forced
  const runCfn = options.assumeCloudFormation || isLikelyCloudFormation(content)
  const cfnDockerImage = 'giammbo/cfn-lint:latest'
  if (runCfn) {
    try {
      if (!options.filename) {
        messages.push({ source: 'cfn-lint', message: 'CFN detection true but no filename provided; cfn-lint requires a file path. Skipped.', severity: 'info' })
      } else {
const res = await runner.run('docker', ['run', '--rm', '--network=none', '-v', `${process.cwd()}:${process.cwd()}:ro`, '-w', process.cwd(), cfnDockerImage, 'cfn-lint', '-f', 'json', options.filename])
        if (res.code !== 0 && res.stdout) {
          try {
            type CFNFinding = {
              Filename: string
              Location?: { Start?: { Line?: number; Column?: number } }
              Message: string
              Level: 'Error' | 'Warning' | string
              Rule?: { Id?: string }
            }
            const arr = JSON.parse(res.stdout) as CFNFinding[]
            for (const it of arr) {
              messages.push({
                source: 'cfn-lint',
                path: it.Filename,
                line: it.Location?.Start?.Line,
                column: it.Location?.Start?.Column,
                message: it.Message,
                severity: it.Level === 'Error' ? 'error' : it.Level === 'Warning' ? 'warning' : 'info',
                ruleId: it.Rule?.Id,
              })
            }
          } catch {
            messages.push({ source: 'cfn-lint', message: 'Failed to parse cfn-lint JSON output', severity: 'warning' })
          }
        }
      }
    } catch {
      messages.push({ source: 'cfn-lint', message: 'cfn-lint not available; skipped', severity: 'info' })
    }
  }

  // Azure Pipelines schema checks (internal), only if detected or forced
  const runAzure = options.assumeAzurePipelines || isLikelyAzurePipelines(content)
  if (runAzure) {
    try {
      const YAML = (await import('yaml')).default
      const doc = YAML.parse(content)
      const { analyze } = await import('./azureSuggest')
      const { messages: azureMsgs } = analyze(doc)
      messages.push(...azureMsgs)
    } catch {
      messages.push({ source: 'azure-schema', message: 'Azure analyzer not available; skipped', severity: 'info' })
    }
  }

  // Spectral (schema/custom rules), if ruleset provided
  if (options.spectralRulesetPath) {
    try {
      const res = await runner.run('npx', ['-y', 'spectral', 'lint', '--stdin', '-r', options.spectralRulesetPath, '-f', 'json'], { input: content })
      if (res.stdout) {
        try {
          const out = JSON.parse(res.stdout) as Array<{ code: string; message: string; path: (string|number)[]; range?: { start: { line: number; character: number } } ; severity: number }>
          for (const v of out) {
            messages.push({
              source: 'spectral',
              message: v.message,
              ruleId: v.code,
              line: v.range ? v.range.start.line + 1 : undefined,
              column: v.range ? v.range.start.character + 1 : undefined,
              severity: v.severity === 0 ? 'error' : v.severity === 1 ? 'warning' : 'info',
            })
          }
        } catch {
          messages.push({ source: 'spectral', message: 'Failed to parse spectral JSON output', severity: 'warning' })
        }
      }
    } catch {
      messages.push({ source: 'spectral', message: 'spectral not available; skipped', severity: 'info' })
    }
  }

  // Build provider summary
  const provider = detectProvider(content)
  const counts: Record<string, { errors: number; warnings: number; infos: number }> = {}
  const bump = (src: string, sev: 'error'|'warning'|'info') => {
    if (!counts[src]) counts[src] = { errors: 0, warnings: 0, infos: 0 }
    if (sev === 'error') counts[src].errors++
    else if (sev === 'warning') counts[src].warnings++
    else counts[src].infos++
  }
  for (const m of messages) bump(m.source, m.severity)

  const azureSchemaPath = process.env.AZURE_PIPELINES_SCHEMA_PATH && fs.existsSync(process.env.AZURE_PIPELINES_SCHEMA_PATH) ? process.env.AZURE_PIPELINES_SCHEMA_PATH : undefined
  const cfnSpecPath = process.env.CFN_SPEC_PATH && fs.existsSync(process.env.CFN_SPEC_PATH) ? process.env.CFN_SPEC_PATH : undefined
  const spectralRulesetPath = options.spectralRulesetPath || process.env.SPECTRAL_RULESET || undefined

  const providerSummary: ProviderSummary = {
    provider,
    sources: {
      azureSchemaPath,
      cfnSpecPath,
      spectralRulesetPath,
      cfnLintDockerImage: runCfn ? cfnDockerImage : undefined,
    },
    counts: counts as unknown as ProviderSummary['counts'],
  }

  const ok = messages.every((m) => m.severity !== 'error')
  return { ok, messages, providerSummary }
}
