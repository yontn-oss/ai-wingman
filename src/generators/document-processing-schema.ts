import { read, render } from '../utils/template.js'

export function generateDocumentProcessingSchema(schemaName: string): string {
  const schemaVarName = `${schemaName}Schema`
  const typeName = schemaName.charAt(0).toUpperCase() + schemaName.slice(1)
  let t = read('document-processing-schema.ts')
  t = render(t, {
    __SCHEMA_VAR_NAME__: schemaVarName,
    __TYPE_NAME__: typeName,
  })
  return t
}
