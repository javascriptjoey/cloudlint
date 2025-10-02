import { render, screen, fireEvent } from '@testing-library/react'
import { RealTimeValidationSettings } from '@/components/RealTimeValidationSettings'
import { describe, it, expect, vi } from 'vitest'

describe('RealTimeValidationSettings', () => {
  const defaultProps = {
    enabled: true,
    onEnabledChange: vi.fn(),
    isPending: false,
    lastValidatedLength: 0,
  }

  it('renders the settings button with correct labels', () => {
    render(<RealTimeValidationSettings {...defaultProps} />)
    
    const button = screen.getByLabelText('Real-time validation settings')
    expect(button).toBeInTheDocument()
    expect(screen.getByText('Real-time')).toBeInTheDocument()
  })

  it('shows green indicator when enabled and not pending', () => {
    render(<RealTimeValidationSettings {...defaultProps} enabled={true} isPending={false} />)
    
    const enabledIndicator = screen.getByLabelText('Real-time validation enabled')
    expect(enabledIndicator).toBeInTheDocument()
    expect(enabledIndicator).toHaveClass('bg-green-500')
  })

  it('shows orange pulsing indicator when pending', () => {
    render(<RealTimeValidationSettings {...defaultProps} enabled={true} isPending={true} />)
    
    const pendingIndicator = screen.getByLabelText('Validation pending')
    expect(pendingIndicator).toBeInTheDocument()
    expect(pendingIndicator).toHaveClass('bg-orange-500', 'animate-pulse')
  })

  it('opens popover when button is clicked', async () => {
    render(<RealTimeValidationSettings {...defaultProps} />)
    
    const button = screen.getByLabelText('Real-time validation settings')
    fireEvent.click(button)
    
    expect(screen.getByText('Real-time Validation')).toBeInTheDocument()
    expect(screen.getByText('Automatically validate YAML as you type with smart debouncing')).toBeInTheDocument()
  })

  it('renders switch in correct state based on enabled prop', () => {
    const { rerender } = render(<RealTimeValidationSettings {...defaultProps} enabled={true} />)
    
    fireEvent.click(screen.getByLabelText('Real-time validation settings'))
    
    const enableSwitch = screen.getByRole('switch')
    expect(enableSwitch).toBeChecked()
    
    rerender(<RealTimeValidationSettings {...defaultProps} enabled={false} />)
    expect(enableSwitch).not.toBeChecked()
  })

  it('calls onEnabledChange when switch is toggled', () => {
    const onEnabledChange = vi.fn()
    render(<RealTimeValidationSettings {...defaultProps} onEnabledChange={onEnabledChange} />)
    
    fireEvent.click(screen.getByLabelText('Real-time validation settings'))
    
    const enableSwitch = screen.getByRole('switch')
    fireEvent.click(enableSwitch)
    
    expect(onEnabledChange).toHaveBeenCalledWith(false)
  })

  it('shows smart debouncing info when enabled', () => {
    render(<RealTimeValidationSettings {...defaultProps} enabled={true} />)
    
    fireEvent.click(screen.getByLabelText('Real-time validation settings'))
    
    expect(screen.getByText('Smart debouncing active')).toBeInTheDocument()
    expect(screen.getByText('500ms delay')).toBeInTheDocument()
    expect(screen.getByText('up to 1.5s delay')).toBeInTheDocument()
  })

  it('shows last validated length when available', () => {
    render(<RealTimeValidationSettings {...defaultProps} enabled={true} lastValidatedLength={150} />)
    
    fireEvent.click(screen.getByLabelText('Real-time validation settings'))
    
    expect(screen.getByText('Last validated:')).toBeInTheDocument()
    expect(screen.getByText('150 characters')).toBeInTheDocument()
  })

  it('shows pending status when validation is pending', () => {
    render(<RealTimeValidationSettings {...defaultProps} enabled={true} isPending={true} />)
    
    fireEvent.click(screen.getByLabelText('Real-time validation settings'))
    
    expect(screen.getByText('Validation will trigger soon...')).toBeInTheDocument()
  })

  it('shows disabled message when real-time validation is off', () => {
    render(<RealTimeValidationSettings {...defaultProps} enabled={false} />)
    
    fireEvent.click(screen.getByLabelText('Real-time validation settings'))
    
    expect(screen.getByText('When disabled, use the Validate button to check your YAML manually.')).toBeInTheDocument()
  })

  it('does not show advanced settings when disabled', () => {
    render(<RealTimeValidationSettings {...defaultProps} enabled={false} />)
    
    fireEvent.click(screen.getByLabelText('Real-time validation settings'))
    
    expect(screen.queryByText('Smart debouncing active')).not.toBeInTheDocument()
    expect(screen.queryByText('500ms delay')).not.toBeInTheDocument()
  })

  it('handles keyboard navigation', () => {
    render(<RealTimeValidationSettings {...defaultProps} />)
    
    const button = screen.getByLabelText('Real-time validation settings')
    
    // Should be focusable
    button.focus()
    expect(button).toHaveFocus()
    
    // Should open when activated (Radix handles keyboard activation internally)
    fireEvent.click(button)
    expect(screen.getByText('Real-time Validation')).toBeInTheDocument()
  })
})