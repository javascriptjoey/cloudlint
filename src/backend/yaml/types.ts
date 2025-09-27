export type LintSource = 'yamllint' | 'cfn-lint' | 'spectral' | 'parser'

export interface LintMessage {
  source: LintSource
  path?: string
  line?: number
  column?: number
  message: string
  severity: 'error' | 'warning' | 'info'
  ruleId?: string
  kind?: 'syntax' | 'semantic' | 'style'
  suggestion?: string
}

export interface LintResult {
  ok: boolean
  messages: LintMessage[]
}

export interface ValidateOptions {
  filename?: string
  assumeCloudFormation?: boolean
  toolRunner?: ToolRunner
  spectralRulesetPath?: string
}

export interface AutoFixOptions {
  prettier?: boolean
  spectralFix?: boolean
  spectralRulesetPath?: string
  toolRunner?: ToolRunner
  cfnFix?: boolean
}

export interface ToolRunner {
  run(cmd: string, args: string[], opts?: { cwd?: string; input?: string; timeoutMs?: number }): Promise<{ code: number; stdout: string; stderr: string }>
}
