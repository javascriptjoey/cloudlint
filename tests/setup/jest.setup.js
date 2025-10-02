// Jest setup file for CloudLint tests

// Extend Jest matchers
import { jest } from '@jest/globals';

// Set longer timeout for integration tests
jest.setTimeout(30000);

// Mock console methods during tests to reduce noise
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Global test utilities
global.testUtils = {
  // Helper to create test YAML with specific indentation
  createIndentedYaml: (baseIndent, errorIndent) => {
    return `items:
${' '.repeat(baseIndent)}- first
${' '.repeat(errorIndent)}- second
${' '.repeat(baseIndent)}- third`;
  },
  
  // Helper to wait for a specific amount of time
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to find error by type in validation results
  findErrorByType: (messages, type) => {
    return messages.find(msg => {
      switch (type) {
        case 'indentation':
          return msg.message.includes('Inconsistent list indentation');
        case 'tab':
          return msg.message.includes('Tab character');
        case 'odd-spacing':
          return msg.message.includes('Odd indentation');
        case 'missing-space':
          return msg.message.includes('Missing space after colon');
        default:
          return false;
      }
    });
  }
};

// Environment detection
process.env.NODE_ENV = 'test';

// Clean up after each test
afterEach(() => {
  // Clear any timers
  jest.clearAllTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Custom matchers for YAML validation
expect.extend({
  toHaveIndentationError(received, expectedLine, expectedSpaces, actualSpaces) {
    const hasError = received.messages.some(msg => 
      msg.message.includes(`line ${expectedLine}`) &&
      msg.message.includes(`expected ${expectedSpaces}`) &&
      msg.message.includes(`got ${actualSpaces}`)
    );
    
    return {
      message: () => 
        hasError 
          ? `Expected validation result not to have indentation error on line ${expectedLine}`
          : `Expected validation result to have indentation error on line ${expectedLine} (expected ${expectedSpaces}, got ${actualSpaces})`,
      pass: hasError,
    };
  },
  
  toHaveErrorOfType(received, errorType) {
    const errorPatterns = {
      indentation: /inconsistent.*list.*indentation/i,
      tab: /tab.*character/i,
      'odd-spacing': /odd.*indentation/i,
      'missing-space': /missing.*space.*colon/i
    };
    
    const pattern = errorPatterns[errorType];
    if (!pattern) {
      throw new Error(`Unknown error type: ${errorType}`);
    }
    
    const hasError = received.messages.some(msg => pattern.test(msg.message));
    
    return {
      message: () => 
        hasError 
          ? `Expected validation result not to have ${errorType} error`
          : `Expected validation result to have ${errorType} error`,
      pass: hasError,
    };
  }
});