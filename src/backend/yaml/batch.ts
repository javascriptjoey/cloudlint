import { readFileSync, statSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { validateYaml } from './validate'
import type { ValidateOptions } from './types'

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const s = statSync(full)
    if (s.isDirectory()) walk(full, files)
    else if (/\.(ya?ml)$/i.test(entry)) files.push(full)
  }
  return files
}

export async function validateDirectory(dir: string, opts: Omit<ValidateOptions, 'filename'> = {}) {
  const abs = resolve(dir)
  const files = walk(abs)
  const results = [] as Array<{ file: string; ok: boolean; messages: any[] }>
  for (const f of files) {
    const content = readFileSync(f, 'utf8')
    const res = await validateYaml(content, { ...opts, filename: f })
    results.push({ file: f, ok: res.ok, messages: res.messages })
  }
  const ok = results.every(r => r.ok)
  return { ok, results }
}