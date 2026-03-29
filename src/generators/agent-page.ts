import type { AgentConfig } from '../types.js'
import { read, render } from '../utils/template.js'

function deriveApiPath(outputPath: string): string {
  return '/' + outputPath
    .replace(/^src\//, '')
    .replace(/^app\//, '')
    .replace(/\/route\.tsx?$/, '')
}

export function generateAgentPage(config: AgentConfig): string {
  let t = read('agent-page.tsx')
  t = render(t, {
    __PATH_ALIAS__: config.pathAlias,
    __API_PATH__: deriveApiPath(config.paths.apiRoute),
  })
  return t
}
