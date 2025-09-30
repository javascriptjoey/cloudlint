import { render, screen } from '@testing-library/react'
import Contact from '@/pages/Contact'

describe('Contact page animation', () => {
  it('renders the developer-first support Lottie with accessible name', () => {
    render(<Contact />)
    const animation = screen.getByRole('img', { name: /friendly, developer-first support/i })
    expect(animation).toBeInTheDocument()
  })
})