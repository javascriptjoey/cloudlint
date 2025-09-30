import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Playground from '@/pages/Playground'

// Do not rely on MSW here; purely client behavior

describe('Playground schema upload parse error', () => {
  it('shows alert for invalid JSON schema file', async () => {
    render(<Playground />)

    const inputs = screen.getAllByLabelText('Upload JSON Schema')
    const input = inputs.find((el): el is HTMLInputElement => el instanceof HTMLInputElement && (el as HTMLInputElement).type === 'file') as HTMLInputElement
    // Construct a bogus JSON file
    const bad = new File(['{"not": valid'], 'bad.json', { type: 'application/json' })
    await userEvent.upload(input, bad)

    // Alert for invalid JSON schema file
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Invalid JSON schema file/i)
  })
})
