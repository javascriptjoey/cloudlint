/**
 * Security Utilities Tests
 *
 * Comprehensive tests for security functions based on OWASP best practices
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeHTML,
  sanitizeInput,
  encodeForJavaScript,
  encodeForURL,
  detectSecrets,
  validateYAMLSecurity,
  generateCSRFToken,
  validateCSRFToken,
  sanitizeErrorMessage,
  generateCSPHeader,
  SecurityAuditLogger,
} from "../../src/utils/security";

describe("Security Utilities", () => {
  describe("sanitizeHTML", () => {
    it("should remove script tags", () => {
      const dirty = '<p>Hello</p><script>alert("XSS")</script>';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain("<script>");
      expect(clean).toContain("<p>Hello</p>");
    });

    it("should remove event handlers", () => {
      const dirty = '<img src="x" onerror="alert(1)">';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain("onerror");
    });

    it("should allow safe tags", () => {
      const dirty = "<p>Hello <strong>World</strong></p>";
      const clean = sanitizeHTML(dirty);
      expect(clean).toContain("<p>");
      expect(clean).toContain("<strong>");
    });

    it("should remove javascript: protocol", () => {
      const dirty = '<a href="javascript:alert(1)">Click</a>';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain("javascript:");
    });
  });

  describe("sanitizeInput", () => {
    it("should escape HTML entities", () => {
      const input = '<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe(
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;",
      );
    });

    it("should handle empty strings", () => {
      expect(sanitizeInput("")).toBe("");
    });

    it("should handle non-string input", () => {
      expect(sanitizeInput(null as unknown as string)).toBe("");
      expect(sanitizeInput(undefined as unknown as string)).toBe("");
    });

    it("should escape all dangerous characters", () => {
      const input = "&<>\"'/";
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe("&amp;&lt;&gt;&quot;&#x27;&#x2F;");
    });
  });

  describe("encodeForJavaScript", () => {
    it("should escape quotes", () => {
      const input = 'Hello "World"';
      const encoded = encodeForJavaScript(input);
      expect(encoded).toContain('\\"');
    });

    it("should escape newlines", () => {
      const input = "Line1\nLine2";
      const encoded = encodeForJavaScript(input);
      expect(encoded).toContain("\\n");
    });

    it("should escape HTML tags", () => {
      const input = "<script>";
      const encoded = encodeForJavaScript(input);
      expect(encoded).toContain("\\x3C");
      expect(encoded).toContain("\\x3E");
    });
  });

  describe("encodeForURL", () => {
    it("should encode special characters", () => {
      const input = "hello world?test=1&foo=bar";
      const encoded = encodeForURL(input);
      expect(encoded).toContain("%20"); // space
      expect(encoded).toContain("%3F"); // ?
      expect(encoded).toContain("%3D"); // =
      expect(encoded).toContain("%26"); // &
    });
  });

  describe("detectSecrets", () => {
    it("should detect AWS access keys", () => {
      const content = "AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE";
      const result = detectSecrets(content);
      expect(result.found).toBe(true);
      expect(result.secrets).toHaveLength(1);
      expect(result.secrets[0].type).toBe("AWS Access Key");
      expect(result.secrets[0].severity).toBe("critical");
    });

    it("should detect GitHub tokens", () => {
      const content = "token: ghp_1234567890abcdefghijklmnopqrstuvwxyz";
      const result = detectSecrets(content);
      expect(result.found).toBe(true);
      expect(result.secrets[0].type).toBe("GitHub Token");
    });

    it("should detect private keys", () => {
      const content = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...";
      const result = detectSecrets(content);
      expect(result.found).toBe(true);
      expect(result.secrets[0].type).toBe("Private Key");
      expect(result.secrets[0].severity).toBe("critical");
    });

    it("should detect passwords", () => {
      const content = 'password: "MySecretPass123"';
      const result = detectSecrets(content);
      expect(result.found).toBe(true);
      expect(result.secrets[0].type).toBe("Password in Plain Text");
    });

    it("should detect JWT tokens", () => {
      const content =
        "token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      const result = detectSecrets(content);
      expect(result.found).toBe(true);
      expect(result.secrets[0].type).toBe("JWT Token");
    });

    it("should detect database connection strings", () => {
      const content = "mongodb://user:pass@localhost:27017/mydb";
      const result = detectSecrets(content);
      expect(result.found).toBe(true);
      expect(result.secrets[0].type).toBe("Database Connection String");
    });

    it("should return line numbers", () => {
      const content = "line1\nAKIAIOSFODNN7EXAMPLE\nline3";
      const result = detectSecrets(content);
      expect(result.secrets[0].line).toBe(2);
    });

    it("should not detect false positives", () => {
      const content = "This is a normal text without secrets";
      const result = detectSecrets(content);
      expect(result.found).toBe(false);
      expect(result.secrets).toHaveLength(0);
    });
  });

  describe("validateYAMLSecurity", () => {
    it("should detect secrets in YAML", () => {
      const yaml = `
apiVersion: v1
kind: Secret
data:
  aws_key: AKIAIOSFODNN7EXAMPLE
`;
      const result = validateYAMLSecurity(yaml);
      expect(result.isValid).toBe(false);
      expect(result.secrets.found).toBe(true);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("should detect dangerous patterns", () => {
      const yaml = 'script: <script>alert("XSS")</script>';
      const result = validateYAMLSecurity(yaml);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Script tags detected");
    });

    it("should detect eval usage", () => {
      const yaml = "code: eval('malicious code')";
      const result = validateYAMLSecurity(yaml);
      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.includes("eval"))).toBe(true);
    });

    it("should detect YAML bombs (recursive references)", () => {
      const yaml = `
a: &anchor
  b: *anchor
`;
      const result = validateYAMLSecurity(yaml);
      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.includes("YAML bomb"))).toBe(true);
    });

    it("should detect excessive file size", () => {
      const largeYaml = "a: " + "x".repeat(2 * 1024 * 1024); // 2MB
      const result = validateYAMLSecurity(largeYaml);
      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.includes("too large"))).toBe(true);
    });

    it("should detect excessive nesting", () => {
      let yaml = "a:\n";
      for (let i = 0; i < 60; i++) {
        yaml += "  ".repeat(i + 1) + "b:\n";
      }
      const result = validateYAMLSecurity(yaml);
      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.includes("nesting"))).toBe(true);
    });

    it("should pass valid YAML", () => {
      const yaml = `
apiVersion: v1
kind: ConfigMap
data:
  key: value
`;
      const result = validateYAMLSecurity(yaml);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe("CSRF Protection", () => {
    it("should generate unique tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes * 2 hex chars
    });

    it("should validate matching tokens", () => {
      const token = generateCSRFToken();
      expect(validateCSRFToken(token, token)).toBe(true);
    });

    it("should reject mismatched tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(validateCSRFToken(token1, token2)).toBe(false);
    });

    it("should reject empty tokens", () => {
      expect(validateCSRFToken("", "test")).toBe(false);
      expect(validateCSRFToken("test", "")).toBe(false);
    });

    it("should reject tokens of different lengths", () => {
      expect(validateCSRFToken("short", "muchlongertoken")).toBe(false);
    });
  });

  describe("sanitizeErrorMessage", () => {
    it("should remove file paths", () => {
      const error = new Error("Error in C:\\Users\\test\\file.ts");
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).not.toContain("C:\\Users");
      expect(sanitized).toContain("[PATH]");
    });

    it("should remove stack traces", () => {
      const error = new Error("Error\n    at function (file.ts:10:5)");
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).not.toContain("at function");
    });

    it("should remove database queries", () => {
      const error = "SELECT * FROM users WHERE id=1";
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toContain("[QUERY]");
    });

    it("should remove IP addresses", () => {
      const error = "Connection failed to 192.168.1.1";
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).not.toContain("192.168.1.1");
      expect(sanitized).toContain("[IP]");
    });

    it("should remove long tokens", () => {
      const error = "Token: abc123def456ghi789jkl012mno345pqr678stu901vwx234";
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toContain("[REDACTED]");
    });

    it("should handle string errors", () => {
      const sanitized = sanitizeErrorMessage("Simple error message");
      expect(sanitized).toBe("Simple error message");
    });

    it("should return default message for empty errors", () => {
      const sanitized = sanitizeErrorMessage("");
      expect(sanitized).toBe("An error occurred");
    });
  });

  describe("CSP Configuration", () => {
    it("should generate valid CSP header", () => {
      const header = generateCSPHeader();
      expect(header).toContain("default-src 'self'");
      expect(header).toContain("script-src 'self'");
      expect(header).toContain("frame-ancestors 'none'");
      expect(header).toContain("upgrade-insecure-requests");
    });

    it("should include Plausible analytics", () => {
      const header = generateCSPHeader();
      expect(header).toContain("https://plausible.io");
    });

    it("should convert camelCase to kebab-case", () => {
      const header = generateCSPHeader();
      expect(header).toContain("default-src");
      expect(header).toContain("script-src");
      expect(header).toContain("frame-ancestors");
    });

    it("should handle custom config", () => {
      const customConfig = {
        directives: {
          defaultSrc: ["'self'", "https://example.com"],
          scriptSrc: ["'self'"],
          upgradeInsecureRequests: true, // Still included by default
        },
        reportOnly: false,
      };
      const header = generateCSPHeader(customConfig);
      expect(header).toContain("https://example.com");
      expect(header).toContain("upgrade-insecure-requests");
    });
  });

  describe("SecurityAuditLogger", () => {
    beforeEach(() => {
      SecurityAuditLogger.clearLogs();
    });

    it("should log security events", () => {
      SecurityAuditLogger.log("test_event", { detail: "test" }, "high");
      const logs = SecurityAuditLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe("test_event");
      expect(logs[0].severity).toBe("high");
    });

    it("should filter logs by severity", () => {
      SecurityAuditLogger.log("event1", {}, "low");
      SecurityAuditLogger.log("event2", {}, "critical");
      SecurityAuditLogger.log("event3", {}, "critical");

      const criticalLogs = SecurityAuditLogger.getLogsBySeverity("critical");
      expect(criticalLogs).toHaveLength(2);
    });

    it("should limit log size to 1000", () => {
      for (let i = 0; i < 1100; i++) {
        SecurityAuditLogger.log(`event${i}`, {}, "low");
      }
      const logs = SecurityAuditLogger.getLogs();
      expect(logs).toHaveLength(1000);
    });

    it("should clear logs", () => {
      SecurityAuditLogger.log("test", {}, "low");
      expect(SecurityAuditLogger.getLogs()).toHaveLength(1);
      SecurityAuditLogger.clearLogs();
      expect(SecurityAuditLogger.getLogs()).toHaveLength(0);
    });

    it("should include timestamp", () => {
      const before = Date.now();
      SecurityAuditLogger.log("test", {}, "low");
      const after = Date.now();
      const logs = SecurityAuditLogger.getLogs();
      expect(logs[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(logs[0].timestamp).toBeLessThanOrEqual(after);
    });
  });
});
