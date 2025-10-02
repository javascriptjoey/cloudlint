import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import About from '@/pages/About'

describe('About page animation', () => {
  it('renders the security illustration placeholder with coming soon text', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    )
    // Check for the security illustration placeholder
    expect(screen.getByText('Security Illustration')).toBeInTheDocument()
    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
    expect(screen.getByText('Provider‑aware YAML Intelligence')).toBeInTheDocument()
  })
})
