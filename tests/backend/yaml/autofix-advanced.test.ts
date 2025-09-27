import { describe, it, expect } from 'vitest'
import { autoFixYaml } from '@/backend/yaml'

const cfnWithTypos = `Resources:\n  B:\n    Type: AWS::S3::Bucket\n    Properties:\n      BucketnName: bad\n`

describe('Advanced auto-fix', () => {
  it('adds document start and fixes common CFN typos', async () => {
    const { content, fixesApplied } = await autoFixYaml(cfnWithTypos)
    expect(content.startsWith('---'))
    expect(content).toContain('BucketName:')
    expect(fixesApplied).toContain('add-document-start')
    expect(fixesApplied).toContain('cfn-typo-fix')
  })
})