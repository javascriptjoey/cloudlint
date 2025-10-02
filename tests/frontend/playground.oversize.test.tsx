import { describe, it, expect, vi, type MockedFunction } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Playground from '@/pages/Playground'

vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/apiClient')>('@/lib/apiClient')
  return {
    ...actual,
    api: {
      ...actual.api,
      validate: vi.fn(async () => ({ ok: true, messages: [] })),
      suggest: vi.fn(async () => ({ provider: 'generic', suggestions: [] })),
    },
  }
})

describe('Playground oversize check', () => {
  it('blocks backend call when uploaded YAML exceeds limit', async () => {
    const { api } = await import('@/lib/apiClient')
    render(<Playground />)
    
    // Wait for initial real-time validation to complete and reset call count
    await screen.findByText('Provider: Generic')
    const initialCalls = (api.validate as unknown as MockedFunction<typeof api.validate>).mock.calls.length
    
    // Clear the call history to start fresh
    ;(api.validate as unknown as MockedFunction<typeof api.validate>).mockClear()
    
    const input = screen.getByLabelText('Upload YAML file') as HTMLInputElement
    const bigBlob = new Uint8Array(220 * 1024) // 220KB
    const file = new File([bigBlob], 'big.yaml', { type: 'text/yaml' })
    await userEvent.upload(input, file)
    
    // Alert should be visible and validate not called for the oversized file
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/File too large/i)
    
    // No additional validate calls should have been made after clearing
    expect((api.validate as unknown as MockedFunction<typeof api.validate>).mock.calls.length).toBe(0)
  })
})
