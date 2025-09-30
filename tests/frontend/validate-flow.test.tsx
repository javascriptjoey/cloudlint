import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/pages/Home'
import { HelmetProvider } from 'react-helmet-async'

async function typeInTextarea(value: string) {
  const ta = screen.getByRole('textbox', { name: /yaml input/i }) as HTMLTextAreaElement
  await userEvent.clear(ta)
  await userEvent.type(ta, value)
}

describe('Validate flow (mocked)', () => {
  it('shows errors then Fix All resolves', async () => {
    render(
      <HelmetProvider>
        <Home />
      </HelmetProvider>
    )

    // cause an error by inserting the word "error" into YAML
    await typeInTextarea('error: true\n')

    const btn = screen.getByRole('button', { name: /validate/i })
    await userEvent.click(btn)

    const alert = await screen.findByRole('alert')
    expect(alert).toBeInTheDocument()

    const fix = screen.getByRole('button', { name: /fix all/i })
    await userEvent.click(fix)

    expect(await screen.findByText(/Success: No errors/)).toBeInTheDocument()
  })
})
