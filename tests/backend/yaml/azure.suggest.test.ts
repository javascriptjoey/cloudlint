import { describe, it, expect } from 'vitest'
import { analyze, applySuggestions } from '@/backend/yaml/azureSuggest'
import YAML from 'yaml'

const badAzure = `name: test
steps:
  - scirpt: echo "hi"
  - task: 123
`

describe('Azure suggestions', () => {
  it('suggests rename for step typos and type fixes', () => {
    const doc = YAML.parse(badAzure)
    const { suggestions } = analyze(doc)
    // Should have a rename suggestion for scirpt->script
    const renameIdxs = suggestions.map((s, i) => s.kind === 'rename' ? i : -1).filter((i) => i >= 0)
    expect(renameIdxs.length).toBeGreaterThan(0)
    // confidence present for at least one rename
    expect(suggestions.some(s => s.kind === 'rename' && typeof s.confidence === 'number' && s.confidence > 0)).toBe(true)
    // Should also include type suggestion for task numeric value
    expect(suggestions.some((s) => s.kind === 'type' && String(s.path).includes('task'))).toBe(true)

    const { content } = applySuggestions(badAzure, renameIdxs)
    expect(content).toContain('script:')
  })

  it('adds steps under job if missing', () => {
    const yaml = `jobs:\n  - job: build\n`
    const doc = YAML.parse(yaml)
    const { suggestions } = analyze(doc)
    const addIdx = suggestions.findIndex((s) => s.kind === 'add' && String(s.path).includes('jobs[0].steps'))
    expect(addIdx).toBeGreaterThanOrEqual(0)
  })

  it('validates stages structure and nested steps', () => {
    const yaml = `stages:\n  - stage: Build\n    jobs:\n      - job: build\n        steps:\n          - scirpt: echo hi\n`
    const doc = YAML.parse(yaml)
    const { suggestions } = analyze(doc)
    // Should suggest rename for scirpt within nested stage/job/steps
    const hasRename = suggestions.some(s => s.kind === 'rename' && String(s.path).includes('stages[0].jobs[0].steps[0].scirpt'))
    expect(hasRename).toBe(true)
  })

  it('types checks task.inputs as object within nested jobs', () => {
    const yaml = `stages:\n  - stage: Build\n    jobs:\n      - job: build\n        steps:\n          - task: AzureCLI@2\n            inputs: 'not-an-object'\n`
    const { suggestions } = analyze(YAML.parse(yaml))
    expect(suggestions.some(s => s.kind === 'type' && String(s.path).includes('stages[0].jobs[0].steps[0].inputs'))).toBe(true)
  })

  it('types checks stages to be an array', () => {
    const yaml = `stages: {}`
    const { suggestions } = analyze(YAML.parse(yaml))
    expect(suggestions.some(s => s.kind === 'type' && s.path === 'stages')).toBe(true)
  })
})
