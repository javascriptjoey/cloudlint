import { useEffect, useRef, useState } from 'react'
import { Seo } from '@/components/Seo'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, Check, FileJson, Diff, Copy, Download, X } from 'lucide-react'
import { api } from '@/lib/apiClient'

const YAML_MAX_BYTES = Number(import.meta.env.VITE_YAML_MAX_BYTES ?? 200_000) // ~200 KB default

export default function Playground() {
  const [yaml, setYaml] = useState('steps:\n  - script: echo hello\n')
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<null | { ok: boolean; messages: { message: string; severity: 'error'|'warning'|'info' }[]; fixed?: string }>(null)
  const [jsonView, setJsonView] = useState<string | null>(null)
  const [schemaName, setSchemaName] = useState<string | null>(null)
  const [schemaErrors, setSchemaErrors] = useState<string[] | null>(null)
  const [schemaText, setSchemaText] = useState<string | null>(null)
  const [provider, setProvider] = useState<'AWS'|'Azure'|'Generic'>('Generic')
  const [oversizeError, setOversizeError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const schemaRef = useRef<HTMLInputElement>(null)

  const hasInput = yaml.trim().length > 0

  const onUploadYaml: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!/\.ya?ml$/i.test(file.name)) {
      alert('Please select a .yaml or .yml file.')
      return
    }
    if (file.size > YAML_MAX_BYTES) {
      setOversizeError(`File too large (${Math.round(file.size/1024)}KB). Max allowed is ${Math.round(YAML_MAX_BYTES/1024)}KB`)
      return
    }
    const text = await file.text()
    setOversizeError(null)
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
    // client-side size check
    const bytes = new TextEncoder().encode(yaml).length
    if (bytes > YAML_MAX_BYTES) {
      setOversizeError(`Input too large (${Math.round(bytes/1024)}KB). Max allowed is ${Math.round(YAML_MAX_BYTES/1024)}KB`)
      return
    }
    setOversizeError(null)
    setValidating(true)
    setSchemaErrors(null)
    try {
      // abort any in-flight request
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      const maybeSignal = import.meta.env.MODE === 'test' ? undefined : controller.signal
      const res = await api.validate(yaml, { signal: maybeSignal })
      // Also fetch provider hints
      api.suggest(yaml, { signal: maybeSignal }).then(s => {
        const p = String(s.provider || '').toLowerCase()
        if (p.includes('aws')) setProvider('AWS')
        else if (p.includes('azure')) setProvider('Azure')
        else setProvider('Generic')
      }).catch(() => {})
      // Optional schema validation (server-side) if a schema was uploaded
      if (schemaText) {
        try {
          const schema = JSON.parse(schemaText)
          const sv = await api.schemaValidate(yaml, schema)
          if (!sv.ok) setSchemaErrors(sv.errors ?? ['Schema validation failed'])
        } catch (e) {
          setSchemaErrors([`Schema validation failed: ${(e as Error).message}`])
        }
      }
      // If server produced a fixed version, compute a unified diff via API
      if (res.fixed && res.fixed !== yaml) {
        try {
          const d = await api.diffPreview(yaml, res.fixed, { signal: maybeSignal })
          setResult({ ok: res.ok, messages: res.messages, fixed: d.after })
          setJsonView(null)
          setDiffText(d.diff)
        } catch {
          setResult({ ok: res.ok, messages: res.messages, fixed: res.fixed })
        }
      } else {
        setResult({ ok: res.ok, messages: res.messages, fixed: res.fixed })
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setResult({ ok: false, messages: [{ message: (e as Error).message, severity: 'error' }] })
    } finally {
      setValidating(false)
      controllerRef.current = null
    }
  }

  async function showJson() {
    try {
      const res = await api.convert({ yaml })
      setJsonView(res.json ?? '// No JSON produced')
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
      setDiffText(undefined)
    }
  }

  const [diffText, setDiffText] = useState<string | undefined>(undefined)

  // Auto-cancel in-flight validation when input changes (for responsiveness)
  useEffect(() => {
    if (validating) {
      controllerRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yaml])

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
        <h1 className="text-3xl font-semibold tracking-tight">Cloudlint YAML Playground</h1>
        <p className="mt-2 text-muted-foreground">Validate and auto-fix YAML with provider-aware analyzers.</p>

        <div className="mt-4 mb-4 flex items-center gap-3">
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
              {validating && (
                <Button variant="ghost" type="button" onClick={()=>{ controllerRef.current?.abort(); }}>
                  <X className="mr-2 h-4 w-4" aria-hidden />
                  Cancel
                </Button>
              )}
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

            {oversizeError && (
              <Alert className="border-destructive bg-destructive/5" role="alert">
                <AlertTitle>File too large</AlertTitle>
                <AlertDescription>{oversizeError}</AlertDescription>
              </Alert>
            )}

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
                    <Button size="sm" variant="secondary" aria-label="Copy JSON" onClick={copyJson}><Copy className="h-4 w-4"/></Button>
                    <Button size="sm" variant="secondary" aria-label="Download JSON" onClick={downloadJson}><Download className="h-4 w-4"/></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-auto rounded bg-muted p-3 text-sm"><code>{jsonView}</code></pre>
                </CardContent>
              </Card>
            )}

            {diffText && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><Diff className="h-4 w-4"/> <CardTitle>Preview changes</CardTitle></div>
                  <CardDescription>Changes introduced by fixes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">{diffText}</pre>
                  <div className="flex gap-2">
                    <Button variant="default" type="button" onClick={applyFix}><Check className="mr-2 h-4 w-4"/> Accept</Button>
                    <Button variant="ghost" type="button" onClick={()=>{ setDiffText(undefined); setResult(prev=> prev ? { ...prev, fixed: prev.fixed } : prev) }}>Decline</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}