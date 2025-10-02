import { renderHook, act } from '@testing-library/react'
import { useDebouncedValidation } from '@/hooks/useDebouncedValidation'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('useDebouncedValidation', () => {
  let mockValidationFn: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockValidationFn = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should call validation function immediately when immediate is true', async () => {
    renderHook(() => 
      useDebouncedValidation('test content', mockValidationFn, { 
        enabled: true, 
        immediate: true 
      })
    )

    expect(mockValidationFn).toHaveBeenCalledTimes(1)
  })

  it('should debounce validation calls with default delay', async () => {
    const { rerender } = renderHook(
      ({ value }) => useDebouncedValidation(value, mockValidationFn, { enabled: true }),
      { initialProps: { value: 'initial' } }
    )

    // Change the value
    rerender({ value: 'changed' })
    
    // Should not call immediately
    expect(mockValidationFn).not.toHaveBeenCalled()

    // Fast-forward time by default min delay (500ms)
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(mockValidationFn).toHaveBeenCalledTimes(1)
  })

  it('should use longer delay for longer content', async () => {
    const longContent = 'a'.repeat(2000) // Above threshold
    const { rerender } = renderHook(
      ({ value }) => useDebouncedValidation(value, mockValidationFn, { enabled: true }),
      { initialProps: { value: 'short' } }
    )

    rerender({ value: longContent })

    // Should not trigger with short delay
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(mockValidationFn).not.toHaveBeenCalled()

    // Should trigger with longer delay
    act(() => {
      vi.advanceTimersByTime(1000) // Total 1500ms
    })
    expect(mockValidationFn).toHaveBeenCalledTimes(1)
  })

  it('should not validate when disabled', async () => {
    const { rerender } = renderHook(
      ({ value }) => useDebouncedValidation(value, mockValidationFn, { enabled: false }),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'changed' })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(mockValidationFn).not.toHaveBeenCalled()
  })

  it('should not validate empty content', async () => {
    const { rerender } = renderHook(
      ({ value }) => useDebouncedValidation(value, mockValidationFn, { enabled: true }),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: '' })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(mockValidationFn).not.toHaveBeenCalled()
  })

  it('should cancel previous validation when value changes', async () => {
    const { rerender } = renderHook(
      ({ value }) => useDebouncedValidation(value, mockValidationFn, { enabled: true }),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'first change' })
    
    // Wait half the delay
    act(() => {
      vi.advanceTimersByTime(250)
    })

    // Change again before first validation completes
    rerender({ value: 'second change' })

    // Complete first delay period
    act(() => {
      vi.advanceTimersByTime(250)
    })

    // Should not have validated yet
    expect(mockValidationFn).not.toHaveBeenCalled()

    // Complete second delay
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Should validate only once with the latest value
    expect(mockValidationFn).toHaveBeenCalledTimes(1)
  })

  it('should provide validateNow function for manual validation', async () => {
    const { result } = renderHook(() => 
      useDebouncedValidation('test', mockValidationFn, { enabled: false })
    )

    await act(async () => {
      await result.current.validateNow()
    })

    expect(mockValidationFn).toHaveBeenCalledTimes(1)
  })

  it('should track pending state correctly', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValidation(value, mockValidationFn, { enabled: true, immediate: false }),
      { initialProps: { value: '' } }
    )

    expect(result.current.isPending).toBe(false)

    rerender({ value: 'changed' })
    expect(result.current.isPending).toBe(true)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.isPending).toBe(false)
  })

  it('should track last validated value', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValidation(value, mockValidationFn, { enabled: true }),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'changed' })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.lastValidatedValue).toBe('changed')
  })

  it('should clear pending validation', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValidation(value, mockValidationFn, { enabled: true }),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'changed' })
    expect(result.current.isPending).toBe(true)

    act(() => {
      result.current.clearPending()
    })

    expect(result.current.isPending).toBe(false)

    // Should not validate even after delay
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(mockValidationFn).not.toHaveBeenCalled()
  })
})