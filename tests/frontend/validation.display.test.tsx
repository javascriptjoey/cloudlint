import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Playground from '@/pages/Playground'

vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/apiClient')>('@/lib/apiClient')
  return {
    ...actual,
    api: {
      ...actual.api,
      validate: vi.fn(),
      suggest: vi.fn(async () => ({ provider: 'generic' })),
      diffPreview: vi.fn(async ()=>({ diff: '@@', before: 'a', after: 'b' })),
    },
  }
})

describe('Playground validation display logic', () => {
  it('shows issues when ok=true but messages contain errors/warnings', async () => {
    const { api } = await import('@/lib/apiClient')
    ;(api.validate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, messages: [ { message: 'bad', severity: 'error' } ] })
    
    await act(async () => {
      render(<Playground />)
    })
    
    // With real-time validation enabled, the button text is "Validate Now"
    const btn = screen.getByRole('button', { name: 'Validate Now' })
    await act(async () => {
      await userEvent.click(btn)
    })
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    
    expect(screen.getByText(/Found 1 issue/)).toBeInTheDocument()
    expect(screen.queryByText(/No errors found/)).toBeNull()
  })

  it('shows success when ok=true and messages are empty', async () => {
    const { api } = await import('@/lib/apiClient')
    ;(api.validate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, messages: [] })
    
    await act(async () => {
      render(<Playground />)
    })
    
    // With real-time validation enabled, the button text is "Validate Now"
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Validate Now' }))
    })
    
    await waitFor(() => {
      expect(screen.getByText(/No errors found/)).toBeInTheDocument()
    })
  })

  it('does not shift layout when toggling validating state', async () => {
    const { api } = await import('@/lib/apiClient')
    ;(api.validate as unknown as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 50))
      return { ok: true, messages: [] }
    })
    
    await act(async () => {
      render(<Playground />)
    })
    
    const row = screen.getByRole('button', { name: 'Upload YAML' }).closest('div') as HTMLElement
    const beforeWidth = row.getBoundingClientRect().width
    
    // With real-time validation enabled, the button text is "Validate Now"
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Validate Now' }))
    })
    
    await waitFor(() => expect(screen.getByText(/No errors found/)).toBeInTheDocument())
    const afterWidth = row.getBoundingClientRect().width
    expect(Math.abs(afterWidth - beforeWidth)).toBeLessThan(2)
  })
})
