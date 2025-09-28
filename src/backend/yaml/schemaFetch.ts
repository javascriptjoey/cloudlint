#!/usr/bin/env tsx
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import https from 'node:https'
import zlib from 'node:zlib'

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolveP, reject) => {
    https.get(url, { headers: { 'Accept-Encoding': 'gzip,deflate' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // redirect
        return resolveP(fetchBuffer(res.headers.location))
      }
      const chunks: Buffer[] = []
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
      res.on('end', () => {
        let buf = Buffer.concat(chunks)
        const enc = (res.headers['content-encoding'] || '').toString().toLowerCase()
        if (enc.includes('gzip')) {
try { buf = zlib.gunzipSync(buf) } catch { console.warn('gzip decompression failed, using raw buffer') }
        }
        resolveP(buf)
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function downloadJson(url: string): Promise<unknown> {
  const buf = await fetchBuffer(url)
  // try as text JSON; if gzipped JSON, we already unzipped
  const txt = buf.toString('utf8')
  return JSON.parse(txt) as unknown
}

function ensureDir(p: string) {
  const dir = dirname(p)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

async function main() {
  const azureUrl = process.env.AZURE_PIPELINES_SCHEMA_URL || 'https://json.schemastore.org/azure-pipelines.json'
  const cfnUrl = process.env.CFN_SPEC_URL || 'https://d1uauaxba7bl26.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json'

  const argOutIdx = process.argv.findIndex((a) => a === '--out-dir')
  const outDir = resolve(process.cwd(), argOutIdx > -1 && process.argv[argOutIdx + 1] ? process.argv[argOutIdx + 1] : (process.env.SCHEMAS_OUT_DIR || 'schemas'))
  const azureOut = resolve(outDir, 'azure-pipelines.json')
  const cfnOut = resolve(outDir, 'cfn-spec.json')
  ensureDir(azureOut)

  const summary: Record<string, string> = {}

  const tryN = async (fn: () => Promise<void>, label: string) => {
    let lastErr: unknown
    for (let i = 0; i < 3; i++) {
      try { await fn(); return } catch (e) { lastErr = e; await new Promise(r=>setTimeout(r, 500*(i+1))) }
    }
    console.error(`Failed after retries: ${label}`, lastErr)
  }

  await tryN(async () => {
    const azure = await downloadJson(azureUrl)
    writeFileSync(azureOut, JSON.stringify(azure, null, 2), 'utf8')
    summary.azure = azureOut
  }, 'azure')

  await tryN(async () => {
    const cfn = await downloadJson(cfnUrl)
    writeFileSync(cfnOut, JSON.stringify(cfn, null, 2), 'utf8')
    summary.cfn = cfnOut
  }, 'cfn')

  // Helpful export lines for CI: write to a summary file
  console.log(JSON.stringify({ ok: true, ...summary }, null, 2))
}

if (process.argv[2] === 'fetch' || !process.argv[2]) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}