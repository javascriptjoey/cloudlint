/**
 * Data Privacy Utilities Tests
 *
 * Tests for GDPR/CCPA compliance features including:
 * - Data export
 * - Data deletion
 * - Data portability
 * - Privacy rights
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  exportUserData,
  downloadUserData,
  deleteAllUserData,
  getDataRetentionInfo,
  hasStoredData,
  getPrivacyRights,
  validateDataExport,
} from "../../src/utils/dataPrivacy";

describe("Data Privacy Utilities", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    sessionStorage.clear();

    // Also clear any lingering items
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key) localStorage.removeItem(key);
    }
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("exportUserData", () => {
    it("should export user data with all required fields", () => {
      // Set up test data
      localStorage.setItem("analytics-consent", "granted");
      localStorage.setItem("analytics-consent-date", "2025-01-01");
      localStorage.setItem("theme", "dark");
      localStorage.setItem("validation-count", "42");

      const data = exportUserData();

      expect(data).toHaveProperty("analytics");
      expect(data).toHaveProperty("preferences");
      expect(data).toHaveProperty("history");
      expect(data).toHaveProperty("metadata");
    });

    it("should export analytics consent data", () => {
      // Clear first to ensure clean state
      localStorage.clear();
      localStorage.setItem("analytics-consent", "granted");
      localStorage.setItem("analytics-consent-date", "2025-01-01");

      const data = exportUserData();

      expect(data.analytics.consent).toBe(true);
      expect(data.analytics.consentDate).toBe("2025-01-01");
    });

    it("should export user preferences", () => {
      // Clear first to ensure clean state
      localStorage.clear();
      localStorage.setItem("theme", "dark");
      localStorage.setItem("realTimeValidation", "true");
      localStorage.setItem("securityChecks", "false");

      const data = exportUserData();

      expect(data.preferences.theme).toBe("dark");
      expect(data.preferences.realTimeValidation).toBe(true);
      expect(data.preferences.securityChecks).toBe(false);
    });

    it("should export usage history", () => {
      // Clear first to ensure clean state
      localStorage.clear();
      localStorage.setItem("validation-count", "100");
      localStorage.setItem("last-validation-date", "2025-01-04");

      const data = exportUserData();

      expect(data.history.validations).toBe(100);
      expect(data.history.lastValidation).toBe("2025-01-04");
    });

    it("should include metadata with export date and version", () => {
      const data = exportUserData();

      expect(data.metadata.exportDate).toBeDefined();
      expect(data.metadata.version).toBe("1.0.0");
      expect(new Date(data.metadata.exportDate).getTime()).toBeGreaterThan(0);
    });

    it("should handle missing data gracefully", () => {
      // Ensure completely clean state
      localStorage.clear();

      const data = exportUserData();

      expect(data.analytics.consent).toBe(false);
      expect(data.analytics.consentDate).toBeNull();
      expect(data.preferences.theme).toBe("light");
      expect(data.history.validations).toBe(0);
    });
  });

  describe("downloadUserData", () => {
    it("should create and trigger download", () => {
      // Mock DOM methods
      const createElementSpy = vi.spyOn(document, "createElement");
      const appendChildSpy = vi
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => null as unknown as Node);
      const removeChildSpy = vi
        .spyOn(document.body, "removeChild")
        .mockImplementation(() => null as unknown as Node);

      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      };

      createElementSpy.mockReturnValue(mockLink as unknown as HTMLElement);

      // Mock URL methods
      const createObjectURLSpy = vi
        .spyOn(URL, "createObjectURL")
        .mockReturnValue("blob:mock-url");
      const revokeObjectURLSpy = vi
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => {});

      downloadUserData();

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toContain("cloudlint-user-data");
      expect(mockLink.download).toContain(".json");
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe("deleteAllUserData", () => {
    it("should delete all localStorage items", () => {
      // Set up test data
      localStorage.setItem("analytics-consent", "granted");
      localStorage.setItem("theme", "dark");
      localStorage.setItem("validation-count", "42");

      const result = deleteAllUserData();

      expect(result.success).toBe(true);
      expect(result.deletedItems.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);

      // Verify data is deleted
      expect(localStorage.getItem("analytics-consent")).toBeNull();
      expect(localStorage.getItem("theme")).toBeNull();
      expect(localStorage.getItem("validation-count")).toBeNull();
    });

    it("should clear sessionStorage", () => {
      sessionStorage.setItem("test-key", "test-value");

      const result = deleteAllUserData();

      expect(result.success).toBe(true);
      expect(result.deletedItems).toContain("sessionStorage");
      expect(sessionStorage.length).toBe(0);
    });

    it("should handle deletion errors gracefully", () => {
      // Mock localStorage.removeItem to throw error
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error("Mock deletion error");
      });

      const result = deleteAllUserData();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Restore original method
      Storage.prototype.removeItem = originalRemoveItem;
    });

    it("should return list of deleted items", () => {
      localStorage.setItem("analytics-consent", "granted");
      localStorage.setItem("theme", "dark");

      const result = deleteAllUserData();

      expect(result.deletedItems).toContain("analytics-consent");
      expect(result.deletedItems).toContain("theme");
    });

    it("should not fail when no data exists", () => {
      const result = deleteAllUserData();

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("getDataRetentionInfo", () => {
    it("should return data retention information", () => {
      const info = getDataRetentionInfo();

      expect(info.dataTypes).toBeDefined();
      expect(Array.isArray(info.dataTypes)).toBe(true);
      expect(info.dataTypes.length).toBeGreaterThan(0);
    });

    it("should include all required fields for each data type", () => {
      const info = getDataRetentionInfo();

      info.dataTypes.forEach((dataType) => {
        expect(dataType).toHaveProperty("type");
        expect(dataType).toHaveProperty("description");
        expect(dataType).toHaveProperty("retention");
        expect(dataType).toHaveProperty("purpose");
      });
    });

    it("should include analytics consent information", () => {
      const info = getDataRetentionInfo();

      const analyticsType = info.dataTypes.find(
        (dt) => dt.type === "Analytics Consent",
      );
      expect(analyticsType).toBeDefined();
      expect(analyticsType?.description).toContain("analytics");
    });

    it("should include user preferences information", () => {
      const info = getDataRetentionInfo();

      const prefsType = info.dataTypes.find(
        (dt) => dt.type === "User Preferences",
      );
      expect(prefsType).toBeDefined();
      expect(prefsType?.description).toContain("preferences");
    });
  });

  describe("hasStoredData", () => {
    it("should return false when no data is stored", () => {
      expect(hasStoredData()).toBe(false);
    });

    it("should return true when analytics consent is stored", () => {
      localStorage.setItem("analytics-consent", "granted");
      expect(hasStoredData()).toBe(true);
    });

    it("should return true when theme is stored", () => {
      localStorage.setItem("theme", "dark");
      expect(hasStoredData()).toBe(true);
    });

    it("should return true when validation count is stored", () => {
      localStorage.setItem("validation-count", "42");
      expect(hasStoredData()).toBe(true);
    });

    it("should return true when any tracked data exists", () => {
      localStorage.setItem("last-validation-date", "2025-01-04");
      expect(hasStoredData()).toBe(true);
    });
  });

  describe("getPrivacyRights", () => {
    it("should return privacy rights information", () => {
      const rights = getPrivacyRights();

      expect(rights.rights).toBeDefined();
      expect(Array.isArray(rights.rights)).toBe(true);
      expect(rights.rights.length).toBeGreaterThan(0);
    });

    it("should include all required fields for each right", () => {
      const rights = getPrivacyRights();

      rights.rights.forEach((right) => {
        expect(right).toHaveProperty("title");
        expect(right).toHaveProperty("description");
        expect(right).toHaveProperty("action");
      });
    });

    it("should include right to access", () => {
      const rights = getPrivacyRights();

      const accessRight = rights.rights.find(
        (r) => r.title === "Right to Access",
      );
      expect(accessRight).toBeDefined();
      expect(accessRight?.description).toContain("access");
    });

    it("should include right to erasure", () => {
      const rights = getPrivacyRights();

      const erasureRight = rights.rights.find(
        (r) => r.title === "Right to Erasure",
      );
      expect(erasureRight).toBeDefined();
      expect(erasureRight?.description).toContain("delete");
    });

    it("should include right to data portability", () => {
      const rights = getPrivacyRights();

      const portabilityRight = rights.rights.find(
        (r) => r.title === "Right to Data Portability",
      );
      expect(portabilityRight).toBeDefined();
      expect(portabilityRight?.description).toContain("structured format");
    });

    it("should include at least 6 GDPR rights", () => {
      const rights = getPrivacyRights();

      expect(rights.rights.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("validateDataExport", () => {
    it("should validate correct data export", () => {
      const data = exportUserData();
      const validation = validateDataExport(data);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it("should detect missing export date", () => {
      const data = exportUserData();
      delete (data.metadata as Partial<typeof data.metadata>).exportDate;

      const validation = validateDataExport(data);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain("Missing export date");
    });

    it("should detect missing version", () => {
      const data = exportUserData();
      delete (data.metadata as Partial<typeof data.metadata>).version;

      const validation = validateDataExport(data);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain("Missing version information");
    });

    it("should detect missing analytics data", () => {
      const data = exportUserData();
      delete (data as Partial<typeof data>).analytics;

      const validation = validateDataExport(data);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain("Missing analytics data");
    });

    it("should detect missing preferences data", () => {
      const data = exportUserData();
      delete (data as Partial<typeof data>).preferences;

      const validation = validateDataExport(data);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain("Missing preferences data");
    });

    it("should detect missing history data", () => {
      const data = exportUserData();
      delete (data as Partial<typeof data>).history;

      const validation = validateDataExport(data);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain("Missing history data");
    });

    it("should detect multiple issues", () => {
      const data = exportUserData();
      delete (data as Partial<typeof data>).analytics;
      delete (data as Partial<typeof data>).preferences;
      delete (data.metadata as Partial<typeof data.metadata>).exportDate;

      const validation = validateDataExport(data);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBe(3);
    });
  });
});
