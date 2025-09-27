import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateYaml } from '@/backend/yaml'

function makeCapturingRunner() {
  const calls: string[] = []
  return {
    calls,
    run: async (cmd: string, args: string[]) => {
      calls.push([cmd, ...args].join(' '))
      // Simulate success with no issues
      if (cmd === 'docker' && args.includes('cfn-lint')) {
        // Return JSON array empty
        return { code: 0, stdout: '[]', stderr: '' }
      }
      if (cmd.includes('yamllint') || args.includes('yamllint')) {
        return { code: 0, stdout: '', stderr: '' }
      }
      if (cmd.includes('spectral') || args.includes('spectral')) {
        return { code: 0, stdout: '[]', stderr: '' }
      }
      return { code: 0, stdout: '', stderr: '' }
    },
  }
}

describe('Tool invocation behavior', () => {
  it('invokes cfn-lint via docker for CFN-like file', async () => {
    const p = resolve(process.cwd(), 'tests/backend/yaml/fixtures/complex-cdk.yaml')
    const content = readFileSync(p, 'utf8')
    const runner = makeCapturingRunner()
    await validateYaml(content, { filename: p, toolRunner: runner as any })
    expect(runner.calls.some(c => c.includes('docker') && c.includes('cfn-lint'))).toBe(true)
  })

  it('invokes yamllint for general YAML and spectral when ruleset provided', async () => {
    const content = 'name: example\nversion: 1.0.0\nlist:\n  - a\n  - b\n'
    const runner = makeCapturingRunner()
    await validateYaml(content, { toolRunner: runner as any, spectralRulesetPath: 'tests/.spectral.yaml' })
    const tokens = runner.calls.flatMap(c => c.split(/\s+/))
    expect(tokens.includes('yamllint')).toBe(true)
    expect(runner.calls.some(c => c.includes('spectral') && c.includes('lint'))).toBe(true)
  })
})