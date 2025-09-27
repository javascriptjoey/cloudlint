import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ThemeProvider, useTheme } from '@/components/theme-provider'

// Test component that uses the theme
const TestComponent = () => {
  const { theme, setTheme } = useTheme()
  
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document classes
    document.documentElement.className = ''
  })

  it('provides default theme', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
  })

  it('allows theme changes', async () => {
    const user = userEvent.setup()
    
    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    )
    
    await user.click(screen.getByText('Set Dark'))
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
  })

  it('applies theme classes to document', async () => {
    const user = userEvent.setup()
    
    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    )
    
    await user.click(screen.getByText('Set Dark'))
    expect(document.documentElement).toHaveClass('dark')
    
    await user.click(screen.getByText('Set Light'))
    expect(document.documentElement).toHaveClass('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('persists theme to localStorage', async () => {
    const user = userEvent.setup()
    
    render(
      <ThemeProvider storageKey="test-theme">
        <TestComponent />
      </ThemeProvider>
    )
    
    await user.click(screen.getByText('Set Dark'))
    expect(localStorage.setItem).toHaveBeenCalledWith('test-theme', 'dark')
  })

  it('loads theme from localStorage', () => {
    // Mock localStorage to return a saved theme
    localStorage.getItem = vi.fn().mockReturnValue('dark')
    
    render(
      <ThemeProvider storageKey="test-theme">
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
  })

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Create a component that will trigger the error
    const ErrorComponent = () => {
      useTheme() // This should throw
      return <div>Should not render</div>
    }
    
    expect(() => {
      render(<ErrorComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')
    
    consoleSpy.mockRestore()
  })
})