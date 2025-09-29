#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { autoFixYaml, validateYaml } from './index'

function getFile(): string {
  const f = process.env.YAML_FILE
  if (!f) {
    console.error('Set YAML_FILE to the YAML file path')
    process.exit(2)
  }
  return resolve(process.cwd(), f)
}

function readParseTimeoutArg(): number | undefined {
  const idx = process.argv.indexOf('--parse-timeout-ms')
  if (idx !== -1 && process.argv[idx + 1]) {
    const v = Number(process.argv[idx + 1])
    if (Number.isFinite(v)) return v
  }
  const envV = Number(process.env.YAML_PARSE_TIMEOUT_MS ?? '')
  if (Number.isFinite(envV)) return envV
  return undefined
}

async function doValidate() {
  const p = getFile()
  const content = readFileSync(p, 'utf8')
  const disableCfn = !!process.env.DISABLE_CFN_LINT
  const res = await validateYaml(content, { filename: disableCfn ? undefined : p, parseTimeoutMs: readParseTimeoutArg() })
  console.log(JSON.stringify(res, null, 2))
  process.exit(res.ok ? 0 : 1)
}

async function doFix() {
  const p = getFile()
  const content = readFileSync(p, 'utf8')
  const { content: fixed, fixesApplied } = await autoFixYaml(content, { spectralFix: true })
  writeFileSync(p, fixed, 'utf8')
  console.log(JSON.stringify({ file: p, fixesApplied }, null, 2))
}

async function doSuggestInteractive() {
  const p = getFile()
  const content = readFileSync(p, 'utf8')
  const providerArgIdx = process.argv.indexOf('--provider')
  const forcedProv: string | undefined = providerArgIdx !== -1 ? String(process.argv[providerArgIdx + 1] || '') : undefined
  const forced: string | undefined = process.env.PROVIDER || forcedProv
  const { detectProvider } = await import('./detect')
  const forcedProvider = (forced === 'aws' || forced === 'azure' || forced === 'generic') ? forced : undefined
  const prov = detectProvider(content, forcedProvider)

  const YAML = (await import('yaml')).default
  const doc = YAML.parse(content)

  let analyze: (doc: unknown) => { suggestions: { kind: string; path: string; message: string; confidence?: number; fix?: (doc: unknown) => void }[]; messages: unknown[] }
  let applySuggestions: (content: string, selected: number[]) => { content: string }
  if (prov === 'aws') {
    ({ analyze, applySuggestions } = await import('./cfnSuggest'))
  } else if (prov === 'azure') {
    ({ analyze, applySuggestions } = await import('./azureSuggest'))
  } else {
    console.log('Generic YAML detected: suggestion engine currently supports AWS CloudFormation and Azure Pipelines. No suggestions available for generic YAML.')
    return
  }

  const { suggestions } = analyze(doc)
  if (!suggestions.length) {
    console.log('No suggestions found')
    return
  }
  const applySafeOnly = process.argv.includes('--apply-safe-only')
  const applyAll = process.argv.includes('--apply-all')
  const SAFE_THRESHOLD = 0.8

  console.log(`Provider: ${prov}`)
  console.log('Suggestions:')
  suggestions.forEach((s, i) => {
    const conf = typeof s.confidence === 'number' ? ` (conf=${s.confidence.toFixed(2)})` : ''
    console.log(`[${i}] ${s.kind.toUpperCase()} ${s.path} - ${s.message}${conf}`)
  })

  let selected: number[] = []
  if (applyAll) {
    selected = suggestions.map((s, i) => (s.fix ? i : -1)).filter(i => i >= 0)
  } else if (applySafeOnly) {
    selected = suggestions.map((s, i) => (s.fix && (s.kind === 'rename' || s.kind === 'add') && (s.confidence ?? 0) >= SAFE_THRESHOLD ? i : -1)).filter(i => i >= 0)
  } else {
    const rl = await import('node:readline/promises')
    const itf = rl.createInterface({ input: process.stdin, output: process.stdout })
    const ans = await itf.question('Enter indexes to apply (comma-separated), or press Enter to skip: ')
    itf.close()
    selected = ans.trim() ? ans.split(',').map(s=>Number(s.trim())).filter(n=>Number.isFinite(n)) : []
  }

  if (selected.length) {
    const { content: newContent } = applySuggestions(content, selected)
    writeFileSync(p, newContent, 'utf8')
    console.log(`Applied ${selected.length} suggestion(s) to`, p)
  } else {
    console.log('No changes applied')
  }
}
async function main() {
  const cmd = process.argv[2]
  if (cmd === 'validate') return doValidate()
  if (cmd === 'fix') return doFix()
  if (cmd === 'suggest') return doSuggestInteractive()
  if (cmd === 'validate:dir') {
    const dir = process.env.YAML_DIR || process.cwd()
    const { validateDirectory } = await import('./batch')
    const spectralRulesetPath = process.env.SPECTRAL_RULESET
    const res = await validateDirectory(dir, { spectralRulesetPath })
    console.log(JSON.stringify(res, null, 2))
    process.exit(res.ok ? 0 : 1)
  }
  console.error('Usage: tsx src/backend/yaml/cli.ts <validate|fix|suggest|validate:dir>')
  process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
