import { describe, it, expect } from 'vitest'
import { validateDirectory } from '@/backend/yaml'
import { resolve } from 'node:path'

// Use noop runner by not passing toolRunner; parser check is enough

describe('Batch validation', () => {
  it('validates all yaml files in fixtures directory', async () => {
    const dir = resolve(process.cwd(), 'tests/backend/yaml/fixtures')
    const res = await validateDirectory(dir, {})
    expect(res).toHaveProperty('results')
    expect(Array.isArray(res.results)).toBe(true)
    expect(res.results.length).toBeGreaterThan(0)
  })
})