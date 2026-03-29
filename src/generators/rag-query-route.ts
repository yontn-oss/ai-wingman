import type { RagPatternConfig } from '../types.js'
import { read, render, inject } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { embeddingCallExpr } from '../utils/provider-call-expr.js'
import { authStub } from './stubs.js'

export function generateRagQueryRoute(config: RagPatternConfig): string {
  const templateName = config.stream ? 'rag-query-route-streaming.ts' : 'rag-query-route.ts'
  let t = read(templateName)
  t = render(t, {
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
    __EMBEDDING_CALL_EXPR__: embeddingCallExpr(config.provider, config.embeddingModel),
    __STORE_IMPORT_PATH__: toImportPath(config.paths.store, config.pathAlias),
  })
  t = inject(t, 'AUTH_IMPORT', config.auth ? `import { auth } from '${config.pathAlias}auth'` : '')
  t = inject(t, 'AUTH_CHECK', config.auth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })`
    : authStub(config.pathAlias)
  )
  return t
}
