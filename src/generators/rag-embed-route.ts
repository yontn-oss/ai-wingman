import type { RagPatternConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { embeddingCallExpr } from '../utils/provider-call-expr.js'
import { injectAuth } from './stubs.js'

export function generateRagEmbedRoute(config: RagPatternConfig): string {
  const hasChunker = config.paths.chunker !== undefined
  const templateName = hasChunker ? 'rag-embed-route-chunked.ts' : 'rag-embed-route.ts'

  let t = read(templateName)
  const vars: Record<string, string> = {
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __EMBEDDING_CALL_EXPR__: embeddingCallExpr(config.provider, config.embeddingModel),
    __STORE_IMPORT_PATH__: toImportPath(config.paths.store, config.pathAlias),
  }
  if (hasChunker) {
    vars.__CHUNKER_IMPORT_PATH__ = toImportPath(config.paths.chunker!, config.pathAlias)
  }
  t = render(t, vars)
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
