import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Playground from '@/pages/Playground'

vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/apiClient')>('@/lib/apiClient')
  return {
    ...actual,
    api: {
      ...actual.api,
      validate: vi.fn(async () => ({ ok: true, messages: [], fixed: 'steps:\n  - script: echo hi\n' })),
      diffPreview: vi.fn(async () => { throw new Error('diff failure') }),
    },
  }
})

describe('Playground diff preview fallback', () => {
  it('falls back to fixed result when diff endpoint fails', async () => {
    render(<Playground />)
    const box = screen.getByRole('textbox', { name: 'YAML input' })
    await userEvent.clear(box)
    await userEvent.type(box, 'steps:\n  - scirpt: echo hi\n')
    const validate = screen.getByRole('button', { name: /validate/i })
    await userEvent.click(validate)

    // Diff preview should not be visible since diffPreview failed
    expect(screen.queryByRole('heading', { name: /preview changes/i })).toBeNull()

    // But Apply Fix button should be shown (result.fixed exists)
    expect(await screen.findByRole('button', { name: /apply fix/i })).toBeVisible()
  })
})
