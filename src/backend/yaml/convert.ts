import YAML from 'yaml'

export function yamlToJson(yamlContent: string): string {
  const parsed = YAML.parse(yamlContent)
  return JSON.stringify(parsed, null, 2)
}

export function jsonToYaml(jsonContent: string): string {
  const obj = JSON.parse(jsonContent)
  return YAML.stringify(obj)
}