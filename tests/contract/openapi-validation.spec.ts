import { test, expect } from '@playwright/test'

// OpenAPI Schema Definitions for Cloudlint API
const CLOUDLINT_OPENAPI_SCHEMA = {
  openapi: '3.0.3',
  info: {
    title: 'Cloudlint API',
    version: '1.0.0',
    description: 'YAML validation and processing API with provider awareness'
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local development server' }
  ],
  paths: {
    '/api/validate': {
      post: {
        summary: 'Validate YAML content',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['yaml'],
                properties: {
                  yaml: { type: 'string', minLength: 1, maxLength: 2097152 }, // 2MB limit
                },
                additionalProperties: false
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Validation completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ok', 'messages'],
                  properties: {
                    ok: { type: 'boolean' },
                    messages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['message', 'severity'],
                        properties: {
                          message: { type: 'string', minLength: 1 },
                          severity: { type: 'string', enum: ['error', 'warning', 'info'] },
                          line: { type: 'integer', minimum: 1 },
                          column: { type: 'integer', minimum: 1 }
                        },
                        additionalProperties: false
                      }
                    },
                    fixed: { type: 'string' }
                  },
                  additionalProperties: false
                }
              }
            }
          },
          '400': {
            description: 'Bad request - invalid YAML or missing parameters',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['error'],
                  properties: {
                    error: { type: 'string', minLength: 1 },
                    details: { type: 'string' }
                  },
                  additionalProperties: false
                }
              }
            }
          },
          '413': {
            description: 'Payload too large',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['error'],
                  properties: {
                    error: { type: 'string', pattern: 'Payload too large' }
                  },
                  additionalProperties: false
                }
              }
            }
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['error'],
                  properties: {
                    error: { type: 'string' },
                    retryAfter: { type: 'integer', minimum: 1 }
                  },
                  additionalProperties: false
                }
              }
            }
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['error'],
                  properties: {
                    error: { type: 'string', minLength: 1 }
                  },
                  additionalProperties: false
                }
              }
            }
          }
        }
      }
    },
    '/api/convert': {
      post: {
        summary: 'Convert YAML to JSON',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['yaml'],
                properties: {
                  yaml: { type: 'string', minLength: 1, maxLength: 2097152 }
                },
                additionalProperties: false
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Conversion completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['json'],
                  properties: {
                    json: { type: 'string', minLength: 1 }
                  },
                  additionalProperties: false
                }
              }
            }
          },
          '400': { '$ref': '#/paths/~1api~1validate/post/responses/400' },
          '413': { '$ref': '#/paths/~1api~1validate/post/responses/413' },
          '429': { '$ref': '#/paths/~1api~1validate/post/responses/429' },
          '500': { '$ref': '#/paths/~1api~1validate/post/responses/500' }
        }
      }
    },
    '/api/suggest': {
      post: {
        summary: 'Get provider-aware suggestions for YAML content',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['yaml'],
                properties: {
                  yaml: { type: 'string', minLength: 1, maxLength: 2097152 }
                },
                additionalProperties: false
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Suggestions generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['provider', 'suggestions'],
                  properties: {
                    provider: { type: 'string', enum: ['aws', 'azure', 'generic'] },
                    suggestions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['message', 'type'],
                        properties: {
                          message: { type: 'string', minLength: 1 },
                          type: { type: 'string', enum: ['improvement', 'warning', 'info'] },
                          line: { type: 'integer', minimum: 1 },
                          fix: { type: 'string' }
                        },
                        additionalProperties: false
                      }
                    }
                  },
                  additionalProperties: false
                }
              }
            }
          },
          '400': { '$ref': '#/paths/~1api~1validate/post/responses/400' },
          '429': { '$ref': '#/paths/~1api~1validate/post/responses/429' },
          '500': { '$ref': '#/paths/~1api~1validate/post/responses/500' }
        }
      }
    },
    '/api/schema-validate': {
      post: {
        summary: 'Validate YAML against a JSON schema',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['yaml', 'schema'],
                properties: {
                  yaml: { type: 'string', minLength: 1, maxLength: 2097152 },
                  schema: { type: 'object' }
                },
                additionalProperties: false
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Schema validation completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ok'],
                  properties: {
                    ok: { type: 'boolean' },
                    errors: {
                      type: 'array',
                      items: { type: 'string', minLength: 1 }
                    }
                  },
                  additionalProperties: false
                }
              }
            }
          },
          '400': { '$ref': '#/paths/~1api~1validate/post/responses/400' },
          '429': { '$ref': '#/paths/~1api~1validate/post/responses/429' },
          '500': { '$ref': '#/paths/~1api~1validate/post/responses/500' }
        }
      }
    },
    '/api/diff-preview': {
      post: {
        summary: 'Generate diff preview between original and fixed YAML',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['before', 'after'],
                properties: {
                  before: { type: 'string', minLength: 1, maxLength: 2097152 },
                  after: { type: 'string', minLength: 1, maxLength: 2097152 }
                },
                additionalProperties: false
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Diff preview generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['diff', 'before', 'after'],
                  properties: {
                    diff: { type: 'string', minLength: 1 },
                    before: { type: 'string', minLength: 1 },
                    after: { type: 'string', minLength: 1 }
                  },
                  additionalProperties: false
                }
              }
            }
          },
          '400': { '$ref': '#/paths/~1api~1validate/post/responses/400' },
          '500': { '$ref': '#/paths/~1api~1validate/post/responses/500' }
        }
      }
    },
    '/health': {
      get: {
        summary: 'Health check endpoint',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status', 'timestamp'],
                  properties: {
                    status: { type: 'string', pattern: '^(ok|healthy)$' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string' },
                    uptime: { type: 'number', minimum: 0 }
                  },
                  additionalProperties: false
                }
              }
            }
          }
        }
      }
    }
  }
}

// JSON Schema validation helper
function validateJsonSchema(data: unknown, schema: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Simple JSON Schema validator (basic implementation)
  function validateObject(obj: unknown, objSchema: unknown, path = ''): void {
    if (objSchema.type === 'object') {
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        errors.push(`${path}: Expected object, got ${typeof obj}`)
        return
      }
      
      // Check required properties
      if (objSchema.required) {
        for (const requiredProp of objSchema.required) {
          if (!(requiredProp in obj)) {
            errors.push(`${path}: Missing required property '${requiredProp}'`)
          }
        }
      }
      
      // Check properties
      if (objSchema.properties) {
        for (const [key, value] of Object.entries(obj)) {
          const propSchema = objSchema.properties[key]
          if (propSchema) {
            validateObject(value, propSchema, `${path}.${key}`)
          } else if (objSchema.additionalProperties === false) {
            errors.push(`${path}: Additional property '${key}' not allowed`)
          }
        }
      }
    } else if (objSchema.type === 'array') {
      if (!Array.isArray(obj)) {
        errors.push(`${path}: Expected array, got ${typeof obj}`)
        return
      }
      
      if (objSchema.items) {
        obj.forEach((item, index) => {
          validateObject(item, objSchema.items, `${path}[${index}]`)
        })
      }
    } else if (objSchema.type === 'string') {
      if (typeof obj !== 'string') {
        errors.push(`${path}: Expected string, got ${typeof obj}`)
        return
      }
      
      if (objSchema.minLength && obj.length < objSchema.minLength) {
        errors.push(`${path}: String too short (${obj.length} < ${objSchema.minLength})`)
      }
      
      if (objSchema.maxLength && obj.length > objSchema.maxLength) {
        errors.push(`${path}: String too long (${obj.length} > ${objSchema.maxLength})`)
      }
      
      if (objSchema.pattern) {
        const regex = new RegExp(objSchema.pattern)
        if (!regex.test(obj)) {
          errors.push(`${path}: String does not match pattern ${objSchema.pattern}`)
        }
      }
      
      if (objSchema.enum && !objSchema.enum.includes(obj)) {
        errors.push(`${path}: Value '${obj}' not in allowed enum values: ${objSchema.enum.join(', ')}`)
      }
    } else if (objSchema.type === 'boolean') {
      if (typeof obj !== 'boolean') {
        errors.push(`${path}: Expected boolean, got ${typeof obj}`)
      }
    } else if (objSchema.type === 'integer' || objSchema.type === 'number') {
      if (typeof obj !== 'number') {
        errors.push(`${path}: Expected number, got ${typeof obj}`)
        return
      }
      
      if (objSchema.minimum && obj < objSchema.minimum) {
        errors.push(`${path}: Number too small (${obj} < ${objSchema.minimum})`)
      }
      
      if (objSchema.maximum && obj > objSchema.maximum) {
        errors.push(`${path}: Number too large (${obj} > ${objSchema.maximum})`)
      }
    }
  }
  
  validateObject(data, schema)
  return { valid: errors.length === 0, errors }
}

// API testing helper
async function makeApiRequest(endpoint: string, method: 'GET' | 'POST', body?: unknown) {
  const url = `http://localhost:3001${endpoint}`
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }
  
  if (body && method === 'POST') {
    options.body = JSON.stringify(body)
  }
  
  const response = await fetch(url, options)
  const responseData = await response.json().catch(() => null)
  
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data: responseData,
    ok: response.ok
  }
}

test.describe('API Contract Validation - /api/validate', () => {
  test('validates successful YAML validation response contract', async () => {
    const validYaml = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
data:
  config.yaml: |
    database:
      host: localhost
      port: 5432
`
    
    const response = await makeApiRequest('/api/validate', 'POST', { yaml: validYaml })
    
    // Verify HTTP status
    expect(response.status).toBe(200)
    
    // Verify response structure against OpenAPI schema
    const responseSchema = CLOUDLINT_OPENAPI_SCHEMA.paths['/api/validate'].post.responses['200'].content['application/json'].schema
    const validation = validateJsonSchema(response.data, responseSchema)
    
    expect(validation.valid).toBe(true)
    if (!validation.valid) {
      console.log('Schema validation errors:', validation.errors)
    }
    
    // Verify content type
    expect(response.headers['content-type']).toMatch(/application\/json/)
    
    // Verify required fields
    expect(response.data).toHaveProperty('ok')
    expect(response.data).toHaveProperty('messages')
    expect(typeof response.data.ok).toBe('boolean')
    expect(Array.isArray(response.data.messages)).toBe(true)
  })

  test('validates error response contract for invalid YAML', async () => {
    const invalidYaml = `
invalid: yaml: [missing: bracket
malformed indentation
  wrong: structure
`
    
    const response = await makeApiRequest('/api/validate', 'POST', { yaml: invalidYaml })
    
    // Should return 200 with validation errors (not a request error)
    expect(response.status).toBe(200)
    
    const responseSchema = CLOUDLINT_OPENAPI_SCHEMA.paths['/api/validate'].post.responses['200'].content['application/json'].schema
    const validation = validateJsonSchema(response.data, responseSchema)
    
    expect(validation.valid).toBe(true)
    if (!validation.valid) {
      console.log('Schema validation errors:', validation.errors)
    }
    
    // Should indicate validation failure
    expect(response.data.ok).toBe(false)
    expect(response.data.messages.length).toBeGreaterThan(0)
    
    // Each message should have required fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.data.messages.forEach((msg: any) => {
      expect(msg).toHaveProperty('message')
      expect(msg).toHaveProperty('severity')
      expect(typeof msg.message).toBe('string')
      expect(['error', 'warning', 'info']).toContain(msg.severity)
    })
  })

  test('validates 400 error response contract for missing yaml parameter', async () => {
    const response = await makeApiRequest('/api/validate', 'POST', {})
    
    expect(response.status).toBe(400)
    
    const errorSchema = CLOUDLINT_OPENAPI_SCHEMA.paths['/api/validate'].post.responses['400'].content['application/json'].schema
    const validation = validateJsonSchema(response.data, errorSchema)
    
    expect(validation.valid).toBe(true)
    if (!validation.valid) {
      console.log('Schema validation errors:', validation.errors)
    }
    
    expect(response.data).toHaveProperty('error')
    expect(typeof response.data.error).toBe('string')
  })

  test('validates 413 error response contract for oversized payload', async () => {
    // Generate oversized YAML (over 2MB)
    const oversizedYaml = 'data:\n' + '  item: "' + 'x'.repeat(2.5 * 1024 * 1024) + '"\n'
    
    const response = await makeApiRequest('/api/validate', 'POST', { yaml: oversizedYaml })
    
    // Should return 413 or 400 depending on server configuration
    expect([413, 400]).toContain(response.status)
    
    if (response.status === 413) {
      const errorSchema = CLOUDLINT_OPENAPI_SCHEMA.paths['/api/validate'].post.responses['413'].content['application/json'].schema
      const validation = validateJsonSchema(response.data, errorSchema)
      
      expect(validation.valid).toBe(true)
      expect(response.data.error).toMatch(/too large|size|limit/i)
    }
  })
})

test.describe('API Contract Validation - /api/convert', () => {
  test('validates successful YAML to JSON conversion contract', async () => {
    const yamlInput = `
name: test-app
version: 1.0.0
dependencies:
  - react
  - typescript
config:
  port: 3000
  debug: true
`
    
    const response = await makeApiRequest('/api/convert', 'POST', { yaml: yamlInput })
    
    expect(response.status).toBe(200)
    
    const responseSchema = CLOUDLINT_OPENAPI_SCHEMA.paths['/api/convert'].post.responses['200'].content['application/json'].schema
    const validation = validateJsonSchema(response.data, responseSchema)
    
    expect(validation.valid).toBe(true)
    expect(response.data).toHaveProperty('json')
    expect(typeof response.data.json).toBe('string')
    
    // Verify the JSON is valid JSON
    expect(() => JSON.parse(response.data.json)).not.toThrow()
  })

  test('validates conversion error contract for malformed YAML', async () => {
    const malformedYaml = `
invalid: yaml: [
  missing: bracket
  bad: indentation
wrong: structure
`
    
    const response = await makeApiRequest('/api/convert', 'POST', { yaml: malformedYaml })
    
    // Should return error response
    expect([400, 500]).toContain(response.status)
    
    if (response.status === 400) {
      const errorSchema = CLOUDLINT_OPENAPI_SCHEMA.paths['/api/convert'].post.responses['400'].content['application/json'].schema
      const validation = validateJsonSchema(response.data, errorSchema)
      expect(validation.valid).toBe(true)
    }
    
    expect(response.data).toHaveProperty('error')
    expect(typeof response.data.error).toBe('string')
  })
})

test.describe('API Contract Validation - /api/suggest', () => {
  test('validates provider suggestion response contract', async () => {
    const awsYaml = `
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Test CloudFormation template'
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: test-bucket
`
    
    const response = await makeApiRequest('/api/suggest', 'POST', { yaml: awsYaml })
    
    expect(response.status).toBe(200)
    
    const responseSchema = CLOUDLINT_OPENAPI_SCHEMA.paths['/api/suggest'].post.responses['200'].content['application/json'].schema
    const validation = validateJsonSchema(response.data, responseSchema)
    
    expect(validation.valid).toBe(true)
    if (!validation.valid) {
      console.log('Schema validation errors:', validation.errors)
    }
    
    expect(response.data).toHaveProperty('provider')
    expect(response.data).toHaveProperty('suggestions')
    expect(['aws', 'azure', 'generic']).toContain(response.data.provider)
    expect(Array.isArray(response.data.suggestions)).toBe(true)
  })
})

test.describe('API Contract Validation - /api/schema-validate', () => {
  test('validates schema validation response contract', async () => {
    const yamlData = `
name: test-user
age: 30
email: test@example.com
`
    
    const jsonSchema = {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        age: { type: 'integer', minimum: 0 },
        email: { type: 'string', format: 'email' }
      }
    }
    
    const response = await makeApiRequest('/api/schema-validate', 'POST', { 
      yaml: yamlData, 
      schema: jsonSchema 
    })
    
    expect(response.status).toBe(200)
    
    const responseSchema = CLOUDLINT_OPENAPI_SCHEMA.paths['/api/schema-validate'].post.responses['200'].content['application/json'].schema
    const validation = validateJsonSchema(response.data, responseSchema)
    
    expect(validation.valid).toBe(true)
    expect(response.data).toHaveProperty('ok')
    expect(typeof response.data.ok).toBe('boolean')
    
    if (!response.data.ok) {
      expect(response.data).toHaveProperty('errors')
      expect(Array.isArray(response.data.errors)).toBe(true)
    }
  })
})

test.describe('API Contract Validation - /health', () => {
  test('validates health check response contract', async () => {
    const response = await makeApiRequest('/health', 'GET')
    
    expect(response.status).toBe(200)
    
    const responseSchema = CLOUDLINT_OPENAPI_SCHEMA.paths['/health'].get.responses['200'].content['application/json'].schema
    const validation = validateJsonSchema(response.data, responseSchema)
    
    expect(validation.valid).toBe(true)
    if (!validation.valid) {
      console.log('Schema validation errors:', validation.errors)
    }
    
    expect(response.data).toHaveProperty('status')
    expect(response.data).toHaveProperty('timestamp')
    expect(['ok', 'healthy']).toContain(response.data.status)
    
    // Verify timestamp format (ISO 8601)
    expect(new Date(response.data.timestamp).toISOString()).toBe(response.data.timestamp)
  })
})

test.describe('API Backward Compatibility Tests', () => {
  test('ensures API responses maintain backward compatibility', async () => {
    // Test that API responses don't break existing clients
    const testCases = [
      { endpoint: '/api/validate', method: 'POST' as const, body: { yaml: 'test: value\n' } },
      { endpoint: '/api/convert', method: 'POST' as const, body: { yaml: 'test: value\n' } },
      { endpoint: '/api/suggest', method: 'POST' as const, body: { yaml: 'test: value\n' } },
      { endpoint: '/health', method: 'GET' as const }
    ]
    
    for (const testCase of testCases) {
      const response = await makeApiRequest(testCase.endpoint, testCase.method, testCase.body)
      
      // Should not return unexpected status codes
      expect(response.status).not.toBe(404) // Endpoint should exist
      expect(response.status).not.toBe(501) // Should be implemented
      
      // Should return JSON content type
      if (response.ok) {
        expect(response.headers['content-type']).toMatch(/application\/json/)
      }
      
      console.log(`✓ ${testCase.method} ${testCase.endpoint}: ${response.status}`)
    }
  })
})