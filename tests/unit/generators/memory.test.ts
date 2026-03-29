import { describe, it, expect } from 'vitest'
import { generateMemorySaveRoute } from '../../../src/generators/memory-save-route.js'
import { generateMemoryRetrieveRoute } from '../../../src/generators/memory-retrieve-route.js'
import { generateMemoryStore } from '../../../src/generators/memory-store.js'
import { generateMemoryInject } from '../../../src/generators/memory-inject.js'
import type { MemoryConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: MemoryConfig = {
  embeddingModel: 'text-embedding-3-small',
  auth: false,
  paths: {
    saveRoute: 'app/api/memory/save/route.ts',
    retrieveRoute: 'app/api/memory/retrieve/route.ts',
    store: 'lib/memory/store.ts',
    inject: 'lib/memory/inject.ts',
  },
  pathOverwrites: {},
  provider: providers[1]!, // openai
  pathAlias: '@/',
  targetDir: '/tmp/test',
}

describe('generateMemorySaveRoute', () => {
  it('imports embed and generateId from ai', () => {
    const output = generateMemorySaveRoute(baseConfig)
    expect(output).toContain("import { embed, generateId } from 'ai'")
  })

  it('imports the provider package', () => {
    const output = generateMemorySaveRoute(baseConfig)
    expect(output).toContain("import { openai } from '@ai-sdk/openai'")
  })

  it('imports getMemoryStore from the store file', () => {
    const output = generateMemorySaveRoute(baseConfig)
    expect(output).toContain("import { getMemoryStore } from '@/lib/memory/store'")
  })

  it('embeds the fact using the configured embedding model', () => {
    const output = generateMemorySaveRoute(baseConfig)
    expect(output).toContain("embedding('text-embedding-3-small')")
    expect(output).toContain('value: fact,')
  })

  it('calls store.save with all required fields', () => {
    const output = generateMemorySaveRoute(baseConfig)
    expect(output).toContain('getMemoryStore().save(')
    expect(output).toContain('generateId()')
    expect(output).toContain('userId,')
    expect(output).toContain('fact,')
    expect(output).toContain('embedding,')
    expect(output).toContain('createdAt: new Date()')
  })

  it('validates userId and fact, returns 400 if missing', () => {
    const output = generateMemorySaveRoute(baseConfig)
    expect(output).toContain('status: 400')
    expect(output).toContain('userId and fact are required')
  })

  it('returns { ok: true } on success', () => {
    const output = generateMemorySaveRoute(baseConfig)
    expect(output).toContain('ok: true')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateMemorySaveRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateMemorySaveRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('snapshot', () => {
    expect(generateMemorySaveRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateMemoryRetrieveRoute', () => {
  it('imports embed from ai', () => {
    const output = generateMemoryRetrieveRoute(baseConfig)
    expect(output).toContain("import { embed } from 'ai'")
  })

  it('imports getMemoryStore from the store file', () => {
    const output = generateMemoryRetrieveRoute(baseConfig)
    expect(output).toContain("import { getMemoryStore } from '@/lib/memory/store'")
  })

  it('embeds the query using the configured embedding model', () => {
    const output = generateMemoryRetrieveRoute(baseConfig)
    expect(output).toContain("embedding('text-embedding-3-small')")
    expect(output).toContain('value: query,')
  })

  it('calls store.retrieve with userId, embedding, and topK', () => {
    const output = generateMemoryRetrieveRoute(baseConfig)
    expect(output).toContain('getMemoryStore().retrieve(userId, { embedding, topK })')
  })

  it('defaults topK to 5', () => {
    const output = generateMemoryRetrieveRoute(baseConfig)
    expect(output).toContain('topK = 5')
  })

  it('validates userId and query, returns 400 if missing', () => {
    const output = generateMemoryRetrieveRoute(baseConfig)
    expect(output).toContain('status: 400')
    expect(output).toContain('userId and query are required')
  })

  it('returns { memories }', () => {
    const output = generateMemoryRetrieveRoute(baseConfig)
    expect(output).toContain('{ memories }')
  })

  it('snapshot', () => {
    expect(generateMemoryRetrieveRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateMemoryStore', () => {
  it('exports MemoryStore interface with save, retrieve, and clear', () => {
    const output = generateMemoryStore()
    expect(output).toContain('export interface MemoryStore')
    expect(output).toContain('save(')
    expect(output).toContain('retrieve(')
    expect(output).toContain('clear(')
  })

  it('exports MemoryEntry interface', () => {
    const output = generateMemoryStore()
    expect(output).toContain('export interface MemoryEntry')
    expect(output).toContain('userId: string')
    expect(output).toContain('fact: string')
    expect(output).toContain('embedding: number[]')
  })

  it('exports InMemoryMemoryStore class', () => {
    const output = generateMemoryStore()
    expect(output).toContain('export class InMemoryMemoryStore')
  })

  it('exports getMemoryStore singleton', () => {
    const output = generateMemoryStore()
    expect(output).toContain('export function getMemoryStore()')
  })

  it('imports cosineSimilarity from ai', () => {
    const output = generateMemoryStore()
    expect(output).toContain("import { cosineSimilarity } from 'ai'")
  })

  it('filters by userId in retrieve', () => {
    const output = generateMemoryStore()
    expect(output).toContain('.filter((e) => e.userId === userId)')
  })

  it('snapshot', () => {
    expect(generateMemoryStore()).toMatchSnapshot()
  })
})

describe('generateMemoryInject', () => {
  it('exports buildMemoryContext function', () => {
    const output = generateMemoryInject(baseConfig)
    expect(output).toContain('export async function buildMemoryContext(')
  })

  it('imports embed and the provider', () => {
    const output = generateMemoryInject(baseConfig)
    expect(output).toContain("import { embed } from 'ai'")
    expect(output).toContain("import { openai } from '@ai-sdk/openai'")
  })

  it('imports getMemoryStore from the store file', () => {
    const output = generateMemoryInject(baseConfig)
    expect(output).toContain("import { getMemoryStore } from '@/lib/memory/store'")
  })

  it('returns empty string when no memories found', () => {
    const output = generateMemoryInject(baseConfig)
    expect(output).toContain("memories.length === 0")
    expect(output).toContain("return ''")
  })

  it('formats memories as a bulleted list under a header', () => {
    const output = generateMemoryInject(baseConfig)
    expect(output).toContain('Relevant memories about this user:')
    expect(output).toContain('m.fact')
  })

  it('defaults topK to 5', () => {
    const output = generateMemoryInject(baseConfig)
    expect(output).toContain('topK = 5')
  })

  it('includes usage comment showing how to inject into system prompt', () => {
    const output = generateMemoryInject(baseConfig)
    expect(output).toContain('buildMemoryContext')
    expect(output).toContain('system:')
  })

  it('snapshot', () => {
    expect(generateMemoryInject(baseConfig)).toMatchSnapshot()
  })
})
