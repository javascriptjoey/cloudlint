import YAML from 'yaml'

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