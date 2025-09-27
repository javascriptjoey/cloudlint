import { spawn } from 'node:child_process'
import type { ToolRunner } from './types'

export const defaultToolRunner: ToolRunner = {
  run(cmd, args, opts = {}) {
    return new Promise((resolve) => {
      const child = spawn(cmd, args, {
        cwd: opts.cwd,
        shell: process.platform === 'win32',
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      if (opts.input) {
        child.stdin.write(opts.input)
        child.stdin.end()
      }

      child.stdout.on('data', (d) => (stdout += String(d)))
      child.stderr.on('data', (d) => (stderr += String(d)))

      const timeout = opts.timeoutMs ?? 10000
      const timer = setTimeout(() => {
        try { child.kill() } catch (err) { /* noop: process may have already exited */ void err }
      }, timeout)

      child.on('close', (code) => {
        clearTimeout(timer)
        resolve({ code: code ?? 0, stdout, stderr })
      })
    })
  },
}
