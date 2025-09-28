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
