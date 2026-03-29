import type { RagPatternConfig } from '../types.js'
import { read } from '../utils/template.js'

// Config param is accepted for signature consistency but this generator is config-invariant.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateRagMemoryStore(_config: RagPatternConfig): string {
  return read('rag-memory-store.ts')
}
