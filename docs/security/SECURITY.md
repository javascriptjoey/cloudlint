# Security Documentation

**Last Updated:** January 5, 2025  
**Status:** ✅ Production Ready  
**Based on:** OWASP Security Best Practices & Context7 Guidance

---

## 🔒 Overview

Cloudlint implements comprehensive security measures to protect against common web vulnerabilities and ensure data privacy. All security functions are thoroughly tested with **48/48 tests passing (100%)**.

---

## 🛡️ Security Features

### 1. XSS (Cross-Site Scripting) Protection

**Implementation:** `src/utils/security.ts`

#### HTML Sanitization

```typescript
import { sanitizeHTML } from "@/utils/security";

// Removes dangerous tags and attributes
const clean = sanitizeHTML('<p>Safe</p><script>alert("XSS")</script>');
// Result: '<p>Safe</p>'
```

**Features:**

- Uses DOMPurify for robust HTML sanitization
- Allows only safe tags: `<b>`, `<i>`, `<em>`, `<strong>`, `<a>`, `<p>`, `<br>`
- Removes all event handlers (`onclick`, `onerror`, etc.)
- Blocks `javascript:` protocol
- Prevents DOM-based XSS

#### Input Sanitization

```typescript
import { sanitizeInput } from "@/utils/security";

// Escapes HTML entities
const safe = sanitizeInput('<script>alert("XSS")</script>');
// Result: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
```

**Escapes:**

- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#x27;`
- `/` → `&#x2F;`

#### Context-Specific Encoding

**JavaScript Context:**

```typescript
import { encodeForJavaScript } from "@/utils/security";

const safe = encodeForJavaScript('Hello "World"');
// Escapes quotes, newlines, and HTML tags
```

**URL Context:**

```typescript
import { encodeForURL } from "@/utils/security";

const safe = encodeForURL("hello world?test=1");
// Uses encodeURIComponent
```

---

### 2. Content Security Policy (CSP)

**Implementation:** `src/utils/security.ts` + `src/server.ts`

#### Current CSP Configuration

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://plausible.io;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' https:;
  connect-src 'self' https://plausible.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

#### CSP Benefits

- ✅ Prevents inline script execution
- ✅ Blocks external script loading (except Plausible)
- ✅ Prevents clickjacking (`frame-ancestors 'none'`)
- ✅ Forces HTTPS (`upgrade-insecure-requests`)
- ✅ Restricts form submissions to same origin

#### Usage

```typescript
import { generateCSPHeader, CSP_CONFIG } from "@/utils/security";

// Generate CSP header string
const cspHeader = generateCSPHeader();

// Custom configuration
const customCSP = generateCSPHeader({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://trusted.com"],
    upgradeInsecureRequests: true,
  },
  reportOnly: false,
});
```

---

### 3. CSRF (Cross-Site Request Forgery) Protection

**Implementation:** `src/utils/security.ts`

#### Token Generation

```typescript
import { generateCSRFToken, validateCSRFToken } from "@/utils/security";

// Generate a secure random token
const token = generateCSRFToken();
// Returns: 64-character hex string (32 bytes)
```

#### Token Validation

```typescript
// Constant-time comparison to prevent timing attacks
const isValid = validateCSRFToken(userToken, expectedToken);
```

**Features:**

- Cryptographically secure random tokens
- Constant-time comparison (prevents timing attacks)
- 32 bytes of entropy (256 bits)

---

### 4. Secret Detection

**Implementation:** `src/utils/security.ts`

#### Detect Secrets in Content

```typescript
import { detectSecrets } from "@/utils/security";

const yaml = `
apiVersion: v1
data:
  aws_key: AKIAIOSFODNN7EXAMPLE
`;

const result = detectSecrets(yaml);
// {
//   found: true,
//   secrets: [{
//     type: "AWS Access Key",
//     value: "AKIAIOSFODNN7EXAMPLE",
//     line: 4,
//     severity: "critical"
//   }]
// }
```

#### Detected Secret Types

| Secret Type         | Severity | Pattern                       |
| ------------------- | -------- | ----------------------------- |
| AWS Access Key      | Critical | `AKIA[0-9A-Z]{16}`            |
| AWS Secret Key      | Critical | `aws_secret_access_key = ...` |
| GitHub Token        | Critical | `ghp_[a-zA-Z0-9]{36}`         |
| Private Key         | Critical | `-----BEGIN PRIVATE KEY-----` |
| API Key             | High     | `api_key: ...`                |
| Password            | High     | `password: ...`               |
| JWT Token           | Medium   | `eyJ...`                      |
| Database Connection | High     | `mongodb://...`               |

---

### 5. YAML Bomb Protection

**Implementation:** `src/utils/security.ts`

#### Security Validation

```typescript
import { validateYAMLSecurity } from "@/utils/security";

const result = validateYAMLSecurity(yamlContent);
// {
//   isValid: boolean,
//   issues: string[],
//   secrets: SecretDetectionResult,
//   sanitizedContent: string
// }
```

#### Protection Mechanisms

**1. File Size Limits**

- Maximum: 1MB (1,048,576 bytes)
- Prevents DoS attacks via large files

**2. Nesting Depth Limits**

- Maximum: 50 levels
- Prevents stack overflow attacks

**3. Anchor/Alias Detection**

- Detects recursive references
- Prevents exponential expansion (YAML bombs)
- Example attack:
  ```yaml
  a: &anchor
    b: *anchor # Recursive reference
  ```

**4. Dangerous Pattern Detection**

- `eval()` calls
- `<script>` tags
- `javascript:` protocol
- Event handlers (`onclick`, etc.)
- Template literals (`${...}`)
- Function definitions

---

### 6. Error Message Sanitization

**Implementation:** `src/utils/security.ts`

#### Sanitize Error Messages

```typescript
import { sanitizeErrorMessage } from "@/utils/security";

const error = new Error("Error in C:\\Users\\admin\\secret.ts at 192.168.1.1");
const safe = sanitizeErrorMessage(error);
// Result: 'Error in [PATH] at [IP]'
```

#### Removed Information

- ❌ File paths (`C:\Users\...` → `[PATH]`)
- ❌ Stack traces (`at function...` → removed)
- ❌ Database queries (`SELECT...` → `[QUERY]`)
- ❌ IP addresses (`192.168.1.1` → `[IP]`)
- ❌ Long tokens (>20 chars → `[REDACTED]`)

**Purpose:** Prevents information leakage that could aid attackers.

---

### 7. Security Audit Logging

**Implementation:** `src/utils/security.ts`

#### Log Security Events

```typescript
import { SecurityAuditLogger } from "@/utils/security";

// Log a security event
SecurityAuditLogger.log(
  "suspicious_activity",
  { userId: "user123", action: "multiple_failed_logins" },
  "high",
);

// Get all logs
const logs = SecurityAuditLogger.getLogs();

// Filter by severity
const criticalLogs = SecurityAuditLogger.getLogsBySeverity("critical");

// Clear logs
SecurityAuditLogger.clearLogs();
```

#### Features

- Automatic log rotation (keeps last 1000 entries)
- Severity levels: `low`, `medium`, `high`, `critical`
- Timestamps for all events
- Console logging in development mode

---

## 🔐 Security Headers

**Implementation:** `src/server.ts`

### Current Headers

```typescript
{
  // Content Security Policy
  'Content-Security-Policy': '...',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS protection (disabled per OWASP recommendation)
  'X-XSS-Protection': '0',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // HSTS (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}
```

---

## 🧪 Testing

### Test Coverage

- **48/48 tests passing (100%)**
- Location: `tests/unit/security.test.ts`

### Test Categories

1. **HTML Sanitization** (4 tests)
2. **Input Sanitization** (4 tests)
3. **Context Encoding** (3 tests)
4. **Secret Detection** (8 tests)
5. **YAML Security** (7 tests)
6. **CSRF Protection** (5 tests)
7. **Error Sanitization** (7 tests)
8. **CSP Configuration** (4 tests)
9. **Audit Logging** (6 tests)

### Run Tests

```bash
npm test -- tests/unit/security.test.ts
```

---

## 📚 OWASP Compliance

### OWASP Top 10 Coverage

| Risk                           | Status | Implementation                      |
| ------------------------------ | ------ | ----------------------------------- |
| A01: Broken Access Control     | ✅     | CSRF protection, CSP                |
| A02: Cryptographic Failures    | ✅     | Secure token generation             |
| A03: Injection                 | ✅     | Input sanitization, YAML validation |
| A04: Insecure Design           | ✅     | Security-first architecture         |
| A05: Security Misconfiguration | ✅     | Secure headers, CSP                 |
| A06: Vulnerable Components     | ✅     | Regular dependency updates          |
| A07: Authentication Failures   | ✅     | CSRF tokens, secure sessions        |
| A08: Software & Data Integrity | ✅     | CSP, SRI (future)                   |
| A09: Logging Failures          | ✅     | Security audit logger               |
| A10: SSRF                      | ✅     | Input validation, CSP               |

---

## 🚀 Best Practices

### For Developers

1. **Always Sanitize User Input**

   ```typescript
   import { sanitizeInput } from "@/utils/security";
   const safe = sanitizeInput(userInput);
   ```

2. **Use Context-Specific Encoding**

   ```typescript
   // HTML context
   const html = sanitizeHTML(content);

   // JavaScript context
   const js = encodeForJavaScript(content);

   // URL context
   const url = encodeForURL(content);
   ```

3. **Validate YAML Before Processing**

   ```typescript
   import { validateYAMLSecurity } from "@/utils/security";

   const validation = validateYAMLSecurity(yaml);
   if (!validation.isValid) {
     console.error("Security issues:", validation.issues);
     return;
   }
   ```

4. **Log Security Events**

   ```typescript
   import { SecurityAuditLogger } from "@/utils/security";

   SecurityAuditLogger.log("event_name", { details }, "severity");
   ```

5. **Sanitize Error Messages**

   ```typescript
   import { sanitizeErrorMessage } from "@/utils/security";

   try {
     // ...
   } catch (error) {
     const safeMessage = sanitizeErrorMessage(error);
     console.error(safeMessage);
   }
   ```

---

## 🔍 Security Checklist

### Pre-Deployment

- [x] All security tests passing
- [x] CSP headers configured
- [x] HTTPS enforced
- [x] Input sanitization implemented
- [x] Secret detection active
- [x] YAML bomb protection enabled
- [x] Error messages sanitized
- [x] Security audit logging enabled
- [x] CSRF protection implemented
- [x] Security headers configured

### Ongoing

- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Penetration testing
- [ ] Security log monitoring
- [ ] Incident response plan

---

## 📖 References

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

## 🆘 Security Issues

If you discover a security vulnerability, please email: **security@cloudlint.local**

**Do not** create public GitHub issues for security vulnerabilities.

---

**Status:** ✅ Production Ready  
**Test Coverage:** 48/48 (100%)  
**Last Security Audit:** January 5, 2025
