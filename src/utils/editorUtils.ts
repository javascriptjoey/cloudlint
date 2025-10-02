interface ValidationMessage {
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface EditorError {
  message: string
  severity: 'error' | 'warning' | 'info'
  line?: number
  column?: number
}

/**
 * Parse validation messages and extract line/column information for editor highlighting
 */
export function parseValidationErrors(messages: ValidationMessage[]): EditorError[] {
  return messages.map(msg => {
    const error: EditorError = {
      message: msg.message,
      severity: msg.severity
    }

    // Common YAML error patterns to extract line/column information
    const patterns = [
      // "error on line 5 column 10"
      /(?:error|warning|issue)\s+(?:on\s+|at\s+)?line\s+(\d+)(?:\s+column\s+(\d+))?/i,
      // "line 5, column 10"
      /line\s+(\d+)(?:,?\s+column\s+(\d+))?/i,
      // "at line 5:10" or "5:10"
      /(?:at\s+)?(?:line\s+)?(\d+):(\d+)/,
      // "line 5" only
      /line\s+(\d+)/i,
      // "(line 5)"
      /\(line\s+(\d+)\)/i,
      // YAML parser errors: "mapping values are not allowed here"
      /mapping\s+values.*line\s+(\d+)/i,
      // "could not find expected ':' at line 5"
      /could\s+not\s+find.*line\s+(\d+)/i,
      // "unexpected character at line 5 column 10"
      /unexpected.*line\s+(\d+)(?:\s+column\s+(\d+))?/i,
      // "found unexpected end of stream at line 5"
      /unexpected\s+end.*line\s+(\d+)/i,
      // Indentation errors: "indentation error on line 2"
      /indentation.*line\s+(\d+)/i
    ]

    for (const pattern of patterns) {
      const match = msg.message.match(pattern)
      if (match) {
        error.line = parseInt(match[1], 10)
        if (match[2]) {
          error.column = parseInt(match[2], 10)
        }
        break
      }
    }

    return error
  })
}

/**
 * Extract keyboard shortcut combinations for the editor
 */
export const editorKeyboardShortcuts = {
  validate: { key: 'Mod-s', description: 'Validate YAML' },
  find: { key: 'Mod-f', description: 'Find text' },
  replace: { key: 'Mod-h', description: 'Find and replace' },
  toggleComment: { key: 'Mod-/', description: 'Toggle comment' },
  indentMore: { key: 'Tab', description: 'Indent more' },
  indentLess: { key: 'Shift-Tab', description: 'Indent less' },
  duplicateLine: { key: 'Mod-d', description: 'Duplicate line' },
  deleteLine: { key: 'Mod-Shift-k', description: 'Delete line' },
  goToLine: { key: 'Mod-g', description: 'Go to line' }
} as const

/**
 * Check if a message indicates a structural YAML error that should be highlighted
 */
export function isStructuralError(message: string): boolean {
  const structuralKeywords = [
    'unexpected',
    'indentation',
    'mapping values',
    'could not find',
    'end of stream',
    'syntax error',
    'parse error',
    'invalid yaml',
    'malformed'
  ]

  const lowercaseMessage = message.toLowerCase()
  return structuralKeywords.some(keyword => lowercaseMessage.includes(keyword))
}

/**
 * Get appropriate error decoration styling based on severity and error type
 */
export function getErrorDecorationType(severity: 'error' | 'warning' | 'info', isStructural: boolean) {
  if (severity === 'error') {
    return isStructural ? 'cm-error-highlight-structural' : 'cm-error-highlight'
  }
  if (severity === 'warning') {
    return 'cm-warning-highlight'
  }
  return 'cm-info-highlight'
}

/**
 * Format error message for display in editor tooltips
 */
export function formatErrorTooltip(error: EditorError): string {
  const position = error.line 
    ? error.column 
      ? `Line ${error.line}, Column ${error.column}` 
      : `Line ${error.line}`
    : ''
  
  return position 
    ? `${error.severity.toUpperCase()}: ${error.message} (${position})`
    : `${error.severity.toUpperCase()}: ${error.message}`
}