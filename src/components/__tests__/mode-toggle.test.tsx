import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";

// Mock the theme provider with unique storage key for each test
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Use a unique storage key to prevent test interference
  const storageKey = `test-theme-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <ThemeProvider defaultTheme="light" storageKey={storageKey}>
      {children}
    </ThemeProvider>
  );
};

describe("ModeToggle", () => {
  it("renders the theme toggle button", () => {
    render(
      <MockThemeProvider>
        <ModeToggle />
      </MockThemeProvider>
    );

    expect(
      screen.getByRole("button", { name: /toggle theme/i })
    ).toBeInTheDocument();
  });

  it("shows theme options when clicked", async () => {
    const user = userEvent.setup();

    render(
      <MockThemeProvider>
        <ModeToggle />
      </MockThemeProvider>
    );

    const toggleButton = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(toggleButton);

    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("contains sun and moon icons", () => {
    render(
      <MockThemeProvider>
        <ModeToggle />
      </MockThemeProvider>
    );

    const button = screen.getByRole("button", { name: /toggle theme/i });
    // Check if SVG icons are present (Lucide icons render as SVGs)
    const svgs = button.querySelectorAll("svg");
    expect(svgs).toHaveLength(2); // Sun and Moon icons
  });
});
