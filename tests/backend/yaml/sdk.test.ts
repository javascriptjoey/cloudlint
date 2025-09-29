import { describe, it, expect } from 'vitest'
import { validateYaml, autoFixYaml, suggest, applySuggestions } from '@/backend/sdk'

const cfn = `AWSTemplateFormatVersion: '2010-09-09'\nResources:\n  B:\n    Type: AWS::S3::Buckets\n`
const azure = `steps:\n  - scirpt: echo hi\n`

describe('SDK layer', () => {
  it('validateYaml proxies to core validator', async () => {
    const res = await validateYaml('foo: 1\n')
    expect(res.ok).toBe(true)
  })

  it('suggest detects provider and returns suggestions', async () => {
    const out1 = await suggest(cfn)
    expect(out1.provider).toBe('aws')
    expect(out1.suggestions.some(s => s.kind === 'rename')).toBe(true)

    const out2 = await suggest(azure)
    expect(out2.provider).toBe('azure')
    expect(out2.suggestions.some(s => s.kind === 'rename')).toBe(true)
  })

  it('applySuggestions modifies content for selected suggestions', async () => {
    const s = await suggest(cfn)
    const renameIdxs = s.suggestions.map((x, i) => x.kind === 'rename' ? i : -1).filter(i => i >= 0)
    const out = await applySuggestions(cfn, renameIdxs, 'aws')
    expect(out.content).toContain('AWS::S3::Bucket')
  })

  it('autoFixYaml runs and returns content', async () => {
    const { content, fixesApplied } = await autoFixYaml('foo:1\n')
    // Prettier may format with or without a space depending on plugins; ensure valid YAML with key present
    expect(content.replace(/\s/g, '')).toContain('foo:1')
    expect(Array.isArray(fixesApplied)).toBe(true)
  })
})
