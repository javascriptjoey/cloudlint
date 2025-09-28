import fs from 'node:fs'

export type AzureSchema = {
  allowedRootKeys: string[]
  knownStepKeys: string[]
}

// Minimal embedded fallback schema capturing common Azure Pipelines structure for tests and basic validation
const fallbackAzureSchema: AzureSchema = {
  allowedRootKeys: [
    'name', 'trigger', 'pr', 'pool', 'variables', 'steps', 'jobs', 'stages',
    'resources', 'schedules', 'extends', 'parameters'
  ],
  knownStepKeys: [
    'script', 'bash', 'powershell', 'pwsh', 'task', 'checkout',
    'download', 'publish', 'publishPipelineArtifact', 'downloadPipelineArtifact'
  ],
}

export function loadAzureSchema(): AzureSchema {
  const p = process.env.AZURE_PIPELINES_SCHEMA_PATH
  if (p && fs.existsSync(p)) {
    try {
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
      // Attempt to map the JSON schema into our simplified structure.
      // If mapping fails, fall back to embedded schema to keep behavior predictable.
      const allowedRoot: string[] = Array.isArray(raw?.properties) ? Object.keys(raw.properties) : Object.keys(raw?.properties ?? {})
      // Derive known step keys from schema if present
      const stepsProps = raw?.definitions?.steps?.items?.oneOf || raw?.definitions?.step?.oneOf
      let stepKeys: string[] = []
      if (Array.isArray(stepsProps)) {
        for (const v of stepsProps) {
          if (v?.properties) {
            const keys = Object.keys(v.properties)
            // Step variants usually look like { script: string }, { bash: string }, { task: ... }, etc.
            for (const k of keys) stepKeys.push(k)
          }
        }
      }
      stepKeys = Array.from(new Set(stepKeys)).filter(Boolean)
      if (allowedRoot.length || stepKeys.length) {
        return {
          allowedRootKeys: allowedRoot.length ? allowedRoot : fallbackAzureSchema.allowedRootKeys,
          knownStepKeys: stepKeys.length ? stepKeys : fallbackAzureSchema.knownStepKeys,
        }
      }
    } catch {
      // ignore and fall through
    }
  }
  return fallbackAzureSchema
}
