import type { WingmanConfig } from '../types.js'
import { read } from '../utils/template.js'

// Config param accepted for signature consistency — storage is always in-memory for the chat
// pattern. Persistence is a separate concern; replace this with your own DB implementation.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateStorage(_config?: WingmanConfig): string {
  return read('storage.ts')
}
