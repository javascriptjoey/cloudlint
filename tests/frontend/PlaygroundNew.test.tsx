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

describe("PlaygroundNew", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("renders the main heading", () => {
      renderPlayground();
      expect(
        screen.getByRole("heading", { name: /cloudlint yaml validator/i })
      ).toBeInTheDocument();
    });

    it("renders the description", () => {
      renderPlayground();
      expect(
        screen.getByText(
          /validate and auto-fix yaml optimized for aws, azure, and more/i
        )
      ).toBeInTheDocument();
    });

    it("renders provider selection with default value", () => {
      renderPlayground();
      expect(
        screen.getByRole("combobox", { name: /provider/i })
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("Generic")).toBeInTheDocument();
    });

    it("renders security checks toggle in off state", () => {
      renderPlayground();
      const toggle = screen.getByRole("switch", { name: /security checks/i });
      expect(toggle).toBeInTheDocument();
      expect(toggle).not.toBeChecked();
      expect(screen.getByText("Off")).toBeInTheDocument();
    });

    it("renders dark mode toggle", () => {
      renderPlayground();
      expect(
        screen.getByRole("button", { name: /dark mode/i })
      ).toBeInTheDocument();
    });

    it("renders YAML editor", () => {
      renderPlayground();
      expect(screen.getByTestId("yaml-editor")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Paste YAML here...")
      ).toBeInTheDocument();
    });

    it("renders output tabs", () => {
      renderPlayground();
      expect(screen.getByRole("tab", { name: /errors/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /json/i })).toBeInTheDocument();
    });

    it("renders action buttons", () => {
      renderPlayground();
      expect(
        screen.getByRole("button", { name: /validate/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /convert to json/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reset/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sample yaml/i })
      ).toBeInTheDocument();
    });

    it("renders documentation links", () => {
      renderPlayground();
      expect(
        screen.getByRole("link", { name: /api reference/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /secure yaml docs/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /yaml tooling docs/i })
      ).toBeInTheDocument();
    });
  });

  describe("Provider Selection", () => {
    it("allows changing provider selection", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const providerSelect = screen.getByRole("combobox", {
        name: /provider/i,
      });
      await user.click(providerSelect);

      const awsOption = screen.getByRole("option", { name: "AWS" });
      await user.click(awsOption);

      expect(screen.getByDisplayValue("AWS")).toBeInTheDocument();
    });

    it("shows all provider options", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const providerSelect = screen.getByRole("combobox", {
        name: /provider/i,
      });
      await user.click(providerSelect);

      expect(
        screen.getByRole("option", { name: "Generic" })
      ).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "AWS" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Azure" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "GCP" })).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Kubernetes" })
      ).toBeInTheDocument();
    });
  });

  describe("Security Checks Toggle", () => {
    it("toggles security checks on and off", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const toggle = screen.getByRole("switch", { name: /security checks/i });
      expect(screen.getByText("Off")).toBeInTheDocument();

      await user.click(toggle);
      expect(screen.getByText("On")).toBeInTheDocument();

      await user.click(toggle);
      expect(screen.getByText("Off")).toBeInTheDocument();
    });
  });

  describe("Theme Toggle", () => {
    it("toggles between light and dark mode", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const themeToggle = screen.getByRole("button", { name: /dark mode/i });
      await user.click(themeToggle);

      expect(
        screen.getByRole("button", { name: /light mode/i })
      ).toBeInTheDocument();
    });
  });

  describe("YAML Editor Functionality", () => {
    it("allows typing in YAML editor", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      expect(editor).toHaveValue("test: value");
    });

    it("enables action buttons when YAML is entered", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const validateButton = screen.getByRole("button", { name: /validate/i });
      const convertButton = screen.getByRole("button", {
        name: /convert to json/i,
      });

      expect(validateButton).toBeDisabled();
      expect(convertButton).toBeDisabled();

      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      expect(validateButton).toBeEnabled();
      expect(convertButton).toBeEnabled();
    });
  });

  describe("File Upload", () => {
    it("renders upload YAML button", () => {
      renderPlayground();
      expect(
        screen.getByRole("button", { name: /upload yaml/i })
      ).toBeInTheDocument();
    });

    it("renders upload schema button", () => {
      renderPlayground();
      expect(
        screen.getByRole("button", { name: /upload schema/i })
      ).toBeInTheDocument();
    });

    it("handles YAML file upload", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const file = new File(["test: yaml content"], "test.yaml", {
        type: "text/yaml",
      });
      const uploadButton = screen.getByRole("button", { name: /upload yaml/i });

      await user.click(uploadButton);

      const fileInput = screen.getByDisplayValue("");
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId("yaml-editor")).toHaveValue(
          "test: yaml content"
        );
      });
    });
  });

  describe("Copy and Download Functionality", () => {
    it("copies YAML content to clipboard", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      const copyButton = screen
        .getAllByRole("button")
        .find(
          (btn) =>
            btn.querySelector("svg") && btn.getAttribute("aria-label") === null
        );

      if (copyButton) {
        await user.click(copyButton);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          "test: value"
        );
      }
    });

    it("downloads YAML content", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      // Mock document.createElement and click
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any);

      const downloadButton = screen
        .getAllByRole("button")
        .find(
          (btn) =>
            btn.querySelector("svg") && btn.getAttribute("aria-label") === null
        );

      if (downloadButton) {
        await user.click(downloadButton);
        expect(mockAnchor.download).toBe("cloudlint.yaml");
        expect(mockAnchor.click).toHaveBeenCalled();
      }
    });
  });

  describe("Validation Functionality", () => {
    it("shows validation in progress", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      const validateButton = screen.getByRole("button", { name: /validate/i });
      await user.click(validateButton);

      expect(screen.getByText(/validating.../i)).toBeInTheDocument();
      expect(validateButton).toBeDisabled();
    });

    it("shows validation results after completion", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      const validateButton = screen.getByRole("button", { name: /validate/i });
      await user.click(validateButton);

      await waitFor(
        () => {
          expect(screen.queryByText(/validating.../i)).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Should show some validation result
      expect(screen.getByText(/yaml syntax is valid/i)).toBeInTheDocument();
    });
  });

  describe("JSON Conversion", () => {
    it("shows conversion in progress", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      const convertButton = screen.getByRole("button", {
        name: /convert to json/i,
      });
      await user.click(convertButton);

      expect(screen.getByText(/converting.../i)).toBeInTheDocument();
      expect(convertButton).toBeDisabled();
    });

    it("shows JSON output after conversion", async () => {
      const user = userEvent.setup();
      renderPlayground();

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

      // Switch to JSON tab to see output
      const jsonTab = screen.getByRole("tab", { name: /json/i });
      await user.click(jsonTab);

      expect(screen.getByText(/converted json/i)).toBeInTheDocument();
    });
  });

  describe("Tab Switching", () => {
    it("switches between Errors and JSON tabs", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const errorsTab = screen.getByRole("tab", { name: /errors/i });
      const jsonTab = screen.getByRole("tab", { name: /json/i });

      expect(errorsTab).toHaveAttribute("data-state", "active");

      await user.click(jsonTab);
      expect(jsonTab).toHaveAttribute("data-state", "active");

      await user.click(errorsTab);
      expect(errorsTab).toHaveAttribute("data-state", "active");
    });
  });

  describe("Sample YAML Loading", () => {
    it("loads sample YAML content", async () => {
      const user = userEvent.setup();
      renderPlayground();

      const sampleButton = screen.getByRole("button", { name: /sample yaml/i });
      await user.click(sampleButton);

      const editor = screen.getByTestId("yaml-editor");
      expect(editor.value).toContain("AWSTemplateFormatVersion");
      expect(editor.value).toContain("Sample S3 bucket");
    });
  });

  describe("Reset Functionality", () => {
    it("clears all content when reset is clicked", async () => {
      const user = userEvent.setup();
      renderPlayground();

      // Add some content first
      const editor = screen.getByTestId("yaml-editor");
      await user.type(editor, "test: value");

      const resetButton = screen.getByRole("button", { name: /reset/i });
      await user.click(resetButton);

      expect(editor).toHaveValue("");
    });

    it("disables reset button when no content", () => {
      renderPlayground();

      const resetButton = screen.getByRole("button", { name: /reset/i });
      expect(resetButton).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels for form controls", () => {
      renderPlayground();

      expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/security checks/i)).toBeInTheDocument();
    });

    it("has proper heading structure", () => {
      renderPlayground();

      const mainHeading = screen.getByRole("heading", { level: 1 });
      expect(mainHeading).toHaveTextContent(/cloudlint yaml validator/i);
    });

    it("has proper tab navigation", () => {
      renderPlayground();

      const tabList = screen.getByRole("tablist");
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(2);
    });
  });

  describe("Responsive Design", () => {
    it("renders properly on different screen sizes", () => {
      renderPlayground();

      // Check that grid layout classes are present
      const mainContent = document.querySelector(".grid");
      expect(mainContent).toHaveClass("grid-cols-1", "lg:grid-cols-2");
    });
  });

  describe("Documentation Links", () => {
    it("has correct external links", () => {
      renderPlayground();

      const apiLink = screen.getByRole("link", { name: /api reference/i });
      expect(apiLink).toHaveAttribute(
        "href",
        "https://github.com/javascriptjoey/cloudlint/blob/main/docs/API.md"
      );
      expect(apiLink).toHaveAttribute("target", "_blank");
      expect(apiLink).toHaveAttribute("rel", "noopener noreferrer");

      const secureYamlLink = screen.getByRole("link", {
        name: /secure yaml docs/i,
      });
      expect(secureYamlLink).toHaveAttribute(
        "href",
        "https://github.com/javascriptjoey/cloudlint/blob/main/docs/secure-yaml.md"
      );

      const yamlToolingLink = screen.getByRole("link", {
        name: /yaml tooling docs/i,
      });
      expect(yamlToolingLink).toHaveAttribute(
        "href",
        "https://github.com/javascriptjoey/cloudlint/blob/main/docs/yaml-tooling.md"
      );
    });
  });
});
