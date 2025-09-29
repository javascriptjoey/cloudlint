import type { LintResult, ValidateOptions, LintMessage } from './yaml'
import { validateYaml as coreValidate } from './yaml'
import { detectProvider, type YamlProvider } from './yaml/detect'
import { unifiedDiff } from './diff'
import { schemaValidateYaml, type SchemaValidationResult } from './yaml/schemaValidate'

export type SdkSuggestion = {
  path: string
  message: string
  kind: 'add' | 'rename' | 'type'
  confidence?: number
}

export async function validateYaml(content: string, options: ValidateOptions = {}): Promise<LintResult> {
  return coreValidate(content, options)
}

export { autoFixYaml } from './yaml'

export async function suggest(content: string, provider?: YamlProvider): Promise<{ provider: YamlProvider; suggestions: SdkSuggestion[]; messages: LintMessage[] }>{
  const prov = detectProvider(content, provider)
  const YAML = (await import('yaml')).default
  const doc = YAML.parse(content)
  if (prov === 'aws') {
    const { analyze } = await import('./yaml/cfnSuggest')
    const { suggestions, messages } = analyze(doc)
    return { provider: prov, suggestions: suggestions.map(mapSug), messages }
  } else if (prov === 'azure') {
    const { analyze } = await import('./yaml/azureSuggest')
    const { suggestions, messages } = analyze(doc)
    return { provider: prov, suggestions: suggestions.map(mapSug), messages }
  }
  return { provider: 'generic', suggestions: [], messages: [] }
}

export async function applySuggestions(content: string, indexes: number[], provider?: YamlProvider): Promise<{ content: string }>{
  const prov = detectProvider(content, provider)
  if (prov === 'aws') {
    const { applySuggestions } = await import('./yaml/cfnSuggest')
    return applySuggestions(content, indexes)
  } else if (prov === 'azure') {
    const { applySuggestions } = await import('./yaml/azureSuggest')
    return applySuggestions(content, indexes)
  }
  return { content }
}

export function diffPreview(before: string, after: string, filename?: string): string {
  return unifiedDiff(before, after, filename)
}

export function schemaValidate(yaml: string, schema: unknown): SchemaValidationResult {
  return schemaValidateYaml(yaml, schema)
}

function mapSug(s: { path: string; message: string; kind: 'add'|'rename'|'type'; confidence?: number }): SdkSuggestion {
  return { path: s.path, message: s.message, kind: s.kind, confidence: s.confidence }
}
