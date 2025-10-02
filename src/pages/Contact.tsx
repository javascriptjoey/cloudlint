import { useState } from 'react'
import { Seo } from '@/components/Seo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SvgAnimation } from '@/components/SvgAnimation'
import { Coffee, UserCheck } from 'lucide-react'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null)

  const emailValid = /.+@.+\..+/.test(email)
  const canSubmit = name.trim().length > 1 && emailValid && message.trim().length > 4

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setStatus(null)
    await new Promise((r) => setTimeout(r, 500))
    if (/error/i.test(message)) setStatus({ ok: false, msg: 'Something went wrong. Please try again.' })
    else setStatus({ ok: true, msg: 'Thanks for your feedback! We appreciate it.' })
    setSubmitting(false)
  }

  return (
    <div className="px-0">
      <Seo
        title="Contact Cloudlint • Share feedback, ideas, and requests"
        description="Have suggestions, bugs, or feature ideas? Send us a message—Cloudlint is shaped by developers like you."
        canonical="https://cloudlint.local/contact"
        ogTitle="Contact Cloudlint"
        ogDescription="Share feedback and help us make YAML workflows effortless."
      />

      <section className="border-b bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">We’d love to hear from you</h1>
            <p className="mt-3 max-w-prose text-muted-foreground">Suggest improvements, report bugs, or request features—your input helps Cloudlint get better for everyone.</p>
            <div className="mt-6">
              <Button asChild variant="secondary">
                <a href="https://www.buymeacoffee.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                  <Coffee className="h-5 w-5" aria-hidden /> Buy me a coffee
                </a>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="justify-self-center w-full max-w-[520px]">
              <SvgAnimation
                src="/animations/developer-support.svg"
                alt="Friendly, developer-first support"
                className="w-full"
                fallbackIcon={UserCheck}
                fallbackSize="120px"
              />
              <p className="mt-4 text-sm text-muted-foreground text-center">Friendly, developer‑first support</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Send feedback</CardTitle>
            <CardDescription>We read every message.</CardDescription>
          </CardHeader>
          <CardContent>
            {status && (
              <Alert className={status.ok ? 'border-emerald-600/30 bg-emerald-500/5' : 'border-destructive bg-destructive/5'} aria-live="polite">
                <AlertTitle>{status.ok ? 'Thanks!' : 'Oops'}</AlertTitle>
                <AlertDescription>{status.msg}</AlertDescription>
              </Alert>
            )}
            <form className="mt-4 grid gap-4" onSubmit={onSubmit} noValidate>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={name} onChange={(e)=>setName(e.target.value)} autoComplete="name" required aria-invalid={name.trim().length<=1} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" required aria-invalid={!emailValid} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" value={message} onChange={(e)=>setMessage(e.target.value)} rows={6} required aria-invalid={message.trim().length<=4} />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!canSubmit || submitting} aria-busy={submitting}>
                  {submitting ? 'Sending…' : 'Send message'}
                </Button>
                <Button variant="ghost" type="button" onClick={()=>{setName('');setEmail('');setMessage('');setStatus(null)}}>Reset</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
