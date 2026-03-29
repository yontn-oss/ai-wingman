import { read } from '../utils/template.js'

// Config-invariant — tool definitions are the same regardless of provider/paths.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateInterruptTools(_config: unknown): string {
  return read('interrupt-tools.ts')
}
