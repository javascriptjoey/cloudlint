import { describe, it, expect } from 'vitest'
import { validateYaml } from '@/backend/yaml'

describe('MIME/extension checks', () => {
  it('accepts .yaml/.yml with valid MIME types', async () => {
    const content = 'a: 1\n'
    const ok1 = await validateYaml(content, { filename: 'file.yaml', mimeType: 'application/yaml' })
    expect(ok1.ok).toBe(true)
    const ok2 = await validateYaml(content, { filename: 'file.yml', mimeType: 'text/yaml' })
    expect(ok2.ok).toBe(true)
  })
  it('rejects invalid extension or MIME', async () => {
    const content = 'a: 1\n'
    const badExt = await validateYaml(content, { filename: 'file.txt', mimeType: 'application/yaml' })
    expect(badExt.ok).toBe(false)
    const badMime = await validateYaml(content, { filename: 'file.yaml', mimeType: 'application/json' })
    expect(badMime.ok).toBe(false)
  })
})