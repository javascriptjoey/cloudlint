/**
 * Type definitions matching the backend API exactly
 * These types are synchronized with src/backend/yaml/types.ts
 */

export type LintSource =
  | "yamllint"
  | "cfn-lint"
  | "spectral"
  | "parser"
  | "azure-schema";

export interface LintMessage {
  source: LintSource;
  path?: string;
  line?: number;
  column?: number;
  message: string;
  severity: "error" | "warning" | "info";
  ruleId?: string;
  kind?: "syntax" | "semantic" | "style";
  suggestion?: string;
}

export interface SourceCounts {
  errors: number;
  warnings: number;
  infos: number;
}

export interface ProviderSummary {
  provider: "aws" | "azure" | "generic";
  sources: {
    azureSchemaPath?: string;
    cfnSpecPath?: string;
    spectralRulesetPath?: string;
    cfnLintDockerImage?: string;
  };
  counts: Partial<Record<LintSource, SourceCounts>>;
}

export interface ValidateResponse {
  ok: boolean;
  messages: LintMessage[];
  providerSummary?: ProviderSummary;
}

export interface AutofixResponse {
  content: string;
  fixesApplied: string[];
}

export interface SdkSuggestion {
  path: string;
  message: string;
  kind: "add" | "rename" | "type";
  confidence?: number;
}

export interface SuggestResponse {
  provider: "aws" | "azure" | "generic";
  suggestions: SdkSuggestion[];
  messages: LintMessage[];
}

export interface ApplySuggestionsResponse {
  content: string;
}

export interface ConvertResponse {
  json?: string;
  yaml?: string;
}

export interface DiffPreviewResponse {
  diff: string;
  before: string;
  after: string;
}

export interface SchemaValidateResponse {
  ok: boolean;
  errors?: Array<{
    instancePath: string;
    message: string;
    keyword: string;
  }>;
}

import { API_CONFIG, VALIDATION_CONFIG } from "./config";

export class ApiError extends Error {
  status: number;
  code?: string;
  retryable: boolean;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryable = this.isRetryable(status);
  }

  private isRetryable(status: number): boolean {
    // Retry on network errors, timeouts, and 5xx errors
    return status === 0 || status === 408 || (status >= 500 && status < 600);
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ValidationOptions {
  provider?: "aws" | "azure" | "generic";
  securityChecks?: boolean;
  filename?: string;
  spectralRulesetPath?: string;
}

/**
 * Enhanced API client with retry logic, error handling, and request management
 */
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;
  private activeRequests = new Map<string, Promise<unknown>>();

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.retries = API_CONFIG.retries;
    this.retryDelay = API_CONFIG.retryDelay;
  }

  /**
   * Make a request with retry logic and error handling
   */
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
          "X-Requested-With": "XMLHttpRequest", // CSRF protection
          ...requestOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        const errorMessage = this.getErrorMessage(response.status, errorText);
        throw new ApiError(errorMessage, response.status);
      }

      // Validate response content type
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new ApiError("Invalid response content type", response.status);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        // Retry logic for retryable errors
        if (error.retryable && retryCount < this.retries) {
          await this.delay(this.retryDelay * Math.pow(2, retryCount));
          return this.request<T>(path, {
            ...options,
            retryCount: retryCount + 1,
          });
        }
        throw error;
      }

      // Handle network errors
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new ApiError("Request timeout", 408);
        }
        if (error.message.includes("fetch")) {
          throw new ApiError("Network error", 0);
        }
      }

      throw new ApiError("Unknown error occurred", 0);
    }
  }

  /**
   * Request deduplication - prevent duplicate requests
   */
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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getErrorMessage(status: number, text: string): string {
    switch (status) {
      case 400:
        return `Invalid request: ${text}`;
      case 413:
        return `File too large. Maximum size is ${VALIDATION_CONFIG.maxFileSize / 1024 / 1024}MB`;
      case 429:
        return "Too many requests. Please wait a moment before trying again.";
      case 500:
        return "Server error. Please try again later.";
      case 503:
        return "Service temporarily unavailable. Please try again later.";
      default:
        return text || `HTTP ${status} error`;
    }
  }

  private sanitizeInput(yaml: string): string {
    // Basic input sanitization
    if (yaml.length > VALIDATION_CONFIG.maxFileSize) {
      throw new ApiError(
        `Content too large. Maximum size is ${VALIDATION_CONFIG.maxFileSize / 1024 / 1024}MB`,
        413
      );
    }

    const lines = yaml.split("\n");
    if (lines.length > VALIDATION_CONFIG.maxLines) {
      throw new ApiError(
        `Too many lines. Maximum is ${VALIDATION_CONFIG.maxLines} lines`,
        413
      );
    }

    // Remove potential XSS vectors
    return yaml
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  }

  /**
   * Validate YAML content
   */
  async validate(
    yaml: string,
    options: ValidationOptions = {}
  ): Promise<ValidateResponse> {
    const sanitizedYaml = this.sanitizeInput(yaml);
    const requestKey = `validate-${this.hashContent(sanitizedYaml)}-${JSON.stringify(options)}`;

    return this.deduplicatedRequest(requestKey, () =>
      this.request<ValidateResponse>("/validate", {
        method: "POST",
        body: JSON.stringify({
          yaml: sanitizedYaml,
          options: {
            provider: options.provider,
            relaxSecurity: !options.securityChecks,
            filename: options.filename,
            spectralRulesetPath: options.spectralRulesetPath,
          },
        }),
      })
    );
  }

  /**
   * Auto-fix YAML content
   */
  async autofix(
    yaml: string,
    options: { spectralFix?: boolean } = {}
  ): Promise<AutofixResponse> {
    const sanitizedYaml = this.sanitizeInput(yaml);

    return this.request<AutofixResponse>("/autofix", {
      method: "POST",
      body: JSON.stringify({
        yaml: sanitizedYaml,
        options,
      }),
    });
  }

  /**
   * Get provider-aware suggestions
   */
  async suggest(
    yaml: string,
    provider?: "aws" | "azure" | "generic"
  ): Promise<SuggestResponse> {
    const sanitizedYaml = this.sanitizeInput(yaml);

    return this.request<SuggestResponse>("/suggest", {
      method: "POST",
      body: JSON.stringify({
        yaml: sanitizedYaml,
        provider,
      }),
    });
  }

  /**
   * Apply selected suggestions
   */
  async applySuggestions(
    yaml: string,
    indexes: number[],
    provider?: "aws" | "azure" | "generic"
  ): Promise<ApplySuggestionsResponse> {
    const sanitizedYaml = this.sanitizeInput(yaml);

    return this.request<ApplySuggestionsResponse>("/apply-suggestions", {
      method: "POST",
      body: JSON.stringify({
        yaml: sanitizedYaml,
        indexes,
        provider,
      }),
    });
  }

  /**
   * Convert between YAML and JSON
   */
  async convert(params: {
    yaml?: string;
    json?: string;
  }): Promise<ConvertResponse> {
    if (params.yaml) {
      params.yaml = this.sanitizeInput(params.yaml);
    }

    return this.request<ConvertResponse>("/convert", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Generate diff preview
   */
  async diffPreview(
    original: string,
    modified: string
  ): Promise<DiffPreviewResponse> {
    return this.request<DiffPreviewResponse>("/diff-preview", {
      method: "POST",
      body: JSON.stringify({
        original: this.sanitizeInput(original),
        modified: this.sanitizeInput(modified),
      }),
    });
  }

  /**
   * Validate against JSON schema
   */
  async schemaValidate(
    yaml: string,
    schema: object
  ): Promise<SchemaValidateResponse> {
    const sanitizedYaml = this.sanitizeInput(yaml);

    return this.request<SchemaValidateResponse>("/schema-validate", {
      method: "POST",
      body: JSON.stringify({
        yaml: sanitizedYaml,
        schema,
      }),
    });
  }

  /**
   * Health check endpoint
   */
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request("/health", { method: "GET" });
  }

  private hashContent(content: string): string {
    // Simple hash for cache keys (not cryptographic)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// Export singleton instance
export const api = new ApiClient();
