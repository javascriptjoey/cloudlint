import { describe, it, expect } from 'vitest'
import { analyze, applySuggestions } from '@/backend/yaml/cfnSuggest'

const base = `AWSTemplateFormatVersion: '2010-09-09'\nResources:\n  B:\n    Type: AWS::S3::Bucket\n    Properties:\n      BucketnName: my-bucket\n`

describe('CFN suggestions', () => {
  it('suggests rename for property typos and can apply', () => {
    const doc = require('yaml').parse(base)
    const { suggestions } = analyze(doc)
    const renameIdxs = suggestions.map((s: any, i: number) => s.kind === 'rename' ? i : -1).filter((i: number) => i >= 0)
    expect(renameIdxs.length).toBeGreaterThan(0)
    const { content } = applySuggestions(base, renameIdxs)
    expect(content).toContain('BucketName:')
  })
})