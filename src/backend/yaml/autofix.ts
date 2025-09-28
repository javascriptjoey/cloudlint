import type { AutoFixOptions, ToolRunner } from './types'
import { defaultToolRunner } from './toolRunner'
import prettier from 'prettier'

export async function autoFixYaml(content: string, opts: AutoFixOptions = {}): Promise<{ content: string; fixesApplied: string[] }> {
  const fixesApplied: string[] = []
  const runner: ToolRunner = opts.toolRunner ?? defaultToolRunner
  let current = content

  // Ensure document start if missing
  if (!/^---\s/m.test(current)) {
    current = `---\n${current}`
    fixesApplied.push('add-document-start')
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
    const parsed = await (async () => content)()
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

  return { content: current, fixesApplied }
}