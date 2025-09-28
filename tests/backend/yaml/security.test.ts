import { describe, it, expect } from 'vitest'
import { validateYaml } from '@/backend/yaml'

describe('Security guards', () => {
  it('rejects files exceeding size or line limits', async () => {
    const big = 'a'.repeat(2_097_153)
    const res1 = await validateYaml(big)
    expect(res1.ok).toBe(false)

    const manyLines = new Array(15001).fill('x: 1').join('\n')
    const res2 = await validateYaml(manyLines)
    expect(res2.ok).toBe(false)
  })

  it('rejects anchors, aliases, and custom tags', async () => {
    const withAnchor = '&a 1\n* a\n'
    const resA = await validateYaml(withAnchor)
    expect(resA.ok).toBe(false)

const withTag = '!!js/function "() => 1"\n'
    const resT = await validateYaml(withTag)
    expect(resT.ok).toBe(false)
  })
})