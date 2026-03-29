import { promptBackgroundAgentConfig } from './prompt-config.js'
import { executeBackgroundAgentPattern } from './execute.js'
import type { BackgroundAgentConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: BackgroundAgentConfig): string[] {
  const pkgs = [config.provider.package, 'ai']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: BackgroundAgentConfig): PlanEntry[] {
  return [
    { kind: 'create', path: config.paths.enqueueRoute, ...(config.pathOverwrites.enqueueRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.statusRoute, ...(config.pathOverwrites.statusRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.worker, ...(config.pathOverwrites.worker && { overwrite: true }) },
    { kind: 'create', path: config.paths.jobStore, ...(config.pathOverwrites.jobStore && { overwrite: true }) },
  ]
}

export const backgroundAgentPattern: Pattern = {
  id: 'background-agent',
  description: 'Background agent — enqueue a task, worker runs outside the request cycle, poll for status + result',
  cliFlags: ['apiRoute'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptBackgroundAgentConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as BackgroundAgentConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as BackgroundAgentConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as BackgroundAgentConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeBackgroundAgentPattern(config as BackgroundAgentConfig, shared)
  },
}
