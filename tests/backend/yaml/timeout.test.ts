import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { validateYaml } from '@/backend/yaml'

describe('Timeout handling', () => {
  const oldEnv = process.env.YAML_PARSE_SIMULATE_DELAY_MS
  const oldTO = process.env.YAML_PARSE_TIMEOUT_MS
  beforeEach(() => {
    process.env.YAML_PARSE_SIMULATE_DELAY_MS = '50'
    process.env.YAML_PARSE_TIMEOUT_MS = '10'
  })
  afterEach(() => {
    if (oldEnv === undefined) delete process.env.YAML_PARSE_SIMULATE_DELAY_MS
    else process.env.YAML_PARSE_SIMULATE_DELAY_MS = String(oldEnv)
    if (oldTO === undefined) delete process.env.YAML_PARSE_TIMEOUT_MS
    else process.env.YAML_PARSE_TIMEOUT_MS = String(oldTO)
  })

  it('times out parse when over limit', async () => {
    const res = await validateYaml('a: 1\n')
    expect(res.ok).toBe(false)
    expect(res.messages.some(m => /timeout/i.test(m.message) || /parse/i.test(m.source))).toBe(true)
  })
})