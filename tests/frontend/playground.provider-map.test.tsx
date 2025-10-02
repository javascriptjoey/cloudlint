import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MockedFunction } from 'vitest'
import { api } from '@/lib/apiClient'
import userEvent from '@testing-library/user-event'
import Playground from '@/pages/Playground'

vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/apiClient')>('@/lib/apiClient')
  return {
    ...actual,
    api: {
      ...actual.api,
      suggest: vi.fn(async () => ({ provider: 'azure-cloud' as unknown as string, suggestions: [] })),
      validate: vi.fn(async () => ({ ok: true, messages: [] })),
    },
  }
})

describe('Playground provider mapping', () => {
  it('maps diverse azure strings to Azure badge', async () => {
    render(<Playground />)
    const badge = await screen.findByText(/Provider:/)
    // Trigger a validate so suggest gets called - button is "Validate Now" with real-time validation
    const validate = screen.getByRole('button', { name: /validate now/i })
    await userEvent.click(validate)
    await screen.findByText(/Provider:\s*Azure/i)
    expect(badge.textContent).toMatch(/Azure/i)
  })

  it('defaults to Generic for unknown provider strings', async () => {
    // Reset the suggest mock to return unknown provider
    ;(api.suggest as unknown as MockedFunction<typeof api.suggest>).mockResolvedValue({ provider: 'unknown-cloud', suggestions: [] })
    render(<Playground />)
    // Button is "Validate Now" with real-time validation
    const validate = screen.getByRole('button', { name: /validate now/i })
    await userEvent.click(validate)
    // Wait for the provider detection to complete and update the badge
    await screen.findByText(/Provider:\s*Generic/i)
  })
})
