import YAML from 'yaml'

function clampTimeout(ms: number) {
  if (!Number.isFinite(ms)) return 5000
  return Math.max(1, Math.min(10_000, Math.floor(ms)))
}

export async function parseWithTimeout(content: string, opts?: { timeoutMs?: number }) {
  const envMs = Number(process.env.YAML_PARSE_TIMEOUT_MS ?? '')
  const timeoutMs = clampTimeout(opts?.timeoutMs ?? (Number.isFinite(envMs) ? envMs : 5000))
  const simulateDelayMs = Number(process.env.YAML_PARSE_SIMULATE_DELAY_MS ?? '0')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    if (simulateDelayMs > 0) {
      await new Promise((r) => setTimeout(r, simulateDelayMs))
    }
    if (controller.signal.aborted) {
      throw new Error(`parse_timeout_${timeoutMs}ms`)
    }
    // Safe parse options
    YAML.parse(content, { version: '1.2', schema: 'core', uniqueKeys: true })
  } finally {
    clearTimeout(timer)
  }
  if (controller.signal.aborted) {
    throw new Error(`parse_timeout_${timeoutMs}ms`)
  }
}