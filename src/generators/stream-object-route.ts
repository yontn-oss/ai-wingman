import type { StreamObjectConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { injectAuth } from './stubs.js'

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
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
