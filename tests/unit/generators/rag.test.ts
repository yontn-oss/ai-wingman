import { describe, it, expect } from 'vitest'
import { generateRagEmbedRoute } from '../../../src/generators/rag-embed-route.js'
import { generateRagQueryRoute } from '../../../src/generators/rag-query-route.js'
import { generateRagStore } from '../../../src/generators/rag-store.js'
import { generateRagMemoryStore } from '../../../src/generators/rag-memory-store.js'
import { generateRagPgvectorStore } from '../../../src/generators/rag-pgvector-store.js'
import { generateRagSchemaSql } from '../../../src/generators/rag-schema-sql.js'
import { generateRagHook } from '../../../src/generators/rag-hook.js'
import type { RagPatternConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: RagPatternConfig = {
  storage: 'memory',
  embeddingModel: 'text-embedding-3-small',
  chunkSize: 1000,
  stream: false,
  auth: false,
  provider: providers[0]!, // anthropic
  pathAlias: '@/',
  targetDir: '/tmp/test',
  paths: {
    embedRoute: 'app/api/rag/embed/route.ts',
    queryRoute: 'app/api/rag/query/route.ts',
    store: 'lib/rag/store.ts',
    memoryStore: 'lib/rag/memory-store.ts',
    hook: 'hooks/use-rag-query.ts',
  },
  pathOverwrites: {},
}

const pgvectorConfig: RagPatternConfig = {
  ...baseConfig,
  storage: 'pgvector',
  paths: {
    ...baseConfig.paths,
    pgvectorStore: 'lib/rag/pgvector-store.ts',
    schemaSql: 'lib/rag/schema.sql',
  },
}

describe('generateRagEmbedRoute', () => {
  it('imports embed from ai', () => {
    expect(generateRagEmbedRoute(baseConfig)).toContain("import { embed } from 'ai'")
  })

  it('calls store.upsert with crypto.randomUUID() id', () => {
    const output = generateRagEmbedRoute(baseConfig)
    expect(output).toContain('crypto.randomUUID()')
    expect(output).toContain('store.upsert(')
  })

  it('returns { ok: true }', () => {
    expect(generateRagEmbedRoute(baseConfig)).toContain('{ ok: true }')
  })

  it('includes auth guard when auth enabled', () => {
    const output = generateRagEmbedRoute({ ...baseConfig, auth: true })
    expect(output).toContain('Unauthorized')
    expect(output).toMatchSnapshot()
  })

  it('snapshot — no auth', () => {
    expect(generateRagEmbedRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateRagQueryRoute', () => {
  it('uses generateText when stream is false', () => {
    const output = generateRagQueryRoute(baseConfig)
    expect(output).toContain('generateText')
    expect(output).not.toContain('streamText')
    expect(output).toContain('Response.json({ text:')
  })

  it('uses streamText and toTextStreamResponse when stream is true', () => {
    const output = generateRagQueryRoute({ ...baseConfig, stream: true })
    expect(output).toContain('streamText')
    expect(output).not.toContain('generateText')
    expect(output).toContain('toTextStreamResponse()')
  })

  it('embeds the query and calls store.query', () => {
    const output = generateRagQueryRoute(baseConfig)
    expect(output).toContain('store.query(')
    expect(output).toContain('embed(')
  })

  it('builds a system prompt from retrieved chunks', () => {
    const output = generateRagQueryRoute(baseConfig)
    expect(output).toContain('context')
    expect(output).toContain('system')
  })

  it('snapshot — non-streaming', () => {
    expect(generateRagQueryRoute(baseConfig)).toMatchSnapshot()
  })

  it('snapshot — streaming', () => {
    expect(generateRagQueryRoute({ ...baseConfig, stream: true })).toMatchSnapshot()
  })

  it('snapshot — auth', () => {
    expect(generateRagQueryRoute({ ...baseConfig, auth: true })).toMatchSnapshot()
  })
})

describe('generateRagStore', () => {
  it('exports RagChunk and RagStore interfaces', () => {
    const output = generateRagStore(baseConfig)
    expect(output).toContain('export interface RagChunk')
    expect(output).toContain('export interface RagStore')
  })

  it('exports getRagStore factory', () => {
    expect(generateRagStore(baseConfig)).toContain('export function getRagStore()')
  })

  it('memory variant does not reference PgvectorRagStore', () => {
    expect(generateRagStore(baseConfig)).not.toContain('PgvectorRagStore')
  })

  it('pgvector variant imports both adapters', () => {
    const output = generateRagStore(pgvectorConfig)
    expect(output).toContain('MemoryRagStore')
    expect(output).toContain('PgvectorRagStore')
    expect(output).toContain("RAG_STORAGE")
  })

  it('snapshot — memory', () => {
    expect(generateRagStore(baseConfig)).toMatchSnapshot()
  })

  it('snapshot — pgvector', () => {
    expect(generateRagStore(pgvectorConfig)).toMatchSnapshot()
  })
})

describe('generateRagMemoryStore', () => {
  it('imports cosineSimilarity from ai', () => {
    expect(generateRagMemoryStore(baseConfig)).toContain("import { cosineSimilarity } from 'ai'")
  })

  it('implements RagStore interface with upsert and query', () => {
    const output = generateRagMemoryStore(baseConfig)
    expect(output).toContain('implements RagStore')
    expect(output).toContain('async upsert(')
    expect(output).toContain('async query(')
  })

  it('upsert is idempotent on id', () => {
    expect(generateRagMemoryStore(baseConfig)).toContain('idx >= 0')
  })

  it('sorts by cosine similarity descending', () => {
    const output = generateRagMemoryStore(baseConfig)
    expect(output).toContain('cosineSimilarity')
    expect(output).toContain('b.score - a.score')
  })

  it('snapshot', () => {
    expect(generateRagMemoryStore(baseConfig)).toMatchSnapshot()
  })
})

describe('generateRagPgvectorStore', () => {
  it('uses the <=> cosine distance operator', () => {
    expect(generateRagPgvectorStore(pgvectorConfig)).toContain('<=>')
  })

  it('uses INSERT ... ON CONFLICT DO UPDATE for upsert', () => {
    const output = generateRagPgvectorStore(pgvectorConfig)
    expect(output).toContain('ON CONFLICT')
    expect(output).toContain('DO UPDATE')
  })

  it('imports postgres', () => {
    expect(generateRagPgvectorStore(pgvectorConfig)).toContain("import postgres from 'postgres'")
  })

  it('reads POSTGRES_URL from env', () => {
    expect(generateRagPgvectorStore(pgvectorConfig)).toContain('POSTGRES_URL')
  })

  it('snapshot', () => {
    expect(generateRagPgvectorStore(pgvectorConfig)).toMatchSnapshot()
  })
})

describe('generateRagSchemaSql', () => {
  it('enables the vector extension', () => {
    expect(generateRagSchemaSql(baseConfig)).toContain('CREATE EXTENSION IF NOT EXISTS vector')
  })

  it('creates the rag_chunks table', () => {
    expect(generateRagSchemaSql(baseConfig)).toContain('CREATE TABLE IF NOT EXISTS rag_chunks')
  })

  it('uses ivfflat index for cosine ops', () => {
    const output = generateRagSchemaSql(baseConfig)
    expect(output).toContain('ivfflat')
    expect(output).toContain('vector_cosine_ops')
  })

  it('is config-invariant', () => {
    expect(generateRagSchemaSql(baseConfig)).toEqual(generateRagSchemaSql(pgvectorConfig))
  })

  it('snapshot', () => {
    expect(generateRagSchemaSql(baseConfig)).toMatchSnapshot()
  })
})

describe('generateRagHook', () => {
  it('non-streaming hook uses fetch and useState', () => {
    const output = generateRagHook(baseConfig)
    expect(output).toContain("'use client'")
    expect(output).toContain('useState')
    expect(output).toContain("fetch(")
    expect(output).toContain('useRagQuery')
  })

  it('non-streaming hook does not use ReadableStream', () => {
    expect(generateRagHook(baseConfig)).not.toContain('ReadableStream')
  })

  it('streaming hook includes ReadableStream reader', () => {
    const output = generateRagHook({ ...baseConfig, stream: true })
    expect(output).toContain('ReadableStream')
    expect(output).toContain('TextDecoderStream')
    expect(output).toContain('useRef')
    expect(output).toContain('stop()')
  })

  it('sends { query, topK } in request body', () => {
    const output = generateRagHook(baseConfig)
    expect(output).toContain('query')
    expect(output).toContain('topK')
  })

  it('derives api path from queryRoute', () => {
    const output = generateRagHook(baseConfig)
    expect(output).toContain('/api/rag/query')
  })

  it('snapshot — non-streaming', () => {
    expect(generateRagHook(baseConfig)).toMatchSnapshot()
  })

  it('snapshot — streaming', () => {
    expect(generateRagHook({ ...baseConfig, stream: true })).toMatchSnapshot()
  })
})

import { generateRagSqliteStore } from '../../../src/generators/rag-sqlite-store.js'

const sqliteConfig: RagPatternConfig = {
  ...baseConfig,
  storage: 'sqlite',
  paths: {
    ...baseConfig.paths,
    sqliteStore: 'lib/rag/sqlite-store.ts',
  },
}

describe('generateRagSqliteStore', () => {
  it('uses better-sqlite3 and sqlite-vec', () => {
    const output = generateRagSqliteStore()
    expect(output).toContain("import Database from 'better-sqlite3'")
    expect(output).toContain("import * as sqliteVec from 'sqlite-vec'")
  })

  it('implements RagStore interface', () => {
    const output = generateRagSqliteStore()
    expect(output).toContain('SqliteRagStore implements RagStore')
    expect(output).toContain('async upsert(')
    expect(output).toContain('async query(')
  })

  it('stores embeddings as Float32Array blobs', () => {
    const output = generateRagSqliteStore()
    expect(output).toContain('Float32Array')
    expect(output).toContain('Buffer.from')
  })

  it('snapshot', () => {
    expect(generateRagSqliteStore()).toMatchSnapshot()
  })
})

describe('generateRagStore — sqlite wiring', () => {
  it('imports SqliteRagStore and switches on RAG_STORAGE=sqlite', () => {
    const output = generateRagStore(sqliteConfig)
    expect(output).toContain('SqliteRagStore')
    expect(output).toContain("backend === 'sqlite'")
    expect(output).toContain('MemoryRagStore')
  })

  it('snapshot — sqlite', () => {
    expect(generateRagStore(sqliteConfig)).toMatchSnapshot()
  })
})

import { generateRagChunker } from '../../../src/generators/rag-chunker.js'

const withChunker: RagPatternConfig = {
  ...baseConfig,
  paths: { ...baseConfig.paths, chunker: 'lib/rag/chunker.ts' },
}

describe('generateRagChunker', () => {
  it('exports chunkText function', () => {
    const output = generateRagChunker(baseConfig)
    expect(output).toContain('export function chunkText(')
  })

  it('uses the configured chunkSize as default', () => {
    const output = generateRagChunker(baseConfig)
    expect(output).toContain('chunkSize ?? 1000')
  })

  it('implements sentence boundary detection', () => {
    const output = generateRagChunker(baseConfig)
    expect(output).toContain('SENTENCE_TERMINATORS')
    expect(output).toContain('sentenceBoundary')
  })

  it('exports ChunkOptions interface', () => {
    const output = generateRagChunker(baseConfig)
    expect(output).toContain('interface ChunkOptions')
    expect(output).toContain('chunkSize?:')
    expect(output).toContain('overlap?:')
  })

  it('snapshot', () => {
    expect(generateRagChunker(baseConfig)).toMatchSnapshot()
  })
})

describe('generateRagEmbedRoute — with chunker', () => {
  it('imports chunkText from the chunker file', () => {
    const output = generateRagEmbedRoute(withChunker)
    expect(output).toContain("import { chunkText } from")
    expect(output).toContain('chunker')
  })

  it('iterates over chunks in a for loop', () => {
    const output = generateRagEmbedRoute(withChunker)
    expect(output).toContain('const chunks = chunkText(text)')
    expect(output).toContain('for (const chunk of chunks)')
  })

  it('returns chunk count in response', () => {
    const output = generateRagEmbedRoute(withChunker)
    expect(output).toContain('chunks: chunks.length')
  })
})
