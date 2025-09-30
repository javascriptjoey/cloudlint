import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/validate', async ({ request }) => {
    const { yaml } = await request.json() as { yaml: string }
    const messages = !yaml || /error/i.test(yaml) ? [
      { message: 'Indentation issue on line 2', severity: 'error' },
      { message: 'Unknown key "scirpt"', severity: 'warning' },
    ] : []
    const fixed = messages.length ? String(yaml).replace(/\bscirpt\b/g, 'script').trimEnd() + '\n' : undefined
    return HttpResponse.json({ ok: messages.length === 0, messages, fixed })
  }),
  http.post('/schema-validate', async ({ request }) => {
    const { yaml } = await request.json() as { yaml: string }
    const invalid = String(yaml || '').includes('name:') ? false : true
    return HttpResponse.json({ ok: !invalid, errors: invalid ? ['/: must have required property `name`'] : [] })
  }),
  http.post('/convert', async ({ request }) => {
    const body = await request.json() as { yaml?: string, json?: string }
    if (body.yaml) return HttpResponse.json({ json: JSON.stringify({ converted: true }, null, 2) })
    if (body.json) return HttpResponse.json({ yaml: 'converted: true\n' })
    return HttpResponse.json({ json: '{}' })
  }),
  http.post('/diff-preview', async ({ request }) => {
    const { original, modified } = await request.json() as { original: string, modified: string }
    const diff = `@@\n-${original}+${modified}`
    return HttpResponse.json({ diff, before: original, after: modified })
  }),
  http.post('/autofix', async ({ request }) => {
    const { yaml } = await request.json() as { yaml: string }
    return HttpResponse.json({ content: String(yaml || '').replace(/\bscirpt\b/g, 'script'), fixesApplied: true })
  }),
  http.post('/suggest', async ({ request }) => {
    const { yaml } = await request.json() as { yaml: string }
    const p = yaml.toLowerCase().includes('awstemplateformatversion') ? 'aws' : yaml.toLowerCase().includes('azure') ? 'azure' : 'generic'
    return HttpResponse.json({ provider: p, suggestions: [] })
  }),
  // Serve static animation files in tests to avoid unhandled MSW requests
  http.get('/animations/:file', () => {
    return HttpResponse.text('', { status: 200, headers: { 'Content-Type': 'application/octet-stream' } })
  }),
]
