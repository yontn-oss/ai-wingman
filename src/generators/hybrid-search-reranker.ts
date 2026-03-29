import { read } from '../utils/template.js'

export function generateHybridSearchReranker(): string {
  return read('hybrid-search-reranker.ts')
}
