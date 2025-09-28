import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import zlib from 'node:zlib'

// Import the module under test
import { fetchSchemas } from '@/backend/yaml/schemaFetch'

describe('schema fetch utility', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'schemas-'))
  })

  it('writes azure and cfn schemas to out dir with injected downloader', async () => {
    const azureJson = Buffer.from(JSON.stringify({ title: 'azure', version: 1 }))
    const gzAzure = zlib.gzipSync(azureJson)
    const cfnJson = Buffer.from(JSON.stringify({ ResourceTypes: {} }))

    const downloader = async (url: string): Promise<Buffer> => {
      if (url.includes('azure')) return gzAzure // gzip buffer (our code tolerates utf8 since we parse as text; keep simple)
      if (url.includes('cfn')) return cfnJson
      throw new Error('unexpected url')
    }

    const result = await fetchSchemas({ outDir: dir, azureUrl: 'https://mock/azure', cfnUrl: 'https://mock/cfn', retries: 1, downloader })

    expect(result.azure).toBeDefined()
    expect(result.cfn).toBeDefined()
    const azurePath = result.azure!
    const cfnPath = result.cfn!
    expect(existsSync(azurePath)).toBe(true)
    expect(existsSync(cfnPath)).toBe(true)

    const azureParsed = JSON.parse(readFileSync(azurePath, 'utf8'))
    const cfnParsed = JSON.parse(readFileSync(cfnPath, 'utf8'))
    expect(azureParsed.title).toBe('azure')
    expect(cfnParsed.ResourceTypes).toBeDefined()

    rmSync(dir, { recursive: true, force: true })
  })
})
