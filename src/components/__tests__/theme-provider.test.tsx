import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { localStorageMock, matchMediaMock } from "../../../tests/setup";

// Test component that uses the theme
const TestComponent = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
};

describe("ThemeProvider", () => {
  // Each test gets its own container for better isolation
  let container: HTMLDivElement
  
  beforeEach(() => {
    // Create a fresh container for each test
    container = document.createElement('div')
    document.body.appendChild(container)
  })
  
  afterEach(() => {
    // Clean up the container
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  it("provides default theme", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>,
      { container }
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
  });

  it("allows theme changes", async () => {
    const user = userEvent.setup();

    const { getByText, getByTestId } = render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>,
      { container }
    );

    await user.click(getByText("Set Dark"));
    expect(getByTestId("current-theme")).toHaveTextContent("dark");
  });

  it("applies theme classes to document", async () => {
    const user = userEvent.setup();

    const { getByText } = render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>,
      { container }
    );

    await user.click(getByText("Set Dark"));
    expect(document.documentElement).toHaveClass("dark");

    await user.click(getByText("Set Light"));
    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("persists theme to localStorage", async () => {
    const user = userEvent.setup();

    const { getByText } = render(
      <ThemeProvider storageKey="test-theme">
        <TestComponent />
      </ThemeProvider>,
      { container }
    );

    await user.click(getByText("Set Dark"));
    expect(localStorageMock.setItem).toHaveBeenCalledWith("test-theme", "dark");
  });

  it("loads theme from localStorage", () => {
    // Mock localStorage to return a saved theme
    localStorageMock.getItem.mockReturnValue("dark");

    const { getByTestId } = render(
      <ThemeProvider storageKey="test-theme">
        <TestComponent />
      </ThemeProvider>,
      { container }
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith("test-theme");
    expect(getByTestId("current-theme")).toHaveTextContent("dark");
  });

  it("handles system theme detection", async () => {
    const user = userEvent.setup();
    
    // Mock system preference for dark mode
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { getByText } = render(
      <ThemeProvider defaultTheme="system">
        <TestComponent />
      </ThemeProvider>,
      { container }
    );

    await user.click(getByText("Set System"));
    expect(document.documentElement).toHaveClass("dark");
  });

  it("throws error when useTheme is used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Create a component that will trigger the error
    const ErrorComponent = () => {
      useTheme(); // This should throw
      return <div>Should not render</div>;
    };

    expect(() => {
      render(<ErrorComponent />);
    }).toThrow("useTheme must be used within a ThemeProvider");

    consoleSpy.mockRestore();
  });
});
