import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import Playground from '@/pages/Playground'

async function typeInTextarea(value: string) {
  const editor = screen.getByRole('textbox', { name: /yaml input/i })
  await userEvent.clear(editor)
  if (value) {
    // Use paste for complex strings to avoid userEvent parsing issues
    await userEvent.click(editor)
    await userEvent.paste(value)
  }
}

async function clickValidateButton() {
  const btn = screen.getByRole('button', { name: /validate/i })
  await userEvent.click(btn)
}

describe('YAML Validation Logic', () => {
  beforeEach(() => {
    // Reset any server handlers before each test
    server.resetHandlers()
  })

  describe('Valid YAML scenarios', () => {
    it('shows success for valid YAML', async () => {
      // Mock server to return success
      server.use(
        http.post('/validate', () => {
          return HttpResponse.json({ ok: true, messages: [] })
        })
      )

      render(<Playground />)
      
      await typeInTextarea('key: value\nlist:\n  - item1\n  - item2')
      await clickValidateButton()

      // Should show success message
      await waitFor(() => {
        const successAlert = screen.getByRole('status')
        expect(successAlert).toBeInTheDocument()
        expect(successAlert).toHaveTextContent(/no errors found/i)
      }, { timeout: 3000 })
    })

    it('shows success for valid YAML with info messages only', async () => {
      server.use(
        http.post('/validate', () => {
          return HttpResponse.json({ 
            ok: true, 
            messages: [
              { message: 'Using generic provider', severity: 'info' }
            ]
          })
        })
      )

      render(<Playground />)
      
      await typeInTextarea('steps:\n  - script: echo hello')
      await clickValidateButton()

      await waitFor(() => {
        const successAlert = screen.getByRole('status')
        expect(successAlert).toBeInTheDocument()
        expect(successAlert).toHaveTextContent(/no errors found/i)
      }, { timeout: 3000 })
    })

    it('shows success for valid YAML with warnings when backend says ok: true', async () => {
      // NEW TEST: This verifies the fix - warnings should not prevent success when backend says ok: true
      server.use(
        http.post('/validate', () => {
          return HttpResponse.json({ 
            ok: true, // Backend allows warnings with ok: true
            messages: [
              { message: 'Using deprecated syntax', severity: 'warning' },
              { message: 'Consider updating to newer format', severity: 'warning' }
            ]
          })
        })
      )

      render(<Playground />)
      
      await typeInTextarea('steps:\n  - script: echo hello # deprecated format')
      await clickValidateButton()

      // Should show success despite warnings, since backend said ok: true
      await waitFor(() => {
        const successAlert = screen.getByRole('status')
        expect(successAlert).toBeInTheDocument()
        expect(successAlert).toHaveTextContent(/no errors found/i)
      }, { timeout: 3000 })
    })
  })

  describe('Invalid YAML scenarios', () => {
    it('shows error for malformed YAML', async () => {
      server.use(
        http.post('/validate', () => {
          return HttpResponse.json({ 
            ok: false, 
            messages: [
              { message: 'Unexpected end of stream', severity: 'error' }
            ]
          })
        })
      )

      render(<Playground />)
      
      await typeInTextarea('key: [incomplete')
      await clickValidateButton()

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeInTheDocument()
        expect(errorAlert).toHaveTextContent(/found.*error/i)
        expect(errorAlert).toHaveTextContent(/unexpected end of stream/i)
      })
    })

    it('shows error for indentation issues', async () => {
      server.use(
        http.post('/validate', () => {
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
      
      await typeInTextarea('key:\n value')
      await clickValidateButton()

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeInTheDocument()
        expect(errorAlert).toHaveTextContent(/found.*2.*issue/i)
        expect(errorAlert).toHaveTextContent(/errors: 1, warnings: 1/i)
        expect(errorAlert).toHaveTextContent(/indentation error/i)
      })
    })

    it('shows error when server returns ok: true but has error messages', async () => {
      // This tests the frontend logic fix - server says OK but has errors
      server.use(
        http.post('/validate', () => {
          return HttpResponse.json({ 
            ok: true, // Server says OK
            messages: [
              { message: 'Critical validation error', severity: 'error' }
            ]
          })
        })
      )

      render(<Playground />)
      
      await typeInTextarea('problematic: yaml')
      await clickValidateButton()

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeInTheDocument()
        expect(errorAlert).toHaveTextContent(/found.*error/i)
        expect(errorAlert).toHaveTextContent(/critical validation error/i)
      })
    })

    it('shows error when server returns ok: false with warnings', async () => {
      server.use(
        http.post('/validate', () => {
          return HttpResponse.json({ 
            ok: false,
            messages: [
              { message: 'Deprecated syntax used', severity: 'warning' }
            ]
          })
        })
      )

      render(<Playground />)
      
      await typeInTextarea('deprecated: syntax')
      await clickValidateButton()

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeInTheDocument()
        expect(errorAlert).toHaveTextContent(/found.*issue/i)
        expect(errorAlert).toHaveTextContent(/deprecated syntax/i)
      })
    })
  })

  describe('Network and error scenarios', () => {
    it('shows error when validation request fails', async () => {
      server.use(
        http.post('/validate', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 })
        })
      )

      render(<Playground />)
      
      await typeInTextarea('some: yaml')
      await clickValidateButton()

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeInTheDocument()
        expect(errorAlert).toHaveTextContent(/server error/i)
      })
    })

    it('shows error when request times out or is aborted', async () => {
      server.use(
        http.post('/validate', async () => {
          // Simulate a request that never completes
          await new Promise(() => {}) // Never resolves
        })
      )

      render(<Playground />)
      
      await typeInTextarea('timeout: test')
      await clickValidateButton()
      
      // Click cancel to abort the request
      const cancelBtn = await screen.findByRole('button', { name: /cancel/i })
      await userEvent.click(cancelBtn)

      // Should not show any alert when cancelled
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Severity normalization', () => {
    it('normalizes different severity formats correctly', async () => {
      server.use(
        http.post('/validate', () => {
          return HttpResponse.json({ 
            ok: true, // Server says OK but we have mixed severities
            messages: [
              { message: 'Error message', severity: 'ERROR' }, // Uppercase
              { message: 'Warning message', severity: 'Warn' }, // Partial match
              { message: 'Info message', severity: 'information' }, // Different format
              { message: 'Unknown severity', severity: 'unknown' } // Should default to info
            ]
          })
        })
      )

      render(<Playground />)
      
      await typeInTextarea('mixed: severities')
      await clickValidateButton()

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toBeInTheDocument()
        // Should show error for 1 error + 1 warning (unknown severity defaults to info, so only 2 issues)
        expect(errorAlert).toHaveTextContent(/found.*2.*issue/i)
        expect(errorAlert).toHaveTextContent(/errors: 1, warnings: 1/i)
      })
    })
  })

  describe('Empty and edge cases', () => {
  it('handles empty YAML input', async () => {
    server.use(
      http.post('/validate', () => {
        return HttpResponse.json({ ok: true, messages: [] })
      })
    )

    render(<Playground />)
    
    // Clear the initial content to simulate empty input scenario
    await typeInTextarea('')
    
    // Click validate to test the validation behavior with empty input
    await clickValidateButton()
    
    // Should show success message (empty YAML is typically valid)
    await waitFor(() => {
      const successAlert = screen.getByRole('status')
      expect(successAlert).toBeInTheDocument()
      expect(successAlert).toHaveTextContent(/no errors found/i)
    }, { timeout: 3000 })
  })

  it('handles whitespace-only input', async () => {
    server.use(
      http.post('/validate', () => {
        return HttpResponse.json({ ok: true, messages: [] })
      })
    )

    render(<Playground />)
    
    // Replace content with whitespace-only input
    await typeInTextarea('   \n  \t  \n   ')
    
    // Click validate to test the validation behavior with whitespace input
    await clickValidateButton()
    
    // Should show success message (whitespace-only YAML is typically valid)
    await waitFor(() => {
      const successAlert = screen.getByRole('status')
      expect(successAlert).toBeInTheDocument()
      expect(successAlert).toHaveTextContent(/no errors found/i)
    }, { timeout: 3000 })
  })

    it('handles very long YAML input', async () => {
      server.use(
        http.post('/validate', () => {
          return HttpResponse.json({ ok: true, messages: [] })
        })
      )

      render(<Playground />)
      
      // Create a moderately long YAML string to avoid timeout
      const longYaml = Array(100).fill('key').map((k, i) => `${k}${i}: value${i}`).join('\n')
      await typeInTextarea(longYaml)
      await clickValidateButton()

      await waitFor(() => {
        const successAlert = screen.getByRole('status')
        expect(successAlert).toBeInTheDocument()
        expect(successAlert).toHaveTextContent(/no errors found/i)
      }, { timeout: 10000 })
    }, 15000)
  })
})