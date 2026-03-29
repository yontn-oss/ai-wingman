import { promptMemoryConfig } from './prompt-config.js'
import { executeMemoryPattern } from './execute.js'
import type { MemoryConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: MemoryConfig): string[] {
  const pkgs = [config.provider.package, 'ai']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: MemoryConfig): PlanEntry[] {
  return [
    { kind: 'create', path: config.paths.saveRoute, ...(config.pathOverwrites.saveRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.retrieveRoute, ...(config.pathOverwrites.retrieveRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.store, ...(config.pathOverwrites.store && { overwrite: true }) },
    { kind: 'create', path: config.paths.inject, ...(config.pathOverwrites.inject && { overwrite: true }) },
  ]
}

export const memoryPattern: Pattern = {
  id: 'memory',
  description: 'Per-user long-term memory — embed facts, retrieve by similarity, inject into system prompt',
  cliFlags: ['embeddingModel'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptMemoryConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as MemoryConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as MemoryConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as MemoryConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeMemoryPattern(config as MemoryConfig, shared)
  },
}
