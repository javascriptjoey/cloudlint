import Ajv, { type ErrorObject } from 'ajv'
import YAML from 'yaml'

export type SchemaValidationIssue = {
  instancePath?: string
  message?: string
  keyword?: string
}

export type SchemaValidationResult = {
  ok: boolean
  errors?: SchemaValidationIssue[]
}

export function schemaValidateYaml(yamlContent: string, schema: unknown): SchemaValidationResult {
  let data: unknown
  try {
    data = YAML.parse(yamlContent)
  } catch (e) {
    return { ok: false, errors: [{ message: e instanceof Error ? e.message : String(e), keyword: 'parse' }] }
  }
  const ajv = new Ajv({ allErrors: true, strict: false })
  let validateFn
  try {
    validateFn = ajv.compile(schema as any)
  } catch (e) {
    return { ok: false, errors: [{ message: e instanceof Error ? e.message : String(e), keyword: 'schema-compile' }] }
  }
  const valid = validateFn(data)
  if (valid) return { ok: true }
  const errs = (validateFn.errors || []).map((e: ErrorObject) => ({ instancePath: e.instancePath, message: e.message, keyword: e.keyword }))
  return { ok: false, errors: errs }
}