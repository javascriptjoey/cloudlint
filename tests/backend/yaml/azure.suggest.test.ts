import { describe, it, expect } from 'vitest'
import { analyze, applySuggestions } from '@/backend/yaml/azureSuggest'

const badAzure = `name: test
steps:
  - scirpt: echo "hi"
  - task: 123
`

describe('Azure suggestions', () => {
  it('suggests rename for step typos and type fixes', () => {
    const doc = require('yaml').parse(badAzure)
    const { suggestions } = analyze(doc)
    // Should have a rename suggestion for scirpt->script
    const renameIdxs = suggestions.map((s: any, i: number) => s.kind === 'rename' ? i : -1).filter((i: number) => i >= 0)
    expect(renameIdxs.length).toBeGreaterThan(0)
    // Should also include type suggestion for task numeric value
    expect(suggestions.some((s: any) => s.kind === 'type' && String(s.path).includes('task'))).toBe(true)

    const { content } = applySuggestions(badAzure, renameIdxs)
    expect(content).toContain('script:')
  })

  it('adds steps under job if missing', () => {
    const yaml = `jobs:\n  - job: build\n`
    const doc = require('yaml').parse(yaml)
    const { suggestions } = analyze(doc)
    const addIdx = suggestions.findIndex((s: any) => s.kind === 'add' && String(s.path).includes('jobs[0].steps'))
    expect(addIdx).toBeGreaterThanOrEqual(0)
  })
})
