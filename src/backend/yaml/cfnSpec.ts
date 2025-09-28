import fs from 'node:fs'

export type CFNPropertySpec = {
  Required?: boolean
  PrimitiveType?: 'String' | 'Integer' | 'Boolean' | 'Double' | 'Long'
  Type?: 'List' | 'Map' | string
}

export type CFNResourceTypeSpec = {
  Properties?: Record<string, CFNPropertySpec>
}

export type CFNSpec = {
  ResourceTypes: Record<string, CFNResourceTypeSpec>
}

// Minimal embedded fallback spec (kept tiny for tests). Users should set CFN_SPEC_PATH to official JSON.
const fallbackSpec: CFNSpec = {
  ResourceTypes: {
    'AWS::S3::Bucket': {
      Properties: {
        BucketName: { Required: false, PrimitiveType: 'String' },
        Tags: { Type: 'List' },
      },
    },
    'AWS::SNS::Topic': {
      Properties: {
        TopicName: { Required: false, PrimitiveType: 'String' },
      },
    },
  },
}

export function loadSpec(): CFNSpec {
  const p = process.env.CFN_SPEC_PATH
  if (p && fs.existsSync(p)) {
    try {
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
      if (raw.ResourceTypes) return raw as CFNSpec
    } catch {
      // fall through to fallback
    }
  }
  return fallbackSpec
}