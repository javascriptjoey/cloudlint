#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { autoFixYaml, validateYaml } from './src/backend/yaml/index.js'

export async function runValidate() {
  const file = process.env.YAML_FILE || 'README.md' // placeholder; pass YAML_FILE=path
  const p = resolve(process.cwd(), file)
  const content = readFileSync(p, 'utf8')
  const res = await validateYaml(content, { filename: p })
  console.log(JSON.stringify(res, null, 2))
  process.exit(res.ok ? 0 : 1)
}

export async function runFix() {
  const file = process.env.YAML_FILE
  if (!file) {
    console.error('Set YAML_FILE to the YAML file you want to fix')
    process.exit(2)
  }
  const p = resolve(process.cwd(), file)
  const content = readFileSync(p, 'utf8')
  const { content: fixed } = await autoFixYaml(content, { spectralFix: true })
  writeFileSync(p, fixed, 'utf8')
  console.log(`Fixed ${file}`)
}
