import { describe, it, expect } from 'vitest'
import { autoFixYaml } from '@/backend/yaml'

describe('YAML auto-fix', () => {
  it('formats YAML with prettier even if spectral is not available', async () => {
    const content = 'foo:      1\nbar:    2\n'
    const { content: fixed, fixesApplied } = await autoFixYaml(content, { spectralFix: false })
    expect(fixed).toContain('foo: 1')
    expect(fixed).toContain('bar: 2')
    expect(fixesApplied).toContain('prettier-yaml')
  })
})