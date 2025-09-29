import { createTwoFilesPatch } from 'diff'

export function unifiedDiff(before: string, after: string, filename = 'file.yaml'): string {
  return createTwoFilesPatch(`${filename} (before)`, `${filename} (after)`, before, after, '', '')
}