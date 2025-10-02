import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Playground from '@/pages/Playground'

describe('Validate flow (mocked)', () => {
  it('shows errors then Fix All resolves', async () => {
    render(
      <Playground />
    )

    // Wait for initial render to complete
    const editor = await screen.findByRole('textbox', { name: /yaml input/i })

    // Disable real-time validation to prevent interference
    const settingsButton = screen.getByLabelText('Real-time validation settings')
    await userEvent.click(settingsButton)
    
    const switchElement = await screen.findByRole('switch')
    await userEvent.click(switchElement)
    
    // Close the settings
    await userEvent.click(document.body)

    // cause an error by inserting the word "error" into YAML
    await userEvent.type(editor, 'ERROR')

    const btn = screen.getByRole('button', { name: /validate/i })
    await userEvent.click(btn)

    // Wait for validation to complete and alert to appear
    const alert = await screen.findByRole('alert', { timeout: 5000 })
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/found.*issue/i)

    // Apply fix and ensure diff disappears
    const apply = screen.getByRole('button', { name: /apply fix/i })
    await userEvent.click(apply)

    expect(screen.queryByText(/Preview changes/i)).not.toBeInTheDocument()
  })
})
