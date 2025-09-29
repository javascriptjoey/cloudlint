import { readFileSync, statSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { validateYaml } from './validate'
import type { ValidateOptions, LintMessage } from './types'

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const s = statSync(full)
    if (s.isDirectory()) walk(full, files)
    else if (/\.(ya?ml)$/i.test(entry)) files.push(full)
  }
  return files
}

// Simple in-memory cache scoped to process lifetime
const dirCache = new Map<string, { ok: boolean; messages: LintMessage[] }>()

function hashKey(content: string, opts: Omit<ValidateOptions, 'filename'>): string {
  const basis = {
    spectralRulesetPath: opts.spectralRulesetPath || process.env.SPECTRAL_RULESET || '',
    assumeCloudFormation: !!opts.assumeCloudFormation,
    assumeAzurePipelines: !!opts.assumeAzurePipelines,
    CFN_SPEC_PATH: process.env.CFN_SPEC_PATH || '',
    AZURE_PIPELINES_SCHEMA_PATH: process.env.AZURE_PIPELINES_SCHEMA_PATH || '',
    DISABLE_CFN_LINT: process.env.DISABLE_CFN_LINT || '',
  }
  const h = createHash('sha256')
  h.update(content)
  h.update(JSON.stringify(basis))
  return h.digest('hex')
}

async function withConcurrency<T>(items: string[], limit: number, worker: (file: string) => Promise<T>): Promise<T[]> {
  const results: T[] = []
  let idx = 0
  let active = 0

  return await new Promise<T[]>((resolveAll, rejectAll) => {
    const next = () => {
      if (idx >= items.length && active === 0) return resolveAll(results)
      while (active < limit && idx < items.length) {
        const i = idx++
        active++
        worker(items[i])
          .then((res) => { results[i] = res })
          .catch(rejectAll)
          .finally(() => { active--; next() })
      }
    }
    next()
  })
}

export async function validateDirectory(dir: string, opts: Omit<ValidateOptions, 'filename'> = {}) {
  const abs = resolve(dir)
  const files = walk(abs)
  const results = [] as Array<{ file: string; ok: boolean; messages: LintMessage[] }>

  const concurrency = Math.max(1, Number(process.env.YAML_CONCURRENCY || '4') || 4)

  const worker = async (f: string) => {
    const content = readFileSync(f, 'utf8')
    const key = hashKey(content, opts)
    const cached = dirCache.get(key)
    if (cached) {
      return { file: f, ok: cached.ok, messages: cached.messages }
    }
    const res = await validateYaml(content, { ...opts, filename: f })
    const value = { ok: res.ok, messages: res.messages }
    dirCache.set(key, value)
    return { file: f, ...value }
  }

  const out = await withConcurrency(files, concurrency, worker)
  results.push(...out)

  const ok = results.every(r => r.ok)
  return { ok, results }
}
