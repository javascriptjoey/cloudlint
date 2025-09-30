import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function IconCloud() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className="h-10 w-10 text-primary"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="currentColor" /><stop offset="1" stopColor="currentColor" /></linearGradient></defs><circle cx="32" cy="32" r="28" fill="currentColor" className="opacity-10"/><path d="M20 38c0-7 6-13 14-13s14 6 14 13c-4 0-8 3-14 3s-10-3-14-3z" fill="currentColor"/></svg>
  )
}
function IconShield() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-emerald-600"><path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 18c-3-1-6-4.7-6-9V6.3l6-2.2 6 2.2V11c0 4.3-3 8-6 9Z"/></svg>
  )
}
function IconDiff() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-blue-600"><path fill="currentColor" d="M9 3H5a2 2 0 0 0-2 2v4h2V5h4V3Zm10 10h2v4a2 2 0 0 1-2 2h-4v-2h4v-4Zm0-8a2 2 0 0 1 2 2v4h-2V7h-4V5h4ZM3 13h2v4h4v2H5a2 2 0 0 1-2-2v-4Zm6-2h6v2H9v-2Z"/></svg>
  )
}

export default function About() {
  return (
    <div className="px-0">
      <Helmet>
        <title>About Cloudlint • Provider‑aware YAML validation & automation</title>
        <meta name="description" content="Cloudlint delivers universal YAML validation, smart auto‑fixes, schema checks, diffs, and a security‑first design. Built for speed with CLI, SDK, and REST." />
        <link rel="canonical" href="https://cloudlint.local/about" />
        <meta property="og:title" content="About Cloudlint" />
        <meta property="og:description" content="Validate YAML for AWS/Azure/generic, auto‑fix safely, preview diffs, and automate with CLI/SDK/REST." />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto grid gap-6 px-4 py-12 md:grid-cols-[1.1fr_.9fr] md:items-center">
          <div>
            <Badge className="mb-3">Security‑first • Developer‑friendly</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Ship YAML with confidence.</h1>
            <p className="mt-3 max-w-prose text-muted-foreground md:text-lg">
              Cloudlint validates any YAML—style, structure, and provider specifics—then suggests safe fixes you can preview.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><a href="/">Try the Playground</a></Button>
              <Button variant="secondary" asChild><a href="/contact">Contact</a></Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative rounded-2xl border bg-gradient-to-br from-primary/5 to-cyan-500/5 p-8 shadow-sm">
              <IconCloud />
              <div className="mt-4 text-sm text-muted-foreground">Provider‑aware YAML Intelligence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-semibold md:text-3xl">Everything you need for YAML at scale</h2>
          <p className="mt-2 text-muted-foreground">Fast, accurate, and designed for CI/CD and editor workflows.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <IconCloud />
              <div>
                <CardTitle>Universal validation</CardTitle>
                <CardDescription>AWS CFN, Azure Pipelines, and generic YAML</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Syntax, style, and schema checks with provider detection and flags.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <IconDiff />
              <div>
                <CardTitle>Smart auto‑fix + diffs</CardTitle>
                <CardDescription>Preview before you accept</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Correct typos, normalize formatting, and view unified diffs to understand changes.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <IconShield />
              <div>
                <CardTitle>Security‑first</CardTitle>
                <CardDescription>Privacy‑respecting by default</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Anchors/aliases and dangerous tags blocked unless explicitly allowed. Size/MIME guards, Docker‑isolated tooling.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JSON Schema for any YAML</CardTitle>
              <CardDescription>Flexible validation</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Bring your own schema to validate proprietary formats—no provider lock‑in required.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>YAML ⇄ JSON conversion</CardTitle>
              <CardDescription>Simple, lossless transforms</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Switch representations effortlessly to fit your tooling and review flows.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automate everything</CardTitle>
              <CardDescription>CLI • SDK • REST</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Integrate with CI/CD, IDEs, or custom services. Same engine across interfaces for predictable results.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Developer experience */}
      <section className="border-t bg-muted/30 py-12">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-2 md:items-center">
          <div className="order-2 md:order-1">
            <h3 className="text-xl font-semibold md:text-2xl">Built for speed and clarity</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Instant feedback with clean, actionable messages</li>
              <li>• Keyboard‑friendly UI and WCAG‑aligned semantics</li>
              <li>• Mobile‑ready layout that shines on desktop</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Button asChild><a href="/">Open Playground</a></Button>
              <Button variant="secondary" asChild><a href="/contact">Talk to us</a></Button>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="rounded-xl border p-6 shadow-sm">
              <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
                <div>
                  <div className="mb-1 text-2xl font-semibold text-foreground">YAML</div>
                  <div>Validate</div>
                </div>
                <div>
                  <div className="mb-1 text-2xl font-semibold text-foreground">Fix</div>
                  <div>Preview diff</div>
                </div>
                <div>
                  <div className="mb-1 text-2xl font-semibold text-foreground">Ship</div>
                  <div>Automate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
