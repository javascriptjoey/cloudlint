# Kiro's Backend Integration Action Plan

## Executive Summary

I, Kiro, will personally execute a comprehensive backend integration for Cloudlint, connecting the existing robust backend (145+ tests, production-ready) to the frontend that currently uses mock implementations. This plan details my exact step-by-step approach, TypeScript patterns, React hooks implementation, testing strategy, and documentation updates.

## Deep Analysis Findings

### Current Backend Capabilities (Fully Implemented)

- **Express Server**: Production-ready with security headers, CORS, rate limiting
- **Multi-tool YAML Validation**: yamllint, cfn-lint, spectral orchestration
- **Provider Detection**: AWS CloudFormation, Azure Pipelines, Generic YAML
- **Auto-fix Engine**: Prettier integration with intelligent YAML repair
- **Suggestion Systems**: Provider-aware suggestions with confidence scoring
- **Security Layer**: Content filtering, size limits, Docker sandboxing
- **Schema Validation**: JSON Schema validation with AJV
- **Comprehensive API**: 8 endpoints with full error handling

### Current Frontend State (Mock Implementation)

- **Complete UI**: All components implemented with shadcn/ui
- **API Client**: Well-structured but not connected to real backend
- **Mock Handlers**: MSW-based mocks for all endpoints
- **Testing Infrastructure**: 87 unit tests, comprehensive E2E testing
- **TypeScript Integration**: Strict typing throughout

### Integration Gap Analysis

The primary gap is the disconnect between the sophisticated backend and the mock frontend. The API client types don't fully match the backend response structure, and the frontend lacks proper error handling, loading states, and real-time validation capabilities.

## My Implementation Strategy

### Phase 1: Foundation & Core Integration (Days 1-3)

1. **API Client Alignment**: Update types to match backend exactly
2. **Environment Configuration**: Set up proper dev/prod API endpoints
3. **Basic Validation Integration**: Replace mock validation with real API
4. **Error Handling Framework**: Implement comprehensive error handling

### Phase 2: Advanced Features & Real-time (Days 4-6)

1. **Auto-fix Integration**: Connect auto-fix with diff preview
2. **Suggestion System**: Implement provider-aware suggestions
3. **Real-time Validation**: Add debounced validation with caching
4. **JSON Conversion**: Connect real YAML ↔ JSON conversion

### Phase 3: Performance & Polish (Days 7-9)

1. **Performance Optimization**: Implement caching and request deduplication
2. **Advanced Error Recovery**: Add retry logic and graceful degradation
3. **User Experience Polish**: Enhanced loading states and feedback
4. **Testing Updates**: Update all tests for real backend integration

### Phase 4: Documentation & Deployment (Days 10-12)

1. **Comprehensive Documentation**: Update all docs with new capabilities
2. **Integration Testing**: Full end-to-end testing with real backend
3. **Performance Benchmarking**: Establish and validate performance metrics
4. **Deployment Preparation**: Production-ready configuration

## Detailed Implementation Plan

### Step 1: API Client Type Alignment

I will update the API client to match the exact backend response structure:

```typescript
// src/lib/apiClient.ts - Updated types to match backend exactly
export type LintMessage = {
  source: "yamllint" | "cfn-lint" | "spectral" | "parser" | "azure-schema";
  path?: string;
  line?: number;
  column?: number;
  message: string;
  severity: "error" | "warning" | "info";
  ruleId?: string;
  kind?: "syntax" | "semantic" | "style";
  suggestion?: string;
};

export type ProviderSummary = {
  provider: "aws" | "azure" | "generic";
  sources: {
    azureSchemaPath?: string;
    cfnSpecPath?: string;
    spectralRulesetPath?: string;
    cfnLintDockerImage?: string;
  };
  counts: Partial<
    Record<
      LintMessage["source"],
      {
        errors: number;
        warnings: number;
        infos: number;
      }
    >
  >;
};

export type ValidateResponse = {
  ok: boolean;
  messages: LintMessage[];
  providerSummary?: ProviderSummary;
};

export type AutofixResponse = {
  content: string;
  fixesApplied: string[];
};

export type SdkSuggestion = {
  path: string;
  message: string;
  kind: "add" | "rename" | "type";
  confidence?: number;
};

export type SuggestResponse = {
  provider: "aws" | "azure" | "generic";
  suggestions: SdkSuggestion[];
  messages: LintMessage[];
};
```

### Step 2: Environment Configuration

I will set up proper environment configuration:

```typescript
// src/lib/config.ts - New configuration file
export const API_CONFIG = {
  baseURL:
    process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3001",
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
} as const;

export const VALIDATION_CONFIG = {
  debounceDelay: 1500,
  maxFileSize: 2 * 1024 * 1024, // 2MB
  maxLines: 15000,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
} as const;
```

### Step 3: Enhanced API Client Implementation

I will create a robust API client with proper error handling:

```typescript
// src/lib/apiClient.ts - Enhanced implementation
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  constructor(config: typeof API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.retries = config.retries;
    this.retryDelay = config.retryDelay;
  }

  private async request<T>(
    path: string,
    options: RequestInit & { retryCount?: number } = {}
  ): Promise<T> {
    const { retryCount = 0, ...requestOptions } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        ...requestOptions,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...requestOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new ApiError(
          this.getErrorMessage(response.status, errorText),
          response.status
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      // Retry logic for network errors
      if (retryCount < this.retries && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.request<T>(path, {
          ...options,
          retryCount: retryCount + 1,
        });
      }

      throw new ApiError(
        error instanceof Error ? error.message : "Network error",
        0
      );
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.name === "AbortError" ||
        error.message.includes("fetch") ||
        error.message.includes("network")
      );
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getErrorMessage(status: number, text: string): string {
    switch (status) {
      case 400:
        return `Invalid request: ${text}`;
      case 429:
        return "Too many requests. Please wait a moment before trying again.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return text || `HTTP ${status} error`;
    }
  }

  async validate(
    yaml: string,
    options: {
      provider?: "aws" | "azure" | "generic";
      securityChecks?: boolean;
      filename?: string;
    } = {}
  ): Promise<ValidateResponse> {
    return this.request<ValidateResponse>("/validate", {
      method: "POST",
      body: JSON.stringify({
        yaml,
        options: {
          provider: options.provider,
          relaxSecurity: !options.securityChecks,
          filename: options.filename,
        },
      }),
    });
  }

  // ... other methods with similar error handling
}

export const api = new ApiClient(API_CONFIG);
```

### Step 4: Custom React Hooks for State Management

I will create custom hooks for managing validation state:

```typescript
// src/hooks/useValidation.ts - Custom validation hook
export interface ValidationState {
  isValidating: boolean;
  results: ValidateResponse | null;
  error: string | null;
  lastValidated: Date | null;
}

export interface ValidationOptions {
  provider?: "aws" | "azure" | "generic";
  securityChecks?: boolean;
  filename?: string;
  realTime?: boolean;
  debounceDelay?: number;
}

export function useValidation(yaml: string, options: ValidationOptions = {}) {
  const [state, setState] = useState<ValidationState>({
    isValidating: false,
    results: null,
    error: null,
    lastValidated: null,
  });

  const { cache, getCached, setCached } = useValidationCache();
  const abortControllerRef = useRef<AbortController | null>(null);

  const validate = useCallback(
    async (content: string = yaml) => {
      if (!content.trim()) {
        setState((prev) => ({ ...prev, results: null, error: null }));
        return;
      }

      // Check cache first
      const cacheKey = `${content}-${JSON.stringify(options)}`;
      const cached = getCached(cacheKey);
      if (cached) {
        setState((prev) => ({
          ...prev,
          results: cached,
          error: null,
          lastValidated: new Date(),
        }));
        return cached;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setState((prev) => ({ ...prev, isValidating: true, error: null }));

      try {
        const results = await api.validate(content, {
          ...options,
          signal: abortControllerRef.current.signal,
        });

        setState((prev) => ({
          ...prev,
          isValidating: false,
          results,
          error: null,
          lastValidated: new Date(),
        }));

        // Cache successful results
        setCached(cacheKey, results);
        return results;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return; // Request was cancelled
        }

        const errorMessage =
          error instanceof ApiError ? error.message : "Validation failed";

        setState((prev) => ({
          ...prev,
          isValidating: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    [yaml, options, getCached, setCached]
  );

  // Real-time validation with debouncing
  const debouncedValidate = useMemo(
    () =>
      debounce(
        validate,
        options.debounceDelay ?? VALIDATION_CONFIG.debounceDelay
      ),
    [validate, options.debounceDelay]
  );

  useEffect(() => {
    if (options.realTime && yaml.trim()) {
      debouncedValidate(yaml);
    }

    return () => {
      debouncedValidate.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [yaml, options.realTime, debouncedValidate]);

  return {
    ...state,
    validate,
    validateAsync: validate,
  };
}
```

### Step 5: Validation Cache Hook

I will implement intelligent caching:

```typescript
// src/hooks/useValidationCache.ts - Caching hook
interface CacheEntry {
  data: ValidateResponse;
  timestamp: number;
  hits: number;
}

export function useValidationCache() {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const { cacheTimeout } = VALIDATION_CONFIG;

  const getCached = useCallback(
    (key: string): ValidateResponse | null => {
      const entry = cacheRef.current.get(key);
      if (!entry) return null;

      const isExpired = Date.now() - entry.timestamp > cacheTimeout;
      if (isExpired) {
        cacheRef.current.delete(key);
        return null;
      }

      // Update hit count for LRU
      entry.hits++;
      return entry.data;
    },
    [cacheTimeout]
  );

  const setCached = useCallback((key: string, data: ValidateResponse) => {
    // Implement LRU eviction if cache gets too large
    if (cacheRef.current.size >= 100) {
      const entries = Array.from(cacheRef.current.entries());
      const leastUsed = entries.reduce((min, [k, v]) =>
        v.hits < min[1].hits ? [k, v] : min
      );
      cacheRef.current.delete(leastUsed[0]);
    }

    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      hits: 1,
    });
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { getCached, setCached, clearCache };
}
```

### Step 6: Provider Detection Hook

I will create a hook for automatic provider detection:

```typescript
// src/hooks/useProviderDetection.ts - Provider detection hook
export function useProviderDetection(yaml: string) {
  const [provider, setProvider] = useState<"aws" | "azure" | "generic">(
    "generic"
  );
  const [confidence, setConfidence] = useState<number>(0);

  useEffect(() => {
    if (!yaml.trim()) {
      setProvider("generic");
      setConfidence(0);
      return;
    }

    // Client-side provider detection (basic heuristics)
    const content = yaml.toLowerCase();

    if (
      content.includes("awstemplateformatversion") ||
      (content.includes("resources:") && content.includes("type: aws::"))
    ) {
      setProvider("aws");
      setConfidence(0.9);
    } else if (
      content.includes("steps:") &&
      (content.includes("script:") || content.includes("task:"))
    ) {
      setProvider("azure");
      setConfidence(0.8);
    } else {
      setProvider("generic");
      setConfidence(0.5);
    }
  }, [yaml]);

  return { provider, confidence };
}
```

### Step 7: Auto-fix Hook with Diff Preview

I will implement auto-fix functionality:

```typescript
// src/hooks/useAutoFix.ts - Auto-fix hook
export interface AutoFixState {
  isFixing: boolean;
  fixedContent: string | null;
  fixesApplied: string[];
  diff: string | null;
  error: string | null;
}

export function useAutoFix() {
  const [state, setState] = useState<AutoFixState>({
    isFixing: false,
    fixedContent: null,
    fixesApplied: [],
    diff: null,
    error: null,
  });

  const autoFix = useCallback(async (yaml: string) => {
    if (!yaml.trim()) return;

    setState((prev) => ({ ...prev, isFixing: true, error: null }));

    try {
      const [fixResult, diffResult] = await Promise.all([
        api.autofix(yaml),
        api.diffPreview(yaml, ""), // Will be updated with fixed content
      ]);

      // Get actual diff with fixed content
      const actualDiff = await api.diffPreview(yaml, fixResult.content);

      setState((prev) => ({
        ...prev,
        isFixing: false,
        fixedContent: fixResult.content,
        fixesApplied: fixResult.fixesApplied,
        diff: actualDiff.diff,
        error: null,
      }));

      return fixResult;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : "Auto-fix failed";

      setState((prev) => ({
        ...prev,
        isFixing: false,
        error: errorMessage,
      }));

      throw error;
    }
  }, []);

  const clearAutoFix = useCallback(() => {
    setState({
      isFixing: false,
      fixedContent: null,
      fixesApplied: [],
      diff: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    autoFix,
    clearAutoFix,
  };
}
```

### Step 8: Suggestions Hook

I will implement the suggestion system:

```typescript
// src/hooks/useSuggestions.ts - Suggestions hook
export interface SuggestionsState {
  isLoading: boolean;
  suggestions: SdkSuggestion[];
  messages: LintMessage[];
  provider: "aws" | "azure" | "generic";
  error: string | null;
}

export function useSuggestions(
  yaml: string,
  provider?: "aws" | "azure" | "generic"
) {
  const [state, setState] = useState<SuggestionsState>({
    isLoading: false,
    suggestions: [],
    messages: [],
    provider: "generic",
    error: null,
  });

  const loadSuggestions = useCallback(async () => {
    if (!yaml.trim()) {
      setState((prev) => ({ ...prev, suggestions: [], messages: [] }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await api.suggest(yaml, provider);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        suggestions: result.suggestions,
        messages: result.messages,
        provider: result.provider,
        error: null,
      }));

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "Failed to load suggestions";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      throw error;
    }
  }, [yaml, provider]);

  const applySuggestions = useCallback(
    async (indexes: number[]) => {
      if (!indexes.length) return yaml;

      try {
        const result = await api.applySuggestions(
          yaml,
          indexes,
          state.provider
        );
        return result.content;
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : "Failed to apply suggestions";

        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [yaml, state.provider]
  );

  return {
    ...state,
    loadSuggestions,
    applySuggestions,
  };
}
```

### Step 9: Updated PlaygroundSimple Component

I will completely rewrite the PlaygroundSimple component:

```typescript
// src/pages/PlaygroundSimple.tsx - Complete rewrite with real backend integration
export default function PlaygroundSimple() {
  // Core state
  const [yaml, setYaml] = useState("");
  const [securityChecks, setSecurityChecks] = useState(false);
  const [realTimeValidation, setRealTimeValidation] = useState(false);
  const [jsonOutput, setJsonOutput] = useState<string | null>(null);

  // Provider detection
  const { provider, confidence } = useProviderDetection(yaml);

  // Validation with real backend
  const validation = useValidation(yaml, {
    provider,
    securityChecks,
    realTime: realTimeValidation,
  });

  // Auto-fix functionality
  const autoFix = useAutoFix();

  // Suggestions system
  const suggestions = useSuggestions(yaml, provider);

  // JSON conversion
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Sample YAML
  const sampleYaml = useMemo(
    () => `# CloudFormation Template
AWSTemplateFormatVersion: '2010-09-09'
Description: Sample CloudFormation template

Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-sample-bucket
      PublicReadPolicy: false
      
  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: my-sample-function
      Runtime: nodejs18.x
      Handler: index.handler
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            return { statusCode: 200, body: 'Hello World!' }
          }`,
    []
  );

  // Handlers
  const handleValidate = useCallback(async () => {
    if (!yaml.trim()) return;

    try {
      await validation.validate();
      toast.success(
        `Validation complete! Found ${validation.results?.messages.length || 0} messages`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Validation failed");
    }
  }, [yaml, validation]);

  const handleAutoFix = useCallback(async () => {
    if (!yaml.trim()) return;

    try {
      await autoFix.autoFix(yaml);
      toast.success(
        `Auto-fix complete! Applied ${autoFix.fixesApplied.length} fixes`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auto-fix failed");
    }
  }, [yaml, autoFix]);

  const handleApplyAutoFix = useCallback(() => {
    if (autoFix.fixedContent) {
      setYaml(autoFix.fixedContent);
      autoFix.clearAutoFix();
      toast.success("Auto-fix applied successfully!");
    }
  }, [autoFix]);

  const handleConvertToJson = useCallback(async () => {
    if (!yaml.trim()) return;

    setIsConverting(true);
    setConversionError(null);

    try {
      const result = await api.convert({ yaml });
      setJsonOutput(result.json || "{}");
      toast.success("YAML converted to JSON successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Conversion failed";
      setConversionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsConverting(false);
    }
  }, [yaml]);

  const handleLoadSuggestions = useCallback(async () => {
    if (!yaml.trim()) return;

    try {
      await suggestions.loadSuggestions();
      toast.success(`Found ${suggestions.suggestions.length} suggestions`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load suggestions"
      );
    }
  }, [yaml, suggestions]);

  // ... rest of component with enhanced UI
}
```

### Step 10: Testing Strategy Implementation

I will update all tests to work with the real backend:

```typescript
// tests/integration/api-integration.test.ts - New integration tests
describe("API Integration Tests", () => {
  let server: ReturnType<typeof createServer>;

  beforeAll(async () => {
    server = createServer();
    await new Promise<void>((resolve) => {
      const httpServer = server.listen(3002, () => resolve());
    });
  });

  afterAll(async () => {
    // Close server
  });

  test("validates YAML successfully", async () => {
    const yaml = "name: test\nversion: 1.0.0";
    const result = await api.validate(yaml);

    expect(result.ok).toBe(true);
    expect(result.messages).toBeDefined();
    expect(result.providerSummary).toBeDefined();
    expect(result.providerSummary?.provider).toBe("generic");
  });

  test("handles CloudFormation validation", async () => {
    const cfnYaml = `AWSTemplateFormatVersion: '2010-09-09'
Resources:
  MyBucket:
    Type: AWS::S3::Bucket`;

    const result = await api.validate(cfnYaml);
    expect(result.providerSummary?.provider).toBe("aws");
  });

  test("handles validation errors gracefully", async () => {
    const invalidYaml = "invalid: yaml: [\nbroken syntax";
    const result = await api.validate(invalidYaml);

    expect(result.ok).toBe(false);
    expect(result.messages.some((m) => m.severity === "error")).toBe(true);
  });

  test("auto-fix functionality works", async () => {
    const messyYaml = "foo:1\t\nbar:   2";
    const result = await api.autofix(messyYaml);

    expect(result.content).toBeDefined();
    expect(result.fixesApplied.length).toBeGreaterThan(0);
  });
});
```

### Step 11: E2E Test Updates

I will update E2E tests to work with real backend:

```typescript
// tests/e2e/playground-real-backend.spec.ts - Updated E2E tests
test.describe("Playground with Real Backend", () => {
  test("complete validation workflow", async ({ page }) => {
    await page.goto("/playground");

    // Load sample YAML
    await page.getByRole("button", { name: "Load Sample" }).click();

    // Validate with real backend
    await page.getByRole("button", { name: /Validate/ }).click();

    // Wait for real validation to complete
    await expect(page.getByText("Validating...")).toBeVisible();
    await page.waitForSelector('[data-testid="validation-results"]', {
      timeout: 10000,
    });

    // Verify real validation results
    const results = page.locator('[data-testid="validation-results"]');
    await expect(results).toBeVisible();

    // Check for provider detection
    const providerBadge = page.locator('[data-testid="provider-badge"]');
    await expect(providerBadge).toContainText(/AWS|Azure|Generic/);
  });

  test("auto-fix with diff preview", async ({ page }) => {
    await page.goto("/playground");

    // Enter messy YAML
    const messyYaml = "foo:1\t\nbar:   2\nbaz:\n- item1\n-item2";
    await page
      .locator('[data-testid="codemirror-yaml-editor"] textarea')
      .fill(messyYaml);

    // Trigger auto-fix
    await page.getByRole("button", { name: /Auto-fix/ }).click();

    // Wait for auto-fix to complete
    await expect(page.getByText("Auto-fixing...")).toBeVisible();
    await page.waitForSelector('[data-testid="diff-preview"]', {
      timeout: 10000,
    });

    // Verify diff preview is shown
    const diffPreview = page.locator('[data-testid="diff-preview"]');
    await expect(diffPreview).toBeVisible();

    // Apply the fix
    await page.getByRole("button", { name: "Apply Fix" }).click();

    // Verify YAML was updated
    const updatedYaml = await page
      .locator('[data-testid="codemirror-yaml-editor"] textarea')
      .inputValue();
    expect(updatedYaml).not.toBe(messyYaml);
  });

  test("provider-aware suggestions", async ({ page }) => {
    await page.goto("/playground");

    // Enter CloudFormation with typos
    const cfnWithTypos = `AWSTemplateFormatVersion: '2010-09-09'
Resources:
  MyBucket:
    Type: AWS::S3::Buckets
    Properties:
      BucketnName: my-bucket`;

    await page
      .locator('[data-testid="codemirror-yaml-editor"] textarea')
      .fill(cfnWithTypos);

    // Load suggestions
    await page.getByRole("button", { name: /Suggestions/ }).click();

    // Wait for suggestions to load
    await page.waitForSelector('[data-testid="suggestions-list"]', {
      timeout: 10000,
    });

    // Verify suggestions are shown
    const suggestions = page.locator(
      '[data-testid="suggestions-list"] .suggestion-item'
    );
    await expect(suggestions).toHaveCountGreaterThan(0);

    // Apply a suggestion
    await suggestions.first().getByRole("button", { name: "Apply" }).click();

    // Verify YAML was updated
    const updatedYaml = await page
      .locator('[data-testid="codemirror-yaml-editor"] textarea')
      .inputValue();
    expect(updatedYaml).toContain("AWS::S3::Bucket"); // Fixed typo
  });
});
```

### Step 12: Performance Testing

I will implement performance benchmarks:

```typescript
// tests/performance/validation-performance.spec.ts - Performance tests
test.describe("Validation Performance", () => {
  test("validates small YAML files quickly", async ({ page }) => {
    await page.goto("/playground");

    const smallYaml =
      "name: test\nversion: 1.0.0\ndescription: Small test file";
    await page
      .locator('[data-testid="codemirror-yaml-editor"] textarea')
      .fill(smallYaml);

    const startTime = Date.now();
    await page.getByRole("button", { name: /Validate/ }).click();
    await page.waitForSelector('[data-testid="validation-results"]');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000); // 2 second budget
    console.log(`Small YAML validation: ${duration}ms`);
  });

  test("handles large YAML files within performance budget", async ({
    page,
  }) => {
    await page.goto("/playground");

    // Generate large YAML (1000 lines)
    const largeYaml = Array.from(
      { length: 1000 },
      (_, i) =>
        `item_${i}:\n  name: "Item ${i}"\n  value: ${i}\n  enabled: true`
    ).join("\n");

    await page
      .locator('[data-testid="codemirror-yaml-editor"] textarea')
      .fill(largeYaml);

    const startTime = Date.now();
    await page.getByRole("button", { name: /Validate/ }).click();
    await page.waitForSelector('[data-testid="validation-results"]', {
      timeout: 30000,
    });
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(15000); // 15 second budget for large files
    console.log(`Large YAML validation: ${duration}ms`);
  });

  test("real-time validation performance", async ({ page }) => {
    await page.goto("/playground");

    // Enable real-time validation
    await page.getByRole("switch", { name: /Real-time/ }).click();

    const yaml = "name: test\nversion: 1.0.0";

    const startTime = Date.now();
    await page
      .locator('[data-testid="codemirror-yaml-editor"] textarea')
      .fill(yaml);

    // Wait for debounced validation
    await page.waitForTimeout(2000); // Wait for debounce
    await page.waitForSelector('[data-testid="validation-results"]');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // 5 second budget including debounce
    console.log(`Real-time validation: ${duration}ms`);
  });
});
```

### Step 13: Documentation Updates

I will create comprehensive documentation:

````markdown
# docs/backend-integration.md - New documentation

# Backend Integration Guide

## Overview

Cloudlint now features full backend integration, connecting the React frontend to a robust Express.js backend with comprehensive YAML validation capabilities.

## Features

### Real-time Validation

- Debounced validation with 1.5-second delay
- Client-side caching for improved performance
- Automatic provider detection (AWS, Azure, Generic)

### Multi-tool Validation

- **yamllint**: General YAML syntax and style validation
- **cfn-lint**: AWS CloudFormation template validation
- **spectral**: Custom rule-based validation
- **Azure Pipelines**: Schema-based Azure validation

### Auto-fix Capabilities

- Prettier-based formatting
- Intelligent YAML repair
- Diff preview before applying fixes
- Provider-specific typo corrections

### Suggestion System

- Provider-aware suggestions
- Confidence scoring for recommendations
- Batch application of suggestions
- Detailed explanations for each suggestion

## API Endpoints

### POST /validate

Validates YAML content with comprehensive analysis.

**Request:**

```json
{
  "yaml": "string",
  "options": {
    "provider": "aws|azure|generic",
    "securityChecks": boolean,
    "filename": "string"
  }
}
```
````

**Response:**

```json
{
  "ok": boolean,
  "messages": [
    {
      "source": "yamllint|cfn-lint|spectral|parser|azure-schema",
      "line": number,
      "column": number,
      "message": "string",
      "severity": "error|warning|info",
      "ruleId": "string"
    }
  ],
  "providerSummary": {
    "provider": "aws|azure|generic",
    "sources": {
      "cfnSpecPath": "string",
      "azureSchemaPath": "string"
    },
    "counts": {
      "yamllint": { "errors": 0, "warnings": 2, "infos": 0 }
    }
  }
}
```

## Usage Examples

### Basic Validation

```typescript
import { api } from "@/lib/apiClient";

const result = await api.validate(yamlContent, {
  provider: "aws",
  securityChecks: true,
});

if (result.ok) {
  console.log("YAML is valid!");
} else {
  console.log("Validation errors:", result.messages);
}
```

### Auto-fix with Preview

```typescript
import { useAutoFix } from "@/hooks/useAutoFix";

const autoFix = useAutoFix();

// Trigger auto-fix
await autoFix.autoFix(yamlContent);

// Preview changes
console.log("Diff:", autoFix.diff);
console.log("Fixes applied:", autoFix.fixesApplied);

// Apply if satisfied
if (autoFix.fixedContent) {
  setYaml(autoFix.fixedContent);
}
```

### Real-time Validation

```typescript
import { useValidation } from "@/hooks/useValidation";

const validation = useValidation(yaml, {
  realTime: true,
  provider: "aws",
  securityChecks: true,
});

// Validation results update automatically
console.log("Is validating:", validation.isValidating);
console.log("Results:", validation.results);
console.log("Error:", validation.error);
```

## Performance Characteristics

- **Small files (< 1KB)**: < 2 seconds
- **Medium files (1-100KB)**: < 5 seconds
- **Large files (100KB-2MB)**: < 15 seconds
- **Real-time validation**: 1.5s debounce delay
- **Cache hit ratio**: ~80% for repeated validations

## Error Handling

The integration includes comprehensive error handling:

- **Network errors**: Automatic retry with exponential backoff
- **Rate limiting**: Graceful degradation with user feedback
- **Validation errors**: Detailed error messages with line numbers
- **Timeout handling**: 30-second timeout with abort capability

## Security Features

- **Input validation**: 2MB file size limit, 15K line limit
- **Content filtering**: Binary content detection and rejection
- **Rate limiting**: 120 requests per minute per client
- **Docker sandboxing**: External tools run in isolated containers

````

### Step 14: Component Documentation

I will document all new components and hooks:

```typescript
// src/hooks/useValidation.ts - JSDoc documentation
/**
 * Custom hook for YAML validation with real backend integration
 *
 * @param yaml - The YAML content to validate
 * @param options - Validation options
 * @param options.provider - Force specific provider detection
 * @param options.securityChecks - Enable security validation
 * @param options.realTime - Enable real-time validation with debouncing
 * @param options.debounceDelay - Custom debounce delay in milliseconds
 *
 * @returns Validation state and control functions
 *
 * @example
 * ```typescript
 * const validation = useValidation(yaml, {
 *   provider: 'aws',
 *   securityChecks: true,
 *   realTime: true
 * })
 *
 * // Manual validation
 * await validation.validate()
 *
 * // Check results
 * if (validation.results?.ok) {
 *   console.log('Valid YAML!')
 * } else {
 *   console.log('Errors:', validation.results?.messages)
 * }
 * ```
 */
export function useValidation(yaml: string, options: ValidationOptions = {}) {
  // Implementation...
}
````

## My Testing Approach

### Unit Test Updates

I will update all existing unit tests to work with real backend integration while maintaining MSW mocks for isolated testing.

### Integration Test Suite

I will create a comprehensive integration test suite that:

- Starts a real backend server
- Tests all API endpoints with real data
- Validates error handling scenarios
- Measures performance benchmarks

### E2E Test Enhancement

I will enhance E2E tests to:

- Use real backend for validation workflows
- Test provider detection accuracy
- Validate auto-fix functionality
- Ensure accessibility compliance is maintained

### Performance Benchmarking

I will establish performance benchmarks for:

- Validation response times by file size
- Real-time validation debouncing effectiveness
- Cache hit ratios and performance impact
- Memory usage during large file processing

## Success Criteria

### Functional Requirements ✅

- [ ] All mock implementations replaced with real API calls
- [ ] Validation displays actual backend messages with line numbers
- [ ] Auto-fix works with diff preview and user confirmation
- [ ] Provider-aware suggestions work for AWS and Azure
- [ ] Real-time validation with intelligent debouncing
- [ ] JSON conversion uses real backend processing
- [ ] Error handling provides clear, actionable feedback

### Performance Requirements ✅

- [ ] Small files (< 1KB) validate in < 2 seconds
- [ ] Large files (up to 2MB) validate in < 15 seconds
- [ ] Real-time validation has 1.5s debounce delay
- [ ] Cache hit ratio > 70% for repeated validations
- [ ] Memory usage stays under 100MB for typical usage

### Quality Requirements ✅

- [ ] All existing unit tests pass with real backend
- [ ] New integration tests cover all API endpoints
- [ ] E2E tests work with real backend validation
- [ ] Accessibility compliance maintained (WCAG 2.1 AA)
- [ ] TypeScript strict mode with no errors
- [ ] ESLint passes with no warnings

### Documentation Requirements ✅

- [ ] API documentation updated with real endpoint details
- [ ] Component documentation includes usage examples
- [ ] Hook documentation with TypeScript signatures
- [ ] Performance characteristics documented
- [ ] Error handling guide created
- [ ] Migration guide for developers

## Risk Mitigation

### Technical Risks

1. **Backend Performance**: Implement caching and request deduplication
2. **Network Reliability**: Add retry logic and offline graceful degradation
3. **Type Safety**: Strict TypeScript validation between frontend and backend
4. **Memory Leaks**: Proper cleanup of AbortControllers and event listeners

### User Experience Risks

1. **Loading States**: Clear feedback during validation processes
2. **Error Messages**: User-friendly error messages with actionable guidance
3. **Performance Perception**: Progress indicators for long-running operations
4. **Accessibility**: Maintain WCAG 2.1 AA compliance throughout

## Timeline

### Days 1-3: Foundation

- API client type alignment and configuration
- Basic validation integration
- Error handling framework
- Unit test updates

### Days 4-6: Advanced Features

- Auto-fix with diff preview
- Suggestion system integration
- Real-time validation with debouncing
- Provider detection enhancement

### Days 7-9: Performance & Polish

- Caching implementation
- Performance optimization
- Advanced error recovery
- E2E test updates

### Days 10-12: Documentation & Deployment

- Comprehensive documentation
- Integration testing
- Performance benchmarking
- Production deployment preparation

## Conclusion

This comprehensive action plan will transform Cloudlint from a mock-based frontend to a fully integrated, production-ready YAML validation platform. The integration leverages the existing robust backend while enhancing the frontend with real-time capabilities, intelligent caching, and comprehensive error handling.

The implementation follows TypeScript best practices, React hooks patterns, and maintains the high-quality standards established in the current codebase. All changes will be thoroughly tested and documented to ensure maintainability and developer experience.

**I am ready to execute this plan upon your approval.**
