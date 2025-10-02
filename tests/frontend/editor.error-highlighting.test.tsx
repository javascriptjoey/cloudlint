import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Playground from '@/pages/Playground'
import { server } from '../mocks/server'
import { setCodeMirrorValue, getCodeMirrorEditor } from '../helpers/codemirror'
import { http, HttpResponse } from 'msw'

beforeEach(() => {
  server.resetHandlers()
})

describe('YAML Editor Error Highlighting Tests', () => {
  describe('Syntax Error Detection and Highlighting', () => {
    it('highlights lines with indentation errors', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Indentation error on line 2', severity: 'error' },
              { message: 'Indentation error on line 4', severity: 'error' }
            ]
          })
        })
      )

      render(<Playground />)
      
      // Enter YAML with indentation issues
      const invalidYaml = `name: test
  version: 1.0
dependencies:
bad indentation
  - package1`

      await setCodeMirrorValue(invalidYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      
      // Check that error highlights are applied in the editor
      const editor = await getCodeMirrorEditor()
      const errorHighlights = editor.querySelectorAll('.cm-error-highlight, .cm-error-highlight-structural')
      expect(errorHighlights.length).toBeGreaterThan(0)
    })

    it('highlights specific columns when error provides column information', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Invalid syntax at line 2 column 8', severity: 'error' }
            ]
          })
        })
      )

      render(<Playground />)
      
      const invalidYaml = `name: test
version: invalid: syntax
description: valid`

      await setCodeMirrorValue(invalidYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      
      // Verify error highlighting is applied
      const editor = await getCodeMirrorEditor()
      const errorHighlights = editor.querySelectorAll('.cm-error-highlight')
      expect(errorHighlights.length).toBeGreaterThan(0)
    })

    it('highlights warnings with different styling than errors', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true, // Server says OK but has warnings
            messages: [
              { message: 'Deprecated syntax on line 1', severity: 'warning' },
              { message: 'Consider updating format on line 3', severity: 'warning' }
            ]
          })
        })
      )

      render(<Playground />)
      
      const yamlWithWarnings = `old_format: deprecated
name: test
another_old: syntax`

      await setCodeMirrorValue(yamlWithWarnings)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should show success since server returned ok: true
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
      
      // Check warning highlights in editor
      const editor = await getCodeMirrorEditor()
      const warningHighlights = editor.querySelectorAll('.cm-warning-highlight')
      expect(warningHighlights.length).toBeGreaterThan(0)
    })

    it('highlights info messages with subtle styling', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: [
              { message: 'Using generic provider on line 1', severity: 'info' }
            ]
          })
        })
      )

      render(<Playground />)
      
      const yamlWithInfo = `generic_config: true
name: test`

      await setCodeMirrorValue(yamlWithInfo)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
      
      // Check info highlights in editor
      const editor = await getCodeMirrorEditor()
      const infoHighlights = editor.querySelectorAll('.cm-info-highlight')
      expect(infoHighlights.length).toBeGreaterThan(0)
    })

    it('applies structural error styling for critical YAML syntax issues', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Unexpected end of stream at line 2', severity: 'error' },
              { message: 'mapping values are not allowed here at line 3', severity: 'error' }
            ]
          })
        })
      )

      render(<Playground />)
      
      const structurallyInvalidYaml = `name: test
version: 
  : invalid mapping`

      await setCodeMirrorValue(structurallyInvalidYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      
      // Check for structural error highlights
      const editor = await getCodeMirrorEditor()
      const structuralHighlights = editor.querySelectorAll('.cm-error-highlight-structural')
      expect(structuralHighlights.length).toBeGreaterThan(0)
    })
  })

  describe('Error Message Parsing', () => {
    it('extracts line numbers from various error message formats', async () => {
      const errorFormats = [
        'Error on line 5',
        'Syntax error at line 10 column 3',
        'line 15: invalid syntax',
        '(line 20) indentation error',
        'Could not find expected ":" at line 25',
        'Unexpected character at line 30 column 12'
      ]

      for (const [index, errorMsg] of errorFormats.entries()) {
        server.resetHandlers()
        server.use(
          http.post('/validate', async () => {
            return HttpResponse.json({
              ok: false,
              messages: [{ message: errorMsg, severity: 'error' }]
            })
          })
        )

        render(<Playground />)
        
        // Create YAML with enough lines
        const lines = Array(35).fill(0).map((_, i) => `line${i}: value${i}`).join('\n')
        await setCodeMirrorValue(lines)
        
        const validateButton = screen.getByRole('button', { name: /validate now/i })
        fireEvent.click(validateButton)
        
        await waitFor(() => {
          expect(screen.getByRole('alert')).toBeInTheDocument()
        })
        
        // Verify error highlighting was applied (indicating line number was parsed)
        const editor = await getCodeMirrorEditor()
        const errorHighlights = editor.querySelectorAll('.cm-error-highlight, .cm-error-highlight-structural')
        expect(errorHighlights.length).toBeGreaterThan(0)
        
        // Clean up for next iteration
        document.body.innerHTML = ''
      }
    })

    it('handles malformed line references gracefully', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Error on line 999999', severity: 'error' }, // Line doesn't exist
              { message: 'Generic error without line info', severity: 'error' }
            ]
          })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test\nversion: 1.0')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should still show error alert even if highlighting fails
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/Found 2 issue/)).toBeInTheDocument()
      })
    })
  })

  describe('Error Tooltips and User Experience', () => {
    it('shows error details on hover', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Indentation error on line 2', severity: 'error' }
            ]
          })
        })
      )

      render(<Playground />)
      
      const invalidYaml = `name: test
  bad indentation
version: 1.0`

      await setCodeMirrorValue(invalidYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      
      // Check that error highlights have title attributes for tooltips
      const editor = await getCodeMirrorEditor()
      const errorHighlights = editor.querySelectorAll('.cm-error-highlight, .cm-error-highlight-structural')
      
      const highlightWithTooltip = Array.from(errorHighlights).find(el => 
        el.getAttribute('title')?.includes('Indentation error')
      )
      expect(highlightWithTooltip).toBeTruthy()
    })

    it('clears previous error highlights when new validation succeeds', async () => {
      // First validation fails
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [{ message: 'Error on line 2', severity: 'error' }]
          })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test\ninvalid yaml')
      
      let validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      
      let editor = await getCodeMirrorEditor()
      let errorHighlights = editor.querySelectorAll('.cm-error-highlight, .cm-error-highlight-structural')
      expect(errorHighlights.length).toBeGreaterThan(0)
      
      // Second validation succeeds
      server.resetHandlers()
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({ ok: true, messages: [] })
        })
      )
      
      // Fix the YAML
      await setCodeMirrorValue('name: test\nversion: 1.0')
      
      validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Wait for success state
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
      
      // Error highlights should be cleared
      editor = await getCodeMirrorEditor()
      errorHighlights = editor.querySelectorAll('.cm-error-highlight, .cm-error-highlight-structural')
      expect(errorHighlights.length).toBe(0)
    })

    it('updates highlights when validation messages change', async () => {
      // First validation - one error
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [{ message: 'Error on line 1', severity: 'error' }]
          })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('invalid: syntax')
      
      let validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Found 1 issue/)).toBeInTheDocument()
      })
      
      // Second validation - different errors
      server.resetHandlers()
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Error on line 2', severity: 'error' },
              { message: 'Warning on line 3', severity: 'warning' }
            ]
          })
        })
      )
      
      await setCodeMirrorValue('name: test\nbad: syntax\nold: format')
      
      validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should show updated error count
      await waitFor(() => {
        expect(screen.getByText(/Found 2 issue/)).toBeInTheDocument()
      })
      
      // Should have both error and warning highlights
      const editor = await getCodeMirrorEditor()
      const errorHighlights = editor.querySelectorAll('.cm-error-highlight, .cm-error-highlight-structural')
      const warningHighlights = editor.querySelectorAll('.cm-warning-highlight')
      
      expect(errorHighlights.length).toBeGreaterThan(0)
      expect(warningHighlights.length).toBeGreaterThan(0)
    })
  })

  describe('Real-time Error Highlighting', () => {
    it('updates error highlights during real-time validation', async () => {
      server.use(
        http.post('/validate', async (request) => {
          const body = await request.request.text()
          
          // Return errors for specific content
          if (body.includes('invalid')) {
            return HttpResponse.json({
              ok: false,
              messages: [{ message: 'Syntax error on line 1', severity: 'error' }]
            })
          }
          
          return HttpResponse.json({ ok: true, messages: [] })
        })
      )

      render(<Playground />)
      
      // Type invalid content
      await setCodeMirrorValue('invalid: syntax')
      
      // Wait for real-time validation to trigger
      await waitFor(() => {
        const editor = document.querySelector('.cm-editor')
        return editor && editor.querySelectorAll('.cm-error-highlight').length > 0
      }, { timeout: 3000 })
      
      // Fix the content
      await setCodeMirrorValue('name: test\nversion: 1.0')
      
      // Wait for highlights to be cleared
      await waitFor(() => {
        const editor = document.querySelector('.cm-editor')
        return editor && editor.querySelectorAll('.cm-error-highlight').length === 0
      }, { timeout: 3000 })
    })

    it('handles rapid typing without highlight flickering', async () => {
      let validationCount = 0
      server.use(
        http.post('/validate', async () => {
          validationCount++
          // Always return errors to test highlight stability
          return HttpResponse.json({
            ok: false,
            messages: [{ message: 'Error on line 1', severity: 'error' }]
          })
        })
      )

      render(<Playground />)
      
      // Rapid typing simulation
      const typingSteps = ['n', 'na', 'nam', 'name', 'name:', 'name: t', 'name: te', 'name: test']
      
      for (const step of typingSteps) {
        await setCodeMirrorValue(step)
        await new Promise(resolve => setTimeout(resolve, 50)) // Fast typing
      }
      
      // Wait for debounced validation to settle
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Should have reasonable number of validations due to debouncing
      expect(validationCount).toBeGreaterThan(0)
      expect(validationCount).toBeLessThan(10) // Debouncing should limit calls
      
      // Should still have error highlights
      const editor = await getCodeMirrorEditor()
      const errorHighlights = editor.querySelectorAll('.cm-error-highlight')
      expect(errorHighlights.length).toBeGreaterThan(0)
    })
  })

  describe('Complex YAML Error Scenarios', () => {
    it('handles multiple types of errors in same document', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Indentation error on line 2', severity: 'error' },
              { message: 'Invalid syntax at line 4 column 10', severity: 'error' },
              { message: 'Deprecated key on line 6', severity: 'warning' },
              { message: 'Using generic provider on line 8', severity: 'info' }
            ]
          })
        })
      )

      render(<Playground />)
      
      const complexYaml = `name: test
  bad_indent: value
steps:
  - name: invalid: syntax
  - script: echo hello
deprecated_key: value
other: config
provider: generic`

      await setCodeMirrorValue(complexYaml)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Found 4 issue/)).toBeInTheDocument()
      })
      
      // Should have all types of highlights
      const editor = await getCodeMirrorEditor()
      const errorHighlights = editor.querySelectorAll('.cm-error-highlight, .cm-error-highlight-structural')
      const warningHighlights = editor.querySelectorAll('.cm-warning-highlight')
      const infoHighlights = editor.querySelectorAll('.cm-info-highlight')
      
      expect(errorHighlights.length).toBeGreaterThan(0)
      expect(warningHighlights.length).toBeGreaterThan(0)
      expect(infoHighlights.length).toBeGreaterThan(0)
    })

    it('handles very large documents with errors efficiently', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Error on line 500', severity: 'error' },
              { message: 'Warning on line 1000', severity: 'warning' }
            ]
          })
        })
      )

      render(<Playground />)
      
      // Create large YAML document
      const lines = Array(1500).fill(0).map((_, i) => {
        if (i === 499) return 'error: line'
        if (i === 999) return 'warning: line'
        return `line${i}: value${i}`
      }).join('\n')
      
      await setCodeMirrorValue(lines)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should handle large document without performance issues
      await waitFor(() => {
        expect(screen.getByText(/Found 2 issue/)).toBeInTheDocument()
      })
      
      const editor = await getCodeMirrorEditor()
      const highlights = editor.querySelectorAll('.cm-error-highlight, .cm-warning-highlight')
      expect(highlights.length).toBeGreaterThan(0)
    })
  })
})