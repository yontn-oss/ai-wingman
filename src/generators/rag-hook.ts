import type { RagPatternConfig } from '../types.js'
import { read, render } from '../utils/template.js'

export function generateRagHook(config: RagPatternConfig): string {
  // Derive query API path from queryRoute
  const apiPath = '/' + config.paths.queryRoute
    .replace(/^src\//, '')
    .replace(/^app\//, '')
    .replace(/\/route\.tsx?$/, '')

  const templateName = config.stream ? 'rag-hook-streaming.ts' : 'rag-hook.ts'
  let t = read(templateName)
  t = render(t, {
    __API_PATH__: apiPath,
  })
  return t
}
