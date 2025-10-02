/* eslint-disable no-console */

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  action: string;
  data?: any;
  userId?: string;
}

class Logger {
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;
  
  private createEntry(
    level: LogEntry['level'],
    category: string,
    action: string,
    data?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      action,
      data: data ? this.sanitizeData(data) : undefined,
      userId: this.getUserId()
    };
  }
  
  private sanitizeData(data: any): any {
    if (typeof data === 'string' && data.length > 1000) {
      return data.substring(0, 1000) + '... [truncated]';
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      // Remove potentially sensitive data
      ['password', 'token', 'key', 'secret'].forEach(key => {
        if (key in sanitized) {
          sanitized[key] = '[REDACTED]';
        }
      });
      
      // Truncate large objects
      const jsonStr = JSON.stringify(sanitized);
      if (jsonStr.length > 2000) {
        return '[Large Object - truncated]';
      }
      
      return sanitized;
    }
    
    return data;
  }
  
  private getUserId(): string {
    // Generate a session-based user ID for tracking
    let userId = sessionStorage.getItem('cloudlint-session-id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('cloudlint-session-id', userId);
    }
    return userId;
  }
  
  private log(entry: LogEntry) {
    // Always log to console with structured format
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    const message = `${prefix} ${entry.action}`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.data);
        break;
      case 'info':
        console.info(message, entry.data);
        break;
      case 'warn':
        console.warn(message, entry.data);
        break;
      case 'error':
        console.error(message, entry.data);
        break;
    }
    
    // Store in buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }
  
  // User interaction logging
  userAction(action: string, data?: any) {
    this.log(this.createEntry('info', 'USER', action, data));
  }
  
  // Editor events
  editorEvent(action: string, data?: any) {
    this.log(this.createEntry('debug', 'EDITOR', action, data));
  }
  
  // Validation events
  validationEvent(action: string, data?: any) {
    this.log(this.createEntry('info', 'VALIDATION', action, data));
  }
  
  // API calls
  apiCall(action: string, data?: any) {
    this.log(this.createEntry('info', 'API', action, data));
  }
  
  // UI state changes
  uiStateChange(action: string, data?: any) {
    this.log(this.createEntry('debug', 'UI_STATE', action, data));
  }
  
  // Errors
  error(category: string, action: string, error: Error | string, data?: any) {
    const errorData = {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      ...data
    };
    this.log(this.createEntry('error', category, action, errorData));
  }
  
  // Performance tracking
  performance(action: string, duration: number, data?: any) {
    this.log(this.createEntry('info', 'PERFORMANCE', action, { 
      duration_ms: duration,
      ...data 
    }));
  }
  
  // Get recent logs (for debugging)
  getRecentLogs(count = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }
  
  // Export logs for support/debugging
  exportLogs(): string {
    const logs = this.logBuffer.map(entry => 
      `${entry.timestamp} [${entry.level.toUpperCase()}] [${entry.category}] ${entry.action}` +
      (entry.data ? ` | ${JSON.stringify(entry.data)}` : '')
    ).join('\n');
    
    return logs;
  }
  
  // Clear logs
  clearLogs() {
    this.logBuffer = [];
    console.info('[LOGGER] Log buffer cleared');
  }
  
  // Window error handler
  setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      this.error('GLOBAL', 'unhandled_error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.error('GLOBAL', 'unhandled_promise_rejection', event.reason);
    });
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Initialize global error handling
logger.setupGlobalErrorHandling();

// Add to window for debugging in console
if (typeof window !== 'undefined') {
  (window as any).cloudlintLogger = {
    getLogs: () => logger.getRecentLogs(),
    exportLogs: () => logger.exportLogs(),
    clearLogs: () => logger.clearLogs()
  };
}

export default logger;