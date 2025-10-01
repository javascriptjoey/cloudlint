import * as React from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import type { DotLottie } from '@lottiefiles/dotlottie-web'
import type { LucideIcon } from 'lucide-react'

export type LottiePlayerProps = {
  src: string
  alt?: string
  loop?: boolean
  autoplay?: boolean
  className?: string
  controls?: boolean
  fallbackIcon?: LucideIcon
  fallbackSize?: string
  loadingTimeout?: number
}

export function LottiePlayer({
  src,
  alt = 'Animated illustration',
  loop = true,
  autoplay = true,
  className,
  controls = false,
  fallbackIcon: FallbackIcon,
  fallbackSize = '120px',
  loadingTimeout = 10000,
}: LottiePlayerProps) {
  const dotLottieRef = React.useRef<DotLottie | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [showFallback, setShowFallback] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // If we detect a .lottie file or an unknown content-type, we fetch and feed "data"
  const [loadedData, setLoadedData] = React.useState<string | ArrayBuffer | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  // Prefetch when extension suggests binary .lottie to avoid content-type quirks
  React.useEffect(() => {
    let cancelled = false
    let timeoutId: NodeJS.Timeout | undefined
    
    const isDotlottie = /\.lottie($|\?)/i.test(src)
    
    // Set loading timeout
    // eslint-disable-next-line prefer-const
    timeoutId = setTimeout(() => {
      if (!cancelled) {
        setLoadError('Loading timeout')
        setShowFallback(true)
        setIsLoading(false)
      }
    }, loadingTimeout)
    
    async function run() {
      try {
        setLoadError(null)
        setShowFallback(false)
        setIsLoading(true)
        
        if (!isDotlottie) {
          setLoadedData(null)
          clearTimeout(timeoutId)
          setIsLoading(false)
          return
        }
        
        const res = await fetch(src)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('json')) {
          const text = await res.text()
          // Validate JSON before setting data
          try {
            JSON.parse(text)
          } catch {
            throw new Error('Invalid JSON animation data')
          }
          if (!cancelled) {
            setLoadedData(text)
            setIsLoading(false)
            clearTimeout(timeoutId)
          }
        } else {
          const buf = await res.arrayBuffer()
          // Heuristic: if buffer decodes to JSON (starts with '{'), treat as JSON string
          const head = new TextDecoder().decode(buf.slice(0, 64)).trimStart()
          if (head.startsWith('{')) {
            const text = new TextDecoder().decode(buf)
            // Validate JSON before setting data
            try {
              JSON.parse(text)
            } catch {
              throw new Error('Invalid JSON animation data')
            }
            if (!cancelled) {
              setLoadedData(text)
              setIsLoading(false)
              clearTimeout(timeoutId)
            }
          } else {
            if (!cancelled) {
              setLoadedData(buf)
              setIsLoading(false)
              clearTimeout(timeoutId)
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError((e as Error).message)
          setShowFallback(true)
          setIsLoading(false)
          clearTimeout(timeoutId)
        }
      }
    }
    
    run()
    
    return () => { 
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [src, loadingTimeout])

  // Respect prefers-reduced-motion
  const effectiveAutoplay = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    return autoplay && !(mq && mq.matches)
  }, [autoplay])

  // Handle DotLottie loading events
  const handleLoad = React.useCallback(() => {
    setIsLoading(false)
    setShowFallback(false)
  }, [])

  const handleError = React.useCallback(() => {
    setLoadError('Failed to render animation')
    setShowFallback(true)
    setIsLoading(false)
  }, [])

  // Attach minimal listeners to reflect play state
  const refCallback = React.useCallback((instance: DotLottie | null) => {
    if (!instance) return
    dotLottieRef.current = instance

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onStop = () => setIsPlaying(false)
    const onLoad = () => handleLoad()
    const onError = () => handleError()

    // Use type assertion for events that might not be in the type definition
    instance.addEventListener?.('play', onPlay)
    instance.addEventListener?.('pause', onPause)
    instance.addEventListener?.('stop', onStop)
    // Some events might not be in the official type definition, so we use any
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(instance as any).addEventListener?.('load', onLoad)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(instance as any).addEventListener?.('error', onError)
    } catch {
      // Ignore if these events don't exist
    }

    return () => {
      instance.removeEventListener?.('play', onPlay)
      instance.removeEventListener?.('pause', onPause)
      instance.removeEventListener?.('stop', onStop)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(instance as any).removeEventListener?.('load', onLoad)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(instance as any).removeEventListener?.('error', onError)
      } catch {
        // Ignore if these events don't exist
      }
    }
  }, [handleLoad, handleError])

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
            aria-label={alt}
          />
        </div>
        {loadError && (
          <div className="mt-2 text-xs text-muted-foreground text-center" role="status">
            Using fallback image
          </div>
        )}
      </div>
    )
  }

  return (
    <div role="region" aria-label={alt} className={className}>
      {isLoading && (
        <div 
          className="flex items-center justify-center animate-pulse bg-muted/30 rounded" 
          style={{ width: '100%', height: fallbackSize }}
          data-testid="animation-loading"
          aria-label="Loading animation"
        >
          <div className="text-sm text-muted-foreground">Loading animation...</div>
        </div>
      )}
      
      {!showFallback && (
        <DotLottieReact
          // Prefer data if we preloaded it, else pass-through src
          {...(loadedData !== null ? { data: loadedData } : { src })}
          loop={loop}
          autoplay={effectiveAutoplay}
          role="img"
          aria-label={alt}
          tabIndex={controls ? 0 : -1}
          style={{ 
            width: '100%', 
            height: 'auto', 
            display: isLoading ? 'none' : 'block' 
          }}
          renderConfig={{ autoResize: true }}
          dotLottieRefCallback={refCallback}
          data-testid="lottie-animation"
        />
      )}

      {loadError && !showFallback && (
        <div className="mt-2 text-xs text-destructive" role="status" aria-live="polite">
          Failed to load animation: {loadError}
        </div>
      )}

      {controls && (
        <div role="group" aria-label="Animation controls" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" onClick={() => dotLottieRef.current?.play?.()} aria-pressed={isPlaying}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={() => dotLottieRef.current?.pause?.()}>Pause</button>
          <button type="button" onClick={() => dotLottieRef.current?.stop?.()}>Stop</button>
        </div>
      )}
    </div>
  )
}
