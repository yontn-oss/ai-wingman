import type { RagPatternConfig } from '../types.js'
import { read } from '../utils/template.js'

// Config-invariant — the SQL is the same regardless of config.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateRagSchemaSql(_config: RagPatternConfig): string {
  return read('rag-schema-sql.sql')
}
