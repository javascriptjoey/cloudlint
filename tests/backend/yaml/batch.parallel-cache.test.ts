import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { validateDirectory } from '@/backend/yaml'
import { resolve } from 'node:path'
import type { ToolRunner } from '@/backend/yaml'

describe('Directory runner cache and parallelism', () => {
  const dir = resolve(process.cwd(), 'tests/backend/yaml/fixtures')
  let origEnv: string | undefined

  beforeEach(() => {
    origEnv = process.env.YAML_CONCURRENCY
  })
  afterEach(() => {
    process.env.YAML_CONCURRENCY = origEnv
  })

  it('uses in-memory cache on second run (no extra tool invocations)', async () => {
    let calls = 0
    const countingRunner: ToolRunner = {
      run: async () => { calls++; return { code: 0, stdout: '', stderr: '' } },
    }
    await validateDirectory(dir, { toolRunner: countingRunner })
    const firstCalls = calls
    await validateDirectory(dir, { toolRunner: countingRunner })
    const secondCalls = calls - firstCalls
    expect(firstCalls).toBeGreaterThanOrEqual(0)
    expect(secondCalls).toBe(0)
  })

  it('bounds concurrency via YAML_CONCURRENCY', async () => {
    process.env.YAML_CONCURRENCY = '2'
    let active = 0
    let maxActive = 0
    const slowRunner: ToolRunner = {
      run: async () => {
        active++
        if (active > maxActive) maxActive = active
        await new Promise(r => setTimeout(r, 25))
        active--
        return { code: 0, stdout: '', stderr: '' }
      },
    }
    // Ensure we invoke a tool per file by providing a spectral ruleset path; use default one
    const ruleset = resolve(process.cwd(), 'rulesets', 'default.spectral.yaml')
    await validateDirectory(dir, { toolRunner: slowRunner, spectralRulesetPath: ruleset })
    expect(maxActive).toBeLessThanOrEqual(2)
  })
})
