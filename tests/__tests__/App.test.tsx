import { render, screen, within } from '@testing-library/react'
import App from '@/App'

describe('App', () => {
  it('renders navbar and links', () => {
    render(<App />)
    // Scope to the header/nav to avoid matching CTA buttons in the main content
    const header = screen.getByRole('banner')
    const nav = within(header).getByRole('navigation')
    expect(within(header).getByRole('link', { name: /Cloudlint/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /Playground/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /Contact/i })).toBeInTheDocument()
  })

})
