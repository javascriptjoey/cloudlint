# Frontend Development Guide

## Overview

The Cloudlint frontend is built with React 19, TypeScript, and modern web technologies. This guide covers the frontend architecture, component structure, and development practices.

## Technology Stack

### Core Technologies

- **React 19**: Latest React with concurrent features
- **TypeScript**: Static type checking and enhanced developer experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework

### UI Components

- **Radix UI**: Accessible, unstyled component primitives
- **CodeMirror 6**: Professional code editor
- **Lucide React**: Modern icon library
- **Sonner**: Toast notification system

### Routing & State

- **React Router 7**: Client-side routing
- **React Context**: Global state management (theme)
- **Local State**: Component-specific state with hooks

## Project Structure

```
src/
├── components/
│   ├── ui/                 # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── CodeMirrorYamlEditor.tsx
│   ├── Footer.tsx
│   ├── Navbar.tsx
│   ├── Seo.tsx
│   └── theme-provider.tsx
├── pages/
│   ├── Home.tsx
│   ├── Contact.tsx
│   └── PlaygroundSimple.tsx
├── lib/
│   ├── apiClient.ts
│   └── utils.ts
├── types/
│   └── global.d.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Component Architecture

### Component Categories

#### 1. UI Components (`src/components/ui/`)

Base components built on Radix UI primitives with Tailwind styling.

```typescript
// Example: Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

#### 2. Feature Components (`src/components/`)

Application-specific components with business logic.

```typescript
// Example: CodeMirrorYamlEditor
interface CodeMirrorYamlEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CodeMirrorYamlEditor = forwardRef<
  CodeMirrorYamlEditorRef,
  CodeMirrorYamlEditorProps
>(({ value, onChange, placeholder, className, disabled = false }, ref) => {
  // CodeMirror setup and configuration
});
```

#### 3. Page Components (`src/pages/`)

Top-level route components that compose the application views.

```typescript
// Example: PlaygroundSimple
export default function PlaygroundSimple() {
  const [yaml, setYaml] = useState("")
  const [isValidating, setIsValidating] = useState(false)

  // Memoized handlers for performance
  const handleValidate = useCallback(() => {
    // validation logic
  }, [yaml])

  return (
    <>
      <Seo title="Cloudlint • YAML Playground" />
      {/* Component JSX */}
    </>
  )
}
```

## State Management

### Local State Pattern

```typescript
// Component state with hooks
const [yaml, setYaml] = useState("");
const [jsonOutput, setJsonOutput] = useState<string | null>(null);
const [isValidating, setIsValidating] = useState(false);

// Derived state
const hasContent = yaml.trim().length > 0;
const canValidate = hasContent && !isValidating;
```

### Global State (Theme)

```typescript
// Theme context provider
const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({ children, defaultTheme = "system" }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  // Theme persistence and system preference handling
  useEffect(() => {
    // Apply theme to document
  }, [theme])

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
```

## Performance Optimization

### Code Splitting

```typescript
// Route-based code splitting
const Home = lazy(() => import("@/pages/Home"))
const Contact = lazy(() => import("@/pages/Contact"))
const Playground = lazy(() => import("@/pages/PlaygroundSimple"))

// Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/playground" element={<Playground />} />
    <Route path="/contact" element={<Contact />} />
  </Routes>
</Suspense>
```

### Memoization

```typescript
// Memoized callbacks to prevent unnecessary re-renders
const handleValidate = useCallback(() => {
  if (!yaml.trim()) return;
  setIsValidating(true);
  // validation logic
}, [yaml]);

// Memoized values
const sampleYaml = useMemo(
  () => `
  # Sample YAML content
  name: example
  version: 1.0.0
`,
  []
);
```

### Bundle Optimization

- Tree shaking for unused code elimination
- Dynamic imports for large dependencies
- Asset optimization with Vite

## Styling Approach

### Tailwind CSS

```typescript
// Utility-first approach
<div className="container mx-auto px-4 py-8">
  <Card className="w-full max-w-2xl">
    <CardHeader>
      <CardTitle className="text-2xl font-bold">YAML Editor</CardTitle>
    </CardHeader>
  </Card>
</div>
```

### Component Variants

```typescript
// Using class-variance-authority for component variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
);
```

## Accessibility Implementation

### Semantic HTML

```typescript
// Proper heading hierarchy and landmarks
<main>
  <section aria-labelledby="playground-title">
    <h1 id="playground-title">YAML Playground</h1>
    <div role="region" aria-label="YAML Editor">
      <CodeMirrorYamlEditor aria-label="YAML input" />
    </div>
  </section>
</main>
```

### ARIA Labels and Roles

```typescript
// Screen reader support
<button
  aria-label="Validate YAML content"
  aria-describedby="validation-help"
  disabled={!canValidate}
>
  {isValidating ? "Validating..." : "Validate"}
</button>

<div id="validation-help" className="sr-only">
  Click to validate your YAML content for syntax errors
</div>
```

### Keyboard Navigation

```typescript
// Focus management
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && event.ctrlKey) {
    handleValidate()
  }
}

// Tab order and focus indicators
<div className="focus-within:ring-2 focus-within:ring-ring">
  <input className="focus:outline-none focus:ring-2 focus:ring-ring" />
</div>
```

## API Integration

### API Client

```typescript
// Centralized API client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async validateYaml(yaml: string, options?: ValidationOptions) {
    const response = await fetch(`${this.baseURL}/api/yaml/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yaml, ...options }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }
}
```

### Error Handling

```typescript
// Component error handling
const [error, setError] = useState<string | null>(null);

const handleValidate = async () => {
  try {
    setError(null);
    setIsValidating(true);

    const result = await apiClient.validateYaml(yaml);
    // handle success
  } catch (err) {
    setError(err instanceof Error ? err.message : "Validation failed");
  } finally {
    setIsValidating(false);
  }
};
```

## Testing Approach

### Component Testing

```typescript
// Testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react'
import { PlaygroundSimple } from './PlaygroundSimple'

test('validates YAML when button is clicked', async () => {
  render(<PlaygroundSimple />)

  const editor = screen.getByLabelText('YAML input')
  const validateButton = screen.getByRole('button', { name: /validate/i })

  fireEvent.change(editor, { target: { value: 'test: yaml' } })
  fireEvent.click(validateButton)

  expect(screen.getByText('Validating...')).toBeInTheDocument()
})
```

### Accessibility Testing

```typescript
// Automated accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('playground has no accessibility violations', async () => {
  const { container } = render(<PlaygroundSimple />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Development Workflow

### Local Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Code Quality

- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Husky**: Git hooks for pre-commit checks

### Hot Module Replacement

Vite provides fast HMR for instant feedback during development:

- Component changes reflect immediately
- State is preserved across updates
- CSS changes apply without page refresh

## Best Practices

### Component Design

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Use composition patterns
3. **Props Interface**: Well-defined TypeScript interfaces
4. **Error Boundaries**: Graceful error handling

### Performance

1. **Lazy Loading**: Route-based code splitting
2. **Memoization**: Prevent unnecessary re-renders
3. **Bundle Analysis**: Monitor bundle size
4. **Image Optimization**: Optimized assets

### Accessibility

1. **Semantic HTML**: Use appropriate HTML elements
2. **ARIA Labels**: Provide screen reader context
3. **Keyboard Navigation**: Full keyboard support
4. **Color Contrast**: Meet WCAG guidelines

### Code Organization

1. **Consistent Naming**: Clear, descriptive names
2. **File Structure**: Logical organization
3. **Import Order**: Consistent import organization
4. **Type Safety**: Comprehensive TypeScript usage
