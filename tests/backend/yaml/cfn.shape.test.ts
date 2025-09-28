import { describe, it, expect } from 'vitest'
import { analyze, applySuggestions } from '@/backend/yaml/cfnSuggest'
import YAML from 'yaml'

const typeTypo = `AWSTemplateFormatVersion: '2010-09-09'\nResources:\n  B:\n    Type: AWS::S3::Buckets\n    Properties:\n      BucketName: my-bucket\n`

const listType = `AWSTemplateFormatVersion: '2010-09-09'\nResources:\n  B:\n    Type: AWS::S3::Bucket\n    Properties:\n      Tags: not-a-list\n`

describe('CFN structure checks', () => {
  it('suggests rename for resource Type typos', () => {
    const doc = YAML.parse(typeTypo)
    const { suggestions } = analyze(doc)
    const renameIdx = suggestions.findIndex(s => s.kind === 'rename' && String(s.path).endsWith('.Type'))
    expect(renameIdx).toBeGreaterThanOrEqual(0)
    const { content } = applySuggestions(typeTypo, [renameIdx])
    expect(content).toContain('Type: AWS::S3::Bucket')
  })

  it('suggests list/map type hints (Tags should be List)', () => {
    const doc = YAML.parse(listType)
    const { suggestions } = analyze(doc)
    const hasListTypeHint = suggestions.some(s => s.kind === 'type' && String(s.message).includes('List'))
    expect(hasListTypeHint).toBe(true)
  })
})
