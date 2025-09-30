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
      validate: vi.fn(async () => {
        await new Promise(r => setTimeout(r, 150))
        return { ok: true, messages: [] }
      }),
    },
  }
})

describe('Playground cancellation edge cases', () => {
  it('cancel after resolve does not crash and hides cancel button', async () => {
    render(<Playground />)
    const validate = screen.getByRole('button', { name: /validate/i })
    await userEvent.click(validate)
    // Try to cancel immediately
    const cancel = await screen.findByRole('button', { name: /cancel/i })
    await userEvent.click(cancel)
    // Cancel should go away; no crash means the test finishes
    await screen.findByRole('button', { name: /validate/i }) // wait back to idle state
    expect(screen.queryByRole('button', { name: /cancel/i })).toBeNull()
  })
})
