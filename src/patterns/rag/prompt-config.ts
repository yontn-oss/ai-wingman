import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { RagPatternConfig, RagStorage, SharedConfig } from '../../types.js'

interface AddRagOptions {
  storage?: string
  embeddingModel?: string
  chunkSize?: number
  stream?: boolean
  embedRoute?: string
  queryRoute?: string
  storePath?: string
  memoryStorePath?: string
  pgvectorStorePath?: string
  sqliteStorePath?: string
  schemaSqlPath?: string
  chunkerPath?: string
  hookPath?: string
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

function defaultEmbeddingModel(providerId: string): string {
  if (providerId === 'openai') return 'text-embedding-3-small'
  if (providerId === 'google') return 'embedding-001'
  if (providerId === 'anthropic') return 'voyage-3'
  return 'text-embedding-3-small'
}

export async function promptRagConfig(
  shared: SharedConfig,
  opts: AddRagOptions = {}
): Promise<RagPatternConfig> {
  const { pathAlias, hasSrcDir, targetDir, provider } = shared
  const src = hasSrcDir ? 'src/' : ''

  // Storage backend
  let storage: RagStorage = 'memory'
  if (opts.storage === 'pgvector') {
    storage = 'pgvector'
  } else if (opts.storage === 'sqlite') {
    storage = 'sqlite'
  } else if (!opts.yes && !opts.storage) {
    const selected = await clack.select({
      message: 'RAG storage backend?',
      options: [
        { value: 'memory', label: 'In-memory', hint: 'great for development' },
        { value: 'sqlite', label: 'SQLite + sqlite-vec', hint: 'zero infrastructure, file-based' },
        { value: 'pgvector', label: 'pgvector', hint: 'PostgreSQL + pgvector extension' },
      ],
    })
    if (clack.isCancel(selected)) { clack.cancel('Cancelled.'); process.exit(0) }
    storage = selected as RagStorage
  }

  // Embedding model
  let embeddingModel = defaultEmbeddingModel(provider.id)
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

  // Chunk size
  let chunkSize = 1000
  if (opts.chunkSize !== undefined) {
    chunkSize = opts.chunkSize
  } else if (!opts.yes) {
    const input = await clack.text({
      message: 'Chunk size (characters)?',
      initialValue: '1000',
      placeholder: 'larger = more context per chunk; smaller = more precise retrieval',
      validate(value) {
        const n = parseInt(value ?? '')
        if (isNaN(n) || n < 100) return 'Must be at least 100'
        return undefined
      },
    })
    if (clack.isCancel(input)) { clack.cancel('Cancelled.'); process.exit(0) }
    chunkSize = parseInt(String(input)) || 1000
  }

  // Stream response?
  let stream = true
  if (opts.stream !== undefined) {
    stream = opts.stream
  } else if (!opts.yes) {
    const wantsStream = await clack.confirm({
      message: 'Stream the query response?',
      initialValue: true,
    })
    if (clack.isCancel(wantsStream)) { clack.cancel('Cancelled.'); process.exit(0) }
    stream = wantsStream === true
  }

  // Output paths
  const embedRouteResult = await promptPath('Embed route output path', `${src}app/api/rag/embed/route.ts`, targetDir,
    { ...(opts.embedRoute && { prefill: opts.embedRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) })
  const queryRouteResult = await promptPath('Query route output path', `${src}app/api/rag/query/route.ts`, targetDir,
    { ...(opts.queryRoute && { prefill: opts.queryRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) })
  const storeResult = await promptPath('Store file output path', `${src}lib/rag/store.ts`, targetDir,
    { ...(opts.storePath && { prefill: opts.storePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) })
  const memoryStoreResult = await promptPath('Memory store output path', `${src}lib/rag/memory-store.ts`, targetDir,
    { ...(opts.memoryStorePath && { prefill: opts.memoryStorePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) })
  const chunkerResult = await promptPath('Chunker utility output path', `${src}lib/rag/chunker.ts`, targetDir,
    { ...(opts.chunkerPath && { prefill: opts.chunkerPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) })
  const hookResult = await promptPath('Hook output path', `${src}hooks/use-rag-query.ts`, targetDir,
    { ...(opts.hookPath && { prefill: opts.hookPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) })

  const paths: RagPatternConfig['paths'] = {
    embedRoute: embedRouteResult.value,
    queryRoute: queryRouteResult.value,
    store: storeResult.value,
    memoryStore: memoryStoreResult.value,
    chunker: chunkerResult.value,
    hook: hookResult.value,
  }
  const pathOverwrites: RagPatternConfig['pathOverwrites'] = {
    ...(embedRouteResult.overwrite && { embedRoute: true }),
    ...(queryRouteResult.overwrite && { queryRoute: true }),
    ...(storeResult.overwrite && { store: true }),
    ...(memoryStoreResult.overwrite && { memoryStore: true }),
    ...(chunkerResult.overwrite && { chunker: true }),
    ...(hookResult.overwrite && { hook: true }),
  }

  if (storage === 'pgvector') {
    const pgvectorStoreResult = await promptPath('pgvector store output path', `${src}lib/rag/pgvector-store.ts`, targetDir,
      { ...(opts.pgvectorStorePath && { prefill: opts.pgvectorStorePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) })
    const schemaSqlResult = await promptPath('Schema SQL output path', `${src}lib/rag/schema.sql`, targetDir,
      { ...(opts.schemaSqlPath && { prefill: opts.schemaSqlPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) })
    paths.pgvectorStore = pgvectorStoreResult.value
    paths.schemaSql = schemaSqlResult.value
    if (pgvectorStoreResult.overwrite) pathOverwrites.pgvectorStore = true
    if (schemaSqlResult.overwrite) pathOverwrites.schemaSql = true
  }

  if (storage === 'sqlite') {
    const sqliteStoreResult = await promptPath('SQLite store output path', `${src}lib/rag/sqlite-store.ts`, targetDir,
      { ...(opts.sqliteStorePath && { prefill: opts.sqliteStorePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) })
    paths.sqliteStore = sqliteStoreResult.value
    if (sqliteStoreResult.overwrite) pathOverwrites.sqliteStore = true
  }

  // Auth
  let auth = false
  if (opts.auth !== undefined) {
    auth = opts.auth
  } else if (!opts.yes) {
    const wantsAuth = await clack.confirm({ message: 'Add NextAuth v5 authentication?', initialValue: false })
    if (clack.isCancel(wantsAuth)) { clack.cancel('Cancelled.'); process.exit(0) }
    auth = wantsAuth === true
  }

  return {
    storage,
    embeddingModel,
    chunkSize,
    stream,
    auth,
    provider,
    pathAlias,
    targetDir,
    paths,
    pathOverwrites,
  }
}
