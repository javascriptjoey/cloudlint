import type { LintMessage } from './types'

export const MAX_BYTES = 2_097_152 // 2 MiB
export const MAX_LINES = 15_000

const YAML_MIME_WHITELIST = new Set([
  'application/yaml',
  'application/x-yaml',
  'text/yaml',
  'text/x-yaml',
])

export function sanitizeSnippet(input: string, max = 200): string {
  return input.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '�').slice(0, max)
}

export function validateFileMeta(filename?: string, mimeType?: string): LintMessage[] {
  const messages: LintMessage[] = []
  if (filename) {
    if (!/\.(ya?ml)$/i.test(filename)) {
      messages.push({
        source: 'parser',
        severity: 'error',
        message: `Unsupported file extension for ${filename}. Only .yaml/.yml allowed`,
        kind: 'syntax',
        suggestion: 'Rename the file to .yaml or .yml',
        path: filename,
      })
    }
  }
  if (mimeType && !YAML_MIME_WHITELIST.has(mimeType)) {
    messages.push({
      source: 'parser',
      severity: 'error',
      message: `Unsupported MIME type ${mimeType}.`,
      kind: 'syntax',
      suggestion: 'Use application/yaml or text/yaml',
    })
  }
  return messages
}

export function preflightContentGuards(content: string, filename?: string): LintMessage[] {
  const messages: LintMessage[] = []
  const byteLen = Buffer.byteLength(content, 'utf8')
  const lineCount = content.split(/\r?\n/).length
  if (byteLen > MAX_BYTES) {
    messages.push({
      source: 'parser',
      severity: 'error',
      message: `YAML exceeds max size of 2 MiB (${byteLen} bytes)`,
      kind: 'syntax',
      suggestion: 'Split the file or reduce content size',
      path: filename,
    })
  }
  if (lineCount > MAX_LINES) {
    messages.push({
      source: 'parser',
      severity: 'error',
      message: `YAML exceeds max lines of ${MAX_LINES} (${lineCount} lines)`,
      kind: 'syntax',
      suggestion: 'Split the file or reduce line count',
      path: filename,
    })
  }
  // Block anchors & aliases (billion laughs). Simple heuristic; cfn-lint also catches issues.
  if (/(^|\s)&[A-Za-z0-9_]+/m.test(content) || /(^|\s)\*[A-Za-z0-9_]+/m.test(content)) {
    messages.push({
      source: 'parser',
      severity: 'error',
      message: 'YAML anchors or aliases are not allowed for security reasons',
      kind: 'syntax',
      suggestion: 'Inline values instead of using &anchor/*alias',
      path: filename,
    })
  }
  // Forbid explicit custom tags starting with '!' (e.g., !!js/function)
  if (/^[\s\-]*!(?:!|<|[A-Za-z])/m.test(content)) {
    messages.push({
      source: 'parser',
      severity: 'error',
      message: 'Custom YAML tags are not allowed',
      kind: 'syntax',
      suggestion: 'Remove tag prefixes like !! or !<tag>',
      path: filename,
    })
  }
  return messages
}