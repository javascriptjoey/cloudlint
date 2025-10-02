export type LintMessage = {
  message: string
  severity: 'error' | 'warning' | 'info'
}

export type ValidateResponse = {
  ok: boolean
  messages: LintMessage[]
  fixed?: string
  diff?: string
  suggestedFix?: {
    yaml: string
    description: string
  }
}

export type AutofixResponse = {
  content: string
  fixesApplied: boolean
  diff?: string
}

export type SuggestResponse = {
  provider: string
  suggestions: unknown[]
}

export type ApplySuggestionsResponse = {
  content: string
}

export type ConvertResponse = {
  json?: string
  yaml?: string
}

export type DiffPreviewResponse = {
  diff: string
  before: string
  after: string
}

export type SchemaValidateResponse = {
  ok: boolean
  errors?: string[]
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type RequestOpts = {
  signal?: AbortSignal
  baseUrl?: string // default ''
}

const jsonHeaders = { 'Content-Type': 'application/json' }

async function post<T>(path: string, body: unknown, opts: RequestOpts = {}): Promise<T> {
  const res = await fetch(`${opts.baseUrl ?? ''}${path}`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body),
    signal: opts.signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(text || `HTTP ${res.status}`, res.status)
  }
  return res.json() as Promise<T>
}

export const api = {
  validate(yaml: string, opts?: RequestOpts) {
    return post<ValidateResponse>('/validate', { yaml }, opts)
  },
  autofix(yaml: string, opts?: RequestOpts) {
    return post<AutofixResponse>('/autofix', { yaml }, opts)
  },
  suggest(yaml: string, opts?: RequestOpts) {
    return post<SuggestResponse>('/suggest', { yaml }, opts)
  },
  applySuggestions(yaml: string, indexes: number[], provider?: string, opts?: RequestOpts) {
    return post<ApplySuggestionsResponse>('/apply-suggestions', { yaml, indexes, provider }, opts)
  },
  convert(params: { yaml?: string; json?: string }, opts?: RequestOpts) {
    return post<ConvertResponse>('/convert', params, opts)
  },
  diffPreview(original: string, modified: string, opts?: RequestOpts) {
    return post<DiffPreviewResponse>('/diff-preview', { original, modified }, opts)
  },
  schemaValidate(yaml: string, schema: object, opts?: RequestOpts) {
    return post<SchemaValidateResponse>('/schema-validate', { yaml, schema }, opts)
  },
}
