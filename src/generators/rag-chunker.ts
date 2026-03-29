import type { RagPatternConfig } from '../types.js'
import { read, render } from '../utils/template.js'

export function generateRagChunker(config: RagPatternConfig): string {
  let t = read('rag-chunker.ts')
  t = render(t, {
    __CHUNK_SIZE__: String(config.chunkSize),
  })
  return t
}
