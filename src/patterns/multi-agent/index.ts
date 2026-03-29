import { promptMultiAgentConfig } from './prompt-config.js'
import { executeMultiAgentPattern } from './execute.js'
import type { MultiAgentConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: MultiAgentConfig): string[] {
  const pkgs = [config.provider.package, 'ai', 'zod']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: MultiAgentConfig): PlanEntry[] {
  return [
    { kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.specialists, ...(config.pathOverwrites.specialists && { overwrite: true }) },
    { kind: 'create', path: config.paths.handoffTools, ...(config.pathOverwrites.handoffTools && { overwrite: true }) },
    { kind: 'create', path: config.paths.types, ...(config.pathOverwrites.types && { overwrite: true }) },
  ]
}

export const multiAgentPattern: Pattern = {
  id: 'multi-agent',
  description: 'Orchestrator + specialist agents — handoff tools delegate sub-tasks, orchestrator synthesizes results',
  cliFlags: ['apiRoute'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptMultiAgentConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as MultiAgentConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as MultiAgentConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as MultiAgentConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeMultiAgentPattern(config as MultiAgentConfig, shared)
  },
}
