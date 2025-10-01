import express from 'express'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { validateYaml, autoFixYaml } from './backend/yaml'
import { suggest as sdkSuggest, applySuggestions as sdkApplySuggestions } from './backend/sdk'
import { yamlToJson, jsonToYaml } from './backend/yaml/convert'
import { unifiedDiff } from './backend/diff'
import { schemaValidateYaml } from './backend/yaml/schemaValidate'

export function createServer() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '2mb' }))

  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000)
  const max = Number(process.env.RATE_LIMIT_MAX || 120)
  const limiter = rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false })
  app.use(limiter)

  // Serve built frontend for E2E/production (and whenever build output exists)
  {
    const __dirname_es = path.dirname(fileURLToPath(import.meta.url))
    const distDir = path.resolve(__dirname_es, '../dist')
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir))
    }
  }

  function handleDownload(req: express.Request, res: express.Response, defaultName: string, mime: string) {
    const download = req.query.download === '1' || req.query.download === 'true'
    const asText = req.query.as === 'text'
    const filename = (req.query.filename as string) || defaultName
    if (download) res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.type(asText ? 'text/plain' : mime)
  }

  app.post('/validate', async (req, res) => {
    try {
      const { yaml, options } = req.body || {}
      const result = await validateYaml(String(yaml ?? ''), options || {})
      handleDownload(req, res, 'validate.json', 'application/json')
      const payload = JSON.stringify(result, null, 2)
      if ((req.query.as as string) === 'text') return res.send(payload)
      return res.json(result)
    } catch (e) {
      return res.status(400).json({ ok: false, error: e instanceof Error ? e.message : String(e) })
    }
  })

  app.post('/autofix', async (req, res) => {
    try {
      const { yaml, options } = req.body || {}
      const out = await autoFixYaml(String(yaml ?? ''), options || {})
      // Default to JSON response; provide text/plain when as=text
      handleDownload(req, res, 'autofix.json', 'application/json')
      if ((req.query.as as string) === 'text') return res.send(out.content)
      return res.json(out)
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : String(e) })
    }
  })

  app.post('/suggest', async (req, res) => {
    try {
      const { yaml, provider } = req.body || {}
      const out = await sdkSuggest(String(yaml ?? ''), provider)
      handleDownload(req, res, 'suggest.json', 'application/json')
      const payload = JSON.stringify(out, null, 2)
      if ((req.query.as as string) === 'text') return res.send(payload)
      return res.json(out)
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : String(e) })
    }
  })

  app.post('/apply-suggestions', async (req, res) => {
    try {
      const { yaml, indexes, provider } = req.body || {}
      const out = await sdkApplySuggestions(String(yaml ?? ''), indexes || [], provider)
      handleDownload(req, res, 'apply.json', 'application/json')
      if ((req.query.as as string) === 'text') return res.send(out.content)
      return res.json(out)
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : String(e) })
    }
  })

  app.post('/convert', async (req, res) => {
    try {
      const { yaml, json } = req.body || {}
      if (yaml && json) return res.status(400).json({ error: 'Provide either yaml or json, not both' })
      if (!yaml && !json) return res.status(400).json({ error: 'Provide yaml or json' })
      if (yaml) {
        const out = yamlToJson(String(yaml))
        handleDownload(req, res, 'convert.json', 'application/json')
        if ((req.query.as as string) === 'text') return res.send(out)
        return res.json({ json: out })
      } else {
        const out = jsonToYaml(String(json))
        handleDownload(req, res, 'convert.json', 'application/json')
        if ((req.query.as as string) === 'text') return res.send(out)
        return res.json({ yaml: out })
      }
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : String(e) })
    }
  })

  app.post('/diff-preview', async (req, res) => {
    try {
      const { original, modified, indexes, provider, autofixOptions } = req.body || {}
      const before = String(original ?? '')
      let after: string = String(modified ?? '')
      if (!after) {
        if (Array.isArray(indexes)) {
          const out = await sdkApplySuggestions(before, indexes, provider)
          after = out.content
        } else if (autofixOptions) {
          const out = await autoFixYaml(before, autofixOptions)
          after = out.content
        } else {
          return res.status(400).json({ error: 'Provide modified, or indexes+provider, or autofixOptions' })
        }
      }
      const patch = unifiedDiff(before, after)
      handleDownload(req, res, 'diff.json', 'application/json')
      if ((req.query.as as string) === 'text') return res.send(patch)
      return res.json({ diff: patch, before, after })
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : String(e) })
    }
  })

  app.post('/schema-validate', async (req, res) => {
    try {
      const { yaml, schema, schemaUrl } = req.body || {}
      let schemaObj = schema
      if (!schemaObj && schemaUrl) {
        const r = await fetch(String(schemaUrl))
        if (!r.ok) return res.status(400).json({ error: `Failed to fetch schema: ${r.status}` })
        schemaObj = await r.json()
      }
      if (!schemaObj) return res.status(400).json({ error: 'Provide schema or schemaUrl' })
      const out = schemaValidateYaml(String(yaml ?? ''), schemaObj)
      handleDownload(req, res, 'schema-validate.json', 'application/json')
      const payload = JSON.stringify(out, null, 2)
      if ((req.query.as as string) === 'text') return res.send(payload)
      return res.json(out)
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : String(e) })
    }
  })

  app.get('/health', (_req, res) => {
    res.status(200).type('text/plain').send('ok')
  })

  // Fallback to index.html for SPA routes when serving static
  if (process.env.SERVE_STATIC === '1' || process.env.NODE_ENV === 'production') {
    const __dirname_es = path.dirname(fileURLToPath(import.meta.url))
    const distDir = path.resolve(__dirname_es, '../dist')
    const indexHtml = path.join(distDir, 'index.html')
    if (fs.existsSync(indexHtml)) {
      app.get('*', (_req, res) => {
        res.sendFile(indexHtml)
      })
    }
  }

  return app
}

if (import.meta.main) {
  const port = Number(process.env.PORT || 8787)
  const app = createServer()
  const __dirname_es = path.dirname(fileURLToPath(import.meta.url))
  const distDir = path.resolve(__dirname_es, '../dist')
  console.log('[server] starting...')
  console.log('[server] env:', { SERVE_STATIC: process.env.SERVE_STATIC, NODE_ENV: process.env.NODE_ENV, PORT: port })
  if (fs.existsSync(distDir)) {
    console.log('[server] serving static from', distDir)
  } else {
    console.log('[server] dist directory not found at', distDir)
  }
  const server = app.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`)
  })
  server.on('error', (err) => {
    console.error('[server] listen error:', err)
    process.exitCode = 1
  })
  process.on('uncaughtException', (err) => {
    console.error('[server] uncaughtException:', err)
    process.exitCode = 1
  })
  process.on('unhandledRejection', (err) => {
    console.error('[server] unhandledRejection:', err)
    process.exitCode = 1
  })
}
