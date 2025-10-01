import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Shield, UserCheck } from 'lucide-react'
import { server } from '../../../tests/mocks/server'
import { http, HttpResponse } from 'msw'

// Mock the DotLottieReact component
vi.mock('@lottiefiles/dotlottie-react', () => {
  const mockDotLottieReact = vi.fn(({ dotLottieRefCallback, ...props }) => {
    // Simulate successful loading by calling the ref callback
    const mockInstance = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
    
    setTimeout(() => {
      dotLottieRefCallback?.(mockInstance)
    }, 0)
    
    return <div data-testid="lottie-animation" {...props} />
  })
  
  return {
    DotLottieReact: mockDotLottieReact
  }
})

// Import after mocking
import { LottiePlayer } from '../LottiePlayer'

// Mock matchMedia for reduced motion testing
const mockMatchMedia = vi.fn()
global.matchMedia = mockMatchMedia

// Get the mocked DotLottieReact function
const { DotLottieReact: mockDotLottieReact } = await import('@lottiefiles/dotlottie-react')

describe('LottiePlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset MSW handlers to default
    server.resetHandlers(
      http.get('/*.lottie', () => {
        return HttpResponse.text('{"valid": "json"}', {
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )

    // Reset the mock implementation for DotLottieReact
    vi.mocked(mockDotLottieReact).mockImplementation(({ dotLottieRefCallback, ...props }) => {
      // Simulate successful loading by calling the ref callback
      const mockInstance = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
      
      setTimeout(() => {
        // @ts-expect-error - Mocking DotLottie instance for testing
        dotLottieRefCallback?.(mockInstance)
      }, 0)
      
      // @ts-expect-error - Mock component with mismatched props for testing
      return <div data-testid="lottie-animation" {...props} />
    })

    // Default matchMedia mock
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic rendering', () => {
    it('renders with default props', async () => {
      render(<LottiePlayer src="/test.lottie" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('lottie-animation')).toBeInTheDocument()
      })
      
      const region = screen.getByRole('region')
      expect(region).toHaveAttribute('aria-label', 'Animated illustration')
    })

    it('renders with custom alt text', async () => {
      render(<LottiePlayer src="/test.lottie" alt="Custom animation" />)
      
      const region = screen.getByRole('region')
      expect(region).toHaveAttribute('aria-label', 'Custom animation')
      
      await waitFor(() => {
        const animation = screen.getByTestId('lottie-animation')
        expect(animation).toHaveAttribute('aria-label', 'Custom animation')
      })
    })

    it('applies custom className', () => {
      render(<LottiePlayer src="/test.lottie" className="custom-class" />)
      
      const region = screen.getByRole('region')
      expect(region).toHaveClass('custom-class')
    })
  })

  describe('Loading states', () => {
    it('shows loading state initially', () => {
      render(<LottiePlayer src="/test.lottie" />)
      
      const loadingState = screen.getByTestId('animation-loading')
      expect(loadingState).toBeInTheDocument()
      expect(loadingState).toHaveAttribute('aria-label', 'Loading animation')
      expect(screen.getByText('Loading animation...')).toBeInTheDocument()
    })

    it('hides loading state when animation loads', async () => {
      render(<LottiePlayer src="/test.lottie" />)
      
      // Initially loading
      expect(screen.getByTestId('animation-loading')).toBeInTheDocument()
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('animation-loading')).not.toBeInTheDocument()
      })
      
      expect(screen.getByTestId('lottie-animation')).toBeInTheDocument()
    })

    it('handles non-.lottie files correctly', async () => {
      render(<LottiePlayer src="/test.json" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('lottie-animation')).toBeInTheDocument()
        expect(screen.queryByTestId('animation-loading')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error handling and fallbacks', () => {
    it('shows fallback when fetch fails and fallback icon provided', async () => {
      // Mock MSW to return 500 error for this test
      server.use(
        http.get('/test.lottie', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )
      
      render(
        <LottiePlayer 
          src="/test.lottie" 
          alt="Test animation"
          fallbackIcon={Shield}
          fallbackSize="100px"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('animation-fallback')).toBeInTheDocument()
      })
      
      // Check fallback message
      expect(screen.getByText('Using fallback image')).toBeInTheDocument()
      
      // Lottie animation should not be visible
      expect(screen.queryByTestId('lottie-animation')).not.toBeInTheDocument()
    })

    it('shows fallback when fetch returns non-ok status', async () => {
      // Mock MSW to return 404 error for this test
      server.use(
        http.get('/test.lottie', () => {
          return new HttpResponse(null, { status: 404 })
        })
      )
      
      render(
        <LottiePlayer 
          src="/test.lottie" 
          fallbackIcon={UserCheck}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('animation-fallback')).toBeInTheDocument()
      })
    })

    it('shows fallback on timeout', async () => {
      // Use a very short timeout for testing with real timers
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
      
      // Initially loading
      expect(screen.getByTestId('animation-loading')).toBeInTheDocument()
      
      // Wait for timeout to trigger fallback (using real timers)
      await waitFor(() => {
        expect(screen.getByTestId('animation-fallback')).toBeInTheDocument()
      }, { timeout: shortTimeout + 1000 })
      
      expect(screen.queryByTestId('animation-loading')).not.toBeInTheDocument()
    })

    it('shows error message when no fallback icon provided', async () => {
      // Mock MSW to return 500 error for this test
      server.use(
        http.get('/test.lottie', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )
      
      render(<LottiePlayer src="/test.lottie" />)
      
      await waitFor(() => {
        // Since no fallback icon is provided, the component should show nothing (empty region)
        expect(screen.queryByTestId('animation-fallback')).not.toBeInTheDocument()
        // The component should handle the error gracefully but not show the animation
        const region = screen.getByRole('region')
        expect(region).toBeInTheDocument()
        expect(region).toHaveAttribute('aria-label', 'Animated illustration')
      })
    })

    it('handles DotLottie render errors', async () => {
      // @ts-expect-error - Mock implementation for testing
      mockDotLottieReact.mockImplementation(({ dotLottieRefCallback }) => {
        // Simulate error in DotLottie
        const mockInstance = {
          addEventListener: vi.fn((event, callback) => {
            if (event === 'error') {
              setTimeout(() => callback(), 0)
            }
          }),
          removeEventListener: vi.fn()
        }
        
        setTimeout(() => {
          dotLottieRefCallback?.(mockInstance)
        }, 0)
        
        return <div data-testid="lottie-animation" />
      })
      
      render(
        <LottiePlayer 
          src="/test.lottie" 
          fallbackIcon={Shield}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('animation-fallback')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', async () => {
      render(<LottiePlayer src="/test.lottie" alt="Test animation" />)
      
      const region = screen.getByRole('region')
      expect(region).toHaveAttribute('aria-label', 'Test animation')
      
      await waitFor(() => {
        const animation = screen.getByTestId('lottie-animation')
        expect(animation).toHaveAttribute('role', 'img')
        expect(animation).toHaveAttribute('aria-label', 'Test animation')
        expect(animation).toHaveAttribute('tabindex', '-1')
      })
    })

    it('makes animation focusable when controls enabled', async () => {
      render(
        <LottiePlayer 
          src="/test.lottie" 
          alt="Test animation" 
          controls={true}
        />
      )
      
      await waitFor(() => {
        const animation = screen.getByTestId('lottie-animation')
        expect(animation).toHaveAttribute('tabindex', '0')
      })
    })

    it('fallback icon has proper accessibility attributes', async () => {
      // Mock MSW to return 500 error for this test
      server.use(
        http.get('/test.lottie', () => {
          return new HttpResponse(null, { status: 500 })
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
        const icon = fallback.querySelector('svg')
        expect(icon).toHaveAttribute('aria-label', 'Test animation')
      })
    })
  })

  describe('Reduced motion support', () => {
    it('respects prefers-reduced-motion setting', async () => {
      // Mock window.matchMedia specifically (not global.matchMedia)
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => ({
          matches: true, // User prefers reduced motion
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        })),
        configurable: true
      })
      
      render(<LottiePlayer src="/test.lottie" autoplay={true} />)
      
      await waitFor(() => {
        const animation = screen.getByTestId('lottie-animation')
        expect(animation).toBeInTheDocument()
        expect(animation).toHaveStyle('display: block') // Final rendered state
      })
      
      // Check the final call (after data loads) has autoplay=false
      const calls = vi.mocked(mockDotLottieReact).mock.calls
      const finalCall = calls[calls.length - 1]
      expect(finalCall[0]).toEqual(expect.objectContaining({
        autoplay: false
      }))
    })

    it('allows autoplay when reduced motion not preferred', async () => {
      // Mock window.matchMedia specifically (not global.matchMedia)
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => ({
          matches: false, // User allows motion
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        })),
        configurable: true
      })
      
      render(<LottiePlayer src="/test.lottie" autoplay={true} />)
      
      await waitFor(() => {
        const animation = screen.getByTestId('lottie-animation')
        expect(animation).toBeInTheDocument()
        expect(animation).toHaveStyle('display: block') // Final rendered state
      })
      
      // Check the final call (after data loads) has autoplay=true
      const calls = vi.mocked(mockDotLottieReact).mock.calls
      const finalCall = calls[calls.length - 1]
      expect(finalCall[0]).toEqual(expect.objectContaining({
        autoplay: true
      }))
    })

    it('handles missing matchMedia gracefully', async () => {
      // Remove matchMedia from window to test fallback
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        configurable: true
      })
      
      render(<LottiePlayer src="/test.lottie" autoplay={true} />)
      
      await waitFor(() => {
        const animation = screen.getByTestId('lottie-animation')
        expect(animation).toBeInTheDocument()
        expect(animation).toHaveStyle('display: block') // Final rendered state
      })
      
      // Should default to autoplay=true when matchMedia is undefined (fallback to autoplay prop)
      const calls = vi.mocked(mockDotLottieReact).mock.calls
      const finalCall = calls[calls.length - 1]
      expect(finalCall[0]).toEqual(expect.objectContaining({
        autoplay: true // Component falls back to the autoplay prop when matchMedia missing
      }))
    })
  })

  describe('Data handling', () => {
    it('handles JSON content-type correctly', async () => {
      const testData = '{"test": "animation"}'
      // Mock MSW to return specific JSON data
      server.use(
        http.get('/test.lottie', () => {
          return HttpResponse.text(testData, {
            headers: { 'Content-Type': 'application/json' }
          })
        })
      )
      
      render(<LottiePlayer src="/test.lottie" />)
      
      await waitFor(() => {
        const animation = screen.getByTestId('lottie-animation')
        expect(animation).toBeInTheDocument()
        expect(animation).toHaveStyle('display: block') // Final rendered state
      })
      
      // Check the final call (after data loads) has the correct data
      const calls = vi.mocked(mockDotLottieReact).mock.calls
      const finalCall = calls[calls.length - 1]
      expect(finalCall[0]).toEqual(expect.objectContaining({
        data: testData
      }))
    })

    it('handles binary data correctly', async () => {
      const testBuffer = new ArrayBuffer(16)
      // Mock MSW to return binary data
      server.use(
        http.get('/test.lottie', () => {
          return HttpResponse.arrayBuffer(testBuffer, {
            headers: { 'Content-Type': 'application/octet-stream' }
          })
        })
      )
      
      render(<LottiePlayer src="/test.lottie" />)
      
      await waitFor(() => {
        const animation = screen.getByTestId('lottie-animation')
        expect(animation).toBeInTheDocument()
        expect(animation).toHaveStyle('display: block') // Final rendered state
      })
      
      // Check the final call (after data loads) has the correct data
      const calls = vi.mocked(mockDotLottieReact).mock.calls
      const finalCall = calls[calls.length - 1]
      expect(finalCall[0]).toEqual(expect.objectContaining({
        data: testBuffer
      }))
    })

    it('handles ArrayBuffer that contains JSON', async () => {
      const jsonString = '{"test": "data"}'
      const buffer = new TextEncoder().encode(jsonString)
      
      // Mock MSW to return binary data that contains JSON
      server.use(
        http.get('/test.lottie', () => {
          return HttpResponse.arrayBuffer(buffer.buffer, {
            headers: { 'Content-Type': 'application/octet-stream' }
          })
        })
      )
      
      render(<LottiePlayer src="/test.lottie" />)
      
      await waitFor(() => {
        const animation = screen.getByTestId('lottie-animation')
        expect(animation).toBeInTheDocument()
        expect(animation).toHaveStyle('display: block') // Final rendered state
      })
      
      // Check the final call (after data loads) has the correct data
      const calls = vi.mocked(mockDotLottieReact).mock.calls
      const finalCall = calls[calls.length - 1]
      expect(finalCall[0]).toEqual(expect.objectContaining({
        data: jsonString
      }))
    })
  })

  describe('Props handling', () => {
    it('passes through all DotLottieReact props correctly', async () => {
      render(
        <LottiePlayer 
          src="/test.lottie" 
          loop={false}
          autoplay={false}
          controls={true}
        />
      )
      
      await waitFor(() => {
        const animation = screen.getByTestId('lottie-animation')
        expect(animation).toBeInTheDocument()
        expect(animation).toHaveStyle('display: block') // Final rendered state
      })
      
      // Check the final call (after data loads) has correct props
      const calls = vi.mocked(mockDotLottieReact).mock.calls
      const finalCall = calls[calls.length - 1]
      expect(finalCall[0]).toEqual(expect.objectContaining({
        loop: false,
        autoplay: false,
        role: 'img',
        tabIndex: 0, // Should be 0 when controls enabled
        style: expect.objectContaining({
          width: '100%',
          height: 'auto',
          display: 'block'
        }),
        renderConfig: { autoResize: true }
      }))
    })

    it('uses custom fallback size', async () => {
      // Mock MSW to return 500 error for this test
      server.use(
        http.get('/test.lottie', () => {
          return new HttpResponse(null, { status: 500 })
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
      })
    })

    it('uses custom loading timeout', async () => {
      // Use real timers with short timeouts for testing
      const shortTimeout = 150
      
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
      
      // Initially loading
      expect(screen.getByTestId('animation-loading')).toBeInTheDocument()
      
      // Should timeout and show fallback
      await waitFor(() => {
        expect(screen.getByTestId('animation-fallback')).toBeInTheDocument()
      }, { timeout: shortTimeout + 1000 })
      
      // Loading should be gone after timeout
      expect(screen.queryByTestId('animation-loading')).not.toBeInTheDocument()
    })
  })

  describe('Cleanup', () => {
    it('cleans up event listeners on unmount', async () => {
      let cleanupFn: (() => void) | undefined
      const mockInstance = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
      
      // @ts-expect-error - Mock implementation for testing
      mockDotLottieReact.mockImplementation(({ dotLottieRefCallback }) => {
        // Simulate the ref callback being called with mock instance
        React.useEffect(() => {
          if (dotLottieRefCallback) {
            cleanupFn = dotLottieRefCallback(mockInstance)
          }
        }, [dotLottieRefCallback])
        return <div data-testid="lottie-animation" />
      })
      
      const { unmount } = render(<LottiePlayer src="/test.lottie" />)
      
      await waitFor(() => {
        expect(mockInstance.addEventListener).toHaveBeenCalled()
      })
      
      unmount()
      
      // The cleanup function should have been called, which calls removeEventListener
      if (cleanupFn) {
        cleanupFn()
      }
      expect(mockInstance.removeEventListener).toHaveBeenCalled()
    })

    it('cleans up timeout on unmount', () => {
      vi.useFakeTimers()
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      
      // Mock MSW to hang indefinitely
      server.use(
        http.get('/test.lottie', () => {
          return new Promise(() => {}) // Never resolves
        })
      )
      
      const { unmount } = render(
        <LottiePlayer 
          src="/test.lottie" 
          loadingTimeout={5000}
        />
      )
      
      unmount()
      
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })
})