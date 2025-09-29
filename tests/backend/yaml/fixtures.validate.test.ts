import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateYaml } from '@/backend/yaml'
import type { ToolRunner } from '@/backend/yaml'

const noopRunner: ToolRunner = { run: async () => ({ code: 0, stdout: '', stderr: '' }) }

function loadFix(name: string) {
  const p = resolve(process.cwd(), 'tests/backend/yaml/fixtures', name)
  return readFileSync(p, 'utf8')
}

describe('More fixtures: CFN and Azure', () => {
  it('validates CFN S3 template (provider aws)', async () => {
    const content = loadFix('cfn-s3.yaml')
    const res = await validateYaml(content, { filename: 'cfn-s3.yaml', provider: 'aws', toolRunner: noopRunner })
    expect(res.providerSummary?.provider).toBe('aws')
    expect(res.ok).toBe(true)
  })

  it('validates CFN SNS template (provider aws)', async () => {
    const content = loadFix('cfn-sns.yaml')
    const res = await validateYaml(content, { filename: 'cfn-sns.yaml', provider: 'aws', toolRunner: noopRunner })
    expect(res.providerSummary?.provider).toBe('aws')
    expect(res.ok).toBe(true)
  })

  it('validates CFN Lambda+IAM template (provider aws)', async () => {
    const content = loadFix('cfn-lambda-iam.yaml')
    const res = await validateYaml(content, { filename: 'cfn-lambda-iam.yaml', provider: 'aws', toolRunner: noopRunner })
    expect(res.providerSummary?.provider).toBe('aws')
    expect(res.ok).toBe(true)
  })

  it('validates CFN EC2 template (provider aws)', async () => {
    const content = loadFix('cfn-ec2.yaml')
    const res = await validateYaml(content, { filename: 'cfn-ec2.yaml', provider: 'aws', toolRunner: noopRunner })
    expect(res.ok).toBe(true)
    if (res.providerSummary) expect(res.providerSummary.provider).toBe('aws')
  })

  it('validates Azure multi-stage pipeline (provider azure)', async () => {
    const content = loadFix('azure-multistage.yaml')
    const res = await validateYaml(content, { provider: 'azure', toolRunner: noopRunner })
    expect(res.ok).toBe(true)
    if (res.providerSummary) expect(res.providerSummary.provider).toBe('azure')
  })
})
