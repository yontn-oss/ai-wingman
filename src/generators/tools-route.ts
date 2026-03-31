import type { ToolsConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { injectAuth } from './stubs.js'

export function generateToolsRoute(config: ToolsConfig): string {
  const toolsVarName = `${config.toolName}Tools`
  let t = read('tools-route.ts')
  t = render(t, {
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __TOOLS_VAR_NAME__: toolsVarName,
    __TOOLS_IMPORT_PATH__: toImportPath(config.paths.toolsFile, config.pathAlias),
    __MODEL_FACTORY__: config.provider.modelFactory,
  })
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
