import { useMemo, useRef, useState } from 'react'
import { Seo } from '@/components/Seo'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, Check, FileJson, Diff, Copy, Download } from 'lucide-react'
import { diffLines } from 'diff'
import YAML from 'yaml'
import Ajv from 'ajv'

function detectProvider(yaml: string): 'AWS' | 'Azure' | 'Generic' {
  const y = yaml.toLowerCase()
  if (y.includes('awstemplateformatversion') || /resources:\s*\n/i.test(yaml)) return 'AWS'
  if (y.includes('azure') || y.includes('pool:') || y.includes('trigger:')) return 'Azure'
  return 'Generic'
}

export default function Playground() {
  const [yaml, setYaml] = useState('steps:\n  - script: echo hello\n')
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<null | { ok: boolean; messages: { message: string; severity: 'error'|'warning'|'info' }[]; fixed?: string }>(null)
  const [jsonView, setJsonView] = useState<string | null>(null)
  const [schemaName, setSchemaName] = useState<string | null>(null)
  const [schemaErrors, setSchemaErrors] = useState<string[] | null>(null)
  const [schemaText, setSchemaText] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const schemaRef = useRef<HTMLInputElement>(null)

  const provider = useMemo(() => detectProvider(yaml), [yaml])
  const hasInput = yaml.trim().length > 0

  const onUploadYaml: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!/\.ya?ml$/i.test(file.name)) {
      alert('Please select a .yaml or .yml file.')
      return
    }
    const text = await file.text()
    setYaml(text)
  }

  const onUploadSchema: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      JSON.parse(text)
      setSchemaName(file.name)
      setSchemaErrors(null)
      setSchemaText(text)
      if (schemaRef.current) schemaRef.current.value = ''
      setTimeout(() => { schemaRef.current?.blur() }, 0)
    } catch {
      setSchemaErrors(['Invalid JSON schema file'])
    }
  }

  async function validateYaml() {
    setValidating(true)
    // mocked validate: error if contains word "error" or empty
    const messages: { message: string; severity: 'error'|'warning'|'info' }[] = []
    if (yaml.trim() === '' || /error/i.test(yaml)) {
      messages.push({ message: 'Indentation issue on line 2', severity: 'error' })
      messages.push({ message: 'Unknown key "scirpt"', severity: 'warning' })
    }
    let fixed: string | undefined
    if (messages.length) {
      fixed = yaml.replace(/\bscirpt\b/g, 'script').trimEnd() + '\n'
    }

    // optional schema validation
    try {
      if (schemaText) {
        const json = YAML.parse(yaml || '{}')
        const ajv = new Ajv({ allErrors: true })
        const schema = JSON.parse(schemaText)
        const validate = ajv.compile(schema)
        const valid = validate(json)
        if (!valid && validate.errors) {
          const errs = validate.errors.map(e => `${e.instancePath || '/'} ${e.message}`)
          setSchemaErrors(errs)
        } else {
          setSchemaErrors(null)
        }
      }
    } catch (e) {
      setSchemaErrors([`Schema validation failed: ${(e as Error).message}`])
    }

    setResult({ ok: messages.length === 0, messages, fixed })
    setValidating(false)
  }

  function showJson() {
    try {
      const json = YAML.parse(yaml || '{}')
      setJsonView(JSON.stringify(json, null, 2))
    } catch (e) {
      setJsonView(`// Failed to convert: ${(e as Error).message}`)
    }
  }

  function copyJson() {
    if (!jsonView) return
    navigator.clipboard.writeText(jsonView)
  }

  function downloadJson() {
    if (!jsonView) return
    const blob = new Blob([jsonView], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cloudlint.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function applyFix() {
    if (result?.fixed) {
      setYaml(result.fixed)
      setResult({ ok: true, messages: [] })
    }
  }

  const diffs = useMemo(() => {
    if (!result?.fixed) return null
    return diffLines(yaml, result.fixed)
  }, [yaml, result])

  return (
    <>
      <Seo
        title="Cloudlint • Playground"
        description="Validate, convert, and fix YAML with provider awareness."
        canonical="https://cloudlint.local/playground"
        ogTitle="Cloudlint Playground"
        ogDescription="Try Cloudlint’s YAML validation, conversion, and fixes."
      />

      <section className="container mx-auto px-4 pt-6 md:pt-10">
        <div className="mb-4 flex items-center gap-3">
          <Badge variant="secondary">Provider: {provider}</Badge>
          {schemaName && <Badge title={schemaName}>Schema: {schemaName}</Badge>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>YAML Playground</CardTitle>
            <CardDescription>Paste YAML or upload a file. Validate, convert, and preview fixes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={yaml}
              onChange={(e)=>setYaml(e.target.value)}
              aria-label="YAML input"
              placeholder="Paste YAML here or use Upload to select a .yaml/.yml file"
              className="min-h-[360px] md:min-h-[520px]"
            />
            <Input ref={fileRef} className="sr-only" type="file" accept=".yaml,.yml" onChange={onUploadYaml} aria-label="Upload YAML file" />
            <Input ref={schemaRef} className="sr-only" type="file" accept="application/json,.json" onChange={onUploadSchema} aria-label="Upload JSON Schema" />

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={validateYaml} disabled={!hasInput || validating}>{validating ? 'Validating…' : 'Validate'}</Button>
              <Button variant="secondary" type="button" onClick={()=>fileRef.current?.click()} aria-describedby="upload-hint">
                <Upload className="mr-2 h-4 w-4" aria-hidden />
                Upload YAML
              </Button>
              <Button variant="secondary" type="button" onClick={showJson} disabled={!hasInput}>
                <FileJson className="mr-2 h-4 w-4" aria-hidden />
                Convert to JSON
              </Button>
              <Button variant="ghost" type="button" onClick={()=>schemaRef.current?.click()} aria-label="Upload JSON Schema">Upload Schema</Button>
              {result?.fixed && (
                <Button variant="default" type="button" onClick={applyFix}>
                  <Check className="mr-2 h-4 w-4" aria-hidden />
                  Apply Fix
                </Button>
              )}
              <span id="upload-hint" className="sr-only">Choose a .yaml or .yml file to load into the editor</span>
            </div>

            {schemaErrors && (
              <Alert className="border-destructive bg-destructive/5" role="alert">
                <AlertTitle>Schema validation</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5">
                    {schemaErrors.map((m,i)=>(<li key={i}>{m}</li>))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result && !result.ok && (
              <Alert className="border-destructive bg-destructive/5" role="alert">
                <AlertTitle>Found {result.messages.filter(m=>m.severity==='error').length} error(s)</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5">
                    {result.messages.map((m,i)=> (
                      <li key={i} className={m.severity==='error'?'text-red-600':m.severity==='warning'?'text-amber-600':'text-muted-foreground'}>{m.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {jsonView && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2"><FileJson className="h-4 w-4"/> <CardTitle>JSON</CardTitle></div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={copyJson}><Copy className="h-4 w-4"/></Button>
                    <Button size="sm" variant="secondary" onClick={downloadJson}><Download className="h-4 w-4"/></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-auto rounded bg-muted p-3 text-sm"><code>{jsonView}</code></pre>
                </CardContent>
              </Card>
            )}

            {diffs && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><Diff className="h-4 w-4"/> <CardTitle>Preview changes</CardTitle></div>
                  <CardDescription>Changes introduced by fixes</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-auto rounded bg-muted p-3 text-xs">
                    {diffs.map((part, idx) => (
                      <div key={idx} className={part.added? 'text-green-600' : part.removed? 'text-red-600' : ''}>
                        {part.value}
                      </div>
                    ))}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}