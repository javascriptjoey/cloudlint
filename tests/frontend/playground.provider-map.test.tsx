import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Playground from '@/pages/Playground'

vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/apiClient')>('@/lib/apiClient')
  return {
    ...actual,
    api: {
      ...actual.api,
      suggest: vi.fn(async (_yaml: string) => ({ provider: 'azure-cloud' as unknown as string, suggestions: [] })),
      validate: vi.fn(async () => ({ ok: true, messages: [] })),
    },
  }
})

describe('Playground provider mapping', () => {
  it('maps diverse azure strings to Azure badge', async () => {
    render(<Playground />)
    const badge = await screen.findByText(/Provider:/)
    // Trigger a validate so suggest gets called
    const validate = screen.getByRole('button', { name: /validate/i })
    await userEvent.click(validate)
    await screen.findByText(/Provider:\s*Azure/i)
    expect(badge.textContent).toMatch(/Azure/i)
  })

  it('defaults to Generic for unknown provider strings', async () => {
    const { api } = await import('@/lib/apiClient')
    ;(api.suggest as unknown as vi.Mock).mockResolvedValueOnce({ provider: 'unknown-cloud' })
    render(<Playground />)
    const validate = screen.getByRole('button', { name: /validate/i })
    await userEvent.click(validate)
    await screen.findByText(/Provider:\s*Generic/i)
  })
})
