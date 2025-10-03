import { useState, useCallback } from "react";
import { api, type DiffPreviewResponse, ApiError } from "@/lib/apiClient";

export interface AutoFixState {
  isFixing: boolean;
  fixedContent: string | null;
  fixesApplied: string[];
  diff: string | null;
  error: string | null;
  originalContent: string | null;
}

export interface AutoFixOptions {
  spectralFix?: boolean;
  prettier?: boolean;
}

/**
 * Custom hook for YAML auto-fix functionality with diff preview
 *
 * Features:
 * - Auto-fix YAML formatting and common issues
 * - Diff preview before applying changes
 * - Support for Spectral rule fixes
 * - Prettier integration for formatting
 * - User confirmation workflow
 *
 * @returns Auto-fix state and control functions
 *
 * @example
 * ```typescript
 * const autoFix = useAutoFix()
 *
 * // Generate auto-fix with preview
 * await autoFix.generateFix(yaml, { spectralFix: true })
 *
 * // Preview the changes
 * console.log('Diff:', autoFix.diff)
 * console.log('Fixes applied:', autoFix.fixesApplied)
 *
 * // Apply if satisfied
 * const fixedYaml = autoFix.getFixedContent()
 * ```
 */
export function useAutoFix() {
  const [state, setState] = useState<AutoFixState>({
    isFixing: false,
    fixedContent: null,
    fixesApplied: [],
    diff: null,
    error: null,
    originalContent: null,
  });

  /**
   * Generate auto-fix for YAML content
   */
  const generateFix = useCallback(
    async (yaml: string, options: AutoFixOptions = {}) => {
      if (!yaml.trim()) {
        setState((prev) => ({ ...prev, error: "No content to fix" }));
        return null;
      }

      setState((prev) => ({
        ...prev,
        isFixing: true,
        error: null,
        originalContent: yaml,
      }));

      try {
        // Get auto-fix result
        const fixResult = await api.autofix(yaml, options);

        // Generate diff preview if content changed
        let diffResult: DiffPreviewResponse | null = null;
        if (fixResult.content !== yaml) {
          diffResult = await api.diffPreview(yaml, fixResult.content);
        }

        setState((prev) => ({
          ...prev,
          isFixing: false,
          fixedContent: fixResult.content,
          fixesApplied: fixResult.fixesApplied,
          diff: diffResult?.diff || null,
          error: null,
        }));

        return {
          content: fixResult.content,
          fixesApplied: fixResult.fixesApplied,
          diff: diffResult?.diff || null,
          hasChanges: fixResult.content !== yaml,
        };
      } catch (error) {
        const errorMessage =
          error instanceof ApiError ? error.message : "Auto-fix failed";

        setState((prev) => ({
          ...prev,
          isFixing: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    []
  );

  /**
   * Get the fixed content (for applying changes)
   */
  const getFixedContent = useCallback((): string | null => {
    return state.fixedContent;
  }, [state.fixedContent]);

  /**
   * Check if there are any fixes available
   */
  const hasFixes = useCallback((): boolean => {
    return state.fixesApplied.length > 0 && !!state.fixedContent;
  }, [state.fixesApplied.length, state.fixedContent]);

  /**
   * Check if the content has changed
   */
  const hasChanges = useCallback((): boolean => {
    return (
      state.originalContent !== null &&
      state.fixedContent !== null &&
      state.originalContent !== state.fixedContent
    );
  }, [state.originalContent, state.fixedContent]);

  /**
   * Get a summary of applied fixes
   */
  const getFixSummary = useCallback(() => {
    const fixes = state.fixesApplied;
    const categories = {
      formatting: fixes.filter(
        (fix) =>
          fix.includes("prettier") ||
          fix.includes("indent") ||
          fix.includes("spaces") ||
          fix.includes("newline")
      ),
      structure: fixes.filter(
        (fix) =>
          fix.includes("anchor") ||
          fix.includes("alias") ||
          fix.includes("dedupe") ||
          fix.includes("document-start")
      ),
      content: fixes.filter(
        (fix) =>
          fix.includes("typo") ||
          fix.includes("rename") ||
          fix.includes("cfn") ||
          fix.includes("spectral")
      ),
    };

    return {
      total: fixes.length,
      categories,
      hasFormatting: categories.formatting.length > 0,
      hasStructural: categories.structure.length > 0,
      hasContent: categories.content.length > 0,
    };
  }, [state.fixesApplied]);

  /**
   * Clear auto-fix state
   */
  const clearAutoFix = useCallback(() => {
    setState({
      isFixing: false,
      fixedContent: null,
      fixesApplied: [],
      diff: null,
      error: null,
      originalContent: null,
    });
  }, []);

  /**
   * Retry auto-fix with different options
   */
  const retryFix = useCallback(
    async (yaml: string, options: AutoFixOptions = {}) => {
      clearAutoFix();
      return generateFix(yaml, options);
    },
    [generateFix, clearAutoFix]
  );

  /**
   * Generate diff between two YAML contents
   */
  const generateDiff = useCallback(
    async (original: string, modified: string) => {
      try {
        const diffResult = await api.diffPreview(original, modified);
        return diffResult.diff;
      } catch (error) {
        const errorMessage =
          error instanceof ApiError ? error.message : "Failed to generate diff";

        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    []
  );

  return {
    ...state,
    generateFix,
    getFixedContent,
    hasFixes,
    hasChanges,
    getFixSummary,
    clearAutoFix,
    retryFix,
    generateDiff,
    // Computed properties
    canApply: hasFixes() && hasChanges(),
    isReady: !state.isFixing && !state.error,
    fixCount: state.fixesApplied.length,
  };
}
