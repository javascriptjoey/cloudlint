import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { validateYAML } from '../../src/utils/validation.js';
import { validYamlCases, invalidYamlCases } from '../fixtures/yaml-validation-cases.js';

// Create test server
function createTestServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post('/validate', (req, res) => {
    const { yaml } = req.body || {};
    
    if (!yaml || yaml.trim() === '') {
      return res.json({ ok: true, messages: [] });
    }
    
    try {
      const result = validateYAML(yaml);
      res.json(result);
    } catch (error) {
      res.json({ 
        ok: false, 
        messages: [{ message: 'Internal validation error', severity: 'error' }] 
      });
    }
  });

  app.post('/suggest', (req, res) => {
    res.json({ provider: 'Generic' });
  });

  app.post('/convert', (req, res) => {
    const { yaml } = req.body || {};
    try {
      const lines = yaml?.split('\\n') || [];
      const obj = {};
      
      lines.forEach(line => {
        if (line.includes(': ')) {
          const [key, value] = line.split(': ', 2);
          obj[key.trim()] = value.trim();
        }
      });
      
      res.json({ json: JSON.stringify(obj, null, 2) });
    } catch (error) {
      res.status(400).json({ error: 'Failed to convert YAML' });
    }
  });

  return app;
}

describe('Validation API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestServer();
  });

  describe('POST /validate', () => {
    test('should accept valid YAML and return ok: true', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ yaml: 'name: John\\nage: 30' })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.messages).toHaveLength(0);
    });

    test('should reject invalid YAML and return errors', async () => {
      const invalidYaml = `fruits:
  - apple
   - banana
  - orange`;

      const response = await request(app)
        .post('/validate')
        .send({ yaml: invalidYaml })
        .expect(200);

      expect(response.body.ok).toBe(false);
      expect(response.body.messages.length).toBeGreaterThan(0);
      
      // Should have indentation error
      const indentationError = response.body.messages.find(msg => 
        msg.message.includes('Inconsistent list indentation')
      );
      expect(indentationError).toBeTruthy();
      expect(indentationError.message).toMatch(/line 3/);
      expect(indentationError.message).toMatch(/expected 2.*got 3/);
    });

    test('should handle empty YAML', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ yaml: '' })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.messages).toHaveLength(0);
    });

    test('should handle missing yaml field', async () => {
      const response = await request(app)
        .post('/validate')
        .send({})
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.messages).toHaveLength(0);
    });

    test('should handle whitespace-only YAML', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ yaml: '   \\n  \\t  \\n   ' })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.messages).toHaveLength(0);
    });

    describe('All valid test cases', () => {
      validYamlCases.forEach((testCase) => {
        test(`API should accept: ${testCase.name}`, async () => {
          const response = await request(app)
            .post('/validate')
            .send({ yaml: testCase.yaml })
            .expect(200);

          expect(response.body.ok).toBe(true);
          expect(response.body.messages).toHaveLength(0);
        });
      });
    });

    describe('All invalid test cases', () => {
      invalidYamlCases.forEach((testCase) => {
        test(`API should reject: ${testCase.name}`, async () => {
          const response = await request(app)
            .post('/validate')
            .send({ yaml: testCase.yaml })
            .expect(200);

          expect(response.body.ok).toBe(false);
          expect(response.body.messages.length).toBeGreaterThan(0);

          // Verify expected errors are present
          testCase.expectedErrors.forEach((expectedError) => {
            const matchingError = response.body.messages.find((msg) => {
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

    test('should return proper error structure', async () => {
      const response = await request(app)
        .post('/validate')
        .send({ 
          yaml: `name:John\\n   age: 30` // Missing space after colon + odd indentation
        })
        .expect(200);

      expect(response.body.ok).toBe(false);
      expect(response.body.messages).toBeInstanceOf(Array);
      
      response.body.messages.forEach(error => {
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('severity');
        expect(['error', 'warning']).toContain(error.severity);
        expect(typeof error.message).toBe('string');
      });
    });

    test('should handle large YAML files', async () => {
      const lines = ['items:'];
      for (let i = 0; i < 1000; i++) {
        lines.push(`  - item${i}`);
      }
      const largeYaml = lines.join('\\n');

      const response = await request(app)
        .post('/validate')
        .send({ yaml: largeYaml })
        .expect(200);

      expect(response.body.ok).toBe(true);
    });
  });

  describe('POST /suggest', () => {
    test('should return generic provider', async () => {
      const response = await request(app)
        .post('/suggest')
        .send({ yaml: 'test: value' })
        .expect(200);

      expect(response.body.provider).toBe('Generic');
    });
  });

  describe('POST /convert', () => {
    test('should convert simple YAML to JSON', async () => {
      const response = await request(app)
        .post('/convert')
        .send({ yaml: 'name: John\\nage: 30' })
        .expect(200);

      expect(response.body.json).toBeDefined();
      const parsed = JSON.parse(response.body.json);
      expect(parsed.name).toBe('John');
      expect(parsed.age).toBe('30');
    });

    test('should handle empty YAML in conversion', async () => {
      const response = await request(app)
        .post('/convert')
        .send({ yaml: '' })
        .expect(200);

      expect(response.body.json).toBeDefined();
    });
  });

  describe('Request validation', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/validate')
        .send('invalid json')
        .expect(400);
    });

    test('should handle very large requests', async () => {
      const massiveYaml = 'x'.repeat(1000000); // 1MB string
      
      const response = await request(app)
        .post('/validate')
        .send({ yaml: massiveYaml })
        .expect(200);

      // Should still process, even if it takes a while
      expect(response.body).toHaveProperty('ok');
      expect(response.body).toHaveProperty('messages');
    });
  });

  describe('Response format consistency', () => {
    test('all responses should have consistent structure', async () => {
      const testCases = [
        { yaml: 'valid: yaml' },
        { yaml: 'invalid:\\n\\tyaml' },
        { yaml: '' },
        {}
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/validate')
          .send(testCase)
          .expect(200);

        expect(response.body).toHaveProperty('ok');
        expect(response.body).toHaveProperty('messages');
        expect(typeof response.body.ok).toBe('boolean');
        expect(Array.isArray(response.body.messages)).toBe(true);
      }
    });
  });
});