import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import PlaygroundSimple from "@/pages/PlaygroundSimple";

// Mock the CodeMirror component
vi.mock("@/components/CodeMirrorYamlEditor", () => ({
  CodeMirrorYamlEditor: ({ value, onChange, placeholder }: any) => (
    <textarea
      data-testid="yaml-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider defaultTheme="light" storageKey="test-theme">
    {children}
  </ThemeProvider>
);

const renderPlayground = () => {
  return render(
    <BrowserRouter>
      <MockThemeProvider>
        <PlaygroundSimple />
      </MockThemeProvider>
    </BrowserRouter>
  );
};

describe("PlaygroundSimple", () => {
  it("renders without crashing", () => {
    renderPlayground();
    expect(
      screen.getByRole("heading", { name: /cloudlint yaml validator/i })
    ).toBeInTheDocument();
  });

  it("renders main UI elements", () => {
    renderPlayground();

    expect(
      screen.getByText(
        /validate and auto-fix yaml optimized for aws, azure, and more/i
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("yaml-editor")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /validate/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /convert to json/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /load sample/i })
    ).toBeInTheDocument();
  });

  it("loads sample YAML when button is clicked", async () => {
    const user = userEvent.setup();
    renderPlayground();

    const loadSampleButton = screen.getByRole("button", {
      name: /load sample/i,
    });
    await user.click(loadSampleButton);

    const editor = screen.getByTestId("yaml-editor");
    expect(editor.value).toContain("cloudlint-example");
  });

  it("enables buttons when YAML content is present", async () => {
    const user = userEvent.setup();
    renderPlayground();

    const editor = screen.getByTestId("yaml-editor");
    const validateButton = screen.getByRole("button", { name: /validate/i });
    const convertButton = screen.getByRole("button", {
      name: /convert to json/i,
    });

    expect(validateButton).toBeDisabled();
    expect(convertButton).toBeDisabled();

    await user.type(editor, "test: value");

    expect(validateButton).toBeEnabled();
    expect(convertButton).toBeEnabled();
  });

  it("toggles security checks", async () => {
    const user = userEvent.setup();
    renderPlayground();

    const securityButton = screen.getByRole("button", { name: /off/i });
    await user.click(securityButton);

    expect(screen.getByRole("button", { name: /on/i })).toBeInTheDocument();
  });

  it("toggles theme", async () => {
    const user = userEvent.setup();
    renderPlayground();

    const themeButton = screen.getByRole("button", { name: /dark mode/i });
    await user.click(themeButton);

    expect(
      screen.getByRole("button", { name: /light mode/i })
    ).toBeInTheDocument();
  });

  it("switches between tabs", async () => {
    const user = userEvent.setup();
    renderPlayground();

    const validationTab = screen.getByRole("tab", { name: /validation/i });
    const jsonTab = screen.getByRole("tab", { name: /json output/i });

    expect(validationTab).toHaveAttribute("data-state", "active");

    await user.click(jsonTab);
    expect(jsonTab).toHaveAttribute("data-state", "active");
  });

  it("converts YAML to JSON", async () => {
    const user = userEvent.setup();
    renderPlayground();

    const editor = screen.getByTestId("yaml-editor");
    await user.type(editor, "test: value");

    const convertButton = screen.getByRole("button", {
      name: /convert to json/i,
    });
    await user.click(convertButton);

    const jsonTab = screen.getByRole("tab", { name: /json output/i });
    await user.click(jsonTab);

    expect(screen.getByText(/json output/i)).toBeInTheDocument();
  });

  it("resets content", async () => {
    const user = userEvent.setup();
    renderPlayground();

    const editor = screen.getByTestId("yaml-editor");
    await user.type(editor, "test: value");

    const resetButton = screen.getByRole("button", { name: /reset/i });
    await user.click(resetButton);

    expect(editor.value).toBe("");
  });
});
