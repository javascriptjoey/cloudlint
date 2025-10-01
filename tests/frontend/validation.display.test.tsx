import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Playground from '@/pages/Playground'

vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/apiClient')>('@/lib/apiClient')
  return {
    ...actual,
    api: {
      ...actual.api,
      validate: vi.fn(),
      diffPreview: vi.fn(async (_a,_b)=>({ diff: '@@', before: 'a', after: 'b' })),
    },
  }
})

describe('Playground validation display logic', () => {
  it('shows issues when ok=true but messages contain errors/warnings', async () => {
    const { api } = await import('@/lib/apiClient')
    ;(api.validate as unknown as vi.Mock).mockResolvedValueOnce({ ok: true, messages: [ { message: 'bad', severity: 'error' } ] })
    render(<Playground />)
    const btn = screen.getByRole('button', { name: 'Validate' })
    await userEvent.click(btn)
    await screen.findByRole('alert')
    expect(screen.getByText(/Found 1 issue/)).toBeInTheDocument()
    expect(screen.queryByText(/No errors found/)).toBeNull()
  })

  it('shows success when ok=true and messages are empty', async () => {
    const { api } = await import('@/lib/apiClient')
    ;(api.validate as unknown as vi.Mock).mockResolvedValueOnce({ ok: true, messages: [] })
    render(<Playground />)
    await userEvent.click(screen.getByRole('button', { name: 'Validate' }))
    await screen.findByText(/No errors found/)
  })

  it('does not shift layout when toggling validating state', async () => {
    const { api } = await import('@/lib/apiClient')
    ;(api.validate as unknown as vi.Mock).mockImplementationOnce(async () => {
      await new Promise(r => setTimeout(r, 50))
      return { ok: true, messages: [] }
    })
    render(<Playground />)
    const row = screen.getByRole('button', { name: 'Upload YAML' }).closest('div') as HTMLElement
    const beforeWidth = row.getBoundingClientRect().width
    await userEvent.click(screen.getByRole('button', { name: 'Validate' }))
    await waitFor(() => expect(screen.getByText(/No errors found/)).toBeInTheDocument())
    const afterWidth = row.getBoundingClientRect().width
    expect(Math.abs(afterWidth - beforeWidth)).toBeLessThan(2)
  })
})
