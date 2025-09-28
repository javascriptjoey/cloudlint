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
  // Avoid control-char regex to satisfy no-control-regex: filter by code points
  let out = ''
  for (const ch of input) {
    const code = ch.charCodeAt(0)
    const printable = (code >= 0x20 && code <= 0x7e) || code === 0x09 || code === 0x0a || code === 0x0d
    out += printable ? ch : '�'
    if (out.length >= max) break
  }
  return out
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

  // Reject likely-binary content (presence of NUL or high ratio of control chars)
  const nulIdx = content.indexOf('\u0000')
  let controlCount = 0
  for (const ch of content) {
    const code = ch.charCodeAt(0)
    const printable = (code >= 0x20 && code <= 0x7e) || code === 0x09 || code === 0x0a || code === 0x0d
    if (!printable) controlCount++
  }
  const controlRatio = content.length ? controlCount / content.length : 0
  if (nulIdx !== -1 || controlRatio > 0.01) {
    messages.push({
      source: 'parser',
      severity: 'error',
      message: 'Binary or non-text content detected; only plain-text YAML is allowed',
      kind: 'syntax',
      suggestion: 'Provide a plain-text .yaml/.yml file',
      path: filename,
    })
  }

  // Reject JSON input (even though JSON is valid YAML) to enforce YAML-only policy
  const trimmed = content.trim()
  if ((trimmed.startsWith('{') || trimmed.startsWith('['))) {
    try {
      JSON.parse(trimmed)
      messages.push({
        source: 'parser',
        severity: 'error',
        message: 'JSON detected; only YAML is accepted',
        kind: 'syntax',
        suggestion: 'Convert JSON to YAML or provide a YAML file',
        path: filename,
      })
    } catch {
      // ignore if not strictly JSON
    }
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
  if (/^[\s-]*!(?:!|<|[A-Za-z])/m.test(content)) {
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
