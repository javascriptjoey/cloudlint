import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { vi } from 'vitest'
import { server } from './mocks/server'

// Mock localStorage globally for all tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

// Mock matchMedia for theme system detection
const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Harmonize AbortController between window and global to avoid cross-realm issues in jsdom.
if (typeof window !== 'undefined') {
  try {
    const w = window as unknown as { AbortController?: typeof AbortController; AbortSignal?: typeof AbortSignal }
    const g = globalThis as unknown as { AbortController?: typeof AbortController; AbortSignal?: typeof AbortSignal }
    if (!w.AbortController && g.AbortController) w.AbortController = g.AbortController
    if (!w.AbortSignal && g.AbortSignal) w.AbortSignal = g.AbortSignal
  } catch {
    // ignore if cannot assign
  }
}

// Setup global mocks
beforeEach(() => {
  if (typeof window !== 'undefined') {
    // Reset localStorage mock
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
    
    // Apply localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    
    // Apply matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
      writable: true,
    })
    
    // Clean up document classes
    document.documentElement.className = ''
    
    // Reset matchMedia mock
    matchMediaMock.mockClear()
  }
})

afterEach(() => {
  // Clean up React components
  if (typeof window !== 'undefined') {
    cleanup()
    
    // Clean up DOM after each test
    document.body.innerHTML = ''
    document.documentElement.className = ''
  }
})

// Suppress noisy YAML unresolved tag warnings (e.g., !Ref) during tests only.
// This does not change runtime behavior; it only filters specific YAML warnings.
const originalEmitWarning = process.emitWarning.bind(process)
function isYamlTagWarning(w: unknown): boolean {
  if (typeof w === 'string') return w.includes('YAMLWarning') || w.includes('TAG_RESOLVE_FAILED')
  const name = (w as { name?: string })?.name
  const code = (w as { code?: string })?.code
  return name === 'YAMLWarning' || code === 'TAG_RESOLVE_FAILED'
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(process as any).emitWarning = ((warning: unknown, ...args: unknown[]) => {
  if (isYamlTagWarning(warning)) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (originalEmitWarning as unknown as (...a: any[]) => void)(warning as any, ...(args as any[]))
}) as unknown as typeof process.emitWarning

// Mock dotlottie-react to avoid WASM/runtime in unit tests
// Provide a simple div that preserves role/aria props for accessibility assertions
import React from 'react'
vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: (props: Record<string, unknown>) => {
    return React.createElement('div', { 'data-testid': 'mock-lottie', ...props })
  },
}))

// Start MSW only in jsdom (frontend tests). Backend tests run in Node and should not be intercepted.
const isJsdom = typeof window !== 'undefined' && typeof document !== 'undefined'
if (isJsdom) {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}

// Remove previous manual fetch mock (replaced by MSW)
/*
const originalFetch = global.fetch
beforeEach(() => {
  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    const body = init?.body ? JSON.parse(init.body as string) : {}
    const okJson = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })

    if (url.endsWith('/validate')) {
      const messages = !body.yaml || /error/i.test(body.yaml) ? [
        { message: 'Indentation issue on line 2', severity: 'error' },
        { message: 'Unknown key "scirpt"', severity: 'warning' },
      ] : []
      const fixed = messages.length ? String(body.yaml).replace(/\bscirpt\b/g, 'script').trimEnd() + '\n' : undefined
      return okJson({ ok: messages.length === 0, messages, fixed })
    }
    if (url.endsWith('/schema-validate')) {
      // pretend invalid when yaml lacks "name:" for our tests
      const invalid = String(body.yaml || '').includes('name:') ? false : true
      return okJson({ ok: !invalid, errors: invalid ? ['/: must have required property `name`'] : [] })
    }
    if (url.endsWith('/convert')) {
      if (body.yaml) return okJson({ json: JSON.stringify({ converted: true }, null, 2) })
      if (body.json) return okJson({ yaml: 'converted: true\n' })
      return okJson({ json: '{}' })
    }
    if (url.endsWith('/diff-preview')) {
      return okJson({ diff: '@@\n-a\n+b', before: body.original, after: body.modified })
    }
    if (url.endsWith('/autofix')) {
      return okJson({ content: String(body.yaml || '').replace(/\bscirpt\b/g, 'script'), fixesApplied: true })
    }

    // fallback to original if provided
    return originalFetch ? originalFetch(input, init) : okJson({})
  }) as unknown as typeof fetch
})
*/

// Export mocks for individual test use
export { localStorageMock, matchMediaMock }
