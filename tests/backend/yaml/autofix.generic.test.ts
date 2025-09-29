import { describe, it, expect } from 'vitest'
import { autoFixYaml } from '@/backend/sdk'

describe('Generic auto-fix enhancements', () => {
  it('fixes tabs, normalizes EOLs, ensures trailing newline', async () => {
    const { content, fixesApplied } = await autoFixYaml('foo:\t1\r\n')
    expect(content.endsWith('\n')).toBe(true)
    expect(content).not.toContain('\t')
    expect(fixesApplied).toContain('normalize-eol')
    expect(fixesApplied).toContain('tabs-to-spaces')
  })

  it('removes anchors/aliases via round-trip and de-duplicates keys (last wins)', async () => {
    const input = 'a: 1\na: 2\nref: &id001\n  x: 1\nuse: *id001\n'
    const { content, fixesApplied } = await autoFixYaml(input)
    expect(content).toContain('a: 2')
    expect(content).not.toContain('&id001')
    expect(content).not.toContain('*id001')
    expect(fixesApplied).toContain('remove-anchors-aliases')
    expect(fixesApplied).toContain('dedupe-keys-last-wins')
  })
})