import { read } from '../utils/template.js'

export function generateHybridSearchStore(): string {
  return read('hybrid-search-store.ts')
}
