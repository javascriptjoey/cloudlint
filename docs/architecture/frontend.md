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

## Backend Integration

### Custom Hooks Architecture

The frontend uses a comprehensive set of custom hooks for backend integration:

#### 1. **useValidation** - Real-time YAML Validation

```typescript
// Real-time validation with caching and debouncing
const validation = useValidation(yaml, {
  provider: "aws",
  securityChecks: true,
  realTime: true,
  debounceDelay: 1500, // 1.5s debounce
});

// Access validation state
const {
  isValidating,
  results,
  error,
  hasErrors,
  errorCount,
  warningCount,
  provider,
  validate,
  clearValidation,
} = validation;
```

**Features:**

- Real-time validation with intelligent debouncing (1.5s)
- Client-side caching with TTL (5 minutes)
- Request deduplication to prevent duplicate API calls
- Automatic provider detection
- Comprehensive error handling with retry logic

#### 2. **useAutoFix** - Auto-fix with Diff Preview

```typescript
// Auto-fix with user confirmation workflow
const autoFix = useAutoFix();

// Generate fix with diff preview
await autoFix.generateFix(yaml, {
  spectralFix: true,
  prettier: true,
});

// Access auto-fix state
const {
  isFixing,
  fixedContent,
  fixesApplied,
  diff,
  canApply,
  hasChanges,
  getFixedContent,
  clearAutoFix,
} = autoFix;
```

**Features:**

- Multi-stage fixing pipeline (EOL → tabs → anchors → typos → prettier)
- Unified diff preview before applying
- User confirmation workflow
- 7+ fix types supported
- Safe, non-destructive transformations

#### 3. **useProviderDetection** - Intelligent Provider Detection

```typescript
// Automatic provider detection with confidence scoring
const { provider, confidence, reasons } = useProviderDetection(yaml);

// Provider types: 'aws' | 'azure' | 'generic'
// Confidence: 0-1 (0.9 = 90% confidence)
```

**Features:**

- AWS CloudFormation detection (90%+ confidence)
- Azure Pipelines detection (80%+ confidence)
- Generic YAML fallback
- Confidence scoring based on heuristics
- Client-side detection for instant feedback

#### 4. **useSuggestions** - Provider-Aware Suggestions

```typescript
// Provider-aware suggestions with confidence scoring
const suggestions = useSuggestions(yaml, "aws");

await suggestions.loadSuggestions();

// Access suggestions
const {
  suggestions: suggestionList,
  provider,
  isLoading,
  applySuggestions,
  getCategorizedSuggestions,
  getSuggestionStats,
} = suggestions;
```

**Features:**

- AWS CloudFormation suggestions (resource types, properties)
- Azure Pipelines suggestions (tasks, configuration)
- Confidence scoring (0-1)
- Batch application of multiple suggestions
- Categorized by type (add, rename, type)

#### 5. **useValidationCache** - Performance Optimization

```typescript
// LRU cache with TTL for validation results
const { getCached, setCached, clearAllCache, getCacheStats } =
  useValidationCache();

// Cache statistics
const stats = getCacheStats();
// { entryCount, totalSize, totalHits, averageAge, hitRate }
```

**Features:**

- LRU (Least Recently Used) eviction
- TTL (Time To Live) expiration (5 minutes)
- Memory-aware caching based on content size
- Hit count tracking for analytics
- Maximum 100 cache entries

### Enhanced API Client

```typescript
// Enterprise-grade API client with retry logic
class ApiClient {
  private baseURL: string;
  private timeout: number = 30000;
  private retries: number = 3;
  private retryDelay: number = 1000;
  private activeRequests = new Map<string, Promise<unknown>>();

  // Request with retry logic and error handling
  private async request<T>(path: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }

      return response.json();
    } catch (error) {
      // Retry logic with exponential backoff
      if (error.retryable && retryCount < this.retries) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.request(path, { ...options, retryCount: retryCount + 1 });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Request deduplication
  private async deduplicatedRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key) as Promise<T>;
    }

    const promise = requestFn().finally(() => {
      this.activeRequests.delete(key);
    });

    this.activeRequests.set(key, promise);
    return promise;
  }

  // Validate YAML with caching
  async validate(yaml: string, options?: ValidationOptions) {
    const cacheKey = `validate-${this.hashContent(yaml)}-${JSON.stringify(options)}`;
    return this.deduplicatedRequest(cacheKey, () =>
      this.request("/validate", {
        method: "POST",
        body: JSON.stringify({ yaml, options }),
      })
    );
  }
}
```

**Features:**

- Retry logic with exponential backoff (3 retries)
- Request deduplication to prevent duplicate calls
- Timeout handling (30s default)
- Error classification (retryable vs non-retryable)
- Input sanitization for security
- Comprehensive error messages

### Real-time Validation Flow

```typescript
// Complete real-time validation implementation
export default function PlaygroundSimple() {
  const [yaml, setYaml] = useState("");
  const [realTimeValidation, setRealTimeValidation] = useState(false);

  // Real-time validation with backend integration
  const validation = useValidation(yaml, {
    provider: 'aws',
    securityChecks: true,
    realTime: realTimeValidation,
    debounceDelay: 1500
  });

  // Manual validation handler
  const handleValidate = useCallback(async () => {
    if (!yaml.trim()) {
      toast.error("Please enter some YAML content to validate");
      return;
    }

    try {
      const result = await validation.validate();

      if (result.ok) {
        toast.success("✅ Validation successful!");
      } else {
        const errorCount = result.messages.filter(m => m.severity === 'error').length;
        toast.error(`❌ Validation failed: ${errorCount} errors`);
      }

      // Auto-scroll to results
      setTimeout(() => scrollToResults(), 300);
    } catch (error) {
      toast.error(`Validation error: ${error.message}`);
    }
  }, [yaml, validation]);

  return (
    <div>
      {/* Real-time toggle */}
      <Switch
        checked={realTimeValidation}
        onCheckedChange={setRealTimeValidation}
      />

      {/* YAML Editor */}
      <CodeMirrorYamlEditor
        value={yaml}
        onChange={setYaml}
      />

      {/* Validate button (disabled when real-time is active) */}
      <Button
        onClick={handleValidate}
        disabled={!yaml.trim() || validation.isValidating || realTimeValidation}
      >
        {realTimeValidation ? "Real-time Active" : "Validate"}
      </Button>

      {/* Validation results */}
      {validation.results && (
        <ValidationResults results={validation.results} />
      )}
    </div>
  );
}
```

### Error Handling Strategy

```typescript
// Comprehensive error handling
const [error, setError] = useState<string | null>(null);

const handleValidate = async () => {
  try {
    setError(null);
    setIsValidating(true);

    const result = await api.validate(yaml, options);

    // Handle success
    setResults(result);
  } catch (err) {
    // Classify error type
    if (err instanceof ApiError) {
      if (err.status === 413) {
        setError("File too large. Maximum size is 2MB");
      } else if (err.status === 429) {
        setError("Too many requests. Please wait a moment.");
      } else if (err.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(err.message);
      }
    } else if (err.name === "AbortError") {
      setError("Request timeout. Please try again.");
    } else {
      setError("An unexpected error occurred");
    }

    // Show user-friendly toast
    toast.error(error);
  } finally {
    setIsValidating(false);
  }
};
```

### Performance Optimizations

#### 1. **Request Deduplication**

```typescript
// Prevent duplicate API calls for the same content
const activeRequests = new Map<string, Promise<unknown>>();

async function deduplicatedValidate(yaml: string) {
  const key = `validate-${hashContent(yaml)}`;

  if (activeRequests.has(key)) {
    return activeRequests.get(key);
  }

  const promise = api.validate(yaml);
  activeRequests.set(key, promise);

  promise.finally(() => activeRequests.delete(key));

  return promise;
}
```

#### 2. **Intelligent Caching**

```typescript
// Cache validation results with TTL
const cache = new Map<string, CacheEntry>();

function getCached(key: string): ValidateResponse | null {
  const entry = cache.get(key);

  if (!entry) return null;

  // Check if expired (5 minutes TTL)
  if (Date.now() - entry.timestamp > 5 * 60 * 1000) {
    cache.delete(key);
    return null;
  }

  entry.hits++; // Track cache hits
  return entry.data;
}
```

#### 3. **Debounced Real-time Validation**

```typescript
// Debounce real-time validation to reduce API calls
const debouncedValidate = useMemo(() => {
  let timeoutId: NodeJS.Timeout;

  return (content: string) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      validate(content);
    }, 1500); // 1.5s debounce
  };
}, [validate]);

// Cleanup on unmount
useEffect(() => {
  return () => debouncedValidate.cancel();
}, [debouncedValidate]);
```

### UX Enhancements

#### 1. **Sticky Action Buttons**

```typescript
// Always-visible action buttons at bottom
<section className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-lg">
  <div className="container mx-auto px-4 py-6">
    <div className="flex flex-wrap items-center justify-center gap-4">
      <Button onClick={handleValidate}>Validate</Button>
      <Button onClick={handleAutoFix}>Auto-fix</Button>
      <Button onClick={handleConvert}>Convert to JSON</Button>
    </div>
  </div>
</section>
```

#### 2. **Auto-scroll to Results**

```typescript
// Smooth scroll to results after validation
const scrollToResults = useCallback(() => {
  if (resultsRef.current) {
    resultsRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, []);

// Trigger after validation
await validation.validate();
setTimeout(() => scrollToResults(), 300);
```

#### 3. **Provider Detection UI**

```typescript
// Visual provider badge with confidence indicator
<Badge
  variant={confidence > 0.8 ? 'default' : 'outline'}
  style={
    provider === 'aws' && confidence > 0.5
      ? { backgroundColor: 'rgb(255, 153, 0)', color: 'rgb(35, 47, 62)' }
      : provider === 'azure' && confidence > 0.5
      ? { backgroundColor: 'rgb(0, 120, 212)', color: 'white' }
      : undefined
  }
>
  {provider}
  {confidence > 0 && (
    <span className="ml-1 text-xs opacity-75">
      ({Math.round(confidence * 100)}%)
    </span>
  )}
</Badge>
```

### Testing Backend Integration

```typescript
// Test real backend integration
import { renderHook, waitFor } from "@testing-library/react";
import { useValidation } from "@/hooks/useValidation";

test("useValidation calls real backend API", async () => {
  const { result } = renderHook(() => useValidation("name: test"));

  await act(async () => {
    await result.current.validate();
  });

  await waitFor(() => {
    expect(result.current.isValidating).toBe(false);
    expect(result.current.results).toBeDefined();
  });
});

// Test caching behavior
test("useValidation caches results", async () => {
  const { result } = renderHook(() => useValidation("name: test"));

  // First validation
  await result.current.validate();
  const firstCallTime = Date.now();

  // Second validation (should be cached)
  await result.current.validate();
  const secondCallTime = Date.now();

  // Second call should be instant (< 100ms)
  expect(secondCallTime - firstCallTime).toBeLessThan(100);
});
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
