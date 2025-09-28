import YAML from 'yaml'

export type YamlProvider = 'aws' | 'azure' | 'generic'

export function isLikelyCloudFormation(yamlContent: string): boolean {
  try {
    const doc = YAML.parse(yamlContent)
    if (!doc || typeof doc !== 'object') return false
    if (doc.AWSTemplateFormatVersion) return true
    if (doc.Resources && typeof doc.Resources === 'object') return true
    return false
  } catch {
    return false
  }
}

export function isLikelyAzurePipelines(yamlContent: string): boolean {
  try {
    const doc = YAML.parse(yamlContent)
    if (!doc || typeof doc !== 'object') return false
    // Heuristics: presence of typical Azure Pipelines keys and absence of clear CFN markers
    const azureKeys = ['steps','jobs','stages','pool','trigger','pr','variables']
    const hasAzureish = azureKeys.some(k => k in doc)
    const hasCFN = !!(doc.AWSTemplateFormatVersion || doc.Resources)
    return hasAzureish && !hasCFN
  } catch {
    return false
  }
}

export function detectProvider(yamlContent: string, forced?: YamlProvider): YamlProvider {
  if (forced) return forced
  if (isLikelyCloudFormation(yamlContent)) return 'aws'
  if (isLikelyAzurePipelines(yamlContent)) return 'azure'
  return 'generic'
}
