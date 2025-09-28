import { describe, it, expect } from 'vitest'
import { validateYaml } from '@/backend/yaml'

const azureBad = `name: test
steps:
  - scirpt: echo hi
  - task: 123
`

describe('Azure validation integration', () => {
  it('includes azure-schema messages for Azure files', async () => {
    const res = await validateYaml(azureBad, { assumeAzurePipelines: true, toolRunner: { run: async () => ({ code: 0, stdout: '', stderr: '' }) } })
    // Should not be ok due to type/unknown issues promoted as warnings; ok=true if no errors
    expect(res.messages.some(m => m.source === 'azure-schema')).toBe(true)
  })
})
