import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { vi } from 'vitest'

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

// Setup global mocks
beforeEach(() => {
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
})

afterEach(() => {
  // Clean up React components
  cleanup()
  
  // Clean up DOM after each test
  document.body.innerHTML = ''
  document.documentElement.className = ''
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

// Export mocks for individual test use
export { localStorageMock, matchMediaMock }
