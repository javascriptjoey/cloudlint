import YAML from 'yaml'
import { loadSpec } from './cfnSpec'
import type { LintMessage } from './types'

export type Suggestion = {
  path: string // YAML path such as Resources.MyRes.Properties
  message: string
  kind: 'add' | 'rename' | 'type'
  fix?: (doc: unknown) => void // applies in-memory fix to the parsed YAML doc
}

function levenshtein(a: string, b: string): number {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) m[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost)
    }
  }
  return m[a.length][b.length]
}

function isPrimitiveOk(val: unknown, t?: string): boolean {
  if (!t) return true
  switch (t) {
    case 'String': return typeof val === 'string'
    case 'Integer':
    case 'Long':
      return Number.isInteger(val as number)
    case 'Double':
      return typeof val === 'number'
    case 'Boolean': return typeof val === 'boolean'
    default: return true
  }
}

type CFNResourceNode = { Type?: string; Properties?: Record<string, unknown> } & Record<string, unknown>
type CFNRoot = { Resources: Record<string, CFNResourceNode> }

export function analyze(doc: unknown): { suggestions: Suggestion[]; messages: LintMessage[] } {
  const spec = loadSpec()
  const suggestions: Suggestion[] = []
  const messages: LintMessage[] = []

  const res = (doc as { Resources?: Record<string, unknown> })?.Resources
  if (!res || typeof res !== 'object') return { suggestions, messages }

  for (const [logicalId, resNode] of Object.entries(res as Record<string, unknown>)) {
    const resDef = resNode as CFNResourceNode
    const type = resDef?.Type
    const props = (resDef?.Properties ?? {}) as Record<string, unknown>
    if (!type || typeof type !== 'string') {
      suggestions.push({
        path: `Resources.${logicalId}.Type`,
        message: `Resource ${logicalId} is missing Type`,
        kind: 'add',
      })
      continue
    }
    const rt = spec.ResourceTypes[type]
    if (!rt) {
      const types = Object.keys(spec.ResourceTypes)
      const guess = types
        .map(t => [t, levenshtein(t.toLowerCase(), String(type).toLowerCase())] as const)
        .sort((a,b)=>a[1]-b[1])[0]?.[0]
      if (guess) {
        suggestions.push({
          path: `Resources.${logicalId}.Type`,
          message: `Unknown resource Type ${type}. Did you mean ${guess}?`,
          kind: 'rename',
          fix: (root: unknown) => {
            (root as CFNRoot).Resources[logicalId].Type = guess
          },
        })
      }
      continue
    }
    const allowed = new Set(['Type','Properties','Metadata','DependsOn','DeletionPolicy','UpdateReplacePolicy','Condition'])
    for (const k of Object.keys(resDef)) {
      if (!allowed.has(k)) {
        messages.push({ source: 'cfn-lint', severity: 'warning', message: `Unexpected field ${k} under resource`, path: `Resources.${logicalId}.${k}` })
      }
    }

    const propSpec = rt.Properties ?? {}
    // Missing required
    for (const [pName, pSpec] of Object.entries(propSpec)) {
      if (pSpec.Required && !(pName in props)) {
        suggestions.push({
          path: `Resources.${logicalId}.Properties.${pName}`,
          message: `Add required property ${pName}`,
          kind: 'add',
          fix: (root: unknown) => {
            const r = root as CFNRoot
            const orig = (r.Resources[logicalId].Properties ?? {}) as Record<string, unknown>
            r.Resources[logicalId].Properties = { ...orig, [pName]: null }
          },
        })
      }
    }
    // Typos / unknown props
    for (const pName of Object.keys(props)) {
      if (!(pName in propSpec)) {
        const candidates = Object.keys(propSpec)
        const guess = candidates.map(c => [c, levenshtein(c.toLowerCase(), pName.toLowerCase())] as const).sort((a,b)=>a[1]-b[1])[0]?.[0]
        if (guess) {
          suggestions.push({
            path: `Resources.${logicalId}.Properties.${pName}`,
            message: `Unknown property ${pName}. Did you mean ${guess}?`,
            kind: 'rename',
            fix: (root: unknown) => {
              const r = root as CFNRoot
              const propsObj = (r.Resources[logicalId].Properties ?? {}) as Record<string, unknown>
              const val = propsObj[pName]
              delete propsObj[pName]
              propsObj[guess] = val
              r.Resources[logicalId].Properties = propsObj
            },
          })
        } else {
          messages.push({ source: 'cfn-lint', severity: 'warning', message: `Unknown property ${pName}`, path: `Resources.${logicalId}.Properties.${pName}` })
        }
      } else {
        // Primitive and container type checks (best-effort)
        const s = (propSpec as Record<string, { PrimitiveType?: string; Type?: string }>)[pName]
        const v = (props as Record<string, unknown>)[pName]
        if (s.PrimitiveType && !isPrimitiveOk(v, s.PrimitiveType)) {
          suggestions.push({
            path: `Resources.${logicalId}.Properties.${pName}`,
            message: `Property ${pName} expects ${s.PrimitiveType}`,
            kind: 'type',
          })
        }
        if (s.Type === 'List' && !Array.isArray(v)) {
          suggestions.push({
            path: `Resources.${logicalId}.Properties.${pName}`,
            message: `Property ${pName} expects a List (array)`,
            kind: 'type',
          })
        }
        if (s.Type === 'Map' && (v === null || typeof v !== 'object' || Array.isArray(v))) {
          suggestions.push({
            path: `Resources.${logicalId}.Properties.${pName}`,
            message: `Property ${pName} expects a Map (object)`,
            kind: 'type',
          })
        }
      }
    }
  }

  return { suggestions, messages }
}

export function applySuggestions(yamlContent: string, selected: number[]): { content: string } {
  const doc = YAML.parse(yamlContent)
  const { suggestions } = analyze(doc)
  selected.forEach((idx) => suggestions[idx]?.fix?.(doc))
  const newYaml = YAML.stringify(doc)
  return { content: newYaml }
}