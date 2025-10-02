import React, { useEffect, useRef, useState } from 'react'
import { Seo } from '@/components/Seo'
import { YAMLEditor } from '@/components/YAMLEditor'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, Check, FileJson, Diff, Copy, Download, X, RotateCcw } from 'lucide-react'
import { api } from '@/lib/apiClient'
import { logger } from '@/utils/logger'

const YAML_MAX_BYTES = Number(import.meta.env.VITE_YAML_MAX_BYTES ?? 200_000) // ~200 KB default

export default function Playground() {
  const [yaml, setYaml] = useState('')
  
  // Log page initialization
  React.useEffect(() => {
    logger.userAction('playground_loaded', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    })
  }, [])
  const [validating, setValidating] = useState(false)
  const [showBusyLabel, setShowBusyLabel] = useState(false)
  const [result, setResult] = useState<null | { ok: boolean; messages: { message: string; severity: 'error'|'warning'|'info' }[]; fixed?: string; suggestedFix?: { yaml: string; description: string } }>(null)
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

  const hasInput = yaml.trim().length > 0


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

  const onUploadYaml: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    logger.userAction('yaml_file_upload_attempt', { fileName: e.target.files?.[0]?.name })
    const file = e.target.files?.[0]
    if (!file) {
      logger.userAction('yaml_file_upload_cancelled')
      return
    }
    if (!/\.ya?ml$/i.test(file.name)) {
      logger.userAction('yaml_file_upload_invalid_extension', { fileName: file.name })
      alert('Please select a .yaml or .yml file.')
      return
    }
    if (file.size > YAML_MAX_BYTES) {
      const error = `File too large (${Math.round(file.size/1024)}KB). Max allowed is ${Math.round(YAML_MAX_BYTES/1024)}KB`
      logger.error('UPLOAD', 'file_too_large', error, { fileSize: file.size, maxSize: YAML_MAX_BYTES })
      setOversizeError(error)
      return
    }
    try {
      const text = await file.text()
      logger.userAction('yaml_file_upload_success', { 
        fileName: file.name, 
        fileSize: file.size, 
        contentLength: text.length,
        lineCount: text.split('\n').length
      })
      setOversizeError(null)
      setYaml(text)
    } catch (error) {
      logger.error('UPLOAD', 'file_read_failed', error as Error, { fileName: file.name })
      alert('Failed to read file. Please try again.')
    }
  }

  async function validateYaml() {
    const startTime = performance.now()
    logger.validationEvent('validation_started', {
      yamlLength: yaml.length,
      lineCount: yaml.split('\n').length,
      hasContent: yaml.trim().length > 0
    })
    
    // client-side size check
    const bytes = new TextEncoder().encode(yaml).length
    if (bytes > YAML_MAX_BYTES) {
      const error = `Input too large (${Math.round(bytes/1024)}KB). Max allowed is ${Math.round(YAML_MAX_BYTES/1024)}KB`
      logger.error('VALIDATION', 'input_too_large', error, { bytes, maxBytes: YAML_MAX_BYTES })
      setOversizeError(error)
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
      const apiStartTime = performance.now()
      logger.apiCall('validate_request', { bytes: new TextEncoder().encode(yaml).length })
      const res = await api.validate(yaml, { signal: maybeSignal })
      logger.performance('validate_api_call', performance.now() - apiStartTime, {
        hasErrors: !res.ok,
        messageCount: res.messages?.length || 0,
        hasSuggestedFix: !!res.suggestedFix
      })
      logger.validationEvent('validation_response_received', {
        ok: res.ok,
        messageCount: res.messages?.length || 0,
        hasSuggestedFix: !!res.suggestedFix,
        hasFixed: !!res.fixed
      })
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
          setResult({ ok: displayOk, messages: normMsgs, fixed: d.after, suggestedFix: res.suggestedFix })
          setJsonView(null)
          setDiffText(d.diff)
        } catch {
          setResult({ ok: displayOk, messages: normMsgs, fixed: res.fixed, suggestedFix: res.suggestedFix })
        }
      } else {
        setResult({ ok: displayOk, messages: normMsgs, fixed: res.fixed, suggestedFix: res.suggestedFix })
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        logger.validationEvent('validation_aborted')
        return
      }
      const error = e as Error
      const msg = error.message || 'Validation failed. Please try again.'
      logger.error('VALIDATION', 'validation_failed', error, {
        yamlLength: yaml.length,
        errorName: error.name,
        errorMessage: error.message
      })
      setResult({ ok: false, messages: [{ message: msg, severity: 'error' }] })
    } finally {
      const totalTime = performance.now() - startTime
      logger.performance('validation_complete', totalTime, {
        successful: !result || result.ok,
        yamlLength: yaml.length
      })
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
    logger.userAction('json_conversion_started', { yamlLength: yaml.length })
    try {
      const startTime = performance.now()
      const res = await api.convert({ yaml })
      logger.performance('json_conversion_api', performance.now() - startTime)
      logger.userAction('json_conversion_success', { 
        jsonLength: res.json?.length || 0,
        hasOutput: !!res.json
      })
      setJsonView(res.json ?? '// No JSON produced')
    } catch (e) {
      logger.error('CONVERSION', 'json_conversion_failed', e as Error, { yamlLength: yaml.length })
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

  function resetEditor() {
    logger.userAction('editor_reset')
    // Clear all editor content and UI state
    setYaml('')
    setResult(null)
    setJsonView(null)
    setSchemaName(null)
    setSchemaErrors(null)
    setSchemaText(null)
    setOversizeError(null)
    setDiffText(undefined)
    setProvider('Generic')
    
    // Clear file inputs
    if (fileRef.current) fileRef.current.value = ''
    if (schemaRef.current) schemaRef.current.value = ''
    
    // Cancel any ongoing validation
    controllerRef.current?.abort()
    setValidating(false)
    setShowCancel(false)
    setShowBusyLabel(false)
    
    // Clear timeouts
    if (cancelDelayRef.current) {
      window.clearTimeout(cancelDelayRef.current)
      cancelDelayRef.current = null
    }
    if (busyLabelDelayRef.current) {
      window.clearTimeout(busyLabelDelayRef.current)
      busyLabelDelayRef.current = null
    }
    if (schemaBlurDelayRef.current) {
      window.clearTimeout(schemaBlurDelayRef.current)
      schemaBlurDelayRef.current = null
    }
  }

  function acceptSuggestedFix() {
    if (result?.suggestedFix) {
      logger.userAction('suggested_fix_accepted', {
        originalLength: yaml.length,
        fixedLength: result.suggestedFix.yaml.length,
        description: result.suggestedFix.description
      })
      setYaml(result.suggestedFix.yaml)
      // Clear previous results to trigger re-validation
      setResult(null)
      // Automatically validate the fixed YAML
      setTimeout(() => {
        validateYaml()
      }, 100)
    }
  }

  function copySuggestedFix() {
    if (result?.suggestedFix) {
      navigator.clipboard.writeText(result.suggestedFix.yaml)
    }
  }

  function downloadSuggestedFix() {
    if (!result?.suggestedFix) return
    const blob = new Blob([result.suggestedFix.yaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cloudlint-fixed.yaml'
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

  // Track YAML content changes
  useEffect(() => {
    if (yaml.trim().length > 0) {
      logger.editorEvent('yaml_content_changed', {
        length: yaml.length,
        lineCount: yaml.split('\n').length,
        wordCount: yaml.trim().split(/\s+/).length,
        hasContent: yaml.trim().length > 0
      })
    }
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

      <section className="container mx-auto px-4 py-6 flex-1 flex flex-col">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight">CloudLint YAML Playground</h1>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-muted-foreground">Validate and auto-fix YAML with comprehensive error detection</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Provider: {provider}</Badge>
              {schemaName && <Badge title={schemaName} className="text-xs">Schema: {schemaName}</Badge>}
            </div>
          </div>
        </div>

        {/* Optimized split layout for better viewport usage */}
        <div className="grid gap-4 lg:grid-cols-2 flex-1 min-h-0">
          {/* Left panel - YAML Editor */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">YAML Editor</CardTitle>
              <CardDescription className="text-sm">Enter YAML content with real-time error highlighting</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-3">
              <YAMLEditor
                value={yaml}
                onChange={setYaml}
                validationMessages={result?.messages || []}
placeholder={`Enter your YAML content here...

Example:
user:
  name: "John Doe"
  email: "john@example.com"
  roles:
    - admin
    - developer`}
                onValidate={validateYaml}
                className="flex-1 min-h-[300px]"
              />
            <Input ref={fileRef} className="sr-only" type="file" accept=".yaml,.yml" onChange={onUploadYaml} aria-label="Upload YAML file" />
            <Input ref={schemaRef} className="sr-only" type="file" accept="application/json,.json" onChange={onUploadSchema} aria-label="Upload JSON Schema" />

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-md border" role="toolbar" aria-label="YAML validation actions">
                <Button 
                  onClick={validateYaml} 
                  disabled={validating} 
                  aria-busy={validating} 
                  aria-live="polite" 
                  aria-describedby="validation-status"
                  className="min-w-[110px] flex items-center justify-center"
                  size="sm"
                >
                  <span>Validate YAML</span>
                  <span aria-hidden className={showBusyLabel ? 'ml-2 inline-block size-3 rounded-full border-2 border-current border-r-transparent animate-spin' : 'ml-2 inline-block size-3 opacity-0'} />
                </Button>
                
                <Button variant="outline" onClick={resetEditor} disabled={validating} size="sm" aria-label="Clear all content and reset editor">
                  <RotateCcw className="mr-1 h-3 w-3" aria-hidden />
                  Reset
                </Button>
                
                <Button variant="outline" type="button" onClick={()=>fileRef.current?.click()} aria-describedby="upload-hint" size="sm" aria-label="Upload YAML file">
                  <Upload className="mr-1 h-3 w-3" aria-hidden />
                  Upload
                </Button>
                
                <Button variant="outline" type="button" onClick={showJson} disabled={!hasInput} size="sm" aria-label="Convert YAML to JSON format">
                  <FileJson className="mr-1 h-3 w-3" aria-hidden />
                  Convert to JSON
                </Button>
                
                {/* Cancel button - appears only when validating */}
                {showCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={()=>{ controllerRef.current?.abort(); }}
                    aria-label="Cancel current validation"
                  >
                    <X className="mr-1 h-3 w-3" aria-hidden />
                    Cancel
                  </Button>
                )}
                
                <span id="upload-hint" className="sr-only">Choose a .yaml or .yml file to load into the editor</span>
                <span id="validation-status" className="sr-only" aria-live="polite">
                  {validating ? 'Validating YAML...' : result ? (result.ok ? 'Validation successful' : `Found ${result.messages.length} validation issues`) : ''}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Right panel - Results and JSON Output */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Validation Results & JSON Output</CardTitle>
              <CardDescription className="text-sm">Live validation feedback and JSON conversion</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 overflow-y-auto">
              {/* Error and success messages - always visible in right panel */}
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

              {/* Suggested Fix Section */}
              {result?.suggestedFix && (
                <div className="space-y-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900">💡 Suggested Fix Available</h3>
                      <p id="suggested-fix-description" className="text-xs text-blue-700 mt-1">{result.suggestedFix.description}</p>
                    </div>
                  </div>
                  
                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Original (with errors)</h4>
                      <div className="rounded border bg-red-50 max-h-32 overflow-auto">
                        <pre className="p-2 text-xs text-red-800">{yaml}</pre>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Suggested Fix</h4>
                      <div className="rounded border bg-green-50 max-h-32 overflow-auto">
                        <pre className="p-2 text-xs text-green-800">{result.suggestedFix.yaml}</pre>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-blue-200" role="group" aria-label="Suggested fix actions">
                    <Button 
                      size="sm" 
                      onClick={acceptSuggestedFix} 
                      className="bg-blue-600 hover:bg-blue-700"
                      aria-describedby="suggested-fix-description"
                    >
                      <Check className="mr-1 h-3 w-3" aria-hidden /> Accept Fix
                    </Button>
                    <Button size="sm" variant="outline" onClick={copySuggestedFix} aria-label="Copy suggested fix to clipboard">
                      <Copy className="mr-1 h-3 w-3" aria-hidden /> Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={downloadSuggestedFix} aria-label="Download suggested fix as YAML file">
                      <Download className="mr-1 h-3 w-3" aria-hidden /> Download
                    </Button>
                  </div>
                </div>
              )}

              {/* JSON Output - integrated into right panel */}
              {jsonView && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4"/> 
                      <h3 className="text-sm font-semibold">JSON Output</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" aria-label="Copy JSON" onClick={copyJson}>
                        <Copy className="h-4 w-4"/>
                      </Button>
                      <Button size="sm" variant="secondary" aria-label="Download JSON" onClick={downloadJson}>
                        <Download className="h-4 w-4"/>
                      </Button>
                    </div>
                  </div>
                  <div className="rounded border bg-muted/50 max-h-64 overflow-auto">
                    <pre className="p-3 text-sm"><code>{jsonView}</code></pre>
                  </div>
                </div>
              )}

              {/* Diff Preview - integrated into right panel */}
              {diffText && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Diff className="h-4 w-4"/> 
                    <h3 className="text-sm font-semibold">Preview Changes</h3>
                  </div>
                  <div className="rounded border bg-muted/50 max-h-48 overflow-auto">
                    <pre className="p-3 text-xs whitespace-pre-wrap">{diffText}</pre>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="default" size="sm" onClick={applyFix}>
                      <Check className="mr-2 h-4 w-4"/> Accept
                    </Button>
                    <Button variant="ghost" size="sm" onClick={()=>{ setDiffText(undefined); setResult(prev=> prev ? { ...prev, fixed: prev.fixed } : prev) }}>
                      Decline
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}