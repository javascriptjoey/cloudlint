import { useEffect, useRef, useState } from 'react'
import { Seo } from '@/components/Seo'
import { CodeMirrorYamlEditor } from '@/components/CodeMirrorYamlEditor'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, Check, FileJson, Diff, Copy, Download, X } from 'lucide-react'
import { api } from '@/lib/apiClient'
import { useDebouncedValidation } from '@/hooks/useDebouncedValidation'
import { RealTimeValidationSettings } from '@/components/RealTimeValidationSettings'

const YAML_MAX_BYTES = Number(import.meta.env.VITE_YAML_MAX_BYTES ?? 200_000) // ~200 KB default

export default function Playground() {
  const [yaml, setYaml] = useState('')
  const [validating, setValidating] = useState(false)
  const [showBusyLabel, setShowBusyLabel] = useState(false)
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
  const cancelDelayRef = useRef<number | null>(null)
  const busyLabelDelayRef = useRef<number | null>(null)
  const schemaBlurDelayRef = useRef<number | null>(null)
  const [showCancel, setShowCancel] = useState(false)
  const [realTimeValidationEnabled, setRealTimeValidationEnabled] = useState(true)

  // Set up debounced validation
  const debouncedValidation = useDebouncedValidation(yaml, validateYaml, {
    enabled: realTimeValidationEnabled,
    immediate: true, // Validate initial content immediately
  })

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
      schemaBlurDelayRef.current = window.setTimeout(() => { schemaRef.current?.blur() }, 0)
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
    setShowCancel(false)
    setShowBusyLabel(false)
    // Only show Cancel if the request lasts over 250ms to avoid jarring flashes
    if (cancelDelayRef.current) window.clearTimeout(cancelDelayRef.current)
    if (busyLabelDelayRef.current) window.clearTimeout(busyLabelDelayRef.current)
    cancelDelayRef.current = window.setTimeout(()=> setShowCancel(true), 250)
    // Only switch label after 150ms to avoid brief flicker on fast responses
    busyLabelDelayRef.current = window.setTimeout(()=> setShowBusyLabel(true), 150)
    setSchemaErrors(null)
    try {
      // abort any in-flight request
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      const maybeSignal = import.meta.env.MODE === 'test' ? undefined : controller.signal
      console.info('[ui] POST /validate bytes=', new TextEncoder().encode(yaml).length)
      const res = await api.validate(yaml, { signal: maybeSignal })
      console.info('[ui] validate result', res)
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
      // Normalize severities to lowercase, then compute display-OK
      const normMsgs = (res.messages ?? []).map(m => {
        const sev = String(m.severity ?? 'info').trim().toLowerCase()
        let norm: 'error'|'warning'|'info' = 'info'
        if (sev.startsWith('err')) norm = 'error'
        else if (sev.startsWith('warn')) norm = 'warning'
        return { ...m, severity: norm }
      })
      const hasErrors = normMsgs.some(m => m.severity === 'error')
      // Validation is OK if server says OK (warnings are allowed when ok is true)
      // Only errors should prevent validation success, warnings are informational
      const displayOk = Boolean(res.ok && !hasErrors)

      // If server produced a fixed version, compute a unified diff via API
      if (res.fixed && res.fixed !== yaml) {
        try {
          const d = await api.diffPreview(yaml, res.fixed, { signal: maybeSignal })
          setResult({ ok: displayOk, messages: normMsgs, fixed: d.after })
          setJsonView(null)
          setDiffText(d.diff)
        } catch {
          setResult({ ok: displayOk, messages: normMsgs, fixed: res.fixed })
        }
      } else {
        setResult({ ok: displayOk, messages: normMsgs, fixed: res.fixed })
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      const msg = (e as Error).message || 'Validation failed. Please try again.'
      setResult({ ok: false, messages: [{ message: msg, severity: 'error' }] })
    } finally {
      setValidating(false)
      if (cancelDelayRef.current) {
        window.clearTimeout(cancelDelayRef.current)
        cancelDelayRef.current = null
      }
      if (busyLabelDelayRef.current) {
        window.clearTimeout(busyLabelDelayRef.current)
        busyLabelDelayRef.current = null
      }
      setShowCancel(false)
      setShowBusyLabel(false)
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

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clean up any pending timeouts
      if (cancelDelayRef.current) {
        window.clearTimeout(cancelDelayRef.current)
      }
      if (busyLabelDelayRef.current) {
        window.clearTimeout(busyLabelDelayRef.current)
      }
      if (schemaBlurDelayRef.current) {
        window.clearTimeout(schemaBlurDelayRef.current)
      }
      // Abort any in-flight requests
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [])

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

        <div className="mt-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Provider: {provider}</Badge>
            {schemaName && <Badge title={schemaName}>Schema: {schemaName}</Badge>}
          </div>
          <RealTimeValidationSettings 
            enabled={realTimeValidationEnabled}
            onEnabledChange={setRealTimeValidationEnabled}
            isPending={debouncedValidation.isPending}
            lastValidatedLength={debouncedValidation.lastValidatedValue.length}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>YAML Playground</CardTitle>
            <CardDescription>Paste YAML or upload a file. Validate, convert, and preview fixes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeMirrorYamlEditor
              value={yaml}
              onChange={setYaml}
              aria-label="YAML input"
              placeholder="Paste YAML here or use Upload to select a .yaml/.yml file"
              className="min-h-[360px] md:min-h-[520px]"
            />
            <Input ref={fileRef} className="sr-only" type="file" accept=".yaml,.yml" onChange={onUploadYaml} aria-label="Upload YAML file" />
            <Input ref={schemaRef} className="sr-only" type="file" accept="application/json,.json" onChange={onUploadSchema} aria-label="Upload JSON Schema" />

            <div className="flex flex-wrap items-center gap-3">
<Button onClick={debouncedValidation.validateNow} disabled={!hasInput || validating} aria-busy={validating} aria-live="polite" className="min-w-[115px] flex items-center">
                <span>{realTimeValidationEnabled ? 'Validate Now' : 'Validate'}</span>
                <span aria-hidden className={showBusyLabel ? 'ml-2 inline-block size-3 rounded-full border-2 border-current border-r-transparent animate-spin' : 'ml-2 inline-block size-3 opacity-0'} />
              </Button>
              {/* Reserve space to avoid layout shift when Cancel appears */}
              <div className="min-w-[92px]">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={()=>{ controllerRef.current?.abort(); }}
                  className={showCancel ? '' : 'invisible'}
                >
                  <X className="mr-2 h-4 w-4" aria-hidden />
                  Cancel
                </Button>
              </div>
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
                <AlertTitle>
                  Found {result.messages.filter(m=>m.severity!=='info').length} issue(s)
                  {(() => {
                    const e = result.messages.filter(m=>m.severity==='error').length
                    const w = result.messages.filter(m=>m.severity==='warning').length
                    if (e || w) return ` (errors: ${e}, warnings: ${w})`
                    return ''
                  })()}
                </AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5">
                    {result.messages.map((m,i)=> (
                      <li key={i} className={m.severity==='error'?'text-red-600':m.severity==='warning'?'text-amber-600':'text-muted-foreground'}>{m.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result && result.ok && (
              <Alert className="border-green-600/50 bg-green-600/5" role="status">
                <AlertTitle>No errors found</AlertTitle>
                <AlertDescription>
                  Validation completed successfully.
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