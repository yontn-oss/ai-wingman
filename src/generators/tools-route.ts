import type { ToolsConfig } from '../types.js'
import { read, render, inject } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { authStub } from './stubs.js'

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
  t = inject(t, 'AUTH_IMPORT', config.auth ? `import { auth } from '${config.pathAlias}auth'` : '')
  t = inject(t, 'AUTH_CHECK', config.auth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })`
    : authStub(config.pathAlias)
  )
  return t
}
