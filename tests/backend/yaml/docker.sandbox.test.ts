import { describe, it, expect } from 'vitest'
import { validateYaml } from '@/backend/yaml'

function capRunner() {
  const calls: string[] = []
  return {
    calls,
    run: async (cmd: string, args: string[]) => {
      calls.push([cmd, ...args].join(' '))
      // Simulate cfn-lint JSON error output to keep flow
      if (cmd === 'docker') return { code: 2, stdout: '[]', stderr: '' }
      return { code: 0, stdout: '', stderr: '' }
    },
  }
}

describe('Docker sandboxing', () => {
  it('uses read-only bind and no network for cfn-lint', async () => {
    const runner = capRunner()
    const content = 'AWSTemplateFormatVersion: "2010-09-09"\nResources: {}\n'
    await validateYaml(content, { filename: 'tests/backend/yaml/fixtures/complex-cdk.yaml', toolRunner: runner as any })
    const joined = runner.calls.join('\n')
    expect(joined).toMatch(/--network=none/)
    expect(joined).toMatch(/:ro(\s|$)/)
  })
})