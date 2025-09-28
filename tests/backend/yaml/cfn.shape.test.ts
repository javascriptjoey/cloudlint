import { describe, it, expect } from 'vitest'
import { analyze, applySuggestions } from '@/backend/yaml/cfnSuggest'
import YAML from 'yaml'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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

  it('suggests list type hint when value is not an array', () => {
    const doc = YAML.parse(listType)
    const { suggestions } = analyze(doc)
    const hasListTypeHint = suggestions.some(s => s.kind === 'type' && String(s.message).includes('List'))
    expect(hasListTypeHint).toBe(true)
  })

  it('does not suggest list hint when value is a proper array', () => {
    const good = `AWSTemplateFormatVersion: '2010-09-09'\nResources:\n  B:\n    Type: AWS::S3::Bucket\n    Properties:\n      Tags: []\n`
    const { suggestions } = analyze(YAML.parse(good))
    const hasListTypeHint = suggestions.some(s => s.kind === 'type' && String(s.message).includes('List'))
    expect(hasListTypeHint).toBe(false)
  })

  it('suggests map type hint using custom spec (PropsMap should be Map)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cfn-spec-'))
    const specPath = join(dir, 'spec.json')
    const customSpec = {
      ResourceTypes: {
        'AWS::Test::Thing': {
          Properties: {
            PropsMap: { Type: 'Map' }
          }
        }
      }
    }
    writeFileSync(specPath, JSON.stringify(customSpec), 'utf8')
    const prev = process.env.CFN_SPEC_PATH
    process.env.CFN_SPEC_PATH = specPath
    try {
      const badMap = `Resources:\n  T:\n    Type: AWS::Test::Thing\n    Properties:\n      PropsMap: 'not-a-map'\n`
      const { suggestions } = analyze(YAML.parse(badMap))
      const hasMapHint = suggestions.some(s => s.kind === 'type' && String(s.message).includes('Map (object)'))
      expect(hasMapHint).toBe(true)
    } finally {
      process.env.CFN_SPEC_PATH = prev
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
