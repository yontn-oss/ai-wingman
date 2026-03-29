import type { RagPatternConfig } from '../types.js'
import { read, render, inject } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { embeddingCallExpr } from '../utils/provider-call-expr.js'
import { authStub } from './stubs.js'

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
  t = inject(t, 'AUTH_IMPORT', config.auth ? `import { auth } from '${config.pathAlias}auth'` : '')
  t = inject(t, 'AUTH_CHECK', config.auth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })`
    : authStub(config.pathAlias)
  )
  return t
}
