import type { StreamObjectConfig } from '../types.js'
import { read, render, inject } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { authStub } from './stubs.js'

export function generateStreamObjectRoute(config: StreamObjectConfig): string {
  const schemaVarName = `${config.schemaName}Schema`
  let t = read('stream-object-route.ts')
  t = render(t, {
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
    __SCHEMA_VAR_NAME__: schemaVarName,
    __SCHEMA_IMPORT_PATH__: toImportPath(config.paths.schema, config.pathAlias),
  })
  t = inject(t, 'AUTH_IMPORT', config.auth ? `import { auth } from '${config.pathAlias}auth'` : '')
  t = inject(t, 'AUTH_CHECK', config.auth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })`
    : authStub(config.pathAlias)
  )
  return t
}
