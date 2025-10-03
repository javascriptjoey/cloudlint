import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import PlaygroundNew from "@/pages/PlaygroundNew";

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

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider defaultTheme="light" storageKey="test-theme">
    {children}
  </ThemeProvider>
);

const renderPlayground = () => {
  return render(
    <BrowserRouter>
      <MockThemeProvider>
        <PlaygroundNew />
      </MockThemeProvider>
    </BrowserRouter>
  );
};

describe("PlaygroundNew Basic Tests", () => {
  it("renders without crashing", () => {
    renderPlayground();
    expect(
      screen.getByRole("heading", { name: /cloudlint yaml validator/i })
    ).toBeInTheDocument();
  });

  it("renders main UI elements", () => {
    renderPlayground();

    // Check main sections
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
