import { useRef, useCallback } from "react";
import { VALIDATION_CONFIG } from "@/lib/config";
import type { ValidateResponse } from "@/lib/apiClient";

interface CacheEntry {
  data: ValidateResponse;
  timestamp: number;
  hits: number;
  size: number; // Content size for memory management
}

/**
 * Custom hook for managing validation result caching
 *
 * Features:
 * - LRU (Least Recently Used) eviction
 * - TTL (Time To Live) expiration
 * - Memory-aware caching based on content size
 * - Hit count tracking for analytics
 *
 * @returns Cache management functions
 */
export function useValidationCache() {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const { cacheTimeout, maxCacheEntries } = VALIDATION_CONFIG;

  /**
   * Get cached validation result
   */
  const getCached = useCallback(
    (key: string): ValidateResponse | null => {
      const entry = cacheRef.current.get(key);
      if (!entry) return null;

      const isExpired = Date.now() - entry.timestamp > cacheTimeout;
      if (isExpired) {
        cacheRef.current.delete(key);
        return null;
      }

      // Update hit count and timestamp for LRU
      entry.hits++;
      entry.timestamp = Date.now();
      return entry.data;
    },
    [cacheTimeout]
  );

  /**
   * Set cached validation result with LRU eviction
   */
  const setCached = useCallback(
    (key: string, data: ValidateResponse, contentSize: number = 0) => {
      // Implement LRU eviction if cache gets too large
      if (cacheRef.current.size >= maxCacheEntries) {
        evictLeastRecentlyUsed();
      }

      cacheRef.current.set(key, {
        data,
        timestamp: Date.now(),
        hits: 1,
        size: contentSize,
      });
    },
    [maxCacheEntries, evictLeastRecentlyUsed]
  );

  /**
   * Clear specific cache entry
   */
  const clearCached = useCallback((key: string) => {
    cacheRef.current.delete(key);
  }, []);

  /**
   * Clear all cache entries
   */
  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  /**
   * Get cache statistics for monitoring
   */
  const getCacheStats = useCallback(() => {
    const entries = Array.from(cacheRef.current.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const averageAge =
      entries.length > 0
        ? entries.reduce(
            (sum, entry) => sum + (Date.now() - entry.timestamp),
            0
          ) / entries.length
        : 0;

    return {
      entryCount: cacheRef.current.size,
      totalSize,
      totalHits,
      averageAge,
      hitRate: totalHits / Math.max(entries.length, 1),
    };
  }, []);

  /**
   * Evict least recently used entries
   */
  const evictLeastRecentlyUsed = useCallback(() => {
    const entries = Array.from(cacheRef.current.entries());

    // Sort by hits (ascending) then by timestamp (ascending)
    entries.sort(([, a], [, b]) => {
      if (a.hits !== b.hits) {
        return a.hits - b.hits;
      }
      return a.timestamp - b.timestamp;
    });

    // Remove the least used entry
    if (entries.length > 0) {
      const [keyToRemove] = entries[0];
      cacheRef.current.delete(keyToRemove);
    }
  }, []);

  /**
   * Clean up expired entries
   */
  const cleanupExpired = useCallback(() => {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of cacheRef.current.entries()) {
      if (now - entry.timestamp > cacheTimeout) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => cacheRef.current.delete(key));
    return expiredKeys.length;
  }, [cacheTimeout]);

  /**
   * Preload cache with common validation results
   */
  const preloadCache = useCallback(
    (
      entries: Array<{ key: string; data: ValidateResponse; size?: number }>
    ) => {
      entries.forEach(({ key, data, size = 0 }) => {
        setCached(key, data, size);
      });
    },
    [setCached]
  );

  return {
    getCached,
    setCached,
    clearCached,
    clearAllCache,
    getCacheStats,
    cleanupExpired,
    preloadCache,
  };
}
