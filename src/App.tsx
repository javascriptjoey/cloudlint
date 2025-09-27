import { Button } from "@/components/ui/button"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <Button>Click me</Button>
        <p className="text-muted-foreground">
          Toggle between light and dark mode using the button in the top right
        </p>
      </div>
    </ThemeProvider>
  )
}

export default App
