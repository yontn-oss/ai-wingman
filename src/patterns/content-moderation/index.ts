import { promptContentModerationConfig } from './prompt-config.js'
import { executeContentModerationPattern } from './execute.js'
import type { ContentModerationConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: ContentModerationConfig): string[] {
  const pkgs = [config.provider.package, 'ai', 'zod']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: ContentModerationConfig): PlanEntry[] {
  return [
    { kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.policy, ...(config.pathOverwrites.policy && { overwrite: true }) },
  ]
}

export const contentModerationPattern: Pattern = {
  id: 'content-moderation',
  description: 'LLM-based content classifier with editable policy categories — returns { allowed, category, reason }',
  cliFlags: ['apiRoute'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptContentModerationConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as ContentModerationConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as ContentModerationConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as ContentModerationConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeContentModerationPattern(config as ContentModerationConfig, shared)
  },
}
