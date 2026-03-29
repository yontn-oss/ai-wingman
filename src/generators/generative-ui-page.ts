import type { GenerativeUiConfig } from '../types.js'
import { read, render } from '../utils/template.js'

function deriveApiPath(routeFile: string): string {
  return (
    '/' +
    routeFile
      .replace(/^src\//, '')
      .replace(/^app\//, '')
      .replace(/\/route\.tsx?$/, '')
  )
}

export function generateGenerativeUiPage(config: GenerativeUiConfig): string {
  let t = read('generative-ui-page.tsx')
  t = render(t, {
    __PATH_ALIAS__: config.pathAlias,
    __API_PATH__: deriveApiPath(config.paths.apiRoute),
  })
  return t
}
