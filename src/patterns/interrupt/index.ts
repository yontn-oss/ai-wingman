import { promptInterruptConfig } from './prompt-config.js'
import { executeInterruptPattern } from './execute.js'
import type { InterruptPatternConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: InterruptPatternConfig): string[] {
  return [config.provider.package, '@ai-sdk/react', 'zod']
}

function getPlanEntries(config: InterruptPatternConfig): PlanEntry[] {
  const entries: PlanEntry[] = []
  const { paths, pathOverwrites } = config

  entries.push({ kind: 'create', path: paths.apiRoute, ...(pathOverwrites.apiRoute && { overwrite: true }) })
  entries.push({ kind: 'create', path: paths.tools, ...(pathOverwrites.tools && { overwrite: true }) })
  entries.push({ kind: 'create', path: paths.component, ...(pathOverwrites.component && { overwrite: true }) })

  if (config.includePage && paths.page) {
    entries.push({ kind: 'create', path: paths.page, ...(pathOverwrites.page && { overwrite: true }) })
  }

  return entries
}

export const interruptPattern: Pattern = {
  id: 'interrupt',
  description: 'Human-in-the-loop approval — pause the agent before consequential tool calls',
  cliFlags: ['page', 'apiRoute', 'pagePath'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptInterruptConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as InterruptPatternConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as InterruptPatternConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as InterruptPatternConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeInterruptPattern(config as InterruptPatternConfig, shared)
  },
}
