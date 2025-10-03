/**
 * Configuration constants for Cloudlint application
 * Centralized configuration for API endpoints, timeouts, and feature flags
 */

export const API_CONFIG = {
  // API Base URLs
  baseURL:
    process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3001",

  // Request Configuration
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second base delay

  // Health Check
  healthCheckInterval: 30000, // 30 seconds
  healthTimeout: 5000, // 5 seconds
} as const;

export const VALIDATION_CONFIG = {
  // Real-time Validation
  debounceDelay: 1500, // 1.5 seconds
  realTimeEnabled: false, // Default off for performance

  // File Limits (matching backend)
  maxFileSize: 2 * 1024 * 1024, // 2MB
  maxLines: 15000,

  // Caching
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  maxCacheEntries: 100,

  // Performance Budgets
  smallFileThreshold: 1024, // 1KB
  smallFileTimeout: 2000, // 2 seconds
  largeFileTimeout: 15000, // 15 seconds
} as const;

export const UI_CONFIG = {
  // Toast Notifications
  toastDuration: 4000, // 4 seconds
  errorToastDuration: 6000, // 6 seconds for errors

  // Loading States
  minLoadingTime: 300, // Minimum loading time to prevent flashing

  // Animations
  animationDuration: 200, // 200ms for smooth transitions
} as const;

export const ANALYTICS_CONFIG = {
  // Privacy Settings
  consentKey: "cloudlint-analytics-consent",
  dataRetention: 30, // 30 days
  anonymizeIP: true,

  // Tracking
  enabled: process.env.NODE_ENV === "production",
  debug: process.env.NODE_ENV === "development",
} as const;

export const MONITORING_CONFIG = {
  // Error Reporting
  errorReporting: process.env.NODE_ENV === "production",

  // Performance Monitoring
  performanceTracking: true,
  slowOperationThreshold: 5000, // 5 seconds

  // Health Monitoring
  healthReporting: true,
} as const;

// Environment-specific overrides
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  realTimeValidation: true,
  autoFix: true,
  suggestions: true,
  providerDetection: true,
  analytics: true,
  healthMonitoring: true,
} as const;
