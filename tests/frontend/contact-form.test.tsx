import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Contact from '@/pages/Contact'

async function fillAndSubmit(name: string, email: string, message: string) {
  render(
    <Contact />
  )
  await userEvent.type(screen.getByLabelText(/name/i), name)
  await userEvent.type(screen.getByLabelText(/email/i), email)
  await userEvent.type(screen.getByLabelText(/message/i), message)
  await userEvent.click(screen.getByRole('button', { name: /send message/i }))
}

describe('Contact page', () => {
  it('shows success on valid submission', async () => {
    await fillAndSubmit('Alice', 'a@example.com', 'Great app!')
    // Title is "Thanks!" and description contains another "Thanks"; assert by role/title
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Thanks!')).toBeInTheDocument()
  })

  it('shows error if message includes "error" (simulated)', async () => {
    await fillAndSubmit('Bob', 'b@example.com', 'this triggers error')
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('has a coffee link', () => {
    render(
      <Contact />
    )
    const coffee = screen.getByRole('link', { name: /buy me a coffee/i })
    expect(coffee).toHaveAttribute('href')
  })
})
