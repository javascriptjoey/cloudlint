/**
 * Analytics Utility Tests
 *
 * Tests for privacy-respecting analytics functionality.
 *
 * Bug Fix Documentation:
 * - Issue: localStorage in Vitest doesn't persist between function calls
 * - Solution: Implemented custom localStorage mock that properly stores data
 * - Date: 2025-10-04
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isAnalyticsEnabled,
  setAnalyticsConsent,
  trackPageview,
  trackEvent,
  initializeAnalytics,
  loadPlausibleScript,
} from "../../src/utils/analytics";

// Helper type for window with plausible
type WindowWithPlausible = Window & typeof globalThis & Record<string, unknown>;

describe("Analytics Utility", () => {
  // Custom localStorage mock that actually persists data
  let localStorageMock: Storage;

  beforeEach(() => {
    // Create a fresh localStorage mock for each test
    const store: Record<string, string> = {};
    localStorageMock = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
    };

    // Replace global localStorage
    Object.defineProperty(global, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // Clear any existing plausible function
    delete (window as Record<string, unknown>).plausible;

    // Clear any existing Plausible scripts
    document.querySelectorAll("script[data-domain]").forEach((script) => {
      script.remove();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isAnalyticsEnabled", () => {
    it("should return false by default when no consent is stored (GDPR compliant)", () => {
      expect(isAnalyticsEnabled()).toBe(false);
    });

    it("should return true when analytics is enabled", () => {
      setAnalyticsConsent(true);
      expect(isAnalyticsEnabled()).toBe(true);
    });

    it("should return false when analytics is disabled", () => {
      setAnalyticsConsent(false);
      expect(isAnalyticsEnabled()).toBe(false);
    });

    it("should return false on localStorage error (privacy-first)", () => {
      const spy = vi
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("Storage error");
        });

      expect(isAnalyticsEnabled()).toBe(false);
      spy.mockRestore();
    });

    it("should return false on invalid JSON in localStorage", () => {
      localStorage.setItem("analytics-consent", "invalid json");
      expect(isAnalyticsEnabled()).toBe(false);
    });
  });

  describe("setAnalyticsConsent", () => {
    it("should store analytics consent as enabled", () => {
      setAnalyticsConsent(true);

      const stored = localStorage.getItem("analytics-consent");
      expect(stored).toBe("granted");

      const date = localStorage.getItem("analytics-consent-date");
      expect(date).toBeTruthy();
    });

    it("should store analytics consent as disabled", () => {
      setAnalyticsConsent(false);

      const stored = localStorage.getItem("analytics-consent");
      expect(stored).toBe("denied");

      const date = localStorage.getItem("analytics-consent-date");
      expect(date).toBeTruthy();
    });

    it("should handle localStorage errors gracefully", () => {
      const spy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("Storage error");
        });

      // Should not throw
      expect(() => setAnalyticsConsent(true)).not.toThrow();

      spy.mockRestore();
    });

    it("should update timestamp on each call", async () => {
      setAnalyticsConsent(true);
      const first = localStorage.getItem("analytics-consent-date")!;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      setAnalyticsConsent(true);
      const second = localStorage.getItem("analytics-consent-date")!;

      expect(new Date(second).getTime()).toBeGreaterThan(
        new Date(first).getTime(),
      );
    });
  });

  describe("initializeAnalytics", () => {
    it("should define window.plausible function", () => {
      initializeAnalytics();
      expect(typeof window.plausible).toBe("function");
    });

    it("should not override existing plausible function", () => {
      const mockPlausible = vi.fn();
      (window as Record<string, unknown>).plausible = mockPlausible;

      initializeAnalytics();

      expect(window.plausible).toBe(mockPlausible);
    });

    it("should create queue for events", () => {
      initializeAnalytics();

      window.plausible!("test-event");

      const plausibleWithQueue = window.plausible as typeof window.plausible & {
        q?: unknown[][];
      };
      expect(plausibleWithQueue.q).toBeDefined();
      expect(plausibleWithQueue.q?.length).toBeGreaterThan(0);
    });
  });

  describe("trackPageview", () => {
    beforeEach(() => {
      initializeAnalytics();
      setAnalyticsConsent(true);
    });

    it("should call plausible with pageview event", () => {
      const mockPlausible = vi.fn();
      (window as WindowWithPlausible).plausible = mockPlausible;

      trackPageview();

      expect(mockPlausible).toHaveBeenCalledWith(
        "pageview",
        expect.any(Object),
      );
    });

    it("should use current URL by default", () => {
      const mockPlausible = vi.fn();
      (window as WindowWithPlausible).plausible = mockPlausible;

      trackPageview();

      expect(mockPlausible).toHaveBeenCalledWith("pageview", {
        props: { url: window.location.pathname + window.location.search },
      });
    });

    it("should use custom URL when provided", () => {
      const mockPlausible = vi.fn();
      (window as WindowWithPlausible).plausible = mockPlausible;

      trackPageview("/custom-page");

      expect(mockPlausible).toHaveBeenCalledWith("pageview", {
        props: { url: "/custom-page" },
      });
    });

    it("should not track when analytics is disabled", () => {
      setAnalyticsConsent(false);
      const mockPlausible = vi.fn();
      (window as WindowWithPlausible).plausible = mockPlausible;

      trackPageview();

      expect(mockPlausible).not.toHaveBeenCalled();
    });

    it("should not throw when plausible is not defined", () => {
      delete (window as WindowWithPlausible).plausible;

      expect(() => trackPageview()).not.toThrow();
    });
  });

  describe("trackEvent", () => {
    beforeEach(() => {
      initializeAnalytics();
      setAnalyticsConsent(true);
    });

    it("should call plausible with custom event", () => {
      const mockPlausible = vi.fn();
      (window as WindowWithPlausible).plausible = mockPlausible;

      trackEvent("Button Click");

      expect(mockPlausible).toHaveBeenCalledWith("Button Click", undefined);
    });

    it("should pass event properties", () => {
      const mockPlausible = vi.fn();
      (window as WindowWithPlausible).plausible = mockPlausible;

      const props = { button: "validate", action: "click" };
      trackEvent("Button Click", { props });

      expect(mockPlausible).toHaveBeenCalledWith("Button Click", { props });
    });

    it("should pass callback function", () => {
      const mockPlausible = vi.fn();
      (window as WindowWithPlausible).plausible = mockPlausible;

      const callback = vi.fn();
      trackEvent("Button Click", { callback });

      expect(mockPlausible).toHaveBeenCalledWith("Button Click", { callback });
    });

    it("should not track when analytics is disabled", () => {
      setAnalyticsConsent(false);
      const mockPlausible = vi.fn();
      (window as WindowWithPlausible).plausible = mockPlausible;

      trackEvent("Button Click");

      expect(mockPlausible).not.toHaveBeenCalled();
    });

    it("should not throw when plausible is not defined", () => {
      delete (window as WindowWithPlausible).plausible;

      expect(() => trackEvent("Test Event")).not.toThrow();
    });
  });

  describe("loadPlausibleScript", () => {
    it("should create and append script element", () => {
      // Enable analytics first
      setAnalyticsConsent(true);

      loadPlausibleScript("example.com");

      const script = document.querySelector(
        'script[data-domain="example.com"]',
      );
      expect(script).toBeTruthy();
      expect(script?.getAttribute("defer")).toBe("");
      expect(script?.getAttribute("src")).toBe(
        "https://plausible.io/js/script.manual.js",
      );
    });

    it("should use custom script source when provided", () => {
      // Enable analytics first
      setAnalyticsConsent(true);

      loadPlausibleScript("example.com", "https://custom.com/script.js");

      const script = document.querySelector(
        'script[data-domain="example.com"]',
      );
      expect(script?.getAttribute("src")).toBe("https://custom.com/script.js");
    });

    it("should not load script twice for same domain", () => {
      // Enable analytics first
      setAnalyticsConsent(true);

      loadPlausibleScript("example.com");
      loadPlausibleScript("example.com");

      const scripts = document.querySelectorAll(
        'script[data-domain="example.com"]',
      );
      expect(scripts.length).toBe(1);
    });

    it("should not load script when analytics is disabled", () => {
      setAnalyticsConsent(false);
      loadPlausibleScript("example.com");

      const script = document.querySelector(
        'script[data-domain="example.com"]',
      );
      expect(script).toBeNull();
    });

    it("should handle script load errors", () => {
      // Enable analytics first
      setAnalyticsConsent(true);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      loadPlausibleScript("example.com");

      const script = document.querySelector(
        'script[data-domain="example.com"]',
      ) as HTMLScriptElement;

      // Trigger error
      script.onerror?.(new Event("error"));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load Plausible analytics script",
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
