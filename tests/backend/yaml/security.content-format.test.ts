import { describe, it, expect } from 'vitest'
import { validateYaml } from '@/backend/yaml'
import type { ToolRunner } from '@/backend/yaml'

const noopRunner: ToolRunner = { run: async () => ({ code: 0, stdout: '', stderr: '' }) }

describe('Content format guards', () => {
  it('rejects JSON content even with .yaml extension', async () => {
    const json = '{"a":1, "b":[2,3]}'
    const res = await validateYaml(json, { filename: 'file.yaml', mimeType: 'application/yaml', toolRunner: noopRunner })
    expect(res.ok).toBe(false)
    expect(res.messages.some(m => m.message.includes('JSON detected'))).toBe(true)
  })

  it('rejects likely-binary content', async () => {
    const binary = 'A' + String.fromCharCode(0) + 'B' + String.fromCharCode(3) + 'C'
    const res = await validateYaml(binary, { filename: 'file.yml', mimeType: 'text/yaml', toolRunner: noopRunner })
    expect(res.ok).toBe(false)
    expect(res.messages.some(m => m.message.includes('Binary') || m.message.includes('non-text'))).toBe(true)
  })

  it('accepts plain YAML', async () => {
    const yaml = 'foo: bar\nlist:\n  - 1\n  - 2\n'
    const res = await validateYaml(yaml, { filename: 'ok.yaml', mimeType: 'application/yaml', toolRunner: noopRunner })
    expect(res.ok).toBe(true)
  })
})
