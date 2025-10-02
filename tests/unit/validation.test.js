import { describe, test, expect } from '@jest/globals';
import { validYamlCases, invalidYamlCases, edgeCases, createIndentationErrorCase } from '../fixtures/yaml-validation-cases.js';

// Import the validation function - we'll need to extract it to a separate module
import { validateYAML } from '../../src/utils/validation.js';

describe('YAML Validation Function', () => {
  describe('Valid YAML cases', () => {
    validYamlCases.forEach((testCase) => {
      test(`should pass: ${testCase.name}`, () => {
        const result = validateYAML(testCase.yaml);
        
        expect(result.ok).toBe(true);
        expect(result.messages).toHaveLength(0);
      });
    });
  });

  describe('Invalid YAML cases', () => {
    invalidYamlCases.forEach((testCase) => {
      test(`should fail: ${testCase.name}`, () => {
        const result = validateYAML(testCase.yaml);
        
        expect(result.ok).toBe(false);
        expect(result.messages.length).toBeGreaterThan(0);
        
        // Check that expected errors are present
        testCase.expectedErrors.forEach((expectedError) => {
          const matchingError = result.messages.find((msg) => {
            const lineMatch = !expectedError.line || msg.message.includes(`line ${expectedError.line}`);
            const messageMatch = expectedError.message.test(msg.message);
            return lineMatch && messageMatch;
          });
          
          expect(matchingError).toBeTruthy();
          expect(matchingError.message).toMatch(expectedError.message);
        });
      });
    });
  });

  describe('Edge cases', () => {
    edgeCases.forEach((testCase) => {
      test(`should handle: ${testCase.name}`, () => {
        const result = validateYAML(testCase.yaml);
        
        if (testCase.shouldPass) {
          expect(result.ok).toBe(true);
          expect(result.messages).toHaveLength(0);
        } else if (testCase.expectedErrors) {
          expect(result.ok).toBe(false);
          testCase.expectedErrors.forEach((expectedError) => {
            const matchingError = result.messages.find((msg) => 
              expectedError.message.test(msg.message)
            );
            expect(matchingError).toBeTruthy();
          });
        }
      });
    });
  });

  describe('Specific indentation scenarios', () => {
    test('should catch 1 vs 2 space indentation', () => {
      const testCase = createIndentationErrorCase(2, 1);
      const result = validateYAML(testCase.yaml);
      
      expect(result.ok).toBe(false);
      expect(result.messages.some(msg => 
        msg.message.includes('expected 2') && msg.message.includes('got 1')
      )).toBe(true);
    });

    test('should catch 2 vs 3 space indentation', () => {
      const testCase = createIndentationErrorCase(2, 3);
      const result = validateYAML(testCase.yaml);
      
      expect(result.ok).toBe(false);
      expect(result.messages.some(msg => 
        msg.message.includes('expected 2') && msg.message.includes('got 3')
      )).toBe(true);
    });

    test('should catch 4 vs 6 space indentation', () => {
      const testCase = createIndentationErrorCase(4, 6);
      const result = validateYAML(testCase.yaml);
      
      expect(result.ok).toBe(false);
      expect(result.messages.some(msg => 
        msg.message.includes('expected 4') && msg.message.includes('got 6')
      )).toBe(true);
    });
  });

  describe('Multiple error detection', () => {
    test('should detect multiple errors in single YAML', () => {
      const yamlWithMultipleErrors = `root:
\tname: John  
   age:30
  - invalid
     - item`;
      
      const result = validateYAML(yamlWithMultipleErrors);
      
      expect(result.ok).toBe(false);
      expect(result.messages.length).toBeGreaterThan(1);
      
      // Should have tab error
      expect(result.messages.some(msg => 
        msg.message.includes('Tab character')
      )).toBe(true);
      
      // Should have odd spacing error
      expect(result.messages.some(msg => 
        msg.message.includes('Odd indentation')
      )).toBe(true);
      
      // Should have missing space after colon
      expect(result.messages.some(msg => 
        msg.message.includes('Missing space after colon')
      )).toBe(true);
    });
  });

  describe('Error message quality', () => {
    test('error messages should include line numbers', () => {
      const yaml = `fruits:
  - apple
   - banana`;
      
      const result = validateYAML(yaml);
      expect(result.ok).toBe(false);
      expect(result.messages.some(msg => 
        msg.message.includes('line 3')
      )).toBe(true);
    });

    test('error messages should include severity levels', () => {
      const yaml = `fruits:
  - apple
   - banana`;
      
      const result = validateYAML(yaml);
      expect(result.messages.every(msg => 
        msg.severity === 'error' || msg.severity === 'warning'
      )).toBe(true);
    });

    test('indentation errors should be marked as errors, not warnings', () => {
      const yaml = `fruits:
  - apple
   - banana`;
      
      const result = validateYAML(yaml);
      const indentationError = result.messages.find(msg => 
        msg.message.includes('Inconsistent list indentation')
      );
      
      expect(indentationError.severity).toBe('error');
    });
  });

  describe('Performance and edge limits', () => {
    test('should handle large YAML files efficiently', () => {
      const lines = ['items:'];
      // Generate 1000 properly indented list items
      for (let i = 0; i < 1000; i++) {
        lines.push(`  - item${i}`);
      }
      const largeYaml = lines.join('\n');
      
      const start = Date.now();
      const result = validateYAML(largeYaml);
      const duration = Date.now() - start;
      
      expect(result.ok).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle deeply nested structures', () => {
      let yaml = 'root:';
      for (let i = 0; i < 20; i++) {
        yaml += '\n' + '  '.repeat(i + 1) + `level${i}:`;
      }
      yaml += '\n' + '  '.repeat(21) + 'value: deep';
      
      const result = validateYAML(yaml);
      expect(result.ok).toBe(true);
    });
  });

  describe('Regression tests', () => {
    test('original issue: banana indentation problem', () => {
      // This is the exact case that was failing in production
      const problematicYaml = `fruits:
  - apple
   - banana
  - orange`;
      
      const result = validateYAML(problematicYaml);
      
      expect(result.ok).toBe(false);
      expect(result.messages.length).toBeGreaterThan(0);
      
      // Should specifically catch the banana line (line 3)
      const bananaError = result.messages.find(msg => 
        msg.message.includes('line 3') && 
        msg.message.includes('Inconsistent list indentation')
      );
      expect(bananaError).toBeTruthy();
      expect(bananaError.message).toMatch(/expected 2.*got 3/i);
    });

    test('URLs should not trigger colon errors', () => {
      const yamlWithUrls = `website: https://example.com
api: http://localhost:3000/api
secure: https://secure.example.com:8443/path`;
      
      const result = validateYAML(yamlWithUrls);
      expect(result.ok).toBe(true);
      
      // Should not have any colon-related errors
      const colonErrors = result.messages.filter(msg => 
        msg.message.includes('Missing space after colon')
      );
      expect(colonErrors).toHaveLength(0);
    });
  });
});