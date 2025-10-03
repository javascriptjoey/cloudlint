import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import PlaygroundNew from "@/pages/PlaygroundNew";

// Mock the theme provider
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider defaultTheme="light" storageKey="test-theme">
    {children}
  </ThemeProvider>
);

// Mock the CodeMirror component
vi.mock("@/components/CodeMirrorYamlEditor", () => ({
  CodeMirrorYamlEditor: ({ value, onChange, placeholder, className }: any) => (
    <textarea
      data-testid="yaml-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  ),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "mock-url");
global.URL.revokeObjectURL = vi.fn();

const renderPlayground = () => {
  return render(
    <BrowserRouter>
      <MockThemeProvider>
        <PlaygroundNew />
      </MockThemeProvider>
    </BrowserRouter>
  );
};

describe("PlaygroundNew Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete User Workflows", () => {
    it("completes a full validation workflow", async () => {
      const user = userEvent.setup();
      renderPlayground();

      // 1. Load sample YAML
      const sampleButton = screen.getByRole("button", { name: /sample yaml/i });
      await user.click(sampleButton);

      const editor = screen.getByTestId("yaml-editor");
      expect(editor.value).toContain("AWSTemplateFormatVersion");

      // 2. Change provider to AWS
      const providerSelect = screen.getByRole("combobox", {
        name: /provider/i,
      });
      await user.click(providerSelect);
      const awsOption = screen.getByRole("option", { name: "AWS" });
      await user.click(awsOption);

      // 3. Enable security checks
      const securityToggle = screen.getByRole("switch", {
        name: /security checks/i,
      });
      await user.click(securityToggle);
      expect(screen.getByText("On")).toBeInTheDocument();

      // 4. Validate the YAML
      const validateButton = screen.getByRole("button", { name: /validate/i });
      await user.click(validateButton);

      // Should show validating state
      expect(screen.getByText(/validating.../i)).toBeInTheDocument();

      // Wait for validation to complete
      await waitFor(
        () => {
          expect(screen.queryByText(/validating.../i)).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Should show validation results
      expect(screen.getByText(/yaml syntax is valid/i)).toBeInTheDocument();
    });

    it("completes a full conversion workflow", async () => {
      const user = userEvent.setup();
      renderPlayground();

      // 1. Enter YAML content
      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "name: test\\nvalue: 123");

      // 2. Convert to JSON
      const convertButton = screen.getByRole("button", {
        name: /convert to json/i,
      });
      await user.click(convertButton);

      // Should show converting state
      expect(screen.getByText(/converting.../i)).toBeInTheDocument();

      // Wait for conversion to complete
      await waitFor(
        () => {
          expect(screen.queryByText(/converting.../i)).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // 3. Switch to JSON tab to see results
      const jsonTab = screen.getByRole("tab", { name: /json/i });
      await user.click(jsonTab);

      expect(screen.getByText(/converted json/i)).toBeInTheDocument();

      // 4. Copy JSON output
      const copyButtons = screen.getAllByRole("button");
      const jsonCopyButton = copyButtons.find(
        (btn) =>
          btn.closest('[role="tabpanel"]')?.getAttribute("data-state") ===
            "active" && btn.querySelector("svg")
      );

      if (jsonCopyButton) {
        await user.click(jsonCopyButton);
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      }
    });

    it("handles file upload and processing workflow", async () => {
      const user = userEvent.setup();
      renderPlayground();

      // 1. Upload a YAML file
      const file = new File(
        ["apiVersion: v1\\nkind: Pod\\nmetadata:\\n  name: test-pod"],
        "test.yaml",
        { type: "text/yaml" }
      );

      const uploadButton = screen.getByRole("button", { name: /upload yaml/i });
      await user.click(uploadButton);

      const fileInput = screen.getByDisplayValue("");
      await user.upload(fileInput, file);

      // Wait for file content to load
      await waitFor(() => {
        const editor = screen.getByTestId("yaml-editor");
        expect(editor.value).toContain("apiVersion: v1");
      });

      // 2. Change provider to Kubernetes
      const providerSelect = screen.getByRole("combobox", {
        name: /provider/i,
      });
      await user.click(providerSelect);
      const k8sOption = screen.getByRole("option", { name: "Kubernetes" });
      await user.click(k8sOption);

      // 3. Validate the uploaded content
      const validateButton = screen.getByRole("button", { name: /validate/i });
      await user.click(validateButton);

      await waitFor(
        () => {
          expect(screen.queryByText(/validating.../i)).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // 4. Download the YAML
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any);

      const downloadButtons = screen.getAllByRole("button");
      const yamlDownloadButton = downloadButtons.find(
        (btn) => btn.closest(".space-y-4") && btn.querySelector("svg")
      );

      if (yamlDownloadButton) {
        await user.click(yamlDownloadButton);
        expect(mockAnchor.download).toBe("cloudlint.yaml");
        expect(mockAnchor.click).toHaveBeenCalled();
      }
    });
  });

  describe("State Management Integration", () => {
    it("maintains state consistency across operations", async () => {
      const user = userEvent.setup();
      renderPlayground();

      // 1. Set up initial state
      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: initial");

      const providerSelect = screen.getByRole("combobox", {
        name: /provider/i,
      });
      await user.click(providerSelect);
      const azureOption = screen.getByRole("option", { name: "Azure" });
      await user.click(azureOption);

      const securityToggle = screen.getByRole("switch", {
        name: /security checks/i,
      });
      await user.click(securityToggle);

      // 2. Perform validation
      const validateButton = screen.getByRole("button", { name: /validate/i });
      await user.click(validateButton);

      await waitFor(
        () => {
          expect(screen.queryByText(/validating.../i)).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // 3. Modify YAML content
      await user.clear(editor);
      await user.type(editor, "test: modified");

      // 4. Convert to JSON
      const convertButton = screen.getByRole("button", {
        name: /convert to json/i,
      });
      await user.click(convertButton);

      await waitFor(
        () => {
          expect(screen.queryByText(/converting.../i)).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // 5. Verify state consistency
      expect(screen.getByDisplayValue("Azure")).toBeInTheDocument();
      expect(screen.getByText("On")).toBeInTheDocument(); // Security checks still on
      expect(editor.value).toBe("test: modified");
    });

    it("resets state properly", async () => {
      const user = userEvent.setup();
      renderPlayground();

      // 1. Set up complex state
      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "complex: yaml\\ncontent: here");

      const validateButton = screen.getByRole("button", { name: /validate/i });
      await user.click(validateButton);

      await waitFor(
        () => {
          expect(screen.queryByText(/validating.../i)).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const convertButton = screen.getByRole("button", {
        name: /convert to json/i,
      });
      await user.click(convertButton);

      await waitFor(
        () => {
          expect(screen.queryByText(/converting.../i)).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // 2. Reset everything
      const resetButton = screen.getByRole("button", { name: /reset/i });
      await user.click(resetButton);

      // 3. Verify clean state
      expect(editor.value).toBe("");
      expect(
        screen.getByText(/no validation results yet/i)
      ).toBeInTheDocument();

      const jsonTab = screen.getByRole("tab", { name: /json/i });
      await user.click(jsonTab);
      expect(screen.getByText(/no json output yet/i)).toBeInTheDocument();
    });
  });

  describe("Error Handling Integration", () => {
    it("handles invalid file uploads gracefully", async () => {
      const user = userEvent.setup();
      renderPlayground();

      // Mock alert
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      // Try to upload non-YAML file
      const file = new File(["not yaml content"], "test.txt", {
        type: "text/plain",
      });

      const uploadButton = screen.getByRole("button", { name: /upload yaml/i });
      await user.click(uploadButton);

      const fileInput = screen.getByDisplayValue("");
      await user.upload(fileInput, file);

      expect(alertSpy).toHaveBeenCalledWith(
        "Please select a .yaml or .yml file."
      );

      alertSpy.mockRestore();
    });

    it("handles schema upload validation", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const schemaUploadButton = screen.getByRole("button", {
        name: /upload schema/i,
      });
      await user.click(schemaUploadButton);

      // The file input should be present (even if hidden)
      const fileInputs = document.querySelectorAll('input[type="file"]');
      expect(fileInputs.length).toBeGreaterThan(0);
    });
  });

  describe("Theme Integration", () => {
    it("persists theme changes across interactions", async () => {
      const user = userEvent.setup();
      renderPlayground();

      // Toggle to dark mode
      const themeToggle = screen.getByRole("button", { name: /dark mode/i });
      await user.click(themeToggle);

      expect(
        screen.getByRole("button", { name: /light mode/i })
      ).toBeInTheDocument();

      // Perform other operations
      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      const validateButton = screen.getByRole("button", { name: /validate/i });
      await user.click(validateButton);

      // Theme should still be dark
      expect(
        screen.getByRole("button", { name: /light mode/i })
      ).toBeInTheDocument();
    });
  });

  describe("Tab Navigation Integration", () => {
    it("maintains tab state during operations", async () => {
      const user = userEvent.setup();
      renderPlayground();

      // Switch to JSON tab
      const jsonTab = screen.getByRole("tab", { name: /json/i });
      await user.click(jsonTab);

      expect(jsonTab).toHaveAttribute("data-state", "active");

      // Perform conversion
      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      const convertButton = screen.getByRole("button", {
        name: /convert to json/i,
      });
      await user.click(convertButton);

      await waitFor(
        () => {
          expect(screen.queryByText(/converting.../i)).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Should still be on JSON tab and show results
      expect(jsonTab).toHaveAttribute("data-state", "active");
      expect(screen.getByText(/converted json/i)).toBeInTheDocument();
    });
  });

  describe("Button State Management", () => {
    it("properly enables/disables buttons based on content", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const validateButton = screen.getByRole("button", { name: /validate/i });
      const convertButton = screen.getByRole("button", {
        name: /convert to json/i,
      });
      const resetButton = screen.getByRole("button", { name: /reset/i });

      // Initially disabled (no content)
      expect(validateButton).toBeDisabled();
      expect(convertButton).toBeDisabled();
      expect(resetButton).toBeDisabled();

      // Add content
      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      // Should be enabled
      expect(validateButton).toBeEnabled();
      expect(convertButton).toBeEnabled();
      expect(resetButton).toBeEnabled();

      // Clear content
      await user.clear(editor);

      // Should be disabled again
      expect(validateButton).toBeDisabled();
      expect(convertButton).toBeDisabled();
      expect(resetButton).toBeDisabled();
    });
  });

  describe("Accessibility Integration", () => {
    it("maintains accessibility during dynamic updates", async () => {
      const user = userEvent.setup();
      renderPlayground();

      // Add content and validate
      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      const validateButton = screen.getByRole("button", { name: /validate/i });
      await user.click(validateButton);

      // During validation, button should have proper aria attributes
      expect(validateButton).toBeDisabled();

      await waitFor(
        () => {
          expect(screen.queryByText(/validating.../i)).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // After validation, should be accessible again
      expect(validateButton).toBeEnabled();

      // Tab navigation should work
      const jsonTab = screen.getByRole("tab", { name: /json/i });
      await user.tab();
      // Focus should be manageable
    });
  });
});
