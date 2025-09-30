import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { ThemeProvider } from '@/components/theme-provider'

describe('Navbar drawer', () => {
  it('opens and shows links on mobile', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider defaultTheme="dark" storageKey="test-theme">
          <div className="min-h-svh">
            <Navbar />
          </div>
        </ThemeProvider>
      </MemoryRouter>
    )
    const btn = screen.getByRole('button', { name: /open menu/i })
    await userEvent.click(btn)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/About/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/Contact/i)).toBeInTheDocument()
  })
})
