import { promptMultimodalConfig } from './prompt-config.js'
import { executeMultimodalPattern } from './execute.js'
import type { MultimodalConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: MultimodalConfig): string[] {
  const pkgs = [config.provider.package, 'ai']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: MultimodalConfig): PlanEntry[] {
  const entries: PlanEntry[] = [
    { kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) },
  ]
  if (config.includePage && config.paths.page) {
    entries.push({ kind: 'create', path: config.paths.page, ...(config.pathOverwrites.page && { overwrite: true }) })
  }
  return entries
}

export const multimodalPattern: Pattern = {
  id: 'multimodal',
  description: 'Vision input — accept images alongside text for multimodal chat',
  cliFlags: ['page', 'apiRoute', 'pagePath'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptMultimodalConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as MultimodalConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as MultimodalConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as MultimodalConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeMultimodalPattern(config as MultimodalConfig, shared)
  },
}
