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

async function main() {
  const cmd = process.argv[2]
  if (cmd === 'validate') return doValidate()
  if (cmd === 'fix') return doFix()
  if (cmd === 'validate:dir') {
    const dir = process.env.YAML_DIR || process.cwd()
    const { validateDirectory } = await import('./batch')
    const spectralRulesetPath = process.env.SPECTRAL_RULESET
    const res = await validateDirectory(dir, { spectralRulesetPath })
    console.log(JSON.stringify(res, null, 2))
    process.exit(res.ok ? 0 : 1)
  }
  console.error('Usage: tsx src/backend/yaml/cli.ts <validate|fix|validate:dir>')
  process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})