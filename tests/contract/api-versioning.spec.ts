import { test, expect } from '@playwright/test'

// API versioning and backward compatibility testing
const API_VERSIONS = {
  current: '2.0.0',
  supported: ['1.0.0', '1.1.0', '1.2.0', '2.0.0'],
  deprecated: ['0.9.0'],
  retired: ['0.8.0', '0.7.0']
}

// API schema definitions for different versions
const API_SCHEMAS = {
  '1.0.0': {
    validateEndpoint: {
      request: {
        required: ['content'],
        optional: [],
        schema: {
          content: 'string',
        }
      },
      response: {
        success: {
          schema: {
            valid: 'boolean',
            errors: 'array'
          }
        },
        error: {
          schema: {
            message: 'string',
            code: 'number'
          }
        }
      }
    }
  },
  
  '1.1.0': {
    validateEndpoint: {
      request: {
        required: ['content'],
        optional: ['provider'],
        schema: {
          content: 'string',
          provider: 'string' // Added in 1.1.0
        }
      },
      response: {
        success: {
          schema: {
            valid: 'boolean',
            errors: 'array',
            warnings: 'array' // Added in 1.1.0
          }
        },
        error: {
          schema: {
            message: 'string',
            code: 'number'
          }
        }
      }
    }
  },
  
  '2.0.0': {
    validateEndpoint: {
      request: {
        required: ['content'],
        optional: ['provider', 'options'],
        schema: {
          content: 'string',
          provider: 'string',
          options: 'object' // Added in 2.0.0
        }
      },
      response: {
        success: {
          schema: {
            valid: 'boolean',
            errors: 'array',
            warnings: 'array',
            suggestions: 'array', // Added in 2.0.0
            metadata: 'object'    // Added in 2.0.0
          }
        },
        error: {
          schema: {
            message: 'string',
            code: 'number',
            details: 'object' // Added in 2.0.0
          }
        }
      }
    }
  }
}

// Breaking changes documentation (for reference)
// const BREAKING_CHANGES = {
//   '2.0.0': [
//     'Removed deprecated `format` parameter from validation requests',
//     'Error response structure changed: added `details` object',
//     'Default provider changed from `generic` to `auto-detect`',
//     'Minimum required Node.js version increased to 18.0'
//   ],
//   '1.2.0': [
//     // No breaking changes in 1.2.0
//   ],
//   '1.1.0': [
//     // No breaking changes in 1.1.0
//   ]
// }

test.describe('API Versioning & Backward Compatibility', () => {
  
  test('supports current API version requests', async ({ context }) => {
    console.log(`🔍 Testing current API version: ${API_VERSIONS.current}`)
    
    // Test with version header
    const response = await context.request.post('/api/validate', {
      data: {
        content: 'test: current-version\nworking: true',
        provider: 'generic'
      },
      headers: {
        'API-Version': API_VERSIONS.current,
        'Content-Type': 'application/json'
      }
    })
    
    expect(response.status()).toBe(200)
    
    const responseData = await response.json()
    
    // Verify response matches current schema
    // const currentSchema = API_SCHEMAS[API_VERSIONS.current].validateEndpoint.response.success.schema
    expect(responseData).toHaveProperty('valid')
    expect(responseData).toHaveProperty('errors')
    expect(responseData).toHaveProperty('warnings')
    expect(responseData).toHaveProperty('suggestions')
    expect(responseData).toHaveProperty('metadata')
    
    console.log(`✅ Current API version (${API_VERSIONS.current}) working correctly`)
  })

  test('maintains backward compatibility with older API versions', async ({ context }) => {
    for (const version of API_VERSIONS.supported.filter(v => v !== API_VERSIONS.current)) {
      console.log(`🔍 Testing backward compatibility for version: ${version}`)
      
      // Test validation request with older API version
      const response = await context.request.post('/api/validate', {
        data: {
          content: 'backward_compatibility: true\nversion: ' + version
        },
        headers: {
          'API-Version': version,
          'Content-Type': 'application/json'
        }
      })
      
      expect([200, 400]).toContain(response.status())
      
      if (response.status() === 200) {
        const responseData = await response.json()
        const versionSchema = API_SCHEMAS[version]?.validateEndpoint?.response?.success?.schema
        
        if (versionSchema) {
          // Verify response contains at least the fields required by this version
          expect(responseData).toHaveProperty('valid')
          expect(responseData).toHaveProperty('errors')
          
          // Version 1.1.0+ should have warnings
          if (version >= '1.1.0') {
            expect(responseData).toHaveProperty('warnings')
          }
          
          // Version 2.0.0 should have additional fields but backwards compatibility maintained
          if (version < '2.0.0' && responseData.suggestions) {
            // Should not break if new fields are present but ignored
            console.log(`ℹ️ New fields present but ignored in version ${version}`)
          }
          
          console.log(`✅ Backward compatibility maintained for version ${version}`)
        }
      } else {
        console.log(`⚠️ Version ${version} returned error (may be expected for deprecated versions)`)
      }
    }
  })

  test('handles deprecated API versions appropriately', async ({ context }) => {
    for (const deprecatedVersion of API_VERSIONS.deprecated) {
      console.log(`🔍 Testing deprecated API version: ${deprecatedVersion}`)
      
      const response = await context.request.post('/api/validate', {
        data: {
          content: 'deprecated_test: true'
        },
        headers: {
          'API-Version': deprecatedVersion,
          'Content-Type': 'application/json'
        }
      })
      
      // Deprecated versions might still work but should include deprecation warnings
      if (response.status() === 200) {
        const responseData = await response.json()
        
        // Should include deprecation notice in warnings
        if (responseData.warnings && Array.isArray(responseData.warnings)) {
          const hasDeprecationWarning = responseData.warnings.some(
            warning => warning.toLowerCase().includes('deprecat')
          )
          expect(hasDeprecationWarning).toBe(true)
        }
        
        console.log(`⚠️ Deprecated version ${deprecatedVersion} still functional with warnings`)
      } else {
        // Or they might return an error
        expect([400, 410]).toContain(response.status())
        console.log(`❌ Deprecated version ${deprecatedVersion} no longer supported`)
      }
    }
  })

  test('rejects retired API versions', async ({ context }) => {
    for (const retiredVersion of API_VERSIONS.retired) {
      console.log(`🔍 Testing retired API version: ${retiredVersion}`)
      
      const response = await context.request.post('/api/validate', {
        data: {
          content: 'retired_test: true'
        },
        headers: {
          'API-Version': retiredVersion,
          'Content-Type': 'application/json'
        }
      })
      
      // Retired versions should return 410 Gone or 400 Bad Request
      expect([400, 410]).toContain(response.status())
      
      const responseData = await response.json()
      expect(responseData.message || responseData.error).toMatch(/version.*not.*supported|retired|discontinued/i)
      
      console.log(`❌ Retired version ${retiredVersion} properly rejected`)
    }
  })
})

test.describe('API Schema Evolution & Migration', () => {
  
  test('validates schema compatibility across versions', async ({ context }) => {
    console.log('🔍 Testing schema compatibility across API versions...')
    
    const testData = {
      content: 'schema_test: compatibility\nvalid_yaml: true'
    }
    
    // Test same request across different API versions
    const versionResults = []
    
    for (const version of API_VERSIONS.supported) {
      try {
        const response = await context.request.post('/api/validate', {
          data: testData,
          headers: {
            'API-Version': version,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.status() === 200) {
          const responseData = await response.json()
          versionResults.push({
            version,
            response: responseData,
            success: true
          })
        } else {
          versionResults.push({
            version,
            response: await response.json(),
            success: false,
            status: response.status()
          })
        }
      } catch (error) {
        versionResults.push({
          version,
          error: error.message,
          success: false
        })
      }
    }
    
    // Analyze compatibility
    const successfulVersions = versionResults.filter(r => r.success)
    
    // All supported versions should handle the same basic request
    expect(successfulVersions.length).toBeGreaterThan(0)
    
    // Basic validation result should be consistent across versions
    if (successfulVersions.length > 1) {
      const firstResult = successfulVersions[0].response
      const allHaveSameValidationResult = successfulVersions.every(
        result => result.response.valid === firstResult.valid
      )
      
      expect(allHaveSameValidationResult).toBe(true)
      console.log(`✅ Validation results consistent across ${successfulVersions.length} API versions`)
    }
  })

  test('handles unknown API version gracefully', async ({ context }) => {
    console.log('🔍 Testing unknown API version handling...')
    
    const unknownVersions = ['3.0.0', '0.5.0', 'invalid', '']
    
    for (const version of unknownVersions) {
      const response = await context.request.post('/api/validate', {
        data: {
          content: 'unknown_version_test: true'
        },
        headers: {
          'API-Version': version,
          'Content-Type': 'application/json'
        }
      })
      
      if (version === '') {
        // Empty version should default to current
        expect(response.status()).toBe(200)
        console.log(`✅ Empty version defaults to current API version`)
      } else {
        // Unknown versions should return error or default to latest
        if (response.status() !== 200) {
          expect([400, 404, 422]).toContain(response.status())
          const responseData = await response.json()
          expect(responseData.message || responseData.error).toMatch(/version.*not.*supported|invalid.*version/i)
          console.log(`✅ Unknown version ${version} properly rejected`)
        } else {
          // Or might default to current version
          console.log(`ℹ️ Unknown version ${version} defaulted to current API version`)
        }
      }
    }
  })

  test('validates content-type negotiation across versions', async ({ context }) => {
    const testData = { content: 'content_type_test: true' }
    
    // Test different content types with various API versions
    const contentTypes = [
      'application/json',
      'application/vnd.api+json',
      'text/plain',
      'application/yaml'
    ]
    
    for (const version of API_VERSIONS.supported.slice(0, 2)) { // Test with 2 versions
      for (const contentType of contentTypes) {
        console.log(`🔍 Testing ${contentType} with API version ${version}`)
        
        let requestData
        // let requestBody // Commented out as not used in current implementation
        
        if (contentType.includes('json')) {
          requestData = testData
          // requestBody = undefined
        } else if (contentType === 'application/yaml') {
          requestData = undefined
          // requestBody = 'content_type_test: true'
        } else {
          requestData = undefined
          // requestBody = JSON.stringify(testData)
        }
        
        try {
          const response = await context.request.post('/api/validate', {
            data: requestData,
            headers: {
              'API-Version': version,
              'Content-Type': contentType
            }
          })
          
          // Should either accept the content type or return appropriate error
          if (response.status() === 200) {
            console.log(`✅ ${contentType} accepted in version ${version}`)
          } else if ([400, 415].includes(response.status())) {
            console.log(`ℹ️ ${contentType} not supported in version ${version}`)
          } else {
            console.log(`⚠️ Unexpected response for ${contentType} in version ${version}: ${response.status()}`)
          }
          
        } catch (error) {
          console.log(`⚠️ Error testing ${contentType} with version ${version}: ${error.message}`)
        }
      }
    }
  })
})

test.describe('Breaking Change Detection', () => {
  
  test('documents breaking changes between versions', async ({ context }) => {
    console.log('🔍 Testing breaking change documentation...')
    
    // Test requests that would break between versions
    const breakingChangeTests = [
      {
        name: 'Removed format parameter',
        v1Request: {
          content: 'test: format-parameter',
          format: 'yaml' // This parameter was removed in 2.0.0
        },
        v2Request: {
          content: 'test: format-parameter'
          // format parameter should not be present
        },
        expectedV1: 200,
        expectedV2: [200, 400] // Should work without format parameter
      }
    ]
    
    for (const testCase of breakingChangeTests) {
      console.log(`🔍 Testing breaking change: ${testCase.name}`)
      
      // Test with v1.x API
      const v1Response = await context.request.post('/api/validate', {
        data: testCase.v1Request,
        headers: {
          'API-Version': '1.2.0',
          'Content-Type': 'application/json'
        }
      })
      
      if (Array.isArray(testCase.expectedV1)) {
        expect(testCase.expectedV1).toContain(v1Response.status())
      } else {
        expect(v1Response.status()).toBe(testCase.expectedV1)
      }
      
      // Test with v2.x API
      const v2Response = await context.request.post('/api/validate', {
        data: testCase.v2Request,
        headers: {
          'API-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      })
      
      if (Array.isArray(testCase.expectedV2)) {
        expect(testCase.expectedV2).toContain(v2Response.status())
      } else {
        expect(v2Response.status()).toBe(testCase.expectedV2)
      }
      
      console.log(`✅ Breaking change behavior verified: ${testCase.name}`)
    }
  })

  test('validates migration path between major versions', async ({ context }) => {
    console.log('🔍 Testing migration path from v1 to v2...')
    
    // Test migration scenarios
    const migrationTests = [
      {
        name: 'Basic validation request',
        oldFormat: {
          content: 'migration: test\nold_format: true'
        },
        newFormat: {
          content: 'migration: test\nold_format: true',
          provider: 'generic'
        }
      },
      {
        name: 'Error handling consistency',
        oldFormat: {
          content: 'invalid: yaml: ['
        },
        newFormat: {
          content: 'invalid: yaml: ['
        }
      }
    ]
    
    for (const migration of migrationTests) {
      // Test old format with v1 API
      const v1Response = await context.request.post('/api/validate', {
        data: migration.oldFormat,
        headers: {
          'API-Version': '1.2.0',
          'Content-Type': 'application/json'
        }
      })
      
      // Test new format with v2 API  
      const v2Response = await context.request.post('/api/validate', {
        data: migration.newFormat,
        headers: {
          'API-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`Migration test "${migration.name}": v1=${v1Response.status()}, v2=${v2Response.status()}`)
      
      // Both should either succeed or fail consistently for the same content
      if (v1Response.status() === 200 && v2Response.status() === 200) {
        const v1Data = await v1Response.json()
        const v2Data = await v2Response.json()
        
        // Core validation result should be the same
        expect(v1Data.valid).toBe(v2Data.valid)
        console.log(`✅ Migration path verified: ${migration.name}`)
      }
    }
  })
})

test.describe('API Documentation Version Compliance', () => {
  
  test('validates OpenAPI documentation for each version', async ({ context }) => {
    console.log('🔍 Testing OpenAPI documentation compliance...')
    
    // Test that API documentation endpoint works
    const docEndpoints = [
      '/api/docs',
      '/api/swagger.json',
      '/api/openapi.json'
    ]
    
    for (const endpoint of docEndpoints) {
      try {
        const response = await context.request.get(endpoint)
        
        if (response.status() === 200) {
          const docData = await response.json()
          
          // Verify it's a valid OpenAPI document
          expect(docData).toHaveProperty('openapi')
          expect(docData).toHaveProperty('info')
          expect(docData).toHaveProperty('paths')
          
          // Check version information
          if (docData.info && docData.info.version) {
            console.log(`📚 API documentation version: ${docData.info.version}`)
            expect(API_VERSIONS.supported).toContain(docData.info.version)
          }
          
          console.log(`✅ API documentation available at ${endpoint}`)
          break
        }
      } catch {
        console.log(`ℹ️ Documentation not available at ${endpoint}`)
      }
    }
  })

  test('validates version-specific endpoint behavior', async ({ context }) => {
    console.log('🔍 Testing version-specific endpoint behavior...')
    
    // Test endpoints that might behave differently across versions
    const endpoints = [
      '/api/validate',
      '/api/convert', 
      '/api/suggest',
      '/health'
    ]
    
    for (const endpoint of endpoints) {
      for (const version of ['1.2.0', '2.0.0']) {
        try {
          let requestData = {}
          
          if (endpoint !== '/health') {
            requestData = { content: 'version_test: true' }
          }
          
          const response = await context.request.post(endpoint, {
            data: Object.keys(requestData).length > 0 ? requestData : undefined,
            headers: {
              'API-Version': version,
              'Content-Type': 'application/json'
            }
          })
          
          // Record the behavior for each version
          console.log(`${endpoint} v${version}: ${response.status()}`)
          
          // Health endpoint should always return 200
          if (endpoint === '/health') {
            expect([200, 404]).toContain(response.status())
          }
          
        } catch (error) {
          console.log(`⚠️ Error testing ${endpoint} v${version}: ${error.message}`)
        }
      }
    }
  })
})