import { describe, it, expect } from 'vitest'
import { validateYaml } from '@/backend/yaml'
import { resolve } from 'node:path'

describe('Spectral policy packs', () => {
  it('flags typo with default ruleset (spectral)', async () => {
    const ruleset = resolve(process.cwd(), 'rulesets', 'default.spectral.yaml')
    const yaml = `scirpt: echo hi\n`
    const mockRunner = {
      run: async (cmd: string, args: string[]) => {
        const joined = [cmd, ...args].join(' ')
        if (joined.includes('spectral')) {
          const out = JSON.stringify([
            {
              code: 'no-scirpt-typo',
              message: "Unknown key 'scirpt' (did you mean 'script'?)",
              path: ['scirpt'],
              severity: 1
            }
          ])
          return { code: 0, stdout: out, stderr: '' }
        }
        return { code: 0, stdout: '', stderr: '' }
      }
    }
    const res = await validateYaml(yaml, { spectralRulesetPath: ruleset, toolRunner: mockRunner })
    const hasSpectral = res.messages.some(m => m.source === 'spectral')
    expect(hasSpectral).toBe(true)
    const hasRule = res.messages.some(m => m.source === 'spectral' && String(m.ruleId).includes('no-scirpt-typo'))
    expect(hasRule).toBe(true)
  })
})
