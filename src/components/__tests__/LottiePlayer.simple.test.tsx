import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Shield } from 'lucide-react'
import { server } from '../../../tests/mocks/server'
import { http, HttpResponse } from 'msw'

// Simple mock for DotLottieReact
vi.mock('@lottiefiles/dotlottie-react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  DotLottieReact: ({ 'data-testid': _testId, ...props }: any) => (
    <div data-testid="lottie-animation" {...props}>
      Mocked Lottie Animation
    </div>
  )
}))

import { LottiePlayer } from '../LottiePlayer'

// Mock matchMedia
// @ts-expect-error - Mocking matchMedia for testing
global.matchMedia = vi.fn(() => ({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}))

describe('LottiePlayer Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset MSW handlers to default - use the correct pattern for direct requests
    server.resetHandlers(
      http.get('/test.lottie', () => {
        return HttpResponse.text('{"test": "animation"}', {
          headers: { 'Content-Type': 'application/json' }
        })
      }),
      // Also handle the pattern used in main handlers
      http.get('/animations/*', () => {
        return HttpResponse.text('{"test": "animation"}', {
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )
  })

  it('renders with basic props', () => {
    render(<LottiePlayer src="/test.lottie" />)
    
    const region = screen.getByRole('region')
    expect(region).toHaveAttribute('aria-label', 'Animated illustration')
  })

  it('renders with custom alt text', () => {
    render(<LottiePlayer src="/test.lottie" alt="Custom animation" />)
    
    const region = screen.getByRole('region')
    expect(region).toHaveAttribute('aria-label', 'Custom animation')
  })

  it('applies custom className', () => {
    render(<LottiePlayer src="/test.lottie" className="custom-class" />)
    
    const region = screen.getByRole('region')
    expect(region).toHaveClass('custom-class')
  })

  it('shows fallback icon when fetch fails and fallback provided', async () => {
    // Mock MSW to return 404 for this test
    server.use(
      http.get('/test.lottie', () => {
        return new HttpResponse(null, { status: 404 })
      })
    )
    
    render(
      <LottiePlayer 
        src="/test.lottie" 
        alt="Test animation"
        fallbackIcon={Shield}
      />
    )
    
    await waitFor(() => {
      const fallback = screen.getByTestId('animation-fallback')
      expect(fallback).toBeInTheDocument()
    }, { timeout: 5000 })
    
    expect(screen.getByText('Using fallback image')).toBeInTheDocument()
  })

  it('shows error message when no fallback provided', async () => {
    // Mock MSW to return 500 error for this test
    server.use(
      http.get('/test.lottie', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )
    
    render(<LottiePlayer src="/test.lottie" />)
    
    await waitFor(() => {
      // Component shows error but no fallback since no fallback icon provided
      const region = screen.getByRole('region')
      expect(region).toBeInTheDocument()
      // No fallback should be shown
      expect(screen.queryByTestId('animation-fallback')).not.toBeInTheDocument()
      // Animation should be hidden or not shown due to error
    }, { timeout: 5000 })
  })

  it('handles non-.lottie files correctly', () => {
    render(<LottiePlayer src="/test.json" />)
    
    // Should not fetch for non-.lottie files (no need to check with MSW)
    
    const region = screen.getByRole('region')
    expect(region).toBeInTheDocument()
  })

  it('shows loading state initially for .lottie files', () => {
    render(<LottiePlayer src="/test.lottie" />)
    
    const loadingState = screen.getByTestId('animation-loading')
    expect(loadingState).toBeInTheDocument()
    expect(loadingState).toHaveAttribute('aria-label', 'Loading animation')
    expect(screen.getByText('Loading animation...')).toBeInTheDocument()
  })

  it('uses custom fallback size', async () => {
    // Mock MSW to return 404 for this test
    server.use(
      http.get('/test.lottie', () => {
        return new HttpResponse(null, { status: 404 })
      })
    )
    
    render(
      <LottiePlayer 
        src="/test.lottie" 
        fallbackIcon={Shield}
        fallbackSize="200px"
      />
    )
    
    await waitFor(() => {
      const fallback = screen.getByTestId('animation-fallback')
      expect(fallback).toHaveStyle('height: 200px')
    }, { timeout: 5000 })
  })

  it('respects prefers-reduced-motion when available', () => {
    // Mock matchMedia to return reduced motion preference
    // @ts-expect-error - Mocking matchMedia for testing
    global.matchMedia = vi.fn(() => ({
      matches: true, // User prefers reduced motion
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
    
    render(<LottiePlayer src="/test.lottie" autoplay={true} />)
    
    // The component should handle reduced motion gracefully
    const region = screen.getByRole('region')
    expect(region).toBeInTheDocument()
  })

  it('handles fetch timeout', async () => {
    // Use a very short timeout for testing
    const shortTimeout = 100
    
    // Mock MSW to hang indefinitely
    server.use(
      http.get('/test.lottie', () => {
        return new Promise(() => {}) // Never resolves
      })
    )
    
    render(
      <LottiePlayer 
        src="/test.lottie" 
        fallbackIcon={Shield}
        loadingTimeout={shortTimeout}
      />
    )
    
    // Initially should show loading
    expect(screen.getByTestId('animation-loading')).toBeInTheDocument()
    
    // Wait for timeout to trigger fallback (using real timers)
    await waitFor(() => {
      expect(screen.getByTestId('animation-fallback')).toBeInTheDocument()
    }, { timeout: shortTimeout + 1000 }) // Give extra time for the timeout to process
  })

  it('handles server error responses', async () => {
    // Mock MSW to return 500 error
    server.use(
      http.get('/test.lottie', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )
    
    render(
      <LottiePlayer 
        src="/test.lottie" 
        fallbackIcon={Shield}
      />
    )
    
    // Should show loading initially
    expect(screen.getByTestId('animation-loading')).toBeInTheDocument()
    
    // Then show fallback when error occurs
    await waitFor(() => {
      expect(screen.getByTestId('animation-fallback')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Loading should be gone
    expect(screen.queryByTestId('animation-loading')).not.toBeInTheDocument()
  })
})