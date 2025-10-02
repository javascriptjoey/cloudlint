import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Playground from '@/pages/Playground'
import { server } from '../mocks/server'
import { setCodeMirrorValue, getCodeMirrorValue } from '../helpers/codemirror'
import { http, HttpResponse } from 'msw'

beforeEach(() => {
  server.resetHandlers()
})

describe('Integration: Frontend-Backend Validation Flow', () => {
  describe('Complete Validation Workflow', () => {
    it('handles complete validation cycle with fixes', async () => {
      // First validation returns errors with fix
      server.use(
        http.post('/validate', async (request) => {
          const body = await request.request.text()
          
          if (body.includes('bad_indent')) {
            return HttpResponse.json({
              ok: false,
              messages: [
                { message: 'Indentation error on line 2', severity: 'error' }
              ],
              fixed: 'name: test\nversion: 1.0\ndescription: fixed'
            })
          }
          
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        }),
        http.post('/diff-preview', async () => {
          return HttpResponse.json({
            diff: '@@ -1,3 +1,3 @@\n name: test\n-  bad_indent: value\n+version: 1.0\n+description: fixed',
            before: 'name: test\n  bad_indent: value',
            after: 'name: test\nversion: 1.0\ndescription: fixed'
          })
        }),
        http.post('/suggest', async () => {
          return HttpResponse.json({ provider: 'Generic' })
        })
      )

      render(<Playground />)
      
      // Enter invalid YAML
      const invalidYaml = 'name: test\n  bad_indent: value'
      await setCodeMirrorValue(invalidYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Indentation error on line 2')).toBeInTheDocument()
      })
      
      // Should show diff preview
      await waitFor(() => {
        expect(screen.getByText('Preview changes')).toBeInTheDocument()
        expect(screen.getByText(/bad_indent: value/)).toBeInTheDocument()
      })
      
      // Apply fix
      const acceptButton = screen.getByRole('button', { name: /accept/i })
      fireEvent.click(acceptButton)
      
      // Editor content should be updated
      await waitFor(() => {
        const content = getCodeMirrorValue()
        expect(content).toContain('version: 1.0')
        expect(content).toContain('description: fixed')
        expect(content).not.toContain('bad_indent')
      })
      
      // Should show success state
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('No errors found')).toBeInTheDocument()
      })
    })

    it('handles validation with schema upload integration', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        }),
        http.post('/schema-validate', async () => {
          return HttpResponse.json({
            ok: false,
            errors: [
              'Property "invalidField" is not allowed',
              'Required property "requiredField" is missing'
            ]
          })
        })
      )

      render(<Playground />)
      
      // Simulate schema upload
      const schemaContent = JSON.stringify({
        type: 'object',
        required: ['requiredField'],
        properties: {
          name: { type: 'string' },
          requiredField: { type: 'string' }
        },
        additionalProperties: false
      })
      
      // Mock file upload (this would normally be done through file input)
      // For testing, we'll trigger the upload handler directly
      const schemaInput = screen.getByLabelText('Upload JSON Schema')
      const file = new File([schemaContent], 'schema.json', { type: 'application/json' })
      
      await act(async () => {
        Object.defineProperty(schemaInput, 'files', {
          value: [file],
          writable: false
        })
        fireEvent.change(schemaInput)
      })
      
      // Should show schema badge
      await waitFor(() => {
        expect(screen.getByText(/Schema: schema.json/)).toBeInTheDocument()
      })
      
      // Enter YAML that violates schema
      const invalidSchemaYaml = `name: test
invalidField: not_allowed
# missing requiredField`

      await setCodeMirrorValue(invalidSchemaYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should show both YAML validation success and schema validation errors
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument() // YAML validation passed
        expect(screen.getByRole('alert')).toBeInTheDocument() // Schema validation failed
        expect(screen.getByText('Property "invalidField" is not allowed')).toBeInTheDocument()
        expect(screen.getByText('Required property "requiredField" is missing')).toBeInTheDocument()
      })
    })

    it('handles provider detection and suggestions integration', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: [
              { message: 'CloudFormation template validated', severity: 'info' }
            ]
          })
        }),
        http.post('/suggest', async () => {
          return HttpResponse.json({
            provider: 'AWS',
            suggestions: [
              {
                line: 3,
                column: 5,
                type: 'resource_type',
                current: 'AWS::EC2::Instance',
                suggested: 'AWS::EC2::Instance',
                confidence: 0.95
              }
            ]
          })
        })
      )

      render(<Playground />)
      
      const cloudformationYaml = `AWSTemplateFormatVersion: '2010-09-09'
Description: Test CloudFormation template
Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-12345678
      InstanceType: t2.micro`

      await setCodeMirrorValue(cloudformationYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        // Provider should be detected as AWS
        expect(screen.getByText('Provider: AWS')).toBeInTheDocument()
        
        // Validation should succeed
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('CloudFormation template validated')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Validation Integration', () => {
    it('provides seamless real-time validation experience', async () => {
      let validationCount = 0
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      
      server.use(
        http.post('/validate', async (request) => {
          validationCount++
          const body = await request.request.text()
          
          // Return different results based on content
          if (body.includes('error')) {
            return HttpResponse.json({
              ok: false,
              messages: [{ message: 'Found error keyword', severity: 'error' }]
            })
          }
          
          if (body.includes('warn')) {
            return HttpResponse.json({
              ok: true,
              messages: [{ message: 'Found warning keyword', severity: 'warning' }]
            })
          }
          
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        }),
        http.post('/suggest', async () => {
          return HttpResponse.json({ provider: 'Generic' })
        })
      )

      render(<Playground />)
      
      // Start typing - should trigger real-time validation
      await setCodeMirrorValue('name: test')
      
      // Wait for initial real-time validation
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('[ui] POST /validate bytes=', expect.any(Number))
      }, { timeout: 2000 })
      
      consoleSpy.mockClear()
      validationCount = 0
      
      // Type content that should trigger error
      await setCodeMirrorValue('name: test\nerror: true')
      
      // Wait for real-time validation to show error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Found error keyword')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      // Type content that should show warning
      await setCodeMirrorValue('name: test\nwarn: true')
      
      // Wait for real-time validation to show warning (as success with warning)
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('Found warning keyword')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      // Type valid content
      await setCodeMirrorValue('name: test\nversion: 1.0')
      
      // Wait for real-time validation to show success
      await waitFor(() => {
        const statusElement = screen.getByRole('status')
        expect(statusElement).toHaveTextContent('No errors found')
      }, { timeout: 2000 })
      
      // Should have reasonable number of validation calls due to debouncing
      expect(validationCount).toBeGreaterThan(0)
      expect(validationCount).toBeLessThan(10)
      
      consoleSpy.mockRestore()
    })

    it('cancels previous requests when typing quickly', async () => {
      let activeRequests = 0
      let completedRequests = 0
      
      server.use(
        http.post('/validate', async (request) => {
          activeRequests++
          
          // Simulate slow validation
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              activeRequests--
              completedRequests++
              resolve(HttpResponse.json({ ok: true, messages: [] }))
            }, 200)
            
            // Listen for abort signal
            request.request.signal?.addEventListener('abort', () => {
              clearTimeout(timeout)
              activeRequests--
              reject(new Error('Aborted'))
            })
          })
        })
      )

      render(<Playground />)
      
      // Type rapidly to trigger multiple requests
      const rapidContent = ['a', 'ab', 'abc', 'abcd', 'abcde']
      
      for (const content of rapidContent) {
        await setCodeMirrorValue(content)
        await new Promise(resolve => setTimeout(resolve, 50)) // Fast typing
      }
      
      // Wait for all requests to settle
      await waitFor(() => {
        return activeRequests === 0
      }, { timeout: 3000 })
      
      // Should have fewer completed requests than total due to cancellation
      expect(completedRequests).toBeLessThan(rapidContent.length)
      expect(completedRequests).toBeGreaterThan(0)
    })
  })

  describe('Error Handling Integration', () => {
    it('gracefully handles server unavailability', async () => {
      server.use(
        http.post('/validate', async () => {
          return new Response(null, { status: 503 })
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
      
      // User should be able to retry
      expect(validateButton).not.toBeDisabled()
    })

    it('handles partial service failures gracefully', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        }),
        http.post('/suggest', async () => {
          return new Response(null, { status: 500 })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Validation should succeed even if suggestion fails
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('No errors found')).toBeInTheDocument()
      })
      
      // Provider should default to Generic when suggestion fails
      await waitFor(() => {
        expect(screen.getByText('Provider: Generic')).toBeInTheDocument()
      })
    })

    it('handles malformed server responses appropriately', async () => {
      server.use(
        http.post('/validate', async () => {
          // Return malformed JSON
          return new Response('{ invalid json }', {
            headers: { 'Content-Type': 'application/json' }
          })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should show error instead of crashing
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      
      // App should remain functional
      expect(validateButton).not.toBeDisabled()
    })
  })

  describe('Performance Integration', () => {
    it('maintains responsive UI during heavy validation loads', async () => {
      let requestsHandled = 0
      
      server.use(
        http.post('/validate', async () => {
          requestsHandled++
          // Simulate variable response times
          const delay = Math.random() * 100 + 50 // 50-150ms
          await new Promise(resolve => setTimeout(resolve, delay))
          
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        })
      )

      render(<Playground />)
      
      // Generate large YAML content
      const largeContent = Array(500).fill(0).map((_, i) => `line_${i}: value_${i}`).join('\n')
      
      const startTime = Date.now()
      await setCodeMirrorValue(largeContent)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // UI should remain responsive (buttons should not be permanently disabled)
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(validateButton).not.toBeDisabled()
      }, { timeout: 3000 })
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(3000)
      expect(requestsHandled).toBeGreaterThan(0)
    })

    it('efficiently handles concurrent validation and conversion requests', async () => {
      server.use(
        http.post('/validate', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({ ok: true, messages: [] })
        }),
        http.post('/convert', async () => {
          await new Promise(resolve => setTimeout(resolve, 150))
          return HttpResponse.json({ json: '{"name": "test", "version": "1.0"}' })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test\nversion: 1.0')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      const convertButton = screen.getByRole('button', { name: /convert to json/i })
      
      // Trigger both operations simultaneously
      const startTime = Date.now()
      fireEvent.click(validateButton)
      fireEvent.click(convertButton)
      
      // Both operations should complete
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('JSON')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      // Should complete efficiently (not sequentially waiting for each other)
      expect(totalTime).toBeLessThan(1500)
    })
  })

  describe('User Experience Integration', () => {
    it('provides consistent state feedback throughout complete workflow', async () => {
      server.use(
        http.post('/validate', async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
          return HttpResponse.json({
            ok: false,
            messages: [{ message: 'Test error', severity: 'error' }],
            fixed: 'name: test\nversion: fixed'
          })
        }),
        http.post('/diff-preview', async () => {
          return HttpResponse.json({
            diff: '@@ -1,1 +1,2 @@\n name: test\n+version: fixed',
            before: 'name: test',
            after: 'name: test\nversion: fixed'
          })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      
      // Start validation
      fireEvent.click(validateButton)
      
      // Should show loading state
      await waitFor(() => {
        expect(validateButton).toBeDisabled()
        expect(validateButton).toHaveAttribute('aria-busy', 'true')
      })
      
      // Should show spinner
      expect(validateButton.querySelector('.animate-spin')).toBeInTheDocument()
      
      // Should eventually show cancel button for slow requests
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        expect(cancelButton).not.toHaveClass('invisible')
      }, { timeout: 300 })
      
      // Wait for validation to complete
      await waitFor(() => {
        expect(validateButton).not.toBeDisabled()
        expect(validateButton).toHaveAttribute('aria-busy', 'false')
      }, { timeout: 1000 })
      
      // Should show error state
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Test error')).toBeInTheDocument()
      
      // Should show fix option
      expect(screen.getByRole('button', { name: /apply fix/i })).toBeInTheDocument()
      
      // Should show diff preview
      expect(screen.getByText('Preview changes')).toBeInTheDocument()
    })
  })
})