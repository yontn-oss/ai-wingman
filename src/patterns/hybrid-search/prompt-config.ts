import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { HybridSearchConfig, SharedConfig } from '../../types.js'

interface AddHybridSearchOptions {
  apiRoute?: string
  embeddingModel?: string
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

function defaultEmbeddingModel(providerId: string): string {
  if (providerId === 'openai') return 'text-embedding-3-small'
  if (providerId === 'google') return 'embedding-001'
  return 'voyage-3'
}

export async function promptHybridSearchConfig(
  shared: SharedConfig,
  opts: AddHybridSearchOptions = {}
): Promise<HybridSearchConfig> {
  const { pathAlias, hasSrcDir, targetDir } = shared
  const src = hasSrcDir ? 'src/' : ''

  const apiRouteResult = await promptPath(
    'API route output path',
    `${src}app/api/hybrid-search/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const bm25Result = await promptPath(
    'BM25 scorer output path',
    `${src}lib/rag/bm25.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const rerankerResult = await promptPath(
    'Reranker output path',
    `${src}lib/rag/reranker.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const storeResult = await promptPath(
    'Hybrid store output path',
    `${src}lib/rag/hybrid-store.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  let embeddingModel = defaultEmbeddingModel(shared.provider.id)
  if (opts.embeddingModel) {
    embeddingModel = opts.embeddingModel
  } else if (!opts.yes) {
    const input = await clack.text({
      message: 'Embedding model ID?',
      initialValue: embeddingModel,
    })
    if (clack.isCancel(input)) { clack.cancel('Cancelled.'); process.exit(0) }
    embeddingModel = String(input).trim() || embeddingModel
  }

  let auth = false
  if (opts.auth !== undefined) {
    auth = opts.auth
  } else if (!opts.yes) {
    const wantsAuth = await clack.confirm({
      message: 'Add NextAuth v5 authentication?',
      initialValue: false,
    })
    if (clack.isCancel(wantsAuth)) { clack.cancel('Cancelled.'); process.exit(0) }
    auth = wantsAuth === true
  }

  return {
    embeddingModel,
    auth,
    paths: {
      apiRoute: apiRouteResult.value,
      bm25: bm25Result.value,
      reranker: rerankerResult.value,
      hybridStore: storeResult.value,
    },
    pathOverwrites: {
      ...(apiRouteResult.overwrite && { apiRoute: true }),
      ...(bm25Result.overwrite && { bm25: true }),
      ...(rerankerResult.overwrite && { reranker: true }),
      ...(storeResult.overwrite && { hybridStore: true }),
    },
    provider: shared.provider,
    pathAlias,
    targetDir,
  }
}
