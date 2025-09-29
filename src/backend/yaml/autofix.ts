import type { AutoFixOptions, ToolRunner } from './types'
import { defaultToolRunner } from './toolRunner'
import prettier from 'prettier'

export async function autoFixYaml(content: string, opts: AutoFixOptions = {}): Promise<{ content: string; fixesApplied: string[] }> {
  const fixesApplied: string[] = []
  const runner: ToolRunner = opts.toolRunner ?? defaultToolRunner
  let current = content

  // Normalize EOLs to \n
  if (/\r\n/.test(current)) {
    current = current.replace(/\r\n/g, '\n')
    fixesApplied.push('normalize-eol')
  }

  // Tabs to two spaces (basic safety)
  if (/\t/.test(current)) {
    current = current.replace(/\t/g, '  ')
    fixesApplied.push('tabs-to-spaces')
  }

  // Ensure document start if missing
  if (!/^---\s/m.test(current)) {
    current = `---\n${current}`
    fixesApplied.push('add-document-start')
  }

  // Remove anchors/aliases and de-duplicate keys by parse -> stringify roundtrip
  try {
    const YAML = (await import('yaml')).default
    const before = current
    const doc = YAML.parseDocument(current, { uniqueKeys: false })
    const obj = doc.toJS({ mapAsMap: false })
    let normalized = YAML.stringify(obj)
    if (!/\n$/.test(normalized)) normalized += '\n'
    if (normalized !== before) {
      current = normalized
      fixesApplied.push('remove-anchors-aliases')
      fixesApplied.push('dedupe-keys-last-wins')
    }
  } catch {
    // If parse fails here, prettier might still fix formatting; validator covers syntax errors
  }

  // Simple CFN property typo fixes
  if (opts.cfnFix !== false) {
    const before = current
    current = current.replace(/\bBucketnName\s*:/g, 'BucketName:')
                     .replace(/\bBucktName\s*:/g, 'BucketName:')
                     .replace(/\bBuckt\s*:/g, 'Bucket:')
    if (current !== before) fixesApplied.push('cfn-typo-fix')
  }

  // CFN suggestions (safe non-semantic fixes like rename typos)
  try {
    const { analyze, applySuggestions } = await import('./cfnSuggest')
    const parsed = await (async () => current)()
    const doc = (await import('yaml')).default.parse(parsed)
    const { suggestions } = analyze(doc)
    const renameIdxs = suggestions.map((s, i) => [s.kind, i] as const).filter(([k]) => k === 'rename').map(([,i])=>i)
    if (renameIdxs.length) {
      const applied = applySuggestions(parsed, renameIdxs)
      current = applied.content
      fixesApplied.push('cfn-rename-typos')
    }
  } catch {
    // ignore if analyze not available
  }

  if (opts.spectralFix) {
    // Use spectral CLI via npx if available, feed content via stdin.
    const args = ['spectral', 'lint', '--stdin', '--fix']
    if (opts.spectralRulesetPath) {
      args.push('-r', opts.spectralRulesetPath)
    }
    const result = await runner.run('npx', args, { input: current })
    // spectral writes the fixed doc to stdout on success; exit code 0 for no issues, 1 for issues found (fixed)
    if (result.stdout && result.code <= 1) {
      current = result.stdout
      fixesApplied.push('spectral-fix')
    }
  }

  if (opts.prettier !== false) {
    current = await prettier.format(current, { parser: 'yaml' })
    fixesApplied.push('prettier-yaml')
  }

  // Ensure trailing newline
  if (!/\n$/.test(current)) {
    current += '\n'
    fixesApplied.push('ensure-trailing-newline')
  }

  return { content: current, fixesApplied }
}
