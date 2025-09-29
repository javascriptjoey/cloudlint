import { describe, it, expect } from 'vitest'
import { validateYaml } from '@/backend/yaml'
import type { ToolRunner } from '@/backend/yaml'

const noopRunner: ToolRunner = { run: async () => ({ code: 0, stdout: '', stderr: '' }) }

describe('Security allowances', () => {
  it('downgrades JSON to warning when relaxSecurity=true', async () => {
    const json = '{"a":1}'
    const res = await validateYaml(json, { filename: 'x.yaml', relaxSecurity: true, toolRunner: noopRunner })
    expect(res.messages.some(m => m.message.includes('JSON detected') && m.severity === 'warning')).toBe(true)
  })

  it('allows anchors when allowAnchors=true', async () => {
    const yaml = '&a val\nref: *a\n'
    const res = await validateYaml(yaml, { filename: 'x.yaml', allowAnchors: true, allowAliases: true, toolRunner: noopRunner })
    expect(res.messages.some(m => m.message.includes('anchors or aliases'))).toBe(false)
  })

  it('allows allowedTags whitelist', async () => {
    const yaml = '!Ref something\n'
    const res = await validateYaml(yaml, { filename: 'x.yaml', allowedTags: ['!Ref'], toolRunner: noopRunner })
    expect(res.messages.some(m => m.message.includes('Custom YAML tag'))).toBe(false)
  })
})
