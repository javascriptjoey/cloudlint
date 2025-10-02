import * as React from 'react'
import type { LucideIcon } from 'lucide-react'

export type SvgAnimationProps = {
  src: string
  alt?: string
  className?: string
  fallbackIcon?: LucideIcon
  fallbackSize?: string
  loadingTimeout?: number
}

export function SvgAnimation({
  src,
  alt = 'Animated illustration',
  className,
  fallbackIcon: FallbackIcon,
  fallbackSize = '120px',
  loadingTimeout = 5000,
}: SvgAnimationProps) {
  const [showFallback, setShowFallback] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [svgContent, setSvgContent] = React.useState<string | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    let timeoutId: NodeJS.Timeout

    // Set loading timeout
    timeoutId = setTimeout(() => {
      if (!cancelled) {
        setLoadError('Loading timeout')
        setShowFallback(true)
        setIsLoading(false)
      }
    }, loadingTimeout)

    async function loadSvg() {
      try {
        setLoadError(null)
        setShowFallback(false)
        setIsLoading(true)

        const response = await fetch(src)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const content = await response.text()
        
        // Basic SVG validation
        if (!content.trim().startsWith('<svg')) {
          throw new Error('Invalid SVG content')
        }

        if (!cancelled) {
          setSvgContent(content)
          setIsLoading(false)
          clearTimeout(timeoutId)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError((error as Error).message)
          setShowFallback(true)
          setIsLoading(false)
          clearTimeout(timeoutId)
        }
      }
    }

    loadSvg()

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [src, loadingTimeout])

  // Show fallback if there's an error and fallback icon is provided
  if (showFallback && FallbackIcon) {
    return (
      <div role="region" aria-label={alt} className={className}>
        <div 
          className="flex items-center justify-center" 
          style={{ width: '100%', height: fallbackSize }}
          data-testid="animation-fallback"
        >
          <FallbackIcon 
            size={fallbackSize} 
            className="text-muted-foreground" 
            aria-hidden 
          />
        </div>
        {loadError && (
          <div className="sr-only" role="status" aria-live="polite">
            Animation failed to load: {loadError}
          </div>
        )}
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div role="region" aria-label={alt} className={className}>
        <div 
          className="flex items-center justify-center animate-pulse bg-muted/50 rounded" 
          style={{ width: '100%', height: fallbackSize }}
          data-testid="animation-loading"
        >
          <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="sr-only" role="status" aria-live="polite">
          Loading animation...
        </div>
      </div>
    )
  }

  // Render SVG content
  if (svgContent) {
    return (
      <div role="img" aria-label={alt} className={className}>
        <div 
          dangerouslySetInnerHTML={{ __html: svgContent }}
          data-testid="svg-animation"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
    )
  }

  // Fallback if no content and no fallback icon
  return (
    <div role="region" aria-label={alt} className={className}>
      <div 
        className="flex items-center justify-center bg-muted/30 rounded" 
        style={{ width: '100%', height: fallbackSize }}
        data-testid="animation-placeholder"
      >
        <span className="text-muted-foreground text-sm">Animation unavailable</span>
      </div>
    </div>
  )
}