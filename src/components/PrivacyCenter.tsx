/**
 * Privacy Center Component
 *
 * GDPR/CCPA compliance interface for users to manage their data and privacy rights.
 *
 * Features:
 * - Data export
 * - Data deletion
 * - Privacy rights information
 * - Data retention information
 * - Consent management
 */

import React, { useState } from "react";
import {
  exportUserData,
  downloadUserData,
  deleteAllUserData,
  getDataRetentionInfo,
  getPrivacyRights,
  hasStoredData,
} from "../utils/dataPrivacy";

interface PrivacyCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "export" | "delete" | "rights"
  >("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [exportData, setExportData] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportData = () => {
    const data = exportUserData();
    setExportData(JSON.stringify(data, null, 2));
  };

  const handleDownloadData = () => {
    downloadUserData();
  };

  const handleDeleteData = () => {
    console.log("[PrivacyCenter] Delete button clicked");
    console.log(
      "[PrivacyCenter] localStorage BEFORE:",
      Object.keys(localStorage),
    );

    const result = deleteAllUserData();

    console.log("[PrivacyCenter] Delete result:", result);
    console.log(
      "[PrivacyCenter] localStorage AFTER:",
      Object.keys(localStorage),
    );

    if (result.success) {
      setDeleteResult({
        success: true,
        message: `Successfully deleted ${result.deletedItems.length} items. Your data has been permanently removed.`,
      });
    } else {
      setDeleteResult({
        success: false,
        message: `Deletion completed with ${result.errors.length} errors. Some data may not have been deleted.`,
      });
    }

    setShowDeleteConfirm(false);

    // Close privacy center after 3 seconds if successful
    if (result.success) {
      console.log("[PrivacyCenter] Will reload page in 3 seconds...");
      setTimeout(() => {
        onClose();
        // Reload page to reflect changes
        window.location.reload();
      }, 3000);
    }
  };

  const retentionInfo = getDataRetentionInfo();
  const privacyRights = getPrivacyRights();
  const hasData = hasStoredData();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-center-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 id="privacy-center-title" className="text-2xl font-bold">
                Privacy Center
              </h2>
              <p className="text-blue-100 mt-1">
                Manage your data and privacy rights
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
              aria-label="Close privacy center"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { id: "overview", label: "Overview" },
              { id: "export", label: "Export Data" },
              { id: "delete", label: "Delete Data" },
              { id: "rights", label: "Your Rights" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400"
                    : "bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-400 dark:hover:bg-blue-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Data We Store
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  CloudLint stores minimal data locally in your browser. We are
                  committed to transparency and your privacy rights.
                </p>

                {!hasData && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-green-800 dark:text-green-200">
                      ✓ No personal data is currently stored
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
                  Data Retention
                </h4>
                <div className="space-y-3">
                  {retentionInfo.dataTypes.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {item.type}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {item.description}
                      </p>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Retention:{" "}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.retention}
                        </span>
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Purpose:{" "}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.purpose}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Export Data Tab */}
          {activeTab === "export" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Export Your Data
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Download all your data in JSON format. This includes your
                  preferences, consent choices, and usage statistics.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExportData}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Preview Data
                </button>
                <button
                  onClick={handleDownloadData}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Download Data
                </button>
              </div>

              {exportData && (
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                    Your Data Preview
                  </h4>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-800 dark:text-gray-200">
                      {exportData}
                    </code>
                  </pre>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  GDPR Article 20 - Right to Data Portability
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You have the right to receive your personal data in a
                  structured, commonly used, and machine-readable format.
                </p>
              </div>
            </div>
          )}

          {/* Delete Data Tab */}
          {activeTab === "delete" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Delete Your Data
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Permanently delete all your data from CloudLint. This action
                  cannot be undone.
                </p>
              </div>

              {deleteResult && (
                <div
                  className={`border rounded-lg p-4 ${
                    deleteResult.success
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  }`}
                >
                  <p
                    className={
                      deleteResult.success
                        ? "text-green-800 dark:text-green-200"
                        : "text-red-800 dark:text-red-200"
                    }
                  >
                    {deleteResult.message}
                  </p>
                </div>
              )}

              {!showDeleteConfirm && !deleteResult && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  disabled={!hasData}
                >
                  {hasData ? "Delete All My Data" : "No Data to Delete"}
                </button>
              )}

              {showDeleteConfirm && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">
                    ⚠️ Confirm Data Deletion
                  </h4>
                  <p className="text-red-800 dark:text-red-200 mb-4">
                    This will permanently delete all your data including:
                  </p>
                  <ul className="list-disc list-inside text-red-800 dark:text-red-200 mb-4 space-y-1">
                    <li>Analytics consent preferences</li>
                    <li>User preferences (theme, settings)</li>
                    <li>Usage history and statistics</li>
                    <li>All session data</li>
                  </ul>
                  <p className="text-red-900 dark:text-red-100 font-semibold mb-4">
                    This action cannot be undone!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteData}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  GDPR Article 17 - Right to Erasure (Right to be Forgotten)
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You have the right to obtain the erasure of your personal data
                  without undue delay.
                </p>
              </div>
            </div>
          )}

          {/* Your Rights Tab */}
          {activeTab === "rights" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Your Privacy Rights
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Under GDPR and CCPA, you have the following rights regarding
                  your personal data:
                </p>
              </div>

              <div className="space-y-4">
                {privacyRights.rights.map((right, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {right.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {right.description}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      → {right.action}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Questions or Concerns?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  If you have any questions about your privacy rights or how we
                  handle your data, please contact us at privacy@cloudlint.com
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
