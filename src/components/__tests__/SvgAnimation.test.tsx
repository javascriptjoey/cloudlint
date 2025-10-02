import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SvgAnimation } from '../SvgAnimation'
import { Shield } from 'lucide-react'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('SvgAnimation', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<SvgAnimation src="/test.svg" alt="Test animation" />)
    
    expect(screen.getByTestId('animation-loading')).toBeInTheDocument()
    expect(screen.getByText('Loading animation...')).toBeInTheDocument()
  })

  it('renders SVG content when loaded successfully', async () => {
    const svgContent = '<svg><circle r="10"/></svg>'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(svgContent),
    } as Response)

    render(<SvgAnimation src="/test.svg" alt="Test animation" />)

    await waitFor(() => {
      expect(screen.getByTestId('svg-animation')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('animation-loading')).not.toBeInTheDocument()
  })

  it('shows fallback icon when fetch fails and fallback is provided', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(
      <SvgAnimation
        src="/test.svg"
        alt="Test animation"
        fallbackIcon={Shield}
        fallbackSize="64px"
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('animation-fallback')).toBeInTheDocument()
    })

    expect(screen.getByText('Animation failed to load: Network error')).toBeInTheDocument()
    expect(screen.queryByTestId('animation-loading')).not.toBeInTheDocument()
  })

  it('shows placeholder when no SVG content and no fallback icon', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('not svg content'),
    } as Response)

    render(<SvgAnimation src="/test.svg" alt="Test animation" />)

    await waitFor(() => {
      expect(screen.getByTestId('animation-placeholder')).toBeInTheDocument()
    })

    expect(screen.getByText('Animation unavailable')).toBeInTheDocument()
  })

  it('handles timeout correctly', async () => {
    vi.useFakeTimers()
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <SvgAnimation
        src="/test.svg"
        alt="Test animation"
        fallbackIcon={Shield}
        loadingTimeout={1000}
      />
    )

    // Initially shows loading
    expect(screen.getByTestId('animation-loading')).toBeInTheDocument()

    // Advance time past timeout
    vi.advanceTimersByTime(1100)

    await waitFor(() => {
      expect(screen.getByTestId('animation-fallback')).toBeInTheDocument()
    })

    expect(screen.getByText('Animation failed to load: Loading timeout')).toBeInTheDocument()
    
    vi.useRealTimers()
  })

  it('validates SVG content format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('invalid content'),
    } as Response)

    render(
      <SvgAnimation
        src="/test.svg"
        alt="Test animation"
        fallbackIcon={Shield}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('animation-fallback')).toBeInTheDocument()
    })

    expect(screen.getByText('Animation failed to load: Invalid SVG content')).toBeInTheDocument()
  })

  it('applies correct accessibility attributes', async () => {
    const svgContent = '<svg><circle r="10"/></svg>'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(svgContent),
    } as Response)

    render(<SvgAnimation src="/test.svg" alt="Test animation" className="custom-class" />)

    await waitFor(() => {
      const container = screen.getByRole('img', { name: 'Test animation' })
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass('custom-class')
    })
  })

  it('cleans up timeout on unmount', () => {
    vi.useFakeTimers()
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { unmount } = render(<SvgAnimation src="/test.svg" alt="Test animation" />)
    
    unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
    
    vi.useRealTimers()
    clearTimeoutSpy.mockRestore()
  })
})