import { describe, it, expect } from 'vitest'
import { validateYaml } from '@/backend/yaml'

const azureBad = `name: test\nsteps:\n  - scirpt: echo hi\n`

describe('Validate provider flag', () => {
  it('forces azure analyzer when provider=azure', async () => {
    const res = await validateYaml(azureBad, { provider: 'azure', toolRunner: { run: async () => ({ code: 0, stdout: '', stderr: '' }) } })
    expect(res.messages.some(m => m.source === 'azure-schema')).toBe(true)
    expect(res.providerSummary?.provider).toBe('azure')
  })

  it('suppresses azure analyzer when provider=generic', async () => {
    const res = await validateYaml(azureBad, { provider: 'generic', toolRunner: { run: async () => ({ code: 0, stdout: '', stderr: '' }) } })
    expect(res.messages.some(m => m.source === 'azure-schema')).toBe(false)
    expect(res.providerSummary?.provider).toBe('generic')
  })
})
