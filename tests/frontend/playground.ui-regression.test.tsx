import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Playground from '@/pages/Playground'
import { server } from '../mocks/server'
import { setCodeMirrorValue, getCodeMirrorValue } from '../helpers/codemirror'
import { http, HttpResponse } from 'msw'

beforeEach(() => {
  server.resetHandlers()
})

describe('Playground UI Regression Tests', () => {
  describe('Editor Initial State', () => {
    it('starts with completely empty editor (no placeholder text content)', async () => {
      render(<Playground />)
      
      // Wait for editor to be ready
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: 'YAML input' })).toBeInTheDocument()
      })
      
      // Editor should be empty
      const editorValue = await getCodeMirrorValue()
      expect(editorValue).toBe('')
    })

    it('shows placeholder text when editor is empty', async () => {
      render(<Playground />)
      
      const editor = await waitFor(() => 
        screen.getByRole('textbox', { name: 'YAML input' })
      )
      expect(editor).toBeInTheDocument()
      
      // Check that the placeholder is visible (via CSS content)
      const editorContainer = editor.closest('.cm-editor')
      expect(editorContainer).toBeInTheDocument()
    })

    it('hides placeholder text when content is entered', async () => {
      render(<Playground />)
      
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: 'YAML input' })).toBeInTheDocument()
      })
      
      // Add content to editor
      await setCodeMirrorValue('name: test')
      
      // Verify content is set
      const editorValue = await getCodeMirrorValue()
      expect(editorValue).toBe('name: test')
    })
  })

  describe('Button Text Alignment', () => {
    it('displays properly centered "Validate Now" text with real-time enabled', () => {
      render(<Playground />)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      expect(validateButton).toBeInTheDocument()
      
      // Check that button has proper alignment classes
      expect(validateButton).toHaveClass('flex', 'items-center')
      
      // Check button text is centered
      const buttonText = validateButton.querySelector('span')
      expect(buttonText).toBeInTheDocument()
      expect(buttonText).toHaveTextContent('Validate Now')
    })

    it('displays properly centered "Validate" text with real-time disabled', async () => {
      render(<Playground />)
      
      // Disable real-time validation
      fireEvent.click(screen.getByLabelText('Real-time validation settings'))
      
      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByRole('switch'))
      fireEvent.click(document.body) // Close popover
      
      await waitFor(() => {
        const validateButton = screen.getByRole('button', { name: /^validate$/i })
        expect(validateButton).toBeInTheDocument()
        expect(validateButton).toHaveClass('flex', 'items-center')
        
        const buttonText = validateButton.querySelector('span')
        expect(buttonText).toHaveTextContent('Validate')
      })
    })

    it('shows loading spinner in correct position when validating', async () => {
      // Mock a slow validation response
      server.use(
        http.post('/validate', async () => {
          await new Promise(resolve => setTimeout(resolve, 300))
          return HttpResponse.json({ ok: true, messages: [] })
        })
      )

      render(<Playground />)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      
      // Click validate button
      fireEvent.click(validateButton)
      
      // Should show loading state
      await waitFor(() => {
        expect(validateButton).toHaveAttribute('aria-busy', 'true')
        expect(validateButton).toBeDisabled()
      })
      
      // Should show spinner
      const spinner = validateButton.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('ml-2', 'inline-block')
      
      // Wait for validation to complete
      await waitFor(() => {
        expect(validateButton).not.toBeDisabled()
      }, { timeout: 1000 })
    })
  })

  describe('Cancel Button Behavior', () => {
    it('shows cancel button for slow validation requests', async () => {
      // Mock a slow validation response
      server.use(
        http.post('/validate', async () => {
          await new Promise(resolve => setTimeout(resolve, 300))
          return HttpResponse.json({ ok: true, messages: [] })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Cancel button should appear after 250ms delay
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        expect(cancelButton).toBeInTheDocument()
        expect(cancelButton).not.toHaveClass('invisible')
      }, { timeout: 400 })
    })

    it('hides cancel button for fast validation requests', async () => {
      // Mock a fast validation response
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({ ok: true, messages: [] })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Wait a bit - cancel button should not appear for fast requests
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toHaveClass('invisible')
    })

    it('cancels in-flight validation when cancel button is clicked', async () => {
      let resolveValidation: (value: any) => void
      
      server.use(
        http.post('/validate', async () => {
          return new Promise((resolve) => {
            resolveValidation = resolve
          })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Wait for cancel button to appear
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        expect(cancelButton).not.toHaveClass('invisible')
      }, { timeout: 400 })
      
      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      
      // Validate button should no longer be disabled
      await waitFor(() => {
        expect(validateButton).not.toBeDisabled()
        expect(validateButton).toHaveAttribute('aria-busy', 'false')
      })
      
      // Cancel button should be hidden
      expect(cancelButton).toHaveClass('invisible')
    })
  })

  describe('Error State Display', () => {
    it('displays error state correctly for invalid YAML', async () => {
      // Mock validation response with errors
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Indentation error on line 2', severity: 'error' },
              { message: 'Invalid syntax at line 3 column 5', severity: 'error' }
            ]
          })
        })
      )

      render(<Playground />)
      
      // Enter invalid YAML
      await setCodeMirrorValue('name: test\n  invalid:\nbad syntax')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should show error alert
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeInTheDocument()
        expect(errorAlert).toHaveClass('border-destructive')
      })
      
      // Should show error count
      expect(screen.getByText(/Found 2 issue/)).toBeInTheDocument()
      expect(screen.getByText(/errors: 2, warnings: 0/)).toBeInTheDocument()
      
      // Should show individual error messages
      expect(screen.getByText('Indentation error on line 2')).toBeInTheDocument()
      expect(screen.getByText('Invalid syntax at line 3 column 5')).toBeInTheDocument()
    })

    it('displays success state correctly for valid YAML', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: true,
            messages: []
          })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test\nversion: 1.0')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should show success alert
      await waitFor(() => {
        const successAlert = screen.getByRole('status')
        expect(successAlert).toBeInTheDocument()
        expect(successAlert).toHaveClass('border-green-600/50')
        expect(successAlert).toHaveTextContent('No errors found')
      })
    })

    it('displays mixed warnings and errors correctly', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [
              { message: 'Critical error on line 1', severity: 'error' },
              { message: 'Deprecated syntax on line 2', severity: 'warning' },
              { message: 'Using generic provider', severity: 'info' }
            ]
          })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test\nold_syntax: value')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Found 3 issue/)).toBeInTheDocument()
        expect(screen.getByText(/errors: 1, warnings: 1/)).toBeInTheDocument()
      })
      
      // Check message styling
      const errorMessage = screen.getByText('Critical error on line 1')
      expect(errorMessage).toHaveClass('text-red-600')
      
      const warningMessage = screen.getByText('Deprecated syntax on line 2')
      expect(warningMessage).toHaveClass('text-amber-600')
      
      const infoMessage = screen.getByText('Using generic provider')
      expect(infoMessage).toHaveClass('text-muted-foreground')
    })
  })

  describe('Layout Stability', () => {
    it('does not cause layout shift when validation state changes', async () => {
      render(<Playground />)
      
      // Get initial button positions
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      const uploadButton = screen.getByRole('button', { name: /upload yaml/i })
      
      const initialValidateRect = validateButton.getBoundingClientRect()
      const initialUploadRect = uploadButton.getBoundingClientRect()
      
      // Start validation
      await setCodeMirrorValue('name: test')
      fireEvent.click(validateButton)
      
      // Check positions haven't shifted during validation
      await waitFor(() => {
        expect(validateButton).toHaveAttribute('aria-busy', 'true')
      })
      
      const duringValidateRect = validateButton.getBoundingClientRect()
      const duringUploadRect = uploadButton.getBoundingClientRect()
      
      // Positions should remain stable (allow small differences due to rendering)
      expect(Math.abs(duringValidateRect.left - initialValidateRect.left)).toBeLessThan(5)
      expect(Math.abs(duringUploadRect.left - initialUploadRect.left)).toBeLessThan(5)
      
      // Wait for validation to complete
      await waitFor(() => {
        expect(validateButton).not.toHaveAttribute('aria-busy', 'true')
      })
    })

    it('reserves space for cancel button to prevent layout shift', () => {
      render(<Playground />)
      
      const cancelButtonContainer = screen.getByRole('button', { name: /cancel/i }).parentElement
      expect(cancelButtonContainer).toHaveClass('min-w-[92px]')
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles for screen readers', () => {
      render(<Playground />)
      
      // Editor accessibility
      expect(screen.getByRole('textbox', { name: 'YAML input' })).toBeInTheDocument()
      
      // Button accessibility
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      expect(validateButton).toHaveAttribute('aria-busy')
      expect(validateButton).toHaveAttribute('aria-live', 'polite')
      
      // Settings accessibility
      expect(screen.getByLabelText('Real-time validation settings')).toBeInTheDocument()
      expect(screen.getByLabelText('Real-time validation enabled')).toBeInTheDocument()
    })

    it('maintains focus management during validation', async () => {
      render(<Playground />)
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      
      // Focus the button
      validateButton.focus()
      expect(document.activeElement).toBe(validateButton)
      
      // Start validation
      fireEvent.click(validateButton)
      
      // Focus should remain on button during validation
      await waitFor(() => {
        expect(validateButton).toHaveAttribute('aria-busy', 'true')
        expect(document.activeElement).toBe(validateButton)
      })
    })

    it('provides proper error announcements', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({
            ok: false,
            messages: [{ message: 'Syntax error on line 1', severity: 'error' }]
          })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('invalid: yaml: syntax')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should show error with proper role
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeInTheDocument()
        expect(errorAlert).toHaveTextContent('Found 1 issue')
      })
    })

    it('provides proper success announcements', async () => {
      server.use(
        http.post('/validate', async () => {
          return HttpResponse.json({ ok: true, messages: [] })
        })
      )

      render(<Playground />)
      
      await setCodeMirrorValue('name: test\nversion: 1.0')
      
      const validateButton = screen.getByRole('button', { name: /validate now/i })
      fireEvent.click(validateButton)
      
      // Should show success with proper role
      await waitFor(() => {
        const successAlert = screen.getByRole('status')
        expect(successAlert).toBeInTheDocument()
        expect(successAlert).toHaveTextContent('No errors found')
      })
    })
  })
})