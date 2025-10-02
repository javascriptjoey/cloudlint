import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cloud, Shield, GitCompare } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="px-0">
      <Seo
        title="About Cloudlint • Provider‑aware YAML validation & automation"
        description="Cloudlint delivers universal YAML validation, smart auto‑fixes, schema checks, diffs, and a security‑first design. Built for speed with CLI, SDK, and REST."
        canonical="https://cloudlint.local/about"
        ogTitle="About Cloudlint"
        ogDescription="Validate YAML for AWS/Azure/generic, auto‑fix safely, preview diffs, and automate with CLI/SDK/REST."
      />

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
              <Button asChild><Link to="/playground">Try the Playground</Link></Button>
              <Button variant="secondary" asChild><Link to="/contact">Contact</Link></Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="justify-self-center w-full max-w-[520px]">
              <div className="flex h-[300px] w-full items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Shield className="h-16 w-16 text-muted-foreground/60" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Security Illustration</p>
                    <p className="text-xs text-muted-foreground/70">Coming Soon</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">Provider‑aware YAML Intelligence</p>
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
              <Cloud aria-hidden className="h-6 w-6 text-primary" />
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
              <GitCompare aria-hidden className="h-6 w-6 text-blue-600" />
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
              <Shield aria-hidden className="h-6 w-6 text-emerald-600" />
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
              <Button asChild><Link to="/playground">Open Playground</Link></Button>
              <Button variant="secondary" asChild><Link to="/contact">Talk to us</Link></Button>
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
