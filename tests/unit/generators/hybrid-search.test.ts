import { describe, it, expect } from 'vitest'
import { generateHybridSearchRoute } from '../../../src/generators/hybrid-search-route.js'
import { generateHybridSearchBm25 } from '../../../src/generators/hybrid-search-bm25.js'
import { generateHybridSearchReranker } from '../../../src/generators/hybrid-search-reranker.js'
import { generateHybridSearchStore } from '../../../src/generators/hybrid-search-store.js'
import type { HybridSearchConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: HybridSearchConfig = {
  embeddingModel: 'text-embedding-3-small',
  auth: false,
  paths: {
    apiRoute: 'app/api/hybrid-search/route.ts',
    bm25: 'lib/rag/bm25.ts',
    reranker: 'lib/rag/reranker.ts',
    hybridStore: 'lib/rag/hybrid-store.ts',
  },
  pathOverwrites: {},
  provider: providers[1]!, // openai
  pathAlias: '@/',
  targetDir: '/tmp/test',
}

describe('generateHybridSearchRoute', () => {
  it('imports embed and generateText from ai', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain("import { embed, generateText } from 'ai'")
  })

  it('imports the provider package', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain("import { openai } from '@ai-sdk/openai'")
  })

  it('imports getHybridStore, scoreBM25, and reciprocalRankFusion', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain("import { getHybridStore } from '@/lib/rag/hybrid-store'")
    expect(output).toContain("import { scoreBM25 } from '@/lib/rag/bm25'")
    expect(output).toContain("import { reciprocalRankFusion } from '@/lib/rag/reranker'")
  })

  it('uses the configured embedding model', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain("embedding('text-embedding-3-small')")
  })

  it('uses the configured model factory for generation', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain(providers[1]!.modelFactory)
  })

  it('runs embedding and getAll in parallel', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain('Promise.all(')
    expect(output).toContain('store.getAll()')
    expect(output).toContain('embed({')
  })

  it('runs vector and BM25 search in parallel', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain('store.query({')
    expect(output).toContain('scoreBM25(')
  })

  it('merges results with reciprocalRankFusion', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain('reciprocalRankFusion(')
    expect(output).toContain('vectorResults.map(')
    expect(output).toContain('bm25Results.map(')
  })

  it('returns sources alongside the text answer', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain('sources: merged')
  })

  it('exports maxDuration', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain('export const maxDuration = 30')
  })

  it('validates input and returns 400 if missing', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain('status: 400')
    expect(output).toContain('query is required')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateHybridSearchRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateHybridSearchRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('snapshot', () => {
    expect(generateHybridSearchRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateHybridSearchBm25', () => {
  it('exports scoreBM25 function', () => {
    const output = generateHybridSearchBm25()
    expect(output).toContain('export function scoreBM25(')
  })

  it('exports BM25Document interface', () => {
    const output = generateHybridSearchBm25()
    expect(output).toContain('export interface BM25Document')
  })

  it('has no external dependencies', () => {
    const output = generateHybridSearchBm25()
    expect(output).not.toContain("import {")
    expect(output).not.toContain("from '")
  })

  it('defines K1 and B tuning constants', () => {
    const output = generateHybridSearchBm25()
    expect(output).toContain('K1')
    expect(output).toContain('B')
  })

  it('snapshot', () => {
    expect(generateHybridSearchBm25()).toMatchSnapshot()
  })
})

describe('generateHybridSearchReranker', () => {
  it('exports reciprocalRankFusion function', () => {
    const output = generateHybridSearchReranker()
    expect(output).toContain('export function reciprocalRankFusion(')
  })

  it('exports RankedItem interface', () => {
    const output = generateHybridSearchReranker()
    expect(output).toContain('export interface RankedItem')
  })

  it('has no external dependencies', () => {
    const output = generateHybridSearchReranker()
    expect(output).not.toContain("import {")
    expect(output).not.toContain("from '")
  })

  it('uses RRF_K constant', () => {
    const output = generateHybridSearchReranker()
    expect(output).toContain('RRF_K')
  })

  it('snapshot', () => {
    expect(generateHybridSearchReranker()).toMatchSnapshot()
  })
})

describe('generateHybridSearchStore', () => {
  it('exports getHybridStore function', () => {
    const output = generateHybridSearchStore()
    expect(output).toContain('export function getHybridStore()')
  })

  it('exports HybridStore interface with getAll', () => {
    const output = generateHybridSearchStore()
    expect(output).toContain('export interface HybridStore')
    expect(output).toContain('getAll()')
  })

  it('exports MemoryHybridStore class', () => {
    const output = generateHybridSearchStore()
    expect(output).toContain('export class MemoryHybridStore')
  })

  it('implements upsert, query, and getAll', () => {
    const output = generateHybridSearchStore()
    expect(output).toContain('async upsert(')
    expect(output).toContain('async query(')
    expect(output).toContain('async getAll(')
  })

  it('imports cosineSimilarity from ai', () => {
    const output = generateHybridSearchStore()
    expect(output).toContain("import { cosineSimilarity } from 'ai'")
  })

  it('snapshot', () => {
    expect(generateHybridSearchStore()).toMatchSnapshot()
  })
})
