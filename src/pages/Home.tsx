import { useMemo, useRef, useState } from 'react'
import { Seo } from '@/components/Seo'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

function mockValidate(yaml: string): Promise<{ ok: boolean; messages: { message: string; severity: 'error'|'warning'|'info' }[]; fixed?: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (/error/i.test(yaml) || yaml.trim() === '') {
        resolve({ ok: false, messages: [
          { message: 'Indentation issue on line 2', severity: 'error' },
          { message: 'Unknown key "scirpt"', severity: 'warning' },
        ] })
      } else {
        resolve({ ok: true, messages: [] })
      }
    }, 400)
  })
}

export default function Home() {
  const [yaml, setYaml] = useState('steps:\n  - script: echo hello\n')
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<null | { ok: boolean; messages: { message: string; severity: 'error'|'warning'|'info' }[] }>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const errorCount = useMemo(() => result?.messages.filter(m => m.severity === 'error').length ?? 0, [result])

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!/\.ya?ml$/i.test(file.name)) {
      alert('Please select a .yaml or .yml file.')
      return
    }
    const text = await file.text()
    setYaml(text)
  }

  const validate = async () => {
    setValidating(true)
    const res = await mockValidate(yaml)
    setResult(res)
    setValidating(false)
  }

  const fixAll = async () => {
    const fixed = yaml.replace(/\bscirpt\b/g, 'script').trimEnd() + '\n'
    setYaml(fixed)
    setResult({ ok: true, messages: [] })
  }

  return (
    <>
      <Seo
        title="Cloudlint • YAML Playground"
        description="Validate, preview, and fix YAML quickly with Cloudlint UI."
        canonical="https://cloudlint.local/"
        ogTitle="Cloudlint Playground"
        ogDescription="Try Cloudlint’s YAML validation and fixes in your browser."
      />
      <div className="container mx-auto grid gap-6 px-4 py-6 md:grid-cols-[1fr_320px]">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>YAML Input</CardTitle>
              <CardDescription>Paste YAML or upload a file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={yaml} onChange={(e)=>setYaml(e.target.value)} aria-label="YAML input" />
              {/* Hidden native input to preserve keyboard/AT access; triggered by the button below */}
              <Input ref={fileRef} className="sr-only" type="file" accept=".yaml,.yml" onChange={onUpload} aria-label="Upload YAML file" />
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={validate} disabled={validating}>{validating ? 'Validating…' : 'Validate'}</Button>
                <Button variant="secondary" type="button" onClick={()=>fileRef.current?.click()} aria-describedby="upload-hint">
                  <svg aria-hidden="true" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload YAML
                </Button>
                <span id="upload-hint" className="sr-only">Choose a .yaml or .yml file to load into the editor</span>
                {result?.ok && (
                  <div className="animate-in fade-in-50 text-sm text-green-600">Success: No errors found.</div>
                )}
              </div>
              {!result?.ok && result && (
                <Alert className="border-destructive bg-destructive/5">
                  <AlertTitle>Found {errorCount} error{errorCount!==1?'s':''}</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5">
                      {result.messages.map((m,i)=> (
                        <li key={i} className={m.severity==='error'?'text-red-600':m.severity==='warning'?'text-amber-600':'text-muted-foreground'}>{m.message}</li>
                      ))}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <Button variant="secondary" onClick={fixAll}>Fix All</Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
        <aside>
          <div className="sticky top-20 rounded-lg border p-4 text-sm text-muted-foreground">
            <div className="mb-2 font-medium text-foreground">Sponsored</div>
            <div className="h-56 w-full rounded bg-muted" />
            <p className="mt-3">Reserved ad space. Appears as sidebar on desktop and below content on mobile/tablet.</p>
          </div>
        </aside>
      </div>
    </>
  )
}
