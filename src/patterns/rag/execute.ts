import * as clack from '@clack/prompts'
import path from 'node:path'
import { generateRagEmbedRoute } from '../../generators/rag-embed-route.js'
import { generateRagQueryRoute } from '../../generators/rag-query-route.js'
import { generateRagStore } from '../../generators/rag-store.js'
import { generateRagMemoryStore } from '../../generators/rag-memory-store.js'
import { generateRagPgvectorStore } from '../../generators/rag-pgvector-store.js'
import { generateRagSchemaSql } from '../../generators/rag-schema-sql.js'
import { generateRagSqliteStore } from '../../generators/rag-sqlite-store.js'
import { generateRagChunker } from '../../generators/rag-chunker.js'
import { generateRagHook } from '../../generators/rag-hook.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { writeFile } from '../../utils/write-file.js'
import type { RagPatternConfig, SharedConfig } from '../../types.js'

export async function executeRagPattern(
  config: RagPatternConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: RagPatternConfig = { ...config, pathAlias }

  const write = (relPath: string) => (content: string) => {
    writeFile(path.join(config.targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }

  write(freshConfig.paths.embedRoute)(generateRagEmbedRoute(freshConfig))
  write(freshConfig.paths.queryRoute)(generateRagQueryRoute(freshConfig))
  write(freshConfig.paths.store)(generateRagStore(freshConfig))
  write(freshConfig.paths.memoryStore)(generateRagMemoryStore(freshConfig))
  write(freshConfig.paths.hook)(generateRagHook(freshConfig))

  if (freshConfig.storage === 'pgvector') {
    if (freshConfig.paths.pgvectorStore) {
      write(freshConfig.paths.pgvectorStore)(generateRagPgvectorStore(freshConfig))
    }
    if (freshConfig.paths.schemaSql) {
      write(freshConfig.paths.schemaSql)(generateRagSchemaSql(freshConfig))
    }
  }

  if (freshConfig.storage === 'sqlite' && freshConfig.paths.sqliteStore) {
    write(freshConfig.paths.sqliteStore)(generateRagSqliteStore())
  }

  if (freshConfig.paths.chunker) {
    write(freshConfig.paths.chunker)(generateRagChunker(freshConfig))
  }
}
