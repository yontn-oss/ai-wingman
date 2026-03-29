import { promptHybridSearchConfig } from './prompt-config.js'
import { executeHybridSearchPattern } from './execute.js'
import type { HybridSearchConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: HybridSearchConfig): string[] {
  const pkgs = [config.provider.package, 'ai']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: HybridSearchConfig): PlanEntry[] {
  return [
    { kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.bm25, ...(config.pathOverwrites.bm25 && { overwrite: true }) },
    { kind: 'create', path: config.paths.reranker, ...(config.pathOverwrites.reranker && { overwrite: true }) },
    { kind: 'create', path: config.paths.hybridStore, ...(config.pathOverwrites.hybridStore && { overwrite: true }) },
  ]
}

export const hybridSearchPattern: Pattern = {
  id: 'hybrid-search',
  description: 'Vector + BM25 keyword search in parallel, merged with Reciprocal Rank Fusion — drop-in RAG upgrade',
  cliFlags: ['apiRoute', 'embeddingModel'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptHybridSearchConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as HybridSearchConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as HybridSearchConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as HybridSearchConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeHybridSearchPattern(config as HybridSearchConfig, shared)
  },
}
