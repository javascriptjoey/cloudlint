import YAML from 'yaml'
import { isLikelyCloudFormation } from './detect'
import type { LintMessage, LintResult, ValidateOptions, ToolRunner } from './types'
import { defaultToolRunner } from './toolRunner'

function pushParserError(e: unknown, messages: LintMessage[]) {
  const msg = e instanceof Error ? e.message : String(e)
  messages.push({ source: 'parser', message: msg, severity: 'error' })
}

export async function validateYaml(content: string, options: ValidateOptions = {}): Promise<LintResult> {
  const messages: LintMessage[] = []

  // Basic parse validation first
  try {
    YAML.parse(content)
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
  if (runCfn) {
    try {
      // Use dockerized cfn-lint if available, otherwise npx cfn-lint if installed globally
      // Prefer stdin via temp file workaround: cfn-lint expects a file. We'll pass via - (stdin) is not supported; so skip stdin and fallback to docker echo piping.
      // Create a temp file approach: not writing files in this utility; instead, rely on caller to provide filename if needed.
      if (!options.filename) {
        messages.push({ source: 'cfn-lint', message: 'CFN detection true but no filename provided; cfn-lint requires a file path. Skipped.', severity: 'info' })
      } else {
        const res = await runner.run('docker', ['run', '--rm', '-v', `${process.cwd()}:${process.cwd()}`, '-w', process.cwd(), 'ghcr.io/aws-cloudformation/cfn-lint:latest', 'cfn-lint', '-f', 'json', options.filename])
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

  const ok = messages.every((m) => m.severity !== 'error')
  return { ok, messages }
}