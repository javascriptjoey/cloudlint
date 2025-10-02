import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Playground from '@/pages/Playground'
import { server } from '../mocks/server'
import { setCodeMirrorValue, getCodeMirrorValue } from '../helpers/codemirror'
import { http, HttpResponse } from 'msw'

beforeEach(() => {
  server.resetHandlers()
})

describe('Validation Edge Cases and Functional Tests', () => {
  describe('YAML Syntax Validation', () => {
    it('detects indentation errors correctly', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Indentation error on line 2', severity: 'error' },
              { message: 'Inconsistent indentation', severity: 'warning' }
            ]
          })
        })
      )

      render(<Playground />)
      
      // YAML with indentation problems - this should fail
      const badYaml = `name: test
  version: 1.0
dependencies:
 - package1
    - package2`

      await setCodeMirrorValue(badYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/Found 2 issue/)).toBeInTheDocument()
        expect(screen.getByText('Indentation error on line 2')).toBeInTheDocument()
        expect(screen.getByText('Inconsistent indentation')).toBeInTheDocument()
      })
    })

    it('detects mapping value errors', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'mapping values are not allowed here at line 2', severity: 'error' }
            ]
          })
        })
      )

      render(<Playground />)
      
      // YAML with mapping value errors - invalid colon usage
      const badYaml = `name: test
version: 1.0: invalid
description: valid`

      await setCodeMirrorValue(badYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/mapping values are not allowed here/)).toBeInTheDocument()
      })
    })

    it('detects unexpected end of stream', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Unexpected end of stream at line 3', severity: 'error' }
            ]
          })
        })
      )

      render(<Playground />)
      
      // YAML with incomplete structure
      const incompleteYaml = `name: test
version: 1.0
dependencies:`

      await setCodeMirrorValue(incompleteYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/Unexpected end of stream/)).toBeInTheDocument()
      })
    })

    it('handles complex nested YAML structures', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: [
              { message: 'Complex structure validated successfully', severity: 'info' }
            ]
          })
        })
      )

      render(<Playground />)
      
      const complexYaml = `name: complex-project
version: 1.2.3
metadata:
  author: John Doe
  license: MIT
  tags:
    - web
    - api
    - microservice
dependencies:
  runtime:
    - name: express
      version: "^4.18.0"
    - name: lodash
      version: "4.17.21"
  development:
    - name: jest
      version: "^29.0.0"
scripts:
  build: |
    echo "Building project..."
    npm run compile
  test:
    - npm test
    - npm run lint
environment:
  NODE_ENV: production
  PORT: 3000
  DATABASE_URL: \${DATABASE_URL}
services:
  web:
    image: node:18
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src:ro
    environment:
      - NODE_ENV=production`

      await setCodeMirrorValue(complexYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('No errors found')).toBeInTheDocument()
      })
    })
  })

  describe('Empty and Whitespace Handling', () => {
    it('handles completely empty input gracefully', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        })
      )

      render(<Playground />)
      
      // Ensure editor is empty
      await setCodeMirrorValue('')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('No errors found')).toBeInTheDocument()
      })
    })

    it('handles whitespace-only input', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        })
      )

      render(<Playground />)
      
      // Only whitespace
      await setCodeMirrorValue('   \n  \n\t\n  ')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('No errors found')).toBeInTheDocument()
      })
    })

    it('handles mixed empty lines and content', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        })
      )

      render(<Playground />)
      
      const yamlWithEmptyLines = `
name: test

version: 1.0


description: |
  This is a multi-line
  description with empty lines
  

tags:
  - api
  - web


environment: production

`

      await setCodeMirrorValue(yamlWithEmptyLines)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
    })
  })

  describe('Special Characters and Encoding', () => {
    it('handles Unicode characters correctly', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        })
      )

      render(<Playground />)
      
      const unicodeYaml = `name: test-项目
description: "Testing with émojis 🚀 and unicode characters: αβγδε"
author: "José María García-González"
tags:
  - "测试"
  - "тест"  
  - "テスト"
metadata:
  copyright: "© 2024 Company"
  version: "1.0.0α"`

      await setCodeMirrorValue(unicodeYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
    })

    it('handles special YAML characters and escaping', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        })
      )

      render(<Playground />)
      
      const specialCharsYaml = `name: "test with: colons and spaces"
description: |
  Line with "quotes" and 'apostrophes'
  Line with [brackets] and {braces}
  Line with @symbols #hash &ampersand *asterisk
  Line with % percent | pipe > greater < less
regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
command: 'echo "Hello, World!" | grep Hello'
multiline: >
  This is a folded
  multi-line string with
  special characters: !@#$%^&*()
literal: |
  #!/bin/bash
  echo "Literal block with special chars"
  exit 0`

      await setCodeMirrorValue(specialCharsYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
    })
  })

  describe('Large Document Handling', () => {
    it('validates very large YAML documents efficiently', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        })
      )

      render(<Playground />)
      
      // Generate large YAML (around 10KB)
      const generateLargeYaml = () => {
        const sections = []
        sections.push('name: large-document')
        sections.push('version: 1.0.0')
        sections.push('description: "This is a very large YAML document for testing performance"')
        
        // Add many sections
        for (let i = 0; i < 100; i++) {
          sections.push(`section_${i}:`)
          sections.push(`  id: ${i}`)
          sections.push(`  name: "Section ${i}"`)
          sections.push(`  description: "This is section number ${i} with some content"`)
          sections.push(`  items:`)
          for (let j = 0; j < 10; j++) {
            sections.push(`    - id: ${i}_${j}`)
            sections.push(`      value: "Item ${j} in section ${i}"`)
            sections.push(`      active: ${j % 2 === 0}`)
          }
          sections.push(`  metadata:`)
          sections.push(`    created: 2024-01-${String(i % 28 + 1).padStart(2, '0')}`)
          sections.push(`    updated: 2024-02-${String(i % 28 + 1).padStart(2, '0')}`)
        }
        
        return sections.join('\n')
      }
      
      const largeYaml = generateLargeYaml()
      await setCodeMirrorValue(largeYaml)
      
      const startTime = Date.now()
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      const endTime = Date.now()
      const validationTime = endTime - startTime
      
      // Validation should complete within reasonable time (5 seconds max)
      expect(validationTime).toBeLessThan(5000)
    })

    it('handles documents with many deeply nested structures', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        })
      )

      render(<Playground />)
      
      // Create deeply nested YAML
      const createDeepYaml = (depth) => {
        let yaml = 'root:\n'
        let indent = '  '
        
        for (let i = 0; i < depth; i++) {
          yaml += `${indent}level_${i}:\n`
          yaml += `${indent}  name: "Level ${i}"\n`
          yaml += `${indent}  data:\n`
          yaml += `${indent}    - item1\n`
          yaml += `${indent}    - item2\n`
          yaml += `${indent}  nested:\n`
          indent += '    '
        }
        
        yaml += `${indent}final_value: "deep value"`
        return yaml
      }
      
      const deepYaml = createDeepYaml(20)
      await setCodeMirrorValue(deepYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
    })
  })

  describe('Provider Detection Edge Cases', () => {
    it('detects AWS provider from various formats', async () => {
      const awsFormats = [
        'AWSTemplateFormatVersion: "2010-09-09"',
        'Resources:\n  MyBucket:\n    Type: AWS::S3::Bucket',
        'provider:\n  name: aws\n  runtime: nodejs18.x',
        'service: aws-lambda-function'
      ]

      for (const awsYaml of awsFormats) {
        server.resetHandlers()
        server.use(
          http.post('/validate', async () => {
            return HttpResponse.json({ ok: true, messages: [] })
          }),
          http.post('/suggest', async () => {
            return HttpResponse.json({ provider: 'AWS' })
          })
        )

        render(<Playground />)
        
        await setCodeMirrorValue(awsYaml)
        
        const validateButton = screen.getByRole('button', { name: /validate now/i })
        fireEvent.click(validateButton)
        
        await waitFor(() => {
          expect(screen.getByText('Provider: AWS')).toBeInTheDocument()
        })
        
        // Clean up
        document.body.innerHTML = ''
      }
    })

    it('detects Azure provider from various formats', async () => {
      const azureFormats = [
        'apiVersion: apps/v1\nkind: Deployment',
        'trigger:\n  branches:\n    include:\n      - main',
        'variables:\n  - group: azure-variables',
        'pool:\n  vmImage: ubuntu-latest'
      ]

      for (const azureYaml of azureFormats) {
        server.resetHandlers()
        server.use(
          http.post('/validate', async () => {
            return HttpResponse.json({ ok: true, messages: [] })
          }),
          http.post('/suggest', async () => {
            return HttpResponse.json({ provider: 'Azure' })
          })
        )

        render(<Playground />)
        
        await setCodeMirrorValue(azureYaml)
        
        const validateButton = screen.getByRole('button', { name: /validate now/i })
        fireEvent.click(validateButton)
        
        await waitFor(() => {
          expect(screen.getByText('Provider: Azure')).toBeInTheDocument()
        })
        
        // Clean up
        document.body.innerHTML = ''
      }
    })

    it('defaults to Generic provider for unknown formats', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({ ok: true, messages: [] })
        }),
        http.post('/suggest', async () => {
          return HttpResponse.json({ provider: 'Unknown' })
        })
      )

      render(<Playground />)
      
      const genericYaml = `custom_config: true
random_keys: values
no_specific_provider_indicators: yes`

      await setCodeMirrorValue(genericYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByText('Provider: Generic')).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('recovers gracefully from network errors', async () => {
      server.use(
        http.post('/validate', async () => {
          return new Response(null, { status: 500 })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument()
      })
    })

    it('handles malformed JSON responses', async () => {
      server.use(
        http.post('/validate', async () => {
          return new Response('invalid json response', {
            headers: { 'Content-Type': 'application/json' }
          })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('handles timeout scenarios gracefully', async () => {
      server.use(
        http.post('/validate', async () => {
          // Simulate timeout - never resolve
          return new Promise(() => {})
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should show cancel button
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        expect(cancelButton).not.toHaveClass('invisible')
      }, { timeout: 400 })
      
      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      
      // Should return to ready state
      await waitFor(() => {
        expect(validateButton).not.toBeDisabled()
      })
    })
  })

  describe('Validation State Consistency', () => {
    it('maintains consistent state during rapid validation requests', async () => {
      let requestCount = 0
      server.use(
        http.post('/validate', async () => {
          requestCount++
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        })
      )

      render(<Playground />)
      
      // Trigger multiple rapid validations
      await setCodeMirrorValue('name: test1')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      
      // Click multiple times rapidly
      fireEvent.click(validateButton)
      fireEvent.click(validateButton)
      fireEvent.click(validateButton)
      
      // Change content during validation
      await setCodeMirrorValue('name: test2')
      fireEvent.click(validateButton)
      
      // Should eventually settle to success state
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(validateButton).not.toBeDisabled()
      }, { timeout: 2000 })
      
      // Should have reasonable number of requests due to cancellation
      expect(requestCount).toBeLessThan(10)
    })

    it('preserves editor content during validation errors', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [{ message: 'Test error', severity: 'error' }]
          })
        })
      )

      render(<Playground />)
      
      const originalYaml = 'name: test\nversion: 1.0\ndescription: test app'
      await setCodeMirrorValue(originalYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      
      // Editor content should remain unchanged
      const currentContent = await getCodeMirrorValue()
      expect(currentContent).toBe(originalYaml)
    })
  })
})