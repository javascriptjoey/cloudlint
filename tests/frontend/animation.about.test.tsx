import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import About from '@/pages/About'

describe('About page animation', () => {
  it('renders the data-security Lottie with accessible name', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    )
    const animationRegion = screen.getByRole('region', { name: /data security animation/i })
    expect(animationRegion).toBeInTheDocument()
  })
})
