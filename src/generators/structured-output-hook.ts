import type { StructuredOutputConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'

function toApiUrl(routePath: string): string {
  return (
    '/' +
    routePath
      .replace(/^src\//, '')
      .replace(/^app\//, '')
      .replace(/\/route\.tsx?$/, '')
  )
}

export function generateStructuredOutputHook(config: StructuredOutputConfig): string {
  const typeName = config.schemaName.charAt(0).toUpperCase() + config.schemaName.slice(1)
  const hookName = `use${typeName}`
  let t = read('structured-output-hook.ts')
  t = render(t, {
    __TYPE_NAME__: typeName,
    __SCHEMA_IMPORT_PATH__: toImportPath(config.paths.schema, config.pathAlias),
    __HOOK_NAME__: hookName,
    __API_URL__: toApiUrl(config.paths.apiRoute),
  })
  return t
}
