import { promptToolsConfig } from './prompt-config.js'
import { executeToolsPattern } from './execute.js'
import type { Pattern, PlanEntry, SharedConfig, ToolsConfig } from '../../types.js'

function getPackages(config: ToolsConfig): string[] {
  const pkgs = [config.provider.package, 'ai', 'zod']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: ToolsConfig): PlanEntry[] {
  return [
    { kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.toolsFile, ...(config.pathOverwrites.toolsFile && { overwrite: true }) },
  ]
}

export const toolsPattern: Pattern = {
  id: 'tools',
  description: 'Tool calling — give the model typed functions to call (search, fetch, side-effects)',
  cliFlags: ['apiRoute'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptToolsConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as ToolsConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as ToolsConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as ToolsConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeToolsPattern(config as ToolsConfig, shared)
  },
}
