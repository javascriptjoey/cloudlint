import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import { api, ApiError } from '@/lib/apiClient'

const ok = (data: unknown, init?: Partial<ResponseInit>) => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })
const err = (status: number, data?: unknown) => new Response(JSON.stringify(data ?? { error: 'x' }), { status, headers: { 'Content-Type': 'application/json' } })

describe('apiClient error handling', () => {
  const originalFetch = global.fetch
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('validate throws ApiError on 400/500', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => err(400)))
    await expect(api.validate('x')).rejects.toBeInstanceOf(ApiError)
type FetchMock = typeof fetch
;(fetch as unknown as MockedFunction<FetchMock>).mockImplementation(async () => err(500))
    await expect(api.validate('x')).rejects.toMatchObject({ status: 500 })
  })

  it('autofix throws ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => err(500)))
    await expect(api.autofix('x')).rejects.toBeInstanceOf(ApiError)
  })

  it('suggest throws ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => err(502)))
    await expect(api.suggest('x')).rejects.toMatchObject({ status: 502 })
  })

  it('applySuggestions throws ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => err(422)))
    await expect(api.applySuggestions('x', [0])).rejects.toMatchObject({ status: 422 })
  })

  it('convert throws ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => err(400)))
    await expect(api.convert({ yaml: 'x' })).rejects.toMatchObject({ status: 400 })
  })

  it('diffPreview throws ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => err(500)))
    await expect(api.diffPreview('a', 'b')).rejects.toBeInstanceOf(ApiError)
  })

  it('schemaValidate throws ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => err(400)))
    await expect(api.schemaValidate('x', {})).rejects.toBeInstanceOf(ApiError)
  })

  it('passes through ok JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok({ ok: true })))
    await expect(api.validate('x')).resolves.toEqual({ ok: true })
  })

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })
})
