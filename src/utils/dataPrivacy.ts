/**
 * Data Privacy Utilities
 *
 * GDPR/CCPA compliance utilities for data export, deletion, and user rights.
 *
 * Features:
 * - Data export (JSON format)
 * - Data deletion (right to be forgotten)
 * - Data portability
 * - Consent management
 * - Privacy policy compliance
 */

import { SecurityAuditLogger } from "./security";

/**
 * User data structure for export
 */
export interface UserData {
  analytics: {
    consent: boolean;
    consentDate: string | null;
    lastUpdated: string | null;
  };
  preferences: {
    theme: string;
    realTimeValidation: boolean;
    securityChecks: boolean;
  };
  history: {
    validations: number;
    lastValidation: string | null;
  };
  metadata: {
    exportDate: string;
    version: string;
  };
}

/**
 * Export all user data in JSON format (GDPR Article 20 - Right to Data Portability)
 */
export function exportUserData(): UserData {
  SecurityAuditLogger.log(
    "data_export_requested",
    {
      timestamp: Date.now(),
    },
    "low",
  );

  // Collect analytics consent data
  const analyticsConsent = localStorage.getItem("analytics-consent");
  const consentDate = localStorage.getItem("analytics-consent-date");
  const consentUpdated = localStorage.getItem("analytics-consent-updated");

  // Collect user preferences
  const theme = localStorage.getItem("theme") || "light";
  const realTimeValidation =
    localStorage.getItem("realTimeValidation") === "true";
  const securityChecks = localStorage.getItem("securityChecks") !== "false";

  // Collect usage history (anonymized)
  const validationCount = parseInt(
    localStorage.getItem("validation-count") || "0",
    10,
  );
  const lastValidation = localStorage.getItem("last-validation-date");

  const userData: UserData = {
    analytics: {
      consent: analyticsConsent === "granted",
      consentDate: consentDate,
      lastUpdated: consentUpdated,
    },
    preferences: {
      theme,
      realTimeValidation,
      securityChecks,
    },
    history: {
      validations: validationCount,
      lastValidation,
    },
    metadata: {
      exportDate: new Date().toISOString(),
      version: "1.0.0",
    },
  };

  SecurityAuditLogger.log(
    "data_export_completed",
    {
      dataSize: JSON.stringify(userData).length,
      timestamp: Date.now(),
    },
    "low",
  );

  return userData;
}

/**
 * Download user data as JSON file
 */
export function downloadUserData(): void {
  const userData = exportUserData();
  const dataStr = JSON.stringify(userData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cloudlint-user-data-${new Date().toISOString().split("T")[0]}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  SecurityAuditLogger.log(
    "data_download_completed",
    {
      filename: link.download,
      timestamp: Date.now(),
    },
    "low",
  );
}

/**
 * Delete all user data (GDPR Article 17 - Right to Erasure / Right to be Forgotten)
 */
export function deleteAllUserData(): {
  success: boolean;
  deletedItems: string[];
  errors: string[];
} {
  SecurityAuditLogger.log(
    "data_deletion_requested",
    {
      timestamp: Date.now(),
    },
    "medium",
  );

  const deletedItems: string[] = [];
  const errors: string[] = [];

  // List of all localStorage keys used by the application
  const keysToDelete = [
    // Analytics
    "analytics-consent",
    "analytics-consent-date",
    "analytics-consent-updated",
    "analytics-banner-dismissed",

    // Preferences
    "theme",
    "realTimeValidation",
    "securityChecks",

    // History
    "validation-count",
    "last-validation-date",
    "validation-cache",

    // Session data
    "last-yaml-content",
    "editor-state",

    // Any other app-specific keys
    "cloudlint-session-id",
  ];

  // Delete each key
  keysToDelete.forEach((key) => {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        deletedItems.push(key);
      }
    } catch (error) {
      errors.push(
        `Failed to delete ${key}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  });

  // Clear any session storage
  try {
    sessionStorage.clear();
    deletedItems.push("sessionStorage");
  } catch (error) {
    errors.push(
      `Failed to clear sessionStorage: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  // Clear any cookies (if used)
  try {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (name.startsWith("cloudlint")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        deletedItems.push(`cookie:${name}`);
      }
    });
  } catch (error) {
    errors.push(
      `Failed to clear cookies: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  const success = errors.length === 0;

  SecurityAuditLogger.log(
    "data_deletion_completed",
    {
      success,
      deletedCount: deletedItems.length,
      errorCount: errors.length,
      timestamp: Date.now(),
    },
    success ? "low" : "high",
  );

  return {
    success,
    deletedItems,
    errors,
  };
}

/**
 * Get data retention information
 */
export function getDataRetentionInfo(): {
  dataTypes: Array<{
    type: string;
    description: string;
    retention: string;
    purpose: string;
  }>;
} {
  return {
    dataTypes: [
      {
        type: "Analytics Consent",
        description: "Your choice to allow or deny analytics tracking",
        retention: "Until you change your preference or delete your data",
        purpose:
          "To respect your privacy preferences and comply with GDPR/CCPA",
      },
      {
        type: "User Preferences",
        description: "Theme, validation settings, and UI preferences",
        retention: "Until you change them or delete your data",
        purpose: "To provide a personalized experience",
      },
      {
        type: "Usage Statistics",
        description: "Anonymous count of validations performed",
        retention: "Until you delete your data",
        purpose: "To improve the application and understand usage patterns",
      },
      {
        type: "Session Data",
        description: "Temporary data during your current session",
        retention: "Until you close your browser or delete your data",
        purpose: "To maintain application state during your session",
      },
    ],
  };
}

/**
 * Check if user has any stored data
 */
export function hasStoredData(): boolean {
  const keys = [
    "analytics-consent",
    "theme",
    "validation-count",
    "last-validation-date",
  ];

  return keys.some((key) => localStorage.getItem(key) !== null);
}

/**
 * Get privacy rights information
 */
export function getPrivacyRights(): {
  rights: Array<{
    title: string;
    description: string;
    action: string;
  }>;
} {
  return {
    rights: [
      {
        title: "Right to Access",
        description: "You have the right to access your personal data",
        action: "Export your data to see what information we store",
      },
      {
        title: "Right to Rectification",
        description: "You have the right to correct inaccurate data",
        action: "Update your preferences in the settings",
      },
      {
        title: "Right to Erasure",
        description: "You have the right to delete your personal data",
        action: "Delete all your data permanently",
      },
      {
        title: "Right to Data Portability",
        description:
          "You have the right to receive your data in a structured format",
        action: "Export your data as JSON",
      },
      {
        title: "Right to Object",
        description: "You have the right to object to data processing",
        action: "Opt out of analytics tracking",
      },
      {
        title: "Right to Withdraw Consent",
        description: "You have the right to withdraw consent at any time",
        action: "Change your consent preferences",
      },
    ],
  };
}

/**
 * Validate data export integrity
 */
export function validateDataExport(data: UserData): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check required fields
  if (!data.metadata || !data.metadata.exportDate) {
    issues.push("Missing export date");
  }

  if (!data.metadata || !data.metadata.version) {
    issues.push("Missing version information");
  }

  // Validate data structure
  if (!data.analytics) {
    issues.push("Missing analytics data");
  }

  if (!data.preferences) {
    issues.push("Missing preferences data");
  }

  if (!data.history) {
    issues.push("Missing history data");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
