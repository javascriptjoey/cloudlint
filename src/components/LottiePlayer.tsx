import * as React from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import type { DotLottie } from '@lottiefiles/dotlottie-web'

export type LottiePlayerProps = {
  src: string
  alt?: string
  loop?: boolean
  autoplay?: boolean
  className?: string
  controls?: boolean
}

export function LottiePlayer({
  src,
  alt = 'Animated illustration',
  loop = true,
  autoplay = true,
  className,
  controls = false,
}: LottiePlayerProps) {
  const dotLottieRef = React.useRef<DotLottie | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)

  // If we detect a .lottie file or an unknown content-type, we fetch and feed "data"
  const [loadedData, setLoadedData] = React.useState<string | ArrayBuffer | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  // Prefetch when extension suggests binary .lottie to avoid content-type quirks
  React.useEffect(() => {
    let cancelled = false
    const isDotlottie = /\.lottie($|\?)/i.test(src)
    async function run() {
      try {
        setLoadError(null)
        if (!isDotlottie) {
          setLoadedData(null)
          return
        }
        const res = await fetch(src)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('json')) {
          const text = await res.text()
          if (!cancelled) setLoadedData(text)
        } else {
          const buf = await res.arrayBuffer()
          // Heuristic: if buffer decodes to JSON (starts with '{'), treat as JSON string
          const head = new TextDecoder().decode(buf.slice(0, 64)).trimStart()
          if (head.startsWith('{')) {
            const text = new TextDecoder().decode(buf)
            if (!cancelled) setLoadedData(text)
          } else {
            if (!cancelled) setLoadedData(buf)
          }
        }
      } catch (e) {
        if (!cancelled) setLoadError((e as Error).message)
      }
    }
    run()
    return () => { cancelled = true }
  }, [src])

  // Respect prefers-reduced-motion
  const effectiveAutoplay = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    return autoplay && !(mq && mq.matches)
  }, [autoplay])

  // Attach minimal listeners to reflect play state
  const refCallback = React.useCallback((instance: DotLottie | null) => {
    if (!instance) return
    dotLottieRef.current = instance

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onStop = () => setIsPlaying(false)

    instance.addEventListener?.('play', onPlay)
    instance.addEventListener?.('pause', onPause)
    instance.addEventListener?.('stop', onStop)

    return () => {
      instance.removeEventListener?.('play', onPlay)
      instance.removeEventListener?.('pause', onPause)
      instance.removeEventListener?.('stop', onStop)
    }
  }, [])

  return (
    <div role="region" aria-label={alt} className={className}>
      <DotLottieReact
        // Prefer data if we preloaded it, else pass-through src
        {...(loadedData !== null ? { data: loadedData } : { src })}
        loop={loop}
        autoplay={effectiveAutoplay}
        role="img"
        aria-label={alt}
        tabIndex={controls ? 0 : -1}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        renderConfig={{ autoResize: true }}
        dotLottieRefCallback={refCallback}
      />

      {loadError && (
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
