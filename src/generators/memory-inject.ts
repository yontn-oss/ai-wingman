import type { MemoryConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { embeddingCallExpr } from '../utils/provider-call-expr.js'

export function generateMemoryInject(config: MemoryConfig): string {
  let t = read('memory-inject.ts')
  t = render(t, {
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __EMBEDDING_CALL_EXPR__: embeddingCallExpr(config.provider, config.embeddingModel),
    __STORE_IMPORT_PATH__: toImportPath(config.paths.store, config.pathAlias),
  })
  return t
}
