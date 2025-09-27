import { render, screen } from '@testing-library/react'
import App from '@/App'

describe('App', () => {
  it('renders the main application', () => {
    render(<App />)
    
    // Check if the main button is rendered
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    
    // Check if the theme toggle is rendered
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    
    // Check if the instruction text is rendered
    expect(screen.getByText(/toggle between light and dark mode/i)).toBeInTheDocument()
  })

  it('has proper layout structure', () => {
    render(<App />)
    
    // Check if the main container has the expected classes
    const container = screen.getByRole('button', { name: /click me/i }).closest('div')
    expect(container).toHaveClass('flex', 'min-h-svh', 'flex-col', 'items-center', 'justify-center')
  })

  it('renders within theme provider', () => {
    render(<App />)
    
    // The app should render without throwing errors related to theme context
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })
})