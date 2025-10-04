import { useState, useCallback } from "react";
import {
  api,
  type SdkSuggestion,
  type LintMessage,
  ApiError,
} from "@/lib/apiClient";
import type { YamlProvider } from "./useProviderDetection";

export interface SuggestionsState {
  isLoading: boolean;
  suggestions: SdkSuggestion[];
  messages: LintMessage[];
  provider: YamlProvider;
  error: string | null;
  lastAnalyzed: Date | null;
}

export interface SuggestionApplication {
  isApplying: boolean;
  appliedIndexes: number[];
  newContent: string | null;
  error: string | null;
}

/**
 * Custom hook for provider-aware YAML suggestions
 *
 * Features:
 * - AWS CloudFormation suggestions (resource types, properties)
 * - Azure Pipelines suggestions (tasks, configuration)
 * - Confidence scoring for suggestions
 * - Batch application of multiple suggestions
 * - Categorized suggestions (add, rename, type)
 *
 * @param yaml - The YAML content to analyze
 * @param forceProvider - Optional provider override
 * @returns Suggestions state and control functions
 *
 * @example
 * ```typescript
 * const suggestions = useSuggestions(yaml, 'aws')
 *
 * // Load suggestions
 * await suggestions.loadSuggestions()
 *
 * // Apply high-confidence suggestions
 * const highConfidence = suggestions.suggestions
 *   .map((s, i) => ({ suggestion: s, index: i }))
 *   .filter(({ suggestion }) => (suggestion.confidence ?? 0) > 0.8)
 *   .map(({ index }) => index)
 *
 * await suggestions.applySuggestions(highConfidence)
 * ```
 */
export function useSuggestions(yaml: string, forceProvider?: YamlProvider) {
  const [state, setState] = useState<SuggestionsState>({
    isLoading: false,
    suggestions: [],
    messages: [],
    provider: "generic",
    error: null,
    lastAnalyzed: null,
  });

  const [application, setApplication] = useState<SuggestionApplication>({
    isApplying: false,
    appliedIndexes: [],
    newContent: null,
    error: null,
  });

  /**
   * Load suggestions for the current YAML content
   */
  const loadSuggestions = useCallback(async () => {
    if (!yaml.trim()) {
      setState((prev) => ({
        ...prev,
        suggestions: [],
        messages: [],
        error: null,
      }));
      return null;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await api.suggest(yaml, forceProvider);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        suggestions: result.suggestions,
        messages: result.messages,
        provider: result.provider,
        error: null,
        lastAnalyzed: new Date(),
      }));

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "Failed to load suggestions";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      throw error;
    }
  }, [yaml, forceProvider]);

  /**
   * Apply selected suggestions by index
   */
  const applySuggestions = useCallback(
    async (indexes: number[]) => {
      if (!indexes.length) {
        setApplication((prev) => ({
          ...prev,
          error: "No suggestions selected",
        }));
        return null;
      }

      if (!yaml.trim()) {
        setApplication((prev) => ({ ...prev, error: "No content to modify" }));
        return null;
      }

      setApplication((prev) => ({
        ...prev,
        isApplying: true,
        error: null,
        appliedIndexes: indexes,
      }));

      try {
        const result = await api.applySuggestions(
          yaml,
          indexes,
          state.provider
        );

        setApplication((prev) => ({
          ...prev,
          isApplying: false,
          newContent: result.content,
          error: null,
        }));

        return result.content;
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : "Failed to apply suggestions";

        setApplication((prev) => ({
          ...prev,
          isApplying: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    [yaml, state.provider]
  );

  /**
   * Apply a single suggestion by index
   */
  const applySingleSuggestion = useCallback(
    async (index: number) => {
      return applySuggestions([index]);
    },
    [applySuggestions]
  );

  /**
   * Apply all suggestions with confidence above threshold
   */
  const applyHighConfidenceSuggestions = useCallback(
    async (threshold: number = 0.8) => {
      const highConfidenceIndexes = state.suggestions
        .map((suggestion, index) => ({ suggestion, index }))
        .filter(({ suggestion }) => (suggestion.confidence ?? 0) >= threshold)
        .map(({ index }) => index);

      if (highConfidenceIndexes.length === 0) {
        setApplication((prev) => ({
          ...prev,
          error: `No suggestions with confidence >= ${threshold}`,
        }));
        return null;
      }

      return applySuggestions(highConfidenceIndexes);
    },
    [state.suggestions, applySuggestions]
  );

  /**
   * Get suggestions categorized by type
   */
  const getCategorizedSuggestions = useCallback(() => {
    const categories = {
      add: state.suggestions.filter((s) => s.kind === "add"),
      rename: state.suggestions.filter((s) => s.kind === "rename"),
      type: state.suggestions.filter((s) => s.kind === "type"),
    };

    return {
      ...categories,
      hasAdd: categories.add.length > 0,
      hasRename: categories.rename.length > 0,
      hasType: categories.type.length > 0,
    };
  }, [state.suggestions]);

  /**
   * Get suggestions sorted by confidence (highest first)
   */
  const getSuggestionsByConfidence = useCallback(() => {
    return [...state.suggestions]
      .map((suggestion, index) => ({ suggestion, index }))
      .sort(
        (a, b) =>
          (b.suggestion.confidence ?? 0) - (a.suggestion.confidence ?? 0)
      );
  }, [state.suggestions]);

  /**
   * Get suggestion statistics
   */
  const getSuggestionStats = useCallback(() => {
    const suggestions = state.suggestions;
    const totalSuggestions = suggestions.length;
    const highConfidence = suggestions.filter(
      (s) => (s.confidence ?? 0) >= 0.8
    ).length;
    const mediumConfidence = suggestions.filter((s) => {
      const conf = s.confidence ?? 0;
      return conf >= 0.5 && conf < 0.8;
    }).length;
    const lowConfidence = suggestions.filter(
      (s) => (s.confidence ?? 0) < 0.5
    ).length;

    const averageConfidence =
      totalSuggestions > 0
        ? suggestions.reduce((sum, s) => sum + (s.confidence ?? 0), 0) /
          totalSuggestions
        : 0;

    return {
      total: totalSuggestions,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      averageConfidence,
      byKind: {
        add: suggestions.filter((s) => s.kind === "add").length,
        rename: suggestions.filter((s) => s.kind === "rename").length,
        type: suggestions.filter((s) => s.kind === "type").length,
      },
    };
  }, [state.suggestions]);

  /**
   * Clear suggestions and application state
   */
  const clearSuggestions = useCallback(() => {
    setState({
      isLoading: false,
      suggestions: [],
      messages: [],
      provider: "generic",
      error: null,
      lastAnalyzed: null,
    });

    setApplication({
      isApplying: false,
      appliedIndexes: [],
      newContent: null,
      error: null,
    });
  }, []);

  /**
   * Refresh suggestions (force reload)
   */
  const refreshSuggestions = useCallback(async () => {
    clearSuggestions();
    return loadSuggestions();
  }, [clearSuggestions, loadSuggestions]);

  return {
    // State
    ...state,
    application,

    // Actions
    loadSuggestions,
    applySuggestions,
    applySingleSuggestion,
    applyHighConfidenceSuggestions,
    clearSuggestions,
    refreshSuggestions,

    // Computed properties
    getCategorizedSuggestions,
    getSuggestionsByConfidence,
    getSuggestionStats,

    // Convenience properties
    hasSuggestions: state.suggestions.length > 0,
    hasHighConfidenceSuggestions: state.suggestions.some(
      (s) => (s.confidence ?? 0) >= 0.8
    ),
    isReady: !state.isLoading && !state.error,
    canApply: state.suggestions.length > 0 && !application.isApplying,
    hasAppliedContent: !!application.newContent,
  };
}
