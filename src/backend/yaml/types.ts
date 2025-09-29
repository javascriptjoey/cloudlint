export type LintSource = 'yamllint' | 'cfn-lint' | 'spectral' | 'parser' | 'azure-schema'

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

export interface SourceCounts {
  errors: number
  warnings: number
  infos: number
}

export interface ProviderSummary {
  provider: 'aws' | 'azure' | 'generic'
  sources: {
    azureSchemaPath?: string
    cfnSpecPath?: string
    spectralRulesetPath?: string
    cfnLintDockerImage?: string
  }
  counts: Partial<Record<LintSource, SourceCounts>>
}

export interface LintResult {
  ok: boolean
  messages: LintMessage[]
  providerSummary?: ProviderSummary
}

export interface ValidateOptions {
  filename?: string
  mimeType?: string
  provider?: 'aws' | 'azure' | 'generic'
  assumeCloudFormation?: boolean
  assumeAzurePipelines?: boolean
  toolRunner?: ToolRunner
  spectralRulesetPath?: string
  parseTimeoutMs?: number
  relaxSecurity?: boolean
  allowAnchors?: boolean
  allowAliases?: boolean
  allowedTags?: string[]
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
