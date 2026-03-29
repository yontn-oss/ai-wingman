import { read } from '../utils/template.js'

export function generateHybridSearchBm25(): string {
  return read('hybrid-search-bm25.ts')
}
