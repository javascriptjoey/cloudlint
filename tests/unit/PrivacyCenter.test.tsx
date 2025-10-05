/**
 * Privacy Center Component Tests
 *
 * Tests for GDPR/CCPA compliance UI including:
 * - Data export interface
 * - Data deletion interface
 * - Privacy rights display
 * - Accessibility compliance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PrivacyCenter } from "../../src/components/PrivacyCenter";
import * as dataPrivacy from "../../src/utils/dataPrivacy";

describe("PrivacyCenter Component", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    mockOnClose.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      const { container } = render(
        <PrivacyCenter isOpen={false} onClose={mockOnClose} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when isOpen is true", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Privacy Center")).toBeInTheDocument();
    });

    it("should have proper ARIA attributes", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "privacy-center-title");
    });

    it("should render all tabs", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Export Data")).toBeInTheDocument();
      expect(screen.getByText("Delete Data")).toBeInTheDocument();
      expect(screen.getByText("Your Rights")).toBeInTheDocument();
    });
  });

  describe("Tab Navigation", () => {
    it("should show overview tab by default", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText("Data We Store")).toBeInTheDocument();
    });

    it("should switch to export tab when clicked", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Export Data"));

      expect(screen.getByText("Export Your Data")).toBeInTheDocument();
      expect(screen.getByText("Preview Data")).toBeInTheDocument();
    });

    it("should switch to delete tab when clicked", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Delete Data"));

      expect(screen.getByText("Delete Your Data")).toBeInTheDocument();
    });

    it("should switch to rights tab when clicked", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Your Rights"));

      expect(screen.getByText("Your Privacy Rights")).toBeInTheDocument();
    });
  });

  describe("Overview Tab", () => {
    it("should display data retention information", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText("Data Retention")).toBeInTheDocument();
    });

    it('should show "no data stored" message when no data exists', () => {
      vi.spyOn(dataPrivacy, "hasStoredData").mockReturnValue(false);

      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      expect(
        screen.getByText(/No personal data is currently stored/i),
      ).toBeInTheDocument();
    });

    it('should not show "no data" message when data exists', () => {
      vi.spyOn(dataPrivacy, "hasStoredData").mockReturnValue(true);

      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      expect(
        screen.queryByText(/No personal data is currently stored/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Export Data Tab", () => {
    it("should have preview and download buttons", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Export Data"));

      expect(screen.getByText("Preview Data")).toBeInTheDocument();
      expect(screen.getByText("Download Data")).toBeInTheDocument();
    });

    it("should show data preview when preview button is clicked", () => {
      const mockData = {
        analytics: {
          consent: true,
          consentDate: "2025-01-01",
          lastUpdated: null,
        },
        preferences: {
          theme: "dark",
          realTimeValidation: true,
          securityChecks: true,
        },
        history: { validations: 42, lastValidation: "2025-01-04" },
        metadata: { exportDate: "2025-01-04", version: "1.0.0" },
      };

      vi.spyOn(dataPrivacy, "exportUserData").mockReturnValue(mockData);

      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Export Data"));
      fireEvent.click(screen.getByText("Preview Data"));

      expect(screen.getByText("Your Data Preview")).toBeInTheDocument();
      expect(screen.getByText(/"analytics"/)).toBeInTheDocument();
    });

    it("should call downloadUserData when download button is clicked", () => {
      const downloadSpy = vi
        .spyOn(dataPrivacy, "downloadUserData")
        .mockImplementation(() => {});

      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Export Data"));
      fireEvent.click(screen.getByText("Download Data"));

      expect(downloadSpy).toHaveBeenCalled();

      downloadSpy.mockRestore();
    });

    it("should display GDPR Article 20 information", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Export Data"));

      expect(screen.getByText(/GDPR Article 20/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Right to Data Portability/i),
      ).toBeInTheDocument();
    });
  });

  describe("Delete Data Tab", () => {
    it("should show delete button when data exists", () => {
      vi.spyOn(dataPrivacy, "hasStoredData").mockReturnValue(true);

      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Delete Data"));

      expect(screen.getByText("Delete All My Data")).toBeInTheDocument();
    });

    it("should disable delete button when no data exists", () => {
      vi.spyOn(dataPrivacy, "hasStoredData").mockReturnValue(false);

      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Delete Data"));

      const deleteButton = screen.getByText("No Data to Delete");
      expect(deleteButton).toBeDisabled();
    });

    it("should show confirmation dialog when delete is clicked", () => {
      vi.spyOn(dataPrivacy, "hasStoredData").mockReturnValue(true);

      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Delete Data"));
      fireEvent.click(screen.getByText("Delete All My Data"));

      expect(screen.getByText(/Confirm Data Deletion/i)).toBeInTheDocument();
      expect(
        screen.getByText(/This action cannot be undone/i),
      ).toBeInTheDocument();
    });

    it("should cancel deletion when cancel is clicked", () => {
      vi.spyOn(dataPrivacy, "hasStoredData").mockReturnValue(true);

      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Delete Data"));
      fireEvent.click(screen.getByText("Delete All My Data"));
      fireEvent.click(screen.getByText("Cancel"));

      expect(
        screen.queryByText(/Confirm Data Deletion/i),
      ).not.toBeInTheDocument();
    });

    it("should delete data when confirmed", () => {
      const deleteSpy = vi
        .spyOn(dataPrivacy, "deleteAllUserData")
        .mockReturnValue({
          success: true,
          deletedItems: ["analytics-consent", "theme"],
          errors: [],
        });

      vi.spyOn(dataPrivacy, "hasStoredData").mockReturnValue(true);

      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Delete Data"));
      fireEvent.click(screen.getByText("Delete All My Data"));
      fireEvent.click(screen.getByText("Yes, Delete Everything"));

      expect(deleteSpy).toHaveBeenCalled();
      expect(screen.getByText(/Successfully deleted/i)).toBeInTheDocument();

      deleteSpy.mockRestore();
    });

    it("should show error message when deletion fails", () => {
      const deleteSpy = vi
        .spyOn(dataPrivacy, "deleteAllUserData")
        .mockReturnValue({
          success: false,
          deletedItems: [],
          errors: ["Error 1", "Error 2"],
        });

      vi.spyOn(dataPrivacy, "hasStoredData").mockReturnValue(true);

      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Delete Data"));
      fireEvent.click(screen.getByText("Delete All My Data"));
      fireEvent.click(screen.getByText("Yes, Delete Everything"));

      expect(deleteSpy).toHaveBeenCalled();
      expect(
        screen.getByText(/Deletion completed with.*errors/i),
      ).toBeInTheDocument();

      deleteSpy.mockRestore();
    });

    it("should display GDPR Article 17 information", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Delete Data"));

      expect(screen.getByText(/GDPR Article 17/i)).toBeInTheDocument();
      expect(screen.getByText(/Right to Erasure/i)).toBeInTheDocument();
    });
  });

  describe("Your Rights Tab", () => {
    it("should display privacy rights information", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Your Rights"));

      expect(screen.getByText("Your Privacy Rights")).toBeInTheDocument();
    });

    it("should display all GDPR rights", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Your Rights"));

      expect(screen.getByText("Right to Access")).toBeInTheDocument();
      expect(screen.getByText("Right to Erasure")).toBeInTheDocument();
      expect(screen.getByText("Right to Data Portability")).toBeInTheDocument();
    });

    it("should display contact information", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Your Rights"));

      expect(screen.getByText(/Questions or Concerns/i)).toBeInTheDocument();
      expect(screen.getByText(/privacy@cloudlint.com/i)).toBeInTheDocument();
    });
  });

  describe("Close Functionality", () => {
    it("should call onClose when close button is clicked", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      const closeButtons = screen.getAllByText("Close");
      fireEvent.click(closeButtons[0]);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when backdrop is clicked", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      const dialog = screen.getByRole("dialog");
      fireEvent.click(dialog.parentElement!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not close when dialog content is clicked", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      const dialog = screen.getByRole("dialog");
      fireEvent.click(dialog);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should close and reload after successful deletion", async () => {
      vi.useFakeTimers();

      const deleteSpy = vi
        .spyOn(dataPrivacy, "deleteAllUserData")
        .mockReturnValue({
          success: true,
          deletedItems: ["test"],
          errors: [],
        });

      const reloadSpy = vi
        .spyOn(window.location, "reload")
        .mockImplementation(() => {});

      vi.spyOn(dataPrivacy, "hasStoredData").mockReturnValue(true);

      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Delete Data"));
      fireEvent.click(screen.getByText("Delete All My Data"));
      fireEvent.click(screen.getByText("Yes, Delete Everything"));

      // Fast-forward time
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
        expect(reloadSpy).toHaveBeenCalled();
      });

      vi.useRealTimers();
      deleteSpy.mockRestore();
      reloadSpy.mockRestore();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Privacy Center");
    });

    it("should have accessible close button", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText("Close privacy center");
      expect(closeButton).toBeInTheDocument();
    });

    it("should have keyboard-accessible tabs", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      const exportTab = screen.getByText("Export Data");
      exportTab.focus();

      expect(document.activeElement).toBe(exportTab);
    });

    it("should have keyboard-accessible buttons", () => {
      render(<PrivacyCenter isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText("Export Data"));

      const previewButton = screen.getByText("Preview Data");
      previewButton.focus();

      expect(document.activeElement).toBe(previewButton);
    });
  });
});
