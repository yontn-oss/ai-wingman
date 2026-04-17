import type { McpAppConfig } from '../types.js'
import { read, render, inject } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { injectAuth } from './stubs.js'

export function generateMcpAppRoute(config: McpAppConfig): string {
  let t = read('mcp-app-route.ts')

  t = render(t, {
    __APP_NAME_PASCAL__: config.appNamePascal,
    __RESOURCE_URI__: `ui://${config.appName}`,
    __UI_BUNDLE_PATH__: config.paths.uiBundle,
    __TOOL_NAME__: `${config.appNameSnake}_tool`,
  })

  // State import — only present when includeState is true
  const stateImport = config.includeState && config.paths.state
    ? `import { getState, setState } from '${toImportPath(config.paths.state, config.pathAlias)}'`
    : ''
  t = inject(t, 'STATE_IMPORT', stateImport)

  // Tool body — read+write state when included, or a TODO stub
  const toolBody = config.includeState
    ? `      const previous = getState<string>('last-input')\n      setState('last-input', input)`
    : '      // TODO: add your own state'
  t = inject(t, 'TOOL_BODY', toolBody)

  t = injectAuth(t, config.auth, config.pathAlias)

  return t
}
