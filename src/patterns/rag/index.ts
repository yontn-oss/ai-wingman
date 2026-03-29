import { promptRagConfig } from './prompt-config.js'
import { executeRagPattern } from './execute.js'
import type { Pattern, PlanEntry, RagPatternConfig, SharedConfig } from '../../types.js'

function getPackages(config: RagPatternConfig): string[] {
  const pkgs = [config.provider.package, 'ai']
  if (config.storage === 'pgvector') pkgs.push('postgres')
  if (config.storage === 'sqlite') pkgs.push('better-sqlite3', 'sqlite-vec')
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: RagPatternConfig): PlanEntry[] {
  const entries: PlanEntry[] = []
  const { paths, pathOverwrites } = config

  entries.push({ kind: 'create', path: paths.embedRoute, ...(pathOverwrites.embedRoute && { overwrite: true }) })
  entries.push({ kind: 'create', path: paths.queryRoute, ...(pathOverwrites.queryRoute && { overwrite: true }) })
  entries.push({ kind: 'create', path: paths.store, ...(pathOverwrites.store && { overwrite: true }) })
  entries.push({ kind: 'create', path: paths.memoryStore, ...(pathOverwrites.memoryStore && { overwrite: true }) })

  if (paths.pgvectorStore) {
    entries.push({ kind: 'create', path: paths.pgvectorStore, ...(pathOverwrites.pgvectorStore && { overwrite: true }) })
  }
  if (paths.schemaSql) {
    entries.push({ kind: 'create', path: paths.schemaSql, ...(pathOverwrites.schemaSql && { overwrite: true }) })
  }
  if (paths.sqliteStore) {
    entries.push({ kind: 'create', path: paths.sqliteStore, ...(pathOverwrites.sqliteStore && { overwrite: true }) })
  }
  if (paths.chunker) {
    entries.push({ kind: 'create', path: paths.chunker, ...(pathOverwrites.chunker && { overwrite: true }) })
  }

  entries.push({ kind: 'create', path: paths.hook, ...(pathOverwrites.hook && { overwrite: true }) })

  return entries
}

export const ragPattern: Pattern = {
  id: 'rag',
  description: 'Retrieval-augmented generation — embed, store, and query documents with vector search',
  cliFlags: ['storage', 'embeddingModel', 'hookPath'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptRagConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as RagPatternConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as RagPatternConfig)
  },

  getEnvVars(config: unknown): string[] {
    const c = config as RagPatternConfig
    const vars = [c.provider.envVar]
    if (c.storage === 'pgvector') vars.push('POSTGRES_URL')
    if (c.storage === 'sqlite') vars.push('SQLITE_RAG_PATH')
    return vars
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeRagPattern(config as RagPatternConfig, shared)
  },
}
