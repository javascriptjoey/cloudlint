import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createServer } from '@/server'

let app: ReturnType<typeof createServer>

beforeAll(() => {
  process.env.RATE_LIMIT_MAX = '1000'
  app = createServer()
})

afterAll(() => {
  delete process.env.RATE_LIMIT_MAX
})

describe('REST API', () => {
  it('POST /validate returns LintResult', async () => {
    const res = await request(app).post('/validate').send({ yaml: 'foo: 1\n' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok')
    expect(Array.isArray(res.body.messages)).toBe(true)
  })

  it('POST /autofix returns fixed content', async () => {
    const res = await request(app).post('/autofix').send({ yaml: 'foo:1\t\n' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('content')
    expect(res.body.fixesApplied).toBeTruthy()
  })

  it('POST /suggest returns provider and suggestions', async () => {
    const res = await request(app).post('/suggest').send({ yaml: "steps:\n  - scirpt: echo hi\n" })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('provider')
    expect(res.body).toHaveProperty('suggestions')
  })

  it('POST /apply-suggestions applies rename suggestions for CFN', async () => {
    const cfn = "AWSTemplateFormatVersion: '2010-09-09'\nResources:\n  B:\n    Type: AWS::S3::Buckets\n"
    const s = await request(app).post('/suggest').send({ yaml: cfn })
    const renameIdxs = (s.body.suggestions || []).map((x: any, i: number) => x.kind === 'rename' ? i : -1).filter((i: number) => i >= 0)
    const res = await request(app).post('/apply-suggestions').send({ yaml: cfn, indexes: renameIdxs, provider: 'aws' })
    expect(res.status).toBe(200)
    expect(res.body.content).toContain('AWS::S3::Bucket')
  })

  it('POST /convert converts yaml->json and json->yaml', async () => {
    const a = await request(app).post('/convert').send({ yaml: 'foo: 1\n' })
    expect(a.status).toBe(200)
    expect(a.body.json).toContain('"foo"')

    const b = await request(app).post('/convert').send({ json: '{"a":2}' })
    expect(b.status).toBe(200)
    expect(b.body.yaml).toContain('a: 2')
  })

  it('POST /diff-preview returns unified diff', async () => {
    const res = await request(app).post('/diff-preview').send({ original: 'a: 1\n', modified: 'a: 2\n' })
    expect(res.status).toBe(200)
    expect(res.body.diff).toContain('@@')
    expect(res.body.before).toContain('a: 1')
    expect(res.body.after).toContain('a: 2')
  })

  it('POST /schema-validate validates YAML against provided schema', async () => {
    const schema = { type: 'object', required: ['name'], properties: { name: { type: 'string' } } }
    const bad = await request(app).post('/schema-validate').send({ yaml: 'age: 3\n', schema })
    expect(bad.status).toBe(200)
    expect(bad.body.ok).toBe(false)
    const ok = await request(app).post('/schema-validate').send({ yaml: 'name: Joe\n', schema })
    expect(ok.status).toBe(200)
    expect(ok.body.ok).toBe(true)
  })
})