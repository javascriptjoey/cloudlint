import YAML from 'yaml'
import type { LintMessage } from './types'
import { loadAzureSchema } from './azureSpec'

export type Suggestion = {
  path: string
  message: string
  kind: 'add' | 'rename' | 'type'
  fix?: (doc: unknown) => void
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

function bestGuess(target: string, candidates: string[]): string | undefined {
  const t = target.toLowerCase()
  return candidates
    .map(c => [c, levenshtein(c.toLowerCase(), t)] as const)
    .sort((a,b)=>a[1]-b[1])[0]?.[0]
}

function isArray(x: unknown): x is unknown[] { return Array.isArray(x) }
function isObject(x: unknown): x is Record<string, unknown> { return !!x && typeof x === 'object' && !Array.isArray(x) }

type AzureStep = Record<string, unknown>
type AzureJob = { steps?: AzureStep[] } & Record<string, unknown>
type AzureDoc = { steps?: AzureStep[]; jobs?: AzureJob[] } & Record<string, unknown>

export function analyze(doc: unknown): { suggestions: Suggestion[]; messages: LintMessage[] } {
  const schema = loadAzureSchema()
  const suggestions: Suggestion[] = []
  const messages: LintMessage[] = []

  if (!doc || typeof doc !== 'object') return { suggestions, messages }

  // Unknown top-level keys (warn) + rename suggestions
  for (const k of Object.keys(doc as Record<string, unknown>)) {
    if (!schema.allowedRootKeys.includes(k)) {
      const guess = bestGuess(k, schema.allowedRootKeys)
      if (guess) {
        suggestions.push({
          path: k,
          message: `Unknown root key ${k}. Did you mean ${guess}?`,
          kind: 'rename',
          fix: (root: unknown) => {
            const obj = root as Record<string, unknown>
            const v = obj[k as keyof typeof obj]
            delete obj[k as keyof typeof obj]
            ;(obj as Record<string, unknown>)[guess] = v
          },
        })
        messages.push({ source: 'azure-schema', severity: 'warning', message: `Unknown root key ${k} (suggest: ${guess})`, path: k })
      } else {
        messages.push({ source: 'azure-schema', severity: 'warning', message: `Unknown root key ${k}`, path: k })
      }
    }
  }

  // Validate top-level steps/jobs if present
  const steps = (doc as AzureDoc).steps
  const jobs = (doc as AzureDoc).jobs

  if (steps !== undefined && !isArray(steps)) {
    suggestions.push({ path: 'steps', message: 'steps should be an array', kind: 'type' })
    messages.push({ source: 'azure-schema', severity: 'warning', message: 'steps should be an array', path: 'steps' })
  }
  if (jobs !== undefined && !isArray(jobs)) {
    suggestions.push({ path: 'jobs', message: 'jobs should be an array', kind: 'type' })
    messages.push({ source: 'azure-schema', severity: 'warning', message: 'jobs should be an array', path: 'jobs' })
  }

  const checkStepArray = (arr: AzureStep[], ptr: string) => {
    for (let i = 0; i < arr.length; i++) {
      const step = arr[i]
      if (!isObject(step)) {
        suggestions.push({ path: `${ptr}[${i}]`, message: 'step should be an object', kind: 'type' })
        continue
        }
      const keys = Object.keys(step)
      if (!keys.length) {
        suggestions.push({ path: `${ptr}[${i}]`, message: 'empty step - add a step key like script/task', kind: 'add' })
        continue
      }
      // Azure steps are discriminator-style: exactly one of known step keys typically appears
      const present = keys.filter(k => schema.knownStepKeys.includes(k))
      if (present.length === 0) {
        // Try to guess from unknown singular key
        if (keys.length === 1) {
          const k = keys[0]
          const guess = bestGuess(k, schema.knownStepKeys)
          if (guess) {
            suggestions.push({
              path: `${ptr}[${i}].${k}`,
              message: `Unknown step key ${k}. Did you mean ${guess}?`,
              kind: 'rename',
              fix: (root: unknown) => {
                const r = root as AzureDoc
                if (ptr === 'steps' && Array.isArray(r.steps)) {
                  const val = (r.steps[i] as Record<string, unknown>)[k]
                  delete (r.steps[i] as Record<string, unknown>)[k]
                  ;(r.steps[i] as Record<string, unknown>)[guess] = val
                } else {
                  const m = ptr.match(/^jobs\[(\d+)\]\.steps$/)
                  if (m && r.jobs && r.jobs[Number(m[1])]?.steps) {
                    const j = Number(m[1])
                    const stepObj = (r.jobs[j].steps as AzureStep[])[i] as Record<string, unknown>
                    const val = stepObj[k]
                    delete stepObj[k]
                    stepObj[guess] = val
                  }
                }
              },
            })
            messages.push({ source: 'azure-schema', severity: 'warning', message: `Unknown step key ${k} (suggest: ${guess})`, path: `${ptr}[${i}].${k}` })
          } else {
            messages.push({ source: 'azure-schema', severity: 'warning', message: `Unknown step key ${k}`, path: `${ptr}[${i}].${k}` })
          }
        } else {
          messages.push({ source: 'azure-schema', severity: 'warning', message: 'No known step discriminator found', path: `${ptr}[${i}]` })
        }
      } else {
        // Type checks for common step kinds
        const k = present[0]
        const v = (step as Record<string, unknown>)[k]
        if ((k === 'script' || k === 'bash' || k === 'powershell' || k === 'pwsh') && typeof v !== 'string') {
          suggestions.push({ path: `${ptr}[${i}].${k}`, message: `${k} should be a string`, kind: 'type' })
          messages.push({ source: 'azure-schema', severity: 'warning', message: `${k} should be a string`, path: `${ptr}[${i}].${k}` })
        }
        if (k === 'task') {
          if (typeof v !== 'string') {
            suggestions.push({ path: `${ptr}[${i}].task`, message: 'task should be a string identifier like AzureCLI@2', kind: 'type' })
            messages.push({ source: 'azure-schema', severity: 'warning', message: 'task should be a string identifier like AzureCLI@2', path: `${ptr}[${i}].task` })
          }
          // Optional: verify inputs is object if present
          const stepObj = step as Record<string, unknown>
          if ('inputs' in stepObj && !isObject(stepObj.inputs)) {
            suggestions.push({ path: `${ptr}[${i}].inputs`, message: 'inputs should be an object', kind: 'type' })
            messages.push({ source: 'azure-schema', severity: 'warning', message: 'inputs should be an object', path: `${ptr}[${i}].inputs` })
          }
        }
      }
    }
  }

  if (isArray(steps)) checkStepArray(steps as AzureStep[], 'steps')

  if (isArray(jobs)) {
    for (let j = 0; j < (jobs as AzureJob[]).length; j++) {
      const job = (jobs as AzureJob[])[j]
      if (!isObject(job)) {
        suggestions.push({ path: `jobs[${j}]`, message: 'job should be an object', kind: 'type' })
        continue
      }
      // If job has steps, validate them
      if (isArray(job.steps)) {
        checkStepArray(job.steps as AzureStep[], `jobs[${j}].steps`)
      } else if (job.steps !== undefined && !isArray(job.steps)) {
        suggestions.push({ path: `jobs[${j}].steps`, message: 'steps should be an array', kind: 'type' })
      }
      // Suggest adding steps if missing in common job forms
      if (!Array.isArray(job.steps)) {
        suggestions.push({ path: `jobs[${j}].steps`, message: 'Add steps array to job', kind: 'add', fix: (root: unknown) => {
          const r = root as AzureDoc
          if (Array.isArray(r.jobs)) {
            if (!r.jobs[j]) r.jobs[j] = {} as AzureJob
            r.jobs[j].steps = []
          }
        } })
        messages.push({ source: 'azure-schema', severity: 'warning', message: 'Job missing steps array', path: `jobs[${j}].steps` })
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
  const { suggestions } = analyze(doc)
  selected.forEach((idx) => suggestions[idx]?.fix?.(doc))
  const newYaml = YAML.stringify(doc)
  return { content: newYaml }
}
