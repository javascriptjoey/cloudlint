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
