import { describe, it, expect } from 'vitest'
import { validateDirectory } from '@/backend/yaml'
import { resolve } from 'node:path'

import type { ToolRunner } from '@/backend/yaml'

// Use a fast mock runner to avoid invoking external tools (yamllint/docker) in CI
const fastRunner: ToolRunner = {
  run: async () => ({ code: 0, stdout: '', stderr: '' }),
}

describe('Batch validation', () => {
  it('validates all yaml files in fixtures directory', async () => {
    const dir = resolve(process.cwd(), 'tests/backend/yaml/fixtures')
    const res = await validateDirectory(dir, { toolRunner: fastRunner })
    expect(res).toHaveProperty('results')
    expect(Array.isArray(res.results)).toBe(true)
    expect(res.results.length).toBeGreaterThan(0)
  })
})
