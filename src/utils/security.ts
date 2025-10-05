/**
 * Security Utilities - Enhanced
 *
 * Comprehensive security functions for:
 * - XSS prevention
 * - Input sanitization
 * - Secret detection
 * - YAML bomb protection
 * - CSRF protection
 * - Security audit logging
 *
 * Based on OWASP Security Best Practices
 */

import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify for robust HTML sanitization
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize input for safe display (escapes HTML entities)
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Encode for JavaScript context
 */
export function encodeForJavaScript(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/</g, "\\x3C")
    .replace(/>/g, "\\x3E");
}

/**
 * Encode for URL context
 */
export function encodeForURL(input: string): string {
  return encodeURIComponent(input);
}

/**
 * Detect secrets in text (AWS keys, API tokens, etc.)
 */
export interface SecretDetectionResult {
  found: boolean;
  secrets: Array<{
    type: string;
    value: string;
    line?: number;
    severity: "critical" | "high" | "medium";
  }>;
}

export function detectSecrets(content: string): SecretDetectionResult {
  const secrets: SecretDetectionResult["secrets"] = [];
  const lines = content.split("\n");

  // Secret patterns
  const patterns = [
    {
      name: "AWS Access Key",
      regex: /(AKIA[0-9A-Z]{16})/g,
      severity: "critical" as const,
    },
    {
      name: "AWS Secret Key",
      regex: /aws_secret_access_key\s*=\s*([A-Za-z0-9/+=]{40})/gi,
      severity: "critical" as const,
    },
    {
      name: "GitHub Token",
      regex: /(ghp_[a-zA-Z0-9]{36})/g,
      severity: "critical" as const,
    },
    {
      name: "Generic API Key",
      regex: /api[_-]?key\s*[:=]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
      severity: "high" as const,
    },
    {
      name: "Private Key",
      regex: /(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/g,
      severity: "critical" as const,
    },
    {
      name: "Password in Plain Text",
      regex: /password\s*[:=]\s*['"]?([^'"\s]{8,})['"]?/gi,
      severity: "high" as const,
    },
    {
      name: "JWT Token",
      regex: /(eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/g,
      severity: "medium" as const,
    },
    {
      name: "Database Connection String",
      regex: /(mongodb|mysql|postgresql):\/\/[^\s]+/gi,
      severity: "high" as const,
    },
  ];

  lines.forEach((line, lineIndex) => {
    patterns.forEach((pattern) => {
      const matches = line.matchAll(pattern.regex);
      for (const match of matches) {
        secrets.push({
          type: pattern.name,
          value: match[1] || match[0],
          line: lineIndex + 1,
          severity: pattern.severity,
        });
      }
    });
  });

  return {
    found: secrets.length > 0,
    secrets,
  };
}

/**
 * Validate YAML for security issues including bombs
 */
export interface YAMLSecurityResult {
  isValid: boolean;
  issues: string[];
  secrets: SecretDetectionResult;
  sanitizedContent: string;
}

export function validateYAMLSecurity(yamlContent: string): YAMLSecurityResult {
  const issues: string[] = [];
  let sanitizedContent = yamlContent;

  // Check for secrets first
  const secretsResult = detectSecrets(yamlContent);
  if (secretsResult.found) {
    secretsResult.secrets.forEach((secret) => {
      issues.push(
        `${secret.severity.toUpperCase()}: ${secret.type} detected at line ${secret.line}`,
      );
    });
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    {
      pattern: /eval\s*\(/gi,
      message: "Potential code execution detected (eval)",
    },
    {
      pattern: /function\s*\(/gi,
      message: "Function definitions detected",
    },
    {
      pattern: /<script[^>]*>/gi,
      message: "Script tags detected",
    },
    {
      pattern: /javascript:/gi,
      message: "JavaScript protocol detected",
    },
    {
      pattern: /on\w+\s*=/gi,
      message: "Event handlers detected",
    },
    {
      pattern: /\$\{.*\}/g,
      message: "Template literal injection detected",
    },
  ];

  dangerousPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(yamlContent)) {
      issues.push(message);
      sanitizedContent = sanitizedContent.replace(
        pattern,
        "[REMOVED_FOR_SECURITY]",
      );
    }
  });

  // Check for YAML bombs (exponential expansion)
  const anchorPattern = /&(\w+)/g;
  const aliasPattern = /\*(\w+)/g;
  const anchors = new Set<string>();
  const aliases = new Set<string>();

  let match;
  while ((match = anchorPattern.exec(yamlContent)) !== null) {
    anchors.add(match[1]);
  }
  while ((match = aliasPattern.exec(yamlContent)) !== null) {
    aliases.add(match[1]);
  }

  // Detect recursive references
  if (anchors.size > 0 && aliases.size > 0) {
    const recursiveRefs = [...anchors].filter((anchor) => aliases.has(anchor));
    if (recursiveRefs.length > 0) {
      issues.push(
        `Potential YAML bomb detected: recursive references (${recursiveRefs.join(", ")})`,
      );
    }
  }

  // Check for excessive anchors/aliases
  if (anchors.size > 10 || aliases.size > 10) {
    issues.push(
      `Excessive anchors/aliases detected (${anchors.size} anchors, ${aliases.size} aliases)`,
    );
  }

  // Check for excessively long content (DoS protection)
  const MAX_YAML_SIZE = 1024 * 1024; // 1MB
  if (yamlContent.length > MAX_YAML_SIZE) {
    issues.push(
      `YAML content too large (${yamlContent.length} bytes, max ${MAX_YAML_SIZE})`,
    );
    sanitizedContent = yamlContent.substring(0, MAX_YAML_SIZE);
  }

  // Check for excessive nesting (DoS protection)
  const indentationLevels = yamlContent.split("\n").map((line) => {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  });
  const maxIndentation = Math.max(...indentationLevels);
  const MAX_NESTING_LEVEL = 50;

  if (maxIndentation > MAX_NESTING_LEVEL * 2) {
    issues.push(
      `Excessive nesting detected (${maxIndentation / 2} levels, max ${MAX_NESTING_LEVEL})`,
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    secrets: secretsResult,
    sanitizedContent,
  };
}

/**
 * Generate a secure random token for CSRF protection
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Validate CSRF token (constant-time comparison)
 */
export function validateCSRFToken(
  token: string,
  expectedToken: string,
): boolean {
  if (!token || !expectedToken) {
    return false;
  }

  if (token.length !== expectedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Sanitize error messages to prevent information leakage
 */
export function sanitizeErrorMessage(error: Error | string): string {
  const message = typeof error === "string" ? error : error.message;

  // Remove sensitive patterns
  const sanitized = message
    // Remove file paths
    .replace(/[A-Za-z]:\\[^\s]+/g, "[PATH]")
    .replace(/\/[^\s]+\.(js|ts|tsx|jsx)/g, "[FILE]")
    // Remove stack traces
    .replace(/at\s+[^\n]+/g, "")
    // Remove database queries
    .replace(/SELECT\s+.+FROM\s+/gi, "[QUERY]")
    // Remove API keys
    .replace(/[a-zA-Z0-9_-]{20,}/g, (match) => {
      if (match.length > 20) return "[REDACTED]";
      return match;
    })
    // Remove IP addresses
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[IP]");

  return sanitized.trim() || "An error occurred";
}

/**
 * Content Security Policy configuration
 */
export const CSP_CONFIG = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://plausible.io"],
    styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for styled-components
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'", "https:"],
    connectSrc: ["'self'", "https://plausible.io"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: true,
  },
  reportOnly: false,
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(
  config: typeof CSP_CONFIG = CSP_CONFIG,
): string {
  const directives = Object.entries(config.directives)
    .filter(([, value]) => value !== true) // Skip boolean flags
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      if (Array.isArray(value)) {
        return `${kebabKey} ${value.join(" ")}`;
      }
      return kebabKey;
    });

  if (config.directives.upgradeInsecureRequests) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

/**
 * Security Audit Logger
 *
 * Simple security event logging for compliance and monitoring
 */
export class SecurityAuditLogger {
  private static logs: Array<{
    timestamp: number;
    event: string;
    details: Record<string, unknown>;
    severity: "low" | "medium" | "high" | "critical";
  }> = [];

  static log(
    event: string,
    details: Record<string, unknown> = {},
    severity: "low" | "medium" | "high" | "critical" = "medium",
  ): void {
    this.logs.push({
      timestamp: Date.now(),
      event,
      details,
      severity,
    });

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.warn(`[SECURITY] ${severity.toUpperCase()}: ${event}`, details);
    }
  }

  static getLogs(): typeof SecurityAuditLogger.logs {
    return [...this.logs];
  }

  static getLogsBySeverity(
    severity: "low" | "medium" | "high" | "critical",
  ): typeof SecurityAuditLogger.logs {
    return this.logs.filter((log) => log.severity === severity);
  }

  static clearLogs(): void {
    this.logs = [];
  }
}
