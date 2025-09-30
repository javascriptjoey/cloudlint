import { render, screen } from '@testing-library/react'
import About from '@/pages/About'

describe('About page animation', () => {
  it('renders the data-security Lottie with accessible name', () => {
    render(<About />)
    const animation = screen.getByRole('img', { name: /data security animation/i })
    expect(animation).toBeInTheDocument()
  })
})