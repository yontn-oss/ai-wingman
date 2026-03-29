import { read } from '../utils/template.js'

export function generateMemoryStore(): string {
  return read('memory-store.ts')
}
