import { render, screen } from '@testing-library/react'
import App from '@/App'

describe('App', () => {
  it('renders navbar and home controls', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /Cloudlint/i })).toBeInTheDocument()
    // Validate button is present on home page
    expect(screen.getByRole('button', { name: /validate/i })).toBeInTheDocument()
  })

  it('renders within theme provider', () => {
    render(<App />)
    // At least one theme toggle should be present in the navbar
    const toggles = screen.getAllByRole('button', { name: /toggle theme/i })
    expect(toggles.length).toBeGreaterThan(0)
  })
})
