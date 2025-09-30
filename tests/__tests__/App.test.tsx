import { render, screen } from '@testing-library/react'
import App from '@/App'

describe('App', () => {
  it('renders navbar and links', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /Cloudlint/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Playground/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Contact/i })).toBeInTheDocument()
  })

  it('renders within theme provider', () => {
    render(<App />)
    // At least one theme toggle should be present in the navbar
    const toggles = screen.getAllByRole('button', { name: /toggle theme/i })
    expect(toggles.length).toBeGreaterThan(0)
  })
})
