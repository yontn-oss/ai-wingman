import type { InterruptPatternConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'

export function generateInterruptPage(config: InterruptPatternConfig): string {
  if (!config.includePage) return ''

  const apiPath = '/' + config.paths.apiRoute
    .replace(/^src\//, '')
    .replace(/^app\//, '')
    .replace(/\/route\.tsx?$/, '')

  let t = read('interrupt-page.tsx')
  t = render(t, {
    __WIDGET_IMPORT_PATH__: toImportPath(config.paths.component, config.pathAlias),
    __API_PATH__: apiPath,
  })
  return t
}
