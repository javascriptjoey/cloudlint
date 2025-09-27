import { describe, it, expect } from 'vitest'
import { yamlToJson, jsonToYaml } from '@/backend/yaml'

describe('YAML <-> JSON conversion', () => {
  it('converts YAML to JSON and back', () => {
    const y = 'foo: bar\nnums:\n  - 1\n  - 2\n'
    const j = yamlToJson(y)
    const y2 = jsonToYaml(j)
    expect(j).toContain('"foo": "bar"')
    expect(y2).toContain('foo: bar')
    expect(y2).toContain('nums:')
  })
})