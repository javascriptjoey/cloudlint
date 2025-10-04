import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  api,
  type ValidateResponse,
  type ValidationOptions,
  ApiError,
} from "@/lib/apiClient";
import { VALIDATION_CONFIG } from "@/lib/config";
import { useValidationCache } from "./useValidationCache";

export interface ValidationState {
  isValidating: boolean;
  results: ValidateResponse | null;
  error: string | null;
  lastValidated: Date | null;
}

export interface UseValidationOptions extends ValidationOptions {
  realTime?: boolean;
  debounceDelay?: number;
}

/**
 * Custom hook for YAML validation with real backend integration
 *
 * Features:
 * - Real-time validation with debouncing
 * - Client-side caching for performance
 * - Request deduplication
 * - Comprehensive error handling
 * - AbortController for request cancellation
 *
 * @param yaml - The YAML content to validate
 * @param options - Validation options including real-time settings
 * @returns Validation state and control functions
 *
 * @example
 * ```typescript
 * const validation = useValidation(yaml, {
 *   provider: 'aws',
 *   securityChecks: true,
 *   realTime: true
 * })
 *
 * // Manual validation
 * await validation.validate()
 *
 * // Check results
 * if (validation.results?.ok) {
 *   console.log('Valid YAML!')
 * } else {
 *   console.log('Errors:', validation.results?.messages)
 * }
 * ```
 */
export function useValidation(
  yaml: string,
  options: UseValidationOptions = {}
) {
  const [state, setState] = useState<ValidationState>({
    isValidating: false,
    results: null,
    error: null,
    lastValidated: null,
  });

  const { getCached, setCached } = useValidationCache();
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastValidationRef = useRef<string>("");
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Use ref to store validate function to avoid circular dependency
  const validateRef = useRef<
    ((content?: string) => Promise<ValidateResponse | null>) | null
  >(null);

  /**
   * Validate YAML content
   */
  const validate = useCallback(
    async (content: string = yaml) => {
      if (!content.trim()) {
        setState((prev) => ({
          ...prev,
          results: null,
          error: null,
          isValidating: false,
        }));
        return null;
      }

      // Check cache first
      const currentOptions = optionsRef.current;
      const cacheKey = `${content}-${JSON.stringify(currentOptions)}`;
      const cached = getCached(cacheKey);
      if (cached && lastValidationRef.current !== content) {
        setState((prev) => ({
          ...prev,
          results: cached,
          error: null,
          lastValidated: new Date(),
          isValidating: false,
        }));
        lastValidationRef.current = content;
        return cached;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setState((prev) => ({ ...prev, isValidating: true, error: null }));
      lastValidationRef.current = content;

      try {
        const results = await api.validate(content, {
          provider: currentOptions.provider,
          securityChecks: currentOptions.securityChecks,
          filename: currentOptions.filename,
          spectralRulesetPath: currentOptions.spectralRulesetPath,
        });

        setState((prev) => ({
          ...prev,
          isValidating: false,
          results,
          error: null,
          lastValidated: new Date(),
        }));

        // Cache successful results
        setCached(cacheKey, results);
        return results;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return null; // Request was cancelled
        }

        const errorMessage =
          error instanceof ApiError ? error.message : "Validation failed";

        setState((prev) => ({
          ...prev,
          isValidating: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    [yaml, getCached, setCached]
  );

  // Store validate function in ref for debounced validation
  validateRef.current = validate;

  // Debounced validation function using ref to avoid circular dependency
  const debouncedValidate = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    const debouncedFn = (content: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        validateRef.current?.(content);
      }, options.debounceDelay ?? VALIDATION_CONFIG.debounceDelay);
    };

    debouncedFn.cancel = () => clearTimeout(timeoutId);
    return debouncedFn;
  }, [options.debounceDelay]);

  /**
   * Clear validation results and error state
   */
  const clearValidation = useCallback(() => {
    setState({
      isValidating: false,
      results: null,
      error: null,
      lastValidated: null,
    });
    lastValidationRef.current = "";
  }, []);

  /**
   * Force validation regardless of cache
   */
  const forceValidate = useCallback(
    async (content: string = yaml) => {
      // Clear cache for this content (future implementation)
      // const cacheKey = `${content}-${JSON.stringify(options)}`;
      // clearCached(cacheKey);

      lastValidationRef.current = ""; // Force validation
      return validate(content);
    },
    [yaml, validate]
  );

  // Real-time validation effect
  useEffect(() => {
    if (options.realTime && yaml.trim() && yaml !== lastValidationRef.current) {
      debouncedValidate(yaml);
    }

    return () => {
      debouncedValidate.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [yaml, options.realTime, debouncedValidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      debouncedValidate.cancel();
    };
  }, [debouncedValidate]);

  // Reactive computed properties - recalculate on every render
  const hasResults = !!state.results;
  const hasErrors = !!state.results && !state.results.ok;
  const errors =
    state.results?.messages.filter((m) => m.severity === "error") ?? [];
  const errorCount = errors.length;
  const warningCount =
    state.results?.messages.filter((m) => m.severity === "warning").length ?? 0;
  const infoCount =
    state.results?.messages.filter((m) => m.severity === "info").length ?? 0;
  const provider = state.results?.providerSummary?.provider ?? "generic";

  return {
    ...state,
    validate,
    clearValidation,
    forceValidate,
    // Computed properties (now reactive)
    hasResults,
    hasErrors,
    errors,
    errorCount,
    warningCount,
    infoCount,
    provider,
  };
}
