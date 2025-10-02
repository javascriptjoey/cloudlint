import { render, screen } from '@testing-library/react'
import Contact from '@/pages/Contact'

describe('Contact page animation', () => {
  it('renders the support illustration placeholder with coming soon text', () => {
    render(<Contact />)
    // Check for the support illustration placeholder
    expect(screen.getByText('Support Illustration')).toBeInTheDocument()
    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
    expect(screen.getByText('Friendly, developer‑first support')).toBeInTheDocument()
  })
})
