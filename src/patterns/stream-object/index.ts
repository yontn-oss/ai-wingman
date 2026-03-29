import { promptStreamObjectConfig } from './prompt-config.js'
import { executeStreamObjectPattern } from './execute.js'
import type { Pattern, PlanEntry, SharedConfig, StreamObjectConfig } from '../../types.js'

function getPackages(config: StreamObjectConfig): string[] {
  const pkgs = [config.provider.package, 'ai', 'zod']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: StreamObjectConfig): PlanEntry[] {
  const entries: PlanEntry[] = []

  entries.push({ kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) })

  if (!config.schemaAlreadyExists) {
    entries.push({ kind: 'create', path: config.paths.schema, ...(config.pathOverwrites.schema && { overwrite: true }) })
  }

  if (config.paths.hook) {
    entries.push({ kind: 'create', path: config.paths.hook, ...(config.pathOverwrites.hook && { overwrite: true }) })
  }

  return entries
}

export const streamObjectPattern: Pattern = {
  id: 'stream-object',
  description: 'Streaming structured JSON — partial objects appear as they generate (useObject)',
  cliFlags: ['schemaName', 'schemaPath', 'hookPath', 'hook', 'apiRoute'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptStreamObjectConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as StreamObjectConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as StreamObjectConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as StreamObjectConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeStreamObjectPattern(config as StreamObjectConfig, shared)
  },
}
