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
      suggest: vi.fn(async () => ({ provider: 'generic', suggestions: [] })),
    },
  }
})

describe('Playground cancellation edge cases', () => {
  it('cancel after resolve does not crash and hides cancel button', async () => {
    render(<Playground />)
    
    // Wait for initial real-time validation to complete
    await screen.findByText('Provider: Generic')
    
    // With real-time validation enabled, the button text is "Validate Now"
    const validate = screen.getByRole('button', { name: /validate now/i })
    await userEvent.click(validate)
    
    // Try to cancel immediately
    const cancel = await screen.findByRole('button', { name: /cancel/i })
    await userEvent.click(cancel)
    
    // Cancel should become invisible; no crash means the test finishes
    // Wait back to idle state with proper button text
    await screen.findByRole('button', { name: /validate now/i })
    
    const cancelAfter = screen.getByRole('button', { name: /cancel/i })
    expect(cancelAfter).toHaveClass('invisible')
    
    // Wait a bit to ensure any pending async operations complete
    await new Promise(resolve => setTimeout(resolve, 200))
  })
})
