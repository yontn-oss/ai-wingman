import { promptAgentConfig } from './prompt-config.js'
import { executeAgentPattern } from './execute.js'
import type { AgentConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: AgentConfig): string[] {
  const pkgs = [config.provider.package, 'ai', 'zod']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: AgentConfig): PlanEntry[] {
  const entries: PlanEntry[] = [
    { kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.toolsFile, ...(config.pathOverwrites.toolsFile && { overwrite: true }) },
    { kind: 'create', path: config.paths.storage, ...(config.pathOverwrites.storage && { overwrite: true }) },
  ]
  if (config.includePage && config.paths.page) {
    entries.push({ kind: 'create', path: config.paths.page, ...(config.pathOverwrites.page && { overwrite: true }) })
  }
  return entries
}

export const agentPattern: Pattern = {
  id: 'agent',
  description: 'Autonomous agent — tools + persistent memory, runs multi-step loops to complete tasks',
  cliFlags: ['page', 'apiRoute', 'storagePath', 'pagePath'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptAgentConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as AgentConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as AgentConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as AgentConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeAgentPattern(config as AgentConfig, shared)
  },
}
