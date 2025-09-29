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

export function preflightContentGuards(content: string, opts?: { filename?: string; relaxSecurity?: boolean; allowAnchors?: boolean; allowAliases?: boolean; allowedTags?: string[] }): LintMessage[] {
  const messages: LintMessage[] = []
  const filename = opts?.filename
  const relax = !!opts?.relaxSecurity
  const allowAnchors = !!opts?.allowAnchors
  const allowAliases = !!opts?.allowAliases
  const allowedTags = new Set((opts?.allowedTags ?? []).map(s => String(s)))
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
        severity: relax ? 'warning' : 'error',
        message: 'JSON detected; only YAML is accepted',
        kind: 'syntax',
        suggestion: 'Convert JSON to YAML or provide a YAML file',
        path: filename,
      })
    } catch {
      // ignore if not strictly JSON
    }
  }

  // Block anchors & aliases; allow overrides.
  const anchorMatch = content.match(/(^|\s)&([A-Za-z0-9_]+)/m)
  const aliasMatch = content.match(/(^|\s)\*([A-Za-z0-9_]+)/m)
  if ((anchorMatch && !allowAnchors) || (aliasMatch && !allowAliases)) {
    messages.push({
      source: 'parser',
      severity: relax ? 'warning' : 'error',
      message: 'YAML anchors or aliases are not allowed for security reasons',
      kind: 'syntax',
      suggestion: 'Inline values or enable allowAnchors/allowAliases explicitly',
      path: filename,
    })
  }
  // Forbid dangerous custom tags anywhere: !! (double-bang) or !<tag> forms
  if (/(^|\s)!!/m.test(content) || /(^|\s)!</m.test(content)) {
    messages.push({
      source: 'parser',
      severity: relax ? 'warning' : 'error',
      message: 'Dangerous YAML tag usage (e.g., !! or !<...>) is not allowed',
      kind: 'syntax',
      suggestion: 'Remove double-bang or !<custom> tags',
      path: filename,
    })
  }
  // Block start-of-line custom single-bang tags unless allowlisted
  const solTag = content.match(/^[\s-]*!([A-Za-z][\w:-]*)/m)
  if (solTag) {
    const tag = `!${solTag[1]}`
    if (!allowedTags.has(tag)) {
      messages.push({
        source: 'parser',
        severity: relax ? 'warning' : 'error',
        message: `Custom YAML tag ${tag} is not allowed`,
        kind: 'syntax',
        suggestion: 'Remove tag or add to allowedTags',
        path: filename,
      })
    }
  }
  return messages
}
