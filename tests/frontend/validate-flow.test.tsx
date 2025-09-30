import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Playground from '@/pages/Playground'

async function typeInTextarea(value: string) {
  const ta = screen.getByRole('textbox', { name: /yaml input/i }) as HTMLTextAreaElement
  await userEvent.clear(ta)
  await userEvent.type(ta, value)
}

describe('Validate flow (mocked)', () => {
  it('shows errors then Fix All resolves', async () => {
    render(
      <Playground />
    )

    // cause an error by inserting the word "error" into YAML
    await typeInTextarea('error: true\n')

    const btn = screen.getByRole('button', { name: /validate/i })
    await userEvent.click(btn)

    const alert = await screen.findByRole('alert')
    expect(alert).toBeInTheDocument()

    // Apply fix and ensure diff disappears
    const apply = screen.getByRole('button', { name: /apply fix/i })
    await userEvent.click(apply)

    expect(screen.queryByText(/Preview changes/i)).not.toBeInTheDocument()
  })
})
