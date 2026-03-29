import type { RagPatternConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'

export function generateRagStore(config: RagPatternConfig): string {
  const memoryImportPath = toImportPath(config.paths.memoryStore, config.pathAlias)
  const pgvectorImportPath = config.paths.pgvectorStore
    ? toImportPath(config.paths.pgvectorStore, config.pathAlias)
    : null
  const sqliteImportPath = config.paths.sqliteStore
    ? toImportPath(config.paths.sqliteStore, config.pathAlias)
    : null

  if (pgvectorImportPath) {
    let t = read('rag-store-pgvector.ts')
    t = render(t, {
      __MEMORY_IMPORT_PATH__: memoryImportPath,
      __PGVECTOR_IMPORT_PATH__: pgvectorImportPath,
    })
    return t
  }

  if (sqliteImportPath) {
    let t = read('rag-store-sqlite.ts')
    t = render(t, {
      __MEMORY_IMPORT_PATH__: memoryImportPath,
      __SQLITE_IMPORT_PATH__: sqliteImportPath,
    })
    return t
  }

  let t = read('rag-store.ts')
  t = render(t, {
    __MEMORY_IMPORT_PATH__: memoryImportPath,
  })
  return t
}
