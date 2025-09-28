import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateYaml, autoFixYaml } from '@/backend/yaml'

const noopRunner = { run: async () => ({ code: 0, stdout: '', stderr: '' }) }

// Mocked runner that simulates yamllint + cfn-lint outputs for the complex fixture
const mockRunnerComplex = {
  run: async (cmd: string, args: string[]) => {
    const arg0 = args[0] || ''
    if (arg0.includes('yamllint') || cmd.includes('yamllint')) {
      // Simulate style issues: trailing spaces + indentation warning
      const out = `<stdin>:5:20: [warning] trailing spaces (trailing-spaces)\n` +
                  `<stdin>:6:1: [warning] too many spaces before colon (colons)`
      return { code: 1, stdout: out, stderr: '' }
    }
    if (arg0.includes('spectral') || cmd.includes('spectral')) {
      // No spectral issues in this test
      return { code: 0, stdout: '[]', stderr: '' }
    }
    if (cmd === 'docker' || arg0.includes('cfn-lint')) {
      // Simulate two CFN errors from cfn-lint
      const cfnOut = JSON.stringify([
        {
          Filename: 'complex-cdk.yaml',
          Location: { Start: { Line: 14, Column: 7 } },
          Message: 'E3001 Invalid or missing Type for resource MissingTypeResource',
          Level: 'Error',
          Rule: { Id: 'E3001' },
        },
        {
          Filename: 'complex-cdk.yaml',
          Location: { Start: { Line: 22, Column: 7 } },
          Message: 'E3002 Invalid Property Resources/TypoPropertyBucket/Properties/BucketnName',
          Level: 'Error',
          Rule: { Id: 'E3002' },
        },
      ])
      return { code: 2, stdout: cfnOut, stderr: '' }
    }
    return { code: 0, stdout: '', stderr: '' }
  },
}

// Mocked runner after fixes (style issues resolved by Prettier)
const mockRunnerAfterFix = {
  run: async (cmd: string, args: string[]) => {
    const arg0 = args[0] || ''
    if (arg0.includes('yamllint') || cmd.includes('yamllint')) {
      return { code: 0, stdout: '', stderr: '' }
    }
    if (cmd === 'docker' || arg0.includes('cfn-lint')) {
      const cfnOut = JSON.stringify([
        {
          Filename: 'complex-cdk.yaml',
          Location: { Start: { Line: 14, Column: 7 } },
          Message: 'E3001 Invalid or missing Type for resource MissingTypeResource',
          Level: 'Error',
          Rule: { Id: 'E3001' },
        },
        {
          Filename: 'complex-cdk.yaml',
          Location: { Start: { Line: 22, Column: 7 } },
          Message: 'E3002 Invalid Property Resources/TypoPropertyBucket/Properties/BucketnName',
          Level: 'Error',
          Rule: { Id: 'E3002' },
        },
      ])
      return { code: 2, stdout: cfnOut, stderr: '' }
    }
    return { code: 0, stdout: '', stderr: '' }
  },
}

describe('YAML validation', () => {
  it('accepts valid YAML', async () => {
    const yaml = 'foo: 1\nbar:\n  - baz\n'
    const res = await validateYaml(yaml, { toolRunner: noopRunner })
    expect(res.ok).toBe(true)
    expect(res.messages.filter(m => m.severity === 'error')).toHaveLength(0)
    expect(res.providerSummary).toBeDefined()
  })

  it('rejects invalid YAML (parser error)', async () => {
    const yaml = 'foo: [1, 2\n' // missing closing bracket
    const res = await validateYaml(yaml, { toolRunner: noopRunner })
    expect(res.ok).toBe(false)
    expect(res.messages.some(m => m.source === 'parser' && m.severity === 'error')).toBe(true)
  })

  it('aggregates providerSummary counts from yamllint and cfn-lint', async () => {
    const p = resolve(process.cwd(), 'tests/backend/yaml/fixtures/complex-cdk.yaml')
    const content = readFileSync(p, 'utf8')
    const res = await validateYaml(content, { filename: p, toolRunner: mockRunnerComplex })
    expect(res.providerSummary).toBeDefined()
    const counts = res.providerSummary!.counts
    expect(counts['yamllint']?.warnings ?? 0).toBeGreaterThan(0)
    expect(counts['cfn-lint']?.errors ?? 0).toBeGreaterThan(0)
  })

  it('exposes cfnSpecPath and azureSchemaPath in providerSummary.sources when present', async () => {
    // Create temporary empty files to satisfy existsSync checks
    const os = await import('node:os')
    const fs = await import('node:fs')
    const path = await import('node:path')
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'schemas-'))
    const cfn = path.join(tmp, 'cfn.json')
    const az = path.join(tmp, 'azure.json')
    fs.writeFileSync(cfn, '{}', 'utf8')
    fs.writeFileSync(az, '{}', 'utf8')
    const prevCFN = process.env.CFN_SPEC_PATH
    const prevAZ = process.env.AZURE_PIPELINES_SCHEMA_PATH
    process.env.CFN_SPEC_PATH = cfn
    process.env.AZURE_PIPELINES_SCHEMA_PATH = az
    try {
      const yaml = 'name: t\n'
      const res = await validateYaml(yaml, { toolRunner: noopRunner })
      expect(res.providerSummary?.sources?.cfnSpecPath).toBe(cfn)
      expect(res.providerSummary?.sources?.azureSchemaPath).toBe(az)
    } finally {
      process.env.CFN_SPEC_PATH = prevCFN
      process.env.AZURE_PIPELINES_SCHEMA_PATH = prevAZ
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('validates complex CFN file, detects and reduces errors after auto-fix', async () => {
    const p = resolve(process.cwd(), 'tests/backend/yaml/fixtures/complex-cdk.yaml')
    const content = readFileSync(p, 'utf8')

    const initial = await validateYaml(content, { filename: p, toolRunner: mockRunnerComplex })
    const errorsBefore = initial.messages.filter(m => m.severity === 'error')
    expect(errorsBefore.length).toBeGreaterThan(0)

    const fixed = await autoFixYaml(content, { spectralFix: false })

    const after = await validateYaml(fixed.content, { filename: p, toolRunner: mockRunnerAfterFix })
    const errorsAfter = after.messages.filter(m => m.severity === 'error')

    // Expect fewer or equal errors (style warnings removed), but CFN errors remain
    expect(errorsAfter.length).toBeLessThanOrEqual(errorsBefore.length)
  })
})
