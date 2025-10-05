# Backend Integration Plan for Cloudlint

## Executive Summary

This document outlines a comprehensive plan for connecting the frontend to the backend in Cloudlint. The application already has a robust backend implementation with extensive YAML validation capabilities, but the frontend currently uses mock implementations. This plan details the strategy, implementation steps, testing approach, and security considerations for full backend integration.

## Current State Analysis

### Backend Capabilities (Already Implemented)

- **Express Server**: Production-ready server with security headers, CORS, rate limiting
- **YAML Validation Engine**: Multi-tool orchestration (yamllint, cfn-lint, spectral)
- **Provider Detection**: AWS CloudFormation, Azure Pipelines, Generic YAML support
- **Auto-Fix Functionality**: Intelligent YAML repair with Prettier integration
- **Suggestion System**: Provider-aware suggestions for AWS and Azure
- **Security Features**: Content filtering, rate limiting, Docker sandboxing
- **Schema Validation**: JSON Schema validation support
- **Comprehensive Testing**: 145+ backend tests covering all functionality

### Frontend Current State

- **Mock Implementation**: All API calls currently use mock responses
- **UI Components**: Complete UI with validation, conversion, and suggestion features
- **API Client**: Well-structured API client ready for real backend integration
- **Error Handling**: Basic error handling structure in place
- **Testing**: Comprehensive E2E and accessibility testing framework

### Integration Gap

The primary gap is connecting the existing frontend API client to the real backend endpoints, replacing mock implementations with actual API calls, and implementing proper error handling and state management.

## Integration Strategy

### Phase 1: Core API Integration (Week 1)

1. **Replace Mock Validation**: Connect real YAML validation endpoint
2. **Implement Real-time Feedback**: Show actual validation results and errors
3. **Error Handling**: Implement comprehensive error handling for API failures
4. **Loading States**: Add proper loading indicators for async operations

### Phase 2: Advanced Features (Week 2)

1. **Auto-fix Integration**: Connect auto-fix functionality with diff preview
2. **Suggestion System**: Implement provider-aware suggestions (AWS/Azure)
3. **JSON Conversion**: Connect real YAML ↔ JSON conversion
4. **Schema Validation**: Add optional schema validation feature

### Phase 3: Performance & Polish (Week 3)

1. **Performance Optimization**: Implement caching, debouncing, and optimization
2. **Advanced Error Recovery**: Implement retry logic and graceful degradation
3. **User Experience**: Polish loading states, animations, and feedback
4. **Documentation**: Update user-facing documentation

## Detailed Implementation Plan

### 1. API Client Enhancement

#### Current API Client Structure

```typescript
// src/lib/apiClient.ts - Already well-structured
export const api = {
  validate(yaml: string, opts?: RequestOpts) {
    /* ... */
  },
  autofix(yaml: string, opts?: RequestOpts) {
    /* ... */
  },
  suggest(yaml: string, opts?: RequestOpts) {
    /* ... */
  },
  // ... other methods
};
```

#### Required Changes

1. **Base URL Configuration**: Set proper backend URL (localhost:3001 for dev)
2. **Error Response Handling**: Map backend error responses to frontend error types
3. **Request/Response Type Alignment**: Ensure types match backend response format
4. **Timeout Configuration**: Add appropriate timeouts for different operations

#### Implementation Steps

```typescript
// Enhanced API client configuration
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3001";

// Add request interceptor for error handling
const handleApiError = (error: ApiError) => {
  // Map backend errors to user-friendly messages
  // Log errors for debugging
  // Implement retry logic for transient failures
};
```

### 2. Frontend Component Updates

#### PlaygroundSimple Component Changes

```typescript
// Replace mock validation with real API calls
const handleValidate = useCallback(async () => {
  if (!yaml.trim()) return;

  setIsValidating(true);
  setValidationResults(null);
  setError(null);

  try {
    const result = await api.validate(yaml, {
      signal: abortController.signal,
      // Add validation options based on UI settings
      options: {
        provider: detectedProvider,
        securityChecks: securityChecksEnabled,
        // ... other options
      },
    });

    setValidationResults(result);

    // Show success/error feedback based on results
    if (result.ok) {
      toast.success(`Validation complete! ${result.messages.length} messages`);
    } else {
      toast.error(
        `Validation failed with ${result.messages.filter((m) => m.severity === "error").length} errors`
      );
    }
  } catch (error) {
    handleValidationError(error);
  } finally {
    setIsValidating(false);
  }
}, [yaml, securityChecksEnabled, detectedProvider]);
```

#### State Management Updates

```typescript
// Enhanced state management for validation results
interface ValidationState {
  isValidating: boolean;
  results: LintResult | null;
  error: string | null;
  lastValidated: Date | null;
}

// Add provider detection state
interface ProviderState {
  detected: "aws" | "azure" | "generic";
  confidence: number;
  canSuggest: boolean;
}
```

### 3. Error Handling Strategy

#### Error Categories and Handling

1. **Network Errors**: Connection failures, timeouts
   - Show retry button
   - Implement exponential backoff
   - Graceful degradation to offline mode

2. **Validation Errors**: YAML syntax errors, validation failures
   - Display inline error messages
   - Highlight problematic lines in editor
   - Provide fix suggestions

3. **Server Errors**: 500 errors, rate limiting
   - Show appropriate user messages
   - Implement retry logic
   - Log for debugging

4. **Client Errors**: Invalid requests, malformed data
   - Validate input before sending
   - Show helpful error messages
   - Guide user to correct input

#### Error Recovery Implementation

```typescript
const useErrorRecovery = () => {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const retryWithBackoff = useCallback(
    async (operation: () => Promise<any>) => {
      for (let i = 0; i <= maxRetries; i++) {
        try {
          return await operation();
        } catch (error) {
          if (i === maxRetries) throw error;

          const delay = Math.pow(2, i) * 1000; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          setRetryCount(i + 1);
        }
      }
    },
    [maxRetries]
  );

  return { retryWithBackoff, retryCount };
};
```

### 4. Real-time Validation Implementation

#### Debounced Validation

```typescript
const useDebouncedValidation = (yaml: string, delay: number = 1000) => {
  const [validationResults, setValidationResults] = useState<LintResult | null>(
    null
  );
  const [isValidating, setIsValidating] = useState(false);

  const debouncedValidate = useMemo(
    () =>
      debounce(async (content: string) => {
        if (!content.trim()) {
          setValidationResults(null);
          return;
        }

        setIsValidating(true);
        try {
          const result = await api.validate(content);
          setValidationResults(result);
        } catch (error) {
          console.error("Validation error:", error);
          // Handle error appropriately
        } finally {
          setIsValidating(false);
        }
      }, delay),
    [delay]
  );

  useEffect(() => {
    debouncedValidate(yaml);
    return () => debouncedValidate.cancel();
  }, [yaml, debouncedValidate]);

  return { validationResults, isValidating };
};
```

#### Progressive Enhancement

```typescript
// Enable real-time validation based on user preference
const [realTimeValidation, setRealTimeValidation] = useState(false);

// Use either real-time or manual validation
const validationTrigger = realTimeValidation
  ? useDebouncedValidation(yaml, 1500)
  : useManualValidation();
```

### 5. Advanced Features Integration

#### Auto-fix with Diff Preview

```typescript
const handleAutoFix = useCallback(async () => {
  if (!yaml.trim()) return;

  setIsFixing(true);
  try {
    // Get auto-fix result
    const fixResult = await api.autofix(yaml);

    // Generate diff preview
    const diffResult = await api.diffPreview(yaml, fixResult.content);

    // Show diff modal for user approval
    setDiffPreview(diffResult);
    setShowDiffModal(true);
  } catch (error) {
    toast.error("Auto-fix failed: " + error.message);
  } finally {
    setIsFixing(false);
  }
}, [yaml]);

const applyAutoFix = useCallback(() => {
  if (diffPreview) {
    setYaml(diffPreview.after);
    setShowDiffModal(false);
    toast.success("Auto-fix applied successfully!");
  }
}, [diffPreview]);
```

#### Provider-Aware Suggestions

```typescript
const useSuggestions = (yaml: string, provider?: string) => {
  const [suggestions, setSuggestions] = useState<SdkSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSuggestions = useCallback(async () => {
    if (!yaml.trim()) return;

    setIsLoading(true);
    try {
      const result = await api.suggest(yaml);
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [yaml]);

  const applySuggestions = useCallback(
    async (indexes: number[]) => {
      try {
        const result = await api.applySuggestions(yaml, indexes, provider);
        return result.content;
      } catch (error) {
        throw new Error("Failed to apply suggestions: " + error.message);
      }
    },
    [yaml, provider]
  );

  return { suggestions, isLoading, loadSuggestions, applySuggestions };
};
```

## Testing Strategy

### 1. Integration Testing Approach

#### API Integration Tests

```typescript
// tests/integration/api-integration.test.ts
describe("API Integration Tests", () => {
  beforeAll(async () => {
    // Start backend server for testing
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  test("validates YAML successfully", async () => {
    const yaml = "name: test\nversion: 1.0.0";
    const result = await api.validate(yaml);

    expect(result.ok).toBe(true);
    expect(result.messages).toBeDefined();
    expect(result.providerSummary).toBeDefined();
  });

  test("handles validation errors gracefully", async () => {
    const invalidYaml = "invalid: yaml: [\nbroken syntax";
    const result = await api.validate(invalidYaml);

    expect(result.ok).toBe(false);
    expect(result.messages.some((m) => m.severity === "error")).toBe(true);
  });
});
```

#### E2E Testing Updates

```typescript
// Update existing E2E tests to work with real backend
test("complete YAML validation workflow with real backend", async ({
  page,
}) => {
  await page.goto("/playground");

  // Load sample YAML
  await page.getByRole("button", { name: "Load Sample" }).click();

  // Validate YAML (now with real backend)
  await page.getByRole("button", { name: /Validate/ }).click();

  // Wait for real validation to complete
  await expect(page.getByText("Validating...")).toBeVisible();
  await page.waitForSelector('[data-testid="validation-results"]', {
    timeout: 10000,
  });

  // Verify real validation results are displayed
  await expect(page.getByTestId("validation-results")).toBeVisible();
});
```

### 2. Error Scenario Testing

#### Network Failure Testing

```typescript
test("handles network failures gracefully", async ({ page }) => {
  // Intercept API calls to simulate network failure
  await page.route("/validate", (route) => route.abort("failed"));

  await page.goto("/playground");
  await page.getByRole("button", { name: "Load Sample" }).click();
  await page.getByRole("button", { name: /Validate/ }).click();

  // Should show error message and retry option
  await expect(page.getByText(/network error/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
});
```

#### Rate Limiting Testing

```typescript
test("handles rate limiting appropriately", async ({ page }) => {
  // Simulate rate limiting response
  await page.route("/validate", (route) =>
    route.fulfill({ status: 429, body: "Rate limit exceeded" })
  );

  await page.goto("/playground");
  await page.getByRole("button", { name: "Load Sample" }).click();
  await page.getByRole("button", { name: /Validate/ }).click();

  // Should show rate limit message
  await expect(page.getByText(/rate limit/i)).toBeVisible();
});
```

### 3. Performance Testing

#### Load Testing

```typescript
test("handles large YAML files efficiently", async ({ page }) => {
  const largeYaml = generateLargeYamlContent(5000); // 5000 lines

  await page.goto("/playground");

  const startTime = Date.now();
  await page
    .locator('[data-testid="codemirror-yaml-editor"] textarea')
    .fill(largeYaml);
  await page.getByRole("button", { name: /Validate/ }).click();

  // Wait for validation to complete
  await page.waitForSelector('[data-testid="validation-results"]', {
    timeout: 30000,
  });

  const totalTime = Date.now() - startTime;
  expect(totalTime).toBeLessThan(30000); // 30 second budget for large files
});
```

## Security Considerations

### 1. Input Validation and Sanitization

#### Frontend Validation

```typescript
const validateInput = (yaml: string): { isValid: boolean; error?: string } => {
  // Size limits (align with backend limits)
  if (yaml.length > 2 * 1024 * 1024) {
    // 2MB limit
    return { isValid: false, error: "File too large (max 2MB)" };
  }

  // Line count limits
  const lines = yaml.split("\n");
  if (lines.length > 15000) {
    return { isValid: false, error: "Too many lines (max 15,000)" };
  }

  // Basic content validation
  if (yaml.includes("<script>") || yaml.includes("javascript:")) {
    return { isValid: false, error: "Potentially malicious content detected" };
  }

  return { isValid: true };
};
```

#### Request Sanitization

```typescript
const sanitizeRequest = (yaml: string): string => {
  // Remove potential XSS vectors
  return yaml
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
};
```

### 2. Error Information Disclosure

#### Safe Error Messages

```typescript
const getSafeErrorMessage = (error: ApiError): string => {
  // Don't expose internal server details
  if (error.status >= 500) {
    return "An internal server error occurred. Please try again later.";
  }

  // Rate limiting
  if (error.status === 429) {
    return "Too many requests. Please wait a moment before trying again.";
  }

  // Client errors - can show more detail
  if (error.status >= 400 && error.status < 500) {
    return error.message || "Invalid request. Please check your input.";
  }

  return "An unexpected error occurred. Please try again.";
};
```

### 3. Content Security Policy

#### CSP Headers for API Requests

```typescript
// Ensure API requests comply with CSP
const apiHeaders = {
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest", // CSRF protection
};

// Validate response content type
const validateResponseContentType = (response: Response) => {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error("Invalid response content type");
  }
};
```

## Performance Optimization

### 1. Caching Strategy

#### Client-Side Caching

```typescript
const useValidationCache = () => {
  const cache = useRef(
    new Map<string, { result: LintResult; timestamp: number }>()
  );
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const getCachedResult = (yaml: string): LintResult | null => {
    const key = hashContent(yaml);
    const cached = cache.current.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    return null;
  };

  const setCachedResult = (yaml: string, result: LintResult) => {
    const key = hashContent(yaml);
    cache.current.set(key, { result, timestamp: Date.now() });

    // Cleanup old entries
    if (cache.current.size > 100) {
      const oldestKey = cache.current.keys().next().value;
      cache.current.delete(oldestKey);
    }
  };

  return { getCachedResult, setCachedResult };
};
```

### 2. Request Optimization

#### Request Deduplication

```typescript
const useRequestDeduplication = () => {
  const activeRequests = useRef(new Map<string, Promise<any>>());

  const deduplicatedRequest = async <T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> => {
    if (activeRequests.current.has(key)) {
      return activeRequests.current.get(key)!;
    }

    const promise = requestFn().finally(() => {
      activeRequests.current.delete(key);
    });

    activeRequests.current.set(key, promise);
    return promise;
  };

  return { deduplicatedRequest };
};
```

### 3. Progressive Loading

#### Chunked Processing for Large Files

```typescript
const processLargeYaml = async (yaml: string): Promise<LintResult> => {
  const CHUNK_SIZE = 10000; // Process in 10KB chunks

  if (yaml.length <= CHUNK_SIZE) {
    return api.validate(yaml);
  }

  // For large files, show progress and process in chunks
  const chunks = chunkString(yaml, CHUNK_SIZE);
  const results: LintResult[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const progress = ((i + 1) / chunks.length) * 100;
    updateProgress(progress);

    const result = await api.validate(chunks[i]);
    results.push(result);
  }

  return mergeResults(results);
};
```

## Deployment and Monitoring

### 1. Environment Configuration

#### Development Environment

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3001
VITE_ENABLE_REAL_TIME_VALIDATION=true
VITE_VALIDATION_DEBOUNCE_MS=1500
VITE_MAX_FILE_SIZE_MB=2
```

#### Production Environment

```bash
# .env.production
VITE_API_BASE_URL=/api
VITE_ENABLE_REAL_TIME_VALIDATION=false
VITE_VALIDATION_DEBOUNCE_MS=2000
VITE_MAX_FILE_SIZE_MB=1
```

### 2. Monitoring and Analytics

#### Error Tracking

```typescript
const trackError = (error: Error, context: string) => {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context}]`, error);
  }

  // Send to monitoring service in production
  if (process.env.NODE_ENV === "production") {
    // analytics.track('api_error', {
    //   error: error.message,
    //   context,
    //   timestamp: new Date().toISOString()
    // });
  }
};
```

#### Performance Monitoring

```typescript
const trackPerformance = (operation: string, duration: number) => {
  console.log(`Performance: ${operation} took ${duration}ms`);

  // Track slow operations
  if (duration > 5000) {
    console.warn(`Slow operation detected: ${operation} (${duration}ms)`);
  }
};
```

## Implementation Timeline

### Week 1: Core Integration

- **Day 1-2**: API client configuration and basic validation integration
- **Day 3-4**: Error handling implementation and testing
- **Day 5**: Real-time validation and debouncing

### Week 2: Advanced Features

- **Day 1-2**: Auto-fix integration with diff preview
- **Day 3-4**: Suggestion system and provider detection
- **Day 5**: JSON conversion and schema validation

### Week 3: Polish and Optimization

- **Day 1-2**: Performance optimization and caching
- **Day 3-4**: Advanced error recovery and user experience polish
- **Day 5**: Documentation updates and final testing

## Success Criteria

### Functional Requirements

- ✅ All mock implementations replaced with real API calls
- ✅ Validation results display actual backend validation messages
- ✅ Auto-fix functionality works with diff preview
- ✅ Provider-aware suggestions work for AWS and Azure
- ✅ Error handling provides clear, actionable feedback
- ✅ Performance meets established benchmarks

### Quality Requirements

- ✅ All existing E2E tests pass with real backend
- ✅ New integration tests cover all API endpoints
- ✅ Error scenarios are thoroughly tested
- ✅ Accessibility compliance maintained (WCAG 2.1 AA)
- ✅ Performance benchmarks met (< 5s for typical validation)

### Security Requirements

- ✅ Input validation prevents malicious content
- ✅ Error messages don't expose sensitive information
- ✅ Rate limiting is handled gracefully
- ✅ CSP compliance maintained

## Risk Mitigation

### Technical Risks

1. **Backend Compatibility**: Ensure frontend types match backend responses
   - _Mitigation_: Comprehensive integration testing and type validation

2. **Performance Issues**: Large files or slow validation
   - _Mitigation_: Implement chunked processing and progress indicators

3. **Network Reliability**: Handle network failures gracefully
   - _Mitigation_: Retry logic, offline mode, and clear error messages

### User Experience Risks

1. **Breaking Changes**: Existing users expect current behavior
   - _Mitigation_: Gradual rollout and feature flags

2. **Performance Regression**: Real backend might be slower than mocks
   - _Mitigation_: Performance monitoring and optimization

## Conclusion

This backend integration plan provides a comprehensive roadmap for connecting Cloudlint's frontend to its robust backend infrastructure. The phased approach ensures minimal disruption while delivering significant functionality improvements. The emphasis on testing, security, and performance ensures a production-ready integration that maintains the high quality standards established in the current codebase.

The plan leverages the existing strong foundation in both frontend and backend components, focusing on the integration layer while maintaining backward compatibility and user experience quality.
