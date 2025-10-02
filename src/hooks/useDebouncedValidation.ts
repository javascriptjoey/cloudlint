import { useCallback, useEffect, useRef, useState } from 'react'

interface UseDebouncedValidationOptions {
  enabled?: boolean
  minDelay?: number
  maxDelay?: number
  immediate?: boolean
  lengthThreshold?: number
}

const DEFAULT_MIN_DELAY = 500 // 500ms for short content
const DEFAULT_MAX_DELAY = 1500 // 1.5s for long content
const DEFAULT_LENGTH_THRESHOLD = 1000 // Characters threshold for longer delay

/**
 * Custom hook that provides debounced validation functionality
 * 
 * Features:
 * - Smart delay scaling based on content length
 * - Configurable enable/disable
 * - Immediate validation option for first-time validation
 * - Automatic cleanup on unmount
 */
export function useDebouncedValidation(
  value: string,
  onValidate: () => void | Promise<void>,
  options: UseDebouncedValidationOptions = {}
) {
  const {
    enabled = true,
    minDelay = DEFAULT_MIN_DELAY,
    maxDelay = DEFAULT_MAX_DELAY,
    immediate = false,
    lengthThreshold = DEFAULT_LENGTH_THRESHOLD,
  } = options

  const timeoutRef = useRef<number | null>(null)
  const [lastValidatedValue, setLastValidatedValue] = useState<string>('')
  const [hasValidated, setHasValidated] = useState<boolean>(false)
  const [isPending, setIsPending] = useState<boolean>(false)

  // Calculate dynamic delay based on content length
  const calculateDelay = useCallback((content: string): number => {
    if (content.length <= lengthThreshold) {
      return minDelay
    }
    
    // Scale delay based on content length, capped at maxDelay
    const ratio = Math.min(content.length / (lengthThreshold * 2), 1)
    return Math.round(minDelay + (maxDelay - minDelay) * ratio)
  }, [minDelay, maxDelay, lengthThreshold])

  // Clear any pending validation
  const clearPending = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsPending(false)
  }, [])

  // Trigger validation manually (used by manual validate button)
  const validateNow = useCallback(async () => {
    clearPending()
    setLastValidatedValue(value)
    setHasValidated(true)
    await onValidate()
  }, [value, onValidate, clearPending])

  // isPending is now tracked via state

  useEffect(() => {
    // Don't validate if disabled or if value hasn't changed since last validation
    if (!enabled || value === lastValidatedValue) {
      return
    }

    // Clear any existing timeout
    clearPending()

    // Don't validate empty input
    if (value.trim().length === 0) {
      return
    }

    // For immediate validation (usually on first load with pre-filled content)
    if (immediate && !hasValidated) {
      validateNow()
      return
    }

    // Set up debounced validation
    const delay = calculateDelay(value)
    
    setIsPending(true)
    timeoutRef.current = window.setTimeout(() => {
      validateNow()
      timeoutRef.current = null
      setIsPending(false)
    }, delay)

    // Cleanup function
    return clearPending
  }, [value, enabled, immediate, validateNow, clearPending, calculateDelay, lastValidatedValue, hasValidated])

  // Cleanup on unmount
  useEffect(() => {
    return clearPending
  }, [clearPending])

  return {
    validateNow,
    clearPending,
    isPending,
    lastValidatedValue,
    hasValidated,
  }
}