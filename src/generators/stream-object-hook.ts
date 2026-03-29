import type { StreamObjectConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'

function toTypeName(schemaName: string): string {
  return schemaName.charAt(0).toUpperCase() + schemaName.slice(1)
}

export function generateStreamObjectHook(config: StreamObjectConfig): string {
  const schemaVarName = `${config.schemaName}Schema`
  const typeName = toTypeName(config.schemaName)
  const hookName = `use${typeName}Stream`
  const schemaImportPath = toImportPath(config.paths.schema, config.pathAlias)

  // Derive API path from config.paths.apiRoute
  const routePath = config.paths.apiRoute
    .replace(/^src\//, '')
    .replace(/^app\//, '')
    .replace(/\/route\.tsx?$/, '')
  const apiPath = '/' + routePath

  let t = read('stream-object-hook.ts')
  t = render(t, {
    __SCHEMA_VAR_NAME__: schemaVarName,
    __SCHEMA_IMPORT_PATH__: schemaImportPath,
    __HOOK_NAME__: hookName,
    __API_PATH__: apiPath,
  })
  return t
}
